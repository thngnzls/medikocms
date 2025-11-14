import userModel from "../models/userModel.js"



// add products to user cart
const addToCart = async (req, res) => {
    try {
        // *** SECURITY FIX: Get userId securely from req.user ***
        const userId = req.user._id; 
        const { itemId, size } = req.body

        // Since req.user is a Mongoose document from the middleware, 
        // we can use it directly, but fetching again is safer to avoid stale data.
        const userData = await userModel.findById(userId)
        if (!userData) {
             return res.json({ success: false, message: "User not found." })
        }

        let cartData = userData.cartData;
        // NULL CHECK: Initialize cartData if it's null/undefined in the database
        if (!cartData) {
            cartData = {};
        }

        if (!cartData[itemId]) {
            cartData[itemId] = {}
        }
        
        // Use the existing quantity or initialize to 0 before adding 1
        cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;

        await userModel.findByIdAndUpdate(userId, { cartData })

        res.json({ success: true, message: "Added To Cart" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error adding to cart: " + error.message })
    }
}

// --------------------------------------------------------------------------------------

// update user cart
const updateCart = async (req, res) => {
    try {
        // *** SECURITY FIX: Get userId securely from req.user ***
        const userId = req.user._id; 
        const { itemId, size, quantity } = req.body

        const userData = await userModel.findById(userId)
        if (!userData) {
             return res.json({ success: false, message: "User not found." })
        }
        
        let cartData = userData.cartData;
        
        if (cartData && cartData[itemId] && cartData[itemId][size] !== undefined) {
             cartData[itemId][size] = quantity
        } else {
             return res.json({ success: false, message: "Item not found in cart for update." })
        }

        await userModel.findByIdAndUpdate(userId, { cartData })
        res.json({ success: true, message: "Cart Updated" })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error updating cart: " + error.message })
    }
}

// --------------------------------------------------------------------------------------

// get user cart data
const getUserCart = async (req, res) => {

    try {
        // *** SECURITY FIX: Get userId securely from req.user ***
        const userId = req.user._id;
        
        const userData = await userModel.findById(userId)
        if (!userData) {
             return res.json({ success: false, message: "User not found." })
        }
        
        let cartData = userData.cartData || {}; // Default to empty object if null

        res.json({ success: true, cartData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: "Error getting cart: " + error.message })
    }
}

export { addToCart, updateCart, getUserCart }