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
    const userId = req.user._id;
    const { items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "COD",
      payment: false,
      date: Date.now(),
      status: "Order Placed",
    };

    newOrder = new orderModel(orderData);
    await newOrder.save();

    await updateStockAfterOrder(items);

    await createCustomerOrderUpdateNotification(
      newOrder.userId,
      newOrder._id,
      "Order Placed"
    );

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, message: "Order placed successfully." });
  } catch (error) {
    if (newOrder && newOrder._id) {
      await orderModel.findByIdAndDelete(newOrder._id);
    }

    res.json({
      success: false,
      message:
        error.message || "Failed to place COD order due to a server error.",
    });
  }
};

const placeOrderStripe = async (req, res) => {
  let newOrder = null;
  try {
    const userId = req.user._id;
    const { items, amount, address } = req.body;
    const clientOrigin = req.headers.origin || process.env.FRONTEND_URL;

    if (!clientOrigin) {
      return res
        .status(500)
        .json({ success: false, message: "Client origin URL is not set." });
    }

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Stripe",
      payment: false,
      date: Date.now(),
      status: "Pending Payment",
    };

    newOrder = new orderModel(orderData);
    await newOrder.save();

    await createCustomerOrderUpdateNotification(
      newOrder.userId,
      newOrder._id,
      "Pending Payment (Stripe)"
    );

    const line_items = items.map((item) => ({
      price_data: {
        currency,
        product_data: { name: item.name },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency,
        product_data: { name: "Delivery Charges" },
        unit_amount: deliveryCharge * 100,
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      success_url: `${clientOrigin}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${clientOrigin}/verify?success=false&orderId=${newOrder._id}`,
      line_items,
      mode: "payment",
      customer_email: address.email,
      metadata: {
        orderId: newOrder._id.toString(),
        userId: newOrder.userId.toString(),
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    if (newOrder && newOrder._id) {
      await orderModel.findByIdAndDelete(newOrder._id);
    }
    res.json({
      success: false,
      message: error.message || "Failed to create Stripe payment session.",
    });
  }
};

const verifyStripe = async (req, res) => {
  const { orderId, success } = req.body;

  try {
    if (success === "true") {
      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true, status: "Processing" },
        { new: true }
      );

      if (order) {
        await updateStockAfterOrder(order.items);
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

        await createCustomerOrderUpdateNotification(
          order.userId,
          orderId,
          "Payment Successful"
        );

        res.json({ success: true });
      } else {
        res.json({
          success: false,
          message: "Payment succeeded but order record was not found.",
        });
      }
    } else {
      const failedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: "Payment Failed" },
        { new: true }
      );

      if (failedOrder) {
        await createCustomerOrderUpdateNotification(
          failedOrder.userId,
          orderId,
          "Payment Failed and Order Cancelled"
        );
        await orderModel.findByIdAndDelete(orderId);
      }

      res.json({ success: false });
    }
  } catch (error) {
    res.json({
      success: false,
      message: error.message || "Server error during payment verification.",
    });
  }
};

