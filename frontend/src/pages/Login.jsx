"use client"

import { useContext, useEffect, useState } from "react"
import { ShopContext } from "../context/ShopContext"
import axios from "axios"
import { toast } from "react-toastify"
import { FaEye, FaEyeSlash } from "react-icons/fa"
import Swal from "sweetalert2" // Ensure SweetAlert is installed: npm install sweetalert2

const Login = () => {
  const [currentState, setCurrentState] = useState("Login")
  const { token, setToken, navigate, backendUrl } = useContext(ShopContext)
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [email, setEmail] = useState("")
  const [address, setAddress] = useState("")
  const [phone, setPhone] = useState("")
  const [username, setUsername] = useState("")
  const [errors, setErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // --- Validation Functions (Standard) ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email) && email.endsWith(".com")
  }

  const validatePhone = (phone) => {
    const phoneRegex = /^0\d{10}$/
    return phoneRegex.test(phone)
  }

  // --- UPDATED VALIDATION LOGIC ---
  // This function now returns the errors object instead of setting state
  // to prevent bugs with stale state during submission.
  const validateInputs = () => {
    const newErrors = {}

    if (currentState === "Sign Up") {
      if (!firstName.trim()) newErrors.firstName = "First name is required."
      if (!lastName.trim()) newErrors.lastName = "Last name is required."
      if (!username.trim()) newErrors.username = "Username is required."
      if (!validateEmail(email)) newErrors.email = "Please enter a valid email address ending with .com."
      if (password.length < 8) newErrors.password = "Password must be at least 8 characters." 
      if (password !== confirmPassword) newErrors.confirmPassword = "Passwords do not match."
      if (!validatePhone(phone)) newErrors.phone = "Phone number must start with 0 and be 11 digits (e.g., 09xxxxxxxxx)."
      if (!address.trim()) newErrors.address = "Address is required."
    } else {
      if (!email.trim()) newErrors.email = "Email is required."
      // Allow valid email check to be skipped if field is empty, but required check will catch it
      if (email.trim() && !validateEmail(email)) newErrors.email = "Please enter a valid email address ending with .com."
      if (!password) newErrors.password = "Password is required."
    }
    
    // We return the errors object now
    return newErrors
  }
  // ---------------------------------------------

  // --- Core Submission Logic ---
  const onSubmitHandler = async (event) => {
    event.preventDefault()

    // --- NEW VALIDATION HANDLING ---
    const newErrors = validateInputs() // Get errors object
    setErrors(newErrors) // Set state

    // Check if the newErrors object has any keys
    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0] // Get first error
      if (firstError) {
        toast.error(firstError); // Toast the first error
      }
      return // Stop submission
    }
    // --- End of new error handling ---

    try {
      let response;

      if (currentState === "Sign Up") {
        response = await axios.post(backendUrl + "/api/user/register", {
          firstName, lastName, email, password, address, phone, username,
        })
      } else {
        // --- LOGIN LOGIC ---
        response = await axios.post(backendUrl + "/api/user/login", { email, password })
      }
          
      const data = response.data;
      
      // Handle Verification Required (Applies to both Sign Up and Login)
      if (data.toVerify) {
        toast.info(data.message);
        await promptOtpVerification(email);
        return 
      }

      // Handle Success
      if (data.success) {
        if (data.token) {
          setToken(data.token)
          localStorage.setItem("token", data.token)
          toast.success("Login successful! Welcome, " + (data.name || "User") + "!")
          navigate("/")
        } else {
          // Success case for registration without immediate login
          toast.success("Account created successfully! Please check your email to verify.");
          setCurrentState("Login");
        }
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      console.error("Authentication Error:", error)
      const errorMessage = error.response?.data?.message || "An error occurred during submission. Please try again.";
      toast.error(errorMessage);
    }
  }
  // ---------------------------------------------

  
  // --- NEW: Forgot Password Function ---
  const handleForgotPassword = async () => {
    const { value: email } = await Swal.fire({
      title: 'Forgot Password?',
      input: 'email',
      inputLabel: 'Enter your email address',
      inputPlaceholder: 'We will send a reset link to your email.',
      showCancelButton: true,
      confirmButtonText: 'Send Link',
      inputValidator: (value) => {
        if (!value) {
          return 'You need to write something!'
        }
        if (!validateEmail(value)) {
          return 'Please enter a valid email address.'
        }
      }
    });

    if (email) {
      try {
        Swal.fire({
          title: 'Sending link...',
          text: 'Please wait.',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        const response = await axios.post(backendUrl + "/api/user/forgot-password", { email });
        
        Swal.close();

        if (response.data.success) {
          Swal.fire(
            'Link Sent!',
            response.data.message,
            'success'
          );
        } else {
          Swal.fire(
            'Error',
            response.data.message,
            'error'
          );
        }
      } catch (error) {
        Swal.close();
        const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
        Swal.fire('Error', errorMessage, 'error');
      }
    }
  }
  // ------------------------------------


  // --- OTP and Verification Functions ---
  const resendOtp = async (userEmail) => {
    try {
        const resendResponse = await axios.post(backendUrl + "/api/user/send-verification", { email: userEmail });
        if (resendResponse.data.success) {
            toast.success("New code sent! Please check your email.");
            return true;
        } else {
            toast.error(resendResponse.data.message);
            return false;
        }
    } catch (error) {
        console.error("Resend OTP Error:", error);
        toast.error("Failed to resend code due to network error.");
        return false;
    }
  }

  const promptOtpVerification = async (userEmail) => {
    while(true) {
        const { isConfirmed: showInput, dismiss } = await Swal.fire({
            icon: "info",
            title: "Email Verification Required",
            html: `
                <p>We've sent a 6-digit OTP to your email: <strong>${userEmail}</strong>.</p>
                <p class="text-sm mt-3">Did not receive it? <button id="resend-otp-btn" class="text-green-600 hover:underline font-bold">Resend Code</button></p>
            `,
            confirmButtonText: "Enter OTP",
            showCancelButton: true,
            cancelButtonText: "Cancel",
            allowOutsideClick: false,
            didOpen: () => {
                const resendBtn = document.getElementById('resend-otp-btn');
                if (resendBtn) {
                  resendBtn.onclick = async () => {
                      Swal.close();
                      await resendOtp(userEmail); 
                  };
                }
            },
        });

        if (dismiss === Swal.DismissReason.cancel || dismiss === Swal.DismissReason.close) {
            return; 
        }

        if (showInput) {
            const { value: otp, dismiss: inputDismiss } = await Swal.fire({
                title: "Enter OTP Code",
                input: "text",
                inputLabel: "Enter the 6-digit code sent to your email",
                inputPlaceholder: "e.g. 123456",
                showCancelButton: true,
                confirmButtonText: "Verify",
                inputValidator: (value) => {
                    if (!value || value.length !== 6 || !/^\d{6}$/.test(value)) {
                        return 'Please enter a valid 6-digit code!';
                    }
                },
            });

            if (inputDismiss === Swal.DismissReason.cancel) {
                continue; 
            }

            if (otp) {
                try {
                    const verifyResponse = await axios.post(backendUrl + "/api/user/verify-email", {
                        email: userEmail,
                        code: otp,
                    });

                    if (verifyResponse.data.success) {
                        toast.success(verifyResponse.data.message);
                        
                        const newToken = verifyResponse.data.token;
                        if (newToken) {
                            setToken(newToken);
                            localStorage.setItem("token", newToken);
                            navigate("/");
                        }
                        return; 
                    } else {
                        toast.error(verifyResponse.data.message);
                        
                        const errorAction = await Swal.fire({
                            icon: 'error',
                            title: 'Verification Failed',
                            text: verifyResponse.data.message,
                            showCancelButton: true,
                            confirmButtonText: 'Try Again',
                            cancelButtonText: 'Resend Code',
                        });

                        if (errorAction.dismiss === Swal.DismissReason.cancel) {
                            Swal.close();
                            await resendOtp(userEmail); 
                        }
                    }
                } catch (verifyError) {
                    console.error("OTP Verification Failed:", verifyError);
                    toast.error("OTP verification failed due to a network error.");
                }
            }
        }
    }
  }
  // --- End of OTP Functions ---


  useEffect(() => {
    if (token) {
      navigate("/")
    }
  }, [token, navigate])
  
  // --- JSX Return (Input Fields and Structure Remain the Same) ---
  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col w-[90%] sm:max-w-xl m-auto gap-4 p-8 bg-white rounded-lg shadow-md text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mb-2 mt-4 self-center">
        <p className="prata-regular text-3xl">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Login" ? (
        <>
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
            placeholder="Email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-[-8px]">{errors.email}</p>}

          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type={showPassword ? "text" : "password"}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
              placeholder="Password"
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.password && <p className="text-red-500 text-sm mt-[-8px]">{errors.password}</p>}
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <input
                onChange={(e) => setFirstName(e.target.value)}
                value={firstName}
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
                placeholder="First Name"
              />
              {errors.firstName && <p className="text-red-500 text-sm">{errors.firstName}</p>}
            </div>
            <div>
              <input
                onChange={(e) => setLastName(e.target.value)}
                value={lastName}
                type="text"
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
                placeholder="Last Name"
              />
              {errors.lastName && <p className="text-red-500 text-sm">{errors.lastName}</p>}
            </div>
          </div>
          <input
            onChange={(e) => setUsername(e.target.value)}
            value={username}
            type="text"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.username ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
            placeholder="Username"
          />
          {errors.username && <p className="text-red-500 text-sm mt-[-8px]">{errors.username}</p>}
          <input
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            type="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
            placeholder="Email"
          />
          {errors.email && <p className="text-red-500 text-sm mt-[-8px]">{errors.email}</p>}
          <div className="relative">
            <input
              onChange={(e) => setPassword(e.target.value)}
              value={password}
              type={showPassword ? "text" : "password"}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 pr-10 ${errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
              placeholder="Password"
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
              type={showConfirmPassword ? "text" : "password"}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 pr-10 ${errors.confirmPassword ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
              placeholder="Confirm Password"
            />
            <span
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 cursor-pointer"
            >
              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
            </span>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-[-8px]">{errors.confirmPassword}</p>}
          <input
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "")
              setPhone(value)
              if (value && !validatePhone(value)) {
                setErrors((prev) => ({ ...prev, phone: "Phone number must start with 0 and be exactly 11 digits." }))
              } else {
                setErrors((prev) => {
                  const { phone, ...rest } = prev
                  delete rest.phone; // Correctly remove the phone error
                  return rest
                })
              }
            }}
            value={phone}
            type="text"
            maxLength="11"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 ${errors.phone ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
            placeholder="Phone Number (e.g. 09xxxxxxxxx)"
          />
          {errors.phone && <p className="text-red-500 text-sm mt-[-8px]">{errors.phone}</p>}
          <textarea
            onChange={(e) => setAddress(e.target.value)}
            value={address}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 resize-none ${errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-600'}`}
            placeholder="Address"
            rows="3"
          />
          {errors.address && <p className="text-red-500 text-sm mt-[-8px]">{errors.address}</p>}
        </>
      )}

      <div className="w-full flex justify-between text-sm mt-[-8px]">
        {currentState === "Login" ? (
          <p onClick={() => { setCurrentState("Sign Up"); setErrors({}); }} className="cursor-pointer text-gray-600 hover:underline">
            Create account
          </p>
        ) : (
          <p onClick={() => { setCurrentState("Login"); setErrors({}); }} className="cursor-pointer text-gray-600 hover:underline">
            Login Here
          </p>
        )}

        {/* --- NEW: Forgot Password Link --- */}
        {currentState === "Login" && (
          <p onClick={handleForgotPassword} className="cursor-pointer text-gray-600 hover:underline">
            Forgot Password?
          </p>
        )}
      </div>

      <button className="bg-green-600 text-white font-light px-8 py-2 mt-4 rounded-md hover:bg-green-700 transition-colors">
        {currentState === "Login" ? "Sign In" : "Sign Up"}
      </button>
    </form>
  )
}

export default Login