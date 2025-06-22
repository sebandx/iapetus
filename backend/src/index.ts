// backend/src/index.ts
import express from 'express';
import cors from 'cors';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

const app = express();
const port = process.env.PORT || 8080;

const allowedOrigins = [
  'https://lithe-creek-462503-v4.web.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
};

app.use(cors(corsOptions));
app.use(express.json());

const authenticate = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).send({ message: 'Unauthorized' });
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

app.get('/courses', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const db = getFirestore();
        const coursesRef = db.collection('users').doc(user.uid).collection('courses');
        const snapshot = await coursesRef.orderBy('name').get();
        if (snapshot.empty) return res.status(200).send([]);
        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(courses);
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.post('/courses', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { name, code, generationType } = req.body;
        if (!name) return res.status(400).send({ message: 'Course name is required.' });
        const db = getFirestore();
        const docRef = await db.collection('users').doc(user.uid).collection('courses').add({ name, code: code || '', generationType: generationType || 'flashcards' });
        res.status(201).send({ message: 'Course added successfully', id: docRef.id });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.put('/courses/:courseId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { courseId } = req.params;
        const { generationType } = req.body;
        if (!generationType) return res.status(400).send({ message: 'Missing "generationType" field.' });
        const db = getFirestore();
        await db.collection('users').doc(user.uid).collection('courses').doc(courseId).update({ generationType });
        res.status(200).send({ message: 'Course preference updated.' });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.delete('/courses/:courseId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { courseId } = req.params;
        const db = getFirestore();
        await db.collection('users').doc(user.uid).collection('courses').doc(courseId).delete();
        res.status(200).send({ message: 'Course deleted successfully' });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

// --- Task Endpoints ---
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const db = getFirestore();
    const tasksCollectionRef = db.collection('users').doc(user.uid).collection('tasks');
    const snapshot = await tasksCollectionRef.orderBy('dueDate', 'desc').get();
    if (snapshot.empty) return res.status(200).send([]);
    
    const tasks = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title,
        details: data.details,
        status: data.status,
        priority: data.priority,
        dueDate: data.dueDate.toDate().toISOString(),
        relatedCalendarEventId: data.relatedCalendarEventId,
        quizResult: data.quizResult || null,
      };
    });
    res.status(200).send(tasks);
  } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.put('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { taskId } = req.params;
    const { status } = req.body;
    if (!status) return res.status(400).send({ message: 'Missing "status" field.' });
    const db = getFirestore();
    await db.collection('users').doc(user.uid).collection('tasks').doc(taskId).update({ status });
    res.status(200).send({ message: 'Task updated successfully' });
  } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.delete('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { taskId } = req.params;
    const db = getFirestore();
    await db.collection('users').doc(user.uid).collection('tasks').doc(taskId).delete();
    res.status(200).send({ message: 'Task deleted successfully' });
  } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});

app.post('/tasks/:taskId/quiz', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { taskId } = req.params;
        const newQuizResult = req.body;

        if (!newQuizResult) return res.status(400).send({ message: 'Missing quiz result data.' });
        
        const db = getFirestore();
        const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);

        const doc = await taskRef.get();
        if (!doc.exists) return res.status(404).send({ message: 'Task not found.' });

        const existingResult = doc.data()?.quizResult || {};
        const mergedResult = { ...existingResult, ...newQuizResult };

        await taskRef.update({ quizResult: mergedResult });

        res.status(200).send({ message: 'Quiz result saved successfully.' });
    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});


app.post('/events', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { title, startTime, endTime, courseId } = req.body;
        if (!title || !startTime || !endTime) return res.status(400).send({ message: 'Missing fields.' });
        const db = getFirestore();
        const docRef = await db.collection('users').doc(user.uid).collection('calendarEvents').add({ title, startTime: new Date(startTime), endTime: new Date(endTime), courseId: courseId || null });
        res.status(201).send({ message: 'Event created', eventId: docRef.id });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});
app.put('/events/:eventId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { eventId } = req.params;
        const { title, startTime, endTime, courseId } = req.body;
        if (!title || !startTime || !endTime) return res.status(400).send({ message: 'Missing fields.' });
        const db = getFirestore();
        await db.collection('users').doc(user.uid).collection('calendarEvents').doc(eventId).update({ title, startTime: new Date(startTime), endTime: new Date(endTime), courseId: courseId || null });
        res.status(200).send({ message: 'Event updated' });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});
app.delete('/events/:eventId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { eventId } = req.params;
        const db = getFirestore();
        await db.collection('users').doc(user.uid).collection('calendarEvents').doc(eventId).delete();
        res.status(200).send({ message: 'Event deleted' });
    } catch (error) { res.status(500).send({ message: 'Internal Server Error' }); }
});


app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
