import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
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
   * Download the grid as PNG using html-to-image.
   */
  const handleDownloadPNG = async () => {
    if (!gridRef.current) return;

    try {
      // Temporarily expand the grid for capture
      const wrapper = gridRef.current.querySelector('.routine-grid-wrapper');
      const origOverflow = wrapper?.style.overflow;
      const origWidth = gridRef.current.style.width;
      const origMaxWidth = gridRef.current.style.maxWidth;

      if (wrapper) wrapper.style.overflow = 'visible';
      gridRef.current.style.width = '1400px';
      gridRef.current.style.maxWidth = 'none';

      // Warm-up pass: html-to-image sometimes misses fonts on the first render
      await toPng(gridRef.current, { pixelRatio: 1 }).catch(() => {});

      // High-resolution capture (4x pixel ratio → ~5600px wide)
      const dataUrl = await toPng(gridRef.current, {
        pixelRatio: 4,
        backgroundColor: '#0f172a',
        style: {
          borderRadius: '0',
          boxShadow: 'none',
        },
        filter: (node) => {
          // Exclude the toolbar buttons from the exported image
          if (node.classList && node.classList.contains('toolbar-buttons')) {
            return false;
          }
          return true;
        },
      });

      // Restore original styles
      if (wrapper) wrapper.style.overflow = origOverflow || '';
      gridRef.current.style.width = origWidth || '';
      gridRef.current.style.maxWidth = origMaxWidth || '';

      // Download using data URL directly (blob URLs lose the filename)
      const link = document.createElement('a');
      link.download = 'university-routine.png';
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export as PNG. Please try again.');
    }
  };

  return (
    <div ref={gridRef} className="routine-capture-area">
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

      {/* Signature */}
      <div className="signature">
        Created by <span>Ahsan Auddry</span>
      </div>
    </div>
  );
}
