import validator from "validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import transporter from "../middleware/nodemailer.js";
import "dotenv/config";
import crypto from "crypto";

const createToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is missing. Cannot create token.");
  }
  return jwt.sign({ id }, secret, { expiresIn: "7d" });
};

const sendVerificationEmail = async (email, code) => {
  await transporter.sendMail({
    from: process.env.GOOGLE_APP_EMAIL_USER,
    to: email,
    subject: "Verify your MEDIKO Account",
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            
                <h2 style="color: #333; text-align: center;">MEDIKO Account Verification</h2>
                <p style="color: #555; line-height: 1.6;">Thank you for registering with MEDIKO! To complete your registration and activate your account, please use the verification code below:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; font-size: 24px; font-weight: bold; border-radius: 5px; letter-spacing: 2px;">${code}</span>
                </div>

                <p style="color: #555; line-height: 1.6;">Please enter this code on the verification screen to proceed. This code is valid for 10 minutes.</p>

                <p style="color: #555; line-height: 1.6; margin-top: 20px;">If you did not sign up for a MEDIKO account, please ignore this email.</p>
                
                <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 30px;">&copy; ${new Date().getFullYear()} MEDIKO. All rights reserved.</p>
            </div>
            </div>
    `,
  });
};

const sendPasswordResetEmail = async (email, resetToken) => {
  const resetURL = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  await transporter.sendMail({
    from: process.env.GOOGLE_APP_EMAIL_USER,
    to: email,
    subject: "MEDIKO Password Reset Request",
    html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                
                <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
                <p style="color: #555; line-height: 1.6;">You have requested to reset the password for your MEDIKO account. Please click the link below to set a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetURL}" style="display: inline-block; padding: 10px 20px; background-color: #dc3545; color: white; text-decoration: none; font-size: 16px; font-weight: bold; border-radius: 5px;">Reset Password</a>
                </div>

                <p style="color: #555; line-height: 1.6;">If you didn't request this change, please ignore this email. Your password will remain the same.</p>
                
                <p style="text-align: center; color: #aaa; font-size: 12px; margin-top: 30px;">&copy; ${new Date().getFullYear()} MEDIKO. All rights reserved.</p>
            </div>
            </div>
    `,
  });
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User does not exist" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    if (user.suspended) {
      return res.json({
        success: false,
        message:
          "Your account has been suspended. Please contact support for assistance.",
      });
    }

    if (user.role === "customer" && !user.isVerified) {
      const verificationCode = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      const verificationCodeExpire = Date.now() + 10 * 60 * 1000;

      user.verificationCode = verificationCode;
      user.verificationCodeExpire = verificationCodeExpire;
      await user.save();

      await sendVerificationEmail(user.email, verificationCode);

      return res.json({
        success: false,
        message: "Account not verified. Verification code sent to your email.",
        isVerificationNeeded: true,
      });
    }

    const token = createToken(user._id);
    const userInfo = {
      role: user.role,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    res.json({ success: true, token, user: userInfo });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error logging in: " + error.message });
  }
};

export const registerUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  try {
    if (!firstName || !lastName || !email || !password) {
      return res.json({ success: false, message: "Please enter all fields" });
    }

    if (!validator.isEmail(email)) {
      return res.json({
        success: false,
        message: "Please enter a valid email",
      });
    }

    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationCodeExpire = Date.now() + 10 * 60 * 1000;

    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      verificationCode,
      verificationCodeExpire,
      isVerified: false,
      role: "customer",
    });

    const user = await newUser.save();

    await sendVerificationEmail(user.email, verificationCode);

    const token = createToken(user._id);
    const userInfo = {
      role: user.role,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    res.json({
      success: true,
      token,
      user: userInfo,
      message: "Registration successful. Verification code sent to email.",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error registering user: " + error.message,
    });
  }
};

export const verifyAccount = async (req, res) => {
  const { email, code } = req.body;
  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    if (user.isVerified) {
      return res.json({
        success: true,
        message: "Account is already verified.",
      });
    }

    if (user.verificationCode !== code) {
      return res.json({
        success: false,
        message: "Invalid verification code.",
      });
    }

    if (user.verificationCodeExpire < Date.now()) {
      return res.json({
        success: false,
        message: "Verification code has expired.",
      });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpire = undefined;
    await user.save();

    const token = createToken(user._id);
    const userInfo = {
      role: user.role,
      isVerified: user.isVerified,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    res.json({
      success: true,
      token,
      user: userInfo,
      message: "Account successfully verified.",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error verifying account: " + error.message,
    });
  }
};

export const resendVerificationCode = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }
    if (user.isVerified) {
      return res.json({
        success: false,
        message: "Account is already verified.",
      });
    }

    const verificationCode = Math.floor(
      100000 + Math.random() * 900000
    ).toString();
    const verificationCodeExpire = Date.now() + 10 * 60 * 1000;

    user.verificationCode = verificationCode;
    user.verificationCodeExpire = verificationCodeExpire;
    await user.save();

    await sendVerificationEmail(user.email, verificationCode);

    res.json({
      success: true,
      message: "New verification code has been sent to your email.",
    });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error resending code: " + error.message,
    });
  }
};

export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.json({ success: false, message: "User not found." });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExpire = Date.now() + 60 * 60 * 1000;

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    await sendPasswordResetEmail(user.email, resetToken);

    res.json({
      success: true,
      message: "Password reset link sent to your email.",
    });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: "Error sending reset email." });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;
  try {
    const user = await userModel.findOne({
      resetPasswordToken: token,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.json({
        success: false,
        message: "Invalid or expired password reset token.",
      });
    }

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password successfully reset." });
  } catch (error) {
    console.log(error);
    res.json({
      success: false,
      message: "Error resetting password: " + error.message,
    });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await userModel.find({}).select("-password");
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user._id;

    const user = await userModel.findById(userId).select("-password");

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { firstName, lastName } = req.body;

    const user = await userModel.findById(userId);
    if (!user) return res.json({ success: false, message: "User not found" });

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;

    await user.save();

    res.json({ success: true, message: "Profile updated successfully" });
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
