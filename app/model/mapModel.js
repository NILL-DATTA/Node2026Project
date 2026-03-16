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
      type: String,
      default: "Point",
    },
    coordinates: [Number],
  },
});
mapSchema.index({ location: "2dsphere" });
module.exports = mongoose.model("mapSchema", mapSchema);
