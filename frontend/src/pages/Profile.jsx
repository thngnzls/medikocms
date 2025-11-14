// use client

import { useEffect, useState, useRef } from "react"
import { toast } from "react-toastify"

// --- Placeholder Component (Required to prevent runtime error) ---
const OrderHistory = () => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Your Orders</h3>
            <p className="text-gray-600">This is where your order history will be displayed. Content coming soon!</p>
        </div>
    );
};
// ------------------------------------------------------------------

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (form.newPassword !== form.confirmNewPassword) {
            toast.error("New password and confirmation do not match.");
            return;
        }
        if (form.newPassword.length < 8) {
            toast.error("New password must be at least 8 characters long.");
            return;
        }

        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:4000/api/user/change-password", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
  
                body: JSON.stringify({
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }),
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                localStorage.removeItem("token");
                window.location.href = '/login';
            } else {
                toast.error(data.message || "Failed to change password.");
            }
        } catch (error) {
            toast.error("An API error occurred while changing password.");
        } finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Change Password</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input 
                        type="password" name="currentPassword" placeholder="Current Password"
                        onChange={handleInputChange} required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    <input type="password" name="newPassword" placeholder="New Password (min 8 chars)"
              
                        onChange={handleInputChange} required
                        className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    <input type="password" name="confirmNewPassword" placeholder="Confirm New Password"
                        onChange={handleInputChange} required
        
                        className="w-full px-4 py-2 border rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={onClose} disabled={isSubmitting}
                          
                            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                        <button type="submit" disabled={isSubmitting}
                            className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isSubmitting ?
                                'Updating...' : 'Save New Password'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DeactivateAccountModal = ({ isOpen, onClose }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleDeactivate = async () => {
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:4000/api/user/deactivate", {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                localStorage.removeItem("token");
                window.location.href = '/login'; 
            } else {
                toast.error(data.message || "Failed to deactivate account.");
            }
        } catch (error) {
            toast.error("An API error occurred during deactivation.");
        } finally {
            setIsSubmitting(false);
        }
    };
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
                <h3 className="text-xl font-bold mb-4 text-red-700">Confirm Deactivation</h3>
                <p className="mb-6 text-gray-600">
                    Are 
                    you sure you want to deactivate your account? Your account will be flagged as suspended/deleted and you will be logged out immediately.
                </p>
                <div className="flex justify-end space-x-3 pt-2">
                    <button type="button" onClick={onClose} disabled={isSubmitting}
                    
                        className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50">Cancel</button>
                    <button onClick={handleDeactivate} disabled={isSubmitting}
                        className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {isSubmitting ?
                            'Processing...' : 'Deactivate Account'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const NotificationPreferences = () => {
    const [prefs, setPrefs] = useState({
        emailUpdates: true,
        smsAlerts: false,
        productAnnouncements: true,
        securityAlerts: true,
    });
    const handleToggle = (name) => {
        setPrefs(prev => ({ ...prev, [name]: !prev[name] }));
        toast.info(`Toggled ${name}. Remember to save!`, { autoClose: 1500 });
    };
    const handleSave = () => {
        toast.success("Notification preferences saved successfully! 🔔");
        console.log("Saving preferences:", prefs);
    };

    const ToggleSwitch = ({ checked, onChange }) => (
        <button
            type="button"
            onClick={onChange}
            className={`${checked ? 'bg-green-600' : 'bg-gray-200'}
                relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500`}
        >
 
            <span
                aria-hidden="true"
                className={`${checked ? 'translate-x-5' : 'translate-x-0'}
                    pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
            ></span>
        </button>
  
    );

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-6 border-b pb-3">Notification Preferences</h3>

            <div className="space-y-6">
                <div className="flex items-center justify-between border-b pb-4">
                    <div>
         
                        <p className="font-medium text-gray-700">Email Updates</p>
                        <p className="text-sm text-gray-500">Receive promotional and marketing emails.</p>
                    </div>
                    <ToggleSwitch checked={prefs.emailUpdates} onChange={() => handleToggle('emailUpdates')} />
       
                </div>

                <div className="flex items-center justify-between border-b pb-4">
                    <div>
                        <p className="font-medium text-gray-700">SMS Alerts</p>
                       
                        <p className="text-sm text-gray-500">Get text messages for critical account activities.</p>
                    </div>
                    <ToggleSwitch checked={prefs.smsAlerts} onChange={() => handleToggle('smsAlerts')} />
                </div>

                <div className="flex items-center justify-between border-b pb-4">
         
                    <div>
                        <p className="font-medium text-gray-700">Product Announcements</p>
                        <p className="text-sm text-gray-500">Be the first to know about new features and updates.</p>
                    </div>
       
                    <ToggleSwitch checked={prefs.productAnnouncements} onChange={() => handleToggle('productAnnouncements')} />
                </div>

                <div className="flex items-center justify-between">
                    <div>
                        <p className="font-medium text-gray-700">Security 
                            Alerts</p>
                        <p className="text-sm text-red-500 font-semibold">Mandatory: You must receive security alerts.</p>
                    </div>
                    <ToggleSwitch checked={prefs.securityAlerts} onChange={() => { /* Always true, no action */ }} />
                
                </div>

                <div className="flex justify-end pt-4">
                    <button
                        onClick={handleSave}
                        className="px-6 py-2.5 text-base bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md"
     
                    >
                        Save Preferences
                    </button>
                </div>
            </div>
        </div>
    
    );
};

const AccountSettings = ({ setIsPasswordModalOpen, setIsDeactivateModalOpen }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b pb-3">Account Security</h3>
            <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                 
                    <div>
                        <p className="font-medium text-gray-700">Change Password</p>
                        <p className="text-sm text-gray-500">Update your account password for enhanced security.</p>
                    </div>
                  
                    <button
                        onClick={() => setIsPasswordModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-100 rounded-full hover:bg-indigo-200 transition-colors"
                    >
                    
                        Update
                    </button>
                </div>
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                    <div>
                
                        <p className="font-medium text-red-700">Deactivate Account</p>
                        <p className="text-sm text-red-500">Permanently close your account.
                            This action cannot be undone.</p>
                    </div>
                    <button
                        onClick={() => setIsDeactivateModalOpen(true)}
                        className="px-4 py-2 text-sm font-medium text-white bg-red-600 
                        rounded-full hover:bg-red-700 transition-colors"
                    >
                        Deactivate
                    </button>
                </div>
            </div>
      
        </div>
    )
}

const ProfileContent = ({ user, editForm, isEditing, isSaving, handleInputChange, handleEdit, handleCancel, handleSave }) => {
    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-8 border-b pb-3">
                <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
                {/* Action Buttons */}
    
                {!isEditing ? (
                    <button
                        onClick={handleEdit}
                        className="flex items-center gap-2 px-5 py-2.5 text-base bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors shadow-md transform hover:scale-105"
     
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                         
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                             
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                            />
                        </svg>
                        Edit Profile
            
                    </button>
                ) : (
                    <div className="flex gap-3">
                        <button
                            
                            onClick={handleCancel}
                            disabled={isSaving}
                            className="px-5 py-2.5 text-base text-gray-600 border border-gray-300 bg-white rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
          
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
      
                            disabled={isSaving}
                            className="px-5 py-2.5 text-base bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
                        >
             
                            {isSaving ?
                                (
                                <>
                                    <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24">
                       
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path
                                     
                                            className="opacity-75"
                                            fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 
                                                0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                        ></path>
                                    </svg>
          
                                    Saving...
                                </>
                            ) : (
            
                                "Save Changes"
                            )}
                        </button>
                    </div>
       
                )}
            </div>

            {isEditing ?
                (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
 
                            <input
                                type="text"
                                name="firstName"
         
                                value={editForm.firstName}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
   
                                placeholder="Enter your first name"
                                required
                            />
        
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                          
                            <input
                                type="text"
                                name="lastName"
                                value={editForm.lastName}
  
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            
                                placeholder="Enter your last name"
                                required
                            />
                        </div>
         
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                        <input
               
                            type="email"
                            name="email"
                            value={editForm.email}
                            onChange={handleInputChange}
   
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-gray-100 cursor-not-allowed"
                            placeholder="Enter your email"
                            disabled
         
                        />
                        <p className="text-xs text-gray-500 mt-1">Contact support to change your primary email.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                      
                                type="tel"
                                name="phone"
                                value={editForm.phone}
                          
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                placeholder="Enter your phone number"
                 
                            />
                        </div>
                    </div>
                    <div>
                        <label 
                            className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                        <textarea
                            name="address"
                            value={editForm.address}
                
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      
                            placeholder="Enter your full address"
                        />
                    </div>
                </div>
            ) : (
                <div 
                    className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-2">
                            <div className="p-1.5 bg-blue-100 rounded-full mr-3">
            
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                   
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
               
                                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                    />
                     
                                </svg>
                            </div>
                            <p className="text-sm font-medium text-gray-700">Full Name</p>
                        </div>
     
                        <p className="text-lg font-light text-gray-900 ml-8">
                            {user.firstName ||
                                "N/A"} {user.lastName || ""}
                        </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center 
                            mb-2">
                            <div className="p-1.5 bg-blue-100 rounded-full mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                           
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                            </div>
    
                            <p className="text-sm font-medium text-gray-700">Email Address</p>
                        </div>
                        <p className="text-lg font-light text-gray-900 ml-8">{user.email ||
                            "N/A"}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center mb-2">
                           
                            <div className="p-1.5 bg-blue-100 rounded-full mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 
                                        11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                            </div>
                    
                            <p className="text-sm font-medium text-gray-700">Phone Number</p>
                        </div>
                        <p className="text-lg font-light text-gray-900 ml-8">{user.phone ||
                            "N/A"}</p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-sm md:col-span-2">
                        <div className="flex items-center mb-2">
                          
                            <div className="p-1.5 bg-blue-100 rounded-full mr-3">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.828 0l-4.244-4.243a8 8 0 1111.314 0z" />
  
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                   
                            </div>
                            <p className="text-sm font-medium text-gray-700">Address</p>
                        </div>
                        <p className="text-lg font-light text-gray-900 ml-8">{user.address ||
                            "N/A"}</p>
                    </div>
                </div>
            )}
        </div>
    )
}

const Profile = () => {
    const [user, setUser] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
   
    const [activeTab, setActiveTab] = useState('profile');

    // Photo states
    const [profilePhoto, setProfilePhoto] = useState(null)
    const [selectedFile, setSelectedFile] = useState(null)
    const fileInputRef = useRef(null)

    // NEW STATES FOR MODALS
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

    const [editForm, setEditForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
    })


    const getInitial = () => {
        if (!user) return "U"
        if (user.firstName && user.lastName) return `${user.firstName.charAt(0).toUpperCase()}${user.lastName.charAt(0).toUpperCase()}`
        if 
            (user.firstName) return user.firstName.charAt(0).toUpperCase()
        if (user.name) return user.name.charAt(0).toUpperCase()
        return "U"
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target
        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }))
    }

    
    const handleEdit = () => {
        setIsEditing(true)
    }

    const handleCancel = () => {
        setIsEditing(false)
        if (user) {
            setEditForm({
                firstName: user.firstName || "",
                lastName: user.lastName || "",
      
                email: user.email ||
                    "",
                phone: user.phone ||
                    "",
                address: user.address ||
                    "",
            })
        }
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB.")
    
                return
            }
            setSelectedFile(file)
            setProfilePhoto(URL.createObjectURL(file))
            toast.info(`Image selected: ${file.name}. Click 'Upload Photo' to save.`)
        }
    }

    const handleImageUpload = async () => {
        if (!selectedFile) {
 
            toast.error("Please select an image first.")
            return
        }

        setIsSaving(true)

        try {
            const token = localStorage.getItem("token")
            const formData = new FormData()
            formData.append("profileImage", selectedFile)

    
            const res = await fetch("http://localhost:4000/api/user/upload-photo", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
               
                body: formData,
            })

            const data = await res.json()

            if (data.success) {
                setUser(prev => ({ ...prev, photoUrl: data.photoUrl }))
                setProfilePhoto(data.photoUrl)
                setSelectedFile(null)

  
                if (profilePhoto && profilePhoto.startsWith('blob:')) {
                    URL.revokeObjectURL(profilePhoto);
                }

                toast.success("Profile photo uploaded successfully to the cloud! 📸")
            } else {
                toast.error(data.message || "Failed to upload photo.")
                setProfilePhoto(user?.photoUrl || null)
            }
        } catch (error) {
 
            console.error("Image upload error:", error)
            toast.error("An error occurred during photo upload.")
            setProfilePhoto(user?.photoUrl || null)
        } finally {
            setIsSaving(false)
        }
    }

    useEffect(() => {
        const fetchProfile = async () => {
 
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    toast.error("Please login to view your profile")
                    return
      
                }

                const res = await fetch("http://localhost:4000/api/user/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
  
                })
                const data = await res.json()

                if (data.success) {
                    setUser(data.user)
                    setProfilePhoto(data.user.photoUrl ||
                        null)
                    setEditForm({
                        firstName: data.user.firstName || "",
                        lastName: data.user.lastName || "",
                        email: data.user.email
                            || "",
                        phone: data.user.phone || "",
                        address: data.user.address || "",
                    })
                } else {
       
                    toast.error(data.message || "Failed to load profile")
                }
            } catch (error) {
                console.error("Profile fetch error:", error)
                toast.error("Failed to load profile")
            } 
            finally {
                setIsLoading(false)
            }
        }

        fetchProfile()
    }, [])

    const handleSave = async () => {
        setIsSaving(true)

        try {
            const token = localStorage.getItem("token")
        
            if (!token) {
                toast.error("Please login to update your profile")
                return
            }

            const res = await fetch("http://localhost:4000/api/user/profile", {
                method: "PUT",
           
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(editForm),
            })

      
            const data = await res.json()

            if (data.success) {
                setUser(prev => ({ ...prev, ...data.user }))
                setIsEditing(false)
                // FIX: Removed line break from string literal
                toast.success("Profile updated successfully! 🎉") 
            } else {
                toast.error(data.message || "Failed to update profile")
            }
        } catch (error) {
            console.error("Profile update error:", error)
            toast.error("Failed to update profile")
        } finally {
  
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-600">Loading profile...</p>
            </div>
        )
    }

    
    if (!user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-gray-800 mb-2">Profile Not Found</h3>
                    <p className="text-gray-600">Unable to load your 
                        profile information</p>
                </div>
            </div>
        )
    }

    // --- Main Content ---

    const navItemClasses = (tabName) =>
        `flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-left w-full ${activeTab === tabName
            ? 'bg-indigo-100 text-indigo-700 font-semibold'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
        }`;
    const renderContent = () => {
        switch (activeTab) {
            case 'profile':
                return (
                    <>
                        <ProfileContent
           
                            user={user}
                            editForm={editForm}
                            isEditing={isEditing}
                           
                            isSaving={isSaving}
                            handleInputChange={handleInputChange}
                            handleEdit={handleEdit}
                            handleCancel={handleCancel}
               
                            handleSave={handleSave}
                        />
                        <AccountSettings
                            setIsPasswordModalOpen={setIsPasswordModalOpen}
           
                            setIsDeactivateModalOpen={setIsDeactivateModalOpen}
                        />
                    </>
                );
            case 'orders':
                // Renders the new OrderHistory placeholder component
                return <OrderHistory />;
            case 'notifications':
                return <NotificationPreferences />;
            default:
                return <ProfileContent 
                            user={user}
                            editForm={editForm}
                            isEditing={isEditing}
                            isSaving={isSaving}
                            handleInputChange={handleInputChange}
                            handleEdit={handleEdit}
                            handleCancel={handleCancel}
                            handleSave={handleSave}
                        />; // Default back to profile content
        }
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6 sm:p-12">
            <div className="max-w-7xl mx-auto">

                <div className="mb-6 border-b border-gray-200 pb-4">
                    <h1 className="text-4xl font-extralight text-gray-900 tracking-tight">
                        
                        Account Management
                    </h1>
                    <p className="text-gray-500 mt-2 text-lg">
                        View and update your personal information and account settings.
                    </p>
   
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">

                    {/* Left Column (Photo and Side Navigation) */}
                    <div className="lg:col-span-1">
          
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center sticky top-8">

                            {/* Profile Photo Section */}
                            <div className="relative mb-6 group">
                                <input
              
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageChange}
      
                                    accept="image/*"
                                    style={{ display: 'none' }}
                               
                                />

                                <div
                                    className="w-28 h-28 mx-auto rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 cursor-pointer"
                
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    {profilePhoto ?
                                        (
                                        <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                
                                        getInitial()
                                    )}
                                </div>

        
                                <div
                                    className="absolute inset-0 w-28 h-28 mx-auto rounded-full flex items-center justify-center bg-black bg-opacity-40 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                         
                                    onClick={() => fileInputRef.current.click()}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 
                                        001.664-.89l.812-1.218A2 2 0 0110.373 3H13.63a2 2 0 011.664.89l.812 1.218A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </div>
                            </div>

 
                            {selectedFile && (
                                <button
                                    onClick={handleImageUpload}
   
                                    disabled={isSaving}
                                    className="w-full px-4 py-2 mt-2 text-sm font-medium text-white bg-green-500 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-md"
               
                                >
                                    {isSaving ?
                                        (
                                        <>
                                            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
        
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 
                                                    0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                        
                                            Uploading...
                                        </>
                                    ) : (
                  
                                        "Upload Photo"
                                    )}
                                </button>
         
                            )}


                            <h2 className="text-2xl font-semibold text-gray-800 mt-4 mb-1">
                                {user.firstName ||
                                    user.name || "User"}
                                {user.lastName && <span className="ml-1">{user.lastName}</span>}
                            </h2>
                            <p className="text-gray-500 mb-6 font-light">{user.email}</p>

    
                            {/* Side Navigation */}
                            <div className="space-y-3 pt-4 border-t border-gray-100">
                                <button onClick={() => setActiveTab('profile')} className={navItemClasses('profile')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    Profile & Security
                                </button>
                                <button onClick={() => setActiveTab('notifications')} className={navItemClasses('notifications')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                                    Notifications
                                </button>
                                <button onClick={() => setActiveTab('orders')} className={navItemClasses('orders')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                    Order History
                                </button>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-gray-100 mt-4">
                                <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                                  
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path
                                            strokeLinecap="round"
     
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                 
                                            d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-4 5h.01M12 11V7"
                                        />
                       
                                    </svg>
                                    <span>Joined: **2025**</span>
                                </div>
                  
                                <div className="flex items-center justify-center gap-2 text-sm text-green-600">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                     
                                        <path
                                            fillRule="evenodd"
                                            d="M10 18a8 8 0 100-16 8 8 0 000 
                                                16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                            clipRule="evenodd"
                                        />
 
                                    </svg>
                                    <span className="font-medium">Account Verified</span>
                           
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column (Content) */}
                    <div className="lg:col-span-3 space-y-8">
                        {renderContent()}
                    </div>
                </div>
            </div>

     
            {/* Modals */}
            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={() => setIsPasswordModalOpen(false)}
            />
            <DeactivateAccountModal
                isOpen={isDeactivateModalOpen}
     
                onClose={() => setIsDeactivateModalOpen(false)}
            />
        </div>
    );
};

export default Profile;