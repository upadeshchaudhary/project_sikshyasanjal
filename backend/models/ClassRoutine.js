const mongoose = require("mongoose");

// Helper: Validate daily schedule
function validateDayPeriods(periods) {
  if (!Array.isArray(periods)) return false;

  // Must have exactly 8 periods
  if (periods.length !== 8) return false;

  let breakCount = 0;

  for (let i = 0; i < periods.length; i++) {
    const p = periods[i];

    // Period numbering must match order
    if (p.periodNo !== i + 1) return false;

    if (p.isBreak) {
      breakCount++;

      // Lunch break must be after 4th period (i.e., period 5)
      if (p.periodNo !== 5) return false;
    } else {
      // Non-break must have subject + teacher
      if (!p.subject || !p.teacher) return false;
    }
  }

  // Only one break allowed
  return breakCount === 1;
}

// Period Schema
const periodSchema = new mongoose.Schema(
  {
    periodNo: { type: Number, required: true }, // 1-8
    startTime: { type: String },
    endTime: { type: String },
    subject: { type: String, trim: true, default: "" },
    teacher: { type: String, trim: true, default: "" },
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    room: { type: String, trim: true, default: "" },
    isBreak: { type: Boolean, default: false },
  },
  { _id: false }
);

// Main Schema
const classRoutineSchema = new mongoose.Schema(
  {
    school: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "School",
      required: true,
      index: true,
    },

    // Class teacher (must exist)
    classTeacher: {
      type: String,
      trim: true,
      required: true,
    },

    // Map: subject -> teacher
    subjectTeacherMap: {
      type: Map,
      of: String,
      default: {},
    },

    class: {
      type: String,
      required: true,
      trim: true,
    },

    academicYear: {
      type: String,
      required: true,
    },

    // Weekdays (validated)
    monday: {
      type: [periodSchema],
      validate: [validateDayPeriods, "Invalid Monday schedule"],
    },
    tuesday: {
      type: [periodSchema],
      validate: [validateDayPeriods, "Invalid Tuesday schedule"],
    },
    wednesday: {
      type: [periodSchema],
      validate: [validateDayPeriods, "Invalid Wednesday schedule"],
    },
    thursday: {
      type: [periodSchema],
      validate: [validateDayPeriods, "Invalid Thursday schedule"],
    },
    friday: {
      type: [periodSchema],
      validate: [validateDayPeriods, "Invalid Friday schedule"],
    },

    // Weekends (no schedule)
    sunday: {
      type: [periodSchema],
      default: [],
    },
    saturday: {
      type: [periodSchema],
      default: [],
    },

    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

// Unique constraint per class per year
classRoutineSchema.index(
  { school: 1, class: 1, academicYear: 1 },
  { unique: true }
);

// Pre-save validation: First period rule
classRoutineSchema.pre("save", function (next) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday"];

  let firstSubject = null;

  for (const day of days) {
    const periods = this[day];

    if (!periods || periods.length === 0) continue;

    const firstPeriod = periods[0];

    // First period cannot be break
    if (firstPeriod.isBreak) {
      return next(new Error(`First period cannot be a break on ${day}`));
    }

    // Set baseline subject from first day
    if (!firstSubject) {
      firstSubject = firstPeriod.subject;
    }

    // Must be same subject all days
    if (firstPeriod.subject !== firstSubject) {
      return next(
        new Error("First period subject must be same for all weekdays")
      );
    }

    // Must be taught by class teacher
    if (firstPeriod.teacher !== this.classTeacher) {
      return next(
        new Error("First period must be taught by class teacher")
      );
    }
  }

  next();
});

module.exports = mongoose.model("ClassRoutine", classRoutineSchema);