import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
import datetime

# --- Corrected Imports ---
# Import the necessary classes from the Vertex AI SDK
import vertexai
from vertexai.preview import agent_engines

# --- Initialization ---
firebase_admin.initialize_app()

PROJECT_ID = os.environ.get("GCLOUD_PROJECT", "lithe-creek-462503-v4")
LOCATION = os.environ.get("LOCATION", "us-central1")
# Get the Agent Engine ID from environment variables
AGENT_ENGINE_ID = os.environ.get("AGENT_ENGINE_ID")

vertexai.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def on_calendar_event_create(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a new calendar event is created.
    It queries a deployed Agent Engine and creates a to-do task in Firestore.
    """
    print("Function triggered by a new calendar event.")
    
    try:
        document_path = cloud_event["document"]
        path_parts = document_path.split('/')
        if len(path_parts) >= 4 and path_parts[0] == 'users' and path_parts[2] == 'calendarEvents':
            user_id = path_parts[1]
            event_id = path_parts[3]
        else:
            print(f"Error: Unexpected path structure: {document_path}")
            return
    except (IndexError, KeyError) as e:
        print(f"Error: Could not parse IDs from document path: {cloud_event.get('document', 'Not Found')}. Details: {e}")
        return

    print(f"Processing Event ID: {event_id} for User ID: {user_id}")

    # Use a safe method to get the payload and event title
    firestore_payload = cloud_event.data.get("value", {})
    if not firestore_payload:
        print("Error: Event data is missing 'value' field.")
        return
        
    event_title = firestore_payload.get("fields", {}).get("title", {}).get("stringValue")

    if not event_title:
        print("Event created without a title. Exiting function.")
        return

    if not AGENT_ENGINE_ID:
        print("AGENT_ENGINE_ID environment variable not set. Exiting function.")
        return

    print(f"Querying Agent Engine with title: '{event_title}'")

    try:
        # 1. Get a reference to your deployed agent
        agent = agent_engines.get(AGENT_ENGINE_ID)
        
        # 2. Use stream_query, which is the correct method.
        #    For a stateless function, the session_id can be any unique string.
        response_stream = agent.stream_query(
            query=f"Based on the course material, what are the key prerequisite topics I should review for '{event_title}'? Please provide a concise list.",
            session_id=event_id, # Use event_id for a unique session
            user_id=user_id
        )
        
        # 3. Iterate through the stream to build the full text response
        agent_response_text = ""
        for event in response_stream:
            if event.type == "content" and event.content.parts:
                agent_response_text += event.content.parts[0].text
        
        if not agent_response_text:
            print("Agent returned an empty text response.")
            return

        print(f"Received response from Agent Engine: {agent_response_text}")

        # --- Write the New To-Do Task to Firestore ---
        db = firestore.client()
        
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        tasks_collection.add({
            "title": f"Review prerequisites for: {event_title}",
            "details": agent_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": datetime.datetime.now(datetime.timezone.utc),
            "priority": "MEDIUM",
        })

        print(f"Successfully created a new to-do task for user {user_id}.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")

