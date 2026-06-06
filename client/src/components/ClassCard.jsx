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
    backgroundColor: color.badge,
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

      {/* Type badge */}
      <span className="type-badge" style={badgeStyle}>
        {entry.type}
      </span>

      {/* Section | Faculty */}
      <div className="card-info">
        {entry.section} | {entry.faculty}
      </div>

      {/* Room */}
      <div className="card-room">
        📍 {entry.room}
        {entry.room?.endsWith('T') && <span style={{ marginLeft: 4, fontSize: '0.65rem', opacity: 0.8 }}>🎭 Theater</span>}
      </div>

      {/* Lab frequency */}
      {isLab && entry.labFrequency && (
        <div className="card-frequency">
          🔄 {entry.labFrequency === 'BIWEEKLY' ? 'Biweekly' : 'Weekly'}
        </div>
      )}
    </div>
  );
}
