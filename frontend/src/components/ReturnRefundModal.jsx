// src/components/ReturnRefundModal.jsx
import React, { useState, useMemo } from 'react';
import { FaUndoAlt, FaTimes, FaChevronDown, FaUpload, FaTrashAlt } from 'react-icons/fa'; 
// import { useNavigate } from 'react-router-dom'; // 1. REMOVE NAVIGATE IMPORT

const COMMON_REASONS = [
    { value: '', label: 'Select a reason...', customInputRequired: false },
    { value: 'damaged_arrival', label: 'Item arrived damaged/opened', customInputRequired: false },
    { value: 'wrong_item', label: 'Received the wrong product', customInputRequired: false },
    { value: 'missing_item', label: 'Received incomplete products ordered', customInputRequired: false },
    { value: 'defective_item', label: 'Item is damaged or defective', customInputRequired: false },
    { value: 'other', label: 'Other (Please specify below)', customInputRequired: true },
];

const MAX_FILES = 3;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// ➡️ ADD onSuccess PROP
const ReturnRefundModal = ({ orderId, onClose, onSubmit, onSuccess }) => { 
    
    // const navigate = useNavigate(); // 3. REMOVE NAVIGATE INITIALIZATION

    const [selectedReason, setSelectedReason] = useState('');
    const [customReason, setCustomReason] = useState('');
    const [files, setFiles] = useState([]);
    const [error, setError] = useState('');

    const reasonOption = useMemo(() => 
        COMMON_REASONS.find(r => r.value === selectedReason) || { customInputRequired: false, label: '' },
        [selectedReason]
    );

    const requiresCustomInput = reasonOption.customInputRequired;

    const handleFileChange = (e) => {
        const newFiles = Array.from(e.target.files);
        let currentFileCount = files.length;
        
        const validNewFiles = newFiles.filter(file => {
            if (currentFileCount >= MAX_FILES) return false;
            if (!ALLOWED_TYPES.includes(file.type)) {
                setError(`File type for ${file.name} is not supported. Please use JPG, PNG, or WEBP.`);
                return false;
            }
            currentFileCount++;
            return true;
        });

        const totalFiles = [...files, ...validNewFiles].slice(0, MAX_FILES);
        setFiles(totalFiles);
        e.target.value = null; 
        if (validNewFiles.length > 0) {
            setError('');
        }
    };

    const handleFileRemove = (fileToRemove) => {
        setFiles(files.filter(file => file !== fileToRemove));
        setError('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        setError('');

        if (!selectedReason) {
            setError('Please select a reason from the list.');
            return;
        }

        let finalReason = selectedReason;
        
        if (requiresCustomInput) {
            if (customReason.trim().length < 10) {
                setError('Please provide a detailed reason in the text box (minimum 10 characters).');
                return;
            }
            finalReason = `Other: ${customReason.trim()}`;
        } else if (customReason.trim().length > 0) {
            const reasonLabel = reasonOption.label;
            finalReason = `${reasonLabel} - Note: ${customReason.trim()}`;
        } else {
            finalReason = reasonOption.label;
        }
        
        const fileNames = files.map(file => file.name);

        // Submit the final reason and files
        onSubmit(orderId, finalReason, fileNames);
        
        // ➡️ 5. EXECUTE onSuccess prop INSTEAD OF navigate()
        onClose(); // Close this modal first
        onSuccess(); // Open the policy modal (in the parent)
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
            <div 
                className="bg-white rounded-lg shadow-2xl p-6 w-11/12 max-w-lg transform transition-all duration-300 scale-100" 
                onClick={(e) => e.stopPropagation()} 
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-orange-600 flex items-center">
                        <FaUndoAlt className="mr-2" /> Submit Return/Refund Request
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition">
                        <FaTimes size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit}>
                    <p className="mb-4 text-sm text-gray-600">
                        Order ID: <span className="font-mono font-semibold text-gray-800">#{orderId ? orderId.substring(0, 8) : 'N/A'}</span>
                    </p>
                    
                    {/* Primary Reason Dropdown */}
                    <div className="mb-4">
                        <label htmlFor="selectReason" className="block text-sm font-medium text-gray-700 mb-2">
                            Primary Reason <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="selectReason"
                                value={selectedReason}
                                onChange={(e) => {
                                    setSelectedReason(e.target.value);
                                    setCustomReason('');
                                    setError('');
                                }}
                                className="w-full appearance-none px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                                required
                            >
                                {COMMON_REASONS.map((option) => (
                                    <option key={option.value} value={option.value} disabled={option.value === ''}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <FaChevronDown className="absolute right-3 top-3 text-gray-400 pointer-events-none" size={14} />
                        </div>
                    </div>                  

                    {/* Custom Reason Text Area */}
                    {(requiresCustomInput || customReason.length > 0) && (
                        <div className="mb-4">
                            <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                                Details / Notes 
                                {requiresCustomInput && <span className="text-red-500"> * (Minimum 10 characters)</span>}
                            </label>
                            <textarea
                                id="customReason"
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder={requiresCustomInput ? "Please describe your reason in detail (required for 'Other')..." : "Add optional details for the return..."}
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                required={requiresCustomInput}
                            />
                        </div>
                    )}

                    {/* Photo Uploader Section */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                            <FaUpload className="mr-1" /> Photo Proof (Max {MAX_FILES} Images)
                            <span className="ml-2 text-xs text-gray-500">JPG, PNG, WEBP</span>
                        </label>
                        
                        <div className="relative border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-orange-500 transition">
                            <input 
                                type="file" 
                                multiple
                                accept={ALLOWED_TYPES.join(',')}
                                onChange={handleFileChange}
                                disabled={files.length >= MAX_FILES}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            {files.length < MAX_FILES ? (
                                <p className="text-gray-600 text-sm">
                                    <span className="text-orange-600 font-semibold">Click to upload</span> or drag and drop images here.
                                </p>
                            ) : (
                                <p className="text-gray-500 text-sm">
                                    Maximum of {MAX_FILES} images reached.
                                </p>
                            )}
                        </div>

                        {files.length > 0 && (
                            <div className="mt-4 space-y-2">
                                {files.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border border-gray-200 rounded-md bg-gray-50">
                                        <div className="flex items-center space-x-2 truncate">
                                            <span className="text-orange-500 font-semibold text-sm">
                                                Photo {index + 1}:
                                            </span>
                                            <span className="text-gray-700 text-sm truncate">{file.name}</span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => handleFileRemove(file)} 
                                            className="text-red-500 hover:text-red-700 transition ml-4"
                                            aria-label={`Remove file ${file.name}`}
                                        >
                                            <FaTrashAlt size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Error Message Display */}
                    {error && <p className="mt-1 text-sm text-red-500 mb-4">{error}</p>}

                    {/* Footer */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700 transition disabled:opacity-50"
                            disabled={!selectedReason || (requiresCustomInput && customReason.trim().length < 10)}
                        >
                            Submit Request
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReturnRefundModal;