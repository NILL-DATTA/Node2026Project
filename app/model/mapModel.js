
const mongoose = require("mongoose");

const mapSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },

  location: {
    type: {
      type: string,
      default: "Point",
    },
    coordinates: [Number],
  },
});
DiagnosticSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("mapSchema", mapSchema);
