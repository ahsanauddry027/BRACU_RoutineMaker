import express from 'express';
import RoutineEntry from '../models/RoutineEntry.js';
import ExamEntry from '../models/ExamEntry.js';

const router = express.Router();

// ─── GET /api/routine — Fetch all entries ─────────────
router.get('/', async (req, res) => {
  try {
    const entries = await RoutineEntry.find().sort({ startSlot: 1 });
    res.json(entries);
  } catch (err) {
    console.error('GET /api/routine error:', err);
    res.status(500).json({ error: 'Failed to fetch routine entries' });
  }
});

// ─── POST /api/routine — Create a new entry ──────────
router.post('/', async (req, res) => {
  try {
    const { courseCode, courseTitle, type, section, faculty, room, examDate, examTime, labFrequency, days, startSlot, endSlot } =
      req.body;

    // A lab must span exactly 2 consecutive slots
    if (type === 'LAB' && endSlot !== startSlot + 1) {
      return res.status(400).json({
        error: `Labs must span exactly 2 consecutive slots. Received startSlot ${startSlot}, endSlot ${endSlot}.`,
      });
    }

    // Server-side conflict check
    const conflictQuery = {
      days: { $in: days },
      $or: [],
    };

    if (type === 'THEORY') {
      // Check if any existing entry occupies the same slot on any of the days
      conflictQuery.$or.push(
        // Theory occupying this slot
        { type: 'THEORY', startSlot: startSlot },
        // Lab spanning over this slot
        { type: 'LAB', startSlot: { $lte: startSlot }, endSlot: { $gte: startSlot } }
      );
    } else {
      // LAB — check both startSlot and endSlot
      conflictQuery.$or.push(
        { type: 'THEORY', startSlot: { $gte: startSlot, $lte: endSlot } },
        {
          type: 'LAB',
          $or: [
            { startSlot: { $gte: startSlot, $lte: endSlot } },
            { endSlot: { $gte: startSlot, $lte: endSlot } },
          ],
        }
      );
    }

    if (conflictQuery.$or.length > 0) {
      const conflict = await RoutineEntry.findOne(conflictQuery);
      if (conflict) {
        return res.status(409).json({
          error: `Conflict: Slot already occupied by ${conflict.courseCode} (${conflict.type})`,
        });
      }
    }

    const entry = await RoutineEntry.create({
      courseCode,
      courseTitle,
      type,
      section,
      faculty,
      room,
      examDate,
      examTime,
      labFrequency,
      days,
      startSlot,
      endSlot,
    });

    res.status(201).json(entry);
  } catch (err) {
    console.error('POST /api/routine error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to create routine entry' });
  }
});

// ─── PUT /api/routine/:id — Update an entry ──────────
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { courseCode, courseTitle, type, section, faculty, room, examDate, examTime, labFrequency, days, startSlot, endSlot } =
      req.body;

    // A lab must span exactly 2 consecutive slots
    if (type === 'LAB' && endSlot !== startSlot + 1) {
      return res.status(400).json({
        error: `Labs must span exactly 2 consecutive slots. Received startSlot ${startSlot}, endSlot ${endSlot}.`,
      });
    }

    // Check for conflicts (excluding this entry)
    if (days && startSlot) {
      const conflictQuery = {
        _id: { $ne: id },
        days: { $in: days },
        $or: [],
      };

      const effectiveEndSlot = endSlot || startSlot;

      if (type === 'THEORY') {
        conflictQuery.$or.push(
          { type: 'THEORY', startSlot: startSlot },
          { type: 'LAB', startSlot: { $lte: startSlot }, endSlot: { $gte: startSlot } }
        );
      } else {
        conflictQuery.$or.push(
          { type: 'THEORY', startSlot: { $gte: startSlot, $lte: effectiveEndSlot } },
          {
            type: 'LAB',
            $or: [
              { startSlot: { $gte: startSlot, $lte: effectiveEndSlot } },
              { endSlot: { $gte: startSlot, $lte: effectiveEndSlot } },
            ],
          }
        );
      }

      if (conflictQuery.$or.length > 0) {
        const conflict = await RoutineEntry.findOne(conflictQuery);
        if (conflict) {
          return res.status(409).json({
            error: `Conflict: Slot already occupied by ${conflict.courseCode} (${conflict.type})`,
          });
        }
      }
    }

    const entry = await RoutineEntry.findByIdAndUpdate(
      id,
      { courseCode, courseTitle, type, section, faculty, room, examDate, examTime, labFrequency, days, startSlot, endSlot },
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    res.json(entry);
  } catch (err) {
    console.error('PUT /api/routine/:id error:', err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: 'Failed to update routine entry' });
  }
});

// ─── DELETE /api/routine/:id — Delete single entry ───
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Retrieve the entry first to check its type
    const entry = await RoutineEntry.findById(id);
    if (!entry) {
      return res.status(404).json({ error: 'Entry not found' });
    }

    // If it's a THEORY course, delete associated exams and lab entries
    if (entry.type === 'THEORY') {
      await ExamEntry.deleteMany({ courseCode: entry.courseCode });
      // Also delete associated LAB entries for the same course and section
      const deletedLabs = await RoutineEntry.deleteMany({
        type: 'LAB',
        courseCode: entry.courseCode,
        section: entry.section,
      });
      if (deletedLabs.deletedCount > 0) {
        console.log(`🗑️ Auto-deleted ${deletedLabs.deletedCount} associated lab(s) for ${entry.courseCode} section ${entry.section}`);
      }
    }

    // Delete the routine entry
    await RoutineEntry.findByIdAndDelete(id);

    res.json({ message: 'Entry deleted', entry, labsDeleted: entry.type === 'THEORY' });
  } catch (err) {
    console.error('DELETE /api/routine/:id error:', err);
    res.status(500).json({ error: 'Failed to delete routine entry' });
  }
});

// ─── DELETE /api/routine — Clear all entries ─────────
router.delete('/', async (req, res) => {
  try {
    // Get all THEORY entries
    const theoryEntries = await RoutineEntry.find({ type: 'THEORY' });
    
    // Collect all unique course codes
    const courseCodeSet = new Set(theoryEntries.map(e => e.courseCode));
    
    // Delete all exams for these course codes
    if (courseCodeSet.size > 0) {
      await ExamEntry.deleteMany({ courseCode: { $in: Array.from(courseCodeSet) } });
    }
    
    // Delete all routine entries
    const result = await RoutineEntry.deleteMany({});
    res.json({ message: 'All entries cleared', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('DELETE /api/routine error:', err);
    res.status(500).json({ error: 'Failed to clear routine entries' });
  }
});

export default router;
