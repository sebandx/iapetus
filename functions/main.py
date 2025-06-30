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
import traceback

import vertexai
from vertexai import agent_engines

# --- Initialization ---
firebase_admin.initialize_app()

PROJECT_ID = os.environ.get("GCLOUD_PROJECT", "lithe-creek-462503-v4")
LOCATION = os.environ.get("LOCATION", "us-central1")
# This is now the fallback agent if a course-specific one is not found.
DEFAULT_AGENT_ID = os.environ.get("AGENT_ENGINE_ID")

vertexai.init(project=PROJECT_ID, location=LOCATION)


# This dictionary contains the routing logic for your agents.
COURSE_AGENT_MAP = {
    "MA135": "projects/lithe-creek-462503-v4/locations/us-central1/reasoningEngines/6224511246700380160", # Algebra for Honours Mathematics
    "MA137": "projects/lithe-creek-462503-v4/locations/us-central1/reasoningEngines/1230019259946500096", # Calculus 1 for Honours Mathematics
    "CS135": "projects/lithe-creek-462503-v4/locations/us-central1/reasoningEngines/9165854384582557696",
    # You can add more course codes and their corresponding agent IDs here.
    # "BU111": "projects/your-project/locations/us-central1/reasoningEngines/your_bu111_agent_id",
}


# --- Helper function to delete existing tasks ---
def delete_tasks_for_event(db, user_id, event_id):
    """Deletes all tasks associated with a given calendar event ID."""
    print(f"Checking for and deleting existing tasks for Event ID: {event_id}")
    tasks_ref = db.collection("users").document(user_id).collection("tasks")
    tasks_snapshot = tasks_ref.where("relatedCalendarEventId", "==", event_id).get()
    
    if not tasks_snapshot:
        print(f"No existing tasks found for Event ID: {event_id}")
        return

    batch = db.batch()
    for doc in tasks_snapshot:
        batch.delete(doc.reference)
    
    batch.commit()
    print(f"Successfully deleted {len(tasks_snapshot)} tasks for Event ID: {event_id}")


