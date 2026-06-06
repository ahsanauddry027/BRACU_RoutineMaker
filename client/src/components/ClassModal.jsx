import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DAYS,
  TIME_SLOTS,
  getPairedDay,
  isFriday,
  getSlotById,
  getLabTimeRange,
  getLabStartSlots,
} from '../constants/schedule';
import { getCourseTitleByCode, getAllCourses } from '../constants/courses';
import { checkTheoryConflict, checkLabConflict } from '../utils/conflicts';

/**
 * Modal for adding / editing / deleting a class entry.
 *
 * Props:
 * - mode: 'add' | 'edit'
 * - entry: existing entry data (for edit mode)
 * - day: the clicked day (for add mode)
 * - slotId: the clicked slot (for add mode)
 * - entries: all current entries (for conflict checking)
 * - customCourses: array of { courseCode, courseTitle } from DB
 * - onAddCustomCourse: (code, title) => Promise
 * - onSave: (formData) => void
 * - onDelete: (entryId) => void
 * - onClose: () => void
 */
export default function ClassModal({
  mode,
  entry,
  day,
  slotId,
  entries,
  timeSlots = TIME_SLOTS,
  customCourses = [],
  onAddCustomCourse,
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = mode === 'edit';

  // Form state
  const [courseCode, setCourseCode] = useState('');
  const [courseTitle, setCourseTitle] = useState('');
  const [type, setType] = useState('THEORY');
  const [section, setSection] = useState('');
  const [faculty, setFaculty] = useState('');
  const [room, setRoom] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  // Compute valid lab start slots based on current timeSlots
  const labStartSlots = useMemo(() => getLabStartSlots(timeSlots), [timeSlots]);

  // Lab-specific state
  const [labDay, setLabDay] = useState(day || 'Sunday');
  const [labFrequency, setLabFrequency] = useState('WEEKLY');
  const [labStartSlot, setLabStartSlot] = useState(() => {
    const startSlots = getLabStartSlots(timeSlots);
    return slotId && startSlots.includes(slotId) ? slotId : (startSlots[0] || 1);
  });

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showManualTitle, setShowManualTitle] = useState(false);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Error state
  const [error, setError] = useState('');

  // Build merged course list: static dictionary + custom DB courses
  const allCourses = useMemo(() => {
    const staticCourses = getAllCourses();
    const merged = { ...staticCourses };

    // Add custom courses (overrides static if same code)
    for (const c of customCourses) {
      merged[c.courseCode.toUpperCase()] = c.courseTitle.toUpperCase();
    }

    return merged;
  }, [customCourses]);

  // Filtered dropdown options based on search
  const filteredOptions = useMemo(() => {
    const search = courseCode.toUpperCase().trim();
    if (!search) {
      // Show first 100 when empty
      return Object.entries(allCourses).slice(0, 100);
    }
    return Object.entries(allCourses)
      .filter(([code, title]) =>
        code.includes(search) || title.toUpperCase().includes(search)
      )
      .slice(0, 100);
  }, [courseCode, allCourses]);

  // Pre-fill in edit mode
  useEffect(() => {
    if (isEdit && entry) {
      setCourseCode(entry.courseCode || '');
      setCourseTitle(entry.courseTitle || '');
      setType(entry.type || 'THEORY');
      setSection(String(entry.section || ''));
      setFaculty(entry.faculty || '');
      setRoom(entry.room || '');
      setExamDate(entry.examDate || '');
      setExamTime(entry.examTime || '');

      if (entry.type === 'LAB') {
        setLabDay(entry.days?.[0] || 'Sunday');
        setLabStartSlot(entry.startSlot || 1);
        setLabFrequency(entry.labFrequency || 'WEEKLY');
      }

      // If entry has no courseTitle, try to look it up
      if (!entry.courseTitle && entry.courseCode) {
        const looked = getCourseTitleByCode(entry.courseCode);
        if (looked) setCourseTitle(looked.toUpperCase());
      }
    }
  }, [isEdit, entry]);

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

  // When courseCode changes, auto-lookup title
  const handleCourseCodeChange = (value) => {
    const upper = value.toUpperCase();
    setCourseCode(upper);
    setShowDropdown(true);
    setShowManualTitle(false);

    // Auto-fill title from dictionary
    const title = allCourses[upper.trim()];
    if (title) {
      setCourseTitle(title.toUpperCase());
    } else {
      setCourseTitle('');
    }
  };

  // Select a course from dropdown
  const handleSelectCourse = (code, title) => {
    setCourseCode(code.toUpperCase());
    setCourseTitle(title.toUpperCase());
    setShowDropdown(false);
    setShowManualTitle(false);
  };

  // Handle "Add manually" click
  const handleAddManually = () => {
    setShowDropdown(false);
    setShowManualTitle(true);
  };

  // Derived values
  const pairedDay = type === 'THEORY' && day ? getPairedDay(day) : null;
  const theoryDay = type === 'THEORY' ? day : null;
  const effectiveLabDay = type === 'LAB' ? labDay : null;
  const labEndSlot = labStartSlot + 1;
  const labTimeRange = type === 'LAB' ? getLabTimeRange(labStartSlot, timeSlots) : null;

  // For edit mode with theory
  const editTheoryDay = isEdit && entry?.type === 'THEORY' ? entry.days?.[0] : null;
  const displayDay = theoryDay || editTheoryDay;
  const displayPairedDay = displayDay ? getPairedDay(displayDay) : null;

  const handleSave = async () => {
    setError('');

    // Validation
    if (!courseCode.trim()) {
      setError('Course code is required.');
      return;
    }
    if (!section.trim()) {
      setError('Section is required.');
      return;
    }
    if (!faculty.trim()) {
      setError('Faculty initials are required.');
      return;
    }
    if (!room.trim()) {
      setError('Room number is required.');
      return;
    }
    if (type === 'THEORY' && !examDate) {
      setError('Exam date is required.');
      return;
    }

    // Always save the course code and title to the database when saving a class
    const finalCode = courseCode.trim().toUpperCase();
    const finalTitle = courseTitle.trim().toUpperCase();
    if (finalCode && finalTitle && onAddCustomCourse) {
      await onAddCustomCourse(finalCode, finalTitle);
    }

    const excludeId = isEdit ? (entry._id || entry.id) : null;

    if (type === 'THEORY') {
      const theoryDayToUse = displayDay;
      const theorySlot = isEdit ? entry.startSlot : slotId;

      if (isFriday(theoryDayToUse)) {
        setError('Theory classes cannot be scheduled on Friday. Friday is a weekend/off-day.');
        return;
      }

      const conflict = checkTheoryConflict(entries, theoryDayToUse, theorySlot, excludeId);
      if (conflict.hasConflict) {
        setError(conflict.message);
        return;
      }

      const paired = getPairedDay(theoryDayToUse);
      onSave({
        courseCode: finalCode,
        courseTitle: finalTitle,
        type: 'THEORY',
        section: section.trim(),
        faculty: faculty.trim().toUpperCase(),
        room: room.trim().toUpperCase(),
        examDate,
        examTime,
        days: [theoryDayToUse, paired],
        startSlot: theorySlot,
        endSlot: theorySlot,
      });
    } else {
      // LAB
      const labDayToUse = effectiveLabDay || (isEdit ? entry.days?.[0] : 'Sunday');
      if (isFriday(labDayToUse)) {
        setError('Lab classes cannot be scheduled on Friday. Friday is a weekend/off-day.');
        return;
      }
      const labSlot = isEdit ? (labStartSlot !== entry.startSlot ? labStartSlot : entry.startSlot) : labStartSlot;

      const maxLabStartSlot = timeSlots.length > 0 ? timeSlots.length - 1 : 6;
      if (labSlot > maxLabStartSlot) {
        setError(`Lab must start at slot ${maxLabStartSlot} or earlier (needs 2 consecutive slots).`);
        return;
      }

      const conflict = checkLabConflict(entries, labDayToUse, labSlot, excludeId);
      if (conflict.hasConflict) {
        setError(conflict.message);
        return;
      }

      onSave({
        courseCode: finalCode,
        courseTitle: finalTitle,
        type: 'LAB',
        section: section.trim(),
        faculty: faculty.trim().toUpperCase(),
        room: room.trim().toUpperCase(),
        labFrequency,
        days: [labDayToUse],
        startSlot: labSlot,
        endSlot: labSlot + 1,
      });
    }
  };

  const currentSlot = getSlotById(slotId || (isEdit ? entry?.startSlot : 1), timeSlots);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>{isEdit ? '✏️ Edit Class' : '➕ Add Class'}</h2>

        {/* Context info */}
        {!isEdit && type === 'THEORY' && currentSlot && (
          <div className="info-label">
            <span className="info-icon">📅</span>
            <span>
              <strong>{day}</strong> at <strong>{currentSlot.start} – {currentSlot.end}</strong>
              {pairedDay && (
                <>
                  <br />
                  Will also book <strong>{pairedDay}</strong> at the same time slot automatically.
                </>
              )}
            </span>
          </div>
        )}

        {isEdit && entry?.type === 'THEORY' && displayPairedDay && (
          <div className="info-label">
            <span className="info-icon">📅</span>
            <span>
              Theory on <strong>{displayDay}</strong> &amp; <strong>{displayPairedDay}</strong> at{' '}
              <strong>{getSlotById(entry.startSlot, timeSlots)?.start} – {getSlotById(entry.startSlot, timeSlots)?.end}</strong>
            </span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="error-label">
            <span>⛔</span>
            <span>{error}</span>
          </div>
        )}

        {/* Course Code with Dropdown */}
        <label htmlFor="courseCode">Course Code</label>
        <div className="course-dropdown-wrapper" ref={dropdownRef}>
          <input
            id="courseCode"
            ref={inputRef}
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
                    onClick={() => handleSelectCourse(code, title)}
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
              <div
                className="course-dropdown-item course-dropdown-add"
                onClick={handleAddManually}
              >
                <span>✏️ Enter course code & title manually</span>
              </div>
            </div>
          )}
        </div>

        {/* Course Title (shown when: has a looked-up title, OR manual mode) */}
        {(courseTitle || showManualTitle) && (
          <>
            <label htmlFor="courseTitle">Course Title</label>
            <input
              id="courseTitle"
              type="text"
              placeholder="e.g. COMPILER DESIGN"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value.toUpperCase())}
            />
          </>
        )}

        {/* Type Toggle */}
        <label>Type</label>
        <div className="type-toggle">
          <button
            type="button"
            className={type === 'THEORY' ? 'active' : ''}
            onClick={() => {
              setType('THEORY');
              setError('');
            }}
            disabled={isEdit} 
          >
            THEORY
          </button>
          <button
            type="button"
            className={type === 'LAB' ? 'active' : ''}
            onClick={() => {
              setType('LAB');
              setError('');
            }}
            disabled={isEdit}
          >
            LAB
          </button>
        </div>

        {/* Lab-specific: Day picker & Slot picker */}
        {type === 'LAB' && (
          <>
            <label htmlFor="labDay">Day</label>
            <select
              id="labDay"
              value={effectiveLabDay || (isEdit ? entry?.days?.[0] : 'Sunday')}
              onChange={(e) => setLabDay(e.target.value)}
              disabled={isEdit}
            >
              {DAYS.filter((d) => d !== 'Friday').map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <label htmlFor="labStartSlot">Time Slot</label>
            <select
              id="labStartSlot"
              value={labStartSlot}
              onChange={(e) => setLabStartSlot(Number(e.target.value))}
              disabled={isEdit}
            >
              {labStartSlots.map((sId) => {
                const range = getLabTimeRange(sId, timeSlots);
                return (
                  <option key={sId} value={sId}>
                    {range}
                  </option>
                );
              })}
            </select>

            {labTimeRange && (
              <div className="time-preview">
                🕐 Lab will span: <strong>{labTimeRange}</strong> (3 hours)
              </div>
            )}

            <label>Frequency</label>
            <div className="type-toggle">
              <button
                type="button"
                className={labFrequency === 'WEEKLY' ? 'active' : ''}
                onClick={() => setLabFrequency('WEEKLY')}
              >
                WEEKLY
              </button>
              <button
                type="button"
                className={labFrequency === 'BIWEEKLY' ? 'active' : ''}
                onClick={() => setLabFrequency('BIWEEKLY')}
              >
                BIWEEKLY
              </button>
            </div>
          </>
        )}

        {/* Section */}
        <label htmlFor="section">Section</label>
        <input
          id="section"
          type="text"
          placeholder="e.g. 13"
          value={section}
          onChange={(e) => setSection(e.target.value)}
        />

        {/* Faculty */}
        <label htmlFor="faculty">Faculty Initials</label>
        <input
          id="faculty"
          type="text"
          placeholder="e.g. LRK"
          value={faculty}
          onChange={(e) => setFaculty(e.target.value.toUpperCase())}
        />

        {/* Room */}
        <label htmlFor="room">Room Number</label>
        <input
          id="room"
          type="text"
          placeholder="e.g. 9E25L, 9H33C, 9E21T"
          value={room}
          onChange={(e) => setRoom(e.target.value.toUpperCase())}
        />

        {/* Exam Date & Time — Theory only */}
        {type === 'THEORY' && (
          <>
            <label htmlFor="examDate">Exam Date</label>
            <input
              id="examDate"
              type="date"
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
            />

            <label htmlFor="examTime">Exam Time (optional)</label>
            <input
              id="examTime"
              type="time"
              value={examTime}
              onChange={(e) => setExamTime(e.target.value)}
            />
          </>
        )}

        {/* Actions */}
        <div className="modal-actions">
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          {isEdit && (
            <button
              className="btn-delete"
              onClick={() => onDelete(entry._id || entry.id)}
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
