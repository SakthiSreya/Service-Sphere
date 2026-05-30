// src/AdminDashboard.js

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './AdminDashboard.css';
import ThemeToggle from './ThemeToggle';

const API_BASE = "http://localhost:5000/api";

// ─── Icons ────────────────────────────────────────────────────────────────────
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const ServicesIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" /></svg>;
const BookingsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4" /><path d="M16 2v4" /><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M3 10h18" /></svg>;
const ProvidersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
const PowerIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></svg>;
const MailIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>;
const TrashIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4h6v2" /></svg>;

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon, title, value, color, badge }) => (
    <div className="admin-stat-card" style={{ borderLeftColor: color }}>
        <div className="admin-stat-icon">{icon}</div>
        <div className="admin-stat-info">
            <span className="admin-stat-title">{title}</span>
            <span className="admin-stat-value">
                {value || 0}
                {badge > 0 && <span className="stat-badge">{badge} pending</span>}
            </span>
        </div>
    </div>
);

// ─── Provider Detail Modal ────────────────────────────────────────────────────
const ProviderModal = ({ provider, token, onClose, onStatusChange }) => {
    const [providerServices, setProviderServices] = useState([]);
    const [loadingServices, setLoadingServices] = useState(true);

    useEffect(() => {
        if (!provider) return;
        setLoadingServices(true);
        // Fetch all services for this provider (includes pending/rejected too)
        fetch(`${API_BASE}/services?provider_id=${provider.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setProviderServices(Array.isArray(data) ? data : []))
            .catch(() => setProviderServices([]))
            .finally(() => setLoadingServices(false));
    }, [provider, token]);

    if (!provider) return null;
    const isBanned = provider.account_status === 'Banned';

    const statusColor = (status) => {
        if (status === 'Approved') return { background: 'rgba(46,204,113,0.12)', color: 'var(--success)' };
        if (status === 'Rejected') return { background: 'rgba(239,68,68,0.12)', color: 'var(--danger)' };
        return { background: 'rgba(245,158,11,0.12)', color: 'var(--warning)' };
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ maxWidth: '580px' }} onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h2 className="modal-title">{provider.name}</h2>
                        <span className={`status-badge ${isBanned ? 'rejected' : 'approved'}`}>
                            {isBanned ? 'Banned' : 'Active'}
                        </span>
                    </div>
                    <button className="modal-close-btn" onClick={onClose}><CloseIcon /></button>
                </div>

                <div className="modal-body">
                    {/* Provider details grid */}
                    <div className="modal-detail-grid">
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">📧 Email</span>
                            <span className="modal-detail-value">{provider.email || '—'}</span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">📱 Phone</span>
                            <span className="modal-detail-value">{provider.phone || '—'}</span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">📍 Area / Location</span>
                            <span className="modal-detail-value">{provider.area || '—'}</span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">🪪 Aadhaar Number</span>
                            <span className="modal-detail-value aadhaar-value">{provider.aadhaar || '—'}</span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">💼 Experience</span>
                            <span className="modal-detail-value">{provider.experience || '—'}</span>
                        </div>
                        <div className="modal-detail-item">
                            <span className="modal-detail-label">📅 Joined</span>
                            <span className="modal-detail-value">
                                {provider.created_at
                                    ? new Date(provider.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                                    : '—'}
                            </span>
                        </div>
                    </div>

                    {/* ── Services offered by this provider ── */}
                    <div style={{ marginTop: '1.25rem' }}>
                        <div style={{
                            fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                            marginBottom: '0.6rem'
                        }}>
                            🛠 Services Offered
                        </div>

                        {loadingServices ? (
                            <div style={{ textAlign: 'center', padding: '1rem 0', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Loading services...
                            </div>
                        ) : providerServices.length === 0 ? (
                            <div style={{
                                padding: '0.9rem 1rem', borderRadius: '10px',
                                border: '1px dashed var(--border)', color: 'var(--text-secondary)',
                                fontSize: '0.85rem', textAlign: 'center'
                            }}>
                                No services listed yet.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {providerServices.map(svc => (
                                    <div key={svc.id} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        padding: '0.65rem 0.9rem',
                                        background: 'var(--bg)',
                                        border: '1px solid var(--border)',
                                        borderRadius: '10px',
                                        gap: '0.75rem',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem', flex: 1 }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                                                {svc.service_name}
                                            </span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                {svc.category} · ₹{svc.price}
                                            </span>
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 600,
                                            padding: '0.2rem 0.6rem', borderRadius: '999px',
                                            flexShrink: 0,
                                            ...statusColor(svc.status)
                                        }}>
                                            {svc.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    {isBanned ? (
                        <button className="btn-admin-action approve" onClick={() => onStatusChange(provider.id, 'Active')}>
                            ✅ Unban Provider
                        </button>
                    ) : (
                        <button className="btn-admin-action reject" onClick={() => onStatusChange(provider.id, 'Banned')}>
                            🚫 Ban Provider
                        </button>
                    )}
                    <button className="btn-admin-secondary" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [stats, setStats] = useState({});
    const [topCategories, setTopCategories] = useState([]);
    const [topServices, setTopServices] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedProvider, setSelectedProvider] = useState(null);
    const [providerSearch, setProviderSearch] = useState('');
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const token = localStorage.getItem("token");
    const axiosWithAuth = useMemo(() => axios.create({
        baseURL: API_BASE,
        headers: { Authorization: `Bearer ${token}` }
    }), [token]);

    const fetchCore = useCallback(async () => {
        try {
            const [statsRes, servicesRes] = await Promise.all([
                axiosWithAuth.get('/admin/stats'),
                axiosWithAuth.get('/admin/services'),
            ]);
            setStats(statsRes.data.stats || {});
            setTopCategories(statsRes.data.topCategories || []);
            setTopServices(statsRes.data.topServices || []);
            setServices(servicesRes.data || []);
        } catch (err) {
            toast.error("Failed to fetch admin data.");
            if (err.response?.status === 403) navigate('/login');
        } finally {
            setLoading(false);
        }
    }, [axiosWithAuth, navigate]);

    const fetchUsers = useCallback(async () => {
        setLoadingUsers(true);
        try {
            const res = await axiosWithAuth.get('/admin/users');
            setUsers(res.data || []);
        } catch {
            toast.error("Failed to fetch users.");
        } finally {
            setLoadingUsers(false);
        }
    }, [axiosWithAuth]);

    const fetchMessages = useCallback(async () => {
        setLoadingMessages(true);
        try {
            const res = await axiosWithAuth.get('/admin/contact-messages');
            setMessages(res.data || []);
        } catch {
            toast.error("Failed to fetch messages.");
        } finally {
            setLoadingMessages(false);
        }
    }, [axiosWithAuth]);

    useEffect(() => {
        const currentUser = JSON.parse(localStorage.getItem("user"));
        if (!token || !currentUser || currentUser.role !== 'Admin') {
            toast.error("Access Denied.");
            navigate('/login');
            return;
        }
        fetchCore();
    }, [token, navigate, fetchCore]);

    // Lazy load tabs
    useEffect(() => {
        if (activeTab === 'providers' && users.length === 0) fetchUsers();
        if (activeTab === 'inbox') fetchMessages();
    }, [activeTab, users.length, fetchUsers, fetchMessages]);

    const handleServiceStatus = async (serviceId, status) => {
        try {
            await axiosWithAuth.put(`/admin/services/${serviceId}/status`, { status });
            toast.success(`Service ${status.toLowerCase()}.`);
            fetchCore();
        } catch {
            toast.error("Failed to update service status.");
        }
    };

    const handleProviderStatus = async (userId, account_status) => {
        try {
            await axiosWithAuth.put(`/admin/users/${userId}/status`, { account_status });
            toast.success(`Provider ${account_status === 'Banned' ? 'banned' : 'activated'}.`);
            setSelectedProvider(null);
            fetchUsers();
            fetchCore();
        } catch {
            toast.error("Failed to update provider status.");
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await axiosWithAuth.put(`/admin/contact-messages/${id}/read`);
            setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: 1 } : m));
            const statsRes = await axiosWithAuth.get('/admin/stats');
            setStats(statsRes.data.stats || {});
        } catch {
            toast.error("Failed to mark as read.");
        }
    };

    const handleDeleteMessage = async (id) => {
        try {
            await axiosWithAuth.delete(`/admin/contact-messages/${id}`);
            setMessages(prev => prev.filter(m => m.id !== id));
            toast.success("Message deleted.");
            const statsRes = await axiosWithAuth.get('/admin/stats');
            setStats(statsRes.data.stats || {});
        } catch {
            toast.error("Failed to delete message.");
        }
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate('/login');
    };

    const providers = users.filter(u => u.role === 'Service Provider');
    const filteredProviders = providers.filter(p => {
        const q = providerSearch.toLowerCase();
        return !q || p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q) || p.area?.toLowerCase().includes(q) || p.phone?.includes(q);
    });
    const pendingServicesCount = services.filter(s => s.status === 'Pending').length;
    const unreadCount = stats.unread_messages || 0;

    return (
        <div className="admin-dashboard">
            <ToastContainer theme="dark" position="bottom-right" />

            {/* Provider Detail Modal — now receives token to fetch services */}
            <ProviderModal
                provider={selectedProvider}
                token={token}
                onClose={() => setSelectedProvider(null)}
                onStatusChange={handleProviderStatus}
            />

            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ThemeToggle />
                    <button onClick={handleSignOut} className="signout-btn">
                        <PowerIcon /> Sign Out
                    </button>
                </div>
            </header>

            <main className="admin-content">
                {loading ? (
                    <div className="loader-container"><div className="loader"></div></div>
                ) : (
                    <>
                        {/* ── Tabs ── */}
                        <div className="tabs">
                            <button className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
                                Dashboard
                            </button>
                            <button className={`tab-btn ${activeTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveTab('moderation')}>
                                Services
                                {pendingServicesCount > 0 && <span className="tab-badge">{pendingServicesCount}</span>}
                            </button>
                            <button className={`tab-btn ${activeTab === 'providers' ? 'active' : ''}`} onClick={() => setActiveTab('providers')}>
                                Providers
                            </button>
                            <button className={`tab-btn ${activeTab === 'inbox' ? 'active' : ''}`} onClick={() => setActiveTab('inbox')}>
                                Inbox
                                {unreadCount > 0 && <span className="tab-badge">{unreadCount}</span>}
                            </button>
                        </div>

                        {/* ── Dashboard Tab ── */}
                        {activeTab === 'dashboard' && (
                            <>
                                <section className="stats-section">
                                    <StatCard icon={<UsersIcon />} title="Total Users" value={stats.total_users} color="var(--primary-color)" />
                                    <StatCard icon={<ProvidersIcon />} title="Service Providers" value={stats.total_providers} color="var(--accent-color)" />
                                    <StatCard icon={<ServicesIcon />} title="Total Services" value={stats.total_services} color="var(--success-color)" badge={stats.pending_services} />
                                    <StatCard icon={<BookingsIcon />} title="Completed Bookings" value={stats.completed_bookings} color="var(--warning-color)" />
                                    <StatCard icon={<MailIcon />} title="Unread Messages" value={unreadCount} color="#8b5cf6" />
                                </section>
                                <section className="analytics-section">
                                    <div className="admin-panel">
                                        <h3 className="panel-header">Top Categories</h3>
                                        <ul className="top-list">
                                            {topCategories.length > 0 ? topCategories.slice(0, 4).map((cat, i) => (
                                                <li key={i}><span className="list-item-name">{cat.category}</span><span className="list-item-count">{cat.booking_count} Bookings</span></li>
                                            )) : <li className='empty-list-item'>No booking data yet.</li>}
                                        </ul>
                                    </div>
                                    <div className="admin-panel">
                                        <h3 className="panel-header">Top Services</h3>
                                        <ul className="top-list">
                                            {topServices.length > 0 ? topServices.slice(0, 4).map((srv, i) => (
                                                <li key={i}><span className="list-item-name">{srv.service_name}</span><span className="list-item-count">{srv.booking_count} Bookings</span></li>
                                            )) : <li className='empty-list-item'>No booking data yet.</li>}
                                        </ul>
                                    </div>
                                </section>
                            </>
                        )}

                        {/* ── Service Moderation Tab ── */}
                        {activeTab === 'moderation' && (
                            <section className="admin-panel">
                                <h3 className="panel-header">
                                    Service Listing Moderation
                                    {pendingServicesCount > 0 && (
                                        <span className="panel-badge">{pendingServicesCount} awaiting review</span>
                                    )}
                                </h3>
                                <div className="table-wrapper">
                                    <table className="admin-table">
                                        <thead>
                                            <tr><th>Service</th><th>Provider</th><th>Category</th><th>Price</th><th>Status</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {services.map(s => (
                                                <tr key={s.id} className={s.status === 'Pending' ? 'row-highlight' : ''}>
                                                    <td>{s.service_name}</td>
                                                    <td>{s.provider_name}</td>
                                                    <td>{s.category}</td>
                                                    <td>₹{s.price}</td>
                                                    <td><span className={`status-badge ${s.status?.toLowerCase()}`}>{s.status}</span></td>
                                                    <td className="actions-cell">
                                                        {s.status === 'Pending' ? (
                                                            <>
                                                                <button className="btn-admin-action approve" onClick={() => handleServiceStatus(s.id, 'Approved')}>Approve</button>
                                                                <button className="btn-admin-action reject" onClick={() => handleServiceStatus(s.id, 'Rejected')}>Reject</button>
                                                            </>
                                                        ) : (
                                                            <span className="no-actions-text">—</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                            {services.length === 0 && (
                                                <tr><td colSpan={6} className="empty-list-item" style={{ textAlign: 'center', padding: '2rem' }}>No services found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        {/* ── Providers Tab ── */}
                        {activeTab === 'providers' && (
                            <section className="admin-panel">
                                <h3 className="panel-header">
                                    Service Providers
                                    <span className="panel-badge">{providers.length} total</span>
                                </h3>
                                <div style={{ margin: '0.75rem 0 1rem', maxWidth: '340px' }}>
                                    <input
                                        type="text"
                                        placeholder="🔍  Search by name, email, area, phone..."
                                        value={providerSearch}
                                        onChange={e => setProviderSearch(e.target.value)}
                                        style={{
                                            width: '100%', padding: '0.6rem 0.9rem',
                                            borderRadius: '8px', border: '1px solid var(--border)',
                                            background: 'var(--bg)', color: 'var(--text)',
                                            fontSize: '0.88rem', boxSizing: 'border-box', outline: 'none'
                                        }}
                                    />
                                </div>
                                {loadingUsers ? (
                                    <div className="loader-container"><div className="loader"></div></div>
                                ) : (
                                    <div className="table-wrapper">
                                        <table className="admin-table">
                                            <thead>
                                                <tr><th>Name</th><th>Email</th><th>Area</th><th>Phone</th><th>Status</th><th>Joined</th><th>Details</th></tr>
                                            </thead>
                                            <tbody>
                                                {filteredProviders.map(p => (
                                                    <tr key={p.id} className="provider-row" onClick={() => setSelectedProvider(p)} style={{ cursor: 'pointer' }}>
                                                        <td><strong>{p.name}</strong></td>
                                                        <td>{p.email}</td>
                                                        <td>{p.area || '—'}</td>
                                                        <td>{p.phone || '—'}</td>
                                                        <td>
                                                            <span className={`status-badge ${p.account_status === 'Banned' ? 'rejected' : 'approved'}`}>
                                                                {p.account_status || 'Active'}
                                                            </span>
                                                        </td>
                                                        <td>{p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN') : '—'}</td>
                                                        <td>
                                                            <button
                                                                className="btn-admin-action approve"
                                                                onClick={e => { e.stopPropagation(); setSelectedProvider(p); }}
                                                            >
                                                                View
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {filteredProviders.length === 0 && (
                                                    <tr><td colSpan={7} className="empty-list-item" style={{ textAlign: 'center', padding: '2rem' }}>
                                                        {providerSearch ? `No providers match "${providerSearch}".` : 'No providers registered yet.'}
                                                    </td></tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* ── Inbox Tab ── */}
                        {activeTab === 'inbox' && (
                            <section className="admin-panel">
                                <h3 className="panel-header">
                                    Contact Messages
                                    {unreadCount > 0 && <span className="panel-badge">{unreadCount} unread</span>}
                                </h3>
                                {loadingMessages ? (
                                    <div className="loader-container"><div className="loader"></div></div>
                                ) : messages.length === 0 ? (
                                    <div className="empty-inbox">
                                        <span style={{ fontSize: '2.5rem' }}>📭</span>
                                        <p>No messages yet.</p>
                                    </div>
                                ) : (
                                    <div className="message-list">
                                        {messages.map(msg => (
                                            <div key={msg.id} className={`message-card ${msg.is_read ? 'read' : 'unread'}`}>
                                                <div className="message-header">
                                                    <div className="message-sender">
                                                        <strong>{msg.name}</strong>
                                                        {!msg.is_read && <span className="unread-dot" />}
                                                        <span style={{
                                                            fontSize: '0.75rem', fontWeight: 600, padding: '0.1rem 0.5rem',
                                                            borderRadius: '999px',
                                                            background: msg.role === 'Service Provider' ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                                                            color: msg.role === 'Service Provider' ? '#6366f1' : '#10b981',
                                                        }}>
                                                            {msg.role || 'Customer'}
                                                        </span>
                                                        <span className="message-email">{msg.email}</span>
                                                    </div>
                                                    <div className="message-meta">
                                                        <span className="message-time">
                                                            {new Date(msg.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <div className="message-actions">
                                                            {!msg.is_read && (
                                                                <button className="btn-msg-action read-btn" onClick={() => handleMarkRead(msg.id)} title="Mark as read">
                                                                    ✓ Read
                                                                </button>
                                                            )}
                                                            <button className="btn-msg-action delete-btn" onClick={() => handleDeleteMessage(msg.id)} title="Delete">
                                                                <TrashIcon />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <p className="message-body">{msg.message}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        )}
                    </>
                )}
            </main>
        </div>
    );
};

export default AdminDashboard;