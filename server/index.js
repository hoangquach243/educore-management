import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import usersRoutes from './routes/users.js';
import coursesRoutes from './routes/courses.js';
import classesRoutes from './routes/classes.js';
import assignmentsRoutes from './routes/assignments.js';
import enrollmentsRoutes from './routes/enrollments.js';
import gradesRoutes from './routes/grades.js';
import gradeConfigsRoutes from './routes/gradeConfigs.js';
import authRoutes from './routes/auth.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/classes', classesRoutes);
app.use('/api/assignments', assignmentsRoutes);
app.use('/api/enrollments', enrollmentsRoutes);
app.use('/api/grades', gradesRoutes);
app.use('/api/grade-configs', gradeConfigsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});

