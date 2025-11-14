import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import axios from "axios";
import OrderDetailsModal from "../components/OrderDetailsModal";
import ReturnRefundModal from "../components/ReturnRefundModal";
import CancelOrderModal from "../components/CancelOrderModal";
import OurPolicyModal from "../components/OurPolicyModal";
import {
  FaEye,
  FaStar,
  FaTimesCircle,
  FaCheckCircle,
  FaUndoAlt,
  FaTruck,
  FaCreditCard,
} from "react-icons/fa";
import { toast } from "react-toastify";

const Orders = () => {
  const { backendUrl, token, currency } = useContext(ShopContext);
  const [orderData, setOrderData] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [productToRate, setProductToRate] = useState(null);
  const [returnOrderId, setReturnOrderId] = useState(null);
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState("Active");
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  const loadOrderData = async () => {
    try {
      if (!token) {
        setOrderData([]);
        return;
      }

      const response = await axios.post(
        backendUrl + "/api/order/userorders",
        {},
        { headers: { token } }
      );

      if (response.data.success) {
        setOrderData(
          response.data.orders.sort(
            (a, b) => new Date(b.date) - new Date(a.date)
          )
        );
      } else {
        toast.error("Failed to load orders.");
      }
    } catch (error) {
      console.error("Error loading order data:", error);
    }
  };

  useEffect(() => {
    loadOrderData();
    const intervalId = setInterval(loadOrderData, 10000);
    return () => {
      clearInterval(intervalId);
    };
  }, [token, backendUrl]);

  const handleOpenModal = (order, item = null) => {
    setSelectedOrder(order);
    setProductToRate(item);
    setIsModalOpen(true);
  };
  const handleCloseModal = () => {
    setSelectedOrder(null);
    setProductToRate(null);
    setIsModalOpen(false);
  };
  const handleOpenCancelModal = (orderId) => setCancelOrderId(orderId);
  const handleCloseCancelModal = () => setCancelOrderId(null);
  const handleReviewSubmit = async () => {};
  const handleCancelOrder = async () => {};

  const handleOpenReturnModal = (orderId) => setReturnOrderId(orderId);
  const handleCloseReturnModal = () => setReturnOrderId(null);

  const handleOpenPolicyModal = () => setIsPolicyModalOpen(true);
  const handleClosePolicyModal = () => setIsPolicyModalOpen(false);

  const handleReturnRefundRequest = async (orderId, reason) => {
    try {
      const response = await axios.post(
        backendUrl + "/api/order/return-request",
        {
          orderId,
          status: "Return/Refund Requested",
          returnReason: reason,
        },
        { headers: { token } }
      );

      if (response.data.success) {
        toast.success(
          "Return/Refund request submitted successfully! Please review our policy."
        );
        loadOrderData();
      } else {
        toast.error(
          response.data.message || "Failed to submit return/refund request."
        );
      }
    } catch (error) {
      console.error("Error submitting return/refund:", error);
      toast.error("An error occurred while trying to submit your request.");
    }
  };

  const completedOrders = orderData.filter(
    (order) => order.status === "Delivered"
  );
  const cancelledOrders = orderData.filter(
    (order) =>
      order.status === "Cancelled" ||
      order.status === "Return Rejected" ||
      order.status === "Payment Failed and Order Cancelled"
  );

  const returnRefundOrders = orderData.filter(
    (order) =>
      order.status.includes("Return") || order.status.includes("Refund")
  );

  const activeOrders = orderData.filter((order) => {
    const isCompleted = order.status === "Delivered";
    const isCancelled =
      order.status === "Cancelled" ||
      order.status === "Return Rejected" ||
      order.status === "Payment Failed and Order Cancelled";
    const isReturnRefund =
      order.status.includes("Return") || order.status.includes("Refund");

    return !isCompleted && !isCancelled && !isReturnRefund;
  });

  const ordersMap = {
    Active: activeOrders,
    Completed: completedOrders,
    "Returns/Refunds": returnRefundOrders,
    Cancelled: cancelledOrders,
  };

  const currentOrders = ordersMap[activeTab] || [];

  const renderOrderList = (orders, sectionType) => {
    if (orders.length === 0) {
      const messages = {
        Active: "No orders currently being processed.",
        Completed: "No completed orders yet. Shop now!",
        "Returns/Refunds": "No pending return or refund requests.",
        Cancelled: "No cancelled or rejected orders.",
      };
      return (
        <p className="text-gray-500 mt-4">
          {messages[sectionType] || "No orders found."}
        </p>
      );
    }

    return (
      <div className="mt-4 space-y-6">
        {orders.map((order, index) => {
          const isPaymentPending =
            (order.paymentStatus === "Pending" ||
              order.paymentStatus === "Failed") &&
            order.stripeSessionUrl;

          return (
            <div
              key={index}
              className={`mb-6 p-4 border rounded-lg shadow-sm
                                ${
                                  sectionType === "Cancelled" ||
                                  order.status === "Return Rejected"
                                    ? "bg-red-50 opacity-90"
                                    : sectionType === "Completed"
                                    ? "bg-green-50"
                                    : sectionType === "Returns/Refunds"
                                    ? "bg-yellow-100 border-yellow-300"
                                    : "bg-white"
                                }`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <p className="font-semibold">
                    Order ID:{" "}
                    <span className="font-normal text-gray-500">
                      #{order._id.substring(0, 8)}
                    </span>
                  </p>
                  <p className="font-semibold">
                    Date:{" "}
                    <span className="font-normal text-gray-500">
                      {new Date(order.date).toDateString()}
                    </span>
                  </p>
                  {order.returnReason && order.status.includes("Return") && (
                    <p className="font-semibold text-orange-600 truncate max-w-xs">
                      Return Reason:{" "}
                      <span className="font-normal text-gray-700">
                        {order.returnReason}
                      </span>
                    </p>
                  )}
                  {order.cancellationReason && order.status === "Cancelled" && (
                    <p className="font-semibold text-red-600 truncate max-w-xs">
                      Cancel Reason:{" "}
                      <span className="font-normal text-gray-700">
                        {order.cancellationReason}
                      </span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <p
                    className={`text-lg font-bold ${
                      sectionType === "Completed"
                        ? "text-green-600"
                        : sectionType === "Cancelled" ||
                          order.status === "Return Rejected"
                        ? "text-red-600"
                        : sectionType === "Returns/Refunds"
                        ? "text-orange-600"
                        : "text-indigo-600"
                    }`}
                  >
                    Total: {currency}
                    {order.amount}
                  </p>

                  {isPaymentPending && (
                    <a
                      href={order.stripeSessionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-600 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-blue-700 transition-colors flex items-center"
                      onClick={() =>
                        toast.info("Redirecting to Stripe for payment...")
                      }
                    >
                      <FaCreditCard className="mr-1" /> Pay Now
                    </a>
                  )}

                  {order.status === "Order Placed" && !isPaymentPending && (
                    <button
                      onClick={() => handleOpenCancelModal(order._id)}
                      className="bg-red-500 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-red-600 transition-colors flex items-center"
                    >
                      <FaTimesCircle className="mr-1" /> Cancel
                    </button>
                  )}

                  {order.status === "Delivered" &&
                    !returnRefundOrders.some((r) => r._id === order._id) && (
                      <button
                        onClick={() => handleOpenReturnModal(order._id)}
                        className="bg-orange-500 text-white px-3 py-2 text-sm font-medium rounded-md hover:bg-orange-600 transition-colors flex items-center"
                      >
                        <FaUndoAlt className="mr-1" /> Exchange/Refund
                      </button>
                    )}

                  <button
                    onClick={() => handleOpenModal(order)}
                    className="bg-gray-200 text-gray-700 px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors flex items-center"
                  >
                    <FaEye className="mr-1" /> Details
                  </button>
                </div>
              </div>

              <div className="mt-3 space-y-3">
                {order.items.map((item, i) => (
                  <div
                    key={i}
                    className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t pt-3"
                  >
                    <div className="flex items-start gap-4">
                      <img
                        className="w-14 h-14 object-cover rounded-sm"
                        src={
                          item.image && item.image[0]
                            ? `${backendUrl}/images/${item.image[0]}`
                            : ""
                        }
                        alt={item.name || "Item"}
                      />

                      <div className="text-sm">
                        <p className="font-medium text-gray-800">
                          {item.name || "Product Name Not Available"}
                        </p>
                        <p className="text-gray-500">
                          Qty: {item.quantity} × {currency}
                          {item.price}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div
                        className={`px-3 py-1 text-xs font-semibold rounded-full ${
                          order.status === "Delivered"
                            ? "bg-green-100 text-green-700"
                            : order.status === "Cancelled"
                            ? "bg-red-100 text-red-700"
                            : order.status.includes("Return") ||
                              order.status.includes("Refund")
                            ? "bg-orange-100 text-orange-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {order.status}
                      </div>

                      {order.status === "Delivered" && (
                        <button
                          onClick={() => handleOpenModal(order, item)}
                          className="bg-pink-500 text-white px-3 py-1 text-sm font-medium rounded-md hover:bg-pink-600 transition-colors flex items-center"
                        >
                          <FaStar className="mr-1 text-xs" /> Rate
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const tabs = [
    {
      key: "Active",
      label: "Active",
      count: activeOrders.length,
      icon: FaTruck,
      color: "text-indigo-600",
    },
    {
      key: "Completed",
      label: "Completed",
      count: completedOrders.length,
      icon: FaCheckCircle,
      color: "text-green-600",
    },
    {
      key: "Returns/Refunds",
      label: "Exchange/Refunds",
      count: returnRefundOrders.length,
      icon: FaUndoAlt,
      color: "text-orange-600",
    },
    {
      key: "Cancelled",
      label: "Cancelled",
      count: cancelledOrders.length,
      icon: FaTimesCircle,
      color: "text-red-600",
    },
  ];

  const currentTabConfig = tabs.find((t) => t.key === activeTab);
  const Icon = currentTabConfig ? currentTabConfig.icon : "div";

  return (
    <div className="border-t pt-16 min-h-screen max-w-7xl mx-auto px-4">
      <div className="text-2xl">
        <Title text1={"MY"} text2={"ORDERS"} />
      </div>

      <div className="flex border-b border-gray-200 mt-8 mb-4 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center px-4 py-3 font-medium text-sm transition-colors duration-200 whitespace-nowrap
                                ${
                                  isActive
                                    ? `border-b-2 ${tab.color} border-current`
                                    : "text-gray-500 hover:text-gray-700 hover:border-gray-300 border-b-2 border-transparent"
                                }`}
              style={{ borderColor: isActive ? tab.color : "" }}
            >
              <TabIcon className={`mr-2 ${tab.color}`} />
              {tab.label} ({tab.count})
            </button>
          );
        })}
      </div>

      <div className="py-4">
        <h2
          className={`text-xl font-semibold mb-4 flex items-center gap-2 ${currentTabConfig.color}`}
        >
          <Icon className="text-xl" /> {activeTab} Orders
        </h2>
        {renderOrderList(currentOrders, activeTab)}
      </div>

      {isModalOpen && selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          productToRate={productToRate}
          onClose={handleCloseModal}
          onReviewSubmit={handleReviewSubmit}
        />
      )}

      {cancelOrderId && (
        <CancelOrderModal
          orderId={cancelOrderId}
          onClose={handleCloseCancelModal}
          onSubmit={handleCancelOrder}
        />
      )}

      {returnOrderId && (
        <ReturnRefundModal
          orderId={returnOrderId}
          onClose={handleCloseReturnModal}
          onSubmit={handleReturnRefundRequest}
          onSuccess={handleOpenPolicyModal}
        />
      )}

      {isPolicyModalOpen && <OurPolicyModal onClose={handleClosePolicyModal} />}
    </div>
  );
};

export default Orders;
