"use client"

import { useContext, useEffect, useState } from "react"
import { ShopContext } from "../context/ShopContext"
import Title from "../components/Title"
import ProductItem from "../components/ProductItem"
import { Link } from "react-router-dom"

const Wishlist = () => {
  const { products, wishlistItems, clearWishlist, getWishlistCount, currency, isLoading } = useContext(ShopContext)
  const [debugInfo, setDebugInfo] = useState(false)

  // Get wishlist products by filtering all products
  const wishlistProducts = products.filter((product) => {
    const isInWishlist = wishlistItems && wishlistItems[product._id]
    if (debugInfo) {
      console.log(`Product ${product.name} (${product._id}): ${isInWishlist ? "IN" : "NOT IN"} wishlist`)
    }
    return isInWishlist
  })

  useEffect(() => {
    console.log("=== Wishlist Component Debug ===")
    console.log("Products loaded:", products.length)
    console.log("Products sample:", products.slice(0, 2))
    console.log("WishlistItems:", wishlistItems)
    console.log("WishlistItems keys:", Object.keys(wishlistItems || {}))
    console.log("Filtered wishlist products:", wishlistProducts.length)
    console.log("Is loading:", isLoading)
  }, [products, wishlistItems, wishlistProducts.length, isLoading])

  // Show loading state
  if (isLoading) {
    return (
      <div className="border-t pt-14">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading wishlist...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t pt-14">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Title text1={"MY"} text2={"WISHLIST"} />
          {wishlistProducts.length > 0 && (
            <button
              onClick={clearWishlist}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Clear All ({getWishlistCount()})
            </button>
          )}
        </div>
        <p className="text-gray-600">
          {wishlistProducts.length > 0
            ? `You have ${wishlistProducts.length} item${wishlistProducts.length > 1 ? "s" : ""} in your wishlist`
            : "Your wishlist is empty"}
        </p>
      </div>

      {/* Wishlist Content */}
      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 gap-y-6">
          {wishlistProducts.map((item, index) => (
            <ProductItem key={item._id || index} name={item.name} id={item._id} price={item.price} image={item.image} />
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          {/* Empty Wishlist State */}
          <div className="text-gray-400 mb-6">
            <svg className="w-24 h-24 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-medium text-gray-600 mb-2">Your wishlist is empty</h3>
          <p className="text-gray-500 mb-6">Save items you love by clicking the heart icon</p>

          <Link
            to="/collection"
            className="inline-block px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      )}

      {/* Wishlist Summary */}
      {wishlistProducts.length > 0 && (
        <div className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Wishlist Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">{wishlistProducts.length}</p>
              <p className="text-gray-600">Items Saved</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {currency}
                {wishlistProducts.reduce((total, item) => total + item.price, 0)}
              </p>
              <p className="text-gray-600">Total Value</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-800">
                {currency}
                {wishlistProducts.length > 0
                  ? Math.round(
                      wishlistProducts.reduce((total, item) => total + item.price, 0) / wishlistProducts.length,
                    )
                  : 0}
              </p>
              <p className="text-gray-600">Average Price</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {wishlistProducts.length > 0 && (
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Link
            to="/collection"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Continue Shopping
          </Link>
          <button
            onClick={() => {
              wishlistProducts.forEach(item => addToCart(item._id));
            }}
            className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            Add All to Cart
          </button>
        </div>
      )}
    </div>
  )
}

export default Wishlist