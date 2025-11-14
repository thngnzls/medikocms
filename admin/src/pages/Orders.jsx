"use client"

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { assets } from '../assets/assets';
import { FaCheckCircle, FaTimesCircle, FaTasks, FaUndoAlt, FaTruckLoading, FaTruck, FaClock, FaPrint } from 'react-icons/fa';

const formatCurrency = (amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return "₱0.00";
    return new Intl.NumberFormat('en-PH', {
        style: 'currency', currency: 'PHP', minimumFractionDigits: 2,
    }).format(numericAmount);
};

const getOrderTimeline = (order) => {
    const orderDate = order.date ? new Date(order.date) : new Date();
    const estimatedShipDate = new Date(orderDate.getTime() + 2 * 24 * 60 * 60 * 1000);
    const estimatedDeliveryDate = new Date(orderDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const trackingID = order._id ? order._id.slice(-8).toUpperCase() + 'TID' : 'N/A';
    const timeline = [];

    timeline.push({
        icon: <FaClock className="text-blue-500" />,
        text: `Order Date: ${orderDate.toLocaleDateString()}`
    });

    const status = order.status?.toLowerCase() || '';

    if (status === 'processing' || status === 'packed' || status === 'order placed') {
        timeline.push({ icon: <FaTasks className="text-indigo-500" />, text: `Est. Shipping: ${estimatedShipDate.toLocaleDateString()}` });
    } else if (status === 'ready for pickup') {
        timeline.push({ icon: <FaTruckLoading className="text-yellow-600" />, text: `Logistics: Ready for Pickup (${estimatedShipDate.toLocaleDateString()})` });
        timeline.push({ icon: <FaTasks className="text-indigo-500" />, text: `<strong>Tracking ID:</strong> ${trackingID}` });
    } else if (status === 'picked up' || status === 'in transit' || status === 'out for delivery') {
        timeline.push({ icon: <FaTruck className="text-blue-600" />, text: `In Transit (Tracking: ${trackingID})` });
        timeline.push({ icon: <FaClock className="text-blue-500" />, text: `<strong>Est. Delivery:</strong> ${estimatedDeliveryDate.toLocaleDateString()}` });
    } else if (status === 'delivered') {
        timeline.push({ icon: <FaCheckCircle className="text-green-600" />, text: `Delivered on: ${order.deliveredAt ? new Date(order.deliveredAt).toLocaleDateString() : estimatedDeliveryDate.toLocaleDateString()}` });
    }
    return timeline;
};

const printInvoice = (order) => {
    const logoSrc = assets.mediko || '/logo.png';
    const invoiceContent = `
        <!DOCTYPE html><html><head><title>Invoice - Order #${order._id.slice(-8)}</title><style>
        body{font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;margin:0;padding:0;background-color:#ffffff;color:#1f2937;font-size:14px;line-height:1.6}
        .invoice-container{max-width:800px;margin:30px auto;background-color:#fff;padding:40px;border:1px solid #e5e7eb;border-radius:8px}
        .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #111827;padding-bottom:20px;margin-bottom:30px}
        .header img{max-height:50px} .header .invoice-title{text-align:right} .header h1{margin:0 0 5px 0;font-size:2em;color:#111827;text-transform:uppercase;letter-spacing:1px}
        .header p{margin:2px 0;font-size:0.9em;color:#6b7280} .details-grid{display:grid;grid-template-columns:1fr 1fr;gap:30px;margin-bottom:30px;font-size:0.9em}
        .details-grid h2{font-size:1em;color:#374151;margin-bottom:8px;border-bottom:1px solid #e5e7eb;padding-bottom:4px;font-weight:600}
        .details-grid p{margin:3px 0;color:#4b5563} .details-grid strong{color:#1f2937;font-weight:500}
        table{width:100%;border-collapse:collapse;margin-top:15px;font-size:0.9em} th,td{border-bottom:1px solid #e5e7eb;padding:12px 8px;text-align:left;color:#374151}
        th{background-color:#f9fafb;font-weight:600;color:#1f2937;text-transform:uppercase;font-size:0.8em;letter-spacing:0.5px} td.numeric,th.numeric{text-align:right}
        .totals-table{width:40%;margin-left:auto;margin-top:20px;font-size:0.9em;color:#374151} .totals-table td{border:none;padding:6px 0}
        .totals-table tr.grand-total td{padding-top:10px;border-top:2px solid #111827;font-size:1.1em;font-weight:bold;color:#111827}
        .footer{text-align:center;margin-top:40px;font-size:0.8em;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:20px}
        .print-button{display:block;width:120px;margin:30px auto;padding:10px;background-color:#1f2937;color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.9em;text-align:center}
        @media print{body{background-color:#fff;-webkit-print-color-adjust:exact} .invoice-container{box-shadow:none;border:none;margin:0;max-width:100%;border-radius:0;padding:20px 0} .print-button{display:none} .header{border-bottom:2px solid #111827} .totals-table tr.grand-total td{border-top:2px solid #111827}}
        </style></head><body><div class="invoice-container"><div class="header">
        <img src="${logoSrc}" alt="Mediko Logo"><div class="invoice-title"><h1>Invoice</h1><p>Invoice #: ${order._id?.slice(-8).toUpperCase() || 'N/A'}</p><p>Date: ${order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</p></div></div>
        <div class="details-grid"><div><h2>Bill To</h2><p><strong>${order.address?.firstName || ''} ${order.address?.lastName || ''}</strong></p>
        <p>${order.address?.street || ''}</p><p>${order.address?.city || ''}, ${order.address?.zipcode || ''}</p><p>Philippines</p>
        <p><strong>Phone:</strong> ${order.address?.phone || 'N/A'}</p><p><strong>Email:</strong> ${order.userId?.email || 'N/A'}</p></div>
        <div><h2>Order Details</h2><p><strong>Order ID:</strong> ${order._id || 'N/A'}</p><p><strong>Order Status:</strong> ${order.status || 'N/A'}</p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'N/A'}</p><p><strong>Payment Status:</strong> ${order.payment ? 'Paid' : 'Pending'}</p></div></div>
        <h2>Order Summary</h2><table><thead><tr><th>Item</th><th class="numeric">Qty</th><th class="numeric">Unit Price</th><th class="numeric">Total</th></tr></thead><tbody>
        ${(order.items || []).map(item => `<tr><td>${item.name || 'N/A'}${item.size ? ` (${item.size})` : ''}</td><td class="numeric">${item.quantity || 0}</td><td class="numeric">${formatCurrency(item.price || 0)}</td><td class="numeric">${formatCurrency((item.price || 0) * (item.quantity || 0))}</td></tr>`).join('')}</tbody></table>
        <table class="totals-table"><tbody><tr><td>Subtotal:</td><td class="numeric">${formatCurrency((order.amount || 0) - (order.deliveryFee || 0))}</td></tr><tr><td>Delivery Fee:</td><td class="numeric">${formatCurrency(order.deliveryFee || 0)}</td></tr><tr class="grand-total"><td>Total Amount:</td><td class="numeric">${formatCurrency(order.amount || 0)}</td></tr></tbody></table>
        <div class="footer">Thank you for your order! | Mediko Supplies | Generated: ${new Date().toLocaleString()}</div>
        <button class="print-button" onclick="window.print()">Print Invoice</button></div></body></html>`;

    const printWindow = window.open('', '_blank', 'width=800,height=600');
    if (printWindow) {
        printWindow.document.write(invoiceContent);
        printWindow.document.close();
        toast.info(`Generating invoice preview...`);
    } else {
        toast.error("Could not open print window. Please check popup settings.");
    }
};

const ListSpinner = () => (
     <div className="flex justify-center items-center h-screen">
       <svg className="animate-spin h-12 w-12 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
       </svg>
     </div>
);


const Orders = ({ token }) => {
    const [orders, setOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('active');
    const [isLoading, setIsLoading] = useState(true);

    const fetchAllOrders = async () => {
        if (!token) {
            toast.error("Authentication token missing.");
            setIsLoading(false);
            setOrders([]);
            return;
        }
        setIsLoading(true);
        try {
            const response = await axios.post(backendUrl + '/api/order/list', {}, { headers: { token } });
            const ordersArray = response.data.success ? (response.data.data || response.data.orders) : null;

            if (response.data.success && Array.isArray(ordersArray)) {
                setOrders(ordersArray.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)));
            } else {
                console.error("Invalid data format received:", response.data);
                toast.error(response.data.message || "Failed to fetch orders: Invalid data format.");
                setOrders([]);
            }
        } catch (error) {
             console.error("Fetch Orders Error:", error);
            toast.error(error.response?.data?.message || error.message || "An error occurred fetching orders.");
            setOrders([]);
        } finally {
             setIsLoading(false);
        }
    };


    const statusHandler = async (event, orderId) => {
        const newStatus = event.target.value;
        try {
            const response = await axios.post( backendUrl + '/api/order/status', { orderId, status: newStatus }, { headers: { token } } );
            if (response.data.success) {
                setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? {...o, status: newStatus} : o));
                toast.success('Order status updated!');
            } else { toast.error(response.data.message); }
        } catch (error) { console.error('Status Update Error:', error); toast.error(error.message || 'Failed to update status.'); }
    };

    const finalizeReturnAction = async (orderId, newStatus) => {
        const action = newStatus.includes('Approved') ? 'Approve' : 'Reject';
        if (!window.confirm(`Are you sure you want to ${action} the return request for this order?`)) return;
        try {
            const response = await axios.post( backendUrl + '/api/order/status', { orderId, status: newStatus }, { headers: { token } } );
            if (response.data.success) {
                setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? {...o, status: newStatus} : o));
                toast.success(`Return request ${newStatus.toLowerCase().replace('return ', '')}!`);
            } else { toast.error(response.data.message); }
        } catch (error) { console.error('Return Action Error:', error); toast.error(error.message || 'Failed to finalize return action.'); }
    };

    const handleAdminCancel = async (orderId) => {
        if (!window.confirm('Are you sure you want to forcibly cancel this order? This action cannot be undone.')) return;
        const cancellationReason = prompt('Please enter the reason for administrative cancellation (required):');
        if (!cancellationReason || cancellationReason.trim() === '') { toast.info('Cancellation aborted: Reason is required.'); return; }
        try {
            const response = await axios.post( backendUrl + '/api/order/status', { orderId, status: 'Cancelled', cancellationReason: `Admin Forced Cancel: ${cancellationReason.trim()}` }, { headers: { token } } );
            if (response.data.success) {
                 setOrders(prevOrders => prevOrders.map(o => o._id === orderId ? {...o, status: 'Cancelled', cancellationReason: `Admin Forced Cancel: ${cancellationReason.trim()}`} : o));
                toast.success('Order forcibly cancelled by admin.');
            } else { toast.error(response.data.message); }
        } catch (error) { console.error('Admin Cancel Error:', error); toast.error(error.message || 'Failed to cancel order.'); }
    };


    useEffect(() => {
        fetchAllOrders();
    }, [token]);

    const filteredOrders = useMemo(() => {
        switch (activeTab) {
            case 'active': return orders.filter(o => !['Delivered', 'Cancelled', 'Return Rejected'].includes(o.status) && !o.status?.includes('Return'));
            case 'completed': return orders.filter(o => o.status === 'Delivered');
            case 'cancelled': return orders.filter(o => o.status === 'Cancelled' || o.status === 'Return Rejected');
            case 'return_refund': return orders.filter(o => o.status === 'Return/Refund Requested' || o.status === 'Return Approved');
            default: return orders;
        }
    }, [orders, activeTab]);

    const renderOrders = (ordersToRender) => (
        <div className="mt-6 space-y-4">
             {isLoading ? (
                 <div className="text-center py-10 text-gray-500">Loading orders...</div>
             ) : ordersToRender.length === 0 ? (
                 <div className="text-center py-10 bg-white rounded-lg shadow-sm border border-gray-200">
                     <FaTasks className="mx-auto text-4xl text-gray-400 mb-3" />
                     <p className="text-gray-500">No orders found in this category.</p>
                 </div>
             ) : (
                ordersToRender.map((order, index) => {
                    const isCancelled = order.status === 'Cancelled' || order.status === 'Return Rejected';
                    const isDelivered = order.status === 'Delivered';
                    const isReturnRequested = order.status === 'Return/Refund Requested';
                    const isReturnApproved = order.status === 'Return Approved';
                    const timeline = getOrderTimeline(order);
                    let cardClass = 'bg-white border-gray-200';
                    if (isCancelled) cardClass = 'bg-red-50 border-red-200 opacity-90';
                    else if (isDelivered) cardClass = 'bg-green-50 border-green-200';
                    else if (isReturnRequested) cardClass = 'bg-yellow-50 border-yellow-300';
                    else if (isReturnApproved) cardClass = 'bg-teal-50 border-teal-200';

                    return (
                        <div className={`border rounded-lg shadow-sm p-4 md:p-6 ${cardClass}`} key={order._id || index}>
                            <div className="grid grid-cols-1 md:grid-cols-[auto_1fr] lg:grid-cols-[auto_2fr_1.5fr_1.5fr_1fr] gap-4 items-start">
                                <div className="hidden md:flex justify-center items-center bg-gray-100 rounded-full w-12 h-12 flex-shrink-0">
                                     <img className="w-8" src={assets.parcel_icon} alt="Order" />
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700">
                                    <p className="font-semibold text-gray-800 mb-2">Order ID: <span className="font-mono text-green-600">{order._id?.slice(-8).toUpperCase() || 'N/A'}</span></p>
                                    <div className="mb-3 border-t pt-2">
                                        <p className="font-medium text-gray-600 mb-1">Items:</p>
                                        {(order.items || []).map((item, i) => ( <p className="py-0.5" key={i}>{item.name || 'N/A'} x {item.quantity || 0}{item.size ? ` (${item.size})` : ''}</p> ))}
                                    </div>
                                    <p className="font-medium text-gray-600 mb-1">Customer:</p>
                                    <p className="font-semibold">{order.address?.firstName || ''} {order.address?.lastName || ''}</p>
                                    <p>{order.address?.street || ''},</p>
                                    <p>{order.address?.city || ''}, {order.address?.zipcode || ''}</p>
                                    <p>{order.address?.phone || 'No phone'}</p>
                                    {order.cancellationReason && (<div className="mt-3 p-2 border rounded-md border-red-300 bg-red-50 text-xs"><p className="font-bold text-red-700">Cancellation Reason:</p><p className="italic text-red-600 whitespace-pre-line">{order.cancellationReason}</p></div>)}
                                     {(isReturnRequested || isReturnApproved || order.status === 'Return Rejected') && order.returnReason && (
                                        <div className={`mt-3 p-2 border rounded-md text-xs ${isReturnRequested ? 'border-yellow-400 bg-yellow-50' : isReturnApproved ? 'border-teal-400 bg-teal-50' : 'border-red-400 bg-red-50'}`}>
                                            <p className="font-bold">Return Reason:</p><p className="italic">{order.returnReason}</p>
                                            {order.returnProofUrls && order.returnProofUrls.length > 0 && (
                                                <div className="mt-2"><p className="font-bold text-gray-700">Proof ({order.returnProofUrls.length}):</p><div className="flex gap-1 mt-1 flex-wrap">
                                                    {order.returnProofUrls.map((url, i) => (<a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 border rounded overflow-hidden hover:opacity-80 block" title={`View proof ${i+1}`}><img src={url} alt={`Proof ${i+1}`} className="w-full h-full object-cover" /></a> ))}
                                                </div></div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700 border-t md:border-t-0 md:border-l md:pl-4 pt-4 md:pt-0">
                                     <p className="mb-1"><strong>Date:</strong> {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</p>
                                     <p className="mb-1"><strong>Items:</strong> {order.items?.length || 0}</p>
                                     <p className="mb-1"><strong>Payment:</strong> {order.paymentMethod || 'N/A'} ({order.payment ? <span className="text-green-600 font-semibold">Paid</span> : <span className="text-orange-500 font-semibold">Pending</span>})</p>
                                    <p className="font-bold text-base mt-3 text-gray-800">Total: {formatCurrency(order.amount)}</p>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l md:pl-4 pt-4 md:pt-0">
                                    <p className="font-semibold text-sm mb-2 text-gray-800">Order Timeline</p>
                                    <div className="flex flex-col gap-2">
                                        {timeline.map((item, i) => ( <div key={i} className="flex items-center gap-2 text-xs text-gray-600"> <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">{item.icon}</span> {item.text.includes('<') ? <p dangerouslySetInnerHTML={{ __html: item.text }} /> : <p>{item.text}</p>} </div> ))}
                                    </div>
                                </div>
                                <div className="border-t md:border-t-0 md:border-l md:pl-4 pt-4 md:pt-0 flex flex-col items-stretch gap-2">
                                     <select onChange={(event) => statusHandler(event, order._id)} value={order.status || ''} className="p-2 font-semibold text-xs border border-gray-300 rounded-lg bg-white w-full focus:ring-2 focus:ring-blue-500 focus:outline-none" aria-label={`Update status for order ${order._id?.slice(-8)}`}>
                                          <option value="Order Placed">Order Placed</option>
                                          <option value="Processing">Processing</option>
                                          <option value="Packed">Packed</option>
                                          <option value="Ready for Pickup">Ready for Pickup</option>
                                          <option value="Picked Up">Picked Up</option>
                                          <option value="In Transit">In Transit</option>
                                          <option value="Out for Delivery">Out for Delivery</option>
                                          <option value="Delivered">Delivered</option>
                                          <option value="Cancelled">Cancelled</option>
                                          <option value="Return/Refund Requested">Return Requested</option>
                                          <option value="Return Approved">Return Approved</option>
                                          <option value="Return Rejected">Return Rejected</option>
                                      </select>
                                      <button onClick={() => printInvoice(order)} className="flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-3 rounded text-xs transition-colors w-full" title="Print Invoice"><FaPrint /> Print Invoice</button>
                                      {isReturnRequested && ( <div className="flex flex-col gap-2 mt-1"> <button onClick={() => finalizeReturnAction(order._id, 'Return Approved')} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors w-full"> Approve Return </button> <button onClick={() => finalizeReturnAction(order._id, 'Return Rejected')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-xs transition-colors w-full"> Reject Return </button> </div> )}
                                      {!isCancelled && !isDelivered && !isReturnRequested && !isReturnApproved && ( <button onClick={() => handleAdminCancel(order._id)} className="bg-red-700 hover:bg-red-800 text-white font-bold py-2 px-3 rounded text-xs transition-colors w-full mt-1"> Force Cancel </button> )}
                                </div>
                            </div>
                        </div>
                    );
                })
             )}
        </div>
    );

    const counts = useMemo(() => ({
        active: orders.filter(o => !['Delivered', 'Cancelled', 'Return Rejected'].includes(o.status) && !o.status?.includes('Return')).length,
        completed: orders.filter(o => o.status === 'Delivered').length,
        cancelled: orders.filter(o => o.status === 'Cancelled' || o.status === 'Return Rejected').length,
        return_refund: orders.filter(o => o.status === 'Return/Refund Requested' || o.status === 'Return Approved').length,
    }), [orders]);

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h3 className="text-2xl font-bold mb-6 text-gray-800">Order Management</h3>
            <div className="flex border-b border-gray-200 mb-6 overflow-x-auto whitespace-nowrap bg-white rounded-t-lg shadow-sm px-2">
                 {[
                    { key: 'active', label: 'Active', icon: <FaTasks />, count: counts.active, color: 'indigo' },
                    { key: 'completed', label: 'Completed', icon: <FaCheckCircle />, count: counts.completed, color: 'green' },
                    { key: 'cancelled', label: 'Cancelled/Rejected', icon: <FaTimesCircle />, count: counts.cancelled, color: 'red' },
                    { key: 'return_refund', label: 'Returns', icon: <FaUndoAlt />, count: counts.return_refund, color: 'orange' }
                 ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors duration-150 ease-in-out ${ activeTab === tab.key ? `border-${tab.color}-600 text-${tab.color}-600` : `border-transparent text-gray-500 hover:text-${tab.color}-600 hover:border-${tab.color}-300` }`}
                    >
                        {tab.icon} {tab.label}
                        <span className={`ml-1 px-2 py-0.5 rounded-full text-xs font-semibold ${activeTab === tab.key ? `bg-${tab.color}-100 text-${tab.color}-700` : 'bg-gray-100 text-gray-500'}`}>
                           {counts[tab.key]} {/* Use calculated counts */}
                        </span>
                    </button>
                ))}
            </div>
            {renderOrders(filteredOrders)}
        </div>
    );
};

export default Orders;