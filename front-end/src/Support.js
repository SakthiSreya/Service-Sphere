// src/Support.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Home.css';

const faqs = [
    { q: "How do I book a service?", a: "Sign up, search for the service you need, pick a provider, and book a time slot that works for you." },
    { q: "How are providers verified?", a: "All providers go through an identity and background check before being listed on the platform." },
    { q: "Can I cancel a booking?", a: "Yes. You can cancel a booking from your dashboard up to 2 hours before the scheduled time." },
    { q: "How do payments work?", a: "Payments are securely processed through the platform after the service is completed." },
    { q: "How do I become a provider?", a: "Click 'Join as Provider' and complete the registration and verification process." },
];

const Support = () => {
    const [open, setOpen] = useState(null);

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
                <div className="container" style={{ maxWidth: '700px' }}>
                    <h1 className="section-title" style={{ marginBottom: '0.5rem' }}>
                        Support <span className="gradient-text">Center</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2.5rem' }}>
                        Frequently asked questions — find answers instantly.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {faqs.map((item, i) => (
                            <div key={i} style={{
                                background: 'var(--surface)', border: '1px solid var(--border)',
                                borderRadius: 'var(--radius-lg)', overflow: 'hidden'
                            }}>
                                <button onClick={() => setOpen(open === i ? null : i)} style={{
                                    width: '100%', padding: '1rem 1.25rem', display: 'flex',
                                    justifyContent: 'space-between', alignItems: 'center',
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem',
                                    textAlign: 'left', gap: '1rem'
                                }}>
                                    {item.q}
                                    <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>{open === i ? '−' : '+'}</span>
                                </button>
                                {open === i && (
                                    <div style={{
                                        padding: '0 1.25rem 1rem',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem', lineHeight: 1.7
                                    }}>
                                        {item.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <p style={{ marginTop: '2.5rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                        Still need help?{' '}
                        <Link to="/contact" style={{ color: 'var(--primary)', fontWeight: 600 }}>Contact us</Link>
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Support;