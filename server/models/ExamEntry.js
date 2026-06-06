import mongoose from 'mongoose';

const examEntrySchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    examDate: {
      type: String,
      required: [true, 'Exam date is required'],
    },
    examTime: {
      type: String,
      required: [true, 'Exam time is required'],
    },
    room: {
      type: String,
      required: [true, 'Room is required'],
      trim: true,
      uppercase: true,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

examEntrySchema.index({ examDate: 1 });

const ExamEntry = mongoose.model('ExamEntry', examEntrySchema);

export default ExamEntry;
