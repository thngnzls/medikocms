import React, { useState } from "react";
import {
  FaStar,
  FaShippingFast,
  FaReceipt,
  FaMapMarkerAlt,
} from "react-icons/fa";
import Title from "./Title"; // Assuming this path is correct

// --- CURRENCY FORMATTING ---
const formatCurrency = (amount) => {
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount)) {
    return "₱0.00";
  }
  // Using Philippine currency format as a default
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  }).format(numericAmount);
};

// 1. Component for the Star Rating Input
const ProductRating = ({ initialRating, onRatingChange }) => {
  const [rating, setRating] = useState(initialRating || 0);

  return (
    <div className="flex justify-center my-2 space-x-1">
      {[...Array(5)].map((_, index) => {
        const currentRating = index + 1;
        return (
          <label key={index}>
            <input
              type="radio"
              name="rating"
              value={currentRating}
              onClick={() => {
                setRating(currentRating);
                onRatingChange(currentRating);
              }}
              className="hidden"
            />
            <FaStar
              className="cursor-pointer transition-colors duration-200"
              size={24}
              color={currentRating <= rating ? "#ffc107" : "#e4e5e9"}
            />
          </label>
        );
      })}
    </div>
  );
};

// 2. Component for the Shipment Status Progress Bar (Refactored)
const ShipmentStatus = ({ orderStatus }) => {
  const statuses = [
    { label: "Order Received", key: "Order Placed" },
    { label: "Order Ready for Shipment", key: "Order Ready" },
    { label: "Order In Transit", key: "In Transit" },
    { label: "Out for Delivery", key: "Out for Delivery" },
    { label: "Order Delivered", key: "Delivered" },
  ];

  // Logic to determine the active step index
  const statusKeys = statuses.map((s) => s.key);
  let activeIndex = statusKeys.indexOf(orderStatus);

  // Handle status mapping
  if (activeIndex === -1 && orderStatus === "Processing") activeIndex = -1; // Before the first step
  if (activeIndex === -1 && orderStatus === "Shipped")
    activeIndex = statusKeys.indexOf("In Transit");

  // Handle non-trackable statuses
  const nonTrackableStatuses = [
    "Cancelled",
    "Return/Refund Requested",
    "Return Approved",
    "Return Rejected",
    "Payment Failed and Order Cancelled",
  ];
  if (nonTrackableStatuses.includes(orderStatus)) {
    return (
      <div className="mt-4 p-4 border rounded-lg bg-red-50 shadow-sm">
        <h3 className="text-lg font-semibold flex items-center mb-3 text-gray-800">
          <FaShippingFast className="mr-2 text-red-600" /> Order Status:{" "}
          <span className="ml-2 font-bold text-red-600">{orderStatus}</span>
        </h3>
        <p className="text-sm text-gray-600">
          This order is no longer in the standard shipment process.
        </p>
      </div>
    );
  }

  // Calculate progress for the progress line (0% for index -1, 100% for last index)
  const totalSegments = statuses.length - 1;
  const progressPercent =
    activeIndex < 0 ? 0 : (activeIndex / totalSegments) * 100;

  return (
    <div className="mt-4 p-4 border rounded-lg bg-white shadow-md">
      <h3 className="text-lg font-semibold flex items-center mb-10 text-gray-800">
        <FaShippingFast className="mr-2 text-indigo-600" /> Current Status:{" "}
        <span className="ml-2 font-bold text-indigo-600">{orderStatus}</span>
      </h3>

      {/* Progress Bar Container */}
      <div className="relative pt-4">
        {/* Gray Track (Base Line) */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200"></div>

        {/* Colored Progress Line (Dynamic Width) */}
        <div
          className="absolute top-5 left-0 h-1 bg-indigo-600 rounded transition-all duration-700 ease-in-out"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Steps/Dots and Labels */}
        <div className="flex justify-between relative">
          {statuses.map((status, index) => {
            const isCompleted = index <= activeIndex;
            const isActive = index === activeIndex;

            return (
              // Use a container for alignment
              <div
                key={status.key}
                className="flex flex-col items-center w-[20%]"
              >
                {/* Dot (z-10 to appear over the line) */}
                <div
                  className={`w-5 h-5 rounded-full border-4 transition-all duration-300 z-10 mb-2 ${
                    isCompleted
                      ? "bg-white border-indigo-600" // Completed: white inner, indigo border
                      : "bg-white border-gray-300" // Pending: white inner, gray border
                  } ${
                    isActive ? "ring-4 ring-indigo-200 border-indigo-600" : ""
                  }`}
                ></div>

                {/* Label */}
                <div className="mt-2 text-xs text-center leading-snug w-full">
                  <span
                    className={
                      isCompleted
                        ? "text-gray-800 font-semibold"
                        : "text-gray-500"
                    }
                  >
                    {status.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const TrackingMapPlaceholder = ({ orderStatus }) => {
  // Show map only for active/in-transit orders
  const isTrackable = ![
    "Delivered",
    "Cancelled",
    "Return/Refund Requested",
    "Return Approved",
    "Return Rejected",
    "Payment Failed and Order Cancelled",
  ].includes(orderStatus);

  if (!isTrackable) {
    return (
      <div className="mt-6 p-4 border rounded-lg bg-gray-100 text-center text-gray-500">
        <FaMapMarkerAlt className="mx-auto text-2xl mb-2" />
        <p>Tracking map is not available for this order status.</p>
      </div>
    );
  }

  const staticMapUrl =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ_UGi6KYGPpUcx6Q7aDTx9BHKIoML5IK8ZfQ&s";

  const pinPosition =
    {
      "Order Placed": "bottom-12 left-1/4",
      "Order Ready": "bottom-1/2 left-1/3",
      "In Transit": "bottom-2/3 left-1/2",
      "Out for Delivery": "bottom-2/4 right-1/4",
    }[orderStatus] || "bottom-1/4 left-1/2"; // Default position

  return (
    <div className="mt-6 p-4 border rounded-lg bg-white shadow-inner">
      <h3 className="text-lg font-semibold flex items-center mb-3 border-b pb-2 text-gray-800">
        <FaMapMarkerAlt className="mr-2 text-red-500" /> Live Tracking
        (Simulated)
      </h3>
      <div className="relative h-64 w-full rounded-md overflow-hidden border border-gray-200">
        {/* ⭐️ Map-like Image ⭐️ */}
        <img
          src={staticMapUrl}
          alt="Simulated Live Tracking Map"
          className="w-full h-full object-cover filter brightness-110"
        />

        {/* ⭐️ Pin-like Marker (Uses Tailwind absolute positioning) ⭐️ */}
        <div
          className={`absolute ${pinPosition} transform -translate-x-1/2 -translate-y-1/2 z-10`}
        >
          <FaMapMarkerAlt
            className="text-red-600 text-4xl animate-bounce"
            style={{ filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.4))" }}
          />
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full text-xs font-bold text-white bg-red-600 px-2 py-1 rounded-full whitespace-nowrap">
            {orderStatus}
          </div>
        </div>

        {/* Destination Home Icon */}
        <FaMapMarkerAlt
          className="absolute top-8 right-12 text-green-600 text-4xl"
          title="Destination"
          style={{ filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.4))" }}
        />

        <div className="absolute inset-0 bg-black bg-opacity-10 pointer-events-none"></div>
      </div>
    </div>
  );
};

// --- MAIN MODAL COMPONENT ---
const OrderDetailsModal = ({
  order,
  productToRate,
  onClose,
  onReviewSubmit,
}) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  React.useEffect(() => {
    // Reset state only when switching to a product-to-rate view
    if (productToRate) {
      setRating(0);
      setReviewText("");
      setMessage("");
      setIsSubmitting(false);
    }
  }, [productToRate]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (productToRate) {
      if (rating === 0) {
        setMessage("Please select a rating before submitting.");
        return;
      }
    }

    setIsSubmitting(true);
    setMessage(productToRate ? "Submitting your review..." : "Processing...");

    // Simulate API call delay
    setTimeout(() => {
      if (productToRate) {
        onReviewSubmit({
          orderId: order._id,
          productId: productToRate._id,
          rating,
          reviewText,
        });
      }
      setIsSubmitting(false);
      setMessage(
        productToRate ? "Review submitted successfully! (Simulated)" : "Closed."
      );
      setTimeout(onClose, 1500);
    }, 1500);
  };

  if (!order) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-2xl"
        >
          ×
        </button>

        <div className="mb-4">
          <Title
            text1={`ORDER`}
            text2={`#${order._id ? order._id.substring(0, 8) : "DETAILS"}`}
          />
        </div>

        {/* Shipment Status Progress Bar (Updated) */}
        <ShipmentStatus orderStatus={order.status} />

        {/* Tracking Map (Simple Static Placeholder) */}
        <TrackingMapPlaceholder orderStatus={order.status} />

        {/* Order Receipt */}
        <div className="mt-6 p-4 border rounded-lg">
          <h3 className="text-lg font-semibold flex items-center mb-3 border-b pb-2 text-gray-800">
            <FaReceipt className="mr-2 text-green-600" /> Order Items & Summary
          </h3>

          <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
            {order.items &&
              order.items.map((item, index) => (
                <div
                  key={index}
                  className="flex justify-between text-sm text-gray-600"
                >
                  <span className="font-medium">{item.name}</span>
                  <span className="text-right">
                    Qty: {item.quantity} × {formatCurrency(item.price)}
                  </span>
                </div>
              ))}
          </div>

          <div className="border-t pt-2 text-gray-800">
            <div className="flex justify-between font-medium">
              <span>Payment Option:</span>
              <span className="font-semibold">
                {order.paymentMethod
                  ? order.paymentMethod.toUpperCase()
                  : "N/A"}
              </span>
            </div>
            <div className="flex justify-between font-medium">
              <span>Order Date:</span>
              <span className="font-semibold">
                {new Date(order.date).toDateString()}
              </span>
            </div>
            <div className="flex justify-between font-bold text-xl mt-1 text-green-700">
              <span>Total:</span>
              <span>{formatCurrency(order.amount)}</span>
            </div>
          </div>
        </div>

        {/* Product Rating/Review Form */}
        {productToRate && (
          <div className="mt-6 p-4 border rounded-lg bg-yellow-50">
            <h3 className="text-lg font-bold mb-3 text-gray-800">
              <FaStar className="inline mr-2 text-pink-500" /> Rate Product:{" "}
              {productToRate.name}
            </h3>

            <ProductRating initialRating={rating} onRatingChange={setRating} />

            <form onSubmit={handleSubmit} className="mt-4">
              <textarea
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Write your review here (optional)..."
                className="w-full h-16 p-2 border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-yellow-300 transition duration-200"
              />
              <div className="text-center mt-4">
                {message && (
                  <p
                    className={`text-sm my-2 ${
                      message.includes("success")
                        ? "text-green-600"
                        : message.includes("Please select")
                        ? "text-red-600"
                        : "text-gray-600"
                    }`}
                  >
                    {message}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || (productToRate && rating === 0)}
                  className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:bg-gray-400 transition-colors"
                >
                  {isSubmitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetailsModal;
