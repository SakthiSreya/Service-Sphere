// src/Contact.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Home.css';

const Contact = () => {
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
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
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '2rem',
                            textAlign: 'center',
                            color: 'var(--text)'
                        }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✅</div>
                            <h3 style={{ marginBottom: '0.5rem' }}>Message Sent!</h3>
                            <p style={{ color: 'var(--text-secondary)' }}>We'll get back to you within 24 hours.</p>
                            <Link to="/" style={{ display: 'inline-block', marginTop: '1.5rem' }} className="btn-hero-primary">Back to Home</Link>
                        </div>
                    ) : (
                        <div style={{
                            background: 'var(--surface)',
                            border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-xl)',
                            padding: '2rem',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                        }}>
                            {[
                                { label: 'Your Name', type: 'text', placeholder: 'John Doe' },
                                { label: 'Email', type: 'email', placeholder: 'john@example.com' },
                            ].map(({ label, type, placeholder }) => (
                                <div key={label}>
                                    <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>{label}</label>
                                    <input type={type} placeholder={placeholder} style={{
                                        width: '100%', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)',
                                        border: '1px solid var(--border)', background: 'var(--bg)',
                                        color: 'var(--text)', fontSize: '0.95rem', boxSizing: 'border-box'
                                    }} />
                                </div>
                            ))}
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--text)' }}>Message</label>
                                <textarea rows={5} placeholder="How can we help you?" style={{
                                    width: '100%', padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-md)',
                                    border: '1px solid var(--border)', background: 'var(--bg)',
                                    color: 'var(--text)', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box'
                                }} />
                            </div>
                            <button onClick={handleSubmit} className="btn-hero-primary" style={{ marginTop: '0.5rem' }}>
                                Send Message
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Contact;