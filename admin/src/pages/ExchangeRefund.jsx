import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { backendUrl, currency } from '../App';
import { toast } from 'react-toastify';
import { FaUndoAlt, FaBoxOpen, FaClipboardList, FaArrowLeft, FaExchangeAlt } from 'react-icons/fa'; 

// Return reasons can be shared or adapted from the admin component
const returnReasons = [
    'Item is defective or damaged',
    'Received the wrong item',
    'Size or fit is incorrect',
    'Quality is not as expected',
    'Changed mind/no longer needed',
    'Other'
];

// Renamed component from ExchangeReturn to ExchangeRefund
const ExchangeRefund = ({ token }) => {
    const [deliveredOrders, setDeliveredOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [returnReason, setReturnReason] = useState(returnReasons[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. Fetch all 'Delivered' orders for return eligibility
    const fetchDeliveredOrders = async () => {
        if (!token) return;
        try {
            // Note: This endpoint should ideally fetch only orders for the logged-in user
            const response = await axios.post(backendUrl + '/api/order/userorders', {}, { headers: { token } });
            if (response.data.success) {
                // Filter for only delivered orders that haven't been requested for return yet
                const eligibleOrders = response.data.orders.filter(
                    (order) => order.status === 'Delivered'
                );
                setDeliveredOrders(eligibleOrders);
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            toast.error(error.message || 'Failed to fetch orders.');
        }
    };

    useEffect(() => {
        fetchDeliveredOrders();
    }, [token]);

    // 2. Handle order selection and item state initialization
    const handleOrderSelect = (orderId) => {
        const order = deliveredOrders.find(o => o._id === orderId);
        if (order) {
            setSelectedOrder(order);
            // Initialize return items: all items from the order, default return quantity to 0
            const initialReturnItems = order.items.map(item => ({
                ...item,
                returnQuantity: 0,
            }));
            setReturnItems(initialReturnItems);
        } else {
            setSelectedOrder(null);
            setReturnItems([]);
        }
    };

    // 3. Handle item quantity change
    const handleQuantityChange = (index, newQuantity) => {
        const newItems = [...returnItems];
        const maxQuantity = newItems[index].quantity;
        
        // Ensure quantity is a number, non-negative, and no greater than the purchased quantity
        let finalQuantity = parseInt(newQuantity) || 0;
        finalQuantity = Math.max(0, Math.min(finalQuantity, maxQuantity));

        newItems[index].returnQuantity = finalQuantity;
        setReturnItems(newItems);
    };

    // 4. Handle form submission (API call) - Refactored for explicit Refund Request
    const handleRefundSubmit = async (e) => {
        e.preventDefault();

        const itemsToReturn = returnItems
            .filter(item => item.returnQuantity > 0)
            .map(item => ({
                itemId: item._id, // Assuming item has an _id or productId
                name: item.name,
                quantity: item.returnQuantity,
                size: item.size,
                price: item.price,
            }));

        if (itemsToReturn.length === 0) {
            // Updated message
            return toast.error("Please select at least one item and quantity for refund.");
        }
        if (!returnReason || returnReason === '') {
            // Updated message
            return toast.error("A reason for refund is required.");
        }

        setIsSubmitting(true);

        const refundData = {
            orderId: selectedOrder._id,
            returnReason,
            itemsToReturn,
            // Explicitly define the request type as 'Refund'
            requestType: 'Refund', 
        };

        try {
            const response = await axios.post(
                backendUrl + '/api/order/return-request', 
                refundData, // Using refundData
                { headers: { token } }
            );

            if (response.data.success) {
                // Updated success message
                toast.success("Refund request submitted successfully! We will review it shortly."); 
                setSelectedOrder(null); // Reset form
                fetchDeliveredOrders(); // Refresh order list
            } else {
                toast.error(response.data.message);
            }
        } catch (error) {
            console.error('Refund Request Error:', error);
            // Updated error message
            toast.error(error.response?.data?.message || 'Failed to submit refund request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDER LOGIC ---

    if (selectedOrder) {
        // Form to specify items and reason for return
        return (
            <div className="p-4 md:p-8 max-w-4xl mx-auto">
                <button 
                    onClick={() => setSelectedOrder(null)} 
                    className="flex items-center text-indigo-600 hover:text-indigo-800 mb-6 text-sm"
                >
                    <FaArrowLeft className="mr-2" /> Back to Orders
                </button>
                <h3 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    <FaExchangeAlt className="text-indigo-600" />
                    {/* Updated title */}
                    Initiate Refund Request
                </h3>
                <p className="text-gray-500 mb-6">Order ID: <span className="font-mono text-indigo-700">{selectedOrder._id}</span></p>

                {/* Updated form handler */}
                <form onSubmit={handleRefundSubmit} className="space-y-6">
                    <div className="border p-4 rounded-lg bg-gray-50">
                        {/* Updated label */}
                        <h4 className="text-lg font-semibold mb-3">Items for Refund:</h4>
                        {returnItems.map((item, index) => (
                            <div key={index} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 my-2 border-b last:border-b-0">
                                <p className="font-medium">
                                    {item.name} ({item.size})
                                    <span className="text-sm text-gray-500 ml-2">({currency}{item.price.toFixed(2)} ea.)</span>
                                </p>
                                <div className="flex items-center gap-3 mt-2 sm:mt-0">
                                    <span className="text-sm text-gray-600">Max Qty: {item.quantity}</span>
                                    <input
                                        type="number"
                                        value={item.returnQuantity}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                        min="0"
                                        max={item.quantity}
                                        className="w-16 p-1 border rounded text-center text-sm focus:ring-indigo-500 focus:border-indigo-500"
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        {/* Updated label */}
                        <label htmlFor="returnReason" className="block text-lg font-medium text-gray-700">
                            Reason for Refund:
                        </label>
                        <select
                            id="returnReason"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            required
                            disabled={isSubmitting}
                        >
                            {returnReasons.map(reason => (
                                <option key={reason} value={reason}>{reason}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
                    </button>
                </form>
            </div>
        );
    }

    // List of delivered orders to select from
    return (
        <div className="p-4 md:p-8 max-w-6xl mx-auto">
            <h3 className="text-3xl font-bold mb-6 flex items-center gap-3">
                <FaUndoAlt className="text-indigo-600" />
                {/* Updated center title */}
                Refund Center
            </h3>

            {deliveredOrders.length === 0 ? (
                <div className="text-center p-10 border-2 border-dashed rounded-lg bg-gray-50">
                    <FaBoxOpen className="text-6xl text-gray-400 mx-auto mb-4" />
                    {/* Updated text */}
                    <p className="text-xl font-medium text-gray-700">No Eligible Orders for Refund</p>
                    {/* Updated text */}
                    <p className="text-gray-500 mt-2">Only orders with status "Delivered" are available for refund.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Updated text */}
                    <p className="text-gray-600">Select an order below to start a refund request.</p>
                    {deliveredOrders.map((order) => (
                        <div key={order._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 border rounded-lg shadow-sm bg-white hover:border-indigo-400 transition duration-150">
                            <div className="flex-1 space-y-1">
                                <p className="text-sm font-medium text-gray-500">Order ID: <span className="font-mono text-gray-700">{order._id}</span></p>
                                <p className="text-lg font-bold">{currency}{order.amount}</p>
                                <p className="text-sm text-gray-500">
                                    {order.items.map(item => `${item.name} x ${item.quantity}`).join(', ')}
                                </p>
                            </div>
                            <div className="mt-4 md:mt-0">
                                <p className="text-sm text-gray-600 mb-2">Delivered on: {new Date(order.date).toLocaleDateString()}</p>
                                <button
                                    onClick={() => handleOrderSelect(order._id)}
                                    className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                                >
                                    {/* Updated button text */}
                                    Start Refund Request
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ExchangeRefund;