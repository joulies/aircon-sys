import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/employee.css';

const EmployeeLayout = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { logout, user } = useAuth();

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
                <svg className="nav-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 10 L70 40 L85 35 L65 70 L85 65 L70 90 L50 65 L30 90 L15 65 L35 70 L20 35 L35 40 Z" fill="white" stroke="white" strokeWidth="2"/>
                </svg>
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
