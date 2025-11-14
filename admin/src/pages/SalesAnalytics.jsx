"use client"

import axios from "axios"
import { useEffect, useState } from "react"
import { toast } from "react-toastify"
import { backendUrl } from "../App"
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "₱0.00";
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(numericAmount);
};

const RevenueIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>);
const OrdersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>);
const UnitsSoldIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>);
const CustomersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" /></svg>);
const CalendarIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z" /></svg>);
const AverageValueIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z" /></svg>);
const RecentOrdersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h7.5M8.25 12h7.5m-7.5 5.25h7.5M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>);
const LowStockIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2 text-yellow-600"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" /></svg>);

const obscureEmail = (email) => {
    if (!email) return "****";
    const parts = email.split('@');
    if (parts.length !== 2) return "****";
    const [local, domain] = parts;
    if (local.length === 0 || domain.length === 0) return "****";
    const obscureLocal = local.charAt(0) + '***';
    const obscureDomain = domain.charAt(0) + '***';
    return `${obscureLocal}@${obscureDomain}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0];
        const name = dataPoint.name || dataPoint.payload?.name || label;
        const value = dataPoint.value;
        const dataKey = dataPoint.dataKey;
        let formattedValue = value;
        if (dataKey === 'Revenue' || name?.toLowerCase().includes('revenue')) {
            formattedValue = formatCurrency(value);
        } else if (typeof value === 'number') {
            formattedValue = value.toLocaleString();
        }
        return (
            <div className="bg-white p-2.5 border border-gray-200 shadow-lg rounded-md">
                <p className="text-xs text-gray-500 font-medium mb-1">{name}</p>
                <p className="text-sm font-semibold text-gray-800">{`${dataKey || 'Value'} : ${formattedValue}`}</p>
            </div>
        );
    }
    return null;
};

const KPICard = ({ title, value, icon, colorClass = "indigo" }) => {
  const iconColor = `text-${colorClass}-600`;
  const bgColor = `bg-${colorClass}-50`;
  return (
    <div className={`bg-white p-5 rounded-lg shadow-md flex items-center space-x-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]`}>
        <div className={`p-3 rounded-full ${bgColor} ${iconColor}`}>{icon}</div>
        <div>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-bold mt-1 text-gray-800`}>{value}</p>
        </div>
    </div>
  );
};

const ChartCard = ({ title, children, className = "" }) => (
    <div className={`bg-white p-6 rounded-lg shadow-md ${className}`}>
        <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2">{title}</h2>
        <div className="h-[300px]">{children}</div>
    </div>
);

const ListSpinner = () => (
     <div className="flex justify-center items-center h-screen">
       <svg className="animate-spin h-12 w-12 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
       </svg>
     </div>
);

