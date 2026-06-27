// ─── BRACU CSE Course Dictionary ──────────────────────
// Maps course codes to their official titles.
// Sources: BRACU CSE website + department spreadsheet.

const COURSE_MAP = {
  // ─── Core / Undergraduate ──────────────────────────
  'CSE110': 'Programming Language I',
  'CSE111': 'Programming Language 2',
  'CSE220': 'Data Structure',
  'CSE221': 'Algorithm Analysis & Design',
  'CSE230': 'Discrete Mathematics',
  'CSE250': 'Circuits and Electronics',
  'CSE251': 'Electronic Devices and Circuits',
  'CSE260': 'Digital Logic Design',
  'CSE320': 'Data Communications',
  'CSE321': 'Operating Systems',
  'CSE330': 'Numerical Methods',
  'CSE331': 'Automata and Computability',
  'CSE340': 'Computer Architecture',
  'CSE341': 'MICROPROCESSORS',
  'CSE350': 'Digital Electronics and Pulse Techniques',
  'CSE360': 'Computer Interfacing',
  'CSE370': 'Database Management',
  'CSE391': 'Programming for the Internet',
  'CSE400': 'Final Year Design Project',
  'CSE420': 'Compiler Design',
  'CSE421': 'Computer Networks',
  'CSE422': 'Artificial Intelligence',
  'CSE423': 'Computer Graphics',
  'CSE424': 'Pattern Recognition',
  'CSE425': 'Neural Network',
  'CSE426': 'Advanced Algorithms',
  'CSE427': 'Machine Learning',
  'CSE428': 'Image Processing',
  'CSE437': 'Data Science: Coding With Real-World Data',
  'CSE440': 'Natural Language Processing (NLP) II',
  'CSE443': 'Bioinformatics I',
  'CSE446': 'Blockchain and Cryptocurrencies',
  'CSE447': 'Cryptography and Cryptoanalysis',
  'CSE460': 'VLSI Design',
  'CSE461': 'Introduction to Robotics',
  'CSE470': 'Software Engineering',
  'CSE471': 'System Analysis and Design',
  'CSE472': 'Human Computer Interface',
  'CSE481': 'Quantum Computing I',
  'CSE489': 'Android App Development',
  'CSE490A': 'Gamification: Engineering User Engagement',
  'CSE490B': 'Introduction to Cybersecurity',
  'CSE490C': 'Quantum Computing III',
  'CSE490D': 'Introduction to Football Data and Analytics',
  // ─── Common Non-CSE Courses ────────────────────────
  'MAT110': 'Mathematics I: Differential Calculus & Coordinate Geometry',
  'MAT120': 'Mathematics II: Integral Calculus & Differential Equations',
  'MAT215': 'Mathematics III: Complex Variables & Laplace Transforms',
  'MAT216': 'Mathematics IV: Linear Algebra & Fourier Analysis',
  'PHY111': 'Physics I: Principles of Physics I',
  'PHY112': 'Physics II: Principles of Physics II',
  'ENG101': 'English Fundamentals',
  'ENG102': 'English Composition and Communication Skills',
  'STA201': 'Statistics for Science and Engineering',
};

/**
 * Look up a course title by its code.
 * Returns the title string or null if not found.
 */
export function getCourseTitleByCode(code) {
  if (!code) return null;
  const normalized = code.toUpperCase().trim();
  return COURSE_MAP[normalized] || null;
}

/**
 * Get the full course dictionary (for autocomplete, etc.)
 */
export function getAllCourses() {
  return COURSE_MAP;
}

/**
 * Pick the faculty to show for a LAB.
 * USIS often lists the lab faculty as "TBA" (or leaves it blank) before it's
 * assigned, so in those cases fall back to the theory faculty.
 */
export function resolveLabFaculty(labInstructor, theoryFaculty) {
  const lab = (labInstructor || '').trim();
  const isReal = lab && !['TBA', 'N/A'].includes(lab.toUpperCase());
  return isReal ? lab : (theoryFaculty || '');
}

export default COURSE_MAP;
