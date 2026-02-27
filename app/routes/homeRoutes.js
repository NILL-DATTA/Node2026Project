const express = require("express");
const AuthController = require("../controller/authController");
const DoctorControllerUser = require("../controller/doctorController");
const checkRole = require("../../app/middleware/auth");
const router = express.Router();
router.post("/auth/register", AuthController.signUp);
router.post("/auth/login", AuthController.signIn);
router.post("/auth/verify_otp", AuthController.otp);
router.post("/auth/resend-otp", AuthController.resendOtp);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/doctor/appointment",
  checkRole("user"),
  DoctorControllerUser.apponintmentCreate,
);
module.exports = router;
