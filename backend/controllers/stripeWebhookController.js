
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { updateStockAfterOrder } from './productController.js'; // Adjust path

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const handleStripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    
    // Use the raw body, not JSON, for signature verification
    const rawBody = req.body.toString(); 

    let event;

    try {
        event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err) {
        // Verification failed
        console.error(`Webhook Error: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        
        // 1. Get the order ID from the metadata we set in placeOrderStripe
        const orderId = session.metadata.orderId; 

        if (session.payment_status === 'paid') {
            try {
                // 2. Update the order as paid and change status
                const order = await orderModel.findByIdAndUpdate(
                    orderId, 
                    { 
                        payment: true, 
                        status: "Order Placed" 
                    }, 
                    { new: true }
                );

                if (order) {
                    // 3. Update stock and clear cart securely
                    await updateStockAfterOrder(order.items);
                    await userModel.findByIdAndUpdate(order.userId, { cartData: {} });
                    console.log(`Order ${orderId} successfully paid and stock updated via webhook.`);
                } else {
                    console.error(`Webhook Error: Order ${orderId} not found in database.`);
                }
            } catch (error) {
                console.error("Critical Webhook Processing Error:", error);
                // ⚠️ If stock fails here, you may need a separate process to handle the fully paid order.
            }
        }
    }
    
    // Acknowledge receipt of the event
    res.json({ received: true });
};