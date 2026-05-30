import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CustomerDashboard.css";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BookingModal from './BookingModal';
import ServiceDetailModal from "./ServiceDetailModal";
import ThemeToggle from './ThemeToggle';
import AIAssistant from './AIAssistant';

const API_BASE = "http://localhost:5000/api";

const SearchIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>;
const MapPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>;
const TagIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>;
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;
const SortIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18M3 8h12M3 12h8M3 16h4" /></svg>;
const UserIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const StarIcon = ({ className }) => <svg className={className} xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>;

const StarRating = ({ rating, count }) => {
    const fullStars = Math.round(rating);
    if (count === 0 || !rating) return <div className="star-rating"><span className="rating-text">No reviews yet</span></div>;
    return (
        <div className="star-rating">
            {[...Array(5)].map((_, i) => <StarIcon key={i} className={i < fullStars ? "star-filled" : "star-empty"} />)}
            <span className="rating-text">{parseFloat(rating).toFixed(1)} ({count} {count === 1 ? 'review' : 'reviews'})</span>
        </div>
    );
};

const CustomerDashboard = () => {
    const [services, setServices] = useState([]);
    const [allServices, setAllServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [filters, setFilters] = useState({ keyword: "", category: "", location: "", sortBy: "rating_desc" });
    const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
    const [isProfileEditModalOpen, setIsProfileEditModalOpen] = useState(false);
    const [profileDetails, setProfileDetails] = useState({ name: '', email: '' });
    const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const token = localStorage.getItem("token");
    const axiosWithAuth = useMemo(() => axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } }), [token]);

    const debounce = useCallback((func, delay) => {
        let timeout;
        return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), delay); };
    }, []);

    const fetchServices = useCallback(async (currentFilters) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/services`, { params: currentFilters });
            setAllServices(res.data || []);
        } catch (err) {
            toast.error("Failed to fetch services.");
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedFetchServices = useMemo(() => debounce(fetchServices, 500), [debounce, fetchServices]);

    useEffect(() => {
        if (!token) { navigate('/login'); return; }
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (currentUser) setUser(currentUser);
        debouncedFetchServices(filters);
    }, [token, navigate, filters, debouncedFetchServices]);

    useEffect(() => {
        let filtered = allServices;
        const keyword = filters.keyword.trim().toLowerCase();
        if (keyword) {
            filtered = filtered.filter(s =>
                (s.service_name && s.service_name.toLowerCase().includes(keyword)) ||
                (s.category && s.category.toLowerCase().includes(keyword)) ||
                (s.description && s.description.toLowerCase().includes(keyword))
            );
        }
        if (filters.category) filtered = filtered.filter(s => s.category === filters.category);
        if (filters.location) filtered = filtered.filter(s => s.location && s.location.toLowerCase().includes(filters.location.trim().toLowerCase()));
        if (filters.sortBy === "rating_desc") filtered = filtered.slice().sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
        else if (filters.sortBy === "price_asc") filtered = filtered.slice().sort((a, b) => (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0));
        else if (filters.sortBy === "price_desc") filtered = filtered.slice().sort((a, b) => (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0));
        setServices(filtered);
    }, [allServices, filters]);

    const handleAIFilterByCategory = useCallback((category) => {
        setFilters(prev => ({ ...prev, category }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        toast.info(`Showing ${category} providers`);
    }, []);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate('/login');
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            await axiosWithAuth.put('/users/me', profileDetails);
            const updatedUser = { ...user, ...profileDetails };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setUser(updatedUser);
            toast.success("Profile updated successfully!");
            setIsProfileEditModalOpen(false);
        } catch (error) {
            toast.error("Failed to update profile.");
        }
    };

    const uniqueCategories = useMemo(() => ["", "Plumbing", "Electrical", "Carpentry", "House Cleaning", "IT Services", "Appliance Repair", "Gardening", "Tutoring", "Other"], []);
    const getAvailabilityClass = (availability) => availability?.toLowerCase().replace(/\s+/g, '-') || 'unavailable';

    return (
        <div className="customer-dashboard">
            <ToastContainer theme="dark" position="bottom-right" />
            <header className="customer-header">
                <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>ServeNest</div>
                <div className="header-right">
                    <ThemeToggle />
                    <div className="profile-menu">
                        <button onClick={() => setIsProfileDropdownOpen(prev => !prev)} className="profile-btn">
                            <span>Welcome, <strong className="gradient-text">{user?.name || 'Customer'}</strong></span>
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

            <main className="customer-content-area">
                <div className="content-header">
                    <h1>Explore Services</h1>
                    <p>Find the best professionals for your needs, right in your area.</p>
                </div>

                <div className="filters-panel">
                    <div className="filter-input-wrapper">
                        <span className="icon"><SearchIcon /></span>
                        <input type="text" name="keyword" className="filter-input" placeholder="Service (e.g., plumbing)" value={filters.keyword} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-input-wrapper">
                        <span className="icon"><MapPinIcon /></span>
                        <input type="text" name="location" className="filter-input" placeholder="Location" value={filters.location} onChange={handleFilterChange} />
                    </div>
                    <div className="filter-input-wrapper">
                        <span className="icon"><TagIcon /></span>
                        <select name="category" className="filter-select" value={filters.category} onChange={handleFilterChange}>
                            {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat || 'All Categories'}</option>)}
                        </select>
                    </div>
                    <div className="filter-input-wrapper">
                        <span className="icon"><SortIcon /></span>
                        <select name="sortBy" className="filter-select" value={filters.sortBy} onChange={handleFilterChange}>
                            <option value="">Sort By</option>
                            <option value="rating_desc">Rating: High to Low</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                        </select>
                    </div>
                </div>

                {filters.category && (
                    <div className="ai-filter-banner">
                        <span>Showing: <strong>{filters.category}</strong></span>
                        <button onClick={() => setFilters(prev => ({ ...prev, category: '' }))}>Clear ✕</button>
                    </div>
                )}

                {loading ? (
                    <div className="loader-container"><div className="loader"></div></div>
                ) : services.length > 0 ? (
                    <div className="services-grid">
                        {services.map(s => (
                            <div key={s.id} className="service-card">
                                <div className="card-clickable-area" onClick={() => { setSelectedService(s); setIsDetailModalOpen(true); }}>
                                    <div className="card-img-container">
                                        <img src={s.image_url || `https://placehold.co/400x250/191925/a99eff?text=${s.service_name.split(' ').map(w => w[0]).join('')}`} alt={s.service_name} className="card-img" />
                                        <span className={`availability-badge ${getAvailabilityClass(s.availability)}`}>{s.availability || 'Not Set'}</span>
                                    </div>
                                    <div className="card-content">
                                        <div className="card-header">
                                            <h3>{s.service_name}</h3>
                                            <p className="service-price">₹{s.price ? Number(s.price).toLocaleString('en-IN') : 'N/A'}</p>
                                        </div>
                                        <StarRating rating={s.average_rating} count={s.review_count} />
                                        <div className="card-meta">
                                            <span><TagIcon /> {s.category}</span>
                                            <span><MapPinIcon /> {s.location || 'Not specified'}</span>
                                        </div>
                                        <p className="card-desc">{s.description}</p>
                                    </div>
                                </div>
                                <div className="card-footer">
                                    <div className="provider-info">
                                        <span>Provider</span>
                                        <p>{s.provider_name || 'Anonymous'}</p>
                                    </div>
                                    {s.availability === "Available"
                                        ? <button className="details-btn" onClick={() => { setSelectedService(s); setIsBookingModalOpen(true); }}>Book Now</button>
                                        : <button className="details-btn disabled" disabled>{s.availability || 'Unavailable'}</button>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="no-results">
                        <p>No services match your current filters. Try a different search or ask the AI Assistant!</p>
                    </div>
                )}
            </main>

            <AIAssistant services={allServices} onFilterByCategory={handleAIFilterByCategory} user={user} />

            {isBookingModalOpen && <BookingModal service={selectedService} onClose={() => setIsBookingModalOpen(false)} axiosWithAuth={axiosWithAuth} />}
            {isDetailModalOpen && <ServiceDetailModal service={selectedService} onClose={() => setIsDetailModalOpen(false)} />}

            {isProfileEditModalOpen && (
                <div className="modal-overlay" onClick={() => setIsProfileEditModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Edit Your Profile</h3></div>
                        <form onSubmit={handleUpdateProfile}>
                            <div className="form-group">
                                <label>Full Name</label>
                                <input type="text" className="form-input" required value={profileDetails.name} onChange={e => setProfileDetails({ ...profileDetails, name: e.target.value })} />
                            </div>
                            <div className="form-group">
                                <label>Email Address</label>
                                <input type="email" className="form-input" required value={profileDetails.email} onChange={e => setProfileDetails({ ...profileDetails, email: e.target.value })} />
                            </div>
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

export default CustomerDashboard;