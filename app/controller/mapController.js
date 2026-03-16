const mapSchema = require("../model/mapModel");

class MapController {
  async areaMap(req, res) {
    try {
      const { lat, lng, distance } = req.query;

      const maxDistance = distance ? Number(distance) : 5000;

      const centers = await mapSchema.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [Number(lng), Number(lat)],
            },
            distanceField: "distance",
            maxDistance: maxDistance,
            spherical: true,
          },
        },
      ]);
      res.status(200).json({
        status: true,
        total: centers.length,
        data: centers,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async createCenter(req, res) {
    try {
      const { name, address, phone, lat, lng } = req.body;

      const center = await mapSchema.create({
        name,
        address,
        phone,
        location: {
          type: "Point",
          coordinates: [Number(lng), Number(lat)],
        },
      });

      res.status(201).json({
        status: true,
        data: center,
      });
    } catch (error) {
      res.status(500).json({
        status: false,
        message: error.message,
      });
    }
  }
}

module.exports = new MapController();
