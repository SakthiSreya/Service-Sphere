// src/Contact.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Home.css';

const API_BASE = "http://localhost:5000/api";

const Contact = () => {
    const loggedInUser = (() => {
        try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
    })();

    const autoName = loggedInUser?.name || '';
    const autoEmail = loggedInUser?.email || '';

    const [form, setForm] = useState({
        name: autoName,
        email: autoEmail,
        message: '',
        role: 'Customer',
    });
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { name, email, message, role } = form;
        if (!name.trim() || !email.trim() || !message.trim()) {
            setError('Please fill in all fields.');
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/contact`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, message, role }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Something went wrong');
            setSubmitted(true);
        } catch (err) {
            setError(err.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputStyle = {
        width: '100%', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)', background: 'var(--bg)',
        color: 'var(--text)', fontSize: '0.95rem', boxSizing: 'border-box'
    };

    return (
        <div className="landing-container">
            <header className="main-header">
                <nav className="main-nav container">
                    <Link to="/" className="logo">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        ServiceSphere
                    </Link>
                    <div className="nav-auth-links">
                        <ThemeToggle />
                        <Link to="/login" className="btn btn-secondary">Login</Link>
                        <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                    </div>
                </nav>
            </header>

            <main style={{ minHeight: '80vh', padding: '5rem 0' }}>
                <div className="container" style={{ maxWidth: '560px' }}>
                    <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
                        Contact <span className="gradient-text">Us</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Have a question or feedback? We'd love to hear from you.
                    </p>

                    {submitted ? (
                        <div style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)', padding: '2rem',
                            textAlign: 'center', color: 'var(--text)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you within 24 hours.</p>
                            <Link to="/" style={{ display: 'inline-block', marginTop: '1.5rem' }} className="btn-hero-primary">Back to Home</Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{
                            background: 'var(--surface)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)', padding: '2rem',
                            display: 'flex', flexDirection: 'column', gap: '1rem'
                        }}>

                            {/* Role — always a free dropdown */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>
                                    I am a
                                </label>
                                <select
                                    name="role"
                                    value={form.role}
                                    onChange={handleChange}
                                    style={{ ...inputStyle, cursor: 'pointer' }}
                                >
                                    <option value="Customer">Customer</option>
                                    <option value="Service Provider">Service Provider</option>
                                </select>
                            </div>

                            {/* Name */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Your Name</label>
                                <input
                                    type="text" name="name" value={form.name}
                                    onChange={handleChange} placeholder="John Doe"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Email</label>
                                <input
                                    type="email" name="email" value={form.email}
                                    onChange={handleChange} placeholder="john@example.com"
                                    style={inputStyle}
                                />
                            </div>

                            {/* Message */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Message</label>
                                <textarea
                                    name="message" rows={5} value={form.message}
                                    onChange={handleChange} placeholder="How can we help you?"
                                    style={{ ...inputStyle, resize: 'vertical' }}
                                />
                            </div>

                            {error && (
                                <p style={{ color: 'var(--danger-color, #ef4444)', fontSize: '0.875rem', margin: 0 }}>
                                    ⚠️ {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                className="btn-hero-primary"
                                style={{ marginTop: '0.5rem', opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer' }}
                                disabled={loading}
                            >
                                {loading ? 'Sending...' : 'Send Message'}
                            </button>
                        </form>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Contact;