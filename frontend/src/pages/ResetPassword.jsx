"use client"

import { useContext, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ShopContext } from '../context/ShopContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Swal from 'sweetalert2';

const ResetPassword = () => {
    const { token } = useParams(); // Get token from URL
    const navigate = useNavigate();
    const { backendUrl } = useContext(ShopContext);

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const validate = () => {
        const newErrors = {};
        if (password.length < 8) {
            newErrors.password = 'Password must be at least 8 characters.';
        }
        if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Passwords do not match.';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!validate()) {
            const firstError = Object.values(errors)[0] || Object.values(validate())[0];
            toast.error(firstError || 'Please correct the errors.');
            return;
        }

        try {
            Swal.fire({
                title: 'Resetting Password...',
                text: 'Please wait.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            const response = await axios.post(`${backendUrl}/api/user/reset-password`, {
                token,
                password,
            });

            Swal.close();

            if (response.data.success) {
                Swal.fire(
                    'Success!',
                    'Your password has been reset successfully. Please log in.',
                    'success'
                );
                navigate('/login'); // Redirect to login page
            } else {
                Swal.fire('Error', response.data.message, 'error');
            }
        } catch (error) {
            Swal.close();
            const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
            Swal.fire('Error', errorMessage, 'error');
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="flex flex-col w-[90%] sm:max-w-xl m-auto gap-4 p-8 bg-white rounded-lg shadow-md text-gray-800 my-20"
        >
            <div className="inline-flex items-center gap-2 mb-2 mt-4 self-center">
                <p className="prata-regular text-3xl">Reset Password</p>
                <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
            </div>

            <p className="text-center text-gray-600">Please enter your new password.</p>

            <div className="relative">
                <input
                    onChange={(e) => setPassword(e.target.value)}
                    value={password}
                    type={showPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
                    placeholder="New Password"
                />
                <span
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
                >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            </div>
            {errors.password && <p className="text-red-500 text-sm mt-[-8px]">{errors.password}</p>}

            <div className="relative">
                <input
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    value={confirmPassword}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
                    placeholder="Confirm New Password"
                />
                <span
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
                >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
            </div>
            {errors.confirmPassword && <p className="text-red-500 text-sm mt-[-8px]">{errors.confirmPassword}</p>}

            <button className="bg-green-600 text-white font-light px-8 py-2 mt-4 rounded-md hover:bg-green-700 transition-colors">
                Submit New Password
            </button>
        </form>
    );
};

export default ResetPassword;