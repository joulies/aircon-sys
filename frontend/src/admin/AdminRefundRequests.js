import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminRefundRequests = () => {
    const [refundRequests, setRefundRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRefundRequests = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/admin/refund-requests');
                if (!response.ok) throw new Error('Failed to fetch refund requests');
                const data = await response.json();
                setRefundRequests(data);
            } catch (err) {
                console.error('Error fetching refund requests:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRefundRequests();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Refund Requests</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Refund Requests</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Refund Requests</h2>
            </div>

            <div className="recent-section">
                {refundRequests.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No refund requests found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Request ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Reason</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refundRequests.map((request) => (
                                <tr key={request.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#333' }}>#{request.id}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>{request.fname} {request.lname}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>#{request.order_id}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>₱{request.amount.toLocaleString()}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{request.reason}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-pill status-${request.status.toLowerCase()}`}>
                                            {request.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Approve</button>
                                        <button style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Reject</button>
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

export default AdminRefundRequests;
