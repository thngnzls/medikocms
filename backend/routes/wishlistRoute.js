import express from "express"
const router = express.Router()

// In-memory storage for demo (replace with database in production)
const wishlistData = {}

// Get wishlist
router.post("/get", (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json({ success: false, message: "User ID required" })
  }

  const userWishlist = wishlistData[userId] || {}
  res.json({ success: true, wishlistData: userWishlist })
})

// Add to wishlist
router.post("/add", (req, res) => {
  const { userId, itemId } = req.body

  if (!userId || !itemId) {
    return res.json({ success: false, message: "User ID and Item ID required" })
  }

  if (!wishlistData[userId]) {
    wishlistData[userId] = {}
  }

  wishlistData[userId][itemId] = true

  console.log(`Added item ${itemId} to wishlist for user ${userId}`)
  res.json({ success: true, message: "Item added to wishlist" })
})

// Remove from wishlist
router.post("/remove", (req, res) => {
  const { userId, itemId } = req.body

  if (!userId || !itemId) {
    return res.json({ success: false, message: "User ID and Item ID required" })
  }

  if (wishlistData[userId] && wishlistData[userId][itemId]) {
    delete wishlistData[userId][itemId]
    console.log(`Removed item ${itemId} from wishlist for user ${userId}`)
  }

  res.json({ success: true, message: "Item removed from wishlist" })
})

// Clear wishlist
router.post("/clear", (req, res) => {
  const { userId } = req.body

  if (!userId) {
    return res.json({ success: false, message: "User ID required" })
  }

  wishlistData[userId] = {}
  console.log(`Cleared wishlist for user ${userId}`)
  res.json({ success: true, message: "Wishlist cleared" })
})

export default router
