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

    # --- Corrected Agent Engine Query based on your working script ---
    session_service = VertexAiSessionService(project=PROJECT_ID,location=LOCATION)
    session = asyncio.run(session_service.create_session(
        app_name=AGENT_ENGINE_ID,
        user_id=user_id,
    ))
    agent = agent_engines.get(AGENT_ENGINE_ID)
    print(f"Querying Agent Engine: '{agent}'")

    db = firestore.client()
    course_name, course_code, generation_type = "", "", "flashcards" # Default to flashcards
    if course_id:
        course_ref = db.collection("users").document(user_id).collection("courses").document(course_id)
        course_doc = course_ref.get()
        if course_doc.exists:
            course_data = course_doc.to_dict()
            if course_data:
                course_name = course_data.get("name", "")
                course_code = course_data.get("code", "")
                generation_type = course_data.get("generationType", "flashcards")

    course_context = f"in the course '{course_name}, {course_code}'" if course_name else ""

    if generation_type == 'quiz':
        prereq_prompt = prereq_prompt = f"""
Your task is to act as a quiz generator. Based ONLY on the provided course material, identify the foundational concepts that a student must understand *before* they can begin learning about the main topic: '{event_title}' {course_context}.

Then, based on those prerequisite topics ONLY, generate between 10 and 20 multiple-choice questions. Do NOT ask questions about '{event_title}' itself.

You MUST return your response as a single, valid JSON array where each object has the following keys:
- "question": A string containing the question about a prerequisite concept.
- "options": An array of four strings representing the multiple-choice options.
- "answer": A string containing the exact text of the correct option.
"""
        post_lecture_prompt = f"""
Your task is to act as a quiz generator. Based ONLY on the provided course material, generate between 10 and 20 multiple-choice questions that summarize and test the most important key concepts *from within* the topic '{event_title}' {course_context}.

You MUST return your response as a single, valid JSON array where each object has the following keys:
- "question": A string containing the question about the main topic.
- "options": An array of four strings representing the multiple-choice options.
- "answer": A string containing the exact text of the correct option.
"""
    else: # Default to flashcards
        prereq_prompt = f"""
Your task is to act as a flashcard generator. Based ONLY on the provided course material, identify the foundational concepts that a student must understand *before* they can begin learning about the main topic: '{event_title}' {course_context}.

Then, based on those prerequisite topics ONLY, generate between 10 and 20 flashcards. Do NOT create flashcards about '{event_title}' itself.

You MUST return your response as a single, valid JSON array where each object has the following keys:
- "question": A string containing the question or term for the flashcard.
- "answer": A string containing the definition or answer.
Do not provide any introductory text, explanation, or ask for clarification.
"""
        post_lecture_prompt = f"""
Your task is to act as a flashcard generator. Based ONLY on the provided course material, generate between 10 and 20 flashcards that summarize and test the most important key concepts *from within* the topic '{event_title}' {course_context}.

You MUST return your response as a single, valid JSON array where each object has the following keys:
- "question": A string containing the question or term for the flashcard.
- "answer": A string containing the definition or answer.
Do not provide any introductory text, explanation, or ask for clarification.
"""

    print(f"Querying for prerequisites with prompt: '{prereq_prompt}'")
    print(f"Querying for post-lecture with prompt: '{post_lecture_prompt}'")

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
            "title": f"Pre lecture review {generation_type} for: {event_title}",
            "details": prereq_response_text, # This will now be a JSON string
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": due_date,
            "priority": "HIGH", # Increased priority for review tasks
        })
        print(f"Successfully created a new pre lecture {generation_type} task for user {user_id}.")
    if post_lecture_response_text:
        post_review_due_date = event_start_date + datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Post lecture review {generation_type} for: {event_title}",
            "details": post_lecture_response_text, # This will now be a JSON string
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": post_review_due_date,
            "priority": "HIGH", # Increased priority for review tasks
        })
        print(f"Successfully created a new post lecture {generation_type} task for user {user_id}.")
