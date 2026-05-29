import React, { useState, useEffect } from 'react';
import { showAlert, showConfirm } from '../utils/alertDialog';
import AdminLayout from './AdminLayout';

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [pendingReceipts, setPendingReceipts] = useState([]);
    const [awaitingAssignment, setAwaitingAssignment] = useState([]);
    const [cancelledOrders, setCancelledOrders] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [selectedEmployee, setSelectedEmployee] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [assignmentError, setAssignmentError] = useState(null);
    const [assignmentSuccess, setAssignmentSuccess] = useState(null);
    const [unavailableEmployees, setUnavailableEmployees] = useState([]);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [ordersRes, receiptsRes, assignmentRes, employeesRes] = await Promise.all([
                fetch('https://aircon-sys.onrender.com/admin/orders'),
                fetch('https://aircon-sys.onrender.com/admin/orders/pending-receipts'),
                fetch('https://aircon-sys.onrender.com/admin/orders/awaiting-assignment'),
                fetch('https://aircon-sys.onrender.com/admin/employees')
            ]);

            if (!ordersRes.ok) throw new Error('Failed to fetch orders');
            if (!receiptsRes.ok) throw new Error('Failed to fetch pending receipts');
            if (!assignmentRes.ok) throw new Error('Failed to fetch orders awaiting assignment');
            if (!employeesRes.ok) throw new Error('Failed to fetch employees');

            const ordersData = await ordersRes.json();
            const receiptsData = await receiptsRes.json();
            const assignmentData = await assignmentRes.json();
            const employeesData = await employeesRes.json();

            // Separate cancelled orders from active orders
            const activeOrders = ordersData.filter(o => o.status !== 'cancelled');
            const cancelled = ordersData.filter(o => o.status === 'cancelled');

            setOrders(activeOrders);
            setCancelledOrders(cancelled);
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
        showConfirm(
            'Confirm this receipt payment?',
            'Confirm Receipt',
            async () => {
                try {
                    const response = await fetch(`https://aircon-sys.onrender.com/admin/orders/${orderId}/confirm-receipt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });

                    if (!response.ok) throw new Error('Failed to confirm receipt');
                    showAlert('Receipt confirmed successfully!', 'Success');
                    setShowReceiptModal(false);
                    fetchAllData();
                } catch (err) {
                    console.error('Error:', err);
                    showAlert('Error confirming receipt', 'Error');
                }
            }
        );
    };

    const handleRejectReceipt = async (orderId) => {
        showConfirm(
            'Are you sure you want to reject this payment?',
            'Reject Payment',
            async () => {
                try {
                    const response = await fetch(`https://aircon-sys.onrender.com/admin/orders/${orderId}/reject-receipt`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ reason: rejectionReason })
                    });

                    if (!response.ok) throw new Error('Failed to reject receipt');
                    showAlert('Payment rejected successfully!', 'Success');
                    setShowReceiptModal(false);
                    setRejectionReason('');
                    fetchAllData();
                } catch (err) {
                    console.error('Error:', err);
                    showAlert('Error rejecting payment', 'Error');
                }
            }
        );
    };

    const fetchUnavailableEmployees = async (order) => {
        try {
            // Get appointment for this order
            const appointmentsRes = await fetch('https://aircon-sys.onrender.com/admin/appointments');
            const appointmentsData = await appointmentsRes.json();

            const orderAppointment = appointmentsData.find(apt => apt.user_id === order.user_id && apt.order_id === order.id);

            if (orderAppointment) {
                // Get unavailable employees for this appointment
                const unavailRes = await fetch(`https://aircon-sys.onrender.com/appointments/${orderAppointment.id}/unavailable-employees`);
                if (unavailRes.ok) {
                    const data = await unavailRes.json();
                    setUnavailableEmployees(data.unavailable_employee_ids || []);
                    console.log('[ORDERS] Unavailable employees:', data.unavailable_employee_ids);
                }
            }
        } catch (err) {
            console.error('[ORDERS] Error fetching unavailable employees:', err);
        }
    };

    const handleAssignEmployee = async (orderId) => {
        if (!selectedEmployee) {
            setAssignmentError('Please select an employee');
            return;
        }

        try {
            setAssignmentError(null);
            setAssignmentSuccess(null);
            const response = await fetch(`https://aircon-sys.onrender.com/admin/orders/${orderId}/assign-employee`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ employee_id: selectedEmployee })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error || data.message || 'Failed to assign employee';
                console.error('Assignment error:', errorMsg, data);

                let detailedError = errorMsg;
                if (data.error && data.error.includes('already assigned')) {
                    detailedError = `❌ Time Slot Conflict: ${data.error} at ${data.time} on ${data.date}`;
                } else if (data.error && data.error.includes('daily appointment limit')) {
                    detailedError = `⚠ Employee Fully Booked: ${data.error}`;
                }

                setAssignmentError(detailedError);
                return;
            }

            const selectedEmp = employees.find(e => e.id === parseInt(selectedEmployee));
            setAssignmentSuccess(`✓ Employee ${selectedEmp.fname} ${selectedEmp.lname} assigned successfully to ${selectedOrder.fname} ${selectedOrder.lname}`);
            setShowAssignModal(false);
            setSelectedEmployee('');
            setUnavailableEmployees([]);
            setTimeout(() => setAssignmentSuccess(null), 4000);
            fetchAllData();
        } catch (err) {
            console.error('Error assigning employee:', err);
            setAssignmentError('Error: ' + err.message);
        }
    };

    const getOrderStatusColor = (status) => {
        const colors = {
            'pending': { bg: '#fff3cd', text: '#856404' },
            'completed': { bg: '#d4edda', text: '#155724' },
            'cancelled': { bg: '#f8d7da', text: '#721c24' }
        };
        return colors[status?.toLowerCase()] || { bg: '#e2e3e5', text: '#383d41' };
    };

    const getPaymentStatusColor = (status) => {
        const colors = {
            'unpaid': { bg: '#f8d7da', text: '#721c24' },
            'half paid': { bg: '#fff3cd', text: '#856404' },
            'paid': { bg: '#d4edda', text: '#155724' }
        };
        return colors[status?.toLowerCase()] || { bg: '#e2e3e5', text: '#383d41' };
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
                                src={`https://aircon-sys.onrender.com${selectedOrder.proof_file}`}
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

                    {assignmentError && (
                        <div style={{
                            padding: '14px',
                            marginBottom: '15px',
                            backgroundColor: '#f8d7da',
                            color: '#721c24',
                            border: '2px solid #f5c6cb',
                            borderRadius: '4px',
                            fontSize: '13px',
                            lineHeight: '1.5'
                        }}>
                            {assignmentError}
                        </div>
                    )}

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
                            {employees.map((emp) => {
                                const isUnavailable = unavailableEmployees.includes(emp.id);
                                return (
                                    <option
                                        key={emp.id}
                                        value={emp.id}
                                        disabled={isUnavailable}
                                        style={{
                                            backgroundColor: isUnavailable ? '#f0f0f0' : 'white',
                                            color: isUnavailable ? '#999' : '#333',
                                            opacity: isUnavailable ? 0.6 : 1
                                        }}
                                    >
                                        {emp.fname} {emp.lname} {isUnavailable ? '(Not available)' : ''}
                                    </option>
                                );
                            })}
                        </select>
                        {unavailableEmployees.length > 0 && (
                            <div style={{
                                fontSize: '12px',
                                color: '#999',
                                marginTop: '8px',
                                fontStyle: 'italic'
                            }}>
                                ⚠ {unavailableEmployees.length} employee(s) already assigned at this time
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => {
                                setShowAssignModal(false);
                                setSelectedEmployee('');
                                setAssignmentError(null);
                                setUnavailableEmployees([]);
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

    const renderDetailsModal = () => {
        if (!showDetailsModal || !selectedOrder) return null;

        console.log('Order Data:', selectedOrder);

        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', zIndex: 1000
            }}>
                <div style={{
                    backgroundColor: 'white', borderRadius: '8px', padding: '30px',
                    maxWidth: '900px', width: '95%', maxHeight: '90vh', overflowY: 'auto'
                }}>
                    <h2>Order Details - {selectedOrder.order_number}</h2>
                    <hr style={{ margin: '15px 0' }} />

                    {selectedOrder.status === 'cancelled' && (
                        <div style={{
                            backgroundColor: '#f8d7da',
                            border: '1px solid #f5c6cb',
                            borderRadius: '4px',
                            padding: '15px',
                            marginBottom: '20px',
                            color: '#721c24'
                        }}>
                            <strong>⚠ Cancelled Order:</strong> This order has been cancelled by the customer. No further actions can be performed on this order.
                        </div>
                    )}

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Customer Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>First Name</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.fname || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Last Name</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.lname || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Email</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Contact Number</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.contact || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Installation Specifications</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Room Size (sqm)</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.room_size ? `${selectedOrder.room_size} sqm` : 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Capacity (Rooms/Offices)</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.capacity || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Property Type</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px', textTransform: 'capitalize' }}>{selectedOrder.property_type ? selectedOrder.property_type : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Delivery Address</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: '1 / -1' }}>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>House No./Street Name</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.house || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Province</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.province || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>City</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>
                                    {selectedOrder.city ? (selectedOrder.city === 'dasma' ? 'Dasmariñas' : selectedOrder.city === 'imus' ? 'Imus' : 'Bacoor') : 'N/A'}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Barangay</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.barangay || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Zip Code</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.zip || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Payment Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Payment Method</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px', fontWeight: '600', textTransform: 'uppercase' }}>{selectedOrder.payment_method || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Total Amount</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px', fontWeight: '600' }}>₱{selectedOrder.total_amount ? parseFloat(selectedOrder.total_amount).toFixed(2) : '0.00'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Downpayment Amount</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px', fontWeight: '600' }}>₱{selectedOrder.downpayment_amount ? parseFloat(selectedOrder.downpayment_amount).toFixed(2) : '0.00'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Payment Status</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.payment_status || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Order Status</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Order Status</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px', textTransform: 'capitalize' }}>{selectedOrder.status || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Order Date</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.created_at ? new Date(selectedOrder.created_at).toLocaleDateString() : 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ color: '#333', marginBottom: '15px' }}>Appointment Information</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Appointment #</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.appointment_number || 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Appointment Date</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.appointment_date ? new Date(selectedOrder.appointment_date).toLocaleDateString() : 'N/A'}</p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '12px', fontWeight: '600' }}>Appointment Time</p>
                                <p style={{ margin: 0, color: '#333', fontSize: '14px' }}>{selectedOrder.appointment_time || 'N/A'}</p>
                            </div>
                        </div>
                    </div>

                    {selectedOrder.proof_file && (
                        <div style={{ marginBottom: '20px' }}>
                            <h3 style={{ color: '#333', marginBottom: '15px' }}>Payment Proof</h3>
                            <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '10px' }}>
                                <img
                                    src={`https://aircon-sys.onrender.com${selectedOrder.proof_file}`}
                                    alt="Payment Proof"
                                    style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '4px', objectFit: 'contain' }}
                                />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button
                            onClick={() => setShowDetailsModal(false)}
                            style={{
                                padding: '10px 20px', backgroundColor: '#ccc',
                                color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500'
                            }}
                        >
                            Close
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
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order ID</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Customer</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment #</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Payment Method</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Downpayment</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Status</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', color: '#333', fontWeight: '600', fontSize: '13px' }}>{order.order_number}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.fname} {order.lname}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.appointment_number || 'N/A'}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>
                                    {order.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.payment_method.toUpperCase()}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>₱{parseFloat(order.downpayment_amount).toFixed(2)}</td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{ backgroundColor: '#fff3cd', color: '#856404', padding: '3px 6px', borderRadius: '3px', fontSize: '11px' }}>
                                        Half Paid - Awaiting Confirmation
                                    </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowReceiptModal(true);
                                        }}
                                        style={{
                                            padding: '4px 8px', backgroundColor: '#28a745',
                                            color: 'white', border: 'none', borderRadius: '3px',
                                            cursor: 'pointer', fontSize: '11px'
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
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order ID</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Customer</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment #</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment Date & Time</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Contact</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Payment Method</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Status</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '8px', color: '#333', fontWeight: '600', fontSize: '13px' }}>{order.order_number}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.fname} {order.lname}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.appointment_number || 'N/A'}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>
                                    {order.appointment_date ? (
                                        <div>
                                            <div>{new Date(order.appointment_date).toLocaleDateString()}</div>
                                            <div style={{ color: '#666', fontSize: '11px' }}>{order.appointment_time || '-'}</div>
                                        </div>
                                    ) : 'N/A'}
                                </td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>{order.contact}</td>
                                <td style={{ padding: '8px', color: '#333', fontSize: '13px' }}>₱{parseFloat(order.total_amount).toFixed(2)}</td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        backgroundColor: order.payment_method === 'cod' ? '#e8f5e9' : '#fff3cd',
                                        color: order.payment_method === 'cod' ? '#2e7d32' : '#856404',
                                        padding: '3px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        fontWeight: '600'
                                    }}>
                                        {order.payment_method === 'cod' ? '💰 COD' : order.payment_method.toUpperCase()}
                                    </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        backgroundColor: order.payment_method === 'cod' ? '#e3f2fd' : '#cce5ff',
                                        color: '#004085',
                                        padding: '3px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px'
                                    }}>
                                        {order.payment_method === 'cod' ? 'Awaiting Assignment' : 'Half Paid - Awaiting Assignment'}
                                    </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowAssignModal(true);
                                            fetchUnavailableEmployees(order);
                                        }}
                                        disabled={order.status === 'cancelled'}
                                        style={{
                                            padding: '4px 8px', backgroundColor: order.status === 'cancelled' ? '#ccc' : '#0066cc',
                                            color: 'white', border: 'none', borderRadius: '3px',
                                            cursor: order.status === 'cancelled' ? 'not-allowed' : 'pointer', fontSize: '11px',
                                            opacity: order.status === 'cancelled' ? 0.6 : 1
                                        }}
                                        title={order.status === 'cancelled' ? 'Cannot assign to cancelled orders' : ''}
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

        if (activeTab === 'cancelled') {
            return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ borderBottom: '2px solid #eee' }}>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order ID</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Customer</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment #</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Payment Status</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order Status</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Date</th>
                            <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((order) => (
                            <tr key={order.id} style={{ borderBottom: '1px solid #eee', opacity: 0.7, backgroundColor: '#f8f9fa' }}>
                                <td style={{ padding: '8px', color: '#666', fontWeight: '600', fontSize: '13px' }}>{order.order_number}</td>
                                <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>{order.fname} {order.lname}</td>
                                <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>{order.appointment_number || 'N/A'}</td>
                                <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>
                                    {order.appointment_date ? new Date(order.appointment_date).toLocaleDateString() : 'N/A'}
                                </td>
                                <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>₱{parseFloat(order.total_amount).toLocaleString()}</td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        backgroundColor: getPaymentStatusColor(order.payment_status).bg,
                                        color: getPaymentStatusColor(order.payment_status).text,
                                        padding: '3px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        {order.payment_status}
                                    </span>
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <span style={{
                                        backgroundColor: getOrderStatusColor(order.status).bg,
                                        color: getOrderStatusColor(order.status).text,
                                        padding: '3px 6px',
                                        borderRadius: '3px',
                                        fontSize: '11px',
                                        fontWeight: '600',
                                        display: 'inline-block'
                                    }}>
                                        {order.status}
                                    </span>
                                </td>
                                <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>
                                    {new Date(order.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '8px' }}>
                                    <button
                                        onClick={() => {
                                            setSelectedOrder(order);
                                            setShowDetailsModal(true);
                                        }}
                                        style={{ padding: '4px 8px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}>
                                        View Details
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            );
        }

        return (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '15px' }}>
                <thead>
                    <tr style={{ borderBottom: '2px solid #eee' }}>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order ID</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Customer</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment #</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Appointment Date & Time</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Amount</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Payment Status</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Order Status</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Date</th>
                        <th style={{ padding: '8px', textAlign: 'left', color: '#666', fontWeight: '600', fontSize: '12px' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((order) => (
                        <tr key={order.id} style={{ borderBottom: '1px solid #eee', opacity: order.status === 'cancelled' ? 0.7 : 1, backgroundColor: order.status === 'cancelled' ? '#f8f9fa' : 'transparent' }}>
                            <td style={{ padding: '8px', color: order.status === 'cancelled' ? '#666' : '#333', fontWeight: '600', fontSize: '13px' }}>{order.order_number}</td>
                            <td style={{ padding: '8px', color: order.status === 'cancelled' ? '#666' : '#333', fontSize: '13px' }}>{order.fname} {order.lname}</td>
                            <td style={{ padding: '8px', color: order.status === 'cancelled' ? '#666' : '#333', fontSize: '13px' }}>{order.appointment_number || 'N/A'}</td>
                            <td style={{ padding: '8px', color: order.status === 'cancelled' ? '#666' : '#333', fontSize: '13px' }}>
                                {order.appointment_date ? (
                                    <div>
                                        <div>{new Date(order.appointment_date).toLocaleDateString()}</div>
                                        <div style={{ color: '#666', fontSize: '11px' }}>{order.appointment_time || '-'}</div>
                                    </div>
                                ) : 'N/A'}
                            </td>
                            <td style={{ padding: '8px', color: order.status === 'cancelled' ? '#666' : '#333', fontSize: '13px' }}>₱{parseFloat(order.total_amount).toLocaleString()}</td>
                            <td style={{ padding: '8px' }}>
                                <span style={{
                                    backgroundColor: getPaymentStatusColor(order.payment_status).bg,
                                    color: getPaymentStatusColor(order.payment_status).text,
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'inline-block'
                                }}>
                                    {order.payment_status}
                                </span>
                            </td>
                            <td style={{ padding: '8px' }}>
                                <span style={{
                                    backgroundColor: getOrderStatusColor(order.status).bg,
                                    color: getOrderStatusColor(order.status).text,
                                    padding: '3px 6px',
                                    borderRadius: '3px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    display: 'inline-block'
                                }}>
                                    {order.status}
                                </span>
                            </td>
                            <td style={{ padding: '8px', color: '#666', fontSize: '13px' }}>
                                {new Date(order.created_at).toLocaleDateString()}
                            </td>
                            <td style={{ padding: '8px' }}>
                                <button
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowDetailsModal(true);
                                    }}
                                    style={{
                                        padding: '4px 8px', backgroundColor: '#0066cc',
                                        color: 'white', border: 'none', borderRadius: '3px',
                                        cursor: 'pointer', fontSize: '11px'
                                    }}
                                >
                                    View Details
                                </button>
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

            {assignmentSuccess && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <strong>✓ Success:</strong>
                    <div style={{ flex: 1, marginLeft: '12px' }}>{assignmentSuccess}</div>
                    <button onClick={() => setAssignmentSuccess(null)} style={{
                        background: 'none',
                        border: 'none',
                        color: '#155724',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0'
                    }}>×</button>
                </div>
            )}

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
                <button
                    onClick={() => setActiveTab('cancelled')}
                    style={{
                        padding: '10px 20px', backgroundColor: activeTab === 'cancelled' ? '#dc3545' : '#f0f0f0',
                        color: activeTab === 'cancelled' ? 'white' : '#333', border: 'none',
                        borderRadius: '4px 4px 0 0', cursor: 'pointer', fontWeight: activeTab === 'cancelled' ? '600' : '400'
                    }}
                >
                    ✕ Cancelled ({cancelledOrders.length})
                </button>
            </div>

            <div className="recent-section">
                {renderTable(activeTab === 'all' ? orders : activeTab === 'pending-receipts' ? pendingReceipts : activeTab === 'awaiting-assignment' ? awaitingAssignment : cancelledOrders)}
            </div>

            {renderReceiptModal()}
            {renderAssignModal()}
            {renderDetailsModal()}
        </AdminLayout>
    );
};

export default AdminOrders;
