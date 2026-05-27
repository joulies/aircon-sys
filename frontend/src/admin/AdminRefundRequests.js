import React, { useState, useEffect } from 'react';
import { showAlert } from '../utils/alertDialog';
import AdminLayout from './AdminLayout';

const AdminRefundRequests = () => {
    const [refundRequests, setRefundRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchRefundRequests();
    }, []);

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

    const handleApprove = async (requestId) => {
        if (!window.confirm('Approve this refund request?')) return;

        setSubmitting(true);
        try {
            const response = await fetch(`http://localhost:5000/admin/refund-requests/${requestId}/approve`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to approve refund request');
            showAlert('Refund request approved successfully', 'Success');
            fetchRefundRequests();
        } catch (err) {
            console.error('Error:', err);
            showAlert('Error approving refund request', 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRejectClick = (request) => {
        setSelectedRequest(request);
        setShowRejectModal(true);
        setRejectionReason('');
    };

    const handleRejectSubmit = async () => {
        if (!rejectionReason.trim()) {
            showAlert('Please provide a reason for rejection', 'Information');
            return;
        }

        setSubmitting(true);
        try {
            const response = await fetch(`http://localhost:5000/admin/refund-requests/${selectedRequest.id}/reject`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            });

            if (!response.ok) throw new Error('Failed to reject refund request');
            showAlert('Refund request rejected successfully', 'Success');
            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectionReason('');
            fetchRefundRequests();
        } catch (err) {
            console.error('Error:', err);
            showAlert('Error rejecting refund request', 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderRejectModal = () => {
        if (!showRejectModal || !selectedRequest) return null;

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '8px', padding: '30px',
                    maxWidth: '600px', width: '90%', maxHeight: '80vh', overflowY: 'auto'
                }}>
                    <h2>Reject Refund Request</h2>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Request ID:</strong> #{selectedRequest.id}</p>
                        <p><strong>Customer:</strong> {selectedRequest.fname} {selectedRequest.lname}</p>
                        <p><strong>Order #:</strong> {selectedRequest.order_number}</p>
                        <p><strong>Amount:</strong> ₱{parseFloat(selectedRequest.amount).toFixed(2)}</p>
                        <p><strong>Original Reason:</strong> {selectedRequest.reason}</p>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                            Rejection Reason: <span style={{ color: 'red' }}>*</span>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection (e.g., Duplicate request, Invalid claim, etc.)"
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px', fontFamily: 'Arial, sans-serif',
                                minHeight: '60px', resize: 'vertical'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setShowRejectModal(false);
                                setSelectedRequest(null);
                                setRejectionReason('');
                            }}
                            disabled={submitting}
                            style={{
                                padding: '10px 20px', backgroundColor: '#ccc',
                                color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleRejectSubmit}
                            disabled={submitting}
                            style={{
                                padding: '10px 20px', backgroundColor: '#dc3545',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            {submitting ? 'Rejecting...' : 'Reject Request'}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

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

            {renderRejectModal()}

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
                                    <td style={{ padding: '12px', color: '#333' }}>{request.order_number}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>₱{parseFloat(request.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{request.reason}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span className={`status-pill status-${request.status.toLowerCase()}`}>
                                            {request.status?.charAt(0).toUpperCase() + request.status?.slice(1)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(request.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {request.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleApprove(request.id)}
                                                    disabled={submitting}
                                                    style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectClick(request)}
                                                    disabled={submitting}
                                                    style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                                                >
                                                    Reject
                                                </button>
                                            </>
                                        ) : (
                                            <span style={{ color: '#666', fontSize: '12px' }}>-</span>
                                        )}
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
