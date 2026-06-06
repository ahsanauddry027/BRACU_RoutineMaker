import mongoose from 'mongoose';

const routineEntrySchema = new mongoose.Schema(
  {
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
    },
    type: {
      type: String,
      enum: {
        values: ['THEORY', 'LAB'],
        message: 'Type must be either THEORY or LAB',
      },
      required: [true, 'Class type is required'],
    },
    section: {
      type: String,
      required: [true, 'Section is required'],
      trim: true,
    },
    faculty: {
      type: String,
      required: [true, 'Faculty initials are required'],
      trim: true,
      uppercase: true,
    },
    room: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
      uppercase: true,
    },
    remainingSeats: {
      type: Number,
      required: [true, 'Remaining seats is required'],
      min: [0, 'Remaining seats cannot be negative'],
    },
    days: {
      type: [String],
      required: [true, 'At least one day is required'],
      validate: {
        validator: function (v) {
          return v && v.length > 0;
        },
        message: 'At least one day must be specified',
      },
    },
    startSlot: {
      type: Number,
      required: [true, 'Start slot is required'],
      min: 1,
      max: 7,
    },
    endSlot: {
      type: Number,
      required: [true, 'End slot is required'],
      min: 1,
      max: 7,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient querying by day and slot
routineEntrySchema.index({ days: 1, startSlot: 1 });

const RoutineEntry = mongoose.model('RoutineEntry', routineEntrySchema);

export default RoutineEntry;
