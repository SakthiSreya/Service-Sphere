import React from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import LogoIcon from './LogoIcon';

const Navbar = () => {
    return (
        <header className="main-header">
            <nav className="main-nav container">
                <Link to="/" className="logo">
                    <LogoIcon size={36} id="nav" />
                    ServeNest
                </Link>
                <div className="nav-auth-links">
                    <ThemeToggle />
                    <Link to="/login" className="btn btn-secondary">Login</Link>
                    <Link to="/signup" className="btn btn-primary">Sign Up</Link>
                </div>
            </nav>
        </header>
    );
};

export default Navbar;