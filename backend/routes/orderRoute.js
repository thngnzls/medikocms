import express from "express";
import {
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  createPaypalOrder,
  finalizePaypalOrder,
  allOrders,
  userOrders,
  updateStatus,
  verifyStripe,
  verifyRazorpay,
  cancelOrder,
} from "../controllers/orderController.js";

import adminAuth from "../middleware/adminAuth.js";
import authUser from "../middleware/auth.js";

const orderRouter = express.Router();

orderRouter.use((req, res, next) => {
  console.log(`📦 Order Route: ${req.method} ${req.originalUrl}`);
  next();
});

orderRouter.post("/list", adminAuth, allOrders);
orderRouter.post("/status", adminAuth, updateStatus);

orderRouter.post("/userorders", authUser, userOrders);

orderRouter.post("/cancel", authUser, cancelOrder);
orderRouter.post("/return-request", authUser, updateStatus);

orderRouter.post("/place", authUser, placeOrder);
orderRouter.post("/place-stripe", authUser, placeOrderStripe);
orderRouter.post("/razorpay", authUser, placeOrderRazorpay);
orderRouter.post("/paypal", authUser, createPaypalOrder);

orderRouter.post("/verifyStripe", authUser, verifyStripe);
orderRouter.post("/verifyRazorpay", authUser, verifyRazorpay);

orderRouter.post(
  "/paypal/finalize",
  (req, res, next) => {
    console.log("🎯 /paypal/finalize route HIT!");
    next();
  },
  authUser,
  finalizePaypalOrder
);

export default orderRouter;
