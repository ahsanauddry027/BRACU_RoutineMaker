import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      unique: true,
    },
    courseTitle: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  }
);

// Note: the unique index on courseCode is created by `unique: true` on the
// field above — no separate schema.index() call needed.

const Course = mongoose.model('Course', courseSchema);

export default Course;
