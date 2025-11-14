"use client"

import React, { useState } from 'react';
import { assets } from '../assets/assets';
import axios from 'axios';
import { backendUrl } from '../App';
import { toast } from 'react-toastify';

// --- Reusable Spinner Component ---
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// --- Initial Form State (SKU Removed) ---
const initialFormState = {
  // sku: '', // SKU REMOVED
  name: '',
  description: '',
  price: '',
  stock: '',
  category: 'Equipment',
  subCategory: 'Diagnostic Tools',
  bestseller: false,
};

const initialImageState = { image1: null, image2: null, image3: null, image4: null };

// --- Main Add Component ---
const Add = ({ token }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [images, setImages] = useState(initialImageState);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageChange = (e, imageName) => {
    const file = e.target.files[0];
    if (file) {
      setImages((prevImages) => ({
        ...prevImages,
        [imageName]: file,
      }));
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!images.image1) {
        toast.warn("Please upload at least the primary image (Image 1).");
        return;
    }
    setIsLoading(true);

    try {
      const data = new FormData();

      Object.keys(formData).forEach(key => {
          const value = typeof formData[key] === 'boolean' ? formData[key].toString() : formData[key];
          data.append(key, value);
      });

      Object.keys(images).forEach(key => {
          if (images[key]) {
              data.append(key, images[key]);
          }
      });

      const response = await axios.post(backendUrl + '/api/product/add', data, {
         headers: { token, 'Content-Type': 'multipart/form-data' }
        });

      if (response.data.success) {
        toast.success(response.data.message || "Product added successfully!");
        setFormData(initialFormState);
        setImages(initialImageState);
        e.target.reset();
      } else {
        toast.error(response.data.message || "Failed to add product.");
      }
    } catch (error) {
      console.error("Add Product Error:", error);
      toast.error(error.response?.data?.message || 'An error occurred while adding the product.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputBaseClass = 'w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors bg-white text-sm text-gray-900';
  const labelClass = "block text-sm font-medium text-gray-700 mb-1"; // Darker text for labels

  return (
    <div className="p-6">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6 lg:p-8">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 border-b pb-4">Add New Product</h2> {/* Black header text */}
        <form onSubmit={onSubmitHandler} className="flex flex-col w-full gap-6">

          <section>
            <label className={`${labelClass} mb-2`}>Upload Images</label>
            <p className="text-xs text-gray-500 mb-3">Upload up to 4 images. Image 1 will be the primary display image.</p>
            <div className="flex flex-wrap gap-4">
              {['image1', 'image2', 'image3', 'image4'].map((name, index) => (
                <div key={name} className="flex flex-col items-center">
                  <label htmlFor={name} className="cursor-pointer group">
                    <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center group-hover:border-green-500 transition-colors overflow-hidden bg-gray-50"> {/* Subtle bg */}
                      <img
                        className="w-full h-full object-cover"
                        src={images[name] ? URL.createObjectURL(images[name]) : assets.upload_area}
                        alt={`Upload ${index + 1}`}
                      />
                    </div>
                    <input
                      onChange={(e) => handleImageChange(e, name)}
                      type="file"
                      id={name}
                      name={name}
                      hidden
                      accept="image/*"
                      required={name === 'image1' && !images.image1}
                    />
                  </label>
                  <span className="text-xs text-gray-500 mt-1">Image {index + 1} {name === 'image1' ? '(Primary)' : ''}</span>
                 </div>
              ))}
            </div>
          </section>

          <hr className="my-2 border-gray-200"/>

          <section className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700">Product Details</h3> {/* Darker section header */}
            <div>
              <label htmlFor="name" className={labelClass}>Product Name</label>
              <input
                id="name"
                onChange={handleInputChange}
                value={formData.name}
                className={inputBaseClass}
                type="text"
                name="name"
                placeholder="e.g., Digital Blood Pressure Monitor"
                required
              />
            </div>
            <div>
              <label htmlFor="description" className={labelClass}>Product Description</label>
              <textarea
                id="description"
                onChange={handleInputChange}
                value={formData.description}
                className={`${inputBaseClass} min-h-[100px]`}
                name="description"
                placeholder="Detailed description of the product..."
                required
              />
            </div>
          </section>

          <hr className="my-2 border-gray-200"/>

          <section className="space-y-4">
             <h3 className="text-lg font-semibold text-gray-700">Categorization</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="category" className={labelClass}>Product Category</label>
                  <select id="category" onChange={handleInputChange} value={formData.category} name="category" className={inputBaseClass} >
                    <option value="Equipment">Medical Equipment</option>
                    <option value="Consumables">Medical Consumables</option>
                    <option value="Peripherals">Health & Wellness Peripherals</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="subCategory" className={labelClass}>Sub-Category</label>
                  <select id="subCategory" onChange={handleInputChange} value={formData.subCategory} name="subCategory" className={inputBaseClass}>
                    <option value="Diagnostic Tools">Diagnostic Tools</option>
                    <option value="Mobility Aids">Mobility Aids</option>
                    <option value="Home Monitoring Devices">Home Monitoring Devices</option>
                    <option value="Personal Protective Equipment">Personal Protective Equipment (PPE)</option>
                    <option value="Wound Care Supplies">Wound Care Supplies</option>
                    <option value="Injection & IV Supplies">Injection & IV Supplies</option>
                    <option value="Respiratory Care">Respiratory Care</option>
                    <option value="Diabetic Care">Diabetic Care</option>
                    <option value="Physical Therapy Tools">Physical Therapy Tools</option>
                  </select>
                </div>
             </div>
          </section>

           <hr className="my-2 border-gray-200"/>

          <section className="space-y-4">
               <h3 className="text-lg font-semibold text-gray-700">Pricing & Inventory</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label htmlFor="price" className={labelClass}>Product Price (PHP)</label>
                      <input
                        id="price"
                        onChange={handleInputChange}
                        value={formData.price}
                        className={inputBaseClass}
                        type="number"
                        name="price"
                        placeholder="e.g., 1500.00"
                        min="0"
                        step="0.01"
                        required
                      />
                   </div>
                   <div>
                      <label htmlFor="stock" className={labelClass}>Stock Quantity</label>
                      <input
                        id="stock"
                        onChange={handleInputChange}
                        value={formData.stock}
                        className={inputBaseClass}
                        type="number"
                        name="stock"
                        placeholder="e.g., 100"
                        min="0"
                        step="1"
                        required
                      />
                   </div>
               </div>
                 <div className="flex gap-3 items-center pt-2">
                   <input
                     onChange={handleInputChange}
                     checked={formData.bestseller}
                     type="checkbox"
                     id="bestseller"
                     name="bestseller"
                     className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 cursor-pointer" // Green checkbox
                   />
                   <label className="cursor-pointer text-sm text-gray-700" htmlFor="bestseller">
                     Mark as bestseller
                   </label>
                 </div>
          </section>

          <div className="flex justify-end mt-4">
              <button
                type="submit"
                className="flex items-center justify-center w-auto px-6 py-3 bg-green-600 text-white rounded-lg font-semibold text-sm transition-colors hover:bg-green-700 disabled:bg-green-300" // Green button
                disabled={isLoading}
              >
                {isLoading ? <Spinner /> : null}
                {isLoading ? 'Adding Product...' : 'Add Product'}
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Add;