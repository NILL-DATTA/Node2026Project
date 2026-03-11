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

      let { name, specialization, fees, availableSlots, departmentId } = value;
      //   let userId = req?.user?.id;
      // let exist = await DoctorSchema.findOne({ departmentId });
      // if (exist) {
      //   return res.status(400).json({
      //     message: "Same Id already exist",
      //   });
      // }
      let data = new DoctorSchema({
        name,
        specialization,
        fees,
        availableSlots,
        departmentId,
      });

      let savePost = await data.save();
      //  savePost = await DoctorSchema.findById(savePost.id).populate(
      //   "departmentId",
      // );
      return res.status(201).json({
        message: "Doctor  data create  successfully",
        data: savePost,
      });
    } catch (err) {
      res.status(500).json({
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
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { specialization: { $regex: search, $options: "i" } },
            ],
          },
        },
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

  async searchList(req, res) {
    try {
      let search = req.params.searchData;
      console.log(search, "search");
      let searchData = await DoctorSchema.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { fees: Number(search) },
        ],
      });

      if (searchData.length == 0) {
        return res.status(404).json({
          status: false,
          message: "Doctor not found",
        });
      }

      res.status(200).json({
        status: true,
        data: searchData,
        message: `${search} found successfully`,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: `Error showing`,
        error: err.message,
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
      const { id, name, specialization, fees, availableSlots } = req.body;
      const existupdate = await DoctorSchema.findOne({ _id: id });
      if (!existupdate) {
        return res.status(400).json({
          status: false,
          message: "Id is required",
        });
      }

      let updateData = await DoctorSchema.findByIdAndUpdate(
        existupdate,
        { name, specialization, fees, availableSlots },
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
        return res.status(400).json({
          status: false,
          message: "Appointment not found",
        });
      }

      if (appointMent.status == "Confirmed") {
        return res.status(400).json({
          status: false,
          message: "Appoinment already Confirmed",
        });
      }

      appointMent.status = "Confirmed";
      await appointMent.save();

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
        subject: "Appointment Booked Successfully",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: green;"> Appointment Booked  Successfully</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment has been BookedSuccessfully.</p>
          <p><strong>Date:</strong> ${appointMent.date}</p>
          <p><strong>Time:</strong> ${appointMent.time}</p>
          <br/>
          <p>Thank you.</p>
        </div>
      `,
      });
      res.status(200).json({
        status: true,
        data: appointMent,
        message: "Appoinmtent Confirmed sucessfully",
      });
    } catch (err) {
      res.status(500).json({
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
        return res.status(400).json({
          status: false,
          message: "Appointment not found",
        });
      }

      console.log(appointMent, "user");
      if (appointMent.status == "Cancelled") {
        return res.status(400).json({
          status: false,
          message: "Appoinment already Cancelled",
        });
      }

      appointMent.status = "Cancelled";
      await appointMent.save();

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
        subject: "Appointment Booking Cancelled",
        html: `
        <div style="font-family: Arial;">
          <h2 style="color: green;"> Appointment Booking Cancelled</h2>
          <p>Dear ${user.first_name},</p>
          <p>Your appointment has been Cancel.</p>
          <p><strong>Date:</strong> ${appointMent.date}</p>
          <p><strong>Time:</strong> ${appointMent.time}</p>
          <br/>
          <p>Thank you.</p>
        </div>
      `,
      });
      res.status(200).json({
        status: true,
        data: appointMent,
        message: "Appoinmtent Cancelled",
      });
    } catch (err) {
      res.status(500).json({
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
