import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  DAYS,
  TIME_SLOTS,
  LAB_START_SLOTS,
  getPairedDay,
  isFriday,
  getSlotById,
  getLabTimeRange,
  getLabStartSlots,
} from '../constants/schedule';
import { getCourseTitleByCode, getAllCourses } from '../constants/courses';
import { checkTheoryConflict, checkLabConflict } from '../utils/conflicts';
import { fetchCourseCatalog } from '../api/courses';

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
 * - catalogCourses: array of courses from external API (USIS)
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
  catalogCourses = [],
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
  const [selectedSectionObj, setSelectedSectionObj] = useState(null);
  const [faculty, setFaculty] = useState('');
  const [room, setRoom] = useState('');
  const [examDate, setExamDate] = useState('');
  const [examTime, setExamTime] = useState('');

  // Compute valid lab start slots based on current timeSlots
  const labStartSlots = useMemo(() => LAB_START_SLOTS, []);

  // Function to map any clicked slot to the nearest valid lab start slot
  const getLabStartSlotFromClickedSlot = (clickedSlot) => {
    // Map slots to their corresponding lab start slots:
    // Slots 1-2 → slot 1 (8-11 AM)
    // Slots 3-4 → slot 3 (11-2 PM)
    // Slots 5-6 → slot 5 (2-5 PM)
    // Slot 7+ → slot 5 (latest available)
    if (clickedSlot <= 2) return 1;
    if (clickedSlot <= 4) return 3;
    return 5;
  };

  // Lab-specific state
  const [labDay, setLabDay] = useState(day || 'Sunday');
  const [labFrequency, setLabFrequency] = useState('WEEKLY');
  const [labStartSlot, setLabStartSlot] = useState(() => {
    if (slotId && LAB_START_SLOTS.includes(slotId)) {
      return slotId; // If clicked slot is already a valid start slot, use it
    } else if (slotId) {
      return getLabStartSlotFromClickedSlot(slotId); // Map to nearest valid start slot
    }
    return LAB_START_SLOTS[0] || 1; // Default to first slot
  });

  // Dropdown state
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSectionDropdown, setShowSectionDropdown] = useState(false);
  const [showManualTitle, setShowManualTitle] = useState(false);
  const dropdownRef = useRef(null);
  const sectionDropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Error state
  const [error, setError] = useState('');
  const [localCatalogCourses, setLocalCatalogCourses] = useState(catalogCourses || []);

  // Group catalog courses by courseCode for section lookup
  const coursesByCode = useMemo(() => {
    const grouped = {};
    for (const course of localCatalogCourses) {
      const code = course.courseCode.toUpperCase();
      if (!grouped[code]) {
        grouped[code] = [];
      }
      grouped[code].push(course);
    }
    return grouped;
  }, [localCatalogCourses]);

  // Build merged course list: static dictionary + custom DB courses + catalog courses
  const allCourses = useMemo(() => {
    const staticCourses = getAllCourses();
    const merged = { ...staticCourses };

    // Add custom courses (overrides static if same code)
    for (const c of customCourses) {
      merged[c.courseCode.toUpperCase()] = c.courseTitle.toUpperCase();
    }

    // Add catalog courses (overrides if same code)
    for (const c of localCatalogCourses) {
      const code = c.courseCode.toUpperCase();
      const title = c.courseTitle.toUpperCase();
      if (!merged[code]) {
        merged[code] = title;
      }
    }

    return merged;
  }, [customCourses, localCatalogCourses]);

  // Get available sections for selected course
  const availableSections = useMemo(() => {
    const search = courseCode.toUpperCase().trim();
    if (!search) return [];
    
    const sections = coursesByCode[search] || [];
    return sections.slice(0, 50); // Limit to 50 sections
  }, [courseCode, coursesByCode]);

  // Helper: parse time string to minutes (used by slot filtering)
  const parseTimeToMinutes = (t) => {
    if (!t) return null;
    const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return null;
    let h = parseInt(match[1]);
    const m = parseInt(match[2]);
    const p = match[3].toUpperCase();
    if (p === 'PM' && h !== 12) h += 12;
    if (p === 'AM' && h === 12) h = 0;
    return h * 60 + m;
  };

  // Compute courses available at the clicked day/time slot (add mode only)
  const slotAvailableCourseMap = useMemo(() => {
    if (isEdit || !day || !slotId || localCatalogCourses.length === 0) return null;

    // Map a USIS start time to the nearest slot ID
    const mapToSlot = (timeStr) => {
      const target = parseTimeToMinutes(timeStr);
      if (target === null) return null;
      let bestSlot = null;
      let bestDiff = Infinity;
      for (const slot of timeSlots) {
        const slotMins = parseTimeToMinutes(slot.start);
        if (slotMins === null) continue;
        const diff = Math.abs(slotMins - target);
        if (diff < bestDiff) { bestDiff = diff; bestSlot = slot.id; }
      }
      return bestSlot;
    };

    const map = {};
    for (const course of localCatalogCourses) {
      for (const sched of (course.schedule || [])) {
        // Normalize day for comparison
        const schedDay = sched.day
          ? sched.day.charAt(0).toUpperCase() + sched.day.slice(1).toLowerCase()
          : '';
        if (schedDay === day) {
          const mappedSlot = mapToSlot(sched.startTime);
          if (mappedSlot === slotId) {
            const code = course.courseCode.toUpperCase();
            if (!map[code]) {
              map[code] = course.courseTitle.toUpperCase();
            }
            break;
          }
        }
      }
    }

    return Object.keys(map).length > 0 ? map : null;
  }, [isEdit, day, slotId, localCatalogCourses, timeSlots]);

  // Filtered dropdown options based on search
  // In add mode: show only courses available at the clicked day/time slot
  const filteredOptions = useMemo(() => {
    const search = courseCode.toUpperCase().trim();
    
    // Use slot-filtered courses in add mode if available, otherwise all courses
    const sourceMap = slotAvailableCourseMap || allCourses;
    
    if (!search) {
      return Object.entries(sourceMap)
        .slice(0, 100)
        .map(([code, title]) => ({ type: 'course', code, title }));
    }
    
    return Object.entries(sourceMap)
      .filter(([code, title]) =>
        code.includes(search) || title.toUpperCase().includes(search)
      )
      .slice(0, 100)
      .map(([code, title]) => ({ type: 'course', code, title }));
  }, [courseCode, allCourses, slotAvailableCourseMap]);

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
      if (sectionDropdownRef.current && !sectionDropdownRef.current.contains(e.target)) {
        setShowSectionDropdown(false);
      }
    };
    
    // Add small delay to ensure click event is processed first
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    
    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch catalog if not provided by parent or if empty on mount
  useEffect(() => {
    // Always try to fetch from the API if localCatalogCourses is empty
    if (localCatalogCourses.length === 0) {
      fetchCourseCatalog()
        .then(data => {
          if (data && data.length > 0) {
            setLocalCatalogCourses(data);
          }
        })
        .catch(err => {
          console.error('Failed to fetch catalog in ClassModal:', err);
        });
    }
  }, []); // Empty dependency array - run once on mount

  // When courseCode changes, auto-lookup title
  const handleCourseCodeChange = (value) => {
    const upper = value.toUpperCase();
    setCourseCode(upper);
    setShowDropdown(true);
    setShowManualTitle(false);
    setSelectedSectionObj(null); // Clear stored section when course changes

    // Auto-fill title from dictionary
    const title = allCourses[upper.trim()];
    if (title) {
      setCourseTitle(title.toUpperCase());
    } else {
      setCourseTitle('');
    }
  };

  // Select a course from dropdown (course code field)
  const handleSelectCourse = (option) => {
    setSelectedSectionObj(null); // Clear stored section when course changes
    if (option.type === 'section') {
      // This shouldn't happen from course dropdown anymore
      setCourseCode(option.code.toUpperCase());
      setCourseTitle(allCourses[option.code.toUpperCase()] || '');
      setShowDropdown(false);
      setShowManualTitle(false);
    } else {
      // Course selected - just set code and title
      setCourseCode(option.code.toUpperCase());
      setCourseTitle(option.title.toUpperCase());
      setShowDropdown(false);
      setShowManualTitle(false);
    }
  };

  // Helper: Map a USIS time string (e.g., "02:00 PM") to the nearest slot ID
  const mapTimeToSlotId = (timeStr) => {
    if (!timeStr) return null;

    const parseToMinutes = (t) => {
      const match = t.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      let h = parseInt(match[1]);
      const m = parseInt(match[2]);
      const p = match[3].toUpperCase();
      if (p === 'PM' && h !== 12) h += 12;
      if (p === 'AM' && h === 12) h = 0;
      return h * 60 + m;
    };

    const target = parseToMinutes(timeStr);
    if (target === null) return null;

    let bestSlot = null;
    let bestDiff = Infinity;

    for (const slot of timeSlots) {
      const slotMins = parseToMinutes(slot.start);
      if (slotMins === null) continue;
      const diff = Math.abs(slotMins - target);
      if (diff < bestDiff) {
        bestDiff = diff;
        bestSlot = slot.id;
      }
    }

    return bestSlot;
  };

  // Select a section from the section dropdown
  const handleSelectSection = (sectionOption) => {
    setSection(sectionOption.sectionName || '');
    setSelectedSectionObj(sectionOption); // Store full section object for lab auto-creation
    setFaculty(sectionOption.instructor || '');
    
    // Extract room based on class type (THEORY vs LAB)
    let room = '';
    if (type === 'LAB') {
      // For labs, use labSchedule instead of schedule
      room = sectionOption.labSchedule?.[0]?.room || '';

      // Auto-fill lab day and time slot from USIS schedule data
      if (!isEdit) {
        const labInfo = sectionOption.labSchedule?.[0];
        if (labInfo) {
          if (labInfo.day) {
            // Normalize day to title case (e.g., "WEDNESDAY" → "Wednesday")
            const normalizedDay = labInfo.day.charAt(0).toUpperCase() + labInfo.day.slice(1).toLowerCase();
            if (DAYS.includes(normalizedDay)) {
              setLabDay(normalizedDay);
            }
          }
          if (labInfo.startTime) {
            const slotId = mapTimeToSlotId(labInfo.startTime);
            if (slotId) {
              const labSlot = getLabStartSlotFromClickedSlot(slotId);
              setLabStartSlot(labSlot);
            }
          }
        }
      }
    } else {
      // For theory, use regular schedule
      room = sectionOption.schedule?.[0]?.room || '';
    }
    setRoom(room);
    
    // Set exam date (convert null to empty string)
    setExamDate(sectionOption.examDate || '');
    
    // Set exam time (convert null to empty string)
    setExamTime(sectionOption.examStartTime || '');
    
    setShowSectionDropdown(false);
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
    // Exam date is optional for theory classes (exam time is always optional)

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
      
      // Use the stored section object (set when user selected from dropdown)
      // Fall back to searching availableSections if not stored
      const sectionObjectToPass = selectedSectionObj || availableSections.find(s => s.sectionName === section);
      
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
        sectionObject: sectionObjectToPass, // Pass full section for lab check
      });
    } else {
      // LAB
      const labDayToUse = effectiveLabDay || (isEdit ? entry.days?.[0] : 'Sunday');
      if (isFriday(labDayToUse)) {
        setError('Lab classes cannot be scheduled on Friday. Friday is a weekend/off-day.');
        return;
      }
      const labSlot = isEdit ? (labStartSlot !== entry.startSlot ? labStartSlot : entry.startSlot) : labStartSlot;

      // Validate that lab only starts from allowed slots (1, 3, 5)
      if (!LAB_START_SLOTS.includes(labSlot)) {
        setError(`Labs can only start from slots: ${LAB_START_SLOTS.map(slot => getSlotById(slot, timeSlots)?.start).join(', ')}`);
        return;
      }

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
                filteredOptions.map((option, idx) => (
                  <div
                    key={option.type === 'section' ? `sec-${option.sectionId}` : `course-${option.code}`}
                    className={`course-dropdown-item ${option.code === courseCode.toUpperCase().trim() ? 'selected' : ''}`}
                    onClick={() => handleSelectCourse(option)}
                  >
                    <>
                      <span className="dropdown-code">{option.code}</span>
                      <span className="dropdown-title">{option.title}</span>
                    </>
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
              // When switching to LAB, remap the slot to nearest valid lab start slot
              if (!LAB_START_SLOTS.includes(slotId)) {
                setLabStartSlot(getLabStartSlotFromClickedSlot(slotId || 1));
              }
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

        {/* Section - Dropdown if sections available, otherwise text input */}
        <label htmlFor="section">Section</label>
        {availableSections.length > 0 ? (
          <div className="course-dropdown-wrapper" ref={sectionDropdownRef}>
            <input
              id="section"
              type="text"
              placeholder="Select section..."
              value={section}
              onChange={(e) => { setSection(e.target.value); setSelectedSectionObj(null); }}
              onFocus={() => setShowSectionDropdown(true)}
              autoComplete="off"
              style={{ marginBottom: showSectionDropdown ? 0 : undefined }}
            />
            {showSectionDropdown && (
              <div className="course-dropdown">
                {availableSections.map((sec) => {
                  const roomFromSchedule = sec.schedule?.[0]?.room || 'TBD';
                  const labRoom = sec.labSchedule?.[0]?.room || 'N/A';
                  const displayRoom = type === 'LAB' ? labRoom : roomFromSchedule;
                  return (
                    <div
                      key={`section-${sec.sectionId}`}
                      className="course-dropdown-item"
                      onClick={() => {
                        handleSelectSection(sec);
                        // Force close the dropdown
                        setShowSectionDropdown(false);
                      }}
                    >
                      <div className="section-item">
                        <div className="section-header">
                          <span className="dropdown-code">{sec.courseCode}</span>
                          <span className="section-name">Sec {sec.sectionName}</span>
                        </div>
                        <div className="section-details">
                          <span className="detail-label">Instructor:</span>
                          <span className="detail-value">{sec.instructor || 'N/A'}</span>
                          <span className="detail-label">Room:</span>
                          <span className="detail-value">{displayRoom}</span>
                          {type === 'LAB' && sec.labSchedule?.[0] ? (
                            <>
                              <span className="detail-label">Lab:</span>
                              <span className="detail-value">{sec.labSchedule[0].day} {sec.labSchedule[0].startTime} – {sec.labSchedule[0].endTime}</span>
                            </>
                          ) : (
                            <>
                              <span className="detail-label">Exam:</span>
                              <span className="detail-value">{sec.examDate || 'TBD'} {sec.examStartTime || 'N/A'}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <input
            id="section"
            type="text"
            placeholder="e.g. 13"
            value={section}
            onChange={(e) => { setSection(e.target.value); setSelectedSectionObj(null); }}
          />
        )}

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
