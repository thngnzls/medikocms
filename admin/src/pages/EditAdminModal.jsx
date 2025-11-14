import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { backendUrl } from '../App'
import { toast } from 'react-toastify'

// --- Reusable Spinner ---
const Spinner = () => (
  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
)

// --- Reusable Toggle Switch Component ---
const ToggleSwitch = ({ label, checked, onChange, disabled }) => (
  <label className="flex items-center justify-between cursor-pointer">
    <span className="font-medium text-gray-700">{label}</span>
    <div className="relative">
      <input 
        type="checkbox" 
        className="sr-only" 
        checked={checked} 
        onChange={onChange} 
        disabled={disabled}
      />
      <div className={`block w-14 h-8 rounded-full ${checked ? 'bg-red-500' : 'bg-gray-300'}`}></div>
      <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${checked ? 'translate-x-6' : ''}`}></div>
    </div>
  </label>
)

const inputBaseClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-sm"

const EditAdminModal = ({ token, user, onClose, onUpdate }) => {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "admin",
    suspended: false,
  })

  // Pre-fill form when user prop is available
  useEffect(() => {
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
      setFormData({
        name: fullName,
        email: user.email || "",
        role: user.role || "admin",
        suspended: user.suspended || false,
      })
    }
  }, [user])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const updateUser = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    
    const nameParts = formData.name.trim().split(/\s+/)
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(" ") || ""
    
    try {
      const response = await axios.put(
        backendUrl + `/api/user/${user._id}`,
        { 
          // Send all fields as per your original logic
          email: formData.email,
          role: formData.role,
          suspended: formData.suspended,
          firstName,
          lastName,
        },
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success("User updated successfully")
        onUpdate() // Triggers close and refetch
      } else {
        toast.error(response.data.message || "Update failed")
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-gray-800">Edit Admin</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600" disabled={isLoading}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={updateUser} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              className={inputBaseClass}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              className={inputBaseClass}
              required
            />
          </div>

          {/* --- NEW: Suspension Toggle --- */}
          <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mt-2">
            <ToggleSwitch
              label="Suspend User"
              checked={formData.suspended}
              onChange={(e) => setFormData(prev => ({ ...prev, suspended: e.target.checked }))}
              disabled={isLoading}
            />
          </div>

          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold text-sm hover:bg-gray-300 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-black text-white rounded-lg font-semibold text-sm hover:bg-gray-800 transition-colors flex items-center gap-2 disabled:bg-gray-400"
              disabled={isLoading}
            >
              {isLoading ? <Spinner /> : null}
              {isLoading ? "Updating..." : "Update Admin"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditAdminModal