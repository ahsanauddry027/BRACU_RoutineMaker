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

courseSchema.index({ courseCode: 1 }, { unique: true });

const Course = mongoose.model('Course', courseSchema);

export default Course;
