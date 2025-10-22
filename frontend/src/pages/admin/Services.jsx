import React, { useEffect, useState, useRef } from "react";
import axiosInstance from "../../pages/axiosInstance";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./Services.css";
import { useCurrency } from "../../context/CurrencyContext";


export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: ""
  });
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [errors, setErrors] = useState({});
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const [servicesPerPage, setServicesPerPage] = useState(5);

  const nameInputRef = useRef(null);
  const { symbol } = useCurrency();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    if (showModal && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [showModal]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/services");
      const normalized = (res.data.services || res.data).map((s) => ({
        _id: s._id || s.id,
        name: s.name ?? "",
        price: Number(s.price) || 0,
        description: s.description ?? "No description provided",
        createdAt: s.createdAt || new Date().toISOString()
      }));
      setServices(normalized);
    } catch (err) {
      console.error("Fetch services error:", err);
      toast.error("Failed to load services");
    } finally {
      setLoading(false);
    }
  };

  const openModal = (service = null) => {
    if (service) {
      setFormData({
        name: service.name ?? "",
        price: service.price ?? "",
        description: service.description ?? ""
      });
      setEditingServiceId(service._id);
    } else {
      setFormData({ name: "", price: "", description: "" });
      setEditingServiceId(null);
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setErrors({});
    setFormData({ name: "", price: "", description: "" });
    setEditingServiceId(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const saveService = async () => {
    const validationErrors = {};
    if (!formData.name) validationErrors.name = "Service name is required.";
    if (!formData.price) validationErrors.price = "Price is required.";

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = {
      name: formData.name.trim(),
      price: Number(formData.price),
      description: formData.description.trim() || "No description provided"
    };

    try {
      if (editingServiceId) {
        await axiosInstance.put(`/admin/services/${editingServiceId}`, payload);
        toast.success("Service updated successfully!");
      } else {
        await axiosInstance.post("/admin/services", payload);
        toast.success("Service added successfully!");
      }

      closeModal();
      fetchServices();
    } catch (err) {
      console.error("Save service error:", err);
      toast.error(err.response?.data?.message || "Failed to save service");
    }
  };

  const deleteService = async (id) => {
    if (!window.confirm("Are you sure you want to delete this service?")) return;
    try {
      await axiosInstance.delete(`/admin/services/${id}`);
      setServices((prev) => prev.filter((s) => s._id !== id));
      toast.success("Service deleted successfully!");
    } catch (err) {
      console.error("Delete service error:", err);
      toast.error("Failed to delete service");
    }
  };

  // ✅ Filter + Sort logic
  const filteredServices = services
    .filter((service) => (service.name ?? "").toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (filter === "price-asc") return a.price - b.price;
      if (filter === "price-desc") return b.price - a.price;
      if (filter === "createdAt-desc") return new Date(b.createdAt) - new Date(a.createdAt);
      if (filter === "createdAt-asc") return new Date(a.createdAt) - new Date(b.createdAt);
      return 0;
    });

  // ✅ Pagination logic
  const indexOfLastService = currentPage * servicesPerPage;
  const indexOfFirstService = indexOfLastService - servicesPerPage;
  const paginatedServices = filteredServices.slice(indexOfFirstService, indexOfLastService);
  const totalPages = Math.ceil(filteredServices.length / servicesPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePerPageChange = (e) => {
    setServicesPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page
  };

  return (
    <div className="services-section">
      <h1>Manage Services</h1>

      <div className="service-controls">
        <input
          type="text"
          placeholder="Search service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Sort by</option>
          <option value="price-asc">Price (Low to High)</option>
          <option value="price-desc">Price (High to Low)</option>
          <option value="createdAt-desc">Newest First</option>
          <option value="createdAt-asc">Oldest First</option>
        </select>

        {/* ✅ Dropdown for services per page */}
        <select value={servicesPerPage} onChange={handlePerPageChange}>
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={15}>15 per page</option>
        </select>
      </div>

      <button className="add-service-btn" onClick={() => openModal()}>
        + Add New Service
      </button>

      {loading ? (
        <div className="loader">
          <div className="spinner"></div>
          <p>Loading services...</p>
        </div>
      ) : (
        <>
          <table className="services-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Created At</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedServices.map((service) => (
                <tr key={service._id}>
                  <td>{service.name}</td>
                  <td>{symbol}{service.price}</td>
                  <td>{new Date(service.createdAt).toLocaleDateString()}</td>
                  <td>{service.description}</td>
                  <td>
                    <button onClick={() => openModal(service)} className="edit-service">Edit</button>
                    <button onClick={() => deleteService(service._id)} className="delete-service">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="services-cards">
        {paginatedServices.map((service) => (
          <div className="service-card" key={service._id}>
            <p><strong>Name:</strong> {service.name}</p>
            <p><strong>Price:</strong> { symbol }{service.price}</p>
            <p><strong>Created:</strong> {new Date(service.createdAt).toLocaleDateString()}</p>
            <p><strong>Description:</strong> {service.description}</p>
            <div className="service-actions">
              <button onClick={() => openModal(service)}>Edit</button>
              <button onClick={() => deleteService(service._id)} >Delete</button>
            </div>
          </div>
        ))}
      </div>

          {/* ✅ Pagination Controls */}
          <div className="pagination">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index + 1}
                onClick={() => handlePageChange(index + 1)}
                className={currentPage === index + 1 ? "active" : ""}
              >
                {index + 1}
              </button>
            ))}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </>
      )}

      

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{editingServiceId ? "Edit Service" : "Add New Service"}</h2>

            <input
              ref={nameInputRef}
              type="text"
              name="name"
              placeholder="Service Name"
              value={formData.name ?? ""}
              onChange={handleChange}
            />
            {errors.name && <p className="error-text">{errors.name}</p>}

            <input
              type="number"
              name="price"
              placeholder="Price"
              value={formData.price ?? ""}
              onChange={handleChange}
            />
            {errors.price && <p className="error-text">{errors.price}</p>}

            <textarea
              name="description"
              placeholder="Description"
              value={formData.description ?? ""}
              onChange={handleChange}
            />

            <div className="modal-actions">
              <button onClick={closeModal}>Cancel</button>
              <button onClick={saveService}>
                {editingServiceId ? "Update Service" : "Add Service"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
