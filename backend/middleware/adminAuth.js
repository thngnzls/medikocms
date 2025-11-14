import jwt from 'jsonwebtoken'
import userModel from '../models/userModel.js' 

const adminAuth = async (req, res, next) => {
    try {
        const token = req.headers.token;
        if (!token) {
            return res.status(401).json({ success: false, message: "Not Authorized, Token Missing." });
        }
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await userModel.findById(token_decode.id); 
        if (!user || user.role !== "admin") {
            return res.status(403).json({ success: false, message: "Not an admin." });
        }
        req.user = user; 
        next();
    } catch (error) {
        console.log(error);
        return res.status(401).json({ success: false, message: "Authentication failed. Please log in again." });
    }
}

export default adminAuth;