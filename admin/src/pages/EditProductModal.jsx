import React, { useState, useEffect } from "react"
import axios from "axios"
import { backendUrl } from "../App"
import { toast } from "react-toastify"
import { assets } from "../assets/assets"

// --- Reusable Spinner Component ---
const Spinner = ({ small = false }) => (
  <svg
    className={`animate-spin ${small ? 'h-4 w-4' : 'h-5 w-5'} text-white`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
)

// --- Reusable Input Styling ---
const inputBaseClass =
  "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white"

const EditProductModal = ({ product, token, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    stock: "", // --- ADDED STOCK ---
    category: "Flower",
    subCategory: "Indoor",
    bestseller: false,
  })

  // --- NEW: Combined image state ---
  const [editImages, setEditImages] = useState({
    image1: null,
    image2: null,
    image3: null,
    image4: null,
  })

  // When the 'product' prop changes, update the form data
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        stock: product.stock || 0, // --- ADDED STOCK ---
        category: product.category || "Flower",
        subCategory: product.subCategory || "Indoor",
        bestseller: product.bestseller || false,
      })
      // Reset image previews
      setEditImages({ image1: null, image2: null, image3: null, image4: null })
    }
  }, [product])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleImageChange = (e, imageName) => {
    setEditImages((prev) => ({
      ...prev,
      [imageName]: e.target.files[0],
    }))
  }

  const updateProduct = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const updateFormData = new FormData()

      updateFormData.append("id", product._id)
      updateFormData.append("name", formData.name)
      updateFormData.append("description", formData.description)
      updateFormData.append("price", Number(formData.price))
      updateFormData.append("stock", Number(formData.stock)) // --- ADDED STOCK ---
      updateFormData.append("category", formData.category)
      updateFormData.append("subCategory", formData.subCategory)
      updateFormData.append("bestseller", formData.bestseller.toString())

      // Append new images if they were selected
      if (editImages.image1) updateFormData.append("image1", editImages.image1)
      if (editImages.image2) updateFormData.append("image2", editImages.image2)
      if (editImages.image3) updateFormData.append("image3", editImages.image3)
      if (editImages.image4) updateFormData.append("image4", editImages.image4)

      const response = await axios.post(backendUrl + "/api/product/update", updateFormData, {
        headers: {
          token,
          "Content-Type": "multipart/form-data",
        },
      })

      if (response.data.success) {
        toast.success(response.data.message)
        onUpdate() // --- Call the onUpdate prop (which refetches the list) ---
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Edit Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4 text-sm">
          <p><strong>Note:</strong> You only need to upload new images if you want to change them.</p>
        </div>

        <form onSubmit={updateProduct} className="flex flex-col gap-4">
          <div>
            <p className="mb-2 font-medium text-gray-700">Upload Image (Optional)</p>
            <div className="flex gap-2">
              {["image1", "image2", "image3", "image4"].map((name, idx) => (
                <label key={name} htmlFor={`edit-${name}`} className="cursor-pointer">
                  <img
                    className="w-24 h-24 object-cover border-2 border-dashed border-gray-300 rounded-md p-1 hover:border-blue-500"
                    src={
                      editImages[name]
                        ? URL.createObjectURL(editImages[name])
                        : product.image?.[idx] || assets.upload_area
                    }
                    alt={`Upload ${idx + 1}`}
                  />
                  <input
                    onChange={(e) => handleImageChange(e, name)}
                    type="file"
                    id={`edit-${name}`}
                    hidden
                  />
                </label>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">Product Name</p>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={inputBaseClass}
              required
            />
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">Product Description</p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={`${inputBaseClass} min-h-[100px]`}
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="mb-2 font-medium text-gray-700">Category</p>
              <select name="category" value={formData.category} onChange={handleInputChange} className={inputBaseClass}>
                <option value="Flowers">Flowers and Ornaments</option>
                <option value="House">Indoor / Houseplant</option>
                <option value="Fruit">Fruits</option>
                <option value="Vegetable">Vegetable</option>
                <option value="Herbs">Herbs</option>
              </select>
            </div>

            <div>
              <p className="mb-2 font-medium text-gray-700">Sub Category</p>
              <select name="subCategory" value={formData.subCategory} onChange={handleInputChange} className={inputBaseClass}>
                <option value="Rainy">Rainy / Wet Environment</option>
                <option value="Dry">Dry Environment</option>
                <option value="Outdoor">Outdoor</option>
                <option value="Indoor">Indoor</option>
              </select>
            </div>

            <div>
              <p className="mb-2 font-medium text-gray-700">Price</p>
              <input type="number" name="price" value={formData.price} onChange={handleInputChange} className={inputBaseClass} min="0" required />
            </div>

            {/* --- NEW: Stock Input --- */}
            <div>
              <p className="mb-2 font-medium text-gray-700">Stock</p>
              <input type="number" name="stock" value={formData.stock} onChange={handleInputChange} className={inputBaseClass} min="0" required />
            </div>
          </div>

          <div className="flex gap-3 items-center">
            <input
              type="checkbox"
              id="bestseller-edit"
              name="bestseller"
              checked={formData.bestseller}
              onChange={handleInputChange}
              className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer"
            />
            <label className="cursor-pointer font-medium text-gray-700" htmlFor="bestseller-edit">
              Mark as bestseller
            </label>
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-white rounded-lg font-semibold hover:bg-green-800 transition-colors flex items-center gap-2 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Spinner small={true} />
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProductModal