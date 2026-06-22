import React, { useMemo } from 'react';
import { getCourseColor } from '../utils/colors';

/**
 * Exam Schedule section — displays all exams grouped by date.
 * Dates with 2+ exams are highlighted in RED as conflicts.
 *
 * Props:
 * - exams: array of exam entries
 * - onAddExam: () => void
 * - onEditExam: (exam) => void
 * - onClearExams: () => void
 */
export default function ExamSchedule({ exams, onAddExam, onEditExam, onClearExams, isMobile = false }) {
  // Group exams by date and detect conflicts
  const { groupedExams, conflictDates } = useMemo(() => {
    const groups = {};
    const dateCounts = {};

    for (const exam of exams) {
      if (!groups[exam.examDate]) {
        groups[exam.examDate] = [];
        dateCounts[exam.examDate] = 0;
      }
      groups[exam.examDate].push(exam);
      dateCounts[exam.examDate]++;
    }

    const conflicts = new Set();
    for (const [date, count] of Object.entries(dateCounts)) {
      if (count >= 2) conflicts.add(date);
    }

    return { groupedExams: groups, conflictDates: conflicts };
  }, [exams]);

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

      {/* Conflict legend */}
      {conflictDates.size > 0 && (
        <div className="exam-conflict-legend">
          <span className="conflict-dot"></span>
          <span>Red rows indicate exam date conflicts (2+ exams on the same day)</span>
        </div>
      )}

      {/* Exam list */}
      {exams.length === 0 ? (
        <div className="exam-empty">
          <p>No exams scheduled yet. Click <strong>Add Exam</strong> to get started.</p>
        </div>
      ) : isMobile ? (
        <div className="exam-cards">
          {sortedDates.map((date) =>
            groupedExams[date].map((exam, idx) => {
              const isConflict = conflictDates.has(date);
              const color = getCourseColor(exam.courseCode);
              return (
                <button
                  key={exam._id || exam.id || `${date}-${idx}`}
                  className={`exam-card ${isConflict ? 'exam-card-conflict' : ''}`}
                  onClick={() => onEditExam(exam)}
                >
                  <div className="exam-card-row">
                    <span
                      className="exam-course-badge"
                      style={{ backgroundColor: color.bg, borderColor: color.border, color: color.text }}
                    >
                      {exam.courseCode}
                    </span>
                    {isConflict ? (
                      <span className="conflict-badge">⚠️ CONFLICT</span>
                    ) : (
                      <span className="ok-badge">✅ OK</span>
                    )}
                  </div>
                  <div className="exam-card-line">📅 {formatDate(date)}</div>
                  <div className="exam-card-line">🕐 {formatTime(exam.examTime)} &nbsp;·&nbsp; 📍 {exam.room}</div>
                  {exam.notes && <div className="exam-card-line muted">📝 {exam.notes}</div>}
                </button>
              );
            })
          )}
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
                  const isConflict = conflictDates.has(date);
                  const color = getCourseColor(exam.courseCode);

                  return (
                    <tr
                      key={exam._id || exam.id || `${date}-${idx}`}
                      className={`exam-row ${isConflict ? 'exam-conflict' : ''}`}
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
                        {isConflict ? (
                          <span className="conflict-badge">⚠️ CONFLICT</span>
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
