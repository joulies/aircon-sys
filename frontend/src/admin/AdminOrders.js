import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/admin/orders');
                if (!response.ok) throw new Error('Failed to fetch orders');
                const data = await response.json();
                setOrders(data);
            } catch (err) {
                console.error('Error fetching orders:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Orders Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Orders Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Orders Management</h2>
            </div>

            <div className="recent-section">
                {orders.length === 0 ? (
                    <p style={{ color: '#666' }}>No orders found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Payment Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>#{order.id}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>{order.fname} {order.lname}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>₱{order.total_amount.toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`payment-status-pill status-${order.payment_status.toLowerCase().replace(' ', '')}`}>
                                            {order.payment_status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-pill status-${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button style={{ padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminOrders;
