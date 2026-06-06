import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { DAYS } from '../constants/schedule';
import GridCell from './GridCell';

/**
 * Main schedule grid component.
 *
 * Props:
 * - entries: array of all routine entries
 * - timeSlots: array of { id, start, end } (dynamic)
 * - onCellClick: (day, slotId) => void
 * - onCardClick: (entry) => void
 * - onClearAll: () => void
 * - onEditTimeSlots: () => void
 */
export default function RoutineGrid({ entries, timeSlots, onCellClick, onCardClick, onClearAll, onEditTimeSlots }) {
  const gridRef = useRef(null);

  /**
   * Find the entry that occupies a given (day, slotId).
   * Returns { entry, isLabStart, isLabContinuation }
   */
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
      } else {
        // THEORY
        if (entry.startSlot === slotId) {
          return { entry, isLabStart: false, isLabContinuation: false };
        }
      }
    }
    return { entry: null, isLabStart: false, isLabContinuation: false };
  };

  /**
   * Download the grid as PNG using html2canvas.
   */
  const handleDownloadPNG = async () => {
    if (!gridRef.current) return;

    try {
      const canvas = await html2canvas(gridRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        width: gridRef.current.scrollWidth,
        height: gridRef.current.scrollHeight,
        windowWidth: gridRef.current.scrollWidth,
        windowHeight: gridRef.current.scrollHeight,
      });

      const link = document.createElement('a');
      link.download = 'university-routine.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export as PNG. Please try again.');
    }
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="toolbar">
        <h1>📅 University Routine Builder</h1>
        <div className="toolbar-buttons">
          <button
            className="toolbar-btn btn-settings"
            onClick={onEditTimeSlots}
            title="Edit time slots"
            id="btn-edit-timeslots"
          >
            ⏰ Time Slots
          </button>
          <button
            className="toolbar-btn btn-download"
            onClick={handleDownloadPNG}
            title="Download schedule as PNG"
            id="btn-download-png"
          >
            📥 Download PNG
          </button>
          <button
            className="toolbar-btn btn-clear"
            onClick={onClearAll}
            title="Clear all classes"
            id="btn-clear-all"
          >
            🗑️ Clear All
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="routine-grid-wrapper">
        <table className="routine-grid" ref={gridRef}>
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
                {/* Time column */}
                <td className="time-cell">
                  {slot.start}
                  <br />–<br />
                  {slot.end}
                </td>

                {/* Day columns */}
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
      </div>
    </div>
  );
}
