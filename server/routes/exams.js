import express from 'express';
import ExamEntry from '../models/ExamEntry.js';

const router = express.Router();

// GET /api/exams — Fetch all exams
router.get('/', async (req, res) => {
  try {
    const exams = await ExamEntry.find().sort({ examDate: 1, examTime: 1 });
    res.json(exams);
  } catch (err) {
    console.error('GET /api/exams error:', err);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// POST /api/exams — Create a new exam
router.post('/', async (req, res) => {
  try {
    const { courseCode, examDate, examTime, room, notes } = req.body;

    // Block: a different course already has an exam at this exact date + time
    if (examDate && examTime) {
      const clash = await ExamEntry.findOne({
        examDate,
        examTime,
        courseCode: { $ne: courseCode },
      });
      if (clash) {
        return res.status(409).json({
          error: `Exam time conflict: ${clash.courseCode} already has an exam on ${examDate} at ${examTime}.`,
        });
      }
    }

    const exam = await ExamEntry.create({ courseCode, examDate, examTime, room, notes });
    res.status(201).json(exam);
  } catch (err) {
    console.error('POST /api/exams error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// PUT /api/exams/:id — Update an exam
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, examDate, examTime, room, notes } = req.body;

    // Block: another course already has an exam at this exact date + time
    if (examDate && examTime) {
      const clash = await ExamEntry.findOne({
        _id: { $ne: id },
        examDate,
        examTime,
        courseCode: { $ne: courseCode },
      });
      if (clash) {
        return res.status(409).json({
          error: `Exam time conflict: ${clash.courseCode} already has an exam on ${examDate} at ${examTime}.`,
        });
      }
    }

    const exam = await ExamEntry.findByIdAndUpdate(
      id,
      { courseCode, examDate, examTime, room, notes },
      { new: true, runValidators: true }
    );
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    console.error('PUT /api/exams/:id error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// DELETE /api/exams/:id — Delete single exam
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await ExamEntry.findByIdAndDelete(id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });
    res.json({ message: 'Exam deleted', exam });
  } catch (err) {
    console.error('DELETE /api/exams/:id error:', err);
    res.status(500).json({ error: 'Failed to delete exam' });
  }
});

// DELETE /api/exams — Clear all exams
router.delete('/', async (req, res) => {
  try {
    const result = await ExamEntry.deleteMany({});
    res.json({ message: 'All exams cleared', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('DELETE /api/exams error:', err);
    res.status(500).json({ error: 'Failed to clear exams' });
  }
});

export default router;
