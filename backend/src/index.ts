// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK
initializeApp({
  credential: applicationDefault(),
});

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: 'https://lithe-creek-462503-v4.web.app' })); // Only allow requests from your frontend
app.use(express.json()); // To parse JSON request bodies

// --- Authentication Middleware ---
// This function will verify the Firebase ID token on protected routes
const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    // Don't 'return' the response, just send it.
    res.status(401).send({ message: 'Unauthorized: No token provided.' });
    return;
  }

  const idToken = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    // Add the decoded user info to the request object for later use
    (req as any).user = decodedToken; 
    next();
  } catch (error) {
    console.error('Error verifying token:', error);
    // Don't 'return' the response, just send it.
    res.status(403).send({ message: 'Forbidden: Invalid token.' });
  }
};


// --- API Routes ---

// A simple test route
app.get('/', (req, res) => {
  res.send('Hello from the Study Planner Backend!');
});

// A protected route to create a calendar event
app.post('/events', authenticate, async (req, res) => {
  try {
    const { user } = req as any; // The authenticated user from our middleware
    const { title, startTime, endTime } = req.body; // Event details from the request

    if (!title || !startTime || !endTime) {
      // Don't 'return' the response, just send it.
      res.status(400).send({ message: 'Missing required event fields.' });
      return;
    }

    const db = getFirestore();
    const eventData = {
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };

    // Save the event to the user's subcollection in Firestore
    const docRef = await db.collection('users').doc(user.uid).collection('calendarEvents').add(eventData);

    res.status(201).send({ message: 'Event created successfully', eventId: docRef.id });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
