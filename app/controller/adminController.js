const { loginvalidate } = require("../validators/authvalidator");
const { adminDoctorvalidate } = require("../validators/postvalidator");
const DoctorSchema = require("../model/AdminModel");
const userSchema = require("../model/authModel");
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

      let user = await userSchema.findOne({ email });

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
          expiresIn: "1h",
        });
      }

      res.status(200).json({
        status: true,
        message: "Admin login successfull",
        data: {
          email: user.email,
          password: user.password,
          role: user.role,
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

  async createDoctor(req, res) {
    try {
      const { error, value } = adminDoctorvalidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details[0].message,
        });
      }

      let { name, specialization, fees, availableSlots } = value;
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
      });

      let savePost = await data.save();
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
}

module.exports = new AdminController();
