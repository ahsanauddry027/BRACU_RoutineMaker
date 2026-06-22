/**
 * Course Catalog Caching Utility
 *
 * Strategy (MongoDB-backed, stale-while-revalidate):
 *  - The transformed USIS catalog is persisted in MongoDB (CatalogCourse).
 *  - A warm in-memory copy serves reads with zero latency.
 *  - On a cold start the catalog is loaded from MongoDB — no external call,
 *    so restarts are instant and resilient even if USIS is briefly down.
 *  - When the cache is older than CACHE_TTL it is still served immediately,
 *    while a refresh runs in the background so data stays current.
 *  - A scheduled refresh (see index.js) keeps it fresh even with no traffic.
 */

import CatalogCourse from '../models/CatalogCourse.js';

const USIS_API = 'https://usis-cdn.eniamza.com/connect-migrate.json';
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 hours — keep the catalog current

let cachedCourses = null;
let cacheTimestamp = null;
let refreshing = null; // in-flight refresh promise, so we never refresh twice at once

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Parse schedule string into structured format
 * Format: "Monday(10:00 AM-11:30 AM-Room 101)\nTuesday(02:00 PM-03:30 PM-Room 102)"
 */
function parseSchedule(scheduleStr) {
  if (!scheduleStr) return [];

  const scheduleRegex = /(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\((\d{1,2}:\d{2}\s(?:AM|PM))-(\d{1,2}:\d{2}\s(?:AM|PM))-([^)]+)\)/gi;
  const matches = [];
  let match;

  while ((match = scheduleRegex.exec(scheduleStr)) !== null) {
    // Normalize day to title case (e.g., "WEDNESDAY" → "Wednesday")
    const rawDay = match[1];
    const normalizedDay = rawDay.charAt(0).toUpperCase() + rawDay.slice(1).toLowerCase();
    matches.push({
      day: normalizedDay,
      startTime: match[2],
      endTime: match[3],
      room: match[4].trim(),
    });
  }

  return matches;
}

/**
 * Transform external API course data to internal format
 */
function transformCourse(rawCourse) {
  // Handle missing or undefined fields gracefully
  const courseTitle = rawCourse.courseTitle || rawCourse.courseName || rawCourse.courseDetails || '';

  return {
    sectionId: rawCourse.sectionId,
    courseCode: rawCourse.courseCode || 'UNKNOWN',
    courseTitle: courseTitle.toString().trim().toUpperCase(),
    sectionName: rawCourse.sectionName || rawCourse.courseDetails || '',
    courseCredit: rawCourse.courseCredit || 3,
    instructor: rawCourse.faculties || rawCourse.instructor || 'N/A',
    labInstructor: rawCourse.labFaculties || rawCourse.faculties || rawCourse.instructor || 'N/A',
    schedule: parseSchedule(rawCourse.preRegSchedule || ''),
    labSchedule: parseSchedule(rawCourse.preRegLabSchedule || ''),
    examDate: rawCourse.sectionSchedule?.finalExamDate || rawCourse.finalExamDate || null,
    examStartTime: rawCourse.sectionSchedule?.finalExamStartTime || rawCourse.finalExamStartTime || null,
    examEndTime: rawCourse.sectionSchedule?.finalExamEndTime || rawCourse.finalExamEndTime || null,
    examDetail: rawCourse.sectionSchedule?.finalExamDetail || null,
    department: rawCourse.department || 'N/A',
    semester: rawCourse.semester || null,
    status: rawCourse.status || 'Available',
  };
}

/**
 * Fetch the raw catalog from the external USIS API and transform it.
 */
async function fetchFromUSIS() {
  console.log('🔄 Fetching course catalog from USIS API...');
  const response = await fetch(USIS_API);
  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  const rawCourses = data.courses || [];

  return rawCourses
    .map(transformCourse)
    .sort((a, b) => {
      const codeA = `${a.courseCode}-${a.sectionName}`;
      const codeB = `${b.courseCode}-${b.sectionName}`;
      return codeA.localeCompare(codeB);
    });
}

/**
 * Replace the persisted catalog in MongoDB and update the warm in-memory copy.
 * Memory is updated first so reads never see an empty window during the write.
 */
async function persist(courses) {
  cachedCourses = courses;
  cacheTimestamp = Date.now();
  try {
    await CatalogCourse.deleteMany({});
    if (courses.length > 0) {
      await CatalogCourse.insertMany(courses, { ordered: false });
    }
    console.log(`💾 Persisted ${courses.length} catalog courses to MongoDB`);
  } catch (err) {
    console.error('Failed to persist catalog to MongoDB:', err.message);
  }
}

/**
 * Force a fresh fetch from USIS and persist it. Deduplicates concurrent calls.
 */
