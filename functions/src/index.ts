// functions/src/index.ts

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// --- THIS IS THE FIX ---
// Use a require statement for robust module loading in a Cloud Functions environment.
// We then destructure the VertexAI class from the required module.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const {VertexAI} = require("@google-cloud/aiplatform");

// Initialize the Vertex AI client.
const vertexAI = new VertexAI({
    project: process.env.GOOGLE_CLOUD_PROJECT!,
    location: process.env.GOOGLE_CLOUD_LOCATION!,
});

export const onCalendarEventCreate = onDocumentCreated("/users/{userId}/calendarEvents/{eventId}", async (event) => {
    logger.info("onCalendarEventCreate function triggered!");

    const userId = event.params.userId;
    const eventId = event.params.eventId;
    const eventData = event.data?.data();

    if (!eventData || !eventData.title) {
        logger.warn("Event created without data or title. Exiting function.", {userId, eventId});
        return;
    }

    const query = eventData.title;
    logger.info(`Querying RAG agent with: "${query}"`);

    const ragCorpusId = process.env.RAG_CORPUS_ID;
    if (!ragCorpusId) {
        logger.error("RAG_CORPUS_ID environment variable not set. Cannot query the agent.");
        return;
    }

    try {
        const ragRequest = {
            ragCorpora: [
                {
                    ragCorpus: ragCorpusId,
                },
            ],
            query: query,
        };

        const generativeModel = vertexAI.getGenerativeModel({
            model: "gemini-1.5-flash-001",
        });

        const result = await generativeModel.generateContent({
            contents: [{role: "user", parts: [{text: query}]}],
            tools: [{
                retrieval: {
                    source: {
                        rag: {
                            ragResources: [ragRequest]
                        }
                    }
                }
            }]
        });

        const response = result.response;
        const text = response.candidates[0].content.parts[0].text;
        
        logger.info("RAG Agent Response:", text);
        
    } catch (error) {
        logger.error("Error calling RAG agent:", error);
    }
});
