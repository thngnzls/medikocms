import { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const MAX_CART_QUANTITY = 15;

const HeartIcon = ({ filled = false, className = "" }) => (
  <svg
    className={className}
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

const CartIcon = ({ className = "w-4 h-4" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    ></path>
  </svg>
);

const ProductItem = ({ id, image, name, price, stock, addToCart }) => {
  const {
    currency,
    addToWishlist,
    removeFromWishlist,
    wishlistItems,
    cartItems,
  } = useContext(ShopContext);
  const [isHovered, setIsHovered] = useState(false);

  const isOutOfStock = stock <= 0;
  // NOTE: Assuming cartItems is {productId: quantity} or {productId: {size: quantity, ...}}
  // The current implementation assumes {productId: quantity} which is common for simple stores.
  const currentCartQuantity = cartItems?.[id] || 0;
  const isInWishlist = wishlistItems?.[id];

  const isButtonDisabled =
    isOutOfStock ||
    currentCartQuantity >= MAX_CART_QUANTITY ||
    currentCartQuantity >= stock;
  let buttonText = "Add to Cart";
  let buttonClasses = "bg-green-800 hover:bg-green-900 text-white";

  // Logic for button text and styling based on stock and limits
  if (isOutOfStock) {
    buttonText = "Out of Stock";
    buttonClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";
  } else if (currentCartQuantity >= MAX_CART_QUANTITY) {
    buttonText = `Max Limit`;
    buttonClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";
  } else if (currentCartQuantity >= stock) {
    buttonText = `Max Stock (${stock})`;
    buttonClasses = "bg-gray-300 text-gray-500 cursor-not-allowed";
  }

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!addToWishlist || !removeFromWishlist) return;

    if (isInWishlist) {
      removeFromWishlist(id);
      toast.info(`"${name}" removed from wishlist.`);
    } else {
      addToWishlist(id);
      toast.success(`"${name}" added to wishlist!`);
    }
  };

  const handleAddToCartClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!addToCart) return;

    if (isOutOfStock) {
      toast.error(`"${name}" is currently out of stock.`);
      return;
    }
    if (currentCartQuantity >= MAX_CART_QUANTITY) {
      toast.warn(`Maximum limit (${MAX_CART_QUANTITY}) reached for "${name}".`);
      return;
    }
    if (currentCartQuantity >= stock) {
      toast.warn(`Only ${stock} units of "${name}" available.`);
      return;
    }

    addToCart(id);
  };

  return (
    <Link
      to={`/product/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="aspect-square overflow-hidden bg-gray-100 relative">
        <img
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          src={
            image && image[0]
              ? image[0]
              : "/placeholder.svg?height=300&width=300"
          }
          alt={name || "Product Image"}
        />

        <button
          onClick={toggleWishlist}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full shadow transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 z-10"
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon
            filled={isInWishlist}
            className={`w-5 h-5 transition-colors ${
              isInWishlist
                ? "text-red-500"
                : "text-gray-400 group-hover:text-red-400"
            }`}
          />
        </button>

        {/* 🚨 ADDED: Out of Stock Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-[5]">
            <span className="text-sm font-semibold text-gray-600 border border-gray-400 px-3 py-1 rounded-full bg-white">
              OUT OF STOCK
            </span>
          </div>
        )}
        {/* 🚨 END ADDED */}
      </div>

      <div className="flex flex-1 flex-col p-4 space-y-2">
        <h3
          className="text-sm font-medium text-gray-800 flex-1 min-h-[40px] line-clamp-2"
          title={name}
        >
          {name || "Product Name Unavailable"}
        </h3>

        <p className="text-base font-semibold text-gray-900">
          {currency}
          {price?.toFixed(2) || "0.00"}
        </p>

        <button
          onClick={handleAddToCartClick}
          // 🚨 MODIFIED: Use the calculated disabled state
          disabled={isButtonDisabled}
          className={`mt-auto flex w-full items-center justify-center gap-2 rounded-md border border-transparent px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-800 ${buttonClasses}`}
          aria-label={buttonText}
        >
          {!isOutOfStock && <CartIcon />}
          {buttonText}
        </button>
      </div>
    </Link>
  );
};

export default ProductItem;
