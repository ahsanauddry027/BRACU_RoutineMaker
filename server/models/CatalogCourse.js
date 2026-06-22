import mongoose from 'mongoose';

// A single class meeting (theory or lab) within a section's schedule.
const meetingSchema = new mongoose.Schema(
  {
    day: String,
    startTime: String,
    endTime: String,
    room: String,
  },
  { _id: false }
);

/**
 * A snapshot of one USIS section, persisted in MongoDB so the catalog
 * survives restarts and can be queried with indexes instead of being
 * re-fetched from the external API and filtered in memory every time.
 */
const catalogCourseSchema = new mongoose.Schema(
  {
    sectionId: { type: Number, index: true },
    courseCode: { type: String, index: true },
    courseTitle: String,
    sectionName: String,
    courseCredit: Number,
    instructor: String,
    labInstructor: String,
    schedule: [meetingSchema],
    labSchedule: [meetingSchema],
    examDate: String,
    examStartTime: String,
    examEndTime: String,
    examDetail: String,
    department: String,
    semester: String,
    status: String,
  },
  { timestamps: true }
);

const CatalogCourse = mongoose.model('CatalogCourse', catalogCourseSchema);

export default CatalogCourse;
