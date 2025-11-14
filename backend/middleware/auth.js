import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import "dotenv/config";

const authUser = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  const tokenHeader = req.headers.token;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (tokenHeader) {
    token = tokenHeader;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not Authorized. Login Again",
    });
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({
        success: false,
        message: "Server configuration error.",
      });
    }

    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    req.userId = decoded.id;
    req.body.userId = decoded.id;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token. Not Authorized, Login Again",
    });
  }
};

export default authUser;
