// src/About.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './ThemeContext';
import ThemeToggle from './ThemeToggle';
import './Home.css'; // reuse your existing styles

const About = () => {
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
                    <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
                        About <span className="gradient-text">ServiceSphere</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                        ServiceSphere was built with a simple mission: make it effortless for people to find
                        trustworthy local service professionals, and help skilled providers grow their business.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                        We verify every provider on our platform, ensure transparent reviews, and offer a
                        seamless booking experience — so you spend less time searching and more time getting
                        things done.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                        Whether you need a plumber, tutor, electrician, or house cleaner — ServiceSphere
                        connects you with the right person, fast.
                    </p>
                    <div style={{ marginTop: '2.5rem' }}>
                        <Link to="/" className="btn-hero-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                            ← Back to Home
                        </Link>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default About;