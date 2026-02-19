const { postvalidateSchema } = require("../validators/postvalidator");
const CrudMod = require("../model/AdminModel");
const cartModel = require("../../app/model/cartModel");
class CrudController {




  async listUpdate(req, res) {
    try {
      const { id, name, category, price } = req.body;
      const existupdate = await CrudMod.findOne({ _id: id });
      if (!existupdate) {
        return res.status(400).json({
          status: false,
          message: "Id is required",
        });
      }

      let updateData = await CrudMod.findByIdAndUpdate(
        existupdate,
        { name, category, price },
        { new: true }, //return new data
      );

      if (!updateData) {
        return res.status(400).json({
          status: false,
          message: "Update not happen",
        });
      }

      return res.status(200).json({
        message: "Update successfull",
        data: updateData,
      });
    } catch (err) {
      return res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async listDetails(req, res) {
    try {
      let dataID = req.params.id;
      let ID = await CrudMod.findOne({ _id: dataID });
      if (!ID) {
        return res.status(400).json({
          status: false,
          message: "This is not valid product ",
        });
      }

      let data = await CrudMod.findById(ID);

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

  async cart(req, res) {
    try {
      let { name, category, price, ProductId } = req.body;

      let exist = await cartModel.findOne({ name, category, price, ProductId });

      if (exist) {
        exist.quantity += 1;
        await exist.save();
        return res.status(200).json({
          status: true,
          message: "Quantity updated",
          cart: exist,
        });
      }

      const createCart = new cartModel({
        name,
        category,
        price,
        ProductId,
        quantity: 1,
      });
      let saveData = await createCart.save();
      res.status(200).json({
        status: true,
        message: "Item add to cart",
        cart: saveData,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }

  async cartList(req, res) {
    try {
      let dataList = await cartModel.find();
      res.status(200).json({
        status: true,
        message: "cart fetch successfull",
        cart: dataList,
      });
    } catch (err) {
      res.status(500).json({
        status: false,
        message: err.message,
      });
    }
  }
}

module.exports = new CrudController();
