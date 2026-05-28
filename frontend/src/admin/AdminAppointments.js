import React, { useState, useEffect } from 'react';
import { showAlert } from '../utils/alertDialog';
import AdminLayout from './AdminLayout';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');
    const [unassigning, setUnassigning] = useState(false);

    const fetchAppointments = async () => {
        try {
            setRefreshing(true);
            const response = await fetch('https://aircon-sys.onrender.com/admin/appointments');
            if (!response.ok) throw new Error('Failed to fetch appointments');
            const data = await response.json();
            setAppointments(data);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.message);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchAppointments().then(() => setLoading(false));
    }, []);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchAppointments, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status) => {
        if (status === 'completed') return '#28a745';
        if (status === 'pending') return '#ffc107';
        if (status === 'cancelled') return '#dc3545';
        return '#6c757d';
    };

    const getStatusBadge = (status) => {
        if (status === 'completed') return '✓ Completed';
        if (status === 'cancelled') return '✕ Cancelled';
        return 'Pending';
    };

    const handleReleaseEmployee = async () => {
        if (!selectedAppointment) return;

        setUnassigning(true);
        try {
            const response = await fetch(`https://aircon-sys.onrender.com/appointments/${selectedAppointment.id}/unassign`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to release employee');
            }

            const result = await response.json();

            if (result.success) {
                setSelectedAppointment({
                    ...selectedAppointment,
                    assigned_employee_id: null,
                    technician_fname: null,
                    technician_lname: null,
                    technician_contact: null
                });
                fetchAppointments();
            }
        } catch (err) {
            console.error('Error releasing employee:', err);
            showAlert('Failed to release employee: ' + err.message, 'Error');
        } finally {
            setUnassigning(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Appointments Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Appointments Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Appointments Management</h2>
                <button
                    onClick={fetchAppointments}
                    disabled={refreshing}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: '#0066cc',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: refreshing ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        opacity: refreshing ? 0.6 : 1
                    }}
                >
                    {refreshing ? 'Refreshing...' : '🔄 Refresh'}
                </button>
            </div>

            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                {['all', 'pending', 'completed', 'cancelled'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: filterStatus === status ? '#0066cc' : '#f0f0f0',
                            color: filterStatus === status ? '#fff' : '#333',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            textTransform: 'capitalize'
                        }}
                    >
                        {status === 'all' ? 'All Appointments' : status === 'cancelled' ? '✕ Cancelled' : status === 'completed' ? '✓ Completed' : '📅 Pending'}
                    </button>
                ))}
            </div>

            <div className="recent-section">
                {appointments.length === 0 ? (
                    <p style={{ color: '#666' }}>No appointments found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Appointment #</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Time</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Technician</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments
                                .filter(apt => filterStatus === 'all' || apt.completion_status === filterStatus)
                                .map((apt) => (
                                <tr key={apt.id} style={{ borderBottom: '1px solid #eee', backgroundColor: apt.completion_status === 'cancelled' ? '#f8f9fa' : 'transparent' }}>
                                    <td style={{ padding: '12px', color: apt.completion_status === 'cancelled' ? '#666' : '#333', fontWeight: '600', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>{apt.appointment_number}</td>
                                    <td style={{ padding: '12px', color: apt.completion_status === 'cancelled' ? '#666' : '#333', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>{apt.fname} {apt.lname}</td>
                                    <td style={{ padding: '12px', color: '#666', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>
                                        {new Date(apt.appointment_date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>{apt.appointment_time}</td>
                                    <td style={{ padding: '12px', color: '#666', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>
                                        {apt.technician_fname ? `${apt.technician_fname} ${apt.technician_lname}` : 'Not assigned'}
                                    </td>
                                    <td style={{ padding: '12px', opacity: apt.completion_status === 'cancelled' ? 0.7 : 1 }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '12px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            backgroundColor: getStatusColor(apt.completion_status) + '20',
                                            color: getStatusColor(apt.completion_status)
                                        }}>
                                            {getStatusBadge(apt.completion_status)}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button
                                            onClick={() => {
                                                setSelectedAppointment(apt);
                                                setShowModal(true);
                                            }}
                                            style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>View</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {showModal && selectedAppointment && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '30px',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        maxWidth: '600px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Appointment Details</h3>

                        {selectedAppointment.completion_status === 'cancelled' && (
                            <div style={{
                                backgroundColor: '#f8d7da',
                                border: '1px solid #f5c6cb',
                                borderRadius: '4px',
                                padding: '12px',
                                marginBottom: '20px',
                                color: '#721c24'
                            }}>
                                <strong>⚠ Cancelled Appointment:</strong> This appointment was cancelled by the customer. The time slot is now available for rebooking.
                            </div>
                        )}

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Appointment #:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.appointment_number}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Customer:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.fname} {selectedAppointment.lname}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Order #:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.order_number || 'N/A'}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Email:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.email}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Phone:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.contact}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Date:</label>
                            <p style={{ margin: 0, color: '#333' }}>{new Date(selectedAppointment.appointment_date).toLocaleDateString()}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Time:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.appointment_time}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Status:</label>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '12px',
                                fontSize: '14px',
                                fontWeight: '600',
                                backgroundColor: getStatusColor(selectedAppointment.completion_status) + '20',
                                color: getStatusColor(selectedAppointment.completion_status)
                            }}>
                                {getStatusBadge(selectedAppointment.completion_status)}
                            </span>
                        </div>

                        {selectedAppointment.completion_status === 'completed' && selectedAppointment.completed_at && (
                            <div style={{ marginBottom: '15px' }}>
                                <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Completed At:</label>
                                <p style={{ margin: 0, color: '#333' }}>
                                    {new Date(selectedAppointment.completed_at).toLocaleString()}
                                </p>
                            </div>
                        )}

                        <div style={{ marginBottom: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Assigned Technician:</label>
                            {selectedAppointment.technician_fname ? (
                                <>
                                    <p style={{ margin: '5px 0', color: '#333' }}>
                                        <strong>{selectedAppointment.technician_fname} {selectedAppointment.technician_lname}</strong>
                                    </p>
                                    <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                                        Contact: {selectedAppointment.technician_contact}
                                    </p>
                                </>
                            ) : (
                                <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>No technician assigned yet</p>
                            )}
                        </div>

                        <div style={{ marginTop: '25px', textAlign: 'right', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            {selectedAppointment.completion_status === 'cancelled' && selectedAppointment.assigned_employee_id && (
                                <button
                                    onClick={handleReleaseEmployee}
                                    disabled={unassigning}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: unassigning ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        opacity: unassigning ? 0.6 : 1
                                    }}
                                >
                                    {unassigning ? 'Releasing...' : '🔓 Release Employee'}
                                </button>
                            )}
                            <button
                                onClick={() => setShowModal(false)}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '14px'
                                }}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
};

export default AdminAppointments;
