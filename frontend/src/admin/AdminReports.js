import React from 'react';
import { Navigate } from 'react-router-dom';

// This component has been deprecated - redirect to AdminOrderAnalytics
const AdminReports = () => {
    return <Navigate to="/admin/order-analytics" />;
};

export default AdminReports;
