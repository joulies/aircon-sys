import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pendingReceipts, setPendingReceipts] = useState([]);
    const [awaitingAssignment, setAwaitingAssignment] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ordersRes, receiptsRes, assignmentRes, employeesRes] = await Promise.all([
                fetch('http://localhost:5000/admin/orders'),
                fetch('http://localhost:5000/admin/orders/pending-receipts'),
                fetch('http://localhost:5000/admin/orders/awaiting-assignment'),
                fetch('http://localhost:5000/admin/employees')
            ]);

            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            if (!receiptsRes.ok) throw new Error('Failed to fetch pending receipts');
            if (!assignmentRes.ok) throw new Error('Failed to fetch orders awaiting assignment');
            if (!employeesRes.ok) throw new Error('Failed to fetch employees');

            const ordersData = await ordersRes.json();
            const receiptsData = await receiptsRes.json();
            const assignmentData = await assignmentRes.json();
            const employeesData = await employeesRes.json();

            setOrders(ordersData);
            setPendingReceipts(receiptsData);
            setAwaitingAssignment(assignmentData);
            setEmployees(employeesData);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReceipt = async (orderId) => {
        if (!window.confirm('Confirm this receipt payment?')) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/orders/${orderId}/confirm-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) throw new Error('Failed to confirm receipt');
            alert('Receipt confirmed successfully!');
            setShowReceiptModal(false);
            fetchAllData();
        } catch (err) {
            console.error('Error:', err);
            alert('Error confirming receipt');
        }
    };

    const handleRejectReceipt = async (orderId) => {
        if (!window.confirm('Are you sure you want to reject this payment?')) return;

        try {
            const response = await fetch(`http://localhost:5000/admin/orders/${orderId}/reject-receipt`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: rejectionReason })
            });

            if (!response.ok) throw new Error('Failed to reject receipt');
            alert('Payment rejected successfully!');
            setShowReceiptModal(false);
            setRejectionReason('');
            fetchAllData();
        } catch (err) {
            console.error('Error:', err);
            alert('Error rejecting payment');
        }
    };

    const handleAssignEmployee = async (orderId) => {
        if (!selectedEmployee) {
            alert('Please select an employee');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/admin/orders/${orderId}/assign-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: selectedEmployee })
            });

            if (!response.ok) throw new Error('Failed to assign employee');
            alert('Employee assigned successfully!');
            setShowAssignModal(false);
            setSelectedEmployee('');
            fetchAllData();
        } catch (err) {
            console.error('Error:', err);
            alert('Error assigning employee');
        }
    };

    const renderReceiptModal = () => {
        if (!showReceiptModal || !selectedOrder) return null;

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
                    <h2>Receipt Confirmation</h2>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Order #:</strong> {selectedOrder.order_number}</p>
                        <p><strong>Customer:</strong> {selectedOrder.fname} {selectedOrder.lname}</p>
                        <p><strong>Payment Method:</strong> {selectedOrder.payment_method.toUpperCase()}</p>
                        <p><strong>Downpayment:</strong> ₱{parseFloat(selectedOrder.downpayment_amount).toFixed(2)}</p>
                    </div>

                    {selectedOrder.proof_file && (
                        <div style={{ marginBottom: '20px', border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                            <p style={{ marginBottom: '10px' }}><strong>Receipt Image:</strong></p>
                            <img
                                src={`http://localhost:5000${selectedOrder.proof_file}`}
                                alt="Receipt"
                                style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: '4px' }}
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px' }}>
                            <strong>Rejection Reason (optional):</strong>
                        </label>
                        <textarea
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            placeholder="Enter reason for rejection (e.g., Invalid receipt, Amount mismatch, etc.)"
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
                                setShowReceiptModal(false);
                                setRejectionReason('');
                            }}
                            style={{
                                padding: '10px 20px', backgroundColor: '#ccc',
                                color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleRejectReceipt(selectedOrder.id)}
                            style={{
                                padding: '10px 20px', backgroundColor: '#dc3545',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Reject Payment
                        </button>
                        <button
                            onClick={() => handleConfirmReceipt(selectedOrder.id)}
                            style={{
                                padding: '10px 20px', backgroundColor: '#28a745',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Confirm Receipt & Mark Half Paid
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const renderAssignModal = () => {
        if (!showAssignModal || !selectedOrder) return null;

        const isCOD = selectedOrder.payment_method === 'cod';

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '8px', padding: '30px',
                    maxWidth: '500px', width: '90%'
                }}>
                    <h2>Assign Employee</h2>
                    <div style={{ marginBottom: '20px' }}>
                        <p><strong>Order #:</strong> {selectedOrder.order_number}</p>
                        <p><strong>Customer:</strong> {selectedOrder.fname} {selectedOrder.lname}</p>
                        {isCOD && (
                            <div style={{
                                backgroundColor: '#e8f5e9',
                                border: '1px solid #4caf50',
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '15px',
                                color: '#2e7d32'
                            }}>
                                <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>💰 Cash on Delivery (COD)</p>
                                <p style={{ margin: 0, fontSize: '13px' }}>
                                    Customer will pay the full amount (₱{parseFloat(selectedOrder.total_amount).toFixed(2)}) on the appointment date. Ensure they are notified about payment terms.
                                </p>
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '10px' }}>
                            <strong>Select Employee:</strong>
                        </label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            style={{
                                width: '100%', padding: '10px', border: '1px solid #ddd',
                                borderRadius: '4px', fontSize: '14px'
                            }}
                        >
                            <option value="">-- Select an employee --</option>
                            {employees.map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                    {emp.fname} {emp.lname} - {emp.email}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setShowAssignModal(false);
                                setSelectedEmployee('');
                            }}
                            style={{
                                padding: '10px 20px', backgroundColor: '#ccc',
                                color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={() => handleAssignEmployee(selectedOrder.id)}
                            style={{
                                padding: '10px 20px', backgroundColor: '#0066cc',
                                color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                            }}
                        >
                            Assign Employee
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

    const renderTable = (data) => {
        if (data.length === 0) {
            return <p style={{ color: '#666' }}>No orders found</p>;
        }

        if (activeTab === 'pending-receipts') {
            return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Payment Method</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Downpayment</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>{order.order_number}</td>
                                <td style={{ padding: '12px', color: '#333' }}>{order.fname} {order.lname}</td>
                                <td style={{ padding: '12px', color: '#333' }}>{order.payment_method.toUpperCase()}</td>
                                <td style={{ padding: '12px', color: '#333' }}>₱{parseFloat(order.downpayment_amount).toFixed(2)}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '4px 8px', borderRadius: '4px', fontSize: '12px' }}>
                                        Half Paid - Awaiting Confirmation
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowReceiptModal(true);
                                        }}
                                        style={{
                                            padding: '5px 10px', backgroundColor: '#28a745',
                                            color: 'white', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '12px'
                                        }}
                                    >
                                        View Receipt
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        if (activeTab === 'awaiting-assignment') {
            return (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Contact</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Payment Method</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Status</th>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>{order.order_number}</td>
                                <td style={{ padding: '12px', color: '#333' }}>{order.fname} {order.lname}</td>
                                <td style={{ padding: '12px', color: '#333' }}>{order.contact}</td>
                                <td style={{ padding: '12px', color: '#333' }}>₱{parseFloat(order.total_amount).toFixed(2)}</td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        backgroundColor: order.payment_method === 'cod' ? '#e8f5e9' : '#fff3cd',
                                        color: order.payment_method === 'cod' ? '#2e7d32' : '#856404',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        {order.payment_method === 'cod' ? '💰 COD' : order.payment_method.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <span style={{
                                        backgroundColor: order.payment_method === 'cod' ? '#e3f2fd' : '#cce5ff',
                                        color: '#004085',
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        fontSize: '12px'
                                    }}>
                                        {order.payment_method === 'cod' ? 'Awaiting Assignment' : 'Paid - Awaiting Assignment'}
                                    </span>
                                </td>
                                <td style={{ padding: '12px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowAssignModal(true);
                                        }}
                                        style={{
                                            padding: '5px 10px', backgroundColor: '#0066cc',
                                            color: 'white', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '12px'
                                        }}
                                    >
                                        Assign Employee
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order ID</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Amount</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Payment Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Order Status</th>
                        <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                            <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>{order.order_number}</td>
                            <td style={{ padding: '12px', color: '#333' }}>{order.fname} {order.lname}</td>
                            <td style={{ padding: '12px', color: '#333' }}>₱{parseFloat(order.total_amount).toLocaleString()}</td>
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
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Orders Management</h2>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', borderBottom: '1px solid #eee' }}>
                <button
                    onClick={() => setActiveTab('all')}
                    style={{
                        padding: '10px 20px', backgroundColor: activeTab === 'all' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'all' ? 'white' : '#333', border: 'none',
                        borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: activeTab === 'all' ? '600' : '400'
                    }}
                >
                    All Orders ({orders.length})
                </button>
                <button
                    onClick={() => setActiveTab('pending-receipts')}
                    style={{
                        padding: '10px 20px', backgroundColor: activeTab === 'pending-receipts' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'pending-receipts' ? 'white' : '#333', border: 'none',
                        borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: activeTab === 'pending-receipts' ? '600' : '400'
                    }}
                >
                    📋 Pending Receipts ({pendingReceipts.length})
                </button>
                <button
                    onClick={() => setActiveTab('awaiting-assignment')}
                    style={{
                        padding: '10px 20px', backgroundColor: activeTab === 'awaiting-assignment' ? '#0066cc' : '#f0f0f0',
                        color: activeTab === 'awaiting-assignment' ? 'white' : '#333', border: 'none',
                        borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: activeTab === 'awaiting-assignment' ? '600' : '400'
                    }}
                >
                    👤 Awaiting Assignment ({awaitingAssignment.length})
                </button>
            </div>

            <div className="recent-section">
                {renderTable(activeTab === 'all' ? orders : activeTab === 'pending-receipts' ? pendingReceipts : awaitingAssignment)}
            </div>

            {renderReceiptModal()}
            {renderAssignModal()}
        </AdminLayout>
    );
};

export default AdminOrders;
