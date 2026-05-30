import React from 'react';
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Calendar, Star, Search, ArrowRight, Users } from "lucide-react";
import "./Home.css";
import Navbar from './Navbar';
import LogoIcon from './LogoIcon';

const Home = () => {
    const navigate = useNavigate();

    const features = [
        { icon: <Search size={28} />, title: "Find Local Services", description: "Discover trusted service providers in your area with advanced filtering options." },
        { icon: <Calendar size={28} />, title: "Easy Booking", description: "Schedule appointments instantly with our real-time availability checking system." },
        { icon: <Star size={28} />, title: "Verified Reviews", description: "Read authentic reviews from verified customers to make informed decisions." },
        { icon: <ShieldCheck size={28} />, title: "Secure & Reliable", description: "All providers are vetted for quality and payments are securely processed." }
    ];

    const serviceCategories = [
        { name: "Plumbing", icon: "🔧", count: "240+ providers" },
        { name: "House Cleaning", icon: "✨", count: "180+ providers" },
        { name: "Electrical", icon: "⚡", count: "150+ providers" },
        { name: "Tutoring", icon: "📚", count: "300+ providers" },
        { name: "Appliance Repair", icon: "🔨", count: "160+ providers" },
        { name: "Gardening", icon: "🌿", count: "130+ providers" },
    ];

    const testimonials = [
        { name: "Sarah J.", role: "Homeowner", content: "Found an amazing plumber through ServeNest. The booking process was seamless and the service was top-notch!", rating: 5 },
        { name: "Mike C.", role: "Service Provider", content: "As an electrician, ServeNest has helped me grow my business significantly. The platform is easy to use and brings quality customers.", rating: 5 },
        { name: "Emily D.", role: "Busy Parent", content: "ServeNest saved me so much time finding reliable tutoring services for my kids. Highly recommended!", rating: 5 }
    ];

    return (
        <div className="landing-container">
            <Navbar />

            <main className="hero-section">
                <div className="hero-content container">
                    <h1 className="hero-heading">
                        Find & Book <span className="gradient-text">Trusted Local Services</span> In Minutes
                    </h1>
                    <p className="hero-tagline">Connect with verified professionals for all your needs. From home repairs to tutoring, find the best with real reviews.</p>
                    <div className="hero-cta-group">
                        <button onClick={() => navigate('/signup')} className="btn-hero-primary">
                            <Search size={18} /> Find Services <ArrowRight size={18} />
                        </button>
                        <button onClick={() => navigate('/signup?role=provider')} className="btn-hero-secondary">
                            <Users size={18} /> Become a Provider
                        </button>
                    </div>
                </div>
            </main>

            <section className="stats-section container">
                <div className="stat-item"><div className="stat-value">1,200+</div><div className="stat-label">Verified Providers</div></div>
                <div className="stat-item"><div className="stat-value">15,000+</div><div className="stat-label">Services Completed</div></div>
                <div className="stat-item"><div className="stat-value">4.9★</div><div className="stat-label">Average Rating</div></div>
            </section>

            <section className="features-section" id="features">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Why Choose <span className="gradient-text">ServeNest?</span></h2>
                        <p className="section-subtitle">We make finding and booking local services simple, safe, and reliable.</p>
                    </div>
                    <div className="features-grid">
                        {features.map((f, i) => (
                            <div key={i} className="feature-card">
                                <div className="feature-icon">{f.icon}</div>
                                <h3>{f.title}</h3>
                                <p>{f.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="how-it-works-section" id="how-it-works">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">How It Works</h2>
                        <p className="section-subtitle">Get the help you need in four simple steps.</p>
                    </div>
                    <div className="how-it-works-grid">
                        <div className="step-card"><div className="step-number">1</div><h3 className="step-title">Search & Compare</h3><p className="step-description">Browse local pros, read verified reviews, and compare prices.</p></div>
                        <div className="step-card"><div className="step-number">2</div><h3 className="step-title">Book Instantly</h3><p className="step-description">Select your preferred time slot and book with just a few clicks.</p></div>
                        <div className="step-card"><div className="step-number">3</div><h3 className="step-title">Get It Done</h3><p className="step-description">Enjoy quality service from a trusted professional.</p></div>
                        <div className="step-card">
                            <div className="step-number">4</div>
                            <h3 className="step-title">AI Assistance</h3>
                            <p className="step-description">Describe your problem or upload an image, get quick tips, urgency rating, and matched providers for your need.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="categories-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">Popular Categories</h2>
                        <p className="section-subtitle">Find the right professional for any job, big or small.</p>
                    </div>
                    <div className="categories-grid">
                        {serviceCategories.map((c, i) => (
                            <div key={i} className="category-card">
                                <span className="category-icon">{c.icon}</span>
                                <div><h3 className="category-name">{c.name}</h3><p className="category-count">{c.count}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="testimonials-section">
                <div className="container">
                    <div className="section-header">
                        <h2 className="section-title">What Our Users Say</h2>
                        <p className="section-subtitle">Thousands of happy customers and successful service providers.</p>
                    </div>
                    <div className="testimonials-grid">
                        {testimonials.map((t, i) => (
                            <div key={i} className="testimonial-card">
                                <div className="testimonial-rating">{[...Array(t.rating)].map((_, j) => <Star key={j} size={18} className="star-icon" />)}</div>
                                <p className="testimonial-content">"{t.content}"</p>
                                <div><div className="author-name">{t.name}</div><div className="author-role">{t.role}</div></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta-section">
                <div className="container">
                    <div className="cta-card">
                        <h2 className="cta-title">Ready to Get Started?</h2>
                        <p className="cta-subtitle">Join thousands of satisfied customers and grow your business with ServeNest.</p>
                        <div className="hero-cta-group">
                            <button onClick={() => navigate('/signup')} className="btn-hero-primary">Find Services Now</button>
                            <button onClick={() => navigate('/signup?role=provider')} className="btn-hero-secondary">Become a Provider</button>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="main-footer">
                <div className="container footer-content">
                    <div className="footer-brand">
                        <div className="logo">
                            <LogoIcon size={36} />
                            ServeNest
                        </div>
                        <p className="footer-tagline">Connecting communities with trusted local services.</p>
                    </div>
                    <div className="footer-links">
                        <h4>For Customers</h4>
                        <ul>
                            <li><a href="#how-it-works">How It Works</a></li>
                            <li><Link to="/signup">Find Services</Link></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>For Providers</h4>
                        <ul>
                            <li><Link to="/signup?role=provider">Join as Provider</Link></li>
                            <li><Link to="/support">Support</Link></li>
                        </ul>
                    </div>
                    <div className="footer-links">
                        <h4>Company</h4>
                        <ul>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact</Link></li>
                            <li><Link to="/privacy">Privacy Policy</Link></li>
                        </ul>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} ServeNest. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
};

export default Home;