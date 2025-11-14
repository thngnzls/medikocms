"use client"

import axios from "axios"
import { useEffect, useState, useMemo } from "react"
import { backendUrl, currency } from "../App"
import { toast } from "react-toastify"
import EditProductModal from "./EditProductModal"

// --- CONSTANTS (Copied from your code) ---
const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "Equipment", label: "Medical Equipment" },
  { value: "Consumables", label: "Medical Consumables" },
  { value: "Peripherals", label: "Health & Wellness Peripherals" },
]
const SUB_CATEGORIES = [
  { value: "all", label: "All Sub-Categories" },
  { value: "Diagnostic Tools", label: "Diagnostic Tools" },
  { value: "Mobility Aids", label: "Mobility Aids" },
  { value: "Home Monitoring Devices", label: "Home Monitoring Devices" },
  { value: "Personal Protective Equipment", label: "Personal Protective Equipment" },
  { value: "Wound Care Supplies", label: "Wound Care Supplies" },
  { value: "Injection & IV Supplies", label: "Injection & IV Supplies" },
  { value: "Respiratory Care", label: "Respiratory Care" },
  { value: "Diabetic Care", label: "Diabetic Care" },
  { value: "Physical Therapy Tools", label: "Physical Therapy Tools" },
]
const SORT_OPTIONS = [
  { value: "default", label: "Default Sort" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "price-asc", label: "Price (Low-High)" },
  { value: "price-desc", label: "Price (High-Low)" },
]

// --- Reusable Components (Icons, Badges) ---

const ListSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <svg className="animate-spin h-10 w-10 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
)

const FilterGroup = ({ label, children }) => (
  <div className="flex-1 min-w-[180px]">
    <label className="block text-sm font-medium text-gray-600 mb-1">{label}</label>
    {children}
  </div>
)

// --- NEW: Badge for Stock Status ---
const StockBadge = ({ stock }) => {
  let bgColor, textColor, text
  if (stock === 0) {
    bgColor = "bg-red-100"
    textColor = "text-red-700"
    text = "Out of Stock"
  } else if (stock <= 10) {
    bgColor = "bg-yellow-100"
    textColor = "text-yellow-700"
    text = `Low Stock (${stock})`
  } else {
    bgColor = "bg-green-100"
    textColor = "text-green-700"
    text = `In Stock (${stock})`
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {text}
    </span>
  )
}

// --- NEW: Badge for Category ---
const CategoryBadge = ({ category }) => (
  <span className="inline-flex px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
    {category}
  </span>
)

// --- NEW: Icons for Actions ---
const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.275.042-.549.09-.816.14m5.192 0c3.043 0 6-1.03 6-3.21v-1.04c0-.289-.009-.577-.026-.86H8.02c-.017.283-.026.57-.026.86v1.04c0 2.18 2.957 3.21 6 3.21Z" />
  </svg>
)

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