@functions_framework.cloud_event
def process_calendar_event(cloud_event: CloudEvent) -> None:
    """
    A Cloud Function that triggers when a calendar event is written.
    """
    print("Function triggered by a calendar event write.")
    
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
    
    db = firestore.client()

    firestore_payload = DocumentEventData()
    firestore_payload._pb.ParseFromString(cloud_event.data)

    if not firestore_payload.value.fields:
        print(f"Event {event_id} was deleted. Deleting associated tasks.")
        delete_tasks_for_event(db, user_id, event_id)
        return

    event_start_time_str = firestore_payload.value.fields["startTime"].timestamp_value.isoformat()
    event_start_date = datetime.datetime.fromisoformat(event_start_time_str.replace('Z', '+00:00'))
    
    now = datetime.datetime.now(datetime.timezone.utc)
    two_weeks_from_now = now + datetime.timedelta(weeks=2)

    if not (now <= event_start_date <= two_weeks_from_now):
        print(f"Event {event_id} is not within the next two weeks. Deleting any stale tasks and skipping generation.")
        delete_tasks_for_event(db, user_id, event_id)
        return

    print(f"Event {event_id} is upcoming. Syncing tasks...")
    delete_tasks_for_event(db, user_id, event_id)

    event_title = firestore_payload.value.fields["title"].string_value
    course_id = firestore_payload.value.fields["courseId"].string_value

    if not event_title:
        print("Event data has no title. Exiting task generation.")
        return

    # --- UPDATED: Dynamic Agent Selection Logic ---
    course_name, course_code, generation_type = "", "", "flashcards"
    target_agent_id = DEFAULT_AGENT_ID # Start with the default agent from env vars

    if course_id:
        course_ref = db.collection("users").document(user_id).collection("courses").document(course_id)
        course_doc = course_ref.get()
        if course_doc.exists:
            course_data = course_doc.to_dict()
            if course_data:
                course_name = course_data.get("name", "")
                course_code = course_data.get("code", "")
                generation_type = course_data.get("generationType", "flashcards")
                
                # Check the map for a course-specific agent ID, overriding the default if found
                specific_agent_id = COURSE_AGENT_MAP.get(course_code.upper())
                if specific_agent_id:
                    target_agent_id = specific_agent_id
                    print(f"Found specific agent for course '{course_code}': {target_agent_id}")

    if not target_agent_id:
        print("No target agent ID found (neither course-specific nor default). Exiting.")
        return

    print(f"Using Agent ID: '{target_agent_id}' for event title: '{event_title}'")
    
    # This section remains unchanged, using the dynamically selected `target_agent_id`
    session_service = VertexAiSessionService(project=PROJECT_ID,location=LOCATION)
    session = asyncio.run(session_service.create_session(
        app_name=target_agent_id,
        user_id=user_id,
    ))
    agent = agent_engines.get(target_agent_id)
    print(f"Querying Agent Engine: '{agent}'")

    course_context = f"in the course '{course_name}, {course_code}'" if course_name else ""

    prereq_prompt = f"""
Your task is to act as a prerequisite knowledge '{generation_type}' generator for the course '{course_name}, {course_code}'.

Follow these steps carefully:

1.  **Analyze the Main Topic:** First, you must understand the core concepts covered in the main topic: '{event_title}'.
    * If the topic title is a generic reference (e.g., "Lecture 1", "Chapter 5", "Week 3"), you MUST first find the document with that title in the provided course material to determine the specific subjects discussed within it.
    * If the topic title is a specific concept (e.g., "Abstract Function", "Limits and Continuity", "Supply and Demand"), use that as the basis for the next step.

2.  **Identify Prerequisite Concepts:** Based on the specific subjects covered in the main topic, identify the foundational concepts, definitions, and skills a student absolutely must know *before* they can successfully begin learning about '{event_title}'. Do NOT list the topics from '{event_title}' itself; focus only on the essential building blocks.
    * *Example:* To learn about "Derivatives", prerequisites might include "Functions" and "Limits". To learn about "Linked Lists", prerequisites might include "Pointers" and "Dynamic Memory Allocation".

3.  **Generate Quiz Questions:** Using ONLY the provided course material as your knowledge base, generate between 10 and 20 multiple-choice questions that test the prerequisite concepts you identified. The goal is to create a quiz that verifies a student's readiness to start the main lesson. Do NOT ask questions about '{event_title}' itself.

4.  **Format the Output:** You MUST return your response as a single, valid JSON array. Each object in the array must have the following keys:
    - "question": A string containing the question about a prerequisite concept.
    - "options": An array of four strings representing the multiple-choice options.
    - "answer": A string containing the exact text of the correct option.

Do not include any introductory text, explanations, or summaries outside of the final JSON output.
"""
    post_lecture_prompt = f"""
Your task is to act as a post-lecture review '{generation_type}' generator for the course '{course_name}, {course_code}'. Your goal is to test a student's understanding of the material that was just covered.

Follow these steps carefully:

1.  **Identify the Core Content:** First, you must determine the specific concepts, definitions, and examples covered in the main topic: '{event_title}'.
    * If the topic title is a generic reference (e.g., "Lecture 2", "Week 5", "Module B"), you MUST find the document with that exact title in the provided course material to understand the subjects discussed within it.
    * If the topic title is a specific concept (e.g., "Taylor Polynomials", "Market Segmentation"), use that as the basis for your analysis, focusing only on how it is presented in the provided materials.

2.  **Generate Quiz Questions:** Using ONLY the provided course material as your knowledge base, generate between 10 and 20 multiple-choice questions that test the most important key concepts, definitions, and applications *from within* the topic '{event_title}'. The questions should verify that a student has understood the main points of the lesson.

3.  **Format the Output:** You MUST return your response as a single, valid JSON array. Each object in the array must have the following keys:
    - "question": A string containing the question about a key concept from the lecture.
    - "options": An array of four strings representing the multiple-choice options.
    - "answer": A string containing the exact text of the correct option.

Do not include any introductory text, explanations, or summaries outside of the final JSON output.
"""

    print(f"Querying for prerequisites with prompt: '{prereq_prompt}'")
    print(f"Querying for post-lecture with prompt: '{post_lecture_prompt}'")

    prereq_response_text = ""
    post_lecture_response_text = ""
    
    try:
        print("--- Querying for prerequisites ---")
        prereq_response_stream = agent.stream_query(message=prereq_prompt, session_id=session.id, user_id=user_id)
        prereq_response_parts = [chunk["content"]["parts"][0].get("text", "") for chunk in prereq_response_stream if "content" in chunk]
        prereq_response_text = "".join(prereq_response_parts)
        print(f"Raw prerequisite response text: '{prereq_response_text}'")
    except Exception as e:
        print(f"ERROR during prerequisite stream query: {e}")
        traceback.print_exc()

    try:
        print("--- Querying for post-lecture review ---")
        post_lecture_response_stream = agent.stream_query(message=post_lecture_prompt, session_id=session.id, user_id=user_id)
        post_lecture_response_parts = [chunk["content"]["parts"][0].get("text", "") for chunk in post_lecture_response_stream if "content" in chunk]
        post_lecture_response_text = "".join(post_lecture_response_parts)
        print(f"Raw post-lecture response text: '{post_lecture_response_text}'")
    except Exception as e:
        print(f"ERROR during post-lecture stream query: {e}")
        traceback.print_exc()

    tasks_collection = db.collection("users").document(user_id).collection("tasks")
    
    if prereq_response_text:
        due_date = event_start_date - datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Pre lecture review {generation_type} for: {event_title}",
            "details": prereq_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": due_date,
            "priority": "HIGH",
            "taskType": "pre-lecture"
        })
        print(f"Successfully created a new pre-lecture {generation_type} task for user {user_id}.")
    else:
        print(f"no prereq_response_text found")
        
    if post_lecture_response_text:
        post_review_due_date = event_start_date + datetime.timedelta(days=1)
        tasks_collection.add({
            "title": f"Post lecture review {generation_type} for: {event_title}",
            "details": post_lecture_response_text,
            "status": "PENDING",
            "relatedCalendarEventId": event_id,
            "dueDate": post_review_due_date,
            "priority": "HIGH",
            "taskType": "post-lecture"
        })
        print(f"Successfully created a new post-lecture {generation_type} task for user {user_id}.")
    else:
        print(f"no post_lecture_response_text found")

