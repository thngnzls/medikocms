import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import Stripe from "stripe";
import razorpay from "razorpay";
import NotificationModel from "../models/Notification.js";
import {
  updateStockAfterOrder,
  restoreStockAfterCancellation,
} from "../controllers/productController.js";
import paypalClient from "../config/paypal.js";

const currency = "php";
const deliveryCharge = 50;

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const { client, ordersCreateRequest } = paypalClient;

const createCustomerOrderUpdateNotification = async (
  userId,
  orderId,
  newStatus
) => {
  try {
    await NotificationModel.create({
      userId: userId,
      type: "ORDER_STATUS_UPDATE",
      message: `Your order #${orderId
        .toString()
        .substring(0, 8)} is now: ${newStatus}`,
      link: `/orders`,
      isRead: false,
    });
  } catch (notificationError) {}
};

const placeOrder = async (req, res) => {
  let newOrder = null;
  try {
    res.json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await orderModel.findByIdAndUpdate(
      orderId,
      { status: "Cancelled" },
      { new: true }
    );

    if (!order) {
      return res.json({ success: false, message: "Order not found." });
    }

    if (order.payment) {
      await restoreStockAfterCancellation(order.items);
    }

    await createCustomerOrderUpdateNotification(
      order.userId,
      orderId,
      "Cancelled"
    );

    res.json({
      success: true,
      message: "Order has been successfully cancelled.",
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { orderId, status, returnReason } = req.body;

    const existingOrder = await orderModel.findById(orderId);
    if (!existingOrder) {
      return res.json({ success: false, message: "Order not found." });
    }

    const updateObject = { status };
    if (returnReason) updateObject.returnReason = returnReason;

    if (status === "Returned" && existingOrder.status !== "Returned") {
      if (existingOrder.payment) {
        await restoreStockAfterCancellation(existingOrder.items);
      }
    }

    await orderModel.findByIdAndUpdate(orderId, updateObject);

    if (existingOrder.status !== status) {
      await createCustomerOrderUpdateNotification(
        existingOrder.userId,
        orderId,
        status
      );
    }

    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const listOrders = async (req, res) => {
  res.json({ success: true, message: "List Orders logic placeholder" });
};
export const getUserOrders = async (req, res) => {
  res.json({ success: true, message: "Get User Orders logic placeholder" });
};
export const verifyOrder = async (req, res) => {
  res.json({ success: true, message: "Verify Order logic placeholder" });
};

export { placeOrder, cancelOrder, updateStatus };
