import userModel from "../models/userModel.js";

const addToCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found." });
    }

    let cartData = userData.cartData;
    if (!cartData) {
      cartData = {};
    }

    if (!cartData[itemId]) {
      cartData[itemId] = {};
    }

    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;

    await userModel.findByIdAndUpdate(userId, { cartData });

    res.json({ success: true, message: "Added To Cart" });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error adding to cart: " + error.message,
    });
  }
};

const removeFromCart = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size } = req.body;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found." });
    }

    let cartData = userData.cartData;

    if (cartData && cartData[itemId] && cartData[itemId][size] > 0) {
      cartData[itemId][size] -= 1;

      if (cartData[itemId][size] === 0) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      return res.json({
        success: false,
        message: "Item not found or quantity is already zero.",
      });
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Removed From Cart" });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error removing from cart: " + error.message,
    });
  }
};

const updateCartQuantity = async (req, res) => {
  try {
    const userId = req.user._id;
    const { itemId, size, quantity } = req.body;

    if (quantity < 0) {
      return res.json({
        success: false,
        message: "Quantity cannot be negative.",
      });
    }

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found." });
    }

    let cartData = userData.cartData;

    if (cartData && cartData[itemId] && cartData[itemId][size] !== undefined) {
      cartData[itemId][size] = quantity;
    } else {
      return res.json({
        success: false,
        message: "Item not found in cart for update.",
      });
    }

    await userModel.findByIdAndUpdate(userId, { cartData });
    res.json({ success: true, message: "Cart Updated" });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error updating cart: " + error.message,
    });
  }
};

const getUserCart = async (req, res) => {
  try {
    const userId = req.user._id;

    const userData = await userModel.findById(userId);
    if (!userData) {
      return res.json({ success: false, message: "User not found." });
    }

    let cartData = userData.cartData || {};

    res.json({ success: true, cartData });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error getting cart: " + error.message,
    });
  }
};

export { addToCart, removeFromCart, updateCartQuantity, getUserCart };
