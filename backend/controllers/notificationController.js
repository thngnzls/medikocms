import notificationModel from '../models/Notification.js';

const sendNotification = async (req, res) => {
    try {
        const { userId, type, message, link } = req.body;
        
        if (!userId || !message) {
            return res.json({ success: false, message: "Missing required fields: userId or message." });
        }

        const newNotification = new notificationModel({
            userId,
            type: type || 'GENERAL', 
            message,
            link: link || '/',
            isRead: false,
        });

        await newNotification.save();
        
        console.log(`Notification sent to User ${userId}: ${message}`); 

        res.json({ success: true, message: "Notification sent successfully." });

    } catch (error) {
        console.log("Error sending notification:", error);
        res.json({ success: false, message: "Error sending notification." });
    }
};

const getCustomerNotifications = async (req, res) => {
    try {
      
        const userId = req.userId || (req.user ? req.user._id || req.user.id : null); 
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }

        const notifications = await notificationModel.find({ userId })
            .sort({ createdAt: -1 });

        res.json({ success: true, notifications });

    } catch (error) {
        console.log("Error fetching customer notifications:", error);
        res.json({ success: false, message: "Error fetching notifications." });
    }
};

const markNotificationAsRead = async (req, res) => {
    try {
        const { id } = req.body;
    
        const customerId = req.userId || (req.user ? req.user._id || req.user.id : null); 
        
        if (!customerId) {
            return res.status(401).json({ success: false, message: "Authentication required for this action." });
        }

        const notification = await notificationModel.findOneAndUpdate(
            { _id: id, userId: customerId, isRead: false },
            { $set: { isRead: true } },
            { new: true }
        );

        if (!notification) {
            return res.json({ success: true, message: "Notification not updated (already read or invalid ID)." });
        }

        res.json({ success: true, message: "Notification marked as read." });

    } catch (error) {
        console.log("Error marking notification as read:", error);
        res.json({ success: false, message: "Error marking notification as read." });
    }
};

export { sendNotification, getCustomerNotifications, markNotificationAsRead };