// --- List Component ---
const List = ({ token }) => {
  const [list, setList] = useState([])
  const [editingProduct, setEditingProduct] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isListLoading, setIsListLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [subCategoryFilter, setSubCategoryFilter] = useState("all")
  const [sortCriteria, setSortCriteria] = useState("default")

  const fetchList = async () => {
    setIsListLoading(true)
    try {
      const response = await axios.get(backendUrl + "/api/product/list")
      if (response.data.success) {
        setList(response.data.products.reverse())
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.log(error)
      toast.error(error.message)
    } finally {
      setIsListLoading(false)
    }
  }

  const removeProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product? This action cannot be undone.")) {
      return
    }
    try {
      setIsLoading(true)
      const response = await axios.post(backendUrl + "/api/product/remove", { id }, { headers: { token } })
      if (response.data.success) {
        toast.success(response.data.message)
        await fetchList()
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

  useEffect(() => {
    fetchList()
  }, [])

  const processedList = useMemo(() => {
    let items = [...list]
    if (searchTerm) {
      items = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }
    if (categoryFilter !== "all") {
      items = items.filter((item) => item.category === categoryFilter)
    }
    if (subCategoryFilter !== "all") {
      items = items.filter((item) => item.subCategory === subCategoryFilter)
    }
    switch (sortCriteria) {
      case "name-asc":
        items.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-desc":
        items.sort((a, b) => b.name.localeCompare(a.name)); break
      case "price-asc":
        items.sort((a, b) => a.price - b.price); break
      case "price-desc":
        items.sort((a, b) => b.price - a.price); break
      default:
        break
    }
    return items
  }, [list, searchTerm, categoryFilter, subCategoryFilter, sortCriteria])
  
  // --- NEW: Handler to clear all filters ---
  const handleClearFilters = () => {
    setSearchTerm("")
    setCategoryFilter("all")
    setSubCategoryFilter("all")
    setSortCriteria("default")
  }

  if (isListLoading) {
    return <ListSpinner />
  }

  const baseSelectClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-sm"

  return (
    // --- NEW: Added main page padding ---
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Product Inventory</h3>
      
      {/* --- NEW: Filters Section Card --- */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          
          {/* Search (spans 2 columns on large screens) */}
          <div className="flex-1 min-w-[180px] lg:col-span-2">
            <label className="block text-sm font-medium text-gray-600 mb-1">Search by Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="e.g. Aluminum Crutches"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${baseSelectClass} pl-10`}
              />
            </div>
          </div>

          <FilterGroup label="Category">
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={baseSelectClass}>
              {CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup label="Sub-Category">
            <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className={baseSelectClass}>
              {SUB_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup label="Sort By">
            <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className={baseSelectClass}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </FilterGroup>
        </div>

        {/* --- NEW: Clear Filters Button --- */}
        <div className="flex justify-end mt-4">
          <button
            onClick={handleClearFilters}
            className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="min-w-[900px]"> {/* Increased min-width */}
          
          {/* --- Table Header --- */}
          <div className="grid grid-cols-[auto_1.5fr_3fr_1.5fr_1fr_1.5fr_1fr] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="w-12 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</p> {/* Fixed width */}
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">SKU</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Price</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Stock</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</p>
          </div>

          {/* --- Table Body --- */}
          {processedList.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || categoryFilter !== "all" || subCategoryFilter !== "all"
                ? "No products match your filters."
                : "No products found."}
            </div>
          )}

          {processedList.map((item, index) => (
            <div
              className="grid grid-cols-[auto_1.5fr_3fr_1.5fr_1fr_1.5fr_1fr] items-center gap-4 px-4 py-4 border-b border-gray-100 text-sm hover:bg-gray-50 transition-colors"
              key={index}
            >
              <img className="w-12 h-12 object-cover rounded-md" src={item.image && item.image[0]} alt={item.name} />
              <p className="text-gray-600 font-mono break-words text-xs">{item.sku}</p>
              <p className="font-medium text-gray-900">{item.name}</p>
              
              {/* --- NEW: Category Badge --- */}
              <div>
                <CategoryBadge category={item.category} />
              </div>

              <p className="font-medium text-gray-900">{currency}{item.price.toFixed(2)}</p>

              {/* --- NEW: Stock Badge --- */}
              <div>
                <StockBadge stock={item.stock} />
              </div>

              {/* --- NEW: Icon Buttons for Actions --- */}
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setEditingProduct(item)}
                  className="p-2 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  title="Edit Product" // Tooltip for accessibility
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => removeProduct(item._id)}
                  className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  disabled={isLoading}
                  title="Delete Product" // Tooltip for accessibility
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Modal (unchanged) --- */}
      {editingProduct && (
        <EditProductModal
          product={editingProduct}
          token={token}
          onClose={() => setEditingProduct(null)}
          onUpdate={() => {
            setEditingProduct(null)
            fetchList()
          }}
        />
      )}
    </div>
  )
}

export default List