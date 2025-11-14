import express from "express"; // <--- FIX: Ensure 'express' is available here

import {
  registerUser,
  loginUser,
  verifyEmail,
  adminLogin,
  getUserProfile,
  updateUserProfile,
  uploadProfilePhoto,
  updateCart,
  handleVerificationEmail,
  addUser,
  getAllUsers,
  updateUser,
  toggleSuspendUser,
  deleteUser,
  forgotPassword,
  resetPassword,
} from "../controllers/userController.js";
import authUser from "../middleware/auth.js";
import adminAuth from "../middleware/adminAuth.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router(); // This line caused the crash.

// Public routes for password management
userRouter.post("/forgot-password", forgotPassword);
userRouter.post("/reset-password", resetPassword);

// Other existing routes
userRouter.post("/register", registerUser);
userRouter.post("/login", loginUser);
userRouter.post("/admin/login", adminLogin);
userRouter.post("/verify-email", verifyEmail);
userRouter.post("/resend-code", handleVerificationEmail);
userRouter.get("/profile", authUser, getUserProfile);
userRouter.put("/profile", authUser, updateUserProfile);
userRouter.post("/update-cart", authUser, updateCart);
userRouter.post(
  "/upload-photo",
  authUser,
  upload.single("profile_photo"),
  uploadProfilePhoto
);
userRouter.get("/get-user-data", authUser, getUserProfile);
userRouter.post("/admin/add-user", authUser, adminAuth, addUser);

// FIX 2: Corrected route for fetching ALL USERS (Customers) to resolve 404
// The frontend requested GET /api/user/all, so the route should be "/all"
userRouter.get("/all", authUser, adminAuth, getAllUsers);

userRouter.put("/admin/update/:id", authUser, adminAuth, updateUser);
userRouter.put("/admin/suspend/:id", authUser, adminAuth, toggleSuspendUser);
userRouter.delete("/admin/delete/:id", authUser, adminAuth, deleteUser);

export default userRouter;
