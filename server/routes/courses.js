import express from 'express';
import Course from '../models/Course.js';
import {
  fetchCourseCatalog,
  searchCourses,
  getCoursesByDept,
  getCacheInfo,
  refreshCatalog,
} from '../utils/courseCache.js';

const router = express.Router();

// ─── Course Catalog (External API) ────────────────────
// GET /api/courses/catalog — Fetch all courses from external API
router.get('/catalog', async (req, res) => {
  try {
    const courses = await fetchCourseCatalog();
    res.json(courses);
  } catch (err) {
    console.error('GET /api/courses/catalog error:', err);
    res.status(500).json({ error: 'Failed to fetch course catalog' });
  }
});

// GET /api/courses/catalog/search?q=query — Search courses
router.get('/catalog/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    const results = await searchCourses(q);
    res.json(results);
  } catch (err) {
    console.error('GET /api/courses/catalog/search error:', err);
    res.status(500).json({ error: 'Failed to search courses' });
  }
});

// GET /api/courses/catalog/dept/:code — Get courses by department
router.get('/catalog/dept/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const courses = await getCoursesByDept(code);
    res.json(courses);
  } catch (err) {
    console.error('GET /api/courses/catalog/dept/:code error:', err);
    res.status(500).json({ error: 'Failed to fetch department courses' });
  }
});

// GET /api/courses/catalog/cache-info — Get cache status
router.get('/catalog/cache-info', async (req, res) => {
  try {
    const info = await getCacheInfo();
    res.json(info);
  } catch (err) {
    console.error('GET /api/courses/catalog/cache-info error:', err);
    res.status(500).json({ error: 'Failed to get cache info' });
  }
});

// POST /api/courses/catalog/refresh — Force a fresh fetch from USIS into MongoDB
router.post('/catalog/refresh', async (req, res) => {
  try {
    const courses = await refreshCatalog();
    res.json({
      message: 'Cache refreshed',
      courseCount: courses.length,
    });
  } catch (err) {
    console.error('POST /api/courses/catalog/refresh error:', err);
    res.status(500).json({ error: 'Failed to refresh cache' });
  }
});

// ─── Custom Courses (MongoDB) ────────────────────────
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
