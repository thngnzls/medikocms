import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  sku: { type: String, unique: true, required: true }, 
  name: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 }, 
  image: { type: Array, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  sizes: { type: Array },
  bestseller: { type: Boolean },
  date: { type: Number, required: true }
});

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;