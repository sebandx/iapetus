// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();
console.log("Firebase Admin SDK initialized.");

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({ origin: 'https://lithe-creek-462503-v4.web.app' }));
app.use(express.json());

const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).send({ message: 'Unauthorized: No token provided.' });
    return;
  }
  const idToken = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    res.status(403).send({ message: 'Forbidden: Invalid token.' });
  }
};

app.get('/', (req, res) => {
  console.log("Received request for / route");
  res.send('Hello from the Study Planner Backend!');
});

app.post('/events', authenticate, async (req, res) => {
  console.log("--- Received request for /events ---");
  try {
    const { user } = req as any;
    console.log(`Authenticated user UID: ${user.uid}`);

    const { title, startTime, endTime } = req.body;
    console.log("Request body:", req.body);

    if (!title || !startTime || !endTime) {
      console.error("Validation failed: Missing required fields.");
      res.status(400).send({ message: 'Missing required event fields.' });
      return;
    }
    console.log("Validation passed.");

    console.log("Attempting to get Firestore instance...");
    const db = getFirestore();
    console.log("Successfully got Firestore instance.");

    const eventData = {
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };
    console.log("Prepared event data for Firestore:", eventData);

    const collectionPath = `users/${user.uid}/calendarEvents`;
    console.log(`Attempting to add document to collection: ${collectionPath}`);
    const docRef = await db.collection('users').doc(user.uid).collection('calendarEvents').add(eventData);
    console.log(`Successfully added document with ID: ${docRef.id}`);

    res.status(201).send({ message: 'Event created successfully', eventId: docRef.id });

  } catch (error) {
    console.error("---!! ERROR in /events endpoint !! ---", error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
