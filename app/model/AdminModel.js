const mongoose = require("mongoose");

const SlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
  },
  time: {
    type: String,
    required: true,
  },
});
const DoctorSchema = new mongoose.Schema({
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
  availableSlots: [SlotSchema],

},
  { timestamps: true } 
);

module.exports = mongoose.model("DoctorSchema", DoctorSchema);
