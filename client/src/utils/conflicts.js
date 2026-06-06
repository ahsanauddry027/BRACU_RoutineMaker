import { getPairedDay, isFriday } from '../constants/schedule';

/**
 * Check for conflicts when placing a THEORY class.
 *
 * Theory rules:
 * - Cannot be placed on Friday
 * - Occupies the same slot on BOTH paired days
 * - If either paired day's slot is already taken → conflict
 *
 * @param {Array} entries - All current routine entries
 * @param {string} day - The clicked day
 * @param {number} slotId - The time slot ID (1-7)
 * @param {string|null} excludeId - Entry ID to exclude (for editing)
 * @returns {{ hasConflict: boolean, message: string }}
 */
export function checkTheoryConflict(entries, day, slotId, excludeId = null) {
  // Rule: No theory on Friday
  if (isFriday(day)) {
    return {
      hasConflict: true,
      message: 'Theory classes cannot be scheduled on Friday. Friday is available for Labs only.',
    };
  }

  const pairedDay = getPairedDay(day);
  if (!pairedDay) {
    return {
      hasConflict: true,
      message: `"${day}" has no theory pair defined.`,
    };
  }

  // Check both the clicked day and its pair
  const daysToCheck = [day, pairedDay];

  for (const checkDay of daysToCheck) {
    const conflict = entries.find((entry) => {
      if (excludeId && (entry._id === excludeId || entry.id === excludeId)) {
        return false;
      }
      // Entry occupies this day?
      if (!entry.days.includes(checkDay)) return false;

      // Check slot overlap
      if (entry.type === 'LAB') {
        // Lab spans startSlot and startSlot+1
        return slotId >= entry.startSlot && slotId <= entry.endSlot;
      } else {
        // Theory occupies exactly one slot
        return entry.startSlot === slotId;
      }
    });

    if (conflict) {
      return {
        hasConflict: true,
        message: `Conflict on ${checkDay}: Slot is already occupied by ${conflict.courseCode} (${conflict.type}).`,
      };
    }
  }

  return { hasConflict: false, message: '' };
}

/**
 * Check for conflicts when placing a LAB class.
 *
 * Lab rules:
 * - Spans 2 consecutive slots (startSlot and startSlot+1)
 * - Can be placed on any day
 * - Both slots must be free
 *
 * @param {Array} entries - All current routine entries
 * @param {string} day - The selected day
 * @param {number} startSlot - The starting slot ID (1-6)
 * @param {string|null} excludeId - Entry ID to exclude (for editing)
 * @returns {{ hasConflict: boolean, message: string }}
 */
export function checkLabConflict(entries, day, startSlot, excludeId = null) {
  if (startSlot < 1 || startSlot > 6) {
    return {
      hasConflict: true,
      message: 'Lab must start at slot 1–6 (needs 2 consecutive slots).',
    };
  }

  const endSlot = startSlot + 1;
  const slotsNeeded = [startSlot, endSlot];

  for (const slotId of slotsNeeded) {
    const conflict = entries.find((entry) => {
      if (excludeId && (entry._id === excludeId || entry.id === excludeId)) {
        return false;
      }
      if (!entry.days.includes(day)) return false;

      if (entry.type === 'LAB') {
        // Lab spans entry.startSlot to entry.endSlot
        return slotId >= entry.startSlot && slotId <= entry.endSlot;
      } else {
        // Theory occupies exactly its startSlot
        return entry.startSlot === slotId;
      }
    });

    if (conflict) {
      return {
        hasConflict: true,
        message: `Conflict on ${day} at slot ${slotId}: Already occupied by ${conflict.courseCode} (${conflict.type}).`,
      };
    }
  }

  return { hasConflict: false, message: '' };
}

/**
 * General conflict check — delegates to theory or lab checker.
 */
export function checkConflict(entries, type, day, startSlot, excludeId = null) {
  if (type === 'THEORY') {
    return checkTheoryConflict(entries, day, startSlot, excludeId);
  } else {
    return checkLabConflict(entries, day, startSlot, excludeId);
  }
}
