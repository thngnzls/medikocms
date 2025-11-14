// src/components/CancelOrderModal.jsx
import React, { useState } from 'react';
import { FaTimesCircle } from 'react-icons/fa';

const CancelOrderModal = ({ orderId, onClose, onSubmit }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!reason) {
      setError('Please select a reason for cancellation.');
      return;
    }

    const confirmCancel = window.confirm("Are you sure you want to cancel this order?");
    if (!confirmCancel) return;

    setError('');
    onSubmit(orderId, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={onClose}>
      <div
        className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-red-600 flex items-center">
            <FaTimesCircle className="mr-2" /> Confirm Cancellation
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-2xl">
            &times;
          </button>
        </div>

        <p className="text-sm text-gray-700 mb-4">
          You are about to cancel Order <strong>#{orderId ? orderId.substring(0, 8) : 'N/A'}</strong>. This action cannot be undone.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="cancellationReason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Cancellation: <span className="text-red-500">*</span>
            </label>
            <select
              id="cancellationReason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
              required
            >
              <option value="">Select a reason...</option>
              <option value="Ordered by mistake">Ordered by mistake</option>
              <option value="Found a better deal">Found a better deal</option>
              <option value="Changed my mind">Changed my mind</option>
              <option value="Payment issue">Payment issue</option>
              <option value="Shipping took too long">Shipping took too long</option>
            </select>
            {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
            >
              Back
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
            >
              Confirm Cancellation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelOrderModal;
