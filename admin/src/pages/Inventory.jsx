"use client"

import axios from "axios"
import { useEffect, useState, useMemo } from "react"
import { backendUrl, currency } from "../App"
import { toast } from "react-toastify"

// --- CONSTANTS FOR FILTERS ---
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
    { value: "stock-asc", label: "Stock (Low-High)" },
    { value: "stock-desc", label: "Stock (High-Low)" },
    { value: "name-asc", label: "Name (A-Z)" },
    { value: "name-desc", label: "Name (Z-A)" },
]

// --- Reusable Components ---

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

const StockBadge = ({ stock }) => {
    let bgColor, textColor, text
    if (stock === 0) {
        bgColor = "bg-red-100"; textColor = "text-red-700"; text = "Out of Stock";
    } else if (stock <= 10) {
        bgColor = "bg-yellow-100"; textColor = "text-yellow-700"; text = "Low Stock";
    } else {
        bgColor = "bg-green-100"; textColor = "text-green-700"; text = "In Stock";
    }
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>{text}</span>;
}

const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
)

const SmallSpinner = () => (
    <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
)

// --- Inventory Component ---

const Inventory = ({ token }) => {
    const [list, setList] = useState([])
    const [isListLoading, setIsListLoading] = useState(true)
    const [savingStockId, setSavingStockId] = useState(null)
    const [editingStock, setEditingStock] = useState({})
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [subCategoryFilter, setSubCategoryFilter] = useState("all")
    const [sortCriteria, setSortCriteria] = useState("default")

    const fetchList = async () => {
        // Only set loading true on initial fetch or manual refresh maybe?
        // Let's keep it simple for now and always show loading during fetch.
        // setIsListLoading(true); // Reconsider if this causes flashes
        try {
            const response = await axios.get(backendUrl + "/api/product/list")
            if (response.data.success && Array.isArray(response.data.products)) {
                setList(response.data.products)
            } else {
                toast.error(response.data.message || "Failed to fetch product list.")
                setList([]) // Ensure list is an array even on failure
            }
        } catch (error) {
            console.error("Fetch List Error:", error)
            toast.error(error.response?.data?.message || error.message || "An error occurred fetching products.")
            setList([])
        } finally {
            setIsListLoading(false)
        }
    }

    const updateStock = async (productId, currentInputValue) => {
        const originalStock = list.find(item => item._id === productId)?.stock ?? 0;
        const newStock = Number(currentInputValue);

        // Prevent saving if value didn't change or is invalid
        if (String(originalStock) === String(newStock)) {
             delete editingStock[productId]; // Clean up editing state if unchanged
             setEditingStock({...editingStock});
             return;
        }

        if (isNaN(newStock) || newStock < 0) {
            toast.error("Stock must be a non-negative number.");
            setEditingStock(prev => ({ ...prev, [productId]: String(originalStock) })); // Revert input to original
            return;
        }

        setSavingStockId(productId);
        try {
            const response = await axios.post(
                backendUrl + "/api/product/update-stock",
                { productId, stock: newStock },
                { headers: { token } }
            )
            if (response.data.success) {
                toast.success(response.data.message || "Stock updated.");
                setEditingStock(prev => { // Clear local edit state for this item
                    const copy = { ...prev };
                    delete copy[productId];
                    return copy;
                });
                // Update local list state immediately for better UX instead of full refetch
                setList(prevList => prevList.map(item =>
                    item._id === productId ? { ...item, stock: newStock } : item
                ));
            } else {
                toast.error(response.data.message || "Failed to update stock.");
                setEditingStock(prev => ({ ...prev, [productId]: String(originalStock) })); // Revert on failure
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message || "An error occurred updating stock.");
            setEditingStock(prev => ({ ...prev, [productId]: String(originalStock) })); // Revert on error
        } finally {
            setSavingStockId(null);
        }
    }

    useEffect(() => {
        if(token) fetchList();
         else {
            setIsListLoading(false);
            toast.error("Authentication token missing.");
        }
    }, [token]) // Added token dependency

    const processedList = useMemo(() => {
        let items = [...list];
        if (searchTerm) {
            items = items.filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        if (categoryFilter !== "all") {
            items = items.filter((item) => item.category === categoryFilter);
        }
        if (subCategoryFilter !== "all") {
             items = items.filter((item) => item.subCategory === subCategoryFilter);
        }
        switch (sortCriteria) {
            case "name-asc": items.sort((a, b) => a.name.localeCompare(b.name)); break;
            case "name-desc": items.sort((a, b) => b.name.localeCompare(a.name)); break;
            case "stock-asc": items.sort((a, b) => a.stock - b.stock); break;
            case "stock-desc": items.sort((a, b) => b.stock - a.stock); break;
            default: items.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)); break; // Default sort by date descending
        }
        return items;
    }, [list, searchTerm, categoryFilter, subCategoryFilter, sortCriteria]);

    const handleClearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
        setSubCategoryFilter("all");
        setSortCriteria("default");
    }

    if (isListLoading) {
        return <ListSpinner />;
    }

    const baseSelectClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors bg-white text-sm"; // Green focus

    return (
        <div className="p-6 bg-gray-50 min-h-screen"> {/* Subtle background */}
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Inventory Management</h3>

            <div className="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm"> {/* White filter card */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"> {/* Align items end */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-600 mb-1">Search by Name</label>
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                                <SearchIcon />
                            </span>
                            <input
                                type="text"
                                placeholder="e.g., Digital Thermometer"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${baseSelectClass} pl-10`} // Green focus applied
                            />
                        </div>
                    </div>
                    <FilterGroup label="Category">
                        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className={baseSelectClass}>
                            {CATEGORIES.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                    </FilterGroup>
                    <FilterGroup label="Sub-Category">
                        <select value={subCategoryFilter} onChange={(e) => setSubCategoryFilter(e.target.value)} className={baseSelectClass}>
                             {SUB_CATEGORIES.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                    </FilterGroup>
                    <FilterGroup label="Sort By">
                        <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className={baseSelectClass}>
                            {SORT_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                    </FilterGroup>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={handleClearFilters} className="text-sm font-medium text-green-600 hover:text-green-800 transition-colors"> {/* Green clear */}
                        Clear All Filters
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                <div className="min-w-[800px]"> {/* Adjusted min-width */}
                    <div className="grid grid-cols-[auto_3fr_1.5fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10"> {/* Sticky header */}
                        <p className="w-12 text-xs font-semibold text-gray-500 uppercase tracking-wider">Image</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</p>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-right pr-2">Price</p> {/* Align price right */}
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Stock</p> {/* Center Stock */}
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Status</p> {/* Center Status */}
                    </div>

                    {processedList.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            {searchTerm || categoryFilter !== "all" || subCategoryFilter !== "all"
                                ? "No products match your filters."
                                : "No products found."}
                        </div>
                    ) : (
                        processedList.map((item) => {
                            const currentStockValue = editingStock[item._id] ?? item.stock ?? 0;
                            const isSaving = savingStockId === item._id;
                            const hasChanged = editingStock[item._id] !== undefined && editingStock[item._id] !== String(item.stock);

                            return (
                                <div
                                    className="grid grid-cols-[auto_3fr_1.5fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3 border-b border-gray-100 text-sm hover:bg-gray-50/50 transition-colors group" // Lighter hover
                                    key={item._id}
                                >
                                    <img className="w-12 h-12 object-cover rounded-md border border-gray-200" src={item.image && item.image[0]} alt={item.name} /> {/* Added border */}
                                    <p className="font-medium text-gray-800 truncate" title={item.name}>{item.name}</p> {/* Darker name */}
                                    <p className="text-gray-500 text-xs truncate">{item.category}</p> {/* Smaller category text */}
                                    <p className="font-medium text-gray-700 text-right pr-2">{currency}{item.price.toFixed(2)}</p> {/* Darker price */}

                                    <div className="relative w-20 mx-auto"> {/* Centered input */}
                                        <input
                                            type="number"
                                            min="0"
                                            value={currentStockValue}
                                            onChange={e => setEditingStock(prev => ({ ...prev, [item._id]: e.target.value }))}
                                            onBlur={() => updateStock(item._id, currentStockValue)} // Pass current value on blur
                                            onKeyDown={e => { if (e.key === "Enter") e.target.blur() }}
                                            className={`w-full p-1.5 border rounded-md focus:outline-none focus:ring-2 transition-colors text-center ${hasChanged ? 'border-green-500 ring-green-200' : 'border-gray-300 focus:ring-green-500'} ${isSaving ? 'bg-gray-100' : 'bg-white'}`} // Green border on change, gray bg on save
                                            disabled={savingStockId !== null}
                                            aria-label={`Stock for ${item.name}`}
                                        />
                                        {isSaving && (
                                            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
                                                <SmallSpinner />
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <StockBadge stock={item.stock} />
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}

export default Inventory;