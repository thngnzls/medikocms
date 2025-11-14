"use client"

import React, { useContext, useEffect, useState, useMemo } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import ProductItem from "../components/ProductItem";

const categoriesList = [
    { value: "Equipment", label: "Medical Equipment" },
    { value: "Consumables", label: "Medical Consumables" },
    { value: "Peripherals", label: "Health & Wellness Peripherals" },
];
const subCategoriesList = [
    { value: "Diagnostic Tools", label: "Diagnostic Tools" },
    { value: "Mobility Aids", label: "Mobility Aids" },
    { value: "Home Monitoring Devices", label: "Home Monitoring Devices" },
    { value: "Personal Protective Equipment", label: "Personal Protective Equipment" },
    { value: "Wound Care Supplies", label: "Wound Care Supplies" },
    { value: "Injection & IV Supplies", label: "Injection & IV Supplies" },
    { value: "Respiratory Care", label: "Respiratory Care" },
    { value: "Diabetic Care", label: "Diabetic Care" },
    { value: "Physical Therapy Tools", label: "Physical Therapy Tools" },
];

const FilterIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" /></svg>);
const ChevronDownIcon = ({ className = "" }) => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={`w-4 h-4 ${className}`}><path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" /></svg>);
const XMarkIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>);
const LoadingSpinner = () => (<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>);
const NoResultsIcon = () => (<svg className="w-16 h-16 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/></svg>);

const FilterCheckbox = ({ value, label, checked, onChange }) => (
    <label className="flex items-center space-x-3 text-sm text-gray-700 cursor-pointer group">
        <input
            className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-offset-0 focus:ring-1 transition duration-150 ease-in-out"
            value={value}
            checked={checked}
            onChange={onChange}
            type="checkbox"
        />
        <span className="group-hover:text-green-700 transition-colors">{label}</span>
    </label>
);

const FilterSection = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border-b border-gray-200 last:border-b-0 py-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex justify-between items-center w-full text-left"
            >
                <span className="text-sm font-semibold text-gray-800 uppercase tracking-wide">{title}</span>
                <ChevronDownIcon className={`transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>
            <div className={`mt-3 overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}>
                <div className="flex flex-col space-y-2.5 pt-1">
                    {children}
                </div>
            </div>
        </div>
    );
};


const Collection = () => {
    const { products = [], search = '', showSearch = false, addToCart } = useContext(ShopContext);
    const [showFilter, setShowFilter] = useState(false);
    const [category, setCategory] = useState([]);
    const [subCategory, setSubCategory] = useState([]);
    const [sortType, setSortType] = useState("relevant");
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const toggleCategory = (e) => {
        const value = e.target.value;
        setCategory((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
    };

    const toggleSubCategory = (e) => {
        const value = e.target.value;
        setSubCategory((prev) => prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]);
    };

    const processedProducts = useMemo(() => {
        let items = products ? [...products] : [];
        if (showSearch && search) {
            items = items.filter((item) => item.name?.toLowerCase().includes(search.toLowerCase()));
        }
        if (category.length > 0) {
            items = items.filter((item) => category.includes(item.category));
        }
        if (subCategory.length > 0) {
            items = items.filter((item) => subCategory.includes(item.subCategory));
        }
        switch (sortType) {
            case "low-high": items.sort((a, b) => (a.price || 0) - (b.price || 0)); break;
            case "high-low": items.sort((a, b) => (b.price || 0) - (a.price || 0)); break;
            case "relevant": break;
            default: break;
        }
        return items;
    }, [products, search, showSearch, category, subCategory, sortType]);


    const clearAllFilters = () => {
        setCategory([]);
        setSubCategory([]);
        setSortType("relevant");
    };

    const handleAddToCart = (itemId) => {
        if (addToCart) addToCart(itemId);
    };

     if (!isClient || (products.length === 0 && isClient)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <LoadingSpinner />
                <p className="text-gray-600 mt-4">Loading products...</p>
            </div>
        );
     }

    const hasActiveFilters = category.length > 0 || subCategory.length > 0 || sortType !== "relevant";

    return (
        <div className="container mx-auto px-4 py-8 md:py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">

                <aside className="w-full lg:w-64 xl:w-72 flex-shrink-0">
                    <button
                        onClick={() => setShowFilter(!showFilter)}
                        className="w-full lg:hidden flex justify-between items-center px-4 py-3 mb-4 text-base font-semibold text-gray-800 bg-white rounded-lg border border-gray-300 shadow-sm"
                    >
                        <div className="flex items-center gap-2"> <FilterIcon /> Filters </div>
                        <ChevronDownIcon className={`transform transition-transform ${showFilter ? "rotate-180" : ""}`} />
                    </button>

                    <div className={`${showFilter ? "block animate-fade-in-down" : "hidden"} lg:block sticky top-24 space-y-2 bg-white p-5 rounded-lg border border-gray-200 shadow-sm`}>
                        <div className="flex justify-between items-center pb-3 mb-2">
                             <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                             {hasActiveFilters && (
                                <button onClick={clearAllFilters} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 transition-colors">
                                    <XMarkIcon /> Clear All
                                </button>
                             )}
                        </div>

                        <FilterSection title="Categories" defaultOpen={true}>
                           {categoriesList.map(item => (
                               <FilterCheckbox key={item.value} value={item.value} label={item.label} checked={category.includes(item.value)} onChange={toggleCategory}/>
                           ))}
                        </FilterSection>

                        <FilterSection title="Type">
                           {subCategoriesList.map(item => (
                               <FilterCheckbox key={item.value} value={item.value} label={item.label} checked={subCategory.includes(item.value)} onChange={toggleSubCategory}/>
                           ))}
                        </FilterSection>

                    </div>
                </aside>

                <main className="flex-1 min-w-0"> {/* Added min-w-0 */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4 pb-4 border-b border-gray-200">
                         <h2 className="text-xl sm:text-2xl font-bold text-gray-800 whitespace-nowrap">
                           {showSearch && search ? `Results for "${search}"` : "All Products"}
                           <span className="text-base font-normal text-gray-500 ml-2">({processedProducts.length} items)</span>
                         </h2>

                        <div className="relative w-full sm:w-auto flex-shrink-0">
                            <label htmlFor="sort-select" className="sr-only">Sort Products</label>
                            <select
                                id="sort-select"
                                value={sortType}
                                onChange={(e) => setSortType(e.target.value)}
                                className="appearance-none block w-full sm:w-52 bg-white border border-gray-300 hover:border-gray-400 pl-4 pr-8 py-2 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 text-sm transition-colors cursor-pointer"
                            >
                                <option value="relevant">Sort: Relevant</option>
                                <option value="low-high">Price: Low to High</option>
                                <option value="high-low">Price: High to Low</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <ChevronDownIcon />
                            </div>
                        </div>
                    </div>

                    {processedProducts.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-5 gap-y-10"> {/* Increased gap */}
                            {processedProducts.map((item) => (
                                <ProductItem
                                    key={item._id}
                                    name={item.name}
                                    id={item._id}
                                    price={item.price}
                                    image={item.image}
                                    stock={item.stock}
                                    addToCart={() => handleAddToCart(item._id)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-white rounded-lg mt-8 border border-gray-200 shadow-sm">
                            <NoResultsIcon />
                            <h3 className="text-xl font-semibold text-gray-700 mt-4 mb-2">No products match your filters</h3>
                            <p className="text-gray-500 mb-4 text-sm">Try removing some filters to see more results.</p>
                            {hasActiveFilters && (
                                <button
                                    onClick={clearAllFilters}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                >
                                    Clear All Filters
                                </button>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

export default Collection;