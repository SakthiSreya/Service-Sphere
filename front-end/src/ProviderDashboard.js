import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./ProviderDashboard.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { format } from 'date-fns';
import ImageUploader from './ImageUploader'
import ThemeToggle from './ThemeToggle';

const API_BASE = "http://localhost:5000/api";

// --- Icon Components ---
const ListIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>;
const PlusIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>;
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;
const CheckCircleIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const StarIcon = ({ filled }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
        fill={filled ? "#f59e0b" : "none"}
        stroke={filled ? "#f59e0b" : "#9ca3af"}
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
    </svg>
);

const StarRatingDisplay = ({ rating }) => (
    <div className="star-rating-display">
        {[...Array(5)].map((_, index) => (
            <StarIcon key={index} filled={index < rating} />
        ))}
    </div>
);

const StatCard = ({ icon, title, value, color }) => (
    <div className="stat-card">
        <div className="stat-icon" style={{ background: color }}>{icon}</div>
        <div className="stat-info">
            <span className="stat-title">{title}</span>
            <span className="stat-value">{value}</span>
        </div>
    </div>
);

const PaymentBadge = ({ booking }) => {
    const isOnline = booking.payment_method === 'Online';
    const isPaid = booking.payment_status === 'Paid';
    return (
        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginBottom: '5px' }}>
            <strong style={{ color: 'var(--text)' }}>Payment:</strong>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                background: isOnline ? 'rgba(79,156,249,0.12)' : 'rgba(245,158,11,0.12)',
                color: isOnline ? 'var(--primary)' : 'var(--warning)',
                border: `1px solid ${isOnline ? 'rgba(79,156,249,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
                {isOnline ? '💳' : '💵'} {booking.payment_method || 'COD'}
            </span>
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '2px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 700,
                background: isPaid ? 'rgba(46,204,113,0.12)' : 'rgba(245,158,11,0.12)',
                color: isPaid ? 'var(--success)' : 'var(--warning)',
                border: `1px solid ${isPaid ? 'rgba(46,204,113,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}>
                {isPaid ? '✓ Paid' : '⏳ Pay on delivery'}
            </span>
            <strong style={{ color: 'var(--text)', marginLeft: '2px' }}>
                — ₹{booking.price || 'N/A'}
            </strong>
        </p>
    );
};

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const initializeSchedule = () =>
    DAYS.map((day, index) => ({
        day_of_week: index, day_name: day, start_time: "09:00", end_time: "17:00", is_available: false
    }));

