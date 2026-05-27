import React, { useState, useEffect, useCallback } from 'react';

const EmployeeAssignedAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filter, setFilter] = useState('upcoming');
    const [submitting, setSubmitting] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [refreshing, setRefreshing] = useState(false);

    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    });

    // Update current time every minute
    useEffect(() => {
        const interval = setInterval(() => setCurrentTime(new Date()), 60000);
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
        return currentTime >= appointmentDateTime;
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

            alert('Appointment marked as completed successfully');
            fetchAppointments();
        } catch (err) {
            console.error('Error:', err);
            alert(`Error: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const renderAppointmentCard = (appointment) => {
        const isComplete = appointment.completion_status === 'completed';
        const canMark = canMarkComplete(appointment);
        const timeRemaining = getTimeRemaining(appointment);

        return (
        <div key={appointment.id} className="appointment-card" style={{
            background: '#fff',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '20px',
            marginBottom: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
                <div>
                    <h3 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '16px', fontWeight: '600' }}>
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
                    background: isComplete ? '#d4edda' : '#d1ecf1',
                    color: isComplete ? '#155724' : '#0c5460'
                }}>
                    {isComplete ? '✓ Completed' : 'Pending'}
                </span>
            </div>

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

            {!isComplete && (
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
                {['upcoming', 'completed', 'all'].map(status => (
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
                        {status === 'upcoming' ? '📅 Upcoming' : status === 'completed' ? '✓ Completed' : 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '40px' }}>Loading appointments...</p>
            ) : error ? (
                <p style={{ textAlign: 'center', color: '#dc3545', padding: '40px' }}>Error: {error}</p>
            ) : appointments.length === 0 ? (
                <div className="empty-state" style={{ textAlign: 'center', padding: '60px 20px' }}>
                    <i style={{ fontSize: '48px', color: '#999', display: 'block', marginBottom: '15px' }} className="fas fa-calendar-times"></i>
                    <p style={{ color: '#666', fontSize: '16px' }}>
                        No {filter === 'all' ? '' : filter} appointments at this time.
                    </p>
                </div>
            ) : (
                <div style={{ maxWidth: '1000px' }}>
                    {appointments.map(renderAppointmentCard)}
                </div>
            )}
        </div>
    );
};

export default EmployeeAssignedAppointments;
