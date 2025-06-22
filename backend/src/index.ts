// backend/src/index.ts
import express from 'express';
import cors from 'cors';

import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

initializeApp();

const app = express();
const port = process.env.PORT || 8080;

// Create a list of allowed origins.
const allowedOrigins = [
  'https://lithe-creek-462503-v4.web.app', // Your deployed frontend
  'http://localhost:5173' // Your local dev server
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

// GET all courses for the authenticated user
app.get('/courses', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const db = getFirestore();
        const coursesRef = db.collection('users').doc(user.uid).collection('courses');
        const snapshot = await coursesRef.orderBy('name').get();

        if (snapshot.empty) {
            return res.status(200).send([]);
        }

        const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.status(200).send(courses);

    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// POST (create) a new course
app.post('/courses', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { name, code, generationType } = req.body;

        if (!name) {
            return res.status(400).send({ message: 'Course name is required.' });
        }

        const db = getFirestore();
        const newCourse = {
            name,
            code: code || '',
            generationType: generationType || 'flashcards'
        };
        const docRef = await db.collection('users').doc(user.uid).collection('courses').add(newCourse);

        res.status(201).send({ message: 'Course added successfully', id: docRef.id });
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// UPDATE a course's generation preference
app.put('/courses/:courseId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { courseId } = req.params;
        const { generationType } = req.body;

        if (!generationType) {
            return res.status(400).send({ message: 'Missing "generationType" field.' });
        }

        const db = getFirestore();
        const courseRef = db.collection('users').doc(user.uid).collection('courses').doc(courseId);
        await courseRef.update({ generationType });

        res.status(200).send({ message: 'Course preference updated.' });

    } catch (error) {
        console.error('Error updating course:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// DELETE a specific course
app.delete('/courses/:courseId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { courseId } = req.params;

        const db = getFirestore();
        await db.collection('users').doc(user.uid).collection('courses').doc(courseId).delete();

        res.status(200).send({ message: 'Course deleted successfully' });
    } catch (error) {
        console.error('Error deleting course:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// GET all tasks for the authenticated user
app.get('/tasks', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const db = getFirestore();

    const tasksCollectionRef = db.collection('users').doc(user.uid).collection('tasks');
    const snapshot = await tasksCollectionRef.orderBy('dueDate', 'desc').get();

    if (snapshot.empty) {
      return res.status(200).send([]);
    }

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
        quizResult: data.quizResult || null, // --- MODIFIED: Ensure quizResult is returned
      };
    });

    res.status(200).send(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).send({ message: 'Internal Server Error' });
  }
});

// UPDATE a task's status
app.put('/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const { user } = req as any;
    const { taskId } = req.params;
    const { status } = req.body;

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

// DELETE a task
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

app.post('/tasks/:taskId/quiz', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { taskId } = req.params;
        const quizResult = req.body; // The result sent from the frontend

        if (!quizResult) {
            return res.status(400).send({ message: 'Missing quiz result data.' });
        }

        const db = getFirestore();
        const taskRef = db.collection('users').doc(user.uid).collection('tasks').doc(taskId);

        // Save the result and mark the task as COMPLETED
        await taskRef.update({
            quizResult: quizResult, // Save the entire result object
            status: 'COMPLETED'
        });

        res.status(200).send({ message: 'Quiz result saved successfully.' });

    } catch (error) {
        console.error('Error saving quiz result:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});


// Event Endpoints (CREATE, UPDATE, DELETE)
app.post('/events', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { title, startTime, endTime, courseId } = req.body;

        if (!title || !startTime || !endTime) {
            return res.status(400).send({ message: 'Missing required event fields.' });
        }

        const db = getFirestore();
        const eventData = {
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            courseId: courseId || null
        };
        const docRef = await db.collection('users').doc(user.uid).collection('calendarEvents').add(eventData);

        res.status(201).send({ message: 'Event created successfully', eventId: docRef.id });
    } catch (error) {
        console.error("Error creating event:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

app.put('/events/:eventId', authenticate, async (req, res) => {
    try {
        const { user } = req as any;
        const { eventId } = req.params;
        const { title, startTime, endTime, courseId } = req.body; 

        if (!title || !startTime || !endTime) {
            return res.status(400).send({ message: 'Missing required event fields.' });
        }

        const db = getFirestore();
        const eventRef = db.collection('users').doc(user.uid).collection('calendarEvents').doc(eventId);
        
        await eventRef.update({
            title,
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            courseId: courseId || null
        });

        res.status(200).send({ message: 'Event updated successfully' });
    } catch (error) {
        console.error("Error updating event:", error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

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
