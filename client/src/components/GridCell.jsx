import React from 'react';
import ClassCard from './ClassCard';

/**
 * Renders a single grid cell.
 *
 * - If the cell has an entry → renders ClassCard
 * - If empty → renders clickable empty cell
 * - If the cell is the 2nd slot of a lab → returns null (handled by rowSpan)
 *
 * Props:
 * - day: string
 * - slotId: number (1-7)
 * - entry: entry object or null
 * - isLabContinuation: boolean — true if this cell is spanned by a lab above
 * - isLabStart: boolean — true if this cell starts a lab
 * - onCellClick: (day, slotId) => void — for empty cells
 * - onCardClick: (entry) => void — for occupied cells
 */
export default function GridCell({
  day,
  slotId,
  entry,
  isLabContinuation,
  isLabStart,
  onCellClick,
  onCardClick,
  timeSlots = [],
}) {
  // If this cell is spanned by a lab starting above, don't render <td>
  if (isLabContinuation) {
    return null;
  }

  // Lab start cell gets rowSpan=2
  if (isLabStart && entry) {
    return (
      <td className="lab-cell" rowSpan={2}>
        <ClassCard entry={entry} onClick={onCardClick} timeSlots={timeSlots} />
      </td>
    );
  }

  // Normal occupied cell (theory)
  if (entry) {
    return (
      <td>
        <ClassCard entry={entry} onClick={onCardClick} timeSlots={timeSlots} />
      </td>
    );
  }

  // Empty cell
  return (
    <td
      className="empty-cell"
      onClick={() => onCellClick(day, slotId)}
    />
  );
}
