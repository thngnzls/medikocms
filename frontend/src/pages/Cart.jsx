"use client";

import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";
import { Link, useNavigate } from "react-router-dom";

const MAX_CART_QUANTITY = 10;

// Icon Components (kept as is)
const PlusIcon = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);
const MinusIcon = ({ className = "w-4 h-4" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
  </svg>
);
const TrashIcon = ({ className = "w-5 h-5" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.275.042-.549.09-.816.14m5.192 0c3.043 0 6-1.03 6-3.21v-1.04c0-.289-.009-.577-.026-.86H8.02c-.017.283-.026.57-.026.86v1.04c0 2.18 2.957 3.21 6 3.21Z"
    />
  </svg>
);
const ShoppingBagIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-16 h-16 text-gray-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
    />
  </svg>
);

const Cart = () => {
  const navigate = useNavigate();
  // Destructuring with default values is a good defensive practice
  const {
    products = [],
    currency,
    cartItems = {},
    updateQuantity,
    getTotalCartAmount,
  } = useContext(ShopContext);

  const [cartData, setCartData] = useState([]);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  // State to track if cart data has been processed at least once
  const [isCartDataReady, setIsCartDataReady] = useState(false);

  useEffect(() => {
    // Only run if products are loaded AND we have cart items structure
    if (products.length > 0 && cartItems) {
      const tempData = [];
      for (const productId in cartItems) {
        // Defensive check for productData (in case item is old/deleted)
        const productData = products.find((p) => p._id === productId);
        if (productData) {
          for (const size in cartItems[productId]) {
            if (cartItems[productId][size] > 0) {
              tempData.push({
                _id: productId,
                size: size,
                quantity: cartItems[productId][size],
                name: productData.name,
                price: productData.price,
                // Safely access image. Handle undefined/null array or index
                image: productData.image?.[0] || assets.placeholder_icon,
                stock: productData.stock ?? Infinity,
              });
            }
          }
        }
      }

      setCartData(tempData);
      setIsCartDataReady(true); // Data processing complete
    } else if (products.length > 0 && Object.keys(cartItems).length === 0) {
      // Case: Products are loaded, but cart is empty
      setCartData([]);
      setIsCartDataReady(true);
    } else {
      // Case: Waiting for products to load or cartItems to populate
      setCartData([]);
      setIsCartDataReady(false);
    }
  }, [cartItems, products]);

  const handleQuantityChange = async (productId, size, newQuantity) => {
    const item = cartData.find((i) => i._id === productId && i.size === size);
    if (!item) return;

    newQuantity = Math.max(
      0,
      Math.min(newQuantity, MAX_CART_QUANTITY, item.stock)
    );

    if (newQuantity > item.stock && item.stock !== Infinity) {
      toast.warn(
        `Only ${item.stock} units of "${item.name}" (${item.size}) are available.`
      );
      newQuantity = item.stock;
    } else if (
      newQuantity === MAX_CART_QUANTITY &&
      item.quantity < MAX_CART_QUANTITY
    ) {
      toast.warn(
        `Max quantity (${MAX_CART_QUANTITY}) reached for "${item.name}" (${item.size}).`
      );
    }

    if (item.quantity === newQuantity && newQuantity !== 0) return;

    setUpdatingItemId(`${productId}-${size}`);
    try {
      await updateQuantity(productId, size, newQuantity);
    } catch (error) {
      console.error("Quantity update error:", error);
      toast.error("Failed to update quantity.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Defensive call for total amount
  const totalAmount = getTotalCartAmount ? getTotalCartAmount() : 0;
  const isLoading = updatingItemId !== null;

  // --- Loading/Blank Screen Check ---
  if (!isCartDataReady) {
    // Render a loading state instead of a blank screen while data is loading
    return (
      <div className="bg-gray-50 min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading cart...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-16">
        <div className="mb-10 text-left">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
            Shopping Cart
          </h1>
          {cartData.length > 0 && (
            <p className="mt-2 text-gray-500">
              You have {cartData.length} item(s) in your cart.
            </p>
          )}
        </div>

        {cartData.length === 0 ? (
          <div className="flex flex-col items-center text-center py-16 bg-white rounded-lg shadow border border-gray-200">
            <ShoppingBagIcon />
            <h2 className="mt-6 text-xl font-semibold text-gray-700">
              Your cart is empty
            </h2>
            <p className="mt-2 text-gray-500">
              Looks like you haven't added anything yet.
            </p>
            <Link
              to="/Collection"
              className="mt-6 inline-block bg-green-600 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
            <div className="lg:col-span-8 space-y-4">
              <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-4 pb-3 border-b border-gray-300 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <span>Product</span>
                <span className="text-right w-20">Price</span>
                <span className="text-center w-28">Quantity</span>
                <span className="text-right w-24">Subtotal</span>
                <span className="text-center w-12">Remove</span>
              </div>

              {cartData.map((item) => {
                const isItemLoading =
                  updatingItemId === `${item._id}-${item.size}`;
                return (
                  <div
                    key={`${item._id}-${item.size}`}
                    className={`relative bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-[auto_1fr_auto] md:grid-cols-[80px_1fr_auto_auto_auto_auto] gap-4 items-center transition-opacity duration-300 ${
                      isItemLoading
                        ? "opacity-50 pointer-events-none"
                        : "opacity-100"
                    }`}
                  >
                    <img
                      className="w-16 h-16 md:w-20 md:h-20 object-cover rounded-md border border-gray-200"
                      src={item.image} // item.image is already safe here due to the useEffect logic
                      alt={item.name}
                    />
                    <div className="md:col-span-1 flex flex-col justify-center">
                      <Link
                        to={`/product/${item._id}`}
                        className="text-sm sm:text-base font-medium text-gray-800 line-clamp-2 hover:text-green-700 transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-1">
                        Size:{" "}
                        <span className="font-medium text-gray-700">
                          {item.size}
                        </span>
                      </p>
                      <p className="md:hidden text-sm font-semibold mt-1">
                        {currency}
                        {item.price?.toFixed(2)}
                      </p>
                    </div>
                    <p className="hidden md:block text-sm font-semibold text-gray-700 text-right w-20">
                      {currency}
                      {item.price?.toFixed(2)}
                    </p>

                    <div className="flex items-center justify-center border border-gray-300 rounded-md overflow-hidden h-9 w-28 mx-auto md:mx-0">
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item._id,
                            item.size,
                            item.quantity - 1
                          )
                        }
                        disabled={isLoading || item.quantity <= 1}
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none"
                        aria-label="Decrease quantity"
                      >
                        <MinusIcon />
                      </button>
                      <span className="w-10 text-center text-sm font-medium border-l border-r border-gray-300 h-full flex items-center justify-center select-none">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          handleQuantityChange(
                            item._id,
                            item.size,
                            item.quantity + 1
                          )
                        }
                        disabled={
                          isLoading ||
                          item.quantity >= MAX_CART_QUANTITY ||
                          item.quantity >= item.stock
                        }
                        className="px-3 py-1 text-gray-600 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors focus:outline-none"
                        aria-label="Increase quantity"
                      >
                        <PlusIcon />
                      </button>
                    </div>

                    <p className="hidden md:block text-sm font-semibold text-gray-800 text-right w-24">
                      {currency}
                      {(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex justify-center md:justify-center w-12">
                      <button
                        onClick={() =>
                          handleQuantityChange(item._id, item.size, 0)
                        }
                        disabled={isLoading}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
                        aria-label={`Remove ${item.name} size ${item.size} from cart`}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lg:col-span-4">
              <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 sticky top-24">
                <h2 className="text-xl font-semibold text-gray-800 mb-5 pb-3 border-b border-gray-200">
                  Order Summary
                </h2>
                <CartTotal />
                <button
                  onClick={() => navigate("/place-order")}
                  disabled={totalAmount === 0 || isLoading}
                  className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white text-base font-semibold py-3.5 rounded-lg transition-all duration-300 hover:from-green-700 hover:to-emerald-800 hover:shadow-lg disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                >
                  Proceed to Checkout
                </button>
                <Link
                  to="/Collection"
                  className="block text-center mt-4 text-sm text-green-700 hover:text-green-800 font-medium transition-colors"
                >
                  or Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
