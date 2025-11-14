// src/components/OurPolicyModal.jsx
import React from 'react';
// We need FaTimes and FaShieldAlt from react-icons
import { FaTimes, FaShieldAlt, FaTruck, FaUndoAlt, FaMoneyBillWave } from 'react-icons/fa'; 

const OurPolicyModal = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div 
                // Increased max-w to provide enough space for policy text
                className="bg-white rounded-lg shadow-2xl p-6 w-11/12 max-w-3xl transform transition-all duration-300 scale-100 overflow-y-auto max-h-[90vh]" 
                onClick={(e) => e.stopPropagation()} 
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-2xl font-bold text-indigo-600 flex items-center">
                        <FaShieldAlt className="mr-2" /> Official Floradise.Co Policy
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <FaTimes size={20} />
                    </button>
                </div>
                
                <div className='text-gray-700 space-y-6 text-sm'>
                    
                    {/* Order Verification Section */}
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded-md">
                        <h4 className="font-bold text-base text-yellow-700 flex items-center mb-1">
                            <FaTruck className="mr-2 text-lg" /> Order Verification (Cash-on-Delivery)
                        </h4>
                        <p className='text-gray-700'>
                            Orders under the Cash-on-Delivery (COD) and Stripe method must be verified before completing payment and one day after order placement. This is crucial to avoid BOGUS Buying and prevent the loss of our items.
                        </p>
                    </div>

                    {/* General Policy Title */}
                    <h4 className="font-bold text-lg text-gray-800 border-b pb-1">General Policy: Returns, Exchange, and Refunds</h4>

                    {/* Return Policy */}
                    <div>
                        <h5 className="font-semibold text-base text-green-700 flex items-center mb-1">
                            <FaUndoAlt className="mr-2" /> Return Policies
                        </h5>
                        <p className='pl-6'>
                            If an item is to be returned, it must be reported and returned to the merchants within 7 days of delivery. Exceeding this 7-day mark will invalidate and void the item's state and integrity.
                        </p>
                    </div>

                    {/* Return Reasons */}
                    <div>
                        <h5 className="font-semibold text-base text-green-700 pl-6 mb-1">Eligible Return Reasons:</h5>
                        <ul className='list-disc list-inside ml-10 text-gray-700'>
                            <li>Damaged Packaging</li>
                            <li>Missing Item</li>
                            <li>Incorrect Item</li>
                            <li>Delays Causing Damage to Product</li>
                        </ul>
                    </div>

                    {/* Exchange Policies */}
                    <div>
                        <h5 className="font-semibold text-base text-orange-700 flex items-center mb-1">
                            <FaUndoAlt className="mr-2" /> Exchange Policies
                        </h5>
                        <p className='pl-6'>
                            Items cannot be refunded but can be exchanged for products of the same value. We cannot process exchanges for products lower or higher than their original order value paid.
                        </p>
                    </div>

                    {/* Refund Policy */}
                    <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-md">
                        <h5 className="font-bold text-base text-red-700 flex items-center mb-1">
                            <FaMoneyBillWave className="mr-2 text-lg" /> Refund Policy: NO REFUND
                        </h5>
                        <p className='text-gray-700'>
                            Floradise.Co strictly implements the NO REFUND policy due to the perishability of the products. This is to avoid BOGUS Buyers and SCAMS that could potentially affect the Company’s Sales and Reputability.
                        </p>
                    </div>

                    <p className="mt-4 text-xs text-center text-gray-500">
                        Reference: www.floradise.co
                    </p>
                </div>
                
                {/* Footer and Close Button */}
                <div className="flex justify-center pt-4 border-t mt-4">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition"
                    >
                        I understand and accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OurPolicyModal;