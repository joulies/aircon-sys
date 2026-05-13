import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminDashboard = () => {
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalEarnings: 0,
        pendingAppointments: 0,
        pendingRefunds: 0,
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [pendingRefundRequests, setPendingRefundRequests] = useState([]);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch stats
                const statsResponse = await fetch('http://localhost:5000/admin/stats');
                if (!statsResponse.ok) throw new Error('Failed to fetch stats');
                const statsData = await statsResponse.json();
                setStats(statsData);

                // Fetch recent orders
                const ordersResponse = await fetch('http://localhost:5000/admin/orders');
                if (!ordersResponse.ok) throw new Error('Failed to fetch orders');
                const ordersData = await ordersResponse.json();
                setRecentOrders(ordersData.slice(0, 5));

                // Fetch pending refund requests
                const refundsResponse = await fetch('http://localhost:5000/admin/refund-requests');
                if (!refundsResponse.ok) throw new Error('Failed to fetch refund requests');
                const refundsData = await refundsResponse.json();
                setPendingRefundRequests(refundsData.slice(0, 5));

                // Fetch low stock products
                const productsResponse = await fetch('http://localhost:5000/admin/low-stock-products');
                if (!productsResponse.ok) throw new Error('Failed to fetch low stock products');
                const productsData = await productsResponse.json();
                setLowStockProducts(productsData);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Dashboard Overview</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Dashboard Overview</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Dashboard Overview</h2>
            </div>

            {/* Low Stock Alert */}
            {lowStockProducts.length > 0 && (
                <div style={{
                    backgroundColor: '#fff3cd',
                    border: '1px solid #ffc107',
                    borderRadius: '8px',
                    padding: '20px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px'
                }}>
                    <i className="fa-solid fa-triangle-exclamation" style={{ fontSize: '24px', color: '#ff6b6b' }}>⚠️</i>
                    <div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#856404' }}>Low Stock Alert</h3>
                        <p style={{ margin: 0, color: '#856404' }}>
                            {lowStockProducts.length} product(s) have stock level at 3 or below
                        </p>
                    </div>
                    <a href="/admin/products" style={{
                        marginLeft: 'auto',
                        backgroundColor: '#ffc107',
                        color: 'black',
                        padding: '10px 20px',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                    }}>
                        View Products
                    </a>
                </div>
            )}

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">🛒</div>
                    <div className="stat-info">
                        <h3>Total Orders</h3>
                        <p>{stats.totalOrders}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-green">💰</div>
                    <div className="stat-info">
                        <h3>Earnings</h3>
                        <p>₱{stats.totalEarnings.toLocaleString()}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-orange">📅</div>
                    <div className="stat-info">
                        <h3>Appointments</h3>
                        <p>{stats.pendingAppointments}</p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon bg-red">↩️</div>
                    <div className="stat-info">
                        <h3>Pending Refunds</h3>
                        <p>{stats.pendingRefunds}</p>
                    </div>
                </div>
            </div>

            {/* Recent Orders Section */}
            <div className="recent-section">
                <h3 style={{ marginBottom: '20px' }}>Recent Orders</h3>
                {recentOrders.length === 0 ? (
                    <p style={{ color: '#666' }}>No orders found</p>
                ) : (
                    <>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Payment Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((order) => (
                                    <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', color: '#333' }}>#{order.id}</td>
                                        <td style={{ padding: '12px', color: '#333' }}>{order.fname} {order.lname}</td>
                                        <td style={{ padding: '12px', color: '#666' }}>
                                            {new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '12px', color: '#333' }}>₱{order.total_amount.toLocaleString()}</td>
                                        <td style={{ padding: '12px' }}>
                                            <span className={`payment-status-pill status-${order.payment_status.toLowerCase().replace(' ', '-')}`}>
                                                {order.payment_status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <span className={`status-pill status-${order.status.toLowerCase()}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                            <a href="/admin/orders" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
                                View All Orders →
                            </a>
                        </div>
                    </>
                )}
            </div>

            {/* Pending Refund Requests Section */}
            <div className="recent-section" style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '20px' }}>📧 Pending Refund Requests</h3>
                {pendingRefundRequests.length > 0 ? (
                    <>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #eee' }}>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Request ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Reason</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pendingRefundRequests.map((request) => (
                                    <tr key={request.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', color: '#333' }}>#{request.id}</td>
                                        <td style={{ padding: '12px', color: '#333' }}>{request.fname} {request.lname}</td>
                                        <td style={{ padding: '12px', color: '#333' }}>#{request.order_id}</td>
                                        <td style={{ padding: '12px', color: '#333' }}>₱{request.amount.toLocaleString()}</td>
                                        <td style={{ padding: '12px', color: '#666' }}>{request.reason.substring(0, 50)}...</td>
                                        <td style={{ padding: '12px', color: '#666' }}>
                                            {new Date(request.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            <a href="/admin/refund-requests" style={{ color: '#007bff', textDecoration: 'none', fontWeight: 'bold' }}>View</a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '15px', textAlign: 'right' }}>
                            <a href="/admin/refund-requests" style={{ color: '#007bff', textDecoration: 'none', fontSize: '14px' }}>
                                View All Refund Requests →
                            </a>
                        </div>
                    </>
                ) : (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No pending refund requests</p>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminDashboard;
