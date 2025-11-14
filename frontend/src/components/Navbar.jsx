// src/components/Navbar.jsx (Customer Facing)

"use client"

import { useContext, useState, useEffect } from "react"
import { assets } from "../assets/assets"
import { Link, NavLink, useNavigate } from "react-router-dom"
import { ShopContext } from "../context/ShopContext" 
import { FaUserCircle } from "react-icons/fa"
import { FaHeart } from "react-icons/fa"
import axios from 'axios'

import NotificationBell from './NotificationBell'; 

const Navbar = () => {
    const [visible, setVisible] = useState(false)
    const [showGame, setShowGame] = useState(false)
    const [currentQuestion, setCurrentQuestion] = useState(0)
    const [feedback, setFeedback] = useState("")
    const [score, setScore] = useState(0)
    const [finished, setFinished] = useState(false)

    const navigate = useNavigate()
    const { setShowSearch, getCartCount, token, setToken, setCartItems, getWishlistCount, userName, setUserName, backendUrl } = useContext(ShopContext)
    
    useEffect(() => {
        const fetchUserData = async () => {
            if (token && backendUrl) {
                try {
                    const response = await axios.get(backendUrl + "/api/user/get-user-data", { headers: { token } })
                    
                    if (response.data.success) {

                        const userFirstName = response.data.user?.firstName; 
                        
                        if (userFirstName) {
                            setUserName(userFirstName); 
                        } else {
                            setUserName("User"); 
                        }
                    } else {
                        console.error("Failed to fetch user data:", response.data.message)
                        setUserName("")
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error)
                    setUserName("")
                }
            }
        }
        fetchUserData()
    }, [token, backendUrl, setUserName])

    const logout = () => {
        navigate("/login")
        localStorage.removeItem("token")
        setToken("")
        setCartItems({})
        setUserName("")
    }
    const HeartIcon = ({ className }) => <FaHeart className={className} />


    return (
        <div className="flex items-center justify-between py-5 font-medium">
            <Link to="/">
                <img src={assets.logo || "/placeholder.svg"} className="w-36" alt="Logo" />
            </Link>

            <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
                <NavLink to="/" className={getNavLinkClass}>HOME</NavLink>
                <NavLink to="/collection" className={getNavLinkClass}>PRODUCTS</NavLink>
                <NavLink to="/about" className={getNavLinkClass}>ABOUT</NavLink>
                <NavLink to="/contact" className={getNavLinkClass}>CONTACT</NavLink>
            </ul>

            <div className="flex items-center gap-6">
                
                <img
                    onClick={() => {
                        setShowSearch(true)
                        navigate("/collection")
                    }}
                    src={assets.search_icon || "/placeholder.svg"}
                    className="w-5 cursor-pointer"
                    alt="Search icon"
                />

                <div className="group relative flex items-center gap-2">
                    {token ? (
                        <>
                            <FaUserCircle className="w-5 h-5 text-gray-700 cursor-pointer" />
                        </>
                    ) : (
                        <img
                            onClick={() => navigate("/login")}
                            className="w-5 cursor-pointer"
                            src={assets.profile_icon || "/placeholder.svg"}
                            alt="Profile icon"
                        />
                    )}
                    {token && (
                        <div className="group-hover:block hidden absolute dropdown-menu right-0 top-full pt-4 z-10">
                            <div className="flex flex-col gap-2 w-36 py-3 px-5 bg-slate-100 text-gray-500 rounded shadow-lg">
                                <p onClick={() => navigate("/profile")} className="cursor-pointer hover:text-black">My Profile</p>
                                <p onClick={() => navigate("/orders")} className="cursor-pointer hover:text-black">Orders</p>
                                <p onClick={logout} className="cursor-pointer hover:text-black">Logout</p>
                            </div>
                        </div>
                    )}
                </div>

                {token && <NotificationBell />} 


                <Link to="/wishlist" className="relative group">
                    <HeartIcon className="w-5 h-5 cursor-pointer transition-colors text-gray-700 hover:text-red-500" />
                    {getWishlistCount() > 0 && (
                        <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-red-500 text-white aspect-square rounded-full text-[8px]">
                            {getWishlistCount()}
                        </p>
                    )}
                </Link>

                {/* 🛒 Cart */}
                <Link to="/cart" className="relative">
                    <img src={assets.cart_icon || "/placeholder.svg"} className="w-5 min-w-5" alt="Cart icon" />
                    <p className="absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px]">
                        {getCartCount()}
                    </p>
                </Link>
            </div>

        </div>
    )
}

const getNavLinkClass = ({ isActive }) =>
    `transition-colors duration-200 ${isActive 
    ? "text-green-600 border-b-2 border-green-600 pb-1" 
    : "hover:text-green-600"}`; 
                                
export default Navbar