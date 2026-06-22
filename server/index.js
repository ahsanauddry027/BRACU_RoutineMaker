import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import routineRoutes from './routes/routine.js';
import examRoutes from './routes/exams.js';
import courseRoutes from './routes/courses.js';
import settingsRoutes from './routes/settings.js';
import Course from './models/Course.js';
import { initCatalog, refreshCatalog, CACHE_TTL } from './utils/courseCache.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────
app.use('/api/routine', routineRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/settings', settingsRoutes);

// ─── Health Check ─────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Serve the built React app (production single-origin) ──
// In production the client is built to client/dist; serving it here means the
// API and the installable PWA share one HTTPS origin (so /api stays same-origin).
const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  // SPA fallback: any non-API GET returns index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('🌐 Serving built client from client/dist');
}

// ─── 404 Handler ──────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Error Handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────
const startServer = async () => {
  await connectDB();
  
  // Clean up any CSE500+ courses from MongoDB
  try {
    const deleted = await Course.deleteMany({
      courseCode: { $regex: /^CSE(5|6|7|8|9)\d+/i }
    });
    if (deleted.deletedCount > 0) {
      console.log(`🧹 Removed ${deleted.deletedCount} CSE500+ courses from database.`);
    }
  } catch (cleanErr) {
    console.error('Failed to clean CSE500+ courses:', cleanErr);
  }

  // Set/update the global time slots if they match the old defaults
  try {
    const Settings = mongoose.model('Settings');
    const globalSettings = await Settings.findOne({ key: 'global' });
    
    const NEW_BANGLA_SLOTS = [
      { id: 1, start: '08:00 AM', end: '09:20 AM' },
      { id: 2, start: '09:30 AM', end: '10:50 AM' },
      { id: 3, start: '11:00 AM', end: '12:20 PM' },
      { id: 4, start: '12:30 PM', end: '01:50 PM' },
      { id: 5, start: '02:00 PM', end: '03:20 PM' },
      { id: 6, start: '03:30 PM', end: '04:50 PM' },
      { id: 7, start: '05:00 PM', end: '06:20 PM' }
    ];

    if (!globalSettings) {
      await Settings.create({ key: 'global', timeSlots: NEW_BANGLA_SLOTS });
      console.log('✅ Created default Bangladeshi time slots in database.');
    } else {
      // Check if any slot has the old 90m block timing
      const hasOldSlots = globalSettings.timeSlots.some(s => s.start === '09:30 AM' && s.end === '11:00 AM');
      if (hasOldSlots) {
        globalSettings.timeSlots = NEW_BANGLA_SLOTS;
        await globalSettings.save();
        console.log('🔄 Migrated database time slots to Bangladeshi standard (80-minute blocks).');
      }
    }
  } catch (err) {
    console.error('Failed to initialize/migrate time slots:', err);
  }

  // Warm the course catalog from MongoDB (fetch from USIS only if missing/stale)
  await initCatalog();

  // Keep the catalog current with a scheduled background refresh
  setInterval(() => {
    refreshCatalog().catch((err) =>
      console.error('Scheduled catalog refresh failed:', err.message)
    );
  }, CACHE_TTL);

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API available at http://localhost:${PORT}/api/routine`);
    console.log(`📋 Exams API at http://localhost:${PORT}/api/exams`);
    console.log(`📚 Courses API at http://localhost:${PORT}/api/courses`);
    console.log(`⚙️  Settings API at http://localhost:${PORT}/api/settings`);
  });
};

startServer();
