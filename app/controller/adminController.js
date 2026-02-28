const { loginvalidate } = require("../validators/authvalidator");
const { adminDoctorvalidate } = require("../validators/postvalidator");
const DoctorSchema = require("../model/AdminModel");
let transporter = require("../config/emailConfig");
let AppointmentSchema = require("../model/AppointmentModel");
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
      let exist = await DoctorSchema.findOne({ name });
      if (exist) {
        return res.status(400).json({
          message: "Product with same name already exist",
        });
      }
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
      let { page = 1, limit = 10 } = req.body;
      page = parseInt(page);
      limit = parseInt(limit);
      const skip = (page - 1) * limit;
      const totalItems = await DoctorSchema.countDocuments();

      page = await DoctorSchema.create();

      let list = await DoctorSchema.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      res.status(201).json({
        message: "Doctor list fetch successfull",
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        data: list,
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

      let user = await adminSchema.findById(appointMent.userId);
      await transporter.sendMail({
        from: `"Hospital Management" <yourgmail@gmail.com>`,
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

      if (appointMent.status == "Cancelled") {
        return res.status(400).json({
          status: false,
          message: "Appoinment Cancelled",
        });
      }

      appointMent.status = "Cancelled";
      await appointMent.save();

      let user = await adminSchema.findById(appointMent.userId);
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
      let { departmentId } = req.params;
      console.log(departmentId);
      let doctors = await DoctorSchema.find(
        departmentId ? { departmentId: departmentId } : {},
      ).populate("departmentId");

      res.status(200).json({
        status: true,
        count: doctors.count,
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
      let list = await DoctorSchema.find().sort({ createdAt: -1 });

      res.status(200).json({
        status: true,
        data:list,
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
}

module.exports = new AdminController();
