const express = require("express");

// const HomeController = require("../controller/HomeController");
const CrudController = require("../controller/crudController");
const AuthController = require("../controller/authController");
const router = express.Router();

// router.get("/", HomeController.home);

// router.get("/home", HomeController.dataApi);

// router.get("/dynamic", HomeController.dynamic);

// router.get("/about", HomeController.about);

// router.get("/about_temp", HomeController.about_temp);
// router.get("/dashboard", HomeController.dashboard);

router.delete("/product/delete", CrudController.listDelete);
router.post("/product/update", CrudController.listUpdate);
router.get("/product/details/:id", CrudController.listDetails);
router.post("/product/cart", CrudController.cart);
router.get("/product/cartlist", CrudController.cartList);
router.post("/auth/register", AuthController.signUp);
router.post("/auth/login", AuthController.signIn);
router.post("/auth/verify_otp", AuthController.otp);
module.exports = router;
