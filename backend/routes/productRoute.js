// productRoute.js (Minimal Change Option)

import express from "express"
import {
  listProducts,
  addProduct,
  removeProduct,
  singleProduct,
  updateProduct,
} from "../controllers/productController.js"
import upload from "../middleware/multer.js"
import adminAuth from "../middleware/adminAuth.js"
import Product from "../models/productModel.js" 

const productRouter = express.Router()

// ------------------------------------------------------------------
// Route to update only product status (existing route, kept as is)
// ------------------------------------------------------------------
productRouter.post(
  "/update-status",
  adminAuth,
  async (req, res) => {
    try {
      const { id, status } = req.body
      if (!id || !status) {
        return res.status(400).json({ success: false, message: "Missing id or status" })
      }
      const product = await Product.findByIdAndUpdate(id, { status }, { new: true })
      if (!product) {
        return res.status(404).json({ success: false, message: "Product not found" })
      }
      res.json({ success: true, product })
    } catch (err) {
      res.status(500).json({ success: false, message: err.message })
    }
  }
)

// Route to add a new product (kept as is)
productRouter.post(
  "/add",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct,
)

// Route to update an existing product (kept as is)
productRouter.post(
  "/update",
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct,
)

// Route to remove a product (kept as is)
productRouter.post("/remove", adminAuth, removeProduct)

// Route to get a single product (kept as is)
productRouter.post("/single", singleProduct)

// Route to list all products (kept as is)
productRouter.get("/list", listProducts)

productRouter.post("/update-stock", adminAuth, async (req, res) => {
  const { productId, stock } = req.body;

  // 1. Input Validation
  if (!productId || stock === undefined || isNaN(Number(stock))) {
    return res.status(400).json({ success: false, message: "Missing or invalid productId or stock value." });
  }

  try {
    // Update stock: ensures stock is treated as a number
    const updatedProduct = await Product.findByIdAndUpdate(
      productId, 
      { stock: Number(stock) }, 
      { new: true }
    );

    if (!updatedProduct) {
        return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.json({ success: true, message: 'Stock updated successfully!', product: updatedProduct });
  } catch (error) {
    console.error("Error updating stock:", error);
    res.status(500).json({ success: false, message: 'Error updating stock: ' + error.message });
  }
});

export default productRouter