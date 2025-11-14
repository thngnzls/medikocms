import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

// Helper function to get the start of the current month in milliseconds
const getStartOfMonth = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return startOfMonth.getTime();
};

const getOverviewAnalytics = async (req, res) => {
    try {
        const startOfMonthTimestamp = getStartOfMonth();
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getTime();

        // --- 1. Fetch KPI Metrics (Revenue, Orders, Units Sold) ---
        const [
            totalRevenueResult, 
            totalOrdersResult, 
            monthlyRevenueResult,
            totalUnitsSoldResult
        ] = await Promise.all([
            // Total Revenue (All Time)
            orderModel.aggregate([
                { $match: { payment: true } }, 
                { $group: { _id: null, totalRevenue: { $sum: '$amount' } } }
            ]),
            // Total Orders Count
            orderModel.countDocuments({}), 
            // Current Month Revenue
            orderModel.aggregate([
                { $match: { payment: true, date: { $gte: startOfMonthTimestamp } } },
                { $group: { _id: null, currentMonthRevenue: { $sum: '$amount' } } }
            ]),
            // Total Units Sold (Quantity)
            orderModel.aggregate([
                { $match: { payment: true } },
                { $unwind: '$items' },
                { $group: { _id: null, totalUnitsSold: { $sum: '$items.quantity' } } }
            ]),
        ]);

        const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
        const totalOrders = totalOrdersResult;
        const currentMonthRevenue = monthlyRevenueResult[0]?.currentMonthRevenue || 0;
        const totalUnitsSold = totalUnitsSoldResult[0]?.totalUnitsSold || 0;

        // --- 2. Customer Metrics ---
        const [totalCustomersResult, newCustomersThisMonthResult] = await Promise.all([
            userModel.countDocuments({}),
            userModel.countDocuments({ createdAt: { $gte: new Date(startOfMonthTimestamp) } })
        ]);

        const totalCustomers = totalCustomersResult;
        const newCustomersThisMonth = newCustomersThisMonthResult;

        // --- 3. Top Products Aggregation ---
        const topProducts = await orderModel.aggregate([
            { $match: { payment: true } },
            { $unwind: '$items' }, 
            {
                $group: {
                    _id: { id: '$items.id', productId: '$items.productId' }, 
                    productName: { $first: '$items.name' }, 
                    revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } 
                }
            },
            { $sort: { revenue: -1 } }, 
            { $limit: 5 } 
        ]);

        // --- 4. Daily Revenue Trend (30 Days) for "Statistic Wave" ---
        const dailyRevenueTrend = await orderModel.aggregate([
            { $match: { 
                payment: true, 
                date: { $gte: thirtyDaysAgo } 
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } } },
                Revenue: { $sum: '$amount' }
            }},
            { $sort: { _id: 1 } }, 
            { $project: {
                _id: 0, 
                date: "$_id",
                Revenue: 1
            }}
        ]);
        
        // --- Final Success Response ---
        const responseData = {
            totalRevenue,
            totalOrders,
            currentMonthRevenue,
            totalCustomers,
            newCustomersThisMonth,
            topProducts,
            totalUnitsSold,     
            dailyRevenueTrend,  
        };
        
        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error("CRITICAL SERVER CRASH IN ANALYTICS:", error.stack || error); 
        
        res.status(500).json({
            success: false,
            message: "Internal Server Error. Please check backend console for detailed MongoDB error."
        });
    }
};

export { getOverviewAnalytics };