import React, { useState, useEffect } from 'react';

/**
 * Modal for editing time slot start/end times, adding, or removing slots.
 *
 * Props:
 * - timeSlots: current array of { id, start, end }
 * - onSave: (updatedSlots) => void
 * - onReset: () => void
 * - onClose: () => void
 */
export default function TimeSlotEditor({ timeSlots, onSave, onReset, onClose }) {
  const [slots, setSlots] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Deep copy to avoid mutating parent state
    setSlots(timeSlots.map((s) => ({ ...s })));
  }, [timeSlots]);

  const handleTimeChange = (index, field, value) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
    setError('');
  };

  const handleAddSlot = () => {
    const lastSlot = slots[slots.length - 1];
    const newId = lastSlot ? lastSlot.id + 1 : 1;
    const newStart = lastSlot ? lastSlot.end : '08:00 AM';
    setSlots([...slots, { id: newId, start: newStart, end: '' }]);
    setError('');
  };

  const handleRemoveSlot = (index) => {
    if (slots.length <= 1) {
      setError('Must have at least one time slot.');
      return;
    }
    setSlots((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      // Re-number IDs sequentially
      return updated.map((s, i) => ({ ...s, id: i + 1 }));
    });
    setError('');
  };

  const handleSave = () => {
    // Validate all slots have start and end
    for (let i = 0; i < slots.length; i++) {
      if (!slots[i].start || !slots[i].end) {
        setError(`Slot ${i + 1} must have both start and end times.`);
        return;
      }
    }
    onSave(slots);
  };

  const handleReset = () => {
    onReset();
  };

  // Convert 24h input to 12h AM/PM display
  const to12h = (time24) => {
    if (!time24) return '';
    // If already in AM/PM format, return as-is
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
  };

  // Convert 12h AM/PM to 24h for input[type=time]
  const to24h = (time12) => {
    if (!time12) return '';
    // If already 24h (no AM/PM), return as-is
    if (!time12.includes('AM') && !time12.includes('PM')) return time12;
    const parts = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!parts) return '';
    let h = parseInt(parts[1]);
    const m = parseInt(parts[2]);
    const period = parts[3].toUpperCase();
    if (period === 'PM' && h !== 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content timeslot-editor" onClick={(e) => e.stopPropagation()}>
        <h2>⏰ Edit Time Slots</h2>

        <div className="info-label">
          <span className="info-icon">ℹ️</span>
          <span>
            Set the start and end times for each slot. Changes apply to the entire schedule grid.
          </span>
        </div>

        {error && (
          <div className="error-label">
            <span>⛔</span>
            <span>{error}</span>
          </div>
        )}

        <div className="timeslot-list">
          {slots.map((slot, index) => (
            <div key={slot.id} className="timeslot-row">
              <span className="timeslot-label">Slot {index + 1}</span>
              <input
                type="time"
                value={to24h(slot.start)}
                onChange={(e) =>
                  handleTimeChange(index, 'start', to12h(e.target.value))
                }
                className="timeslot-input"
              />
              <span className="timeslot-separator">–</span>
              <input
                type="time"
                value={to24h(slot.end)}
                onChange={(e) =>
                  handleTimeChange(index, 'end', to12h(e.target.value))
                }
                className="timeslot-input"
              />
              <button
                className="timeslot-remove"
                onClick={() => handleRemoveSlot(index)}
                title="Remove this slot"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          className="timeslot-add-btn"
          onClick={handleAddSlot}
          type="button"
        >
          ➕ Add Time Slot
        </button>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-delete"
            onClick={handleReset}
            style={{ flex: '0 0 auto', padding: '12px 16px' }}
          >
            ↩️ Reset
          </button>
           <button className="btn-save" onClick={handleSave}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
