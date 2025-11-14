// src/context/AdminContext.jsx

import React, { createContext, useState, useEffect, useCallback, useRef } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"; 

// Set the timeout for inactivity (e.g., 30 minutes)
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; 

export const AdminContext = createContext(null);

const AdminContextProvider = (props) => {
    // 1. Token state is now managed here
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    
    const navigate = useNavigate();
    const timeoutRef = useRef(null);

    // Sync token with localStorage whenever it changes
    useEffect(() => {
        localStorage.setItem('token', token);
    }, [token]);


    /**
     * Handles the cleanup for user state and redirection.
     * @param {string} message - The notification message.
     */
    const handleLogout = (message = 'You have been logged out.') => {
        if (!token) return;

        // Clear State and Storage
        setToken('');
        localStorage.removeItem('token');
        
        toast.warn(message);
        navigate('/login'); // Redirect to your admin login route
    };
    
    /**
     * Resets the inactivity timer. This function is called on user activity.
     */
    const resetTimer = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        if (token) {
            timeoutRef.current = setTimeout(() => {
                handleLogout('Your session has timed out due to inactivity. Please log in again.');
            }, SESSION_TIMEOUT_MS);
        }
    }, [token]);

    /**
     * useEffect for setting up global activity listeners.
     */
    useEffect(() => {
        const activityEvents = ['mousemove', 'mousedown', 'click', 'scroll', 'keypress', 'touchstart'];

        activityEvents.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        resetTimer();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            activityEvents.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [resetTimer]); 


    const contextValue = { 
        token, 
        setToken,
        handleLogout,
        // Add other admin-specific functions/state here
    };

    return (
        <AdminContext.Provider value={contextValue}>
            {props.children}
        </AdminContext.Provider>
    );
};

export default AdminContextProvider;