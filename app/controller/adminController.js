const { loginvalidate } = require("../validators/authvalidator");
const { adminDoctorvalidate } = require("../validators/postvalidator");
const DoctorSchema = require("../model/AdminModel");
let transporter = require("../config/emailConfig");
let AppointmentSchema = require("../model/AppointmentModel");
const userSchema = require("../model/authModel");
const DepartmentSchema = require("../model/AdmindepartmentModel");
const adminSchema = require("../model/adminUser");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const slotSchemaModel = require("../model/slotSchemaModel");

class AdminController {
  async signIn(req, res) {
    try {
      const { error, value } = loginvalidate.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { email, password } = value;

      let user = await adminSchema.findOne({ email });

      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email and password",
        });
      }

      let isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: false,
          message: "Invalid email and password",
        });
      }

      let token;
      if (user && isMatch && user.role === "admin") {
        token = jwt.sign({ id: user._id, role: user.role }, "secret_key", {
          expiresIn: "5m",
        });
      }
      if (user && isMatch) {
        token = jwt.sign({ id: user._id, role: user.role }, "secret_key", {
          expiresIn: "5m",
        });

        const refreshToken = jwt.sign(
          { id: user._id, role: user.role },
          "secret_refresh",
          { expiresIn: "7d" },
        );

        user.refreshToken = refreshToken;
        await user.save();

        res.cookie("refreshToken", refreshToken, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      res.status(200).json({
        status: true,
        message: "Admin login successfull",
        data: {
          email: user.email,
          role: user.role,
          id: user._id,
        },
        token,
      });
    } catch (err) {
      console.log(err);
      return res.status(500).json({
        status: false,
        message: "Something is Error",
      });
    }
  }

  async departmentCreate(req, res) {
    const { name, description } = req.body;

    try {
      const department = new DepartmentSchema({
        name,
        description,
      });

      await department.save();
      res
        .status(201)
        .json({ message: "Department created successfully", department });
    } catch (err) {
      res
        .status(500)
        .json({ message: "Error creating department", error: err });
    }
  }
  async createDoctor(req, res) {
    try {
      const { error, value } = adminDoctorvalidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details[0].message,
        });
      }

      let { name, fees, departmentId, schedule } = value;

      let data = new DoctorSchema({
        name,
        fees,
        departmentId,
        schedule: {
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          slotDuration: schedule.slotDuration,
        },
      });

      let savePost = await data.save();

      return res.status(201).json({
        status: true,
        message: "Doctor data created successfully",
        data: savePost,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async doctorListData(req, res) {
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

      res.status(200).json({
        message: "Doctor list fetch successful",
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

  async doctorDelete(req, res) {
    try {
      const listData = req.body.id;

      const listDelete = await DoctorSchema.findOne({ _id: listData });

      console.log(listData, "listDelete");
      if (!listDelete) {
        return res.status(401).json({
          status: false,
          message: "Data not found",
        });
      }

      const data = await DoctorSchema.findByIdAndDelete(listData);
      return res.status(201).json({
        status: true,
        message: "Doctor data delete successfully",
        data: data,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async doctorUpdate(req, res) {
    try {
      const { id, name, fees, availableSlots } = req.body;
      const existupdate = await DoctorSchema.findOne({ _id: id });
      if (!existupdate) {
        return res.status(400).json({
          status: false,
          message: "Id is required",
        });
      }

      let updateData = await DoctorSchema.findByIdAndUpdate(
        existupdate,
        { name, fees, availableSlots },
        { new: true }, //return new data
      );

      if (!updateData) {
        return res.status(400).json({
          status: false,
          message: "Update not happen",
        });
      }

      return res.status(200).json({
        message: "Doctor update successfull",
        data: updateData,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async doctorDetails(req, res) {
    try {
      let dataID = req.params.id;
      let ID = await DoctorSchema.findOne({ _id: dataID });
      if (!ID) {
        return res.status(400).json({
          status: false,
          message: "This is not valid product ",
        });
      }

      let data = await DoctorSchema.findById(ID);

      return res.status(200).json({
        status: true,
        message: "Data fetch succesfull",
        data: data,
      });
    } catch (err) {
      return res.status(500).json({
        message: err.message,
      });
    }
  }
  async confirmAppointment(req, res) {
    try {
      let { id } = req.params;

      let appointMent = await AppointmentSchema.findById(id);

      if (!appointMent) {
        return res.status(404).json({
          status: false,
          message: "Appointment not found",
        });
      }

      if (appointMent.status === "Confirmed") {
        return res.status(400).json({
          status: false,
          message: "Appointment already confirmed",
        });
      }

      if (appointMent.status === "Cancelled") {
        return res.status(400).json({
          status: false,
          message: "Cancelled appointment cannot be confirmed",
        });
      }

      appointMent.status = "Confirmed";
      await appointMent.save();

      await slotSchemaModel.findOneAndUpdate(
        {
          doctorId: appointMent.doctorId,
          date: appointMent.date,
          time: appointMent.time,
        },
        {
          isBooked: true,
        },
      );

      let user = await userSchema.findById(appointMent.userId);

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      await transporter.sendMail({
        from: `"Hospital Management"<yourgmail@gmail.com>`,
        to: user.email,
        subject: "Appointment Confirmed",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: green;">Appointment Confirmed</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment has been confirmed.</p>
          <p><strong>Date:</strong> ${appointMent.date}</p>
          <p><strong>Time:</strong> ${appointMent.time}</p>
          <br/>
          <p>Thank you.</p>
        </div>
      `,
      });

      return res.status(200).json({
        status: true,
        data: appointMent,
        message: "Appointment confirmed successfully",
      });
    } catch (err) {
      console.log("❌ Error:", err.message);

      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        error: err.message,
      });
    }
  }

  async cancelledAppointment(req, res) {
    try {
      let { id } = req.params;

      let appointMent = await AppointmentSchema.findById(id);

      if (!appointMent) {
        return res.status(404).json({
          status: false,
          message: "Appointment not found",
        });
      }

      if (appointMent.status === "Cancelled") {
        return res.status(400).json({
          status: false,
          message: "Appointment already cancelled",
        });
      }

      // if (appointMent.status === "Confirmed") {
      //   return res.status(400).json({
      //     status: false,
      //     message: "Confirmed appointment cannot be cancelled",
      //   });
      // }

      appointMent.status = "Cancelled";
      await appointMent.save();

      await slotSchemaModel.findOneAndUpdate(
        {
          doctorId: appointMent.doctorId,
          date: appointMent.date,
          time: appointMent.time,
        },
        {
          isBooked: false,
          bookedBy: null,
        },
      );

      let user = await userSchema.findById(appointMent.userId);

      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      await transporter.sendMail({
        from: `"Hospital Management" <yourgmail@gmail.com>`,
        to: user.email,
        subject: "Appointment Cancelled",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: red;">Appointment Cancelled</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment has been cancelled.</p>
          <p><strong>Date:</strong> ${appointMent.date}</p>
          <p><strong>Time:</strong> ${appointMent.time}</p>
          <br/>
          <p>Thank you.</p>
        </div>
      `,
      });

      return res.status(200).json({
        status: true,
        data: appointMent,
        message: "Appointment cancelled successfully",
      });
    } catch (err) {
      console.log("❌ Error:", err.message);

      return res.status(500).json({
        status: false,
        message: "Something went wrong",
        error: err.message,
      });
    }
  }

  async appointMentList(req, res) {
    try {
      let appointlist = await AppointmentSchema.find({
        status: "Pending",
      }).sort({ createdAt: -1 });
      res.status(201).json({
        message: "Appointment list fetch successfull",
        data: appointlist,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async departmentwiseDoctor(req, res) {
    try {
      const { departmentId } = req.params;
      console.log(departmentId, "departmentId");
      const doctors = await DoctorSchema.find({
        departmentId: departmentId,
      }).populate("departmentId");

      console.log(doctors, "doctors");
      res.status(200).json({
        status: true,
        count: doctors.length,
        data: doctors,
        message: "Doctor fetched successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async departmentList(req, res) {
    try {
      let list = await DepartmentSchema.find().sort({ createdAt: -1 });

      res.status(200).json({
        status: true,
        data: list,
        message: "Department list fetch successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Error showing",
        error: err.message,
      });
    }
  }

  async departMentdelete(req, res) {
    try {
      const departMentId = req.body.id;

      const department = await DepartmentSchema.findOne({ _id: departMentId });
      console.log(department, "departMentId");
      if (!department) {
        return res.status(401).json({
          status: false,
          message: "Department not found",
        });
      }

      const data = await DepartmentSchema.findByIdAndDelete(departMentId);
      console.log(data, "jkcf");
      return res.status(201).json({
        status: true,
        message: "Department data delete successfully",
        data: data,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async appointMentAccpetlist(req, res) {
    try {
      let today = new Date();
      today.setHours(0, 0, 0, 0);
      let nextday = new Date();
      nextday.setDate(today.getDate() + 7);
      nextday.setHours(23, 59, 59, 999);
      console.log(today, "Today");
      console.log(nextday, "NextDay");
      const list = await AppointmentSchema.aggregate([
        {
          $match: {
            status: "Confirmed",
            date: { $gte: today, $lte: nextday },
          },
        },
        {
          $sort: { date: 1 },
        },
      ]);

      res.status(200).json({
        status: true,
        data: list,
        message: "Data fetch list successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        error: err.message,
        message: "Error showing",
      });
    }
  }

  async adminLogout(req, res) {
    try {
      let adminToken = req.cookies.refreshToken;
      if (!adminToken) {
        return res.status(400).json({
          status: false,
          message: "No refresh token found",
        });
      }
      let account = await userSchema.findOne({ refreshToken: adminToken });
      if (!account) {
        account = await adminSchema.findOne({ refreshToken: adminToken });
      }

      if (account) {
        adminToken.refreshToken = null;
        await adminToken.save();
      }
      res.clearCookie("refreshToken", {
        httpOnly: true,
        path: "/",
        secure: true,
        sameSite: "none",
      });

      res.status(200).json({
        status: true,
        message: "Refresh Token removed successfully",
      });
    } catch (err) {}
    res.status(200).json({
      status: true,
      message: "Refresh Token removed successfully",
    });
  }
}

module.exports = new AdminController();
