import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import productRouter from "./routes/productRoute.js";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";
import wishlistRouter from "./routes/wishlistRoute.js";
import analyticsRouter from "./routes/analyticsRoute.js";
import notificationRouter from "./routes/notificationRoute.js";
import { handleStripeWebhook } from "./controllers/stripeWebhookController.js";

const app = express();
app.use("/uploads", express.static("uploads"));
const port = process.env.PORT || 4000;

connectDB();
connectCloudinary();

app.use(
  "/api/order/stripe-webhook",
  express.raw({ type: "application/json" }),
  handleStripeWebhook
);

app.use(express.json());
app.use(cors());

app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/notification", notificationRouter);

app.get("/", (req, res) => {
  res.send("API Working");
});

app.use((req, res, next) => {
  console.warn(`404: Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).send("Route not found");
});

process.on("uncaughtException", (err) => {
  console.error(
    "FATAL UNCAUGHT EXCEPTION! Server is crashing. Error:",
    err.stack
  );
  process.exit(1);
});

app.listen(port, () => console.log(`Server started on PORT: ${port}`));
