import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { ArrowLeft, User, Mail, Lock, Briefcase, Users, Phone, MapPin, Star, CreditCard } from 'lucide-react';
import './Auth.css';
import ThemeToggle from './ThemeToggle';

const Signup = () => {
    const [step, setStep] = useState(1);
    const [role, setRole] = useState("");
    const [form, setForm] = useState({
        name: "", email: "", password: "",
        phone: "", area: "",
        experience: "", aadhaar: ""
    });
    const navigate = useNavigate();

    const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

    const handleNext = () => {
        if (!form.name || !form.email || !form.password) {
            toast.error("Please fill all fields", { position: "top-center" }); return;
        }
        if (!role) {
            toast.error("Please select a role", { position: "top-center" }); return;
        }
        if (form.password.length < 6) {
            toast.error("Password must be at least 6 characters", { position: "top-center" }); return;
        }
        setStep(2);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.phone || !form.area) {
            toast.error("Phone and area are required", { position: "top-center" }); return;
        }
        if (!/^[6-9]\d{9}$/.test(form.phone)) {
            toast.error("Enter a valid 10-digit Indian phone number", { position: "top-center" }); return;
        }
        try {
            await axios.post("http://localhost:5000/api/signup", { ...form, role });
            const loginRes = await axios.post("http://localhost:5000/api/login", {
                email: form.email,
                password: form.password
            });
            localStorage.setItem("token", loginRes.data.token);
            localStorage.setItem("user", JSON.stringify(loginRes.data.user));
            const userRole = loginRes.data.user.role;
            if (userRole === "Customer") navigate("/customer");
            else if (userRole === "Service Provider") navigate("/provider");
            else navigate("/login");
        } catch (err) {
            toast.error(err.response?.data?.message || "Signup failed", { position: "top-center" });
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-logo">ServeNest</div>
            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}><ThemeToggle /></div>

            <div className="auth-card">
                <Link to="/" className="back-link">
                    <ArrowLeft size={16} /> Back to home
                </Link>
                <h2>Create account</h2>
                <p className="auth-subtitle">
                    {step === 1 ? "Join ServeNest today" : "Just a few more details"}
                </p>

                {/* Step indicator */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: step >= 1 ? 'var(--primary, #6c63ff)' : 'var(--border-color, #e0e0e0)' }} />
                    <div style={{ flex: 1, height: 3, borderRadius: 2, background: step >= 2 ? 'var(--primary, #6c63ff)' : 'var(--border-color, #e0e0e0)' }} />
                </div>

                {step === 1 && (
                    <div className="auth-form">
                        <div className="input-group">
                            <div className="input-icon"><User size={18} /></div>
                            <input className="auth-input" type="text" placeholder="Full name" value={form.name} onChange={set('name')} required />
                        </div>
                        <div className="input-group">
                            <div className="input-icon"><Mail size={18} /></div>
                            <input className="auth-input" type="email" placeholder="Email" value={form.email} onChange={set('email')} required />
                        </div>
                        <div className="input-group">
                            <div className="input-icon"><Lock size={18} /></div>
                            <input className="auth-input" type="password" placeholder="Password (min 6 chars)" value={form.password} onChange={set('password')} required />
                        </div>

                        <div>
                            <span className="role-label">I am a...</span>
                            <div className="role-buttons">
                                <button type="button" className={`role-btn ${role === "Service Provider" ? "active-role" : ""}`} onClick={() => setRole("Service Provider")}>
                                    <Briefcase size={16} /> Provider
                                </button>
                                <button type="button" className={`role-btn ${role === "Customer" ? "active-role" : ""}`} onClick={() => setRole("Customer")}>
                                    <Users size={16} /> Customer
                                </button>
                            </div>
                        </div>

                        <button type="button" className="auth-submit" onClick={handleNext}>
                            Next →
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form className="auth-form" onSubmit={handleSubmit}>
                        <div className="input-group">
                            <div className="input-icon"><Phone size={18} /></div>
                            <input className="auth-input" type="tel" placeholder="Phone number (10 digits)" value={form.phone} onChange={set('phone')} required />
                        </div>
                        <div className="input-group">
                            <div className="input-icon"><MapPin size={18} /></div>
                            <input className="auth-input" type="text" placeholder="Your area / locality (e.g. Anna Nagar)" value={form.area} onChange={set('area')} required />
                        </div>

                        {role === "Service Provider" && (
                            <>
                                <div className="input-group">
                                    <div className="input-icon"><Star size={18} /></div>
                                    <input className="auth-input" type="text" placeholder="Years of experience (e.g. 5)" value={form.experience} onChange={set('experience')} />
                                </div>
                                <div className="input-group">
                                    <div className="input-icon"><CreditCard size={18} /></div>
                                    <input className="auth-input" type="text" placeholder="Aadhaar number (12 digits)" value={form.aadhaar} onChange={set('aadhaar')} maxLength={12} />
                                </div>
                                <p style={{ fontSize: 11, color: 'var(--text-muted, #888)', marginTop: -8 }}>
                                    Aadhaar is used for identity verification only. Never shared publicly.
                                </p>
                            </>
                        )}

                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" className="btn-secondary" onClick={() => setStep(1)}
                                style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-color, #e0e0e0)', background: 'transparent', cursor: 'pointer', color: 'var(--text, inherit)' }}>
                                ← Back
                            </button>
                            <button type="submit" className="auth-submit" style={{ flex: 2 }}>
                                Create account
                            </button>
                        </div>
                    </form>
                )}

                <div className="auth-footer">
                    Already have an account? <Link to="/login">Log in</Link>
                </div>
            </div>
            <ToastContainer theme="light" />
        </div>
    );
};

export default Signup;