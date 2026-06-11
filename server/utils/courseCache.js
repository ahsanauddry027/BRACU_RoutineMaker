/**
 * Course Catalog Caching Utility
 * Fetches and caches course data from external API (USIS)
 * Cache expires every 24 hours
 */

const USIS_API = 'https://usis-cdn.eniamza.com/connect-migrate.json';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

let cachedCourses = null;
let cacheTimestamp = null;

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
    matches.push({
      day: match[1],
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
  const courseTitle = rawCourse.courseTitle || rawCourse.courseDetails || '';
  
  return {
    sectionId: rawCourse.sectionId,
    courseCode: rawCourse.courseCode || 'UNKNOWN',
    courseTitle: courseTitle.toString().trim().toUpperCase(),
    sectionName: rawCourse.sectionName || rawCourse.courseDetails || '',
    courseCredit: rawCourse.courseCredit || 3,
    instructor: rawCourse.instructor || 'N/A',
    schedule: parseSchedule(rawCourse.preRegSchedule || ''),
    labSchedule: parseSchedule(rawCourse.preRegLabSchedule || ''),
    examDate: rawCourse.finalExamDate || null,
    examStartTime: rawCourse.finalExamStartTime || null,
    examEndTime: rawCourse.finalExamEndTime || null,
    department: rawCourse.department || 'N/A',
    semester: rawCourse.semester || null,
    status: rawCourse.status || 'Available',
  };
}

/**
 * Fetch and cache courses from external API
 */
async function fetchCourseCatalog() {
  // Return cached data if available and not expired
  if (cachedCourses && cacheTimestamp) {
    const elapsed = Date.now() - cacheTimestamp;
    if (elapsed < CACHE_DURATION) {
      console.log('📦 Returning cached course catalog');
      return cachedCourses;
    }
  }

  try {
    console.log('🔄 Fetching course catalog from USIS API...');
    const response = await fetch(USIS_API);
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawCourses = data.courses || [];

    // Transform and sort
    const courses = rawCourses
      .map(transformCourse)
      .sort((a, b) => {
        const codeA = `${a.courseCode}-${a.sectionName}`;
        const codeB = `${b.courseCode}-${b.sectionName}`;
        return codeA.localeCompare(codeB);
      });

    // Update cache
    cachedCourses = courses;
    cacheTimestamp = Date.now();

    console.log(`✅ Fetched and cached ${courses.length} courses`);
    return courses;
  } catch (error) {
    console.error('❌ Failed to fetch course catalog:', error.message);
    
    // Return cached courses if available, even if expired
    if (cachedCourses) {
      console.log('⚠️  Returning expired cache as fallback');
      return cachedCourses;
    }

    throw new Error(`Failed to fetch course catalog: ${error.message}`);
  }
}

/**
 * Get a single course by section ID
 */
async function getCourseBySection(sectionId) {
  const courses = await fetchCourseCatalog();
  return courses.find(c => c.sectionId === sectionId);
}

/**
 * Search courses by code, title, or instructor
 */
async function searchCourses(query) {
  if (!query || query.length < 2) return [];

  const courses = await fetchCourseCatalog();
  const lowerQuery = query.toLowerCase();

  return courses.filter(course => {
    const code = (course.courseCode || '').toLowerCase();
    const title = (course.courseTitle || '').toLowerCase();
    const instructor = (course.instructor || '').toLowerCase();
    
    return code.includes(lowerQuery) || title.includes(lowerQuery) || instructor.includes(lowerQuery);
  });
}

/**
 * Get courses by department code
 */
async function getCoursesByDept(deptCode) {
  const courses = await fetchCourseCatalog();
  return courses.filter(c => c.courseCode.startsWith(deptCode.toUpperCase()));
}

/**
 * Clear cache manually (for testing or manual refresh)
 */
function clearCache() {
  cachedCourses = null;
  cacheTimestamp = null;
  console.log('🗑️  Course cache cleared');
}

/**
 * Get cache info
 */
function getCacheInfo() {
  return {
    cached: cachedCourses !== null,
    courseCount: cachedCourses?.length || 0,
    timestamp: cacheTimestamp,
    age: cacheTimestamp ? Date.now() - cacheTimestamp : null,
    expiresIn: cacheTimestamp ? Math.max(0, CACHE_DURATION - (Date.now() - cacheTimestamp)) : null,
  };
}

export {
  fetchCourseCatalog,
  getCourseBySection,
  searchCourses,
  getCoursesByDept,
  clearCache,
  getCacheInfo,
};
