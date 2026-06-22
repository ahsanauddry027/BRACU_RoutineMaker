import React from 'react';
import { DAYS } from '../constants/schedule';
import GridCell from './GridCell';

/**
 * The 7-day routine table (no toolbar). Shared by the desktop RoutineGrid
 * and the mobile off-screen capture used for PNG export.
 */
export default function RoutineTable({ entries, timeSlots, onCellClick, onCardClick }) {
  // Find the entry occupying a given (day, slotId).
  const getCellData = (day, slotId) => {
    for (const entry of entries) {
      if (!entry.days.includes(day)) continue;

      if (entry.type === 'LAB') {
        if (entry.startSlot === slotId) {
          return { entry, isLabStart: true, isLabContinuation: false };
        }
        if (entry.endSlot === slotId) {
          return { entry: null, isLabStart: false, isLabContinuation: true };
        }
      } else if (entry.startSlot === slotId) {
        return { entry, isLabStart: false, isLabContinuation: false };
      }
    }
    return { entry: null, isLabStart: false, isLabContinuation: false };
  };

  return (
    <table className="routine-grid">
      <thead>
        <tr>
          <th>Time</th>
          {DAYS.map((day) => (
            <th key={day}>{day}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((slot) => (
          <tr key={slot.id}>
            <td className="time-cell">
              {slot.start}
              <br />–<br />
              {slot.end}
            </td>
            {DAYS.map((day) => {
              const { entry, isLabStart, isLabContinuation } = getCellData(day, slot.id);
              return (
                <GridCell
                  key={`${day}-${slot.id}`}
                  day={day}
                  slotId={slot.id}
                  entry={entry}
                  isLabStart={isLabStart}
                  isLabContinuation={isLabContinuation}
                  onCellClick={onCellClick}
                  onCardClick={onCardClick}
                  timeSlots={timeSlots}
                />
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
