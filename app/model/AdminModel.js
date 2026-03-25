const mongoose = require("mongoose");

const DoctorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },

    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true,
    },

    fees: {
      type: String,
      required: true,
    },

    schedule: {
      startTime: {
        type: String,
        required: true,
      },
      endTime: {
        type: String,
        required: true,
      },
      slotDuration: {
        type: Number,
        required: true,
      },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Doctor", DoctorSchema);
