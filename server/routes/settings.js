import express from 'express';
import Settings from '../models/Settings.js';

const router = express.Router();

// Default time slots (fallback if DB has none)
const DEFAULT_TIME_SLOTS = [
  { id: 1, start: '08:00 AM', end: '09:20 AM' },
  { id: 2, start: '09:30 AM', end: '10:50 AM' },
  { id: 3, start: '11:00 AM', end: '12:20 PM' },
  { id: 4, start: '12:30 PM', end: '01:50 PM' },
  { id: 5, start: '02:00 PM', end: '03:20 PM' },
  { id: 6, start: '03:30 PM', end: '04:50 PM' },
  { id: 7, start: '05:00 PM', end: '06:20 PM' },
];

// GET /api/settings/timeslots — Fetch time slots
router.get('/timeslots', async (req, res) => {
  try {
    const settings = await Settings.findOne({ key: 'global' });
    if (!settings || !settings.timeSlots || settings.timeSlots.length === 0) {
      return res.json(DEFAULT_TIME_SLOTS);
    }
    res.json(settings.timeSlots);
  } catch (err) {
    console.error('GET /api/settings/timeslots error:', err);
    res.json(DEFAULT_TIME_SLOTS);
  }
});

// PUT /api/settings/timeslots — Update time slots
router.put('/timeslots', async (req, res) => {
  try {
    const { timeSlots } = req.body;

    if (!Array.isArray(timeSlots) || timeSlots.length === 0) {
      return res.status(400).json({ error: 'Time slots array is required' });
    }

    // Validate each slot
    for (const slot of timeSlots) {
      if (!slot.id || !slot.start || !slot.end) {
        return res.status(400).json({ error: 'Each slot must have id, start, and end' });
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { timeSlots },
      { new: true, upsert: true }
    );

    res.json(settings.timeSlots);
  } catch (err) {
    console.error('PUT /api/settings/timeslots error:', err);
    res.status(500).json({ error: 'Failed to update time slots' });
  }
});

// POST /api/settings/timeslots/reset — Reset to defaults
router.post('/timeslots/reset', async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { key: 'global' },
      { timeSlots: DEFAULT_TIME_SLOTS },
      { new: true, upsert: true }
    );
    res.json(settings.timeSlots);
  } catch (err) {
    console.error('POST /api/settings/timeslots/reset error:', err);
    res.status(500).json({ error: 'Failed to reset time slots' });
  }
});

export default router;
