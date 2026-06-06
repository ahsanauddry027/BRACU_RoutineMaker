import React, { useState, useEffect } from 'react';

/**
 * Modal for adding / editing / deleting an exam entry.
 *
 * Props:
 * - mode: 'add' | 'edit'
 * - exam: existing exam data (for edit mode)
 * - onSave: (formData) => void
 * - onDelete: (examId) => void
 * - onClose: () => void
 */
export default function ExamModal({ mode, exam, onSave, onDelete, onClose }) {
  const isEdit = mode === 'edit';

  const [courseCode, setCourseCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEdit && exam) {
      setCourseCode(exam.courseCode || '');
      setExamDate(exam.examDate || '');
      setExamTime(exam.examTime || '');
      setRoom(exam.room || '');
      setNotes(exam.notes || '');
    }
  }, [isEdit, exam]);

  const handleSave = () => {
    setError('');

    if (!courseCode.trim()) {
      setError('Course code is required.');
      return;
    }
    if (!examDate) {
      setError('Exam date is required.');
      return;
    }
    if (!examTime) {
      setError('Exam time is required.');
      return;
    }
    if (!room.trim()) {
      setError('Room is required.');
      return;
    }

    onSave({
      courseCode: courseCode.trim().toUpperCase(),
      examDate,
      examTime,
      room: room.trim().toUpperCase(),
      notes: notes.trim(),
    });
  };

  // Format the date display for the label
  const formatDateLabel = (dateStr) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? '✏️ Edit Exam' : '📝 Add Exam'}</h2>

        {error && (
          <div className="error-label">
            <span>⛔</span>
            <span>{error}</span>
          </div>
        )}

        {/* Course Code */}
        <label htmlFor="examCourseCode">Course Code</label>
        <input
          id="examCourseCode"
          type="text"
          placeholder="e.g. CSE420"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          autoFocus
        />

        {/* Exam Date */}
        <label htmlFor="examDate">Exam Date</label>
        <input
          id="examDate"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
        />
        {examDate && (
          <div className="time-preview" style={{ marginTop: '-8px' }}>
            📅 {formatDateLabel(examDate)}
          </div>
        )}

        {/* Exam Time */}
        <label htmlFor="examTime">Exam Time</label>
        <input
          id="examTime"
          type="time"
          value={examTime}
          onChange={(e) => setExamTime(e.target.value)}
        />

        {/* Room */}
        <label htmlFor="examRoom">Room</label>
        <input
          id="examRoom"
          type="text"
          placeholder="e.g. SDU, RFF"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Notes */}
        <label htmlFor="examNotes">Notes (optional)</label>
        <input
          id="examNotes"
          type="text"
          placeholder="e.g. Bring calculator"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          {isEdit && (
            <button
              className="btn-delete"
              onClick={() => onDelete(exam._id || exam.id)}
            >
              🗑️ Delete
            </button>
          )}
          <button className="btn-save" onClick={handleSave}>
            {isEdit ? '💾 Update' : '✅ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
