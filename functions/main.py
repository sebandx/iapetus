import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
import datetime
import json
from google.events.cloud.firestore_v1.types import DocumentEventData
from google.adk.sessions import VertexAiSessionService
import asyncio

# --- Corrected Imports to match the working sample ---
import vertexai
# The 'agent_engines' module is now directly under the 'vertexai' namespace, not 'preview'.
from vertexai import agent_engines

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

    # --- THE FIX ---
    # The 'data' payload is a Protobuf message. We decode it into a structured object.
    firestore_payload = DocumentEventData()
    firestore_payload._pb.ParseFromString(cloud_event.data)

    # Now we can safely access the fields from the decoded payload
    event_title = firestore_payload.value.fields["title"].string_value
    course_id = firestore_payload.value.fields["courseId"].string_value

    if not event_title:
        print("Event created without a title. Exiting function.")
        return

    if not AGENT_ENGINE_ID:
        print("AGENT_ENGINE_ID environment variable not set. Exiting function.")
        return

    print(f"Querying Agent Engine with title: '{event_title}', to agent: '{AGENT_ENGINE_ID}'")

    try:
        # --- Corrected Agent Engine Query based on your working script ---
        session_service = VertexAiSessionService(project=PROJECT_ID,location=LOCATION)
        session = asyncio.run(session_service.create_session(
            app_name=AGENT_ENGINE_ID,
            user_id=user_id,
        ))
        agent = agent_engines.get(AGENT_ENGINE_ID)
        print(f"Querying Agent Engine: '{agent}'")

        db = firestore.client()
        course_name = ""
        course_code = ""
        # --- NEW: Fetch course details if a courseId exists ---
        if course_id:
            print(f"Event is linked to courseId: {course_id}. Fetching course details.")
            course_ref = db.collection("users").document(user_id).collection("courses").document(course_id)
            course_doc = course_ref.get()
            if course_doc.exists:
                course_name = course_doc.to_dict().get("name", "")
                course_code = course_doc.to_dict().get("code", "")
                print(f"Found course name: {course_name}")

        # --- Generate Prerequisite Flashcards ---
        if course_name:
            prereq_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 prerequisite review flashcards. Return as a JSON array of objects with 'question' and 'answer' keys." if course_name else f"Generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
            post_lecture_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 flashcards summarizing the key concepts. Return as a JSON array of objects with 'question' and 'answer' keys."
        else:
            prereq_prompt = f"Generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
            post_lecture_prompt = f"Generate 3-5 flashcards summarizing key concepts for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."

        print(f"Querying for prerequisites with prompt: '{prereq_prompt}'")
        print(f"Querying Agent Engine with prompt: '{post_lecture_prompt}'")

        # Use stream_query, which is the correct method for Agent Engine
        prereq_response_stream = agent.stream_query(message=prereq_prompt, session_id=session.id, user_id=user_id)
        prereq_response_text = "".join(
            event["content"]["parts"][0].get("text", "")
            for event in prereq_response_stream
            if "content" in event and event.get("content", {}).get("parts")
        )

        post_lecture_response_stream = agent.stream_query(message=post_lecture_prompt, session_id=session.id, user_id=user_id)
        post_lecture_response_text = "".join(
            event["content"]["parts"][0].get("text", "")
            for event in post_lecture_response_stream
            if "content" in event and event.get("content", {}).get("parts")
        )
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        event_start_time_str = firestore_payload.value.fields["startTime"].timestamp_value.isoformat()
        event_start_date = datetime.datetime.fromisoformat(event_start_time_str.replace('Z', '+00:00'))
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        if prereq_response_text:
            due_date = event_start_date - datetime.timedelta(days=1)
            
            tasks_collection.add({
                "title": f"Pre lecture review flashcards for: {event_title}",
                "details": prereq_response_text, # This will now be a JSON string
                "status": "PENDING",
                "relatedCalendarEventId": event_id,
                "dueDate": due_date,
                "priority": "HIGH", # Increased priority for review tasks
            })
            print(f"Successfully created a new pre lecture flashcard task for user {user_id}.")
        if post_lecture_response_text:
            post_review_due_date = event_start_date + datetime.timedelta(days=1)
            tasks_collection.add({
                "title": f"Post lecture review flashcards for: {event_title}",
                "details": prereq_response_text, # This will now be a JSON string
                "status": "PENDING",
                "relatedCalendarEventId": event_id,
                "dueDate": post_review_due_date,
                "priority": "HIGH", # Increased priority for review tasks
            })
            print(f"Successfully created a new post lecture flashcard task for user {user_id}.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")

