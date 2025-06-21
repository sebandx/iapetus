import os
import functions_framework
from cloudevents.http import CloudEvent
import firebase_admin
from firebase_admin import firestore
import datetime

# --- Imports for Vertex AI ---
import vertexai
from vertexai.preview import agent_engines
from google.events.cloud.firestore_v1.types import DocumentEventData

# --- Initialization ---
firebase_admin.initialize_app()

PROJECT_ID = os.environ.get("GCLOUD_PROJECT")
LOCATION = os.environ.get("LOCATION")
AGENT_ENGINE_ID = os.environ.get("AGENT_ENGINE_ID")

vertexai.init(project=PROJECT_ID, location=LOCATION)


@functions_framework.cloud_event
def on_calendar_event_create(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a new calendar event is created.
    It queries a deployed Agent Engine and creates two to-do tasks in Firestore:
    1. A prerequisite review task due the day before the event.
    2. A content review task due the day after the event.
    """
    print("Function triggered by a new calendar event.")
    
    # --- 1. Parse Event Data ---
    try:
        document_path = cloud_event["document"]
        path_parts = document_path.split('/')
        user_id = path_parts[1]
        event_id = path_parts[3]

        firestore_payload = DocumentEventData()
        firestore_payload._pb.ParseFromString(cloud_event.data)
        
        event_fields = firestore_payload.value.fields
        event_title = event_fields.get("title", {}).string_value
        course_id = event_fields.get("courseId", {}).string_value
        
        # The correct method to convert the Firestore timestamp is .to_datetime()
        event_start_time = event_fields["startTime"].timestamp_value.to_datetime()

    except (IndexError, KeyError, AttributeError) as e:
        print(f"Error parsing initial event data: {e}")
        return

    print(f"Processing Event ID: {event_id} for User ID: {user_id}")

    if not event_title or not AGENT_ENGINE_ID:
        print("Missing event title or AGENT_ENGINE_ID environment variable. Exiting.")
        return

    try:
        db = firestore.client()
        agent = agent_engines.get(AGENT_ENGINE_ID)
        tasks_collection = db.collection("users").document(user_id).collection("tasks")
        
        # --- 2. Get Course Context (if available) ---
        course_name, course_code = "", ""
        if course_id:
            course_ref = db.collection("users").document(user_id).collection("courses").document(course_id)
            course_doc = course_ref.get()
            if course_doc.exists:
                course_data = course_doc.to_dict()
                if course_data:
                    course_name = course_data.get("name", "")
                    course_code = course_data.get("code", "")

        # --- 3. Generate Prerequisite Content ---
        prereq_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 prerequisite review flashcards. Return as a JSON array of objects with 'question' and 'answer' keys." if course_name else f"Generate 3-5 prerequisite review flashcards for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
        print(f"Querying for prerequisites with prompt: '{prereq_prompt}'")
        
        prereq_response = agent.query(query=prereq_prompt)
        prereq_response_text = prereq_response.text or "Could not generate prerequisite material."
        
        # --- 4. Generate Post-Lecture Review Content ---
        post_lecture_prompt = f"For the topic '{event_title}' in the course '{course_name}, {course_code}', generate 3-5 flashcards summarizing the key concepts. Return as a JSON array of objects with 'question' and 'answer' keys." if course_name else f"Generate 3-5 flashcards summarizing key concepts for the topic '{event_title}'. Return as a JSON array of objects with 'question' and 'answer' keys."
        print(f"Querying for post-lecture review with prompt: '{post_lecture_prompt}'")

        post_lecture_response = agent.query(query=post_lecture_prompt)
        post_lecture_response_text = post_lecture_response.text or "Could not generate review material."

        # --- 5. Create Both Tasks in Firestore ---
        
        # Prerequisite Task (due the day BEFORE)
        prereq_due_date = event_start_time - datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Review prerequisites for: {event_title}",
            "details": prereq_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": prereq_due_date,
            "priority": "HIGH",
        })
        print("Successfully created prerequisite task.")

        # Post-Lecture Review Task (due the day AFTER)
        post_review_due_date = event_start_time + datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Review lecture content for: {event_title}",
            "details": post_lecture_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": post_review_due_date,
            "priority": "MEDIUM",
        })
        print("Successfully created post-lecture review task.")

    except Exception as e:
        print(f"An error occurred during agent call or Firestore write: {e}")

