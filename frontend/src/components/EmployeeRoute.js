import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const EmployeeRoute = ({ children }) => {
    const { user, isAuthenticated, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Allow access if user is employee
    if (user?.role !== 'employee') {
        return <Navigate to="/" replace />;
    }

    return children;
};

export default EmployeeRoute;
