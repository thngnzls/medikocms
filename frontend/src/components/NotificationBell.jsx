// src/components/NotificationBell.jsx

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { IoIosNotifications } from "react-icons/io"; 
import { ShopContext } from '../context/ShopContext'; 

const NotificationBell = () => {
    const { token, backendUrl } = useContext(ShopContext); 
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    const unreadCount = notifications.filter(n => !n.isRead).length;

    const fetchNotifications = async () => {
        if (!token || !backendUrl) return;

        try {
            const response = await axios.get(`${backendUrl}/api/notification/customer-list`, {
                headers: { token } 
            });
            
            if (response.data.success) {
                // Sort by creation date (newest first)
                setNotifications(response.data.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (error) {
            console.error("Failed to fetch customer notifications:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const intervalId = setInterval(fetchNotifications, 60000); 
        return () => clearInterval(intervalId); 
    }, [token, backendUrl]); 
    
    // Mark notification as read when clicked
    const handleNotificationClick = async (id, link, isRead) => {
        setShowDropdown(false);

        // Only make the API call if the notification is currently unread
        if (!isRead) {
            try {
              
                setNotifications(prevNotifications => 
                    prevNotifications.map(n => 
                        n._id === id ? { ...n, isRead: true } : n
                    )
                );

                // 2. Make the API call to update the database
                await axios.put(`${backendUrl}/api/notification/mark-read`, { id }, { 
                    headers: { token } 
                });
                
            

            } catch (error) {
                console.error("Failed to mark notification as read:", error);
            }
        }
        
        // Navigate to the linked page
        navigate(link);
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.notification-bell-container')) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showDropdown]);


    return (
        <div className="relative notification-bell-container">
            <button 
                onClick={() => setShowDropdown(!showDropdown)}
                className="p-2 relative hover:bg-yellow-200 rounded-full transition"
            >
                <IoIosNotifications className="w-6 h-6 text-gray-700" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                    <div className="py-2 max-h-80 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="px-4 py-2 text-sm text-gray-500">No recent alerts.</p>
                        ) : (
                            notifications.slice(0, 10).map((n) => (
                                <div 
                                    key={n._id}
                                    onClick={() => handleNotificationClick(n._id, n.link, n.isRead)}
                                    className={`px-4 py-3 cursor-pointer border-b last:border-b-0 transition 
                                        ${n.isRead ? 'bg-white text-gray-600 hover:bg-gray-50' : 'bg-blue-50 text-gray-900 hover:bg-blue-100 font-medium'}`}
                                >
                                    <p className="text-sm">{n.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString()} · {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;