import React, { useEffect, useState } from "react";
import "./Users.css";
import API from "../../api";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const closeModal = () => {
    setSelectedUser(null);
    setShowModal(false);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data.users || []);
      setFilteredUsers(res.data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearchTerm(value);
    filterUsers(value, roleFilter, statusFilter);
    setCurrentPage(1);
  };

  const handleRoleFilter = (e) => {
    const value = e.target.value;
    setRoleFilter(value);
    filterUsers(searchTerm, value, statusFilter);
    setCurrentPage(1);
  };

  const handleStatusFilter = (e) => {
    const value = e.target.value;
    setStatusFilter(value);
    filterUsers(searchTerm, roleFilter, value);
    setCurrentPage(1);
  };

  const filterUsers = (search, role, status) => {
    let filtered = [...users];
    if (search) {
      filtered = filtered.filter(
        (user) =>
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
      );
    }
    if (role) filtered = filtered.filter((user) => user.role === role);
    if (status) filtered = filtered.filter((user) => user.status === status);
    setFilteredUsers(filtered);
  };

  const deleteUser = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    try {
      await API.delete(`/admin/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
    } catch (error) {
      console.error("Delete error:", error);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === "active" ? "suspended" : "active";
    try {
      await API.put(
        `/admin/users/${id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

  const changeUserRole = async (id, role) => {
    try {
      await API.put(
        `/admin/users/${id}/role`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
    } catch (error) {
      console.error("Role update error:", error);
    }
  };

  const updateUser = async () => {
    try {
      await API.put(
        `/admin/users/${selectedUser._id}`,
        {
          name: selectedUser.name,
          email: selectedUser.email,
          role: selectedUser.role,
          status: selectedUser.status,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchUsers();
      closeModal();
    } catch (error) {
      console.error("Update error:", error);
      alert("Failed to update user. Please try again.");
    }
  };

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) return <p>Loading users...</p>;

  return (
    <div className="users-container">
      <h1 className="users-title">Manage Users</h1>

      {/* Filters */}
      <div className="users-filters">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={handleSearch}
        />

        <select value={roleFilter} onChange={handleRoleFilter}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>

        <select value={statusFilter} onChange={handleStatusFilter}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>

        <select
          value={itemsPerPage}
          onChange={(e) => {
            setItemsPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value="5">5 per page</option>
          <option value="10">10 per page</option>
          <option value="15">15 per page</option>
        </select>
      </div>

      {/* ✅ Table view (desktop) */}
      <div className="users-table-container">
        {currentUsers.length > 0 ? (
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentUsers.map((user) => (
                <tr key={user._id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) => changeUserRole(user._id, e.target.value)}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>{user.status}</td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="edit-btn" onClick={() => openEditModal(user)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => deleteUser(user._id)}>
                      Delete
                    </button>
                    {user.status === "active" ? (
                      <button
                        className="suspend-btn"
                        onClick={() => toggleUserStatus(user._id, user.status)}
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        className="activate-btn"
                        onClick={() => toggleUserStatus(user._id, user.status)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No users found.</p>
        )}
      </div>

      {/* ✅ Mobile cards */}
      <div className="users-cards">
        {currentUsers.map((user) => (
          <div className="user-card" key={user._id}>
            <h3>{user.name}</h3>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Status:</strong> {user.status}</p>
            <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
            <div className="user-actions">
              <button className="edit-btn" onClick={() => openEditModal(user)}>Edit</button>
              <button className="delete-btn" onClick={() => deleteUser(user._id)}>Delete</button>
              {user.status === "active" ? (
                <button className="suspend-btn" onClick={() => toggleUserStatus(user._id, user.status)}>Suspend</button>
              ) : (
                <button className="activate-btn" onClick={() => toggleUserStatus(user._id, user.status)}>Activate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
