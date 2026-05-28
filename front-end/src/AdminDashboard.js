// src/AdminDashboard.js

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';
import ThemeToggle from './ThemeToggle';


const API_BASE = "http://localhost:5000/api";

// --- Icon Components ---
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>;
const BookingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>;
const ProvidersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>;

const StatCard = ({ icon, title, value, color }) => (
    <div className="admin-stat-card" style={{ borderLeftColor: color }}>
        <div className="admin-stat-icon">{icon}</div>
        <div className="admin-stat-info">
            <span className="admin-stat-title">{title}</span>
            <span className="admin-stat-value">{value || 0}</span>
        </div>
    </div>
);

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({});
    const [topCategories, setTopCategories] = useState([]);
    const [topServices, setTopServices] = useState([]);
    const [services, setServices] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const axiosWithAuth = useMemo(() => axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } }), [token]);

    const fetchData = async () => {
        try {
            const [statsRes, servicesRes] = await Promise.all([
                axiosWithAuth.get('/admin/stats'),
                axiosWithAuth.get('/admin/services')
            ]);
            
            setStats(statsRes.data.stats || {});
            setTopCategories(statsRes.data.topCategories || []);
            setTopServices(statsRes.data.topServices || []);
            setServices(servicesRes.data || []);
        } catch (err) {
            toast.error("Failed to fetch admin data. You may not have access.");
            if (err.response?.status === 403) navigate('/login');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!token || !currentUser || currentUser.role !== 'Admin') {
            toast.error("Access Denied.");
            navigate('/login');
        } else {
            fetchData();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token, navigate]);

    const handleServiceStatus = async (serviceId, status) => {
        try {
            await axiosWithAuth.put(`/admin/services/${serviceId}/status`, { status });
            toast.success(`Service has been ${status.toLowerCase()}.`);
            fetchData();
        } catch (error) {
            toast.error("Failed to update service status.");
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate('/login');
    };

    return (
        <div className="admin-dashboard">
            <ToastContainer theme="dark" position="bottom-right" />
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <button onClick={handleSignOut} className="signout-btn">
                    <PowerIcon/> Sign Out
                </button> <ThemeToggle />

            </header>
            <main className="admin-content">
                {loading ? (
                    <div className="loader-container"><div className="loader"></div></div>
                ) : (
                    <>
                        <div className="tabs">
                            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
                            <button className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>Service Moderation</button>
                        </div>

                        {activeTab === 'dashboard' && (
                            <>
                                <section className="stats-section">
                                    <StatCard icon={<UsersIcon />} title="Total Users" value={stats.total_users} color="var(--primary-color)" />
                                    <StatCard icon={<ProvidersIcon />} title="Service Providers" value={stats.total_providers} color="var(--accent-color)" />
                                    <StatCard icon={<ServicesIcon />} title="Total Services" value={stats.total_services} color="var(--success-color)" />
                                    <StatCard icon={<BookingsIcon />} title="Completed Bookings" value={stats.completed_bookings} color="var(--warning-color)" />
                                </section>
                                <section className="analytics-section">
                                    <div className="admin-panel">
                                        <h3 className="panel-header">Top Categories</h3>
                                        <ul className="top-list">
                                            {topCategories.length > 0 ? topCategories.slice(0, 4).map((cat, index) => (
                                                <li key={index}><span className="list-item-name">{cat.category}</span><span className="list-item-count">{cat.booking_count} Bookings</span></li>
                                            )) : <li className='empty-list-item'>No booking data yet.</li>}
                                        </ul>
                                    </div>
                                    <div className="admin-panel">
                                        <h3 className="panel-header">Top Services</h3>
                                        <ul className="top-list">
                                            {topServices.length > 0 ? topServices.slice(0, 4).map((srv, index) => (
                                                <li key={index}><span className="list-item-name">{srv.service_name}</span><span className="list-item-count">{srv.booking_count} Bookings</span></li>
                                            )) : <li className='empty-list-item'>No booking data yet.</li>}
                                        </ul>
                                    </div>
                                </section>
                            </>
                        )}
                        
                        {activeTab === 'moderation' && (
                            <section className="admin-panel">
                                <h3 className="panel-header">Service Listing Moderation</h3>
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr><th>Service</th><th>Provider</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {services.map(s => (
                                                <tr key={s.id}>
                                                    <td>{s.service_name}</td>
                                                    <td>{s.provider_name}</td>
                                                    <td>{s.category}</td>
                                                    <td>₹{s.price}</td>
                                                    <td><span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                                    <td className="actions-cell">
                                                        {/* --- THIS IS THE FIX --- */}
                                                        {s.status === 'Pending' ? (
                                                            <>
                                                                <button className="btn-admin-action approve" onClick={() => handleServiceStatus(s.id, 'Approved')}>Approve</button>
                                                                <button className="btn-admin-action reject" onClick={() => handleServiceStatus(s.id, 'Rejected')}>Reject</button>
                                                            </>
                                                        ) : (
                                                            <span className="no-actions-text">—</span>
                                                        )}
                                                        {/* --- END OF FIX --- */}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;