let appointmentValidate = require("../validators/appointmentvalidator");
let AppointmentSchema = require("../model/AppointmentModel");
let transporter = require("../config/emailConfig");
const userSchema = require("../model/authModel");
const DoctorSchema = require("../model/AdminModel");
const slotSchemaModel = require("../model/slotSchemaModel");

class DoctorControllerUser {
  async apponintmentCreate(req, res) {
    try {
      let { error, value } = appointmentValidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      let { doctorId, userId, date, time, name } = value;

      let user = await userSchema.findById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      const slot = await slotSchemaModel.findOneAndUpdate(
        {
          doctorId,
          date,
          time,
          isBooked: false,
        },
        {
          isBooked: true,
          bookedBy: userId,
        },
        { new: true },
      );

      if (!slot) {
        return res.status(400).json({
          status: false,
          message: "Slot already booked or not available",
        });
      }

      let data = await AppointmentSchema.create({
        doctorId,
        userId,
        date,
        name,
        time,
        status: "Pending",
      });

      await transporter.sendMail({
        from: `"Hospital Management" <yourgmail@gmail.com>`,
        to: user.email,
        subject: "Appointment Booking Pending",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: orange;"> Appointment Pending</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment request is pending approval.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <br/>
          <p>Please wait for confirmation.</p>
        </div>
      `,
      });

      return res.status(200).json({
        status: true,
        data: data,
        message: "Appointment request sent, waiting for approval",
      });
    } catch (err) {
      console.log(" Error:", err.message);

      return res.status(500).json({
        status: false,
        message: "Error creating appointment",
      });
    }
  }
  async user_doctorListData(req, res) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 5;
      const search = req.query.search || "";

      const skip = (page - 1) * limit;

      const pipeline = [
        {
          $lookup: {
            from: "departments",
            localField: "departmentId",
            foreignField: "_id",
            as: "department",
          },
        },
        {
          $unwind: {
            path: "$department",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { "department.name": { $regex: search, $options: "i" } },
            ],
          },
        },

        {
          $sort: { createdAt: -1 },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            totalCount: [{ $count: "count" }],
          },
        },
      ];
      const result = await DoctorSchema.aggregate(pipeline);
      const doctors = result[0].data;
      const totalItems = result[0].totalCount[0]?.count || 0;

      res.status(201).json({
        message: "Doctor list fetch successfull",
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: doctors,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
  async getDoctorSlots(req, res) {
    try {
      const { doctorId, date } = req.body;

      if (!doctorId || !date) {
        return res.status(400).json({
          status: false,
          message: "doctorId and date are required",
        });
      }

      const slots = await slotSchemaModel.find({
        doctorId,
        date,
        isBooked: false,
      }).sort({ time: 1 });

      return res.status(200).json({
        status: true,
        message: "Available slots fetched",
        data: slots,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}

module.exports = new DoctorControllerUser();
