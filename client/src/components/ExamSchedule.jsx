import React, { useMemo } from 'react';
import { getCourseColor } from '../utils/colors';

/**
 * Exam Schedule section — displays all exams grouped by date.
 *  - Same date AND same time  → RED conflict (also blocked when adding).
 *  - Same date, different time → YELLOW warning (allowed).
 *
 * Props:
 * - exams: array of exam entries
 * - onAddExam: () => void
 * - onEditExam: (exam) => void
 * - onClearExams: () => void
 */
export default function ExamSchedule({ exams, onAddExam, onEditExam, onClearExams }) {
  // Group exams by date; flag same-date+time as conflicts and same-date as warnings
  const { groupedExams, timeConflictKeys, warningDates } = useMemo(() => {
    const groups = {};
    const dateCounts = {};
    const dateTimeCounts = {};

    for (const exam of exams) {
      if (!groups[exam.examDate]) {
        groups[exam.examDate] = [];
        dateCounts[exam.examDate] = 0;
      }
      groups[exam.examDate].push(exam);
      dateCounts[exam.examDate]++;
      const key = `${exam.examDate}__${exam.examTime}`;
      dateTimeCounts[key] = (dateTimeCounts[key] || 0) + 1;
    }

    const timeConflicts = new Set();
    for (const [key, count] of Object.entries(dateTimeCounts)) {
      if (count >= 2) timeConflicts.add(key);
    }
    const warnings = new Set();
    for (const [date, count] of Object.entries(dateCounts)) {
      if (count >= 2) warnings.add(date);
    }

    return { groupedExams: groups, timeConflictKeys: timeConflicts, warningDates: warnings };
  }, [exams]);

  // Per-exam status: 'conflict' (same date+time) | 'warning' (same day) | 'ok'
  const statusOf = (exam) => {
    if (timeConflictKeys.has(`${exam.examDate}__${exam.examTime}`)) return 'conflict';
    if (warningDates.has(exam.examDate)) return 'warning';
    return 'ok';
  };
  const hasConflict = timeConflictKeys.size > 0;
  const hasWarning = warningDates.size > 0;

  // Sort dates
  const sortedDates = Object.keys(groupedExams).sort();

  // Format date for display
  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Format 24h time to 12h AM/PM
  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const h = hours % 12 || 12;
      return `${String(h).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    } catch {
      return timeStr;
    }
  };

  return (
    <div className="exam-section">
      {/* Header */}
      <div className="exam-header">
        <h2>📋 Exam Schedule</h2>
        <div className="toolbar-buttons">
          <button className="toolbar-btn btn-add-exam" onClick={onAddExam} id="btn-add-exam">
            ➕ Add Exam
          </button>
          {exams.length > 0 && (
            <button className="toolbar-btn btn-clear" onClick={onClearExams} id="btn-clear-exams">
              🗑️ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      {(hasConflict || hasWarning) && (
        <div className="exam-conflict-legend">
          {hasConflict && (
            <span className="legend-item">
              <span className="conflict-dot"></span>
              Red = conflict (two exams at the same date <strong>and</strong> time)
            </span>
          )}
          {hasWarning && (
            <span className="legend-item">
              <span className="warning-dot"></span>
              Yellow = same day, different time (just a heads-up)
            </span>
          )}
        </div>
      )}

      {/* Exam list */}
      {exams.length === 0 ? (
        <div className="exam-empty">
          <p>No exams scheduled yet. Click <strong>Add Exam</strong> to get started.</p>
        </div>
      ) : (
        <div className="exam-table-wrapper">
          <table className="exam-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Course</th>
                <th>Room</th>
                <th>Notes</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedDates.map((date) =>
                groupedExams[date].map((exam, idx) => {
                  const status = statusOf(exam);
                  const color = getCourseColor(exam.courseCode);

                  return (
                    <tr
                      key={exam._id || exam.id || `${date}-${idx}`}
                      className={`exam-row ${status === 'conflict' ? 'exam-conflict' : status === 'warning' ? 'exam-warning' : ''}`}
                      onClick={() => onEditExam(exam)}
                      title="Click to edit"
                    >
                      <td className="exam-date-cell">
                        <span className="exam-date-text">{formatDate(date)}</span>
                      </td>
                      <td className="exam-time-cell">
                        {formatTime(exam.examTime)}
                      </td>
                      <td>
                        <span
                          className="exam-course-badge"
                          style={{
                            backgroundColor: color.bg,
                            borderColor: color.border,
                            color: color.text,
                          }}
                        >
                          {exam.courseCode}
                        </span>
                      </td>
                      <td className="exam-room-cell">📍 {exam.room}</td>
                      <td className="exam-notes-cell">{exam.notes || '—'}</td>
                      <td>
                        {status === 'conflict' ? (
                          <span className="conflict-badge">⚠️ CONFLICT</span>
                        ) : status === 'warning' ? (
                          <span className="warning-badge">🟡 SAME DAY</span>
                        ) : (
                          <span className="ok-badge">✅ OK</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
