import React, { useState, useRef, useMemo } from 'react';
import { DAYS, getLabTimeRange, isFriday } from '../constants/schedule';
import { getCourseColor } from '../utils/colors';
import { getCourseTitleByCode } from '../constants/courses';
import RoutineTable from './RoutineTable';
import { exportNodeToPng } from '../utils/exportPng';

/**
 * Mobile app view: one day at a time, timeline-style agenda.
 * Distinct from the desktop RoutineGrid; same handlers/data.
 */
export default function MobileRoutine({
  entries,
  timeSlots,
  onCellClick,
  onCardClick,
  onClearAll,
  onEditTimeSlots,
  onRefreshCourses,
  cacheStatus,
  isRefreshing,
}) {
  // JS getDay() is Sun=0..Sat=6, which lines up with the DAYS array
  const today = DAYS[new Date().getDay()] || 'Sunday';
  const [selectedDay, setSelectedDay] = useState(today);
  const [menuOpen, setMenuOpen] = useState(false);
  const captureRef = useRef(null);

  // Count classes per day (for the day-pill badges)
  const countsByDay = useMemo(() => {
    const counts = {};
    for (const day of DAYS) counts[day] = 0;
    for (const e of entries) {
      for (const d of e.days || []) {
        if (counts[d] !== undefined) counts[d] += 1;
      }
    }
    return counts;
  }, [entries]);

  // Build the agenda rows for the selected day
  const rows = useMemo(() => {
    const result = [];
    for (const slot of timeSlots) {
      let cell = { entry: null, isLabStart: false, isLabContinuation: false };
      for (const entry of entries) {
        if (!entry.days.includes(selectedDay)) continue;
        if (entry.type === 'LAB') {
          if (entry.startSlot === slot.id) { cell = { entry, isLabStart: true }; break; }
          if (entry.endSlot === slot.id) { cell = { entry: null, isLabContinuation: true }; break; }
        } else if (entry.startSlot === slot.id) {
          cell = { entry, isLabStart: false }; break;
        }
      }
      if (cell.isLabContinuation) continue; // lab already rendered on its start row
      result.push({ slot, ...cell });
    }
    return result;
  }, [entries, timeSlots, selectedDay]);

  const handleDownloadPNG = async () => {
    setMenuOpen(false);
    if (!captureRef.current) return;
    try {
      await exportNodeToPng(captureRef.current, 'bracu-routine.png');
    } catch (err) {
      console.error('PNG export failed:', err);
      alert('Failed to export as PNG. Please try again.');
    }
  };

  // FAB: add to the first empty slot of the selected day (or slot 1)
  const handleFabAdd = () => {
    if (isFriday(selectedDay)) return;
    const firstEmpty = rows.find((r) => !r.entry && !r.isLabContinuation);
    onCellClick(selectedDay, firstEmpty ? firstEmpty.slot.id : timeSlots[0]?.id || 1);
  };

  const renderCard = (entry) => {
    const color = getCourseColor(entry.courseCode);
    const isLab = entry.type === 'LAB';
    const title = entry.courseTitle || getCourseTitleByCode(entry.courseCode) || '';
    return (
      <button
        className={`m-card ${isLab ? 'm-card-lab' : ''}`}
        style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}
        onClick={() => onCardClick(entry)}
      >
        <div className="m-card-top">
          <span className="m-card-code">{entry.courseCode}</span>
          <span className="m-card-badge" style={{ borderColor: color.border }}>{entry.type}</span>
          {isLab && <span className="m-card-badge" style={{ borderColor: color.border }}>3h</span>}
        </div>
        {title && <div className="m-card-title">{title}</div>}
        <div className="m-card-meta">
          Sec {entry.section} · {entry.faculty} · {entry.room}
        </div>
        {isLab && (
          <div className="m-card-range">🕐 {getLabTimeRange(entry.startSlot, timeSlots)}</div>
        )}
      </button>
    );
  };

  return (
    <div className="m-shell">
      {/* App bar */}
      <header className="m-appbar">
        <div className="m-appbar-brand">
          <img src="/bracu.png" alt="" className="m-appbar-logo" />
          <div>
            <div className="m-appbar-title">BRACU Routine</div>
            {cacheStatus && <div className="m-appbar-sub">{cacheStatus.status}</div>}
          </div>
        </div>
        <button className="m-icon-btn" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">
          ⋯
        </button>

        {menuOpen && (
          <>
            <div className="m-menu-scrim" onClick={() => setMenuOpen(false)} />
            <div className="m-menu">
              <button onClick={() => { setMenuOpen(false); onEditTimeSlots(); }}>⏰ Time Slots</button>
              <button onClick={handleDownloadPNG}>⬇️ Download PNG</button>
              {onRefreshCourses && (
                <button onClick={() => { setMenuOpen(false); onRefreshCourses(); }} disabled={isRefreshing}>
                  {isRefreshing ? '⟳ Refreshing…' : '🔄 Refresh Data'}
                </button>
              )}
              <button className="m-menu-danger" onClick={() => { setMenuOpen(false); onClearAll(); }}>🗑️ Clear All</button>
            </div>
          </>
        )}
      </header>

      {/* Day selector */}
      <nav className="m-days">
        {DAYS.map((day) => (
          <button
            key={day}
            className={`m-day ${selectedDay === day ? 'active' : ''} ${isFriday(day) ? 'holiday' : ''}`}
            onClick={() => setSelectedDay(day)}
          >
            <span className="m-day-name">{day.slice(0, 3)}</span>
            {countsByDay[day] > 0 && <span className="m-day-count">{countsByDay[day]}</span>}
          </button>
        ))}
      </nav>

      {/* Agenda */}
      <main className="m-agenda">
        {isFriday(selectedDay) ? (
          <div className="m-holiday-card">🌙 Friday is a weekend — no classes scheduled.</div>
        ) : (
          rows.map(({ slot, entry, isLabStart }) => (
            <div className={`m-slot ${isLabStart ? 'm-slot-lab' : ''}`} key={slot.id}>
              <div className="m-slot-time">
                <span>{slot.start}</span>
                <span className="m-slot-dot" />
                <span>{slot.end}</span>
              </div>
              <div className="m-slot-body">
                {entry ? (
                  renderCard(entry)
                ) : (
                  <button className="m-empty" onClick={() => onCellClick(selectedDay, slot.id)}>
                    ＋ Add class
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </main>

      {/* Floating add button */}
      {!isFriday(selectedDay) && (
        <button className="m-fab" onClick={handleFabAdd} aria-label="Add class">＋</button>
      )}

      {/* Hidden full-week grid, used only for PNG export.
          Wrapped in a zero-size clipping host so its 1400px width can't
          create page-level horizontal overflow. */}
      <div className="m-capture-host" aria-hidden="true">
        <div ref={captureRef} className="routine-capture-area m-capture">
          <div className="toolbar">
            <div className="header-with-logo">
              <img src="/bracu.png" alt="BRACU Logo" className="bracu-logo" />
              <h1>BRACU Routine Builder</h1>
            </div>
          </div>
          <div className="routine-grid-wrapper" style={{ overflow: 'visible' }}>
            <RoutineTable entries={entries} timeSlots={timeSlots} />
          </div>
          <div className="signature">Created by <span>Ahsan Auddry</span></div>
        </div>
      </div>
    </div>
  );
}