const placeOrderRazorpay = async (req, res) => {
  let newOrder = null;
  try {
    const userId = req.user._id;
    const { items, amount, address } = req.body;

    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "Razorpay",
      payment: false,
      date: Date.now(),
      status: "Pending Payment",
    };

    newOrder = new orderModel(orderData);
    await newOrder.save();

    await createCustomerOrderUpdateNotification(
      newOrder.userId,
      newOrder._id,
      "Pending Payment (Razorpay)"
    );

    const totalAmount = amount + deliveryCharge;

    const options = {
      amount: totalAmount * 100,
      currency: currency.toUpperCase(),
      receipt: newOrder._id.toString(),
    };

    await razorpayInstance.orders.create(options, async (error, order) => {
      if (error) {
        await orderModel.findByIdAndDelete(newOrder._id);
        return res.json({
          success: false,
          message: "Failed to create Razorpay order.",
        });
      }
      res.json({ success: true, order });
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const verifyRazorpay = async (req, res) => {
  try {
    const { razorpay_order_id } = req.body;

    const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

    if (orderInfo.status === "paid") {
      const orderId = orderInfo.receipt;

      const order = await orderModel.findByIdAndUpdate(
        orderId,
        { payment: true, status: "Processing" },
        { new: true }
      );

      if (order) {
        await updateStockAfterOrder(order.items);
        await userModel.findByIdAndUpdate(order.userId, { cartData: {} });

        await createCustomerOrderUpdateNotification(
          order.userId,
          orderId,
          "Payment Successful"
        );

        res.json({
          success: true,
          message: "Payment Successful and Stock Updated",
        });
      } else {
        res.json({
          success: false,
          message: "Payment successful but order record not found.",
        });
      }
    } else {
      const orderId = orderInfo.receipt;
      const failedOrder = await orderModel.findByIdAndUpdate(
        orderId,
        { status: "Payment Failed" },
        { new: true }
      );

      if (failedOrder) {
        await createCustomerOrderUpdateNotification(
          failedOrder.userId,
          orderId,
          "Payment Failed and Order Cancelled"
        );
        await orderModel.findByIdAndDelete(orderId);
      }

      res.json({ success: false, message: "Payment Failed" });
    }
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

const createPaypalOrder = async (req, res) => {
  const userId = req.user._id;
  const { items, amount, address } = req.body;
  const frontendBaseUrl = process.env.FRONTEND_URL;
  let newOrder = null;

  if (!amount || !address || !items || !frontendBaseUrl || !client) {
    return res.status(400).json({
      message:
        "Missing required fields, FRONTEND_URL, or PayPal client initialization failed.",
    });
  }

  try {
    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "PayPal",
      payment: false,
      date: Date.now(),
      status: "Pending Payment",
    };

    newOrder = new orderModel(orderData);
    await newOrder.save();

    await createCustomerOrderUpdateNotification(
      newOrder.userId,
      newOrder._id,
      "Pending Payment (PayPal)"
    );

    const paypalAmount = (amount + deliveryCharge).toFixed(2);

    const order = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: paypalAmount,
          },
          description: "Order Payment",
        },
      ],
      application_context: {
        brand_name: "Your Brand Name",
        landing_page: "NO_PREFERENCE",
        user_action: "PAY_NOW",
        return_url: `${frontendBaseUrl}/verify?success=true&orderId=${newOrder._id}`,
        cancel_url: `${frontendBaseUrl}/verify?success=false&orderId=${newOrder._id}`,
      },
    };

    const request = new ordersCreateRequest();
    request.requestBody(order);

    const response = await client.execute(request);
    const approvalLink = response.result.links.find(
      (link) => link.rel === "approve"
    ).href;

    res.json({ success: true, approvalLink });
  } catch (error) {
    if (newOrder && newOrder._id) {
      await orderModel.findByIdAndDelete(newOrder._id);
    }
    res.status(500).json({
      success: false,
      message: "Error creating PayPal order",
      error: error.message,
    });
  }
};

const finalizePaypalOrder = async (req, res) => {
  const userId = req.user._id;
  const { items, amount, address, paymentId } = req.body;

  if (!userId || !paymentId || !items || !amount || !address) {
    return res.status(400).json({
      success: false,
      message: "Missing required data for order finalization.",
    });
  }

  const existingOrder = await orderModel.findOne({
    paypalPaymentId: paymentId,
  });
  if (existingOrder) {
    return res.status(409).json({
      success: false,
      message: "This payment has already been processed.",
      orderId: existingOrder._id,
    });
  }

  let newOrder = null;
  try {
    const orderData = {
      userId,
      items,
      address,
      amount,
      paymentMethod: "PayPal (Smart)",
      payment: true,
      paypalPaymentId: paymentId,
      date: Date.now(),
      status: "Processing",
    };

    newOrder = new orderModel(orderData);
    await newOrder.save();

    await updateStockAfterOrder(items);

    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    await createCustomerOrderUpdateNotification(
      newOrder.userId,
      newOrder._id,
      "Payment Successful & Processing"
    );

    res.json({
      success: true,
      message: "Order confirmed and paid.",
      orderId: newOrder._id,
    });
  } catch (error) {
    if (newOrder && newOrder._id) {
      await orderModel.findByIdAndDelete(newOrder._id);
    }
    res.status(500).json({
      success: false,
      message: "Failed to finalize order after PayPal payment.",
      error: error.message,
    });
  }
};

const allOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({})
      .populate("userId", "name email")
      .sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Replace your existing userOrders function with this
const userOrders = async (req, res) => {
  try {
    // --- DEBUGGING LOG ---
    // This will show us what is inside req.user in your server console
    console.log("Checking user data from auth middleware:", req.user);

    const userId = req.user._id; // The bug is likely here

    // If the log shows `id` instead of `_id`, you can fix it like this:
    // const userId = req.user._id || req.user.id;

    const orders = await orderModel.find({ userId }).sort({ date: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    console.error("Error in userOrders:", error); // Added error logging
    res.status(500).json({ success: false, message: error.message });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId, reason } = req.body;
    const userId = req.user._id;

    const order = await orderModel.findOne({ _id: orderId, userId });

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found." });
    }

    const originalStatus = order.status;
    if (
      originalStatus !== "Order Placed" &&
      originalStatus !== "Pending Payment"
    ) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${originalStatus}.`,
      });
    }

    await orderModel.findByIdAndUpdate(orderId, {
      status: "Cancelled",
      cancellationReason: reason || "No reason provided",
      cancelledAt: new Date(),
    });

    if (order.paymentMethod === "COD") {
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

export {
  verifyRazorpay,
  verifyStripe,
  placeOrder,
  placeOrderStripe,
  placeOrderRazorpay,
  createPaypalOrder,
  finalizePaypalOrder,
  allOrders,
  userOrders,
  updateStatus,
  cancelOrder,
};
