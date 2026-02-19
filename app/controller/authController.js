// const jwt = require("jsonwebtoken");
const { use } = require("react");
const sendEmailverificationOtp = require("../helper/sendEmailverification");
const userSchema = require("../model/authModel");
const Otp = require("../model/otpModel");
const { otpValidate } = require("../validators/authvalidator");
const { regsiterValidate } = require("../validators/authvalidator");
const { loginvalidate } = require("../validators/authvalidator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
class AuthController {
  async signUp(req, res) {
    try {
      const { error, value } = regsiterValidate.validate(req.body);

      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { first_name, last_name, email, address, password } = value;

      const EmailCheck = await userSchema.findOne({ email });
      if (EmailCheck) {
        return res.status(400).json({
          status: false,
          message: "Email Already exist",
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const Data = await userSchema.create({
        first_name,
        last_name,
        email,
        address,
        password: hashedPassword,
        is_verified: false,
      });

      await sendEmailverificationOtp(Data);
      // const secret = process.env.JWT_SECRET || "sagnikduttawebskitters";

      // const token = jwt.sign({ id: Data._id, email: Data.email }, secret, {
      //   expiresIn: "1d",
      // });

      res.status(200).json({
        status: true,
        message: "Register successfull and otp send you succesfully",
        data: {
          id: Data._id,
          name: `${Data.first_name} ${Data.last_name}`,
          email: Data.email,
          address: Data.address,
        },
        // token,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async otp(req, res) {
    try {
      const { error, value } = otpValidate.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((item) => item.message).join(),
        });
      }

      const { userId, otp } = value;

      const checkOtp = await Otp.findOne({ userId, otp });

      if (!checkOtp) {
        return res.status(400).json({
          status: false,
          message: "Invalid OTP, please request a new one",
        });
      }

      const existuser = await userSchema.findById(userId);
      if (!existuser) {
        return res.status(400).json({
          status: false,
          message: "user not found",
        });
      }

      if (existuser.is_verified) {
        return res.status(400).json({
          status: false,
          message: "Email already verified",
        });
      }

      if (new Date() > checkOtp.expiresAt) {
        await Otp.deleteMany({ userId });
        await sendEmailverificationOtp(existuser);
        return res.status(400).json({
          status: false,
          message: "OTP expired,A new OTP has been sent to your email.",
        });
      }

      existuser.is_verified = true;
      await Otp.deleteMany({ userId });
      await existuser.save();

      res.status(200).json({
        status: true,
        message: "Otp verified successfully ",
      });
    } catch (err) {
      console.log("OTP VERIFY ERROR:", err);
      return res.status(500).json({
        status: false,
        message: "Something went wrong. Please try again.",
      });
    }
  }

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
      if (user && isMatch && user.role === "user") {
        token = jwt.sign({ id: user._id, role: user.role }, "secret_key", {
          expiresIn: "1h",
        });
      }

      res.status(200).json({
        status: true,
        message: "Login successfull",
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
}

module.exports = new AuthController();
