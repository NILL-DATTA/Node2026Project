const express = require("express");
const AuthController = require("../controller/authController");
const MapController = require("../controller/mapController");
const DoctorControllerUser = require("../controller/doctorController");
const checkRole = require("../../app/middleware/auth");
const router = express.Router();
router.post("/auth/register", AuthController.signUp);
router.post("/auth/login", AuthController.signIn);
router.post("/auth/verify_otp", AuthController.otp);
router.post("/refresh-token", AuthController.refreshToken);
router.post(
  "/doctor/appointment",
  checkRole("user"),

  DoctorControllerUser.apponintmentCreate,
);
router.get(`/user/profile`, checkRole("user"), AuthController.profile);
router.post(`/user/logout`, checkRole("user"), AuthController.userLogout);
router.post(`/auth/resetlink`, AuthController.ResetLink);
router.post(`/reset-password/:id/:token`, AuthController.resetPassword);
router.post(
  `/user/doctor/list`,
  checkRole("user"),
  DoctorControllerUser.user_doctorListData,
);

router.get(`/diagnostic/nearby`, MapController.areaMap);
router.post(`/user/slot/list`, DoctorControllerUser.getDoctorSlots);
module.exports = router;
