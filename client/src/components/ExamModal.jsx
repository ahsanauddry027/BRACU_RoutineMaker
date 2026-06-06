import React, { useState, useEffect, useRef, useMemo } from 'react';
import { getCourseTitleByCode, getAllCourses } from '../constants/courses';

/**
 * Modal for adding / editing / deleting an exam entry.
 *
 * Props:
 * - mode: 'add' | 'edit'
 * - exam: existing exam data (for edit mode)
 * - customCourses: array of { courseCode, courseTitle } from DB
 * - onAddCustomCourse: (code, title) => Promise
 * - onSave: (formData) => void
 * - onDelete: (examId) => void
 * - onClose: () => void
 */
export default function ExamModal({ mode, exam, customCourses = [], onAddCustomCourse, onSave, onDelete, onClose }) {
  const isEdit = mode === 'edit';

  const [courseCode, setCourseCode] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');
  const [room, setRoom] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Build merged course list
  const allCourses = useMemo(() => {
    const staticCourses = getAllCourses();
    const merged = { ...staticCourses };
    for (const c of customCourses) {
      merged[c.courseCode.toUpperCase()] = c.courseTitle.toUpperCase();
    }
    return merged;
  }, [customCourses]);

  // Filtered dropdown
  const filteredOptions = useMemo(() => {
    const search = courseCode.toUpperCase().trim();
    if (!search) return Object.entries(allCourses).slice(0, 100);
    return Object.entries(allCourses)
      .filter(([code, title]) =>
        code.includes(search) || title.toUpperCase().includes(search)
      )
      .slice(0, 100);
  }, [courseCode, allCourses]);

  useEffect(() => {
    if (isEdit && exam) {
      setCourseCode(exam.courseCode || '');
      setExamDate(exam.examDate || '');
      setExamTime(exam.examTime || '');
      setRoom(exam.room || '');
      setNotes(exam.notes || '');
    }
  }, [isEdit, exam]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCourseCodeChange = (value) => {
    setCourseCode(value.toUpperCase());
    setShowDropdown(true);
  };

  const handleSelectCourse = (code) => {
    setCourseCode(code.toUpperCase());
    setShowDropdown(false);
  };

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

        {/* Course Code with Dropdown */}
        <label htmlFor="examCourseCode">Course Code</label>
        <div className="course-dropdown-wrapper" ref={dropdownRef}>
          <input
            id="examCourseCode"
            type="text"
            placeholder="Search or type course code..."
            value={courseCode}
            onChange={(e) => handleCourseCodeChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            autoFocus
            autoComplete="off"
            style={{ marginBottom: showDropdown ? 0 : undefined }}
          />
          {showDropdown && (
            <div className="course-dropdown">
              {filteredOptions.length > 0 ? (
                filteredOptions.map(([code, title]) => (
                  <div
                    key={code}
                    className={`course-dropdown-item ${code === courseCode.toUpperCase().trim() ? 'selected' : ''}`}
                    onClick={() => handleSelectCourse(code)}
                  >
                    <span className="dropdown-code">{code}</span>
                    <span className="dropdown-title">{title}</span>
                  </div>
                ))
              ) : (
                <div className="course-dropdown-empty">
                  No matching course found
                </div>
              )}
            </div>
          )}
        </div>

        {/* Show matched course title */}
        {allCourses[courseCode.toUpperCase().trim()] && (
          <div className="time-preview" style={{ marginTop: '-8px' }}>
            📚 {allCourses[courseCode.toUpperCase().trim()]}
          </div>
        )}

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
          placeholder="e.g. 9E25L, 9H33C, 9E21T"
          value={room}
          onChange={(e) => setRoom(e.target.value.toUpperCase())}
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
            {isEdit ? 'Update' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
