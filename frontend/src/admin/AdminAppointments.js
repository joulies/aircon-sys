import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/admin/appointments');
                if (!response.ok) throw new Error('Failed to fetch appointments');
                const data = await response.json();
                setAppointments(data);
            } catch (err) {
                console.error('Error fetching appointments:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

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
            <div className="page-header">
                <h2>Appointments Management</h2>
            </div>

            <div className="recent-section">
                {appointments.length === 0 ? (
                    <p style={{ color: '#666' }}>No appointments found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Appointment ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Phone</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Time</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((apt) => (
                                <tr key={apt.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>#{apt.id}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>{apt.fname} {apt.lname}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.email}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.contact}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(apt.appointment_date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.appointment_time}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#0066cc', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>View</button>
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

export default AdminAppointments;
