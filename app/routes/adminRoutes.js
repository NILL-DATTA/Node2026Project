const express = require("express");
const adminController = require("../controller/adminController");

const router = express.Router();
router.post("/admin/auth/login", adminController.signIn);
router.post("/admin/doctor/create", adminController.createDoctor);
router.get("/admin/doctor/list", adminController.doctorListData);
module.exports = router;
