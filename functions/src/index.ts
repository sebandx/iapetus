// functions/src/index.ts

import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";

// Import the Vertex AI SDK
import {VertexAI} from "@google-cloud/aiplatform";

// Initialize the Vertex AI client.
// It's best practice to initialize clients outside the function handler
// to reuse them across multiple function invocations.
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
    logger.info(`Querying RAG agent: "${query}"`);

    // Retrieve the RAG Corpus ID from the environment variables you will set up.
    const ragCorpusId = process.env.RAG_CORPUS_ID;
    if (!ragCorpusId) {
        logger.error("RAG_CORPUS_ID environment variable not set. Cannot query the agent.");
        return;
    }

    try {
        // Construct the request for the RAG agent
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

        // Make the call to the RAG agent
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
        
        // --- NEXT STEP ---
        // You would add logic here to create a new "to-do task" in Firestore
        // using the response text. For example:
        // const firestore = getFirestore();
        // await firestore.collection('users').doc(userId).collection('tasks').add({
        //   title: `Review prerequisites for ${query}`,
        //   details: text,
        //   status: 'PENDING',
        //   createdAt: new Date(),
        // });

    } catch (error) {
        logger.error("Error calling RAG agent:", error);
    }
});

