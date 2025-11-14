"use client"

import axios from "axios"
import { useEffect, useState, useMemo } from "react"
import { backendUrl } from "../App" // <-- Assuming this is correctly configured now
import { toast } from "react-toastify"
import EditCustomerModal from "./EditCustomerModal" // --- IMPORT NEW MODAL ---

// --- Helper Components (Icons, Badges, Spinners) ---

const ListSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <svg className="animate-spin h-10 w-10 text-gray-800" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  </div>
)

const StatusBadge = ({ suspended }) => {
  const bgColor = suspended ? "bg-red-100" : "bg-green-100"
  const textColor = suspended ? "text-red-700" : "text-green-700"
  const text = suspended ? "Suspended" : "Active"

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {text}
    </span>
  )
}

const PencilIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
  </svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.275.042-.549.09-.816.14m5.192 0c3.043 0 6-1.03 6-3.21v-1.04c0-.289-.009-.577-.026-.86H8.02c-.017.283-.026.57-.026.86v1.04c0 2.18 2.957 3.21 6 3.21Z" />
  </svg>
)

const SuspendIcon = () => ( // Icon for "Suspend"
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 0 0 5.636 5.636m12.728 12.728A9 9 0 0 1 5.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
)

const UnsuspendIcon = () => ( // Icon for "Unsuspend"
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
   <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
  </svg>
)


const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
)

const obscureEmail = (email) => {
  if (!email) return "****";
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [local, domain] = parts;
  if (local.length === 0 || domain.length === 0) return email;
  const obscureLocal = local.charAt(0) + '***';
  const obscureDomain = domain.charAt(0) + '***';
  return `${obscureLocal}@${obscureDomain}`;
};

// --- Filter/Sort Constants ---
const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
];
const SORT_OPTIONS = [
  { value: "default", label: "Default Sort (Newest)" },
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
];