const ProviderDashboard = () => {
    const [activeTab, setActiveTab] = useState('services');
    const [services, setServices] = useState([]);
    const [bookings, setBookings] = useState([]);

    // ✅ Per-service schedule state
    const [selectedScheduleServiceId, setSelectedScheduleServiceId] = useState(null);
    const [schedule, setSchedule] = useState(initializeSchedule());
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const navigate = useNavigate();
    const [form, setForm] = useState({ service_name: "", description: "", category: "", price: "", location: "", image_url: "", availability: "Available" });
    const [isEditServiceModalOpen, setIsEditServiceModalOpen] = useState(false);
    const [editingService, setEditingService] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [serviceToDelete, setServiceToDelete] = useState(null);
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [profileDetails, setProfileDetails] = useState({ name: '', email: '' });
    const [user, setUser] = useState(null);
    const [cancelConfirmId, setCancelConfirmId] = useState(null);

    const token = localStorage.getItem("token");
    const axiosWithAuth = useMemo(() => axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchProviderData = async (providerId, initialLoad = false) => {
        if (initialLoad) setLoading(true);
        try {
            const [servicesRes, bookingsRes] = await Promise.all([
                axiosWithAuth.get("/services", { params: { provider_id: providerId } }),
                axiosWithAuth.get("/bookings"),
            ]);
            setServices(servicesRes.data || []);
            setBookings(bookingsRes.data || []);
        } catch (err) {
            if (initialLoad) toast.error("Failed to fetch provider data.");
            console.error("Data fetch error:", err);
        } finally {
            if (initialLoad) setLoading(false);
        }
    };

    // ✅ Load schedule for a specific service
    const fetchScheduleForService = async (serviceId) => {
        setScheduleLoading(true);
        setSchedule(initializeSchedule()); // reset while loading
        try {
            const res = await axiosWithAuth.get("/schedules", { params: { service_id: serviceId } });
            const fetched = res.data;
            const full = initializeSchedule();
            fetched.forEach(s => {
                const idx = full.findIndex(d => d.day_of_week === s.day_of_week);
                if (idx !== -1) {
                    full[idx] = {
                        ...full[idx],
                        start_time: s.start_time.substring(0, 5),
                        end_time: s.end_time.substring(0, 5),
                        is_available: !!s.is_available,
                    };
                }
            });
            setSchedule(full);
        } catch (err) {
            toast.error("Failed to load schedule.");
        } finally {
            setScheduleLoading(false);
        }
    };

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser) {
            setUser(currentUser);
            fetchProviderData(currentUser.id, true);
            const intervalId = setInterval(() => fetchProviderData(currentUser.id, false), 30000);
            return () => clearInterval(intervalId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    // ✅ When switching to the schedule tab, auto-select first approved service
    useEffect(() => {
        if (activeTab === 'schedule' && services.length > 0 && !selectedScheduleServiceId) {
            const firstApproved = services.find(s => s.status === 'Approved') || services[0];
            setSelectedScheduleServiceId(firstApproved.id);
            fetchScheduleForService(firstApproved.id);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab, services]);

    const handleServiceSelectForSchedule = (serviceId) => {
        setSelectedScheduleServiceId(serviceId);
        fetchScheduleForService(serviceId);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axiosWithAuth.post("/services", { ...form });
            toast.success("Service submitted for admin approval!");
            setForm({ service_name: "", description: "", category: "", price: "", location: "", image_url: "", availability: "Available" });
            await fetchProviderData(user.id, true);
            setActiveTab('services');
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add service.");
        }
    };

    const handleUpdateService = async (e) => {
        e.preventDefault();
        if (!editingService) return;
        try {
            await axiosWithAuth.put(`/services/${editingService.id}`, editingService);
            setIsEditServiceModalOpen(false);
            await fetchProviderData(user.id, true);
            toast.success("Service updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update service.");
        }
    };

    const handleDelete = async () => {
        if (!serviceToDelete) return;
        try {
            await axiosWithAuth.delete(`/services/${serviceToDelete.id}`);
            await fetchProviderData(user.id, true);
            setIsDeleteModalOpen(false);
            toast.success("Service deleted successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to delete service.");
        }
    };

    const handleScheduleChange = (dayIndex, field, value) => {
        setSchedule(cur => cur.map((day, index) => index === dayIndex ? { ...day, [field]: value } : day));
    };

    const handleSaveSchedule = async () => {
        if (!selectedScheduleServiceId) {
            toast.warn("Please select a service first.");
            return;
        }
        try {
            const payload = schedule.map(s => ({
                ...s,
                start_time: `${s.start_time}:00`,
                end_time: `${s.end_time}:00`,
            }));
            await axiosWithAuth.post('/schedules', { schedules: payload, service_id: selectedScheduleServiceId });
            toast.success("Schedule saved!");
        } catch (error) {
            toast.error("Failed to save schedule.");
        }
    };

    const handleBookingStatusChange = async (bookingId, newStatus) => {
        try {
            await axiosWithAuth.put(`/bookings/${bookingId}/status`, { status: newStatus });
            toast.success("Booking status updated!");
            await fetchProviderData(user.id, false);
        } catch (error) {
            toast.error("Failed to update booking status.");
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await axiosWithAuth.put(`/bookings/${bookingId}/cancel`);
            toast.success("Booking cancelled.");
            setCancelConfirmId(null);
            await fetchProviderData(user.id, false);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to cancel booking.");
        }
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await axiosWithAuth.put('/users/me', profileDetails);
            const updatedUser = { ...user, ...profileDetails };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            setIsProfileEditModalOpen(false);
            toast.success("Profile updated successfully!");
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to update profile.");
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate('/login');
    };

    const stats = useMemo(() => ({
        totalServices: services.length,
        pendingBookings: bookings.filter(b => b.status === "Pending").length,
        totalEarnings: bookings
            .filter(b =>
                (b.payment_method === 'Online' && b.payment_status === 'Paid' && b.status !== 'Cancelled') ||
                (b.payment_method !== 'Online' && b.status === 'Completed')
            )
            .reduce((acc, b) => acc + (parseFloat(b.price) || 0), 0)
            .toFixed(2),
    }), [services, bookings]);

    const FALLBACK_CATEGORIES = ["Plumbing", "Electrical", "Carpentry", "House Cleaning", "IT Services", "Appliance Repair", "Gardening", "Tutoring", "Other"];
    const FALLBACK_AVAILABILITIES = ["Available", "Unavailable", "Busy"];
    const pendingCount = bookings.filter(b => b.status === 'Pending').length;

    const getCancelledLabel = (booking) => {
        if (booking.cancelled_by === 'provider') return 'Cancelled by You';
        return 'Cancelled by Customer';
    };

    // The service currently selected for schedule editing
    const selectedScheduleService = services.find(s => s.id === selectedScheduleServiceId);

    return (
        <div className="main-content-wrapper">
            <ToastContainer theme="dark" position="bottom-right" />
            <header className="main-header">
                <h1 className="header-title">ProManage Dashboard</h1>
                <div className="header-right">
                    <ThemeToggle />
                    <div className="profile-menu">
                        <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="profile-btn">
                            <span>Welcome, <strong className="gradient-text">{user?.name || 'Provider'}</strong></span>
                        </button>
                        {isProfileDropdownOpen && (
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <p className="dropdown-name">{user?.name}</p>
                                    <p className="dropdown-email">{user?.email}</p>
                                </div>
                                <button onClick={() => navigate('/my-bookings')} className="dropdown-item"><CalendarIcon /> My Bookings</button>
                                <button onClick={() => { setProfileDetails({ name: user.name, email: user.email }); setIsProfileDropdownOpen(false); setIsProfileEditModalOpen(true); }} className="dropdown-item"><UserIcon /> Edit Profile</button>
                                <button onClick={handleSignOut} className="dropdown-item"><PowerIcon /> Sign Out</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <main className="content-area">
                <div className="stats-grid">
                    <StatCard icon={<ListIcon />} title="Total Services" value={stats.totalServices} color="var(--primary)" />
                    <StatCard icon={<CalendarIcon />} title="Pending Bookings" value={stats.pendingBookings} color="var(--warning)" />
                    <StatCard icon={<CheckCircleIcon />} title="Total Earnings" value={`₹${stats.totalEarnings}`} color="var(--success)" />
                </div>

                <div className="tabs">
                    <button className={`tab-btn ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>My Services</button>
                    <button className={`tab-btn ${activeTab === 'addService' ? 'active' : ''}`} onClick={() => setActiveTab('addService')}>Add Service</button>
                    <button className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>My Schedule</button>
                    <button className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>
                        Customer Bookings
                        {pendingCount > 0 && <span className="tab-badge">{pendingCount}</span>}
                    </button>
                </div>

                {/* ── My Services Tab ─────────────────────────────────────── */}
                {activeTab === 'services' && (
                    <section className="content-panel">
                        <h3 className="panel-header">Your Service Listings</h3>
                        <div className="table-wrapper">
                            {loading ? <p>Loading...</p> : services.length === 0 ? <p>No services yet. Add one in the 'Add Service' tab.</p> : (
                                <table className="services-table">
                                    <thead>
                                        <tr>
                                            <th>Service</th>
                                            <th>Category</th>
                                            <th>Price</th>
                                            <th>Approval Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {services.map(s => (
                                            <tr key={s.id}>
                                                <td>
                                                    <div className="service-name-cell">
                                                        <img src={s.image_url || `https://placehold.co/100x100/10101a/a99eff?text=${s.service_name.charAt(0)}`} alt={s.service_name} />
                                                        <span>{s.service_name}</span>
                                                    </div>
                                                </td>
                                                <td>{s.category}</td>
                                                <td>₹{s.price || 'N/A'}</td>
                                                <td className="status-cell"><span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                                <td className="actions-cell">
                                                    <button className="btn-icon" onClick={() => { setEditingService(s); setIsEditServiceModalOpen(true); }}><EditIcon /></button>
                                                    <button className="btn-icon btn-icon-danger" onClick={() => { setServiceToDelete(s); setIsDeleteModalOpen(true); }}><TrashIcon /></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </section>
                )}

                {/* ── Add Service Tab ─────────────────────────────────────── */}
                {activeTab === 'addService' && (
                    <section className="content-panel">
                        <h3 className="panel-header"><PlusIcon /> Add a New Service</h3>
                        <p className="panel-subtitle">Newly added services will be sent to an admin for approval before they are visible to customers.</p>
                        <form className="add-service-form" onSubmit={handleSubmit}>
                            <div className="form-group full-width"><label htmlFor="service_name">Service Name</label><input id="service_name" className="form-input" required placeholder="e.g., Expert Plumbing Repair" value={form.service_name} onChange={e => setForm({ ...form, service_name: e.target.value })} /></div>
                            <div className="form-group full-width"><label htmlFor="description">Description</label><textarea id="description" className="form-textarea" placeholder="Describe the service you offer..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            <div className="form-group"><label htmlFor="category">Category</label><select id="category" required className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}><option value="">Select Category *</option>{FALLBACK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                            <div className="form-group"><label htmlFor="price">Price (₹)</label><input id="price" className="form-input" placeholder="e.g., 500" type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
                            <div className="form-group"><label htmlFor="location">Location</label><input id="location" className="form-input" placeholder="e.g., Bhubaneswar" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
                            <div className="form-group"><label>Availability</label><select className="form-select" required value={form.availability} onChange={e => setForm({ ...form, availability: e.target.value })}>{FALLBACK_AVAILABILITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                            <div className="form-group full-width">
                                <label>Service Image</label>
                                <ImageUploader onUploadComplete={(url) => setForm({ ...form, image_url: url })} />
                            </div>
                            <div className="form-group full-width"><button type="submit" className="btn btn-primary"><PlusIcon /> Add Service</button></div>
                        </form>
                    </section>
                )}

                {/* ── Schedule Tab ─────────────────────────────────────────── */}
                {activeTab === 'schedule' && (
                    <section className="content-panel">
                        <h3 className="panel-header"><CalendarIcon /> Service Schedule</h3>
                        <p className="panel-subtitle">Each service can have its own weekly availability. Select a service below to configure its schedule.</p>

                        {/* ✅ Service selector */}
                        {services.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)' }}>You have no services yet. Add a service first.</p>
                        ) : (
                            <>
                                <div className="form-group" style={{ marginBottom: '20px' }}>
                                    <label>Select Service</label>
                                    <select
                                        className="form-select"
                                        value={selectedScheduleServiceId || ''}
                                        onChange={e => handleServiceSelectForSchedule(Number(e.target.value))}
                                    >
                                        <option value="" disabled>Choose a service...</option>
                                        {services.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.service_name} {s.status !== 'Approved' ? `(${s.status})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {selectedScheduleService && (
                                    <>
                                        {selectedScheduleService.status !== 'Approved' && (
                                            <div className="pending-alert" style={{ marginBottom: '16px' }}>
                                                ⚠️ This service is still <strong>{selectedScheduleService.status}</strong>. You can set its schedule, but customers won't see it until it's approved.
                                            </div>
                                        )}

                                        {scheduleLoading ? (
                                            <div className="loader" style={{ margin: '20px auto' }}></div>
                                        ) : (
                                            <div className="schedule-editor">
                                                {schedule.map((day, index) => (
                                                    <div key={day.day_of_week} className="schedule-day-row">
                                                        <label className="schedule-day-label">{day.day_name}</label>
                                                        <input
                                                            type="checkbox"
                                                            className="schedule-checkbox"
                                                            checked={day.is_available}
                                                            onChange={(e) => handleScheduleChange(index, 'is_available', e.target.checked)}
                                                        />
                                                        <div className="schedule-time-inputs" style={{ opacity: day.is_available ? 1 : 0.5 }}>
                                                            <input type="time" disabled={!day.is_available} value={day.start_time} onChange={e => handleScheduleChange(index, 'start_time', e.target.value)} />
                                                            <span>to</span>
                                                            <input type="time" disabled={!day.is_available} value={day.end_time} onChange={e => handleScheduleChange(index, 'end_time', e.target.value)} />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="panel-footer">
                                            <button className="btn btn-primary" onClick={handleSaveSchedule} disabled={scheduleLoading}>
                                                Save Schedule for "{selectedScheduleService.service_name}"
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </section>
                )}

                {/* ── Bookings Tab ─────────────────────────────────────────── */}
                {activeTab === 'bookings' && (
                    <section className="content-panel">
                        <h3 className="panel-header">Customer Bookings</h3>
                        {pendingCount > 0 && (
                            <div className="pending-alert">
                                <CalendarIcon /> You have {pendingCount} pending booking(s) awaiting your action!
                            </div>
                        )}
                        {loading ? <div className="loader"></div> : bookings.length === 0 ? <p>You have no bookings yet.</p> : (
                            <div className="provider-bookings-list">
                                {bookings.map(b => (
                                    <div key={b.id} className="provider-booking-card">
                                        <div className="provider-card-main">
                                            <div className="provider-card-details">
                                                <h4>{b.service_name}</h4>
                                                <p><strong>Customer:</strong> {b.customer_name}</p>
                                                <p><strong>Date:</strong> {format(new Date(b.booking_start_time), 'EEEE, MMMM d, yyyy \'at\' h:mm a')}</p>
                                                <p>
                                                    <strong>Phone:</strong>{' '}
                                                    {b.customer_phone
                                                        ? <a href={`tel:${b.customer_phone}`} style={{ color: 'var(--primary)' }}>{b.customer_phone}</a>
                                                        : <span style={{ opacity: 0.5 }}>Not provided</span>}
                                                </p>
                                                <p><strong>Area:</strong> {b.customer_area || <span style={{ opacity: 0.5 }}>Not provided</span>}</p>

                                                {b.status !== 'Cancelled' && <PaymentBadge booking={b} />}

                                                {b.status === 'Cancelled' && (
                                                    <p>
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '3px 10px', borderRadius: '99px', fontSize: '12px', fontWeight: 600,
                                                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                                                            border: '1px solid rgba(239,68,68,0.2)'
                                                        }}>
                                                            🚫 {getCancelledLabel(b)}
                                                        </span>
                                                    </p>
                                                )}

                                                {b.review_id && b.status !== 'Cancelled' && (
                                                    <div className="review-display-provider">
                                                        <StarRatingDisplay rating={b.rating} />
                                                        {b.comment && <p className="review-comment-provider">"{b.comment}"</p>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="provider-card-status">
                                                <span className={`status-badge ${b.status.toLowerCase()}`}>{b.status}</span>
                                            </div>
                                        </div>

                                        {(b.status === 'Pending' || b.status === 'Confirmed') && (
                                            <div className="provider-card-actions">
                                                {b.status === 'Pending' && (
                                                    <>
                                                        <button className="btn btn-small success" onClick={() => handleBookingStatusChange(b.id, 'Confirmed')}>Confirm</button>
                                                        {cancelConfirmId === b.id ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1 }}>Sure?</span>
                                                                <button className="btn btn-small danger" onClick={() => handleCancelBooking(b.id)}>Yes, Cancel</button>
                                                                <button className="btn btn-small" style={{ background: 'var(--surface2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={() => setCancelConfirmId(null)}>No</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn btn-small danger" onClick={() => setCancelConfirmId(b.id)}>Cancel</button>
                                                        )}
                                                    </>
                                                )}
                                                {b.status === 'Confirmed' && (
                                                    <>
                                                        <button className="btn btn-small" onClick={() => handleBookingStatusChange(b.id, 'Completed')}>Mark as Completed</button>
                                                        {cancelConfirmId === b.id ? (
                                                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, lineHeight: 1 }}>Sure?</span>
                                                                <button className="btn btn-small danger" onClick={() => handleCancelBooking(b.id)}>Yes, Cancel</button>
                                                                <button className="btn btn-small" style={{ background: 'var(--surface2)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }} onClick={() => setCancelConfirmId(null)}>No</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn btn-small danger" onClick={() => setCancelConfirmId(b.id)}>Cancel</button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}
            </main>

            {/* Edit Service Modal */}
            {isEditServiceModalOpen && editingService && (
                <div className="modal-overlay" onClick={() => setIsEditServiceModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Edit Service</h3></div>
                        <form onSubmit={handleUpdateService}>
                            <div className="modal-form-grid">
                                <div className="form-group full-width"><label>Service Name</label><input className="form-input" required value={editingService.service_name} onChange={e => setEditingService({ ...editingService, service_name: e.target.value })} /></div>
                                <div className="form-group"><label>Category</label><select className="form-select" required value={editingService.category} onChange={e => setEditingService({ ...editingService, category: e.target.value })}>{FALLBACK_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
                                <div className="form-group"><label>Price (₹)</label><input type="number" className="form-input" placeholder="e.g. 500" value={editingService.price || ''} onChange={e => setEditingService({ ...editingService, price: e.target.value })} /></div>
                                <div className="form-group"><label>Availability</label><select className="form-select" required value={editingService.availability} onChange={e => setEditingService({ ...editingService, availability: e.target.value })}>{FALLBACK_AVAILABILITIES.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
                                <div className="form-group"><label>Location</label><input type="text" className="form-input" placeholder="e.g. Bhubaneswar" value={editingService.location || ''} onChange={e => setEditingService({ ...editingService, location: e.target.value })} /></div>
                                <div className="form-group full-width">
                                    <label>Service Image</label>
                                    <ImageUploader initialImageUrl={editingService.image_url} onUploadComplete={(url) => setEditingService({ ...editingService, image_url: url })} />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsEditServiceModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirm Modal */}
            {isDeleteModalOpen && serviceToDelete && (
                <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
                    <div className="modal-content confirm-delete-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Confirm Deletion</h3></div>
                        <p>Are you sure you want to delete "{serviceToDelete?.service_name}"? This action cannot be undone.</p>
                        <div className="modal-actions">
                            <button type="button" className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</button>
                            <button type="button" className="btn btn-danger" onClick={handleDelete}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Profile Modal */}
            {isProfileEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsProfileEditModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Edit Your Profile</h3></div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group"><label>Full Name</label><input type="text" className="form-input" required value={profileDetails.name} onChange={(e) => setProfileDetails({ ...profileDetails, name: e.target.value })} /></div>
                            <div className="form-group"><label>Email Address</label><input type="email" className="form-input" required value={profileDetails.email} onChange={(e) => setProfileDetails({ ...profileDetails, email: e.target.value })} /></div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setIsProfileEditModalOpen(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProviderDashboard;