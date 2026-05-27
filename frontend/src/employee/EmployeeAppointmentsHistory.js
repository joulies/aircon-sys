import React, { useState, useEffect, useCallback } from 'react';

const EmployeeAppointmentsHistory = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const authHeaders = () => ({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
    });

    const fetchCompletedAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `${API}/employee/appointments?status=completed`,
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
            setLoading(false);
        }
    }, [API]);

    useEffect(() => {
        fetchCompletedAppointments();
    }, [fetchCompletedAppointments]);

    return (
        <div>
            <div className="page-header">
                <h2>Appointments History</h2>
                <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    View all your completed appointments
                </p>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                    Loading appointments...
                </div>
            ) : error ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#dc3545' }}>
                    Error: {error}
                </div>
            ) : appointments.length === 0 ? (
                <div className="appointments-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Appointment #</th>
                                <th>Date</th>
                                <th>Customer</th>
                                <th>Completed On</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr style={{ textAlign: 'center', color: '#999' }}>
                                <td colSpan="4" style={{ padding: '60px 15px' }}>
                                    <i className="fas fa-inbox" style={{ fontSize: '48px', color: '#ddd', display: 'block', marginBottom: '15px' }}></i>
                                    No completed appointments yet.
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="appointments-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Appointment #</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Customer</th>
                                <th>Service</th>
                                <th>Completed On</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(appointment => (
                                <tr key={appointment.id}>
                                    <td style={{ fontWeight: '600', color: '#333' }}>
                                        {appointment.appointment_number}
                                    </td>
                                    <td>{appointment.appointment_date}</td>
                                    <td>{appointment.appointment_time}</td>
                                    <td>{appointment.customer_name}</td>
                                    <td>
                                        {appointment.property_type && appointment.room_size
                                            ? `${appointment.property_type} - ${appointment.room_size}sqm`
                                            : 'N/A'}
                                    </td>
                                    <td>
                                        {appointment.completed_at
                                            ? new Date(appointment.completed_at).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EmployeeAppointmentsHistory;
