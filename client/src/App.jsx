import React, { useState, useEffect, useCallback } from 'react';
import RoutineGrid from './components/RoutineGrid';
import ClassModal from './components/ClassModal';
import ConfirmDialog from './components/ConfirmDialog';
import ExamSchedule from './components/ExamSchedule';
import ExamModal from './components/ExamModal';
import { fetchRoutine, createEntry, updateEntry, deleteEntry, clearAllEntries } from './api/routine';
import { fetchExams, createExam, updateExam, deleteExam } from './api/exams';
import { rebuildColorMap, clearColorMap } from './utils/colors';
import { isFriday } from './constants/schedule';

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

  // ─── Exam State ─────────────────────────────────────
  const [exams, setExams] = useState([]);
  const [examModalOpen, setExamModalOpen] = useState(false);
  const [examModalMode, setExamModalMode] = useState('add');
  const [examModalEntry, setExamModalEntry] = useState(null);

  // ─── Load data on mount ─────────────────────────────
  useEffect(() => {
    loadEntries();
    loadExams();
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

  // ─── Render ─────────────────────────────────────────
  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <RoutineGrid
        entries={entries}
        onCellClick={handleCellClick}
        onCardClick={handleCardClick}
        onClearAll={handleClearAll}
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
      />

      {/* Class Add/Edit Modal */}
      {modalOpen && (
        <ClassModal
          mode={modalMode}
          entry={modalEntry}
          day={modalDay}
          slotId={modalSlotId}
          entries={entries}
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
          onSave={handleExamSave}
          onDelete={handleExamDelete}
          onClose={handleExamModalClose}
        />
      )}

      {/* Clear All Confirm */}
      {confirmOpen && (
        <ConfirmDialog
          title="Clear Entire Routine?"
          message="This will permanently remove all classes from the schedule. This action cannot be undone."
          onConfirm={confirmClearAll}
          onCancel={() => setConfirmOpen(false)}
        />
      )}
    </div>
  );
}
