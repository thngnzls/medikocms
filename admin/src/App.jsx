import React, { useEffect, useState } from 'react';
import Sidebar from './components/Sidebar';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom'; 
import Add from './pages/Add';
import List from './pages/List';
import Orders from './pages/Orders';
import Inventory from './pages/Inventory';
import Login from './components/Login';
import User from './pages/AdminUser';
import CustomerData from './pages/CustomerData';
import SalesAnalytics from './pages/SalesAnalytics';
import { ToastContainer, toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';
import CreateAdmin from './components/AddAdmin';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = '₱';

const App = () => {
    const [token, setToken] = useState(localStorage.getItem('token') || '');
    const [showCreateAdmin, setShowCreateAdmin] = useState(false);
    const navigate = useNavigate(); 

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (token && token !== storedToken) {
            localStorage.setItem('token', token);
        } else if (!token && storedToken) {
            localStorage.removeItem('token');
        }
        if (token) {
            setShowCreateAdmin(false);
        }
    }, [token]);

    const navigateToLogin = () => setShowCreateAdmin(false);
    const navigateToCreateAdmin = () => setShowCreateAdmin(true);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(""); 
        toast.success("Logged out successfully");
        navigate('/login'); 
    };

    const AuthView = () => {
        if (showCreateAdmin) {
            return <CreateAdmin setToken={setToken} onLoginClick={navigateToLogin} />;
        } else {
            return <Login setToken={setToken} onCreateAdminClick={navigateToCreateAdmin} />;
        }
    };

    const MainLayout = () => (
        <div className='flex w-full'>
            <Sidebar onLogout={handleLogout} />
            <div className='flex-1 p-6 lg:p-8 max-w-7xl mx-auto'>
                <Routes>
                    <Route path='/' element={<SalesAnalytics token={token} />} />
                    <Route path='/add' element={<Add token={token} />} />
                    <Route path='/list' element={<List token={token} />} />
                    <Route path='/orders' element={<Orders token={token} />} />
                    <Route path='/inventory' element={<Inventory token={token} />} />
                    <Route path='/user' element={<User token={token} />} />
                    <Route path='/customer-data' element={<CustomerData token={token} />} />
                    <Route path='/sales-analytics' element={<SalesAnalytics token={token} />} />
                    <Route path='*' element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        </div>
    );

    return (
        <div className='bg-gray-50 min-h-screen'>
            <ToastContainer position="top-right" autoClose={3000} />
            <Routes>
                <Route path="/login" element={
                    token === "" ? <AuthView /> : <Navigate to="/" replace />
                } />

                <Route path="/*" element={
                    token !== "" ? <MainLayout /> : <Navigate to="/login" replace />
                } />
            </Routes>
        </div>
    );
}

export default App;