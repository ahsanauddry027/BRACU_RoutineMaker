import mongoose from 'mongoose';

const timeSlotSchema = new mongoose.Schema(
  {
    id: { type: Number, required: true },
    start: { type: String, required: true },
    end: { type: String, required: true },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      default: 'global',
    },
    timeSlots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
