import React, { useState, useEffect } from 'react';
import {
  DAYS,
  TIME_SLOTS,
  getPairedDay,
  isFriday,
  getSlotById,
  getLabTimeRange,
} from '../constants/schedule';
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
  onSave,
  onDelete,
  onClose,
}) {
  const isEdit = mode === 'edit';

  // Form state
  const [courseCode, setCourseCode] = useState('');
  const [type, setType] = useState('THEORY');
  const [section, setSection] = useState('');
  const [faculty, setFaculty] = useState('');
  const [room, setRoom] = useState('');
  const [remainingSeats, setRemainingSeats] = useState('');

  // Lab-specific state
  const [labDay, setLabDay] = useState(day || 'Sunday');
  const [labStartSlot, setLabStartSlot] = useState(slotId && slotId <= 6 ? slotId : 1);

  // Error state
  const [error, setError] = useState('');

  // Pre-fill in edit mode
  useEffect(() => {
    if (isEdit && entry) {
      setCourseCode(entry.courseCode || '');
      setType(entry.type || 'THEORY');
      setSection(String(entry.section || ''));
      setFaculty(entry.faculty || '');
      setRoom(entry.room || '');
      setRemainingSeats(String(entry.remainingSeats || ''));
      if (entry.type === 'LAB') {
        setLabDay(entry.days?.[0] || 'Sunday');
        setLabStartSlot(entry.startSlot || 1);
      }
    }
  }, [isEdit, entry]);

  // Derived values
  const pairedDay = type === 'THEORY' && day ? getPairedDay(day) : null;
  const theoryDay = type === 'THEORY' ? day : null;
  const effectiveLabDay = type === 'LAB' ? labDay : null;
  const labEndSlot = labStartSlot + 1;
  const labTimeRange = type === 'LAB' ? getLabTimeRange(labStartSlot) : null;

  // For edit mode with theory: derive the "clicked day" from entry.days
  const editTheoryDay = isEdit && entry?.type === 'THEORY' ? entry.days?.[0] : null;
  const displayDay = theoryDay || editTheoryDay;
  const displayPairedDay = displayDay ? getPairedDay(displayDay) : null;

  const handleSave = () => {
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
    if (!remainingSeats || isNaN(Number(remainingSeats)) || Number(remainingSeats) < 0) {
      setError('Please enter a valid number for remaining seats.');
      return;
    }

    const excludeId = isEdit ? (entry._id || entry.id) : null;

    if (type === 'THEORY') {
      const theoryDayToUse = displayDay;
      const theorySlot = isEdit ? entry.startSlot : slotId;

      // Friday check
      if (isFriday(theoryDayToUse)) {
        setError('Theory classes cannot be scheduled on Friday. Friday is available for Labs only.');
        return;
      }

      // Conflict check
      const conflict = checkTheoryConflict(entries, theoryDayToUse, theorySlot, excludeId);
      if (conflict.hasConflict) {
        setError(conflict.message);
        return;
      }

      const paired = getPairedDay(theoryDayToUse);
      onSave({
        courseCode: courseCode.trim().toUpperCase(),
        type: 'THEORY',
        section: section.trim(),
        faculty: faculty.trim().toUpperCase(),
        room: room.trim().toUpperCase(),
        remainingSeats: Number(remainingSeats),
        days: [theoryDayToUse, paired],
        startSlot: theorySlot,
        endSlot: theorySlot,
      });
    } else {
      // LAB
      const labDayToUse = effectiveLabDay || (isEdit ? entry.days?.[0] : 'Sunday');
      const labSlot = isEdit ? (labStartSlot !== entry.startSlot ? labStartSlot : entry.startSlot) : labStartSlot;

      if (labSlot > 6) {
        setError('Lab must start at slot 6 or earlier (needs 2 consecutive slots).');
        return;
      }

      const conflict = checkLabConflict(entries, labDayToUse, labSlot, excludeId);
      if (conflict.hasConflict) {
        setError(conflict.message);
        return;
      }

      onSave({
        courseCode: courseCode.trim().toUpperCase(),
        type: 'LAB',
        section: section.trim(),
        faculty: faculty.trim().toUpperCase(),
        room: room.trim().toUpperCase(),
        remainingSeats: Number(remainingSeats),
        days: [labDayToUse],
        startSlot: labSlot,
        endSlot: labSlot + 1,
      });
    }
  };

  const currentSlot = getSlotById(slotId || (isEdit ? entry?.startSlot : 1));

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
              <strong>{getSlotById(entry.startSlot)?.start} – {getSlotById(entry.startSlot)?.end}</strong>
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

        {/* Course Code */}
        <label htmlFor="courseCode">Course Code</label>
        <input
          id="courseCode"
          type="text"
          placeholder="e.g. CSE420"
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          autoFocus
        />

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
              {DAYS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <label htmlFor="labStartSlot">Start Slot</label>
            <select
              id="labStartSlot"
              value={labStartSlot}
              onChange={(e) => setLabStartSlot(Number(e.target.value))}
              disabled={isEdit}
            >
              {TIME_SLOTS.filter((s) => s.id <= 6).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.start} – {s.end}
                </option>
              ))}
            </select>

            {labTimeRange && (
              <div className="time-preview">
                🕐 Lab will span: <strong>{labTimeRange}</strong> (3 hours)
              </div>
            )}
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
          onChange={(e) => setFaculty(e.target.value)}
        />

        {/* Room */}
        <label htmlFor="room">Room Number</label>
        <input
          id="room"
          type="text"
          placeholder="e.g. SDU, RFF"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
        />

        {/* Remaining Seats */}
        <label htmlFor="remainingSeats">Remaining Seats</label>
        <input
          id="remainingSeats"
          type="number"
          min="0"
          placeholder="e.g. 35"
          value={remainingSeats}
          onChange={(e) => setRemainingSeats(e.target.value)}
        />

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
            {isEdit ? '💾 Update' : '✅ Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
