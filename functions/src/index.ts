// functions/src/index.ts

// Import the necessary modules from the Firebase SDKs.
// onDocumentCreated is the specific trigger we need.
import {onDocumentCreated} from "firebase-functions/v2/firestore";
// The logger is used to write logs that you can view in the Google Cloud console.
import * as logger from "firebase-functions/logger";

/**
 * This function is triggered whenever a new document is created in the
 * 'calendarEvents' subcollection for any user.
 *
 * The path "/users/{userId}/calendarEvents/{eventId}" uses wildcards
 * to match any user ID and any new event ID.
 */
export const onCalendarEventCreate = onDocumentCreated("/users/{userId}/calendarEvents/{eventId}", (event) => {
  // Start logging so we can see the function ran.
  logger.info("onCalendarEventCreate function triggered!");

  // The 'event' object contains information about the trigger.
  // We can get the wildcard values from the path like this:
  const userId = event.params.userId;
  const eventId = event.params.eventId;

  logger.log(`New event [${eventId}] created for user [${userId}]`);

  // The actual data of the document that was created.
  const eventData = event.data?.data();

  if (eventData) {
    logger.log("New Event Data:", eventData);
    // You can access specific fields like eventData.title, etc.
  } else {
    logger.warn("No data was found in the created document.");
  }

  // In the future, you will add logic here to create a to-do task in Firestore.
  return;
});
