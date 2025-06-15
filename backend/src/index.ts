// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

const app = express();
const port = process.env.PORT || 8080;

app.use(cors({ origin: 'https://lithe-creek-462503-v4.web.app' }));
app.use(express.json());

const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    res.status(401).send({ message: 'Unauthorized' });
    return;
  }
  const idToken = authorization.split('Bearer ')[1];
  try {
    const decodedToken = await getAuth().verifyIdToken(idToken);
    (req as any).user = decodedToken;
    next();
  } catch (error) {
    res.status(403).send({ message: 'Forbidden' });
  }
};

app.get('/', (req, res) => {
  res.send('Hello from the Study Planner Backend!');
});

app.get('/tasks', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const db = getFirestore();

    const tasksCollectionRef = db.collection('users').doc(user.uid).collection('tasks');
    const snapshot = await tasksCollectionRef.orderBy('dueDate', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).send([]); // Return an empty array if no tasks exist
    }

    // Map the documents to an array of task objects
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        details: data.details,
        status: data.status,
        priority: data.priority,
        // Convert Firestore timestamp to a standard ISO string for the frontend
        dueDate: data.dueDate.toDate().toISOString(),
        relatedCalendarEventId: data.relatedCalendarEventId,
      };
    });

    res.status(200).send(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.put('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { taskId } = req.params;
    const { status } = req.body; // We'll only allow updating the status for now

    if (!status) {
      return res.status(400).send({ message: 'Missing "status" field for update.' });
    }

    const db = getFirestore();
    const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);

    await taskRef.update({ status });
    res.status(200).send({ message: 'Task updated successfully' });

  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

app.delete('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { taskId } = req.params;

    const db = getFirestore();
    const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);
    
    await taskRef.delete();
    res.status(200).send({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// CREATE Event
app.post('/events', authenticate, async (req, res) => {
  // ... existing code ...
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
    console.error("Error creating event with error:", error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// --- NEW --- UPDATE Event
app.put('/events/:eventId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { eventId } = req.params;
        const { title, startTime, endTime } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).send({ message: 'Missing required event fields.' });
        }

        const db = getFirestore();
        const eventRef = db.collection('users').doc(user.uid).collection('calendarEvents').doc(eventId);
        
        await eventRef.update({
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
        });

        res.status(200).send({ message: 'Event updated successfully' });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// --- NEW --- DELETE Event
app.delete('/events/:eventId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { eventId } = req.params;

        const db = getFirestore();
        const eventRef = db.collection('users').doc(user.uid).collection('calendarEvents').doc(eventId);

        await eventRef.delete();

        res.status(200).send({ message: 'Event deleted successfully' });
    } catch (error) {
        console.error("Error deleting event:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
