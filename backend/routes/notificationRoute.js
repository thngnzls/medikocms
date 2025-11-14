import express from 'express';
import { getCustomerNotifications, markNotificationAsRead, sendNotification } from '../controllers/notificationController.js';
import authMiddleware from '../middleware/auth.js'; 
import adminAuthMiddleware from '../middleware/adminAuth.js';

const notificationRouter = express.Router();

notificationRouter.post('/send', adminAuthMiddleware, sendNotification);

notificationRouter.get('/customer-list', authMiddleware, getCustomerNotifications);

notificationRouter.put('/mark-read', authMiddleware, markNotificationAsRead);

export default notificationRouter;