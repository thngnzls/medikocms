import React, { useContext, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';
import { assets } from '../assets/assets';
import RelatedProducts from '../components/RelatedProducts';
import { toast } from 'react-toastify'; 

// Define the maximum allowed quantity
const MAX_CART_QUANTITY = 10;

// Helper function to render star icons
const renderStars = (rating) => {
    const stars = [];
    // Ensure rating is a number between 0 and 5
    const actualRating = Math.max(0, Math.min(5, Number(rating))); 

    for (let i = 0; i < 5; i++) {
        if (i < actualRating) {
            // Full star
            stars.push(<span key={i} className="text-yellow-500">★</span>);
        } else {
            // Empty/Dull star
            stars.push(<span key={i} className="text-gray-400">★</span>);
        }
    }
    return <div className="flex items-center text-lg leading-none">{stars}</div>;
};

// Helper component for the Review Form
const ReviewForm = ({ onReviewSubmit }) => {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5); // Default rating
    const [comment, setComment] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!name.trim() || !comment.trim()) {
            toast.error("Please fill out your name and review comment.");
            return;
        }

        // Create the new review object
        const newReview = {
            id: Date.now(), // Unique ID
            rating: parseInt(rating),
            comment: comment.trim(),
            author: name.trim(),
            date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        };

        onReviewSubmit(newReview);
        
        // Clear the form
        setName('');
        setRating(5);
        setComment('');
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-lg bg-white shadow-md space-y-3">
            <h4 className="text-md font-bold text-gray-800">Write a Review</h4>
            <div>
                <label htmlFor="reviewName" className="block text-sm font-medium text-gray-700">Your Name</label>
                <input
                    type="text"
                    id="reviewName"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                    required
                />
            </div>
            <div>
                <label htmlFor="reviewRating" className="block text-sm font-medium text-gray-700">Rating</label>
                <select
                    id="reviewRating"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                >
                    <option value="5">★★★★★ - Excellent</option>
                    <option value="4">★★★★☆ - Very Good</option>
                    <option value="3">★★★☆☆ - Good</option>
                    <option value="2">★★☆☆☆ - Fair</option>
                    <option value="1">★☆☆☆☆ - Poor</option>
                </select>
            </div>
            <div>
                <label htmlFor="reviewComment" className="block text-sm font-medium text-gray-700">Comment</label>
                <textarea
                    id="reviewComment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows="3"
                    placeholder="Share your thoughts on the product..."
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm focus:ring-green-500 focus:border-green-500"
                    required
                ></textarea>
            </div>
            <button
                type="submit"
                className="w-full px-4 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 transition-colors"
            >
                Submit Review
            </button>
        </form>
    );
};