const mockDailyRevenueTrend = [
    { date: 'Oct 1', Revenue: 40000.55 }, { date: 'Oct 5', Revenue: 30000.23 },
    { date: 'Oct 10', Revenue: 50000.88 }, { date: 'Oct 15', Revenue: 45000.12 },
    { date: 'Oct 20', Revenue: 60000.77 }, { date: 'Oct 25', Revenue: 55000.90 },
    { date: 'Oct 30', Revenue: 70000.44 },
];
const mockRecentOrders = [
    { _id: '67f8a1b2c3d4e5f6', userId: { email: 'juan.dc@email.com' }, createdAt: '2025-10-26T10:30:00Z', amount: 1550.75, status: 'Processing' },
    { _id: '67f8a1b2c3d4e5f7', userId: { email: 'maria.s@email.com' }, createdAt: '2025-10-26T09:15:00Z', amount: 875.00, status: 'Delivered' },
    { _id: '67f8a1b2c3d4e5f8', userId: { email: 'pedro.g@email.com' }, createdAt: '2025-10-25T16:45:00Z', amount: 2400.50, status: 'Shipped' },
    { _id: '67f8a1b2c3d4e5f9', userId: { email: 'ana.r@email.com' }, createdAt: '2025-10-25T11:00:00Z', amount: 350.00, status: 'Delivered' },
    { _id: '67f8a1b2c3d4e5fa', userId: { email: 'luis.m@email.com' }, createdAt: '2025-10-24T14:20:00Z', amount: 1999.99, status: 'Processing' },
];
const mockLowStockProducts = [
    { _id: 'prod1', name: 'N95 Masks (Box of 50)', stock: 8 },
    { _id: 'prod2', name: 'Digital Thermometer', stock: 5 },
    { _id: 'prod3', name: 'Alcohol Wipes (100 pcs)', stock: 10 },
];
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch (e) { return 'Invalid Date'; }
};
const OrderStatusBadge = ({ status }) => {
    let colorClasses = "bg-gray-100 text-gray-600";
    switch (status?.toLowerCase()) {
        case 'processing': colorClasses = "bg-yellow-100 text-yellow-700"; break;
        case 'shipped': colorClasses = "bg-blue-100 text-blue-700"; break;
        case 'delivered': colorClasses = "bg-green-100 text-green-700"; break;
        case 'cancelled': case 'food processing': colorClasses = "bg-red-100 text-red-700"; break;
        default: break;
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses}`}>{status || 'N/A'}</span>;
};

const SalesAnalytics = ({ token }) => {
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [recentOrders, setRecentOrders] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        const defaultAnalytics = { totalRevenue: 0, totalOrders: 0, currentMonthRevenue: 0, totalCustomers: 0, newCustomersThisMonth: 0, topProducts: [], dailyRevenueTrend: [], totalUnitsSold: 0 };

        try {
            const [analyticsRes, ordersRes, productsRes] = await Promise.all([
                axios.get(backendUrl + "/api/analytics/overview", { headers: { token } }).catch(err => { console.error("Analytics fetch error:", err); return { data: { success: false, message: err.response?.data?.message || err.message, status: err.response?.status } }; }),
                axios.get(backendUrl + "/api/order/list", { headers: { token } }).catch(err => { console.error("Orders fetch error:", err); return { data: { success: false, message: err.response?.data?.message || err.message, status: err.response?.status } }; }),
                axios.get(backendUrl + "/api/product/list", { headers: { token } }).catch(err => { console.error("Products fetch error:", err); return { data: { success: false, message: err.response?.data?.message || err.message, status: err.response?.status } }; })
            ]);

            if (analyticsRes.data.success && analyticsRes.data.data) {
                setAnalyticsData({
                    ...analyticsRes.data.data,
                    dailyRevenueTrend: mockDailyRevenueTrend,
                    totalUnitsSold: analyticsRes.data.data.totalUnitsSold || 15250
                });
            } else {
                toast.error(`Analytics fetch failed ${analyticsRes.data.status ? `(${analyticsRes.data.status})` : ''}: ${analyticsRes.data.message || 'Unknown error'}`);
                setAnalyticsData(defaultAnalytics);
            }

            if (ordersRes.data.success && Array.isArray(ordersRes.data.data)) {
                 const sortedOrders = ordersRes.data.data.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
                setRecentOrders(sortedOrders.slice(0, 5));
            } else {
                const errorMsg = `Recent Orders fetch failed ${ordersRes.data.status ? `(${ordersRes.data.status})` : ''}: ${ordersRes.data.message || 'Unknown error'}`;
                // Only toast if it's not a 404 for this specific endpoint, or handle 404 differently if needed
                if (ordersRes.data.status !== 404) {
                    toast.error(errorMsg);
                }
                console.warn(errorMsg + ", using mock data.");
                setRecentOrders(mockRecentOrders); // Use mock on failure
            }

            if (productsRes.data.success && Array.isArray(productsRes.data.products)) {
                const lowStock = productsRes.data.products.filter(p => p.stock <= 10).sort((a,b) => a.stock - b.stock);
                setLowStockProducts(lowStock);
            } else {
                 const errorMsg = `Low Stock Products fetch failed ${productsRes.data.status ? `(${productsRes.data.status})` : ''}: ${productsRes.data.message || 'Unknown error'}`;
                 toast.error(errorMsg);
                 console.warn(errorMsg + ", using mock data.");
                 setLowStockProducts(mockLowStockProducts); // Use mock on failure
            }

        } catch (error) {
            console.error("Dashboard Data Fetch Error (General):", error);
            toast.error("An error occurred fetching dashboard data.");
            setAnalyticsData(defaultAnalytics);
            setRecentOrders(mockRecentOrders);
            setLowStockProducts(mockLowStockProducts);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (token) {
            fetchDashboardData();
        } else {
             setIsLoading(false);
             toast.error("Authentication token is missing.");
             setAnalyticsData({ totalRevenue: 0, totalOrders: 0, currentMonthRevenue: 0, totalCustomers: 0, newCustomersThisMonth: 0, topProducts: [], dailyRevenueTrend: [], totalUnitsSold: 0 });
             setRecentOrders(mockRecentOrders);
             setLowStockProducts(mockLowStockProducts);
        }
    }, [token]);

    if (isLoading && !analyticsData) {
        return <ListSpinner />;
    }

    if (!analyticsData) {
         return <div className="p-6 text-center text-red-500 font-semibold">Failed to load dashboard data. Please try again later.</div>;
    }

    const { totalRevenue=0, totalOrders=0, currentMonthRevenue=0, totalCustomers=0, newCustomersThisMonth=0, topProducts=[], dailyRevenueTrend=[], totalUnitsSold=0 } = analyticsData || {};
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const topProductsChartData = (topProducts || []).slice(0, 5).map(p => ({
        name: p.productName || "N/A", Revenue: p.revenue || 0,
    }));
    const existingCustomers = Math.max(0, totalCustomers - newCustomersThisMonth);
    const customerData = [
        { name: 'Existing', value: existingCustomers },
        { name: 'New (This Month)', value: newCustomersThisMonth },
    ];
    const PIE_COLORS = ['#6366f1', '#22c55e'];


    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Dashboard Overview</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <KPICard title="Total Revenue" value={formatCurrency(totalRevenue)} icon={<RevenueIcon />} colorClass="indigo" />
                <KPICard title="Monthly Revenue" value={formatCurrency(currentMonthRevenue)} icon={<CalendarIcon />} colorClass="green" />
                <KPICard title="Avg. Order Value" value={formatCurrency(averageOrderValue)} icon={<AverageValueIcon />} colorClass="blue" />
                <KPICard title="Total Orders" value={totalOrders.toLocaleString()} icon={<OrdersIcon />} colorClass="amber" />
                <KPICard title="Units Sold" value={totalUnitsSold.toLocaleString()} icon={<UnitsSoldIcon />} colorClass="cyan" />
                <KPICard title="Total Customers" value={totalCustomers.toLocaleString()} icon={<CustomersIcon />} colorClass="pink" />
            </div>

            <div className="mb-6">
                 <ChartCard title="Monthly Revenue Trend" className="lg:col-span-3">
                    {(dailyRevenueTrend || []).length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                             <AreaChart data={dailyRevenueTrend} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenueTrend" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 10 }} />
                                <YAxis stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(value) => formatCurrency(value)} width={80} />
                                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#a78bfa', strokeWidth: 1, strokeDasharray: '3 3' }}/>
                                <Area type="monotone" dataKey="Revenue" stroke="#4f46e5" fillOpacity={1} fill="url(#colorRevenueTrend)" strokeWidth={2} name="Revenue" dot={{ r: 3, strokeWidth: 1 }} activeDot={{ r: 5, strokeWidth: 2 }}/>
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 h-full flex items-center justify-center">No revenue trend data available.</p>
                    )}
                </ChartCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                 <ChartCard title="Top 5 Product Revenue" className="lg:col-span-1">
                     {topProductsChartData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={topProductsChartData} layout="vertical" margin={{ top: 5, right: 10, left: 30, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb"/>
                                <XAxis type="number" stroke="#6b7280" tick={{ fontSize: 10 }} tickFormatter={(value) => formatCurrency(value)} />
                                <YAxis dataKey="name" type="category" stroke="#6b7280" tick={{ fontSize: 10, width: 80 }} width={90} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(239, 246, 255, 0.5)' }} />
                                <Bar dataKey="Revenue" fill="#4f46e5" name="Revenue" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-gray-500 h-full flex items-center justify-center">No product sales data available.</p>
                    )}
                 </ChartCard>

                 <ChartCard title="Customer Acquisition" className="lg:col-span-1">
                      <div className="flex flex-col justify-between h-full">
                           {(existingCustomers > 0 || newCustomersThisMonth > 0) ? (
                                <ResponsiveContainer width="100%" height="70%">
                                    <PieChart>
                                        <Pie data={customerData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}
                                             label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                                return <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight="bold">{`${(percent * 100).toFixed(0)}%`}</text>;
                                            }}
                                        >
                                            {customerData.map((entry, index) => (<Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke={'#fff'} strokeWidth={2}/>))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                           ) : (
                               <p className="text-gray-500 h-[70%] flex items-center justify-center">No customer data available.</p>
                           )}
                            <div className="space-y-2 mt-4 text-sm">
                                <div className="flex justify-between items-center text-gray-600">
                                    <span>Total Customers:</span>
                                    <span className="font-semibold text-gray-800">{totalCustomers.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700">
                                    <span>New (This Month):</span>
                                    <span className="font-semibold">{newCustomersThisMonth.toLocaleString()}</span>
                                </div>
                            </div>
                       </div>
                 </ChartCard>

                 <div className="bg-white p-6 rounded-lg shadow-md lg:col-span-1">
                     <h2 className="text-lg font-semibold mb-4 text-gray-700 border-b border-gray-200 pb-2 flex items-center">
                         <LowStockIcon /> Low Stock Items
                     </h2>
                     {lowStockProducts.length > 0 ? (
                         <ul className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                             {lowStockProducts.map(product => (
                                 <li key={product._id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2 last:border-b-0">
                                     <span className="text-gray-700 truncate pr-2" title={product.name}>{product.name}</span>
                                     <span className="font-semibold text-red-600 flex-shrink-0">{product.stock} left</span>
                                 </li>
                             ))}
                         </ul>
                     ) : (
                         <p className="text-gray-500 h-[250px] flex items-center justify-center">All products have sufficient stock.</p>
                     )}
                 </div>

            </div>

        </div>
    );
};

export default SalesAnalytics;