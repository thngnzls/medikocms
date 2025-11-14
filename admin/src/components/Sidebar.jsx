import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { assets } from '../assets/assets';

const SidebarLink = ({ to, icon, label }) => {
    const baseClasses = "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ease-in-out";
    const inactiveClasses = "text-gray-500 hover:bg-gray-100 hover:text-gray-900";
    const activeClasses = "bg-green-100 text-green-700 font-semibold";

    return (
        <NavLink to={to} className={({ isActive }) => `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            <img className='w-5 h-5 flex-shrink-0' src={icon} alt="" />
            <p className="truncate">{label}</p>
        </NavLink>
    );
};

const SectionTitle = ({ title }) => (
    <div className="mt-4 mb-2 px-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
    </div>
);

const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100 opacity-100">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Confirm Logout</h3>
                <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out?</p>
                <div className="flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-300 transition-colors">Cancel</button>
                    <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 transition-colors">Logout</button>
                </div>
            </div>
        </div>
    );
};

const Sidebar = ({ onLogout }) => {
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const handleLogoutClick = () => setShowLogoutModal(true);
    const cancelLogout = () => setShowLogoutModal(false);

    const confirmLogout = () => {
        console.log("Logging out...");
        setShowLogoutModal(false);
        if (onLogout) {
            onLogout(); 
        } else {
            console.error("onLogout prop was not passed to Sidebar component!");
            localStorage.removeItem('token');
            window.location.href = '/login'; 
        }
    };

    return (
        <>
            <div className='w-64 min-h-screen bg-white border-r border-gray-200 flex flex-col shadow-lg'>
                <div className='flex items-center justify-center h-20 border-b border-gray-200 px-4'>
                    <img src={assets.logo} alt="Mediko Admin" className="h-10 w-auto"/>
                </div>
                <nav className='flex flex-col gap-1 p-4 flex-grow overflow-y-auto'>
                    <SidebarLink to="/sales-analytics" icon={assets.dashboard} label="Dashboard" />
                    <SectionTitle title="Manage" />
                    <SidebarLink to="/add" icon={assets.add_icon} label="Add Items" />
                    <SidebarLink to="/list" icon={assets.list_icon} label="Product Items" />
                    <SidebarLink to="/orders" icon={assets.order_icon} label="Orders" />
                    <SidebarLink to="/inventory" icon={assets.inventory_icon} label="Inventory" />
                    <SectionTitle title="Users" />
                    <SidebarLink to="/user" icon={assets.user_icon || assets.order_icon} label="Admin Users" />
                    <SidebarLink to="/customer-data" icon={assets.user_icon || assets.order_icon} label="Customers" />
                </nav>
                <div className='p-4 border-t border-gray-200 mt-auto'>
                    <button onClick={handleLogoutClick} className="flex items-center gap-3 rounded-lg px-4 py-2.5 w-full text-sm font-medium transition-all duration-200 ease-in-out text-gray-500 hover:bg-red-100 hover:text-red-700">
                        <img className='w-5 h-5 flex-shrink-0' src={assets.logout} alt="Logout"/>
                        <p className="truncate">LOGOUT</p>
                    </button>
                </div>
            </div>
            <LogoutConfirmationModal isOpen={showLogoutModal} onClose={cancelLogout} onConfirm={confirmLogout}/>
        </>
    );
};

export default Sidebar;