async function refreshCatalog() {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try {
      const courses = await fetchFromUSIS();
      await persist(courses);
      console.log(`✅ Refreshed catalog: ${courses.length} courses`);
      return courses;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

/**
 * Load the catalog from MongoDB into the in-memory cache (no external call).
 */
async function loadFromMongo() {
  const docs = await CatalogCourse.find().lean();
  if (docs.length > 0) {
    cachedCourses = docs;
    // Use the newest updatedAt as the cache timestamp
    cacheTimestamp = docs.reduce(
      (max, d) => Math.max(max, new Date(d.updatedAt || 0).getTime()),
      0
    ) || Date.now();
    console.log(`📦 Loaded ${docs.length} catalog courses from MongoDB`);
  }
  return cachedCourses;
}

function isFresh() {
  return cacheTimestamp !== null && Date.now() - cacheTimestamp < CACHE_TTL;
}

/**
 * Ensure the in-memory catalog is populated (from MongoDB or USIS).
 */
async function ensureLoaded() {
  if (cachedCourses) return cachedCourses;
  await loadFromMongo();
  if (!cachedCourses) await refreshCatalog();
  return cachedCourses;
}

/**
 * Get the full catalog. Always returns quickly:
 *  - fresh in-memory copy → return it
 *  - stale copy (memory or MongoDB) → return it, refresh in the background
 *  - nothing anywhere → fetch synchronously
 */
async function fetchCourseCatalog() {
  if (cachedCourses && isFresh()) return cachedCourses;

  // Cold start: try MongoDB before hitting the external API
  if (!cachedCourses) await loadFromMongo();

  if (cachedCourses) {
    // Serve what we have; revalidate in the background if it's stale
    if (!isFresh()) {
      refreshCatalog().catch((err) =>
        console.error('Background catalog refresh failed:', err.message)
      );
    }
    return cachedCourses;
  }

  // Nothing cached or persisted — must fetch now
  return refreshCatalog();
}

/**
 * Initialize the catalog on server startup: load from MongoDB, then fetch
 * if it's missing or stale. Called once from index.js after DB connect.
 */
async function initCatalog() {
  try {
    await loadFromMongo();
    if (!cachedCourses || !isFresh()) {
      console.log('🔄 Catalog missing or stale on startup — fetching from USIS...');
      await refreshCatalog();
    } else {
      console.log('📦 Catalog cache is warm (loaded from MongoDB).');
    }
  } catch (err) {
    console.error('Catalog initialization failed:', err.message);
  }
}

/**
 * Get a single course by section ID (queried from MongoDB, memory fallback).
 */
async function getCourseBySection(sectionId) {
  await ensureLoaded();
  try {
    const doc = await CatalogCourse.findOne({ sectionId }).lean();
    if (doc) return doc;
  } catch (err) {
    console.error('Mongo getCourseBySection failed:', err.message);
  }
  return (cachedCourses || []).find((c) => c.sectionId === sectionId);
}

/**
 * Search courses by code, title, or instructor — indexed MongoDB query
 * with an in-memory fallback for resilience.
 */
async function searchCourses(query) {
  if (!query || query.length < 2) return [];
  await ensureLoaded();

  try {
    const rx = new RegExp(escapeRegex(query), 'i');
    const results = await CatalogCourse.find({
      $or: [{ courseCode: rx }, { courseTitle: rx }, { instructor: rx }],
    })
      .limit(200)
      .lean();
    if (results.length > 0) return results;
  } catch (err) {
    console.error('Mongo catalog search failed, falling back to memory:', err.message);
  }

  const lower = query.toLowerCase();
  return (cachedCourses || []).filter((course) => {
    const code = (course.courseCode || '').toLowerCase();
    const title = (course.courseTitle || '').toLowerCase();
    const instructor = (course.instructor || '').toLowerCase();
    return code.includes(lower) || title.includes(lower) || instructor.includes(lower);
  });
}

/**
 * Get courses by department code (indexed prefix query, memory fallback).
 */
async function getCoursesByDept(deptCode) {
  await ensureLoaded();
  const code = deptCode.toUpperCase();
  try {
    const rx = new RegExp('^' + escapeRegex(code));
    const results = await CatalogCourse.find({ courseCode: rx }).lean();
    if (results.length > 0) return results;
  } catch (err) {
    console.error('Mongo getCoursesByDept failed, falling back to memory:', err.message);
  }
  return (cachedCourses || []).filter((c) => (c.courseCode || '').startsWith(code));
}

/**
 * Clear the in-memory cache (forces the next read to reload from MongoDB).
 */
function clearCache() {
  cachedCourses = null;
  cacheTimestamp = null;
  console.log('🗑️  In-memory course cache cleared');
}

/**
 * Get cache info / status.
 */
async function getCacheInfo() {
  let dbCount = 0;
  try {
    dbCount = await CatalogCourse.estimatedDocumentCount();
  } catch {
    /* ignore — DB may be unavailable */
  }

  if (!cacheTimestamp) {
    return {
      cached: false,
      courseCount: cachedCourses?.length || 0,
      dbCount,
      timestamp: null,
      age: null,
      expiresIn: null,
      nextRefreshDate: null,
      status: dbCount > 0 ? 'Stored in MongoDB (not yet loaded)' : 'No cache',
    };
  }

  const age = Date.now() - cacheTimestamp;
  const expiresIn = Math.max(0, CACHE_TTL - age);
  const nextRefreshDate = new Date(cacheTimestamp + CACHE_TTL).toLocaleString();
  const lastCachedDate = new Date(cacheTimestamp).toLocaleString();
  const hours = Math.floor(age / (60 * 60 * 1000));
  const mins = Math.floor(age / (60 * 1000));

  return {
    cached: cachedCourses !== null,
    courseCount: cachedCourses?.length || 0,
    dbCount,
    timestamp: cacheTimestamp,
    lastCachedDate,
    age,
    ageInDays: Math.floor(age / (24 * 60 * 60 * 1000)),
    expiresIn,
    expiresInHours: Math.ceil(expiresIn / (60 * 60 * 1000)),
    nextRefreshDate,
    fresh: isFresh(),
    status: hours >= 1 ? `Last updated ${hours} hour(s) ago` : `Last updated ${mins} minute(s) ago`,
  };
}

export {
  CACHE_TTL,
  fetchCourseCatalog,
  initCatalog,
  refreshCatalog,
  getCourseBySection,
  searchCourses,
  getCoursesByDept,
  clearCache,
  getCacheInfo,
};