// --- START Product Component ---
const Product = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { products, currency, addToCart, cartItems } = useContext(ShopContext);
    const [productData, setProductData] = useState(false);
    const [image, setImage] = useState('');
    const [activeTab, setActiveTab] = useState('description');
    const [productReviews, setProductReviews] = useState([]); 
    
    const reviewsCount = productReviews.length; // Use the actual count of reviews

    const isOutOfStock = productData && productData.stock <= 0;
    const currentCartQuantity = productData ? cartItems[productData._id] || 0 : 0;
    const isMaxLimitReached = currentCartQuantity >= MAX_CART_QUANTITY;

    const fetchProductData = () => {
        const product = products.find(item => item._id === productId);
        if (product) {
            setProductData(product);
            setImage(product.image[0]);

            const storedReviews = localStorage.getItem(`reviews_${productId}`);
            if (storedReviews) {
                setProductReviews(JSON.parse(storedReviews));
            } else {
                setProductReviews([]); 
            }
        }
    };

   
    const handleReviewSubmit = (newReview) => {
      
        setProductReviews((prevReviews) => {
            const updatedReviews = [newReview, ...prevReviews];
            
            localStorage.setItem(`reviews_${productId}`, JSON.stringify(updatedReviews));
            
            // 3. Show success toast
            toast.success("Thank you for your review!");
            
            return updatedReviews;
        });
    };

    useEffect(() => {
        // Fetch data and load reviews when the component mounts or productId changes
        fetchProductData();
    }, [productId, products]);

    // Handle Add to Cart action (unchanged)
    const handleAddToCart = () => {
        if (!productData) return;
        
        if (isOutOfStock) {
            toast.error(`${productData.name} is currently sold out.`);
            return;
        }

        if (isMaxLimitReached) {
            toast.warn(`You can only add a maximum of ${MAX_CART_QUANTITY} units of "${productData.name}" to your cart.`);
            return;
        }

        if (currentCartQuantity >= productData.stock) {
             toast.warn(`Only ${productData.stock} units of "${productData.name}" are available in stock.`);
             return;
        }
        
        addToCart(productData._id);
        toast.success(`1 unit of "${productData.name}" added to cart!`);
    };

    // Determine button state and text
    const isButtonDisabled = isOutOfStock || isMaxLimitReached;
    const buttonText = isOutOfStock 
        ? 'SOLD OUT' 
        : isMaxLimitReached 
            ? `MAX LIMIT REACHED (${MAX_CART_QUANTITY})` 
            : 'ADD TO CART';

    // Function to handle navigation back to the main collection page
    const handleBackClick = () => {
        navigate('/collection'); 
    };

    return productData ? (
        <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">

            {/* ⬅️ Back Button */}
            <button
                onClick={handleBackClick}
                className="mb-8 flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors font-medium"
            >
                {/* SVG for Left Arrow */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Back to Products
            </button>
            
            {/*----------- Product Data-------------- */}
            <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
                {/*---------- Product Images------------- */}
                <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row">
                    <div className="flex sm:flex-col overflow-x-auto sm:overflow-y-scroll justify-between sm:justify-normal sm:w-[18.7%] w-full">
                        {productData.image.map((item, index) => (
                            <img
                                onClick={() => setImage(item)}
                                src={item}
                                key={index}
                                className="w-[24%] sm:w-full sm:mb-3 flex-shrink-0 cursor-pointer border border-gray-200 hover:border-green-500 transition-colors"
                                alt=""
                            />
                        ))}
                    </div>
                    {/* Main Image with Overlay */}
                    <div className="w-full sm:w-[80%] relative">
                        <img className="w-full h-auto" src={image} alt="" />
                        {isOutOfStock && (
                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
                                <span className="text-white text-3xl font-bold uppercase p-4 border-4 border-white rotate-[-15deg]">
                                    Out of Stock
                                </span>
                            </div>
                        )}
                        {!isOutOfStock && isMaxLimitReached && (
                            <div className="absolute inset-0 flex items-center justify-center bg-green-900 bg-opacity-50">
                                <span className="text-white text-3xl font-bold uppercase p-4 border-4 border-white rotate-[-15deg]">
                                    Max Quantity Reached
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* -------- Product Info ---------- */}
                <div className="flex-1">
                    <h1 className="font-medium text-4xl mt-2">{productData.name}</h1>
                    <div className="flex items-center gap-1 mt-2">
                        {/* Static Rating Stars (you could calculate an average here) */}
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_icon} alt="" className="w-3.5" />
                        <img src={assets.star_dull_icon} alt="" className="w-3.5" />
                        <p className="pl-2">({reviewsCount} Reviews)</p>
                    </div>
                    <p className="mt-5 text-3xl font-medium">
                        {currency}
                        {productData.price}
                    </p>
                    <p className="mt-5 mb-5 text-gray-500 md:w-4/5">{productData.description}</p>
                    
                    {/* Status Indicators */}
                    {!isOutOfStock && isMaxLimitReached && ( 
                            <div className="mb-4">
                               <p className="font-semibold text-green-600">
                                    Maximum limit of {MAX_CART_QUANTITY} reached in cart.
                               </p>
                            </div>
                    )}
                    {isOutOfStock && (
                        <div className="mb-4">
                            <p className="font-semibold text-red-500">
                                Currently Sold Out
                            </p>
                        </div>
                    )}

                    {/* ADD TO CART Button Logic */}
                    <button
                        onClick={handleAddToCart} 
                        disabled={isButtonDisabled} 
                        className={`px-8 py-3 text-base font-semibold uppercase transition-colors duration-200 ${
                            isButtonDisabled
                                ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800'
                        }`}
                    >
                        {buttonText}
                    </button>
                    
                    <hr className="mt-8 sm:w-4/5" />
                    <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
                        <p><span className="font-medium text-gray-700">Category:</span> {productData.category}</p>
                        <p><span className="font-medium text-gray-700">Type:</span> {productData.subCategory}</p>
                        <p className="mt-3">100% Original product.</p>
                        <p>Cash on delivery is available on this product.</p>
                        <p>Easy return and exchange policy within 7 days.</p>
                    </div>
                </div>
            </div>

            {/* ---------- Description & Review Section ------------- */}
            <div className="mt-20">
                <div className="flex border-b border-gray-300">
                    {/* Description Tab Button */}
                    <button
                        onClick={() => setActiveTab('description')}
                        className={`px-5 py-3 text-sm font-semibold transition-colors ${
                            activeTab === 'description' 
                                ? 'border border-gray-300 border-b-white bg-white text-black' // Active style
                                : 'border-b border-gray-300 text-gray-500 hover:bg-gray-50' // Inactive style
                        }`}
                    >
                        Description
                    </button>
                    
                    {/* Review Tab Button */}
                    <button
                        onClick={() => setActiveTab('reviews')}
                        className={`px-5 py-3 text-sm transition-colors ${
                            activeTab === 'reviews' 
                                ? 'border border-gray-300 border-b-white bg-white text-black font-semibold' // Active style
                                : 'border-b border-gray-300 text-gray-500 hover:bg-gray-50' // Inactive style
                        }`}
                    >
                        Reviews ({reviewsCount})
                    </button>
                </div>
                
                {/* Content Area */}
                <div className="flex flex-col gap-4 border border-t-0 border-gray-300 px-6 py-6 text-sm text-gray-500">
                    
                    {activeTab === 'description' && (
                        <>
                            <p>
                                An e-commerce website is an online platform that facilitates the buying and
                                selling of products or services over the internet...
                            </p>
                            <p>
                                E-commerce websites typically display products or services along with
                                detailed descriptions, images, prices, and any available variations (e.g.,
                                sizes, colors)...
                            </p>
                        </>
                    )}

                    {activeTab === 'reviews' && (
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold text-gray-800">Customer Reviews ({reviewsCount})</h3>
                            
                            {/* Review Form Component */}
                            <ReviewForm onReviewSubmit={handleReviewSubmit} />
                            
                            {/* Display Existing Reviews */}
                            <div className="space-y-4">
                                {productReviews.length > 0 ? (
                                    productReviews.map(review => (
                                        <div key={review.id} className="border p-4 rounded-lg bg-gray-50">
                                            <div className="flex items-center text-sm font-medium text-gray-700 mb-2">
                                                {renderStars(review.rating)}
                                                <span className='ml-2 text-base font-semibold text-gray-800'>
                                                    {review.rating >= 4 ? "Great Product" : "Satisfactory"}
                                                </span>
                                            </div>
                                            <p className="text-gray-600 italic">"{review.comment}"</p>
                                            <p className="text-xs text-gray-500 mt-2">
                                                Posted by <span className="font-semibold text-gray-700">{review.author}</span> on {review.date}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --------- display related products ---------- */}
            <RelatedProducts
                category={productData.category}
                subCategory={productData.subCategory}
            />
        </div>
    ) : (
        <div className="opacity-0"></div>
    );
};

export default Product;