// --- CustomerData Component ---
const CustomerData = ({ token }) => {
  const [customers, setCustomers] = useState([]) // Master list
  const [isListLoading, setIsListLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false) // For delete/suspend actions

  // --- Filter & Sort State ---
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortCriteria, setSortCriteria] = useState("default")

  // --- Modal State ---
  const [editingCustomer, setEditingCustomer] = useState(null)

  // Fetch all users
  const fetchCustomers = async () => {
    setIsListLoading(true)
    try {
      const response = await axios.get(backendUrl + "/api/user/all", { headers: { token } })
      if (response.data.users) {
        const nonAdminUsers = response.data.users
          .filter(user => user.role !== "admin")
          .map(user => ({
            ...user,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email, // Combine name
          }))
          .reverse() // Default sort = newest first
        setCustomers(nonAdminUsers)
      } else {
        toast.error("Failed to fetch customer data")
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsListLoading(false)
    }
  }

  // Delete a user
  const removeCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this customer? This action cannot be undone.")) return
    try {
      setIsLoading(true)
      const response = await axios.delete(backendUrl + `/api/user/${id}`, { headers: { token } })
      if (response.data.success) { // Check for 'success' flag from backend
        toast.success(response.data.message || "Customer deleted successfully")
        await fetchCustomers()
      } else {
        toast.error(response.data.message || "Failed to delete customer")
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Suspend/Unsuspend user
  const toggleSuspend = async (customer) => {
    if (!customer) {
      toast.error("Error: Customer data is missing.")
      return
    }
    const action = customer.suspended ? "unsuspend" : "suspend";
    if (!window.confirm(`Are you sure you want to ${action} this customer?`)) return;

    setIsLoading(true)
    try {
      const response = await axios.put(
        backendUrl + `/api/user/suspend/${customer._id}`, // Assuming a dedicated suspend endpoint
        { suspended: !customer.suspended }, // Send only the suspended status
        { headers: { token } }
      )
      
      if (response.data.success) {
        toast.success(`Customer ${action}ed successfully`)
        await fetchCustomers()
      } else {
        toast.error(response.data.message || `Failed to ${action} customer`)
      }
    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if(token) { // Only fetch if token is available
      fetchCustomers()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // Process list with filters and sorting
  const processedList = useMemo(() => {
    let items = [...customers]

    // 1. Filter by Name/ID (Search)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase()
      items = items.filter(
        (customer) =>
          customer.name.toLowerCase().includes(lowerSearch) ||
          customer._id.toLowerCase().includes(lowerSearch)
      )
    }

    // 2. Filter by Status
    if (statusFilter !== "all") {
      const isSuspended = statusFilter === "suspended"
      items = items.filter((customer) => customer.suspended === isSuspended)
    }

    // 3. Apply Sorting
    switch (sortCriteria) {
      case "name-asc":
        items.sort((a, b) => a.name.localeCompare(b.name)); break
      case "name-desc":
        items.sort((a, b) => b.name.localeCompare(a.name)); break
      default: // Default is newest first (already reversed)
        break
    }
    return items
  }, [customers, searchTerm, statusFilter, sortCriteria])

  const handleClearFilters = () => {
    setSearchTerm("")
    setStatusFilter("all")
    setSortCriteria("default")
  }


  if (isListLoading) {
    return <ListSpinner />
  }

  const baseSelectClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-sm"

  return (
    <div className="p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Customer Management</h3>

      {/* --- Filters Section Card --- */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Search */}
          <div className="flex-1 min-w-[180px] lg:col-span-1">
             <label className="block text-sm font-medium text-gray-600 mb-1">Search by Name or ID</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                <SearchIcon />
              </span>
              <input
                type="text"
                placeholder="Name or User ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`${baseSelectClass} pl-10`}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex-1 min-w-[180px]">
            <label className="block text-sm font-medium text-gray-600 mb-1">Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={baseSelectClass}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Sort By Filter */}
          <div className="flex-1 min-w-[180px]">
             <label className="block text-sm font-medium text-gray-600 mb-1">Sort By</label>
            <select value={sortCriteria} onChange={(e) => setSortCriteria(e.target.value)} className={baseSelectClass}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={handleClearFilters} className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
            Clear All Filters
          </button>
        </div>
      </div>


      {/* --- Customer Table --- */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="min-w-[800px]"> {/* Adjust min-width as needed */}
          <div className="grid grid-cols-[1.5fr_2fr_2fr_1fr_1fr] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">User ID</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email (Obscured)</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Action</p>
          </div>

          {processedList.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "No customers match your filters."
                : "No customers found."}
            </div>
          )}

          {processedList.map((customer) => (
            <div
              key={customer._id}
              className="grid grid-cols-[1.5fr_2fr_2fr_1fr_1fr] items-center gap-4 px-4 py-4 border-b border-gray-100 text-sm hover:bg-gray-50 transition-colors"
            >
              <p className="font-mono text-xs text-gray-600 truncate" title={customer._id}>{customer._id}</p>
              <p className="font-medium text-gray-900 truncate" title={customer.name}>{customer.name}</p>
              <p className="text-gray-600 truncate" title="Email is obscured for privacy">{obscureEmail(customer.email)}</p>
              <div>
                <StatusBadge suspended={customer.suspended} />
              </div>
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => setEditingCustomer(customer)}
                  className="p-2 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  title="Edit Customer"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => toggleSuspend(customer)}
                  className={`p-2 rounded-md transition-colors ${
                    customer.suspended 
                      ? 'text-gray-400 hover:bg-green-50 hover:text-green-600' // Unsuspend action
                      : 'text-gray-400 hover:bg-orange-50 hover:text-orange-600' // Suspend action
                  }`}
                  disabled={isLoading}
                  title={customer.suspended ? "Unsuspend Customer" : "Suspend Customer"}
                >
                  {customer.suspended ? <UnsuspendIcon /> : <SuspendIcon />}
                </button>
                <button
                  onClick={() => removeCustomer(customer._id)}
                  className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  disabled={isLoading}
                  title="Delete Customer"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Edit Modal --- */}
      {editingCustomer && (
        <EditCustomerModal
          token={token}
          customer={editingCustomer}
          onClose={() => setEditingCustomer(null)}
          onUpdate={() => {
            setEditingCustomer(null)
            fetchCustomers()
          }}
        />
      )}
    </div>
  )
}

export default CustomerData