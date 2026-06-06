import React from 'react';
import { getCourseColor } from '../utils/colors';
import { getLabTimeRange } from '../constants/schedule';

/**
 * Card displayed inside a grid cell.
 * 
 * Theory cards: solid border, normal height
 * Lab cards: dashed border, shows merged time range
 */
export default function ClassCard({ entry, onClick }) {
  const color = getCourseColor(entry.courseCode);
  const isLab = entry.type === 'LAB';

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
      title={`${entry.courseCode} — Click to edit`}
    >
      {/* Lab time range at top */}
      {isLab && (
        <div className="lab-time-range">
          🕐 {getLabTimeRange(entry.startSlot)}
        </div>
      )}

      {/* Course code */}
      <div className="course-code" style={{ color: color.text }}>
        {entry.courseCode}
      </div>

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
      </div>

      {/* Remaining seats */}
      <div className="card-seats">
        Remaining seats: {entry.remainingSeats}
      </div>
    </div>
  );
}
