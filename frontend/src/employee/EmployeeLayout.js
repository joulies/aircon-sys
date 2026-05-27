import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../logo.png';
import '../styles/employee.css';

const EmployeeLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleLogout = () => {
        if (window.confirm('Are you sure you want to logout?')) {
            logout();
            navigate('/login');
        }
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <div className="layout">
            <nav className="left-nav">
                <img src={logo} alt="VA Industrial Electrical Services Logo" className="nav-logo" />
                <p className="company">VA Industrial — Employee</p>

                <ul>
                    <li>
                        <Link
                            to="/employee/dashboard"
                            className={`nav-link ${isActive('/employee/dashboard')}`}
                        >
                            <i className="fas fa-home"></i>Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/employee/assigned"
                            className={`nav-link ${isActive('/employee/assigned')}`}
                        >
                            <i className="fas fa-calendar-check"></i>Assigned Appointments
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/employee/history"
                            className={`nav-link ${isActive('/employee/history')}`}
                        >
                            <i className="fas fa-history"></i>Appointments History
                        </Link>
                    </li>
                </ul>

                <hr className="nav-divider" />

                <ul>
                    <li>
                        <Link
                            to="/employee/settings"
                            className={`nav-link ${isActive('/employee/settings')}`}
                        >
                            <i className="fas fa-cog"></i>Account Settings
                        </Link>
                    </li>
                    <li>
                        <button
                            onClick={handleLogout}
                            className="nav-link logout-btn"
                        >
                            <i className="fas fa-sign-out-alt"></i>Logout
                        </button>
                    </li>
                </ul>
            </nav>

            <div className="content">
                {children}
            </div>
        </div>
    );
};

export default EmployeeLayout;
