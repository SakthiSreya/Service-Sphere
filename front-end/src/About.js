// src/About.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css'; // reuse your existing styles
import Navbar from './Navbar';

const About = () => {
    return (
        <div className="landing-container">
            <Navbar />

            <main style={{ minHeight: '80vh', padding: '5rem 0' }}>
                <div className="container" style={{ maxWidth: '760px' }}>
                    <h1 className="section-title" style={{ marginBottom: '1.5rem' }}>
                        About <span className="gradient-text">ServeNest</span>
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                        ServeNest was built with a simple mission: make it effortless for people to find
                        trustworthy local service professionals, and help skilled providers grow their business.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem', marginBottom: '1.5rem' }}>
                        We verify every provider on our platform, ensure transparent reviews, and offer a
                        seamless booking experience — so you spend less time searching and more time getting
                        things done.
                    </p>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: 1.8, fontSize: '1.05rem' }}>
                        Whether you need a plumber, tutor, electrician, or house cleaner — ServeNest
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