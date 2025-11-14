// src/routes/analyticsRoute.js

import express from 'express';
import { getOverviewAnalytics } from '../controllers/analyticsController.js';
import authMiddleware from '../middleware/auth.js'; 

const analyticsRouter = express.Router();

// Route to get all analytics data - must be protected
analyticsRouter.get('/overview', authMiddleware, getOverviewAnalytics);

export default analyticsRouter;

