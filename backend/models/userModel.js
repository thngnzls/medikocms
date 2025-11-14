import mongoose from "mongoose"

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userName: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, default: "" },
    phone: { type: String, default: "" },
    cartData: { type: Object, default: {} },
    wishlistData: { type: Object, default: {} },
    role: { type: String, default: "user" },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },

    // 🟢 NEW: Field for Last Login/Timeout Timestamp
    lastLogin: {
      type: Date, // We use the Date type to store the timestamp
      default: null, // Default value is null if the user hasn't logged in yet
    },

    // 🛑 OTP verification fields
    verificationCode: { type: String },
    isVerified: { type: Boolean, default: false },
  },
  { minimize: false, timestamps: true },
)

const userModel = mongoose.models.user || mongoose.model("user", userSchema)

export default userModel