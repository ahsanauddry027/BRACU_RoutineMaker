import React from 'react';
import { getCourseColor } from '../utils/colors';
import { getLabTimeRange } from '../constants/schedule';
import { getCourseTitleByCode } from '../constants/courses';

/**
 * Card displayed inside a grid cell.
 * 
 * Theory cards: solid border, normal height
 * Lab cards: dashed border, shows merged time range
 * Shows course title from entry or looked up from dictionary.
 */
export default function ClassCard({ entry, onClick, timeSlots }) {
  const color = getCourseColor(entry.courseCode);
  const isLab = entry.type === 'LAB';

  // Use stored courseTitle, or fall back to dictionary lookup
  const courseTitle = entry.courseTitle || getCourseTitleByCode(entry.courseCode) || '';

  const cardStyle = {
    backgroundColor: color.bg,
    borderColor: color.border,
  };

  const badgeStyle = {
    color: color.text,
  };

  return (
    <div
      className={`class-card ${isLab ? 'lab-card' : 'theory-card'}`}
      style={cardStyle}
      onClick={(e) => {
        e.stopPropagation();
        onClick(entry);
      }}
      title={`${entry.courseCode}${courseTitle ? ' — ' + courseTitle : ''} — Click to edit`}
    >
      {/* Lab time range at top */}
      {isLab && (
        <div className="lab-time-range">
          🕐 {getLabTimeRange(entry.startSlot, timeSlots)}
        </div>
      )}

      {/* Course code */}
      <div className="course-code" style={{ color: color.text }}>
        {entry.courseCode}
      </div>

      {/* Course title */}
      {courseTitle && (
        <div className="card-title" style={{ color: color.text }}>
          {courseTitle}
        </div>
      )}

      {/* Badges */}
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
        <span className="type-badge" style={badgeStyle}>
          {entry.type}
        </span>
        {isLab && entry.labFrequency && (
          <span className="type-badge" style={badgeStyle}>
            {entry.labFrequency}
          </span>
        )}
        {entry.room?.endsWith('T') && (
          <span className="type-badge" style={badgeStyle}>
            THEATER
          </span>
        )}
        <span className="type-badge" style={badgeStyle}>
          SECTION: {entry.section}
        </span>
        <span className="type-badge" style={badgeStyle}>
          FACULTY: {entry.faculty}
        </span>
        <span className="type-badge" style={badgeStyle}>
          ROOM: {entry.room}
        </span>
      </div>
    </div>
  );
}
