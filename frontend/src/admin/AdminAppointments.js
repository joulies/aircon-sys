import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminAppointments = () => {
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [showModal, setShowModal] = useState(false);

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
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Appointment #</th>
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
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '600' }}>{apt.appointment_number}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>{apt.fname} {apt.lname}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.email}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.contact}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(apt.appointment_date).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>{apt.appointment_time}</td>
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
                        maxWidth: '500px',
                        width: '90%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Appointment Details</h3>
                        
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Appointment #:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.appointment_number}</p>
                        </div>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', fontWeight: '600', color: '#666', marginBottom: '5px' }}>Customer:</label>
                            <p style={{ margin: 0, color: '#333' }}>{selectedAppointment.fname} {selectedAppointment.lname}</p>
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

                        <div style={{ marginTop: '25px', textAlign: 'right' }}>
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
