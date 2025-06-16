import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
import datetime
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
    It queries a deployed Agent Engine and creates two to-do tasks in Firestore.
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

    firestore_payload = DocumentEventData()
    firestore_payload._pb.ParseFromString(cloud_event.data)

    event_title = firestore_payload.value.fields["title"].string_value
    course_id = firestore_payload.value.fields["courseId"].string_value

    if not event_title or not AGENT_ENGINE_ID:
        print("Event created without a title or AGENT_ENGINE_ID is not set. Exiting function.")
        return

    try:
        db = firestore.client()
        course_name, course_code = "", ""
        if course_id:
            print(f"Event linked to courseId: {course_id}. Fetching details.")
            course_ref = db.collection("users").document(user_id).collection("courses").document(course_id)
            course_doc = course_ref.get()
            if course_doc.exists:
                course_data = course_doc.to_dict()
                if course_data:
                    course_name = course_data.get("name", "")
                    course_code = course_data.get("code", "")
                print(f"Found course: {course_name} ({course_code})")

        # --- Generate Prerequisite Flashcards ---
        prereq_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 prerequisite review flashcards. Return as a JSON array of objects with 'question' and 'answer' keys." if course_name else f"Generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
        print(f"Querying for prerequisites with prompt: '{prereq_prompt}'")

        agent = agent_engines.get(AGENT_ENGINE_ID)
        session_service = VertexAiSessionService(project=PROJECT_ID, location=LOCATION)
        session = asyncio.run(session_service.create_session(app_name=AGENT_ENGINE_ID, user_id=user_id))
        
        prereq_response_stream = agent.stream_query(message=prereq_prompt, session_id=session.id, user_id=user_id)
        prereq_response_text = "".join(event["content"]["parts"][0].get("text", "") for event in prereq_response_stream if "content" in event and event.get("content", {}).get("parts"))
        
        if not prereq_response_text:
            print("Agent returned empty response for prerequisites.")
            prereq_response_text = "Could not generate prerequisite material."


        # --- Generate Post-Lecture Flashcards ---
        post_lecture_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 flashcards summarizing the key concepts. Return as a JSON array of objects with 'question' and 'answer' keys." if course_name else f"Generate 3-5 flashcards summarizing key concepts for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
        print(f"Querying for post-lecture review with prompt: '{post_lecture_prompt}'")
        
        # We can reuse the same session for the second query
        post_lecture_response_stream = agent.stream_query(message=post_lecture_prompt, session_id=session.id, user_id=user_id)
        post_lecture_response_text = "".join(event["content"]["parts"][0].get("text", "") for event in post_lecture_response_stream if "content" in event and event.get("content", {}).get("parts"))

        if not post_lecture_response_text:
            print("Agent returned empty response for post-lecture review.")
            post_lecture_response_text = "Could not generate review material."


        # --- Write Both Tasks to Firestore ---
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        
        # The correct method name is .to_datetime(), not .ToDatetime()
        event_start_time = firestore_payload.value.fields["startTime"].timestamp_value.to_datetime()

        # 1. Prerequisite Task (due before)
        prereq_due_date = event_start_time - datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Review prerequisites for: {event_title}", "details": prereq_response_text,
            "status": "PENDING", "relatedCalendarEventId": event_id, "dueDate": prereq_due_date, "priority": "HIGH",
        })
        print("Successfully created prerequisite task.")

        # 2. Post-Lecture Review Task (due after)
        post_review_due_date = event_start_time + datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Review lecture content for: {event_title}", "details": post_lecture_response_text,
            "status": "PENDING", "relatedCalendarEventId": event_id, "dueDate": post_review_due_date, "priority": "MEDIUM",
        })
        print("Successfully created post-lecture review task.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")
