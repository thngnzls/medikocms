import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { updateStockAfterOrder } from "./productController.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];

  const rawBody = req.body.toString();

  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook Error: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    const orderId = session.metadata.orderId;

    if (session.payment_status === "paid") {
      try {
        const order = await orderModel.findByIdAndUpdate(
          orderId,
          {
            payment: true,
            status: "Order Placed",
          },
          { new: true }
        );

        if (order) {
          await updateStockAfterOrder(order.items);
          await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
          console.log(
            `Order ${orderId} successfully paid and stock updated via webhook.`
          );
        } else {
          console.error(
            `Webhook Error: Order ${orderId} not found in database.`
          );
        }
      } catch (error) {
        console.error("Critical Webhook Processing Error:", error);
      }
    }
  }

  res.json({ received: true });
};
