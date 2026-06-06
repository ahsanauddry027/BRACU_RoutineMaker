import { COLOR_PALETTE } from '../constants/schedule';

// Stores the mapping: courseCode → palette index
const courseColorMap = new Map();

/**
 * Get a consistent color object for a course code.
 * Same course code always returns the same color.
 * Colors are assigned in insertion order, cycling through the palette.
 */
export function getCourseColor(courseCode) {
  if (!courseCode) {
    return COLOR_PALETTE[0];
  }

  const code = courseCode.toUpperCase().trim();

  if (!courseColorMap.has(code)) {
    const index = courseColorMap.size % COLOR_PALETTE.length;
    courseColorMap.set(code, index);
  }

  return COLOR_PALETTE[courseColorMap.get(code)];
}

/**
 * Rebuild the color map from an array of entries.
 * Call this on initial load to restore consistent ordering.
 */
export function rebuildColorMap(entries) {
  courseColorMap.clear();
  // Collect unique course codes in order of first appearance
  const seen = new Set();
  for (const entry of entries) {
    const code = entry.courseCode.toUpperCase().trim();
    if (!seen.has(code)) {
      seen.add(code);
      const index = courseColorMap.size % COLOR_PALETTE.length;
      courseColorMap.set(code, index);
    }
  }
}

/**
 * Clear the color map (used when clearing all entries).
 */
export function clearColorMap() {
  courseColorMap.clear();
}
