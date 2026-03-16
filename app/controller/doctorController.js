let appointmentValidate = require("../validators/appointmentvalidator");
let AppointmentSchema = require("../model/AppointmentModel");
let transporter = require("../config/emailConfig");
const userSchema = require("../model/authModel");
const DoctorSchema = require("../model/AdminModel");

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

      let { doctorId, userId, date, time, status, name } = value;

      let user = await userSchema.findById(userId);

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      let exist = await AppointmentSchema.findOne({ time });

      if (exist) {
        return res.status(401).json({
          status: false,
          message: "This time slot is already booked by another patient.",
        });
      }

      let data = await AppointmentSchema.create({
        doctorId,
        userId,
        date,
        name,
        time,
        status,
      });
      // let user = await userSchema.findById(userId);
      await transporter.sendMail({
        from: `"Hospital Management" <yourgmail@gmail.com>`,
        to: user.email,
        subject: "Appointment Booking Pending",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: green;"> Appointment Booking  Pending</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment has been Pending.</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Time:</strong> ${time}</p>
          <br/>
          <p>Thank you.</p>
        </div>
      `,
      });
      res.status(200).json({
        status: true,
        data: data,
        message: "Appointment created successfully!",
      });

      console.log(data, "jjj");
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
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

  // async userSearchList(req, res) {
  //   try {
  //     let search = req.params.searchData;
  //     let searchData = await DoctorSchema.find({
  //       $or: [
  //         { name: { $regex: search, $options: "i" } },
  //         { fees: Number(search) },
  //       ],
  //     });

  //     if (searchData.length == 0) {
  //       return res.status(404).json({
  //         status: false,
  //         message: "Doctor not found",
  //       });
  //     }

  //     res.status(200).json({
  //       status: true,
  //       data: searchData,
  //       message: `${search} found successfully`,
  //     });
  //   } catch (err) {
  //     res.status(500).json({
  //       status: false,
  //       message: `Error showing`,
  //       error: err.message,
  //     });
  //   }
  // }
}

module.exports = new DoctorControllerUser();
