import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        assignedToday: 0,
        pending: 0,
        completed: 0
    });
    const [upcomingAppointments, setUpcomingAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const API = process.env.REACT_APP_API_URL || 'http://localhost:5000';

    const getPhToday = () => {
        const ph = new Date(Date.now() + 8 * 60 * 60 * 1000);
        return ph.toISOString().split('T')[0];
    };

    const fetchAppointmentStats = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.error('No auth token found in localStorage');
            setError('Authentication required. Please log in.');
            setLoading(false);
            return;
        }

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            setLoading(true);
            console.log('Fetching from:', `${API}/employee/appointments`);
            console.log('Auth header:', authHeaders);

            const response = await fetch(
                `${API}/employee/appointments`,
                { headers: authHeaders }
            );

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Failed to fetch appointments (${response.status})`);
            }

            const data = await response.json();
            const appointments = data.appointments || [];

            const today = getPhToday();

            // Calculate stats
            const assignedToday = appointments.filter(a =>
                a.appointment_date === today && a.completion_status === 'pending'
            ).length;

            const pending = appointments.filter(a => a.completion_status === 'pending').length;
            const completed = appointments.filter(a => a.completion_status === 'completed').length;

            // Get upcoming appointments (limited to 5, exclude cancelled)
            const upcoming = appointments
                .filter(a => a.completion_status === 'pending')
                .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date))
                .slice(0, 5);

            setStats({
                assignedToday,
                pending,
                completed
            });

            setUpcomingAppointments(upcoming);
        } catch (err) {
            console.error('Error fetching appointment stats:', err);
            setError(err.message || 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    }, [API]);

    useEffect(() => {
        fetchAppointmentStats();
    }, [fetchAppointmentStats]);

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Welcome, {user ? `${user.fname || ''} ${user.lname || ''}`.trim() || 'Employee' : 'Employee'}</h2>
                    <p className="subtitle">Here's what's happening with your appointments</p>
                </div>
            </div>

            {error && (
                <div style={{
                    background: '#f8d7da',
                    color: '#721c24',
                    padding: '15px',
                    borderRadius: '6px',
                    marginBottom: '20px',
                    border: '1px solid #f5c6cb'
                }}>
                    <strong>Error:</strong> {error}
                </div>
            )}

            <div className="cards-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Assigned Today</h3>
                        <p>{loading ? '...' : stats.assignedToday}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-orange">
                        <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Pending</h3>
                        <p>{loading ? '...' : stats.pending}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <p>{loading ? '...' : stats.completed}</p>
                    </div>
                </div>
            </div>

            <div className="section-title">Upcoming Assigned Appointments</div>
            {upcomingAppointments.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-calendar-times"></i>
                    <p>No upcoming appointments.</p>
                </div>
            ) : (
                <div style={{ maxWidth: '800px' }}>
                    {upcomingAppointments.map(appointment => (
                        <div
                            key={appointment.id}
                            style={{
                                background: '#fff',
                                border: '1px solid #e0e0e0',
                                borderRadius: '8px',
                                padding: '15px',
                                marginBottom: '10px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                        >
                            <div>
                                <p style={{ margin: '0', fontWeight: '600', color: '#333' }}>
                                    {appointment.appointment_number}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                    📅 {appointment.appointment_date} at {appointment.appointment_time}
                                </p>
                                <p style={{ margin: '5px 0 0 0', fontSize: '14px', color: '#666' }}>
                                    👤 {appointment.customer_name}
                                </p>
                            </div>
                            <a
                                href="/employee/assigned"
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#386480',
                                    color: '#fff',
                                    textDecoration: 'none',
                                    borderRadius: '6px',
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                View Details
                            </a>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmployeeDashboard;
