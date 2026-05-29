import React, { useState, useEffect, useCallback } from 'react';
import { showAlert } from '../utils/alertDialog';

const EmployeeAssignedAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('upcoming');
    const [submitting, setSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);

    const API = process.env.REACT_APP_API_URL || 'https://aircon-sys.onrender.com';

    // Get current Philippine Time (UTC+8)
    const getCurrentPHTime = () => {
        const now = new Date();
        return new Date(now.getTime() + 8 * 60 * 60 * 1000);
    };

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    });

    // Update current Philippine time every 5 seconds
    useEffect(() => {
        setCurrentTime(getCurrentPHTime());
        const interval = setInterval(() => setCurrentTime(getCurrentPHTime()), 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchAppointments = useCallback(async () => {
        try {
            setRefreshing(true);
            const statusParam = filter === 'all' ? '' : `?status=${filter}`;
            const response = await fetch(
                `${API}/employee/appointments${statusParam}`,
                { headers: authHeaders() }
            );

            if (!response.ok) {
                throw new Error('Failed to fetch appointments');
            }

            const data = await response.json();
            setAppointments(data.appointments || []);
            setError(null);
        } catch (err) {
            console.error('Error fetching appointments:', err);
            setError(err.message);
            setAppointments([]);
        } finally {
            setRefreshing(false);
        }
    }, [filter, API]);

    useEffect(() => {
        setLoading(true);
        fetchAppointments().then(() => setLoading(false));
    }, [fetchAppointments]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(fetchAppointments, 30000);
        return () => clearInterval(interval);
    }, [fetchAppointments]);

    const getAppointmentDateTime = (date, time) => {
        const appointmentDate = new Date(date);
        const [hours, minutes] = time.split(':');
        appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        return appointmentDate;
    };

    const canMarkComplete = (appointment) => {
        const appointmentDateTime = getAppointmentDateTime(appointment.appointment_date, appointment.appointment_time);
        return currentTime >= appointmentDateTime && appointment.completion_status !== 'cancelled';
    };

    const getFilteredAppointments = () => {
        if (filter === 'all') {
            return appointments;
        } else if (filter === 'upcoming') {
            return appointments.filter(a => a.completion_status === 'pending');
        } else if (filter === 'completed') {
            return appointments.filter(a => a.completion_status === 'completed');
        } else if (filter === 'cancelled') {
            return appointments.filter(a => a.completion_status === 'cancelled');
        }
        return appointments;
    };

    const getTimeRemaining = (appointment) => {
        const appointmentDateTime = getAppointmentDateTime(appointment.appointment_date, appointment.appointment_time);
        const diffMs = appointmentDateTime - currentTime;
        const diffMins = Math.ceil(diffMs / 1000 / 60);

        if (diffMins <= 0) return null;

        if (diffMins < 60) {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''}`;
        }

        const diffHours = Math.floor(diffMins / 60);
        const remainingMins = diffMins % 60;
        if (remainingMins === 0) {
            return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
        }
        return `${diffHours}h ${remainingMins}m`;
    };

    const handleMarkComplete = async (appointmentId) => {
        if (!window.confirm('Mark this appointment as completed?')) return;

        setSubmitting(true);
        try {
            const response = await fetch(
                `${API}/appointments/${appointmentId}/complete`,
                {
                    method: 'PUT',
                    headers: authHeaders()
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to mark appointment as completed');
            }

            showAlert('Appointment marked as completed successfully', 'Success');
            fetchAppointments();
        } catch (err) {
            console.error('Error:', err);
            showAlert(`Error: ${err.message}`, 'Error');
        } finally {
            setSubmitting(false);
        }
    };

    const renderAppointmentCard = (appointment) => {
        const isComplete = appointment.completion_status === 'completed';
        const isCancelled = appointment.completion_status === 'cancelled';
        const canMark = canMarkComplete(appointment);
        const timeRemaining = getTimeRemaining(appointment);

        return (
        <div key={appointment.id} className="appointment-card" style={{
            background: isCancelled ? '#f8f9fa' : '#fff',
            border: isCancelled ? '1px solid #dee2e6' : '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            boxShadow: isCancelled ? 'none' : '0 2px 4px rgba(0,0,0,0.1)',
            opacity: isCancelled ? 0.7 : 1
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', color: isCancelled ? '#999' : '#333', fontSize: '16px', fontWeight: '600' }}>
                        {appointment.appointment_number}
                    </h3>
                    <p style={{ margin: '0', color: '#666', fontSize: '14px' }}>
                        📅 {appointment.appointment_date} at {appointment.appointment_time}
                    </p>
                </div>
                <span style={{
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    background: isCancelled ? '#f8d7da' : isComplete ? '#d4edda' : '#d1ecf1',
                    color: isCancelled ? '#721c24' : isComplete ? '#155724' : '#0c5460'
                }}>
                    {isCancelled ? '✕ Cancelled' : isComplete ? '✓ Completed' : 'Pending'}
                </span>
            </div>

            {isCancelled && (
              <div style={{
                backgroundColor: '#fff3cd',
                border: '1px solid #ffeaa7',
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '15px',
                color: '#856404',
                fontSize: '13px'
              }}>
                <strong>⚠ Cancelled:</strong> This appointment has been cancelled by the customer. The time slot is now available for other bookings.
              </div>
            )}

            <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginBottom: '15px' }}>
                <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                    Customer Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Name</p>
                        <p style={{ margin: '0', color: '#333' }}>{appointment.customer_name}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Phone</p>
                        <p style={{ margin: '0', color: '#333' }}>{appointment.customer_phone}</p>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Email</p>
                        <p style={{ margin: '0', color: '#333' }}>{appointment.customer_email}</p>
                    </div>
                </div>
            </div>

            {appointment.room_size && (
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                        Service Details
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Room Size</p>
                            <p style={{ margin: '0', color: '#333' }}>{appointment.room_size} sqm</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Property Type</p>
                            <p style={{ margin: '0', color: '#333' }}>{appointment.property_type}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>AC Unit Type</p>
                            <p style={{ margin: '0', color: '#333' }}>{appointment.ac_unit_type}</p>
                        </div>
                    </div>
                </div>
            )}

            {appointment.order_id && (
                <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: '15px', marginBottom: '15px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '14px', fontWeight: '600' }}>
                        Order Information
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '14px' }}>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Order Number</p>
                            <p style={{ margin: '0', color: '#333', fontWeight: '600' }}>{appointment.order_number}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Order Status</p>
                            <p style={{ margin: '0', color: '#333' }}>{appointment.order_status}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Total Amount</p>
                            <p style={{ margin: '0', color: '#333' }}>₱{parseFloat(appointment.total_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Installation Fee</p>
                            <p style={{ margin: '0', color: '#333' }}>₱{parseFloat(appointment.installation_fee || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Downpayment Amount</p>
                            <p style={{ margin: '0', color: '#333' }}>₱{parseFloat(appointment.downpayment_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Balance Due</p>
                            <p style={{ margin: '0', color: '#333' }}>₱{parseFloat(appointment.balance_due || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Payment Method</p>
                            <p style={{ margin: '0', color: '#333', textTransform: 'uppercase' }}>{appointment.payment_method}</p>
                        </div>
                        <div>
                            <p style={{ margin: '0 0 5px 0', color: '#888', fontSize: '12px' }}>Payment Status</p>
                            <p style={{ margin: '0', color: '#333' }}>{appointment.payment_status}</p>
                        </div>
                    </div>
                </div>
            )}

            {!isComplete && !isCancelled && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button
                        onClick={() => handleMarkComplete(appointment.id)}
                        disabled={submitting || !canMark}
                        title={canMark ? '' : `Appointment starts at ${appointment.appointment_time}. Available in ${timeRemaining}`}
                        style={{
                            flex: 1,
                            padding: '10px 16px',
                            backgroundColor: canMark ? '#28a745' : '#ccc',
                            color: canMark ? '#fff' : '#666',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: canMark ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            fontSize: '14px'
                        }}
                    >
                        {submitting ? 'Processing...' : canMark ? '✓ Mark Complete' : `Available in ${timeRemaining || 'processing...'}`}
                    </button>
                </div>
            )}

            {isCancelled && (
              <div style={{
                padding: '10px 16px',
                backgroundColor: '#f8f9fa',
                color: '#666',
                borderRadius: '6px',
                textAlign: 'center',
                marginTop: '15px',
                border: '1px solid #dee2e6',
                fontSize: '14px'
              }}>
                ℹ️ No action needed - this appointment has been cancelled
              </div>
            )}
        </div>
    );
    };

    return (
        <div>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2>Your Assigned Appointments</h2>
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
                {['upcoming', 'completed', 'cancelled', 'all'].map(status => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: filter === status ? '#386480' : '#f0f0f0',
                            color: filter === status ? '#fff' : '#333',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            textTransform: 'capitalize'
                        }}
                    >
                        {status === 'upcoming' ? '📅 Upcoming' : status === 'completed' ? '✓ Completed' : status === 'cancelled' ? '✕ Cancelled' : 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading appointments...</p>
            ) : error ? (
                <p style={{ textAlign: 'center', color: '#dc3545', padding: '40px' }}>Error: {error}</p>
            ) : getFilteredAppointments().length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <i style={{ fontSize: '48px', color: '#999', display: 'block', marginBottom: '15px' }} className="fas fa-calendar-times"></i>
                    <p style={{ color: '#666', fontSize: '16px' }}>
                        No {filter === 'all' ? '' : filter} appointments at this time.
                    </p>
                </div>
            ) : (
                <div style={{ maxWidth: '1000px' }}>
                    {getFilteredAppointments().map(renderAppointmentCard)}
                </div>
            )}
        </div>
    );
};

export default EmployeeAssignedAppointments;
