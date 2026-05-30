import React, { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import { ArrowLeft, Mail, Lock } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import './Auth.css';
import ThemeToggle from './ThemeToggle';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const handleRedirect = (user) => {
        if (user.role === "Service Provider") navigate("/provider");
        else if (user.role === "Admin") navigate("/admin");
        else navigate("/customer");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post("http://localhost:5000/api/login", { email, password });
            toast.success(res.data.message, { position: "top-center" });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            handleRedirect(res.data.user);
        } catch (err) {
            toast.error(err.response?.data?.message || "Login failed", { position: "top-center" });
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post("http://localhost:5000/api/auth/google", {
                credential: credentialResponse.credential,
            });
            toast.success("Logged in with Google!", { position: "top-center" });
            localStorage.setItem("token", res.data.token);
            localStorage.setItem("user", JSON.stringify(res.data.user));
            handleRedirect(res.data.user);
        } catch (err) {
            toast.error("Google login failed", { position: "top-center" });
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
                <h2>Welcome back</h2>
                <p className="auth-subtitle">Sign in to your account</p>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <div className="input-icon"><Mail size={18} /></div>
                        <input className="auth-input" type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="input-group">
                        <div className="input-icon"><Lock size={18} /></div>
                        <input className="auth-input" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="auth-submit">Log in</button>
                </form>

                <div className="auth-divider">
                    <span>or</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => toast.error("Google login failed")}
                        useOneTap
                    />
                </div>

                <div className="auth-footer">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </div>
            </div>
            <ToastContainer theme="light" />
        </div>
    );
};

export default Login;