import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminOrderAnalytics = () => {
    const [analyticsData, setAnalyticsData] = useState({
        totalOrdersThisMonth: 0,
        totalRevenueThisMonth: 0,
        averageOrderValue: 0,
        completionRate: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/admin/order-analytics');
                if (!response.ok) throw new Error('Failed to fetch analytics');
                const data = await response.json();
                setAnalyticsData(data);
            } catch (err) {
                console.error('Error fetching analytics:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Order Analytics</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Order Analytics</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Order Analytics</h2>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">📊</div>
                    <div className="stat-info">
                        <h3>Orders This Month</h3>
                        <p>{analyticsData.totalOrdersThisMonth}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-green">💰</div>
                    <div className="stat-info">
                        <h3>Revenue This Month</h3>
                        <p>₱{analyticsData.totalRevenueThisMonth.toLocaleString()}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-orange">📈</div>
                    <div className="stat-info">
                        <h3>Average Order Value</h3>
                        <p>₱{analyticsData.averageOrderValue.toLocaleString()}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-success">✅</div>
                    <div className="stat-info">
                        <h3>Completion Rate</h3>
                        <p>{analyticsData.completionRate}%</p>
                    </div>
                </div>
            </div>

            <div className="recent-section">
                <h3 style={{ marginBottom: '20px' }}>Analytics Charts</h3>
                <div style={{
                    height: '400px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#999'
                }}>
                    📊 Chart visualization will be displayed here (integrate with Chart.js or similar)
                </div>
            </div>
        </AdminLayout>
    );
};

export default AdminOrderAnalytics;
