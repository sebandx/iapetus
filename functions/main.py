import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
import datetime
import json

# --- Imports ---
import vertexai
from vertexai.preview import agent_engines
from google.events.cloud.firestore_v1.types import DocumentEventData


# --- Initialization ---
firebase_admin.initialize_app()

PROJECT_ID = os.environ.get("GCLOUD_PROJECT", "lithe-creek-462503-v4")
LOCATION = os.environ.get("LOCATION", "us-central1")
AGENT_ENGINE_ID = os.environ.get("AGENT_ENGINE_ID")

vertexai.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def on_calendar_event_create(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a new calendar event is created.
    It queries a deployed Agent Engine and creates a to-do task in Firestore.
    """
    # ... (existing code to parse user_id, event_id, etc.) ...
    try:
        document_path = cloud_event["document"]
        path_parts = document_path.split('/')
        user_id = path_parts[1]
        event_id = path_parts[3]
    except (IndexError, KeyError):
        return

    firestore_payload = DocumentEventData()
    firestore_payload._pb.ParseFromString(cloud_event.data)
    event_fields = firestore_payload.value.fields
    event_title = event_fields.get("title", {}).string_value
    course_id = event_fields.get("courseId", {}).string_value

    if not event_title or not AGENT_ENGINE_ID:
        return

    try:
        db = firestore.client()
        course_name = ""
        cource_code = ""
        if course_id:
            course_doc = db.collection("users").document(user_id).collection("courses").document(course_id).get()
            if course_doc.exists:
                course_name = course_doc.to_dict().get("name", "")
                cource_code = course_doc.to_dict().get("code", "")
        
        # --- THE FIX ---
        # Update the prompt to specifically request JSON output for flashcards.
        if course_name:
            prompt = f"For the course '{course_name}, {cource_code}', generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return the output as a JSON array where each object has a 'question' key and an 'answer' key."
        else:
            prompt = f"Generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return the output as a JSON array where each object has a 'question' key and an 'answer' key."

        print(f"Querying Agent Engine with prompt: '{prompt}'")
        
        agent = agent_engines.get(AGENT_ENGINE_ID)
        response_stream = agent.stream_query(query=prompt, session_id=event_id, user_id=user_id)

        agent_response_text = "".join(
            event["content"]["parts"][0].get("text", "")
            for event in response_stream
            if "content" in event and event.get("content", {}).get("parts")
        )

        if not agent_response_text:
            print("Agent returned an empty text response.")
            return

        print(f"Received response from Agent Engine: {agent_response_text}")

        # --- Write the JSON string directly to the 'details' field ---
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        due_date = firestore_payload.value.fields["startTime"].timestamp_value.ToDatetime() - datetime.timedelta(days=1)
        
        tasks_collection.add({
            "title": f"Review flashcards for: {event_title}",
            "details": agent_response_text, # This will now be a JSON string
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": due_date,
            "priority": "HIGH", # Increased priority for review tasks
        })

        print(f"Successfully created a new flashcard task for user {user_id}.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")
