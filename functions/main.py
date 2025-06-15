import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
from google.cloud import aiplatform
import datetime

# --- Initialization ---
firebase_admin.initialize_app()

PROJECT_ID = os.environ.get("GCLOUD_PROJECT", "lithe-creek-462503-v4")
LOCATION = os.environ.get("LOCATION", "us-central1")
RAG_CORPUS = os.environ.get("RAG_CORPUS")

aiplatform.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def on_calendar_event_create(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a new calendar event is created.
    It queries a RAG agent and creates a corresponding to-do task in Firestore.
    """
    print("Function triggered by a new calendar event.")

    # --- ADDED FOR DEBUGGING ---
    # Print the entire CloudEvent object to the logs to inspect its structure.
    print(f"Full CloudEvent object: {cloud_event}")

    # The 'subject' attribute contains the full resource path of the triggering document.
    # e.g., 'firestore.googleapis.com/.../documents/users/USER_ID/calendarEvents/EVENT_ID'
    try:
        subject = cloud_event["subject"]
        print(f"Event Subject: {subject}")

        # Split the string after '/documents/' to get the path parts
        path_parts = subject.split('/documents/')[1].split('/')
        
        # Expected structure: ['users', 'USER_ID', 'calendarEvents', 'EVENT_ID']
        if len(path_parts) >= 4 and path_parts[0] == 'users' and path_parts[2] == 'calendarEvents':
            user_id = path_parts[1]
            event_id = path_parts[3]
        else:
            print(f"Error: Unexpected path structure in subject: {subject}")
            return
            
    except (IndexError, KeyError) as e:
        print(f"Error: Could not parse user and event IDs from subject string: {cloud_event.get('subject', 'Not Found')}. Details: {e}")
        return

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

    print(f"Querying RAG agent with title: '{event_title}'")

    try:
        # --- Query the RAG Agent ---
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

        # --- Write the New To-Do Task to Firestore ---
        db = firestore.client()
        
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        tasks_collection.add({
            "title": f"Review prerequisites for: {event_title}",
            "details": rag_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": datetime.datetime.now(datetime.timezone.utc),
            "priority": "MEDIUM",
        })

        print(f"Successfully created a new to-do task for user {user_id}.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")

