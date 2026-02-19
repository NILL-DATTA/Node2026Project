const express = require("express");

const CrudController = require("../controller/crudController");
const AuthController = require("../controller/authController");
const router = express.Router();


router.post("/product/update", CrudController.listUpdate);
router.get("/product/details/:id", CrudController.listDetails);
router.post("/product/cart", CrudController.cart);
router.get("/product/cartlist", CrudController.cartList);
router.post("/auth/register", AuthController.signUp);
router.post("/auth/login", AuthController.signIn);
router.post("/auth/verify_otp", AuthController.otp);
module.exports = router;
