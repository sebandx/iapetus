import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
from google.cloud import aiplatform
import datetime

# --- Initialization ---
# Initialize the Firebase Admin app. This is done once when the function instance starts.
# When running on Google Cloud, credentials are automatically discovered.
firebase_admin.initialize_app()

# Get the project and location from environment variables provided by the runtime.
PROJECT_ID = os.environ.get("GCLOUD_PROJECT", "lithe-creek-462503-v4")
LOCATION = os.environ.get("LOCATION", "us-central1")
# Get the RAG Corpus ID from an environment variable you will set during deployment.
RAG_CORPUS = os.environ.get("RAG_CORPUS")

# Initialize the Vertex AI client.
aiplatform.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def on_calendar_event_create(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a new calendar event is created.
    It queries a RAG agent and creates a corresponding to-do task in Firestore.
    """
    print("Function triggered by a new calendar event.")

    # --- 1. Extract Data from the Firestore Event ---
    # The event data is a complex object; we extract the user and event IDs from the path.
    resource_string = cloud_event["subject"]
    parts = resource_string.split('/documents/')[1].split('/')
    user_id = parts[1]
    event_id = parts[3]

    print(f"Processing Event ID: {event_id} for User ID: {user_id}")

    # Extract the title from the event data payload.
    event_data = cloud_event.data.get("value", {}).get("fields", {})
    event_title = event_data.get("title", {}).get("stringValue")

    if not event_title:
        print("Event created without a title. Exiting function.")
        return

    if not RAG_CORPUS:
        print("RAG_CORPUS environment variable not set. Exiting function.")
        return

    print(f"Querying RAG agent: '{event_title}'")

    try:
        # --- 2. Query the RAG Agent ---
        model = aiplatform.gapic.GenerativeModel("gemini-1.5-flash-001")
        
        response = model.generate_content(
            f"Based on the course material, what are the key prerequisite topics I should review for '{event_title}'? Please provide a concise list.",
            tools=[aiplatform.gapic.Tool(
                retrieval=aiplatform.gapic.Retrieval(
                    rag=aiplatform.gapic.Rag(
                        rag_resources=[
                            aiplatform.gapic.RagResource(rag_corpus=RAG_CORPUS)
                        ]
                    )
                )
            )]
        )
        
        rag_response_text = response.candidates[0].content.parts[0].text
        print(f"Received response from RAG agent: {rag_response_text}")

        # --- 3. Write the New To-Do Task to Firestore ---
        db = firestore.client()
        
        # Create a new task document in the user's 'tasks' subcollection.
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        tasks_collection.add({
            "title": f"Review prerequisites for: {event_title}",
            "details": rag_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": datetime.datetime.now(datetime.timezone.utc), # Set due date to now
            "priority": "MEDIUM",
        })

        print(f"Successfully created a new to-do task for user {user_id}.")

    except Exception as e:
        print(f"An error occurred: {e}")

