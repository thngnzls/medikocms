// productController.js

import { v2 as cloudinary } from "cloudinary"
import productModel from "../models/productModel.js"

// Helper function (Kept as is)
const generateSKU = (category) => {
    const prefix = category.substring(0, 3).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(100 + Math.random() * 900)
    return `${prefix}-${timestamp}-${random}`
}

// Add product (Kept as is)
const addProduct = async (req, res) => {
    try {
        const { name, description, price, category, subCategory, bestseller, stock } = req.body

        const image1 = req.files?.image1?.[0]
        const image2 = req.files?.image2?.[0]
        const image3 = req.files?.image3?.[0]
        const image4 = req.files?.image4?.[0]

        const images = [image1, image2, image3, image4].filter(Boolean)

        const imagesUrl = await Promise.all(
            images.map(async (item) => {
                const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" })
                return result.secure_url
            })
        )

        const productData = {
            sku: generateSKU(category),
            name,
            description,
            category,
            price: Number(price),
            subCategory,
            bestseller: bestseller === "true",
            stock: Number(stock) || 0,
            image: imagesUrl,
            date: Date.now(),
        }

        const product = new productModel(productData)
        await product.save()

        res.status(201).json({ success: true, message: "Product Added", product })
    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ success: false, message: error.message })
    }
}

// Update product (Kept as is)
const updateProduct = async (req, res) => {
    try {
        
        const { id, name, description, price, category, subCategory, bestseller, stock, sizes, status } = req.body

        if (!id) {
            return res.status(400).json({ success: false, message: "Product ID is required for update." });
        }

        const product = await productModel.findById(id)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }

        product.name = name || product.name
        product.description = description || product.description
        product.price = price ? Number(price) : product.price
        product.category = category || product.category
        product.subCategory = subCategory || product.subCategory

        if (bestseller !== undefined) {
            product.bestseller = bestseller === "true"
        }
        
        if (stock !== undefined) product.stock = Number(stock)
        if (status !== undefined) product.status = status

        if (sizes !== undefined) {
            try {
                product.sizes = typeof sizes === 'string' ? JSON.parse(sizes) : sizes;
            } catch (e) {
                console.error("Error parsing product sizes:", e);
            }
        }

        if (req.files && Object.keys(req.files).length > 0) {
            const image1 = req.files?.image1?.[0]
            const image2 = req.files?.image2?.[0]
            const image3 = req.files?.image3?.[0]
            const image4 = req.files?.image4?.[0]

            const images = [image1, image2, image3, image4].filter(Boolean)

            if (images.length > 0) {
                const imagesUrl = await Promise.all(
                    images.map(async (item) => {
                        const result = await cloudinary.uploader.upload(item.path, { resource_type: "image" })
                        return result.secure_url
                    })
                )
                product.image = imagesUrl
            }
        }

        await product.save()
        res.json({ success: true, message: "Product Updated", product })
    } catch (error) {
        console.error("Update Product Error:", error);
        res.status(500).json({ success: false, message: error.message })
    }
}

// List products (Ensured correct return format for Inventory.jsx)
const listProducts = async (req, res) => {
    try {
        const products = await productModel.find({})
        // Frontend expects { success: true, products: [...] }
        res.json({ success: true, products }) 
    } catch (error) {
        console.error("Error fetching product list:", error);
        res.status(500).json({ success: false, message: error.message })
    }
}

const removeProduct = async (req, res) => {
    try {
        const { id } = req.body
        const product = await productModel.findByIdAndDelete(id)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }
        res.json({ success: true, message: "Product Removed" })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const singleProduct = async (req, res) => {
    try {
        const { productId } = req.body
        const product = await productModel.findById(productId)
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" })
        }
        res.json({ success: true, product })
    } catch (error) {
        res.status(500).json({ success: false, message: error.message })
    }
}

const updateStockAfterOrder = async (orderItems) => {
    const stockDecrements = {};
    for (const item of orderItems) {
        stockDecrements[item._id] = (stockDecrements[item._id] || 0) + item.quantity;
    }

    const updates = [];
    const productIds = Object.keys(stockDecrements);

    for (const productId of productIds) {
        const quantityToSubtract = stockDecrements[productId];

        updates.push({
            updateOne: {
                filter: { 
                    _id: productId, 
                    stock: { $gte: quantityToSubtract } 
                },
                update: { 
                    $inc: { stock: -quantityToSubtract } 
                }
            }
        });
    }

    if (updates.length > 0) {
        const result = await productModel.bulkWrite(updates);

        if (result.modifiedCount !== updates.length) {
            // Throw an error if the conditional check failed for any item (overselling prevention)
            const failedUpdates = updates.length - result.modifiedCount;
            throw new Error(`CRITICAL STOCK ERROR: ${failedUpdates} item(s) failed the stock check. Cannot complete order.`);
        }
    }
    console.log("SUCCESS: Stock atomically updated.");
};


// --------------------------------------------------
// 🔄 ATOMIC STOCK RESTORE (For Cancellations)
// --------------------------------------------------

/**
 * Atomically restores the stock for all products in a cancelled order.
 * @param {Array<Object>} orderItems - The array of items from the cancelled order record.
 */
const restoreStockAfterCancellation = async (orderItems) => {
    const stockIncrements = {};
    for (const item of orderItems) {
        // Aggregate the total quantity to restore
        stockIncrements[item._id] = (stockIncrements[item._id] || 0) + item.quantity;
    }
    
    const updates = [];
    const productIds = Object.keys(stockIncrements);

    for (const productId of productIds) {
        const quantityToAdd = stockIncrements[productId];

        updates.push({
            updateOne: {
                filter: { _id: productId },
                // Update: Atomically INCREMENT the stock
                update: { $inc: { stock: quantityToAdd } }
            }
        });
    }

    if (updates.length > 0) {
        await productModel.bulkWrite(updates);
    }
    console.log("SUCCESS: Stock restored after cancellation.");
};


export { 
    listProducts, 
    addProduct, 
    removeProduct, 
    singleProduct, 
    updateProduct,
    // Export the new atomic stock management functions
    updateStockAfterOrder,
    restoreStockAfterCancellation 
}