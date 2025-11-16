import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";

const getStartOfMonth = () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  return startOfMonth.getTime();
};

const getOverviewAnalytics = async (req, res) => {
  try {
    const startOfMonthTimestamp = getStartOfMonth();
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).getTime();

    const [
      totalRevenueResult,
      totalOrdersResult,
      monthlyRevenueResult,
      totalUnitsSoldResult,
    ] = await Promise.all([
      orderModel.aggregate([
        { $match: { payment: true } },
        { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
      ]),
      orderModel.countDocuments({}),
      orderModel.aggregate([
        { $match: { payment: true, date: { $gte: startOfMonthTimestamp } } },
        { $group: { _id: null, currentMonthRevenue: { $sum: "$amount" } } },
      ]),
      orderModel.aggregate([
        { $match: { payment: true } },
        { $unwind: "$items" },
        { $group: { _id: null, totalUnitsSold: { $sum: "$items.quantity" } } },
      ]),
    ]);

    const totalRevenue = totalRevenueResult[0]?.totalRevenue || 0;
    const totalOrders = totalOrdersResult || 0;
    const currentMonthRevenue =
      monthlyRevenueResult[0]?.currentMonthRevenue || 0;
    const totalUnitsSold = totalUnitsSoldResult[0]?.totalUnitsSold || 0;

    const totalCustomers = await userModel.countDocuments({ role: "customer" });
    const newCustomersThisMonth = await userModel.countDocuments({
      role: "customer",
      date: { $gte: startOfMonthTimestamp },
    });

    const topProducts = await orderModel.aggregate([
      { $match: { payment: true } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          totalQuantity: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
    ]);

    const dailyRevenueTrend = await orderModel.aggregate([
      {
        $match: {
          payment: true,
          date: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: { $toDate: "$date" } },
          },
          Revenue: { $sum: "$amount" },
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: "$_id",
          Revenue: 1,
        },
      },
    ]);

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
      data: responseData,
    });
  } catch (error) {
    console.error("CRITICAL SERVER CRASH IN ANALYTICS:", error.stack || error);

    res.status(500).json({
      success: false,
      message: "An error occurred while fetching analytics.",
      error: error.message,
    });
  }
};

export { getOverviewAnalytics };
