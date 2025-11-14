// Verify.jsx (Corrected Code)

import React, { useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { ShopContext } from '../context/ShopContext';
// Assuming you have a spinner/loading image asset or just use a simple spinner element

const Verify = () => {
    const { navigate, token, setCartItems, backendUrl } = useContext(ShopContext);
    const [searchParams] = useSearchParams();

    // The data passed back from Stripe via the URL
    const success = searchParams.get('success');
    const orderId = searchParams.get('orderId');

    const verifyPayment = async () => {
        // 1. Initial Check: Must have a token and the necessary URL parameters
        if (!token) {
            // Wait for token to load in the dependency array
            return; 
        }
        if (!orderId || !success) {
            toast.error("Missing order or payment details. Please check your cart.");
            navigate('/cart');
            return;
        }

        try {
            // CRITICAL STEP: Call the backend endpoint
            const response = await axios.post(
                backendUrl + '/api/order/verifyStripe', 
                { success, orderId }, 
                { headers: { token } }
            );

            if (response.data.success) {
                // Success: Clear cart and navigate to user orders
                setCartItems({});
                toast.success("Payment successful! Your order has been placed.");
                navigate('/orders');
            } else {
                // Failure: Navigate back to the cart
                toast.error(response.data.message || 'Payment failed or was canceled. Please try again.');
                navigate('/cart');
            }
        } catch (error) {
            console.error("Verification error:", error);
            toast.error("A network error occurred during payment verification.");
            navigate('/cart');
        }
    };

    // 🎯 CRITICAL FIX: The effect should run whenever token, orderId, or success changes.
    // This ensures it runs after the token is loaded AND the URL parameters are read.
    useEffect(() => {
        // Only call the verification if we have the minimum required data
        if (token && orderId && success) {
            verifyPayment();
        }
    }, [token, orderId, success]); // Fix the dependency array

    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="text-xl font-medium text-gray-800 mb-4">
                Verifying Payment...
            </div>
            {/* Simple CSS Spinner */}
            <div className='w-12 h-12 border-4 border-t-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin'></div>
        </div>
    );
};

export default Verify;