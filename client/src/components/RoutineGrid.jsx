import React, { useRef } from 'react';
import RoutineTable from './RoutineTable';
import { exportNodeToPng } from '../utils/exportPng';

/**
 * Desktop / website schedule view: toolbar + full 7-day grid + PNG export.
 * (The mobile app uses MobileRoutine instead.)
 */
export default function RoutineGrid({ entries, timeSlots, onCellClick, onCardClick, onClearAll, onEditTimeSlots, onRefreshCourses, cacheStatus, isRefreshing }) {
  const gridRef = useRef(null);

  const handleDownloadPNG = async () => {
    if (!gridRef.current) return;
    try {
      // Temporarily expand the grid so the capture isn't clipped
      const wrapper = gridRef.current.querySelector('.routine-grid-wrapper');
      const origOverflow = wrapper?.style.overflow;
      const origWidth = gridRef.current.style.width;
      const origMaxWidth = gridRef.current.style.maxWidth;

      if (wrapper) wrapper.style.overflow = 'visible';
      gridRef.current.style.width = '1400px';
      gridRef.current.style.maxWidth = 'none';

      await exportNodeToPng(gridRef.current, 'bracu-routine.png');

      if (wrapper) wrapper.style.overflow = origOverflow || '';
      gridRef.current.style.width = origWidth || '';
      gridRef.current.style.maxWidth = origMaxWidth || '';
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export as PNG. Please try again.');
    }
  };

  return (
    <div ref={gridRef} className="routine-capture-area">
      {/* Toolbar */}
      <div className="toolbar">
        <div className="header-with-logo">
          <img src="/bracu.png" alt="BRACU Logo" className="bracu-logo" />
          <h1>BRACU Routine Builder</h1>
        </div>
        <div className="toolbar-buttons">
          <button className="toolbar-btn btn-settings" onClick={onEditTimeSlots} title="Edit time slots" id="btn-edit-timeslots">
            Time Slots
          </button>
          <button className="toolbar-btn btn-download" onClick={handleDownloadPNG} title="Download schedule as PNG" id="btn-download-png">
            Download PNG
          </button>
          {onRefreshCourses && (
            <button
              className={`toolbar-btn btn-refresh ${isRefreshing ? 'loading' : ''}`}
              onClick={onRefreshCourses}
              disabled={isRefreshing}
              title={cacheStatus ? `Last updated: ${cacheStatus.lastCachedDate}\nNext auto-refresh: ${cacheStatus.nextRefreshDate}` : 'Refresh course data'}
              id="btn-refresh-courses"
            >
              {isRefreshing ? '⟳ Refreshing...' : 'Refresh Data'}
            </button>
          )}
          <button className="toolbar-btn btn-clear" onClick={onClearAll} title="Clear all classes" id="btn-clear-all">
            Clear All
          </button>
          {cacheStatus && (
            <div className="cache-status">
              <span className="cache-info" title={`Next refresh: ${cacheStatus.nextRefreshDate}`}>
                {cacheStatus.status}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="routine-grid-wrapper">
        <RoutineTable
          entries={entries}
          timeSlots={timeSlots}
          onCellClick={onCellClick}
          onCardClick={onCardClick}
        />
      </div>

      {/* Signature */}
      <div className="signature">
        Created by <span>Ahsan Auddry</span>
      </div>
    </div>
  );
}
