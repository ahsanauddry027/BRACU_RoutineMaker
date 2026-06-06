import express from 'express';
import Course from '../models/Course.js';

const router = express.Router();

// GET /api/courses — Fetch all custom courses
router.get('/', async (req, res) => {
  try {
    const courses = await Course.find().sort({ courseCode: 1 });
    res.json(courses);
  } catch (err) {
    console.error('GET /api/courses error:', err);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// POST /api/courses — Add a new custom course
router.post('/', async (req, res) => {
  try {
    const { courseCode, courseTitle } = req.body;

    // Check if already exists — update if so
    const existing = await Course.findOne({
      courseCode: courseCode.toUpperCase().trim(),
    });

    if (existing) {
      existing.courseTitle = courseTitle.toUpperCase().trim();
      await existing.save();
      return res.json(existing);
    }

    const course = await Course.create({
      courseCode: courseCode.toUpperCase().trim(),
      courseTitle: courseTitle.toUpperCase().trim(),
    });

    res.status(201).json(course);
  } catch (err) {
    console.error('POST /api/courses error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// DELETE /api/courses/:id — Delete a custom course
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findByIdAndDelete(id);
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted', course });
  } catch (err) {
    console.error('DELETE /api/courses/:id error:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
