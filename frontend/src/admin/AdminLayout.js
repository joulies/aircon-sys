import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/admin.css';

const AdminLayout = ({ children }) => {
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
                <img src="https://via.placeholder.com/150x50?text=VA+Logo" alt="VA Logo" className="nav-logo" />
                <p className="company">VA Industrial Electrical Services</p>
                <hr className="nav-divider" />
                
                <ul>
                    <li>
                        <Link 
                            to="/admin/dashboard" 
                            className={`nav-link ${isActive('/admin/dashboard')}`}
                        >
                            Dashboard
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/users" 
                            className={`nav-link ${isActive('/admin/users')}`}
                        >
                            Users
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/orders" 
                            className={`nav-link ${isActive('/admin/orders')}`}
                        >
                            Orders
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/order-analytics" 
                            className={`nav-link ${isActive('/admin/order-analytics')}`}
                        >
                            Order Analytics
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/appointments" 
                            className={`nav-link ${isActive('/admin/appointments')}`}
                        >
                            Appointments
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/assign-employees" 
                            className={`nav-link ${isActive('/admin/assign-employees')}`}
                        >
                            Assign Employees
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/employees" 
                            className={`nav-link ${isActive('/admin/employees')}`}
                        >
                            Employees
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/products" 
                            className={`nav-link ${isActive('/admin/products')}`}
                        >
                            Product Catalog
                        </Link>
                    </li>
                    <li>
                        <Link 
                            to="/admin/refund-requests" 
                            className={`nav-link ${isActive('/admin/refund-requests')}`}
                        >
                            Refund Requests
                        </Link>
                    </li>
                </ul>

                <hr className="nav-divider" />

                <ul>
                    <li>
                        <Link 
                            to="/admin/settings" 
                            className="nav-link"
                        >
                            Settings
                        </Link>
                    </li>
                    <li>
                        <button
                            onClick={handleLogout}
                            className="nav-link logout-btn"
                        >
                            Logout
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

export default AdminLayout;
