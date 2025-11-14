"use client";

import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import AddAdminModal from "./AddAdminModal"; // --- IMPORT NEW MODAL ---
import EditAdminModal from "./EditAdminModal"; // --- IMPORT NEW MODAL ---

// --- Reusable Helper Components (Icons & Badges) ---

const ListSpinner = () => (
  <div className="flex justify-center items-center h-64">
    <svg
      className="animate-spin h-10 w-10 text-gray-800"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  </div>
);

const StatusBadge = ({ suspended }) => {
  const bgColor = suspended ? "bg-red-100" : "bg-green-100";
  const textColor = suspended ? "text-red-700" : "text-green-700";
  const text = suspended ? "Suspended" : "Active";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}
    >
      {text}
    </span>
  );
};

const RoleBadge = () => (
  <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
    Admin
  </span>
);

const PencilIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
    />
  </svg>
);

const TrashIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12.54 0c-.275.042-.549.09-.816.14m5.192 0c3.043 0 6-1.03 6-3.21v-1.04c0-.289-.009-.577-.026-.86H8.02c-.017.283-.026.57-.026.86v1.04c0 2.18 2.957 3.21 6 3.21Z"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5 text-gray-400"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const PlusIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 4.5v15m7.5-7.5h-15"
    />
  </svg>
);

// --- Main AdminUser Component ---
const AdminUser = ({ token }) => {
  const [users, setUsers] = useState([]);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false); // For delete actions
  const [searchTerm, setSearchTerm] = useState("");

  // --- Modal State ---
  const [editingUser, setEditingUser] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch all users
  const fetchUsers = async () => {
    setIsListLoading(true);
    try {
      const response = await axios.get(backendUrl + "/api/user/all", {
        headers: { token },
      });
      if (response.data.users) {
        setUsers(response.data.users ? response.data.users.reverse() : []);
      } else {
        toast.error("Failed to fetch users");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsListLoading(false);
    }
  };

  // Remove user/admin
  const removeUser = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this admin? This action cannot be undone."
      )
    )
      return;
    try {
      setIsLoading(true);
      const response = await axios.delete(backendUrl + `/api/user/${id}`, {
        headers: { token },
      });
      if (response.data.message) {
        toast.success(response.data.message);
        await fetchUsers();
      } else {
        toast.error("Failed to delete admin");
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]); // Added token dependency

  // Filter list for Admins and by search term
  const processedList = useMemo(() => {
    return users
      .filter((user) => user.role === "admin")
      .filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `${user.firstName} ${user.lastName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
  }, [users, searchTerm]);

  if (isListLoading) {
    return <ListSpinner />;
  }

  const baseSelectClass =
    "w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors bg-white text-sm";

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <h3 className="text-2xl font-bold text-gray-800">Admin Management</h3>
        <button
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg font-semibold text-sm transition-colors hover:bg-gray-800"
          onClick={() => setShowAddModal(true)}
        >
          <PlusIcon />
          Add New Admin
        </button>
      </div>

      {/* --- Search Bar --- */}
      <div className="mb-6">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon />
          </span>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.g.target.value)}
            className={`${baseSelectClass} pl-10 max-w-sm`}
          />
        </div>
      </div>

      {/* --- Admin Table --- */}
      <div className="bg-white shadow-md rounded-lg overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] items-center gap-4 px-4 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Name
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Email
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Role
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Status
            </p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
              Action
            </p>
          </div>

          {processedList.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? "No admins match your search." : "No admins found."}
            </div>
          )}

          {processedList.map((user) => (
            <div
              key={user._id}
              className="grid grid-cols-[2fr_3fr_1fr_1fr_1fr] items-center gap-4 px-4 py-4 border-b border-gray-100 text-sm hover:bg-gray-50 transition-colors"
            >
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-gray-600">{user.email}</p>
              <div>
                <RoleBadge />
              </div>
              <div>
                <StatusBadge suspended={user.suspended} />
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setEditingUser(user)}
                  className="p-2 rounded-md text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                  disabled={isLoading}
                  title="Edit Admin"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => removeUser(user._id)}
                  className="p-2 rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  disabled={isLoading}
                  title="Delete Admin"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showAddModal && (
        <AddAdminModal
          token={token}
          onClose={() => setShowAddModal(false)}
          onAdd={() => {
            setShowAddModal(false);
            fetchUsers();
          }}
        />
      )}

      {editingUser && (
        <EditAdminModal
          token={token}
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdate={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default AdminUser;
