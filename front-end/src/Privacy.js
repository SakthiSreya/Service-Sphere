// src/Privacy.js
import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import './Home.css';

const sections = [
    { title: "Information We Collect", body: "We collect information you provide directly, such as your name, email address, and payment details when you register or make a booking." },
    { title: "How We Use Your Information", body: "Your information is used to facilitate bookings, verify providers, process payments, and improve our platform experience." },
    { title: "Sharing Your Information", body: "We do not sell your personal data. We share information only with service providers involved in your booking and as required by law." },
    { title: "Data Security", body: "We use industry-standard encryption and security practices to protect your personal information at all times." },
    { title: "Your Rights", body: "You have the right to access, correct, or delete your personal data at any time by contacting us through the support page." },
    { title: "Contact", body: "For any privacy-related concerns, please reach out via our Contact page and we'll respond within 48 hours." },
];

const Privacy = () => {
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
                <div className="container" style={{ maxWidth: '760px' }}>
                    <h1 className="section-title" style={{ marginBottom: '0.25rem' }}>
                        Privacy <span className="gradient-text">Policy</span>
                    </h1>
                    <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem', marginBottom: '2.5rem' }}>
                        Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {sections.map(({ title, body }) => (
                            <div key={title}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text)' }}>{title}</h3>
                                <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, margin: 0 }}>{body}</p>
                            </div>
                        ))}
                    </div>

                    <div style={{ marginTop: '3rem' }}>
                        <Link to="/" className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Privacy;