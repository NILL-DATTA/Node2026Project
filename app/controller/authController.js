const generateOTP = require("../helper/generateOtp");
const sendEmailverificationOtp = require("../helper/sendEmailverification");
const userSchema = require("../model/authModel");
const Otp = require("../model/otpModel");
const { otpValidate } = require("../validators/authvalidator");
const { regsiterValidate } = require("../validators/authvalidator");
const { loginvalidate } = require("../validators/authvalidator");
const adminSchema = require("../model/adminUser");
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
      const hashedPassword = await bcrypt.hash(password, 10);

      if (EmailCheck) {
        if (!EmailCheck.is_verified) {
          await sendEmailverificationOtp(EmailCheck);
          return res.status(200).json({
            status: true,
            message: "Email already registered but OTP resent",
          });
        }
        return res.status(400).json({
          status: false,
          message: "Email Already exist",
        });
      }

      const Data = await userSchema.create({
        first_name,
        last_name,
        email,
        address,
        password: hashedPassword,
        is_verified: false,
      });

      await sendEmailverificationOtp(Data);

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

      console.log("Received userId:", userId);
      console.log("Received otp:", otp);

      const checkOtp = await Otp.findOne({
        userId: String(userId),
        otp: String(otp),
      });

      console.log("OTP found:", checkOtp);

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
          message: "User not found",
        });
      }

      if (existuser.is_verified) {
        return res.status(400).json({
          status: false,
          message: "Email already verified",
        });
      }

      if (new Date() > checkOtp.expiresAt) {
        console.log("OTP expired, resending...");
        await Otp.deleteMany({ userId });
        await sendEmailverificationOtp(existuser);
        return res.status(400).json({
          status: false,
          message: "OTP expired, A new OTP has been sent to your email.",
        });
      }

      existuser.is_verified = true;
      await Otp.deleteMany({ userId });
      await existuser.save();

      res.status(200).json({
        status: true,
        message: "OTP verified successfully",
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
      // Validate login input
      const { error, value } = loginvalidate.validate(req.body);
      if (error) {
        return res.status(400).json({
          status: false,
          message: error.details.map((d) => d.message).join(", "),
        });
      }

      const { email, password } = value;

      // Check if user exists
      let user = await userSchema.findOne({ email });
      if (!user) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password",
        });
      }

      // Check password match
      let isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({
          status: false,
          message: "Invalid email or password",
        });
      }

      // Generate access token
      let token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "5m" },
      );

      // Generate refresh token
      let refreshToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "7d" },
      );

      // Save the refresh token to the user
      user.refreshToken = refreshToken;
      await user.save();

      // Set refresh token in cookies
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use true in production
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Respond with success and tokens
      res.status(200).json({
        status: true,
        message: "Login successful",
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
        message: "Something went wrong",
      });
    }
  }

  async refreshToken(req, res) {
    try {
      const cookieToken = req.cookies.refreshToken;

      if (!cookieToken) {
        return res.status(401).json({
          status: false,
          message: "No refresh token found",
        });
      }

      let decoded;
      try {
        decoded = jwt.verify(cookieToken, "secret_refresh");
      } catch (err) {
        return res.status(400).json({
          status: false,
          message: "Refresh token expired or invalid",
        });
      }

      let account = await userSchema.findById(decoded.id);
      if (!account) {
        account = await adminSchema.findById(decoded.id);
      }

      if (!account) {
        return res.status(403).json({
          status: false,
          message: "Invalid refresh token",
        });
      }

      const newAccessToken = jwt.sign(
        { id: account._id, role: account.role },
        "secret_key",
        { expiresIn: "5m" },
      );

      const newRefreshToken = jwt.sign(
        { id: account._id, role: account.role },
        "secret_refresh",
        { expiresIn: "7d" },
      );

      account.refreshToken = newRefreshToken;
      await account.save();

      res.cookie("refreshToken", newRefreshToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        status: true,
        token: newAccessToken,
        message: "Access token refreshed successfully",
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: "Server error",
        error: err.message,
      });
    }
  }
  async resendOtp(req, res) {
    try {
      let { email } = req.body;

      let userCheck = await userSchema.findOne({ email });

      if (!userCheck) {
        return res.status(400).json({
          status: false,
          message: "User not found",
        });
      }

      if (userCheck.resendCount >= 3) {
        return res.status(400).json({
          status: false,
          message: "Otp limit crossed",
        });
      }

      let now = Date.now();

      if (userCheck.lastSentAt && now - userCheck.lastSentAt < 30000) {
        return res.status(400).json({
          status: false,
          message: "after 30 sec you will able",
        });
      }

      const otp = generateOTP();
      userCheck.otp = otp;
      userCheck.otpExpires = now + 2 * 60 * 1000;
      userCheck.resendCount += 1;
      userCheck.lastSentAt = now;
      await userCheck.save();

      await sendEmailverificationOtp(userCheck);

      res.status(200).json({
        status: true,
        message: "Otp resend succesfully",
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

module.exports = new AuthController();
