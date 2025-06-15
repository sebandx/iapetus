// backend/src/index.ts
import express from 'express';
import cors from 'cors';
// Change the import for initializeApp
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

// --- THE CRITICAL FIX ---
// Initialize the app without any arguments.
// When running in a Google Cloud environment like Cloud Run, the SDK
// will automatically detect the project and credentials.
initializeApp();

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(cors({ origin: 'https://lithe-creek-462503-v4.web.app' }));
app.use(express.json());

// --- Authentication Middleware ---
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


// --- API Routes ---
app.get('/', (req, res) => {
  res.send('Hello from the Study Planner Backend!');
});

app.post('/events', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { title, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      res.status(400).send({ message: 'Missing required event fields.' });
      return;
    }

    const db = getFirestore();
    const eventData = {
      title,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
    };

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
