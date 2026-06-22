export const TIME_SLOTS = [
  { id: 1, start: '08:00 AM', end: '09:20 AM' },
  { id: 2, start: '09:30 AM', end: '10:50 AM' },
  { id: 3, start: '11:00 AM', end: '12:20 PM' },
  { id: 4, start: '12:30 PM', end: '01:50 PM' },
  { id: 5, start: '02:00 PM', end: '03:20 PM' },
  { id: 6, start: '03:30 PM', end: '04:50 PM' },
  { id: 7, start: '05:00 PM', end: '06:20 PM' },
];

// ─── Valid Lab Start Slots (3-hour blocks) ────────────
// Labs span 2 consecutive 1.5-hour slots (= 3 hours)
// Only 3 valid start positions:
//   Slot 1 → 08:00 AM – 11:00 AM
//   Slot 3 → 11:00 AM – 02:00 PM
//   Slot 5 → 02:00 PM – 05:00 PM
export const LAB_START_SLOTS = [1, 3, 5];

// ─── Days of the Week ─────────────────────────────────
export const DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

// ─── Theory Day Pairs ─────────────────────────────────
// Sunday ↔ Tuesday, Monday ↔ Wednesday, Thursday ↔ Saturday
// Friday has NO pair → theory not allowed on Friday
export const DAY_PAIRS = {
  Sunday: 'Tuesday',
  Tuesday: 'Sunday',
  Monday: 'Wednesday',
  Wednesday: 'Monday',
  Thursday: 'Saturday',
  Saturday: 'Thursday',
};

// ─── Color Palette (per course code) ──────────────────
export const COLOR_PALETTE = [
  { bg: '#FFF8E1', border: '#F9A825', badge: '#F57F17', text: '#5D4037' },  // amber
  { bg: '#E8F5E9', border: '#43A047', badge: '#2E7D32', text: '#1B5E20' },  // green
  { bg: '#E0F7FA', border: '#00ACC1', badge: '#00838F', text: '#004D40' },  // cyan/teal
  { bg: '#EDE7F6', border: '#7E57C2', badge: '#4527A0', text: '#311B92' },  // purple
  { bg: '#FCE4EC', border: '#EC407A', badge: '#AD1457', text: '#880E4F' },  // pink
  { bg: '#E3F2FD', border: '#42A5F5', badge: '#1565C0', text: '#0D47A1' },  // blue
  { bg: '#FFF3E0', border: '#FF7043', badge: '#D84315', text: '#BF360C' },  // orange
  { bg: '#F1F8E9', border: '#9CCC65', badge: '#558B2F', text: '#33691E' },  // lime
  { bg: '#F3E5F5', border: '#AB47BC', badge: '#7B1FA2', text: '#4A148C' },  // deep purple
  { bg: '#E8EAF6', border: '#5C6BC0', badge: '#283593', text: '#1A237E' },  // indigo
];

/**
 * Get the paired day for theory classes.
 * Returns null if the day is Friday (no theory pairing).
 */
export function getPairedDay(day) {
  return DAY_PAIRS[day] || null;
}

/**
 * Check if a day is Friday (theory not allowed).
 */
export function isFriday(day) {
  return day === 'Friday';
}

/**
 * Get a slot by its ID.
 * Optionally pass a custom slots array (for dynamic time slots).
 */
export function getSlotById(slotId, slots = TIME_SLOTS) {
  return slots.find((s) => s.id === slotId);
}

/**
 * Get the merged time range for a lab (startSlot to startSlot+1).
 * Optionally pass a custom slots array.
 */
export function getLabTimeRange(startSlotId, slots = TIME_SLOTS) {
  const startSlot = getSlotById(startSlotId, slots);
  const endSlot = getSlotById(startSlotId + 1, slots);
  if (!startSlot || !endSlot) return null;
  return `${startSlot.start} - ${endSlot.end}`;
}

/**
 * Get valid lab start slot IDs from a slots array.
 * A lab spans 2 consecutive slots, and starts are taken every other slot so
 * labs tile cleanly without fragmenting the grid (e.g. 7 slots → [1, 3, 5]).
 */
export function getLabStartSlots(slots = TIME_SLOTS) {
  if (!slots || slots.length < 2) return [];
  const result = [];
  // Step by 2; stop before the last slot since a lab needs a following slot
  for (let i = 0; i < slots.length - 1; i += 2) {
    result.push(slots[i].id);
  }
  return result;
}
