import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../middleware/nodemailer.js"; // Uses your existing transporter
import "dotenv/config";
import crypto from "crypto"; // Added for password reset

// Helper function to create JWT token
const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Cannot create token.");
  }
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

// Helper function to send verification email
const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: process.env.GOOGLE_APP_EMAIL_USER,
    to: email,
    subject: "Verify your MEDIKO Account",
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #2e7d32; text-align: center;"> Email Verification </h2>
            <p style="font-size: 16px; color: #444;">
            Please verify your email using the code below:
            </p>
            <div style="text-align: center; margin: 20px 0;">
            <h1 style="color: #43a047; letter-spacing: 5px;">${code}</h1>
            </div>
            <p style="font-size: 14px; color: #888; text-align: center;">
            Enter this code in the app to activate your account.
            </p>
            </div>
            </div>
        `,
  });
};

// Resend verification code handler
export const handleVerificationEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.isVerified)
      return res.json({
        success: false,
        message: "Email is already verified.",
      });

    const otp = Math.floor(100000 + Math.random() * 900000);
    user.verificationCode = otp.toString();
    await user.save();

    await sendVerificationEmail(email, otp);
    res.json({
      success: true,
      message: "New verification code sent successfully to your email!",
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to send verification email" });
  }
};

// Register user
export const registerUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      address,
      phone,
      username,
      street,
      city,
      state,
      zipcode,
      country,
    } = req.body;

    const exists = await userModel.findOne({ email });
    if (exists)
      return res.json({ success: false, message: "User already exists" });

    if (!validator.isEmail(email))
      return res.json({ success: false, message: "Invalid email address" });
    if (password.length < 8)
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    if (phone && !validator.isMobilePhone(phone.toString(), "any"))
      return res.json({ success: false, message: "Invalid phone number" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const otp = Math.floor(100000 + Math.random() * 900000);

    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      address: address || { street, city, state, zipcode, country },
      phone,
      username,
      verificationCode: otp.toString(),
      isVerified: false,
      cartData: {},
    });

    await newUser.save();
    await sendVerificationEmail(email, otp);

    res.json({
      success: true,
      toVerify: true,
      email,
      message:
        "Registration successful! Please check your email for the 6-digit verification code.",
    });
  } catch (error) {
    console.log("Registration error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email });

    if (!user)
      return res.json({ success: false, message: "User doesn't exist" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.json({ success: false, message: "Invalid credentials" });

    if (!user.isVerified) {
      const otp = Math.floor(100000 + Math.random() * 900000);
      user.verificationCode = otp.toString();
      await user.save();
      await sendVerificationEmail(email, otp);

      return res.json({
        success: false,
        toVerify: true,
        email,
        message:
          "Please verify your email. A new 6-digit code was sent to your inbox.",
      });
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      name: user.firstName,
      message: "Login successful!",
    });
  } catch (error) {
    console.log("Login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Verify user email
export const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;
    const user = await userModel.findOne({ email });

    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    if (user.isVerified) {
      const token = createToken(user._id);
      return res.json({
        success: true,
        token,
        name: user.firstName,
        message: "Email is already verified. Logging you in.",
      });
    }

    let storedCode = user.verificationCode;
    if (storedCode !== undefined && storedCode !== null) {
      storedCode = storedCode.toString();
    }

    const inputCode = code ? code.toString() : "";

    if (!storedCode || storedCode.length === 0) {
      return res.json({
        success: false,
        message:
          "No active verification code found. Please use the 'Resend Code' option or try logging in again.",
      });
    }

    if (storedCode !== inputCode) {
      return res.json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.lastLogin = Date.now();
    await user.save();

    const token = createToken(user._id);
    res.json({
      success: true,
      token,
      name: user.firstName,
      message: "Email verified successfully! You are now logged in.",
    });
  } catch (error) {
    console.log("Error in verifyEmail:", error);
    res.status(500).json({
      success: false,
      message: "A server error occurred during verification.",
    });
  }
};

// --- FORGOT PASSWORD FUNCTION ---
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      // Security measure: Always send a success message to prevent email enumeration
      return res.json({
        success: true,
        message: "If your email is registered, you will receive a reset link.",
      });
    } // Generate a secure, unhashed token to be sent to the user

    const resetToken = crypto.randomBytes(32).toString("hex"); // Hash the token for storage in the database

    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex"); // Set an expiration time (e.g., 10 minutes from now)

    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save(); // Create the reset URL using the unhashed token and frontend URL

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`; // Email content (HTML is preferred for better formatting)

    const message = `
      <h1>Password Reset Request</h1>
      <p>You are receiving this email because you (or someone else) requested a password reset for your account.</p>
      <p>Please click the following link, or paste it into your browser to complete the process within 10 minutes:</p>
      <p>
        <a href="${resetUrl}" style="color: #fff; background-color: #28a745; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Your Password
        </a>
      </p>
      <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
      <hr>
      <p style="font-size: 10px;">Link: ${resetUrl}</p>
    `; // Send the email

    const mailOptions = {
      from: `MEDIKO <${process.env.GOOGLE_APP_EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset Link",
      html: message,
    };

    await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: "If your email is registered, you will receive a reset link.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error); // Invalidate token on error (optional safety measure)
    const user = await userModel.findOne({ email });
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
    }
    res
      .status(500)
      .json({ success: false, message: "Error sending reset email." });
  }
};

// --- RESET PASSWORD FUNCTION ---
export const resetPassword = async (req, res) => {
  const { token, password } = req.body;

  try {
    // 1. Hash the unhashed token from the request body to match the database's stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex"); // 2. Find the user by the HASHED token and check for expiration

    const user = await userModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // $gt: greater than current time
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token.",
      });
    } // 3. Set the new password, ensuring it meets length requirements

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt); // 4. Invalidate the token after successful reset

    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save(); // 5. Send success response

    res.json({
      success: true,
      message: "Password reset successfully. Please log in.",
    });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res
      .status(500)
      .json({ success: false, message: "Error resetting password." });
  }
};

// --- EXISTING ADMIN/PROFILE/ETC. FUNCTIONS ---

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body; // FIX 1: Add trim() to safely handle environment variables

    const adminEmail = process.env.ADMIN_EMAIL?.trim();
    const adminPassword = process.env.ADMIN_PASSWORD?.trim();

    const user = await userModel.findOne({ email, role: "admin" });

    if (user) {
      // Logic for Database Admin
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.json({ success: false, message: "Invalid credentials" });

      user.lastLogin = Date.now();
      await user.save();
      const token = createToken(user._id);
      return res.json({ success: true, token, role: user.role });
    } else if (email === adminEmail && password === adminPassword) {
      // Logic for Hardcoded Super Admin (Not stored in DB, checked against .env)
      // FIX 2: Use a valid-looking 24-character hex ID for the token payload
      const token = createToken("000000000000000000000001");
      return res.json({ success: true, token, role: "admin" });
    } else {
      return res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.log("Admin login error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCart = async (req, res) => {
  try {
    const { cartItems } = req.body;
    await userModel.findByIdAndUpdate(req.user._id, { cartData: cartItems });
    res.json({ success: true, message: "Cart updated successfully" });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ success: false, message: "Failed to update cart" });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userObject = req.user.toObject ? req.user.toObject() : req.user;
    delete userObject.password;
    delete userObject.verificationCode;
    res.json({ success: true, user: userObject });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch profile" });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      address,
      username,
      street,
      city,
      state,
      zipcode,
      country,
    } = req.body;
    const user = await userModel.findById(req.user._id);

    if (!user) return res.json({ success: false, message: "User not found" });

    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.username = username || user.username;
    user.address.street = street || user.address?.street;
    user.address.city = city || user.address?.city;
    user.address.state = state || user.address?.state;
    user.address.zipcode = zipcode || user.address?.zipcode;
    user.address.country = country || user.address?.country;

    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.json({
      success: true,
      message: "Profile updated successfully!",
      user: updatedUser,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Failed to update profile" });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded, or file type/size is invalid.",
    });
  }

  try {
    const userId = req.user._id;
    const photoUrl = req.file.path;

    if (!photoUrl) {
      return res.status(500).json({
        success: false,
        message: "Cloudinary failed to return a valid URL.",
      });
    }

    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { photoUrl: photoUrl },
      { new: true, select: "-password" }
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found in database." });
    }

    res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully!",
      photoUrl: updatedUser.photoUrl,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Profile photo upload error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to upload photo due to a server error.",
    });
  }
};

export const addUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      role,
      isVerified = true,
    } = req.body;
    const existing = await userModel.findOne({ email });
    if (existing)
      return res.json({ success: false, message: "User already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified,
      cartData: {},
    });
    await newUser.save();

    res.json({ success: true, message: "User added successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllUsers = async (_, res) => {
  try {
    const users = await userModel.find().select("-password -verificationCode");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, role, suspended, isVerified } =
      req.body;
    const user = await userModel.findById(id);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (email) user.email = email;
    if (role) user.role = role;
    if (suspended !== undefined) user.suspended = suspended;
    if (isVerified !== undefined) user.isVerified = isVerified;

    await user.save();

    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const toggleSuspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;
    const user = await userModel
      .findByIdAndUpdate(id, { suspended }, { new: true })
      .select("-password");
    if (!user) return res.json({ success: false, message: "User not found" });

    res.json({
      success: true,
      message: `User ${suspended ? "suspended" : "unsuspended"} successfully`,
      user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await userModel.findByIdAndDelete(id);
    if (!result) return res.json({ success: false, message: "User not found" });

    res.json({ success: true, message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// --- FINAL EXPORT BLOCK (All duplicates removed) ---
