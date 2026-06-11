import React, { useState, useEffect, useCallback } from 'react';
import RoutineGrid from './components/RoutineGrid';
import ClassModal from './components/ClassModal';
import ConfirmDialog from './components/ConfirmDialog';
import ExamSchedule from './components/ExamSchedule';
import ExamModal from './components/ExamModal';
import { fetchRoutine, createEntry, updateEntry, deleteEntry, clearAllEntries } from './api/routine';
import { fetchExams, createExam, updateExam, deleteExam, clearAllExams } from './api/exams';
import { fetchCourses, createCourse, fetchCourseCatalog } from './api/courses';
import { fetchTimeSlots, updateTimeSlots, resetTimeSlots } from './api/settings';
import { rebuildColorMap, clearColorMap } from './utils/colors';
import { TIME_SLOTS, isFriday } from './constants/schedule';
import TimeSlotEditor from './components/TimeSlotEditor';

export default function App() {
  // ─── Routine State ──────────────────────────────────
  const [entries, setEntries] = useState([]);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState(''); // '' | 'error' | 'saving'

  // Class Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalDay, setModalDay] = useState(null);
  const [modalSlotId, setModalSlotId] = useState(null);
  const [modalEntry, setModalEntry] = useState(null);

  // Confirm dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [examConfirmOpen, setExamConfirmOpen] = useState(false);

  // ─── Exam State ─────────────────────────────────────
  const [exams, setExams] = useState([]);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState('add');
  const [examModalEntry, setExamModalEntry] = useState(null);

  // ─── Courses State ──────────────────────────────────
  const [customCourses, setCustomCourses] = useState([]);
  const [catalogCourses, setCatalogCourses] = useState([]);

  // ─── Time Slots State ──────────────────────────────
  const [timeSlots, setTimeSlots] = useState(TIME_SLOTS);
  const [timeSlotsEditorOpen, setTimeSlotsEditorOpen] = useState(false);

  // ─── Load data on mount ─────────────────────────────
  useEffect(() => {
    loadEntries();
    loadExams();
    loadCourses();
    loadCatalog();
    loadTimeSlots();
  }, []);

  const loadEntries = async () => {
    try {
      setStatus('Loading...');
      setStatusType('saving');
      const data = await fetchRoutine();
      setEntries(data);
      rebuildColorMap(data);
      setStatus(`Loaded ${data.length} class${data.length !== 1 ? 'es' : ''}`);
      setStatusType('');
      setTimeout(() => setStatus(''), 3000);
    } catch (err) {
      console.error('Failed to load routine:', err);
      setStatus('⚠️ Could not connect to server — working offline');
      setStatusType('error');
    }
  };

  const loadExams = async () => {
    try {
      const data = await fetchExams();
      setExams(data);
    } catch (err) {
      console.error('Failed to load exams:', err);
    }
  };

  const loadCourses = async () => {
    try {
      const data = await fetchCourses();
      setCustomCourses(data);
    } catch (err) {
      console.error('Failed to load custom courses:', err);
    }
  };

  const loadCatalog = async () => {
    try {
      const data = await fetchCourseCatalog();
      setCatalogCourses(data);
      console.log(`✅ Loaded ${data.length} courses from catalog`);
    } catch (err) {
      console.error('Failed to load course catalog:', err);
      // Don't show error to user — catalog is optional
    }
  };

  // ─── Add custom course ─────────────────────────────
  const handleAddCustomCourse = async (courseCode, courseTitle) => {
    try {
      const saved = await createCourse({ courseCode, courseTitle });
      setCustomCourses((prev) => {
        const exists = prev.find((c) => c.courseCode === saved.courseCode);
        if (exists) {
          return prev.map((c) => (c.courseCode === saved.courseCode ? saved : c));
        }
        return [...prev, saved];
      });
      return saved;
    } catch (err) {
      console.error('Failed to save custom course:', err);
      // Still return a local object so the UI works
      return { courseCode: courseCode.toUpperCase(), courseTitle: courseTitle.toUpperCase() };
    }
  };

  // ─── Time Slots ────────────────────────────────────
  const loadTimeSlots = async () => {
    try {
      const data = await fetchTimeSlots();
      if (data && data.length > 0) setTimeSlots(data);
    } catch (err) {
      console.error('Failed to load time slots:', err);
    }
  };

  const handleSaveTimeSlots = async (slots) => {
    try {
      setStatus('Saving time slots...');
      setStatusType('saving');
      const saved = await updateTimeSlots(slots);
      setTimeSlots(saved);
      setTimeSlotsEditorOpen(false);
      setStatus('✅ Time slots saved');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Failed to save time slots:', err);
      setStatus('⚠️ Failed to save time slots');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  const handleResetTimeSlots = async () => {
    try {
      const data = await resetTimeSlots();
      setTimeSlots(data);
      setTimeSlotsEditorOpen(false);
      setStatus('✅ Time slots reset to defaults');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Failed to reset time slots:', err);
    }
  };

  // ─── Cell click → open Add modal ───────────────────
  const handleCellClick = useCallback((day, slotId) => {
    setModalMode('add');
    setModalDay(day);
    setModalSlotId(slotId);
    setModalEntry(null);
    setModalOpen(true);
  }, []);

  // ─── Card click → open Edit modal ──────────────────
  const handleCardClick = useCallback((entry) => {
    setModalMode('edit');
    setModalDay(entry.days?.[0] || null);
    setModalSlotId(entry.startSlot);
    setModalEntry(entry);
    setModalOpen(true);
  }, []);

  // ─── Close class modal ─────────────────────────────
  const handleModalClose = useCallback(() => {
    setModalOpen(false);
    setModalEntry(null);
  }, []);

  // ─── Save class (create or update) ─────────────────
  const handleSave = async (formData) => {
    try {
      setStatus('Saving...');
      setStatusType('saving');

      if (modalMode === 'edit' && modalEntry) {
        const id = modalEntry._id || modalEntry.id;
        const updated = await updateEntry(id, formData);
        setEntries((prev) => {
          const next = prev.map((e) =>
            (e._id || e.id) === id ? updated : e
          );
          rebuildColorMap(next);
          return next;
        });
      } else {
        const created = await createEntry(formData);
        setEntries((prev) => {
          const next = [...prev, created];
          rebuildColorMap(next);
          return next;
        });
      }

      // Auto-create/update exam entry if exam date is provided
      if (formData.examDate) {
        try {
          const examData = {
            courseCode: formData.courseCode,
            examDate: formData.examDate,
            examTime: formData.examTime || '09:00',
            room: formData.room,
            notes: '',
          };

          // Check if an exam already exists for this course
          const existingExam = exams.find(
            (e) => e.courseCode === formData.courseCode
          );

          if (existingExam) {
            const examId = existingExam._id || existingExam.id;
            const updatedExam = await updateExam(examId, examData);
            setExams((prev) =>
              prev.map((e) => (e._id || e.id) === examId ? updatedExam : e)
            );
          } else {
            const createdExam = await createExam(examData);
            setExams((prev) => [...prev, createdExam]);
          }
        } catch (examErr) {
          console.error('Auto-create exam failed:', examErr);
        }
      }

      setStatus('✅ Saved');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Save failed:', err);
      if (modalMode === 'edit' && modalEntry) {
        const id = modalEntry._id || modalEntry.id;
        setEntries((prev) => {
          const next = prev.map((e) =>
            (e._id || e.id) === id ? { ...formData, _id: id, id } : e
          );
          rebuildColorMap(next);
          return next;
        });
      } else {
        const tempId = `local-${Date.now()}`;
        setEntries((prev) => {
          const next = [...prev, { ...formData, _id: tempId, id: tempId }];
          rebuildColorMap(next);
          return next;
        });
      }
      setStatus('⚠️ Saved locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }

    setModalOpen(false);
    setModalEntry(null);
  };

  // ─── Delete class ───────────────────────────────────
  const handleDelete = async (id) => {
    try {
      setStatus('Deleting...');
      setStatusType('saving');
      await deleteEntry(id);
      setEntries((prev) => {
        const next = prev.filter((e) => (e._id || e.id) !== id);
        rebuildColorMap(next);
        return next;
      });
      
      // Reload exams in case associated exams were deleted
      await loadExams();
      
      setStatus('🗑️ Deleted');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Delete failed:', err);
      setEntries((prev) => {
        const next = prev.filter((e) => (e._id || e.id) !== id);
        rebuildColorMap(next);
        return next;
      });
      setStatus('⚠️ Deleted locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }

    setModalOpen(false);
    setModalEntry(null);
  };

  // ─── Clear All ──────────────────────────────────────
  const handleClearAll = () => {
    if (entries.length === 0) return;
    setConfirmOpen(true);
  };

  const confirmClearAll = async () => {
    setConfirmOpen(false);
    try {
      setStatus('Clearing...');
      setStatusType('saving');
      await clearAllEntries();
      setEntries([]);
      clearColorMap();
      
      // Reload exams in case associated exams were deleted
      await loadExams();
      
      setStatus('🗑️ All classes cleared');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Clear all failed:', err);
      setEntries([]);
      clearColorMap();
      setStatus('⚠️ Cleared locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // ─── Exam handlers ─────────────────────────────────
  const handleAddExam = useCallback(() => {
    setExamModalMode('add');
    setExamModalEntry(null);
    setExamModalOpen(true);
  }, []);

  const handleEditExam = useCallback((exam) => {
    setExamModalMode('edit');
    setExamModalEntry(exam);
    setExamModalOpen(true);
  }, []);

  const handleExamModalClose = useCallback(() => {
    setExamModalOpen(false);
    setExamModalEntry(null);
  }, []);

  const handleExamSave = async (formData) => {
    try {
      setStatus('Saving exam...');
      setStatusType('saving');

      if (examModalMode === 'edit' && examModalEntry) {
        const id = examModalEntry._id || examModalEntry.id;
        const updated = await updateExam(id, formData);
        setExams((prev) => prev.map((e) => (e._id || e.id) === id ? updated : e));
      } else {
        const created = await createExam(formData);
        setExams((prev) => [...prev, created]);
      }

      setStatus('✅ Exam saved');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Exam save failed:', err);
      if (examModalMode === 'edit' && examModalEntry) {
        const id = examModalEntry._id || examModalEntry.id;
        setExams((prev) => prev.map((e) => (e._id || e.id) === id ? { ...formData, _id: id, id } : e));
      } else {
        const tempId = `local-exam-${Date.now()}`;
        setExams((prev) => [...prev, { ...formData, _id: tempId, id: tempId }]);
      }
      setStatus('⚠️ Exam saved locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }

    setExamModalOpen(false);
    setExamModalEntry(null);
  };

  const handleExamDelete = async (id) => {
    try {
      setStatus('Deleting exam...');
      setStatusType('saving');
      await deleteExam(id);
      setExams((prev) => prev.filter((e) => (e._id || e.id) !== id));
      setStatus('🗑️ Exam deleted');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Exam delete failed:', err);
      setExams((prev) => prev.filter((e) => (e._id || e.id) !== id));
      setStatus('⚠️ Exam deleted locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }

    setExamModalOpen(false);
    setExamModalEntry(null);
  };

  // ─── Clear All Exams ────────────────────────────────
  const handleClearAllExams = () => {
    if (exams.length === 0) return;
    setExamConfirmOpen(true);
  };

  const confirmClearAllExams = async () => {
    setExamConfirmOpen(false);
    try {
      setStatus('Clearing exams...');
      setStatusType('saving');
      await clearAllExams();
      setExams([]);
      setStatus('🗑️ All exams cleared');
      setStatusType('');
      setTimeout(() => setStatus(''), 2000);
    } catch (err) {
      console.error('Clear all exams failed:', err);
      setExams([]);
      setStatus('⚠️ Exams cleared locally (server unavailable)');
      setStatusType('error');
      setTimeout(() => setStatus(''), 3000);
    }
  };

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <RoutineGrid
        entries={entries}
        timeSlots={timeSlots}
        onCellClick={handleCellClick}
        onCardClick={handleCardClick}
        onClearAll={handleClearAll}
        onEditTimeSlots={() => setTimeSlotsEditorOpen(true)}
      />

      {/* Status bar */}
      {status && (
        <div className={`status-bar ${statusType}`}>
          {status}
        </div>
      )}

      {/* Exam Schedule Section */}
      <ExamSchedule
        exams={exams}
        onAddExam={handleAddExam}
        onEditExam={handleEditExam}
        onClearExams={handleClearAllExams}
      />

      {/* Class Add/Edit Modal */}
      {modalOpen && (
        <ClassModal
          mode={modalMode}
          entry={modalEntry}
          day={modalDay}
          slotId={modalSlotId}
          entries={entries}
          timeSlots={timeSlots}
          customCourses={customCourses}
          catalogCourses={catalogCourses}
          onAddCustomCourse={handleAddCustomCourse}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={handleModalClose}
        />
      )}

      {/* Exam Add/Edit Modal */}
      {examModalOpen && (
        <ExamModal
          mode={examModalMode}
          exam={examModalEntry}
          customCourses={customCourses}
          onAddCustomCourse={handleAddCustomCourse}
          onSave={handleExamSave}
          onDelete={handleExamDelete}
          onClose={handleExamModalClose}
        />
      )}

      {/* Clear All Routine Confirm */}
      {confirmOpen && (
        <ConfirmDialog
          title="Clear Entire Routine?"
          message="This will permanently remove all classes from the schedule. This action cannot be undone."
          onConfirm={confirmClearAll}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      {/* Clear All Exams Confirm */}
      {examConfirmOpen && (
        <ConfirmDialog
          title="Clear All Exams?"
          message="This will permanently remove all exams from the schedule. This action cannot be undone."
          onConfirm={confirmClearAllExams}
          onCancel={() => setExamConfirmOpen(false)}
        />
      )}

      {/* Time Slot Editor Modal */}
      {timeSlotsEditorOpen && (
        <TimeSlotEditor
          timeSlots={timeSlots}
          onSave={handleSaveTimeSlots}
          onReset={handleResetTimeSlots}
          onClose={() => setTimeSlotsEditorOpen(false)}
        />
      )}
    </div>
  );
}
