import axios from "axios";
import React, { useState } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

// Changed props to setToken and onLoginClick for proper integration with App.jsx
const AddAdmin = ({ setToken, onLoginClick }) => { 
    const [isLoading, setIsLoading] = useState(false);
    const [addAdminData, setAddAdminData] = useState({
        name: "", // Single field for full name in the form
        email: "",
        password: "",
        role: "admin",
    });

    // Handle input change for the admin creation form
    const handleAddAdminChange = (e) => {
        const { name, value } = e.target;
        setAddAdminData((prev) => ({ ...prev, [name]: value }));
    };

    // Logic to add a new admin (and automatically log them in)
    const addAdmin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            // 1. Prepare data for the backend, splitting the single 'name' field
            const nameParts = addAdminData.name.trim().split(/\s+/);
            const firstName = nameParts[0];
            const lastName = nameParts.slice(1).join(" ") || ""; // Ensures all remaining words go to lastName

            const dataToSend = {
                firstName: firstName,
                lastName: lastName,
                email: addAdminData.email,
                password: addAdminData.password,
                role: 'admin' // Ensures the created user has admin role
            };

            // 2. CRITICAL FIX: Use the correct, unprotected endpoint.
            // This URL aligns with the route we added in userRoute.js: '/api/user/register-admin'
            const url = backendUrl + "/api/user/register-admin"; 
            
            const response = await axios.post(url, dataToSend);

            if (response.data.success) {
                toast.success("Admin created successfully! Logging you in...");
                
                // Automatically log the user in after successful creation
                if (setToken && response.data.token) {
                    setToken(response.data.token);
                } else if (onLoginClick) {
                    onLoginClick(); // Fallback to redirecting to the Login page
                }

            } else {
                toast.error(response.data.message || "Failed to create admin");
            }
        } catch (error) {
            console.error(error);
             // Provide specific error message for 404 to help debugging
            if (error.response && error.response.status === 404) {
                 toast.error(`404 Error: Backend route not found for: /api/user/register-admin. Did you restart the server?`);
            } else {
                toast.error(error.response?.data?.message || 'Failed to connect to server.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center w-full p-4">
            <div className="bg-white shadow-lg rounded-lg px-8 py-8 w-full max-w-lg">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    Create New Admin Account
                </h1>
                <form onSubmit={addAdmin}>
                    {/* Full Name Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={addAdminData.name}
                            onChange={handleAddAdminChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-black focus:border-black"
                            placeholder="Enter full name (First Last)"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    {/* Email Input */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
                            type="email"
                            name="email"
                            value={addAdminData.email}
                            onChange={handleAddAdminChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-black focus:border-black"
                            placeholder="Enter admin email"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    {/* Password Input */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={addAdminData.password}
                            onChange={handleAddAdminChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-black focus:border-black"
                            placeholder="Set a password"
                            required
                            disabled={isLoading}
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-md text-white bg-black hover:bg-gray-800 transition duration-200 disabled:bg-gray-400 flex justify-center items-center"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <>
                                <svg
                                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                                Creating Admin...
                            </>
                        ) : (
                            "Create Admin"
                        )}
                    </button>
                </form>

                {/* Link to Login */}
                <div className='mt-4 text-center'>
                    <span 
                        onClick={onLoginClick} 
                        className='text-sm text-gray-600 hover:text-blue-800 cursor-pointer'
                    >
                        Already have an account? Login
                    </span>
                </div>
            </div>
        </div>
    );
};

export default AddAdmin;