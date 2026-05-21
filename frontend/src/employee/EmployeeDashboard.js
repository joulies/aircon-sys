import React from 'react';
import { useAuth } from '../context/AuthContext';

const EmployeeDashboard = () => {
    const { user } = useAuth();
    const stats = {
        assignedToday: 0,
        pending: 0,
        completed: 0
    };

    return (
        <div>
            <div className="page-header">
                <div>
                    <h2>Welcome, {user?.name || 'Employee'}</h2>
                    <p className="subtitle">Here's what's happening with your appointments</p>
                </div>
            </div>

            <div className="cards-grid">
                <div className="stat-card">
                    <div className="stat-icon bg-blue">
                        <i className="fas fa-calendar-alt"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Assigned Today</h3>
                        <p>{stats.assignedToday}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-orange">
                        <i className="fas fa-hourglass-half"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Pending</h3>
                        <p>{stats.pending}</p>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="stat-icon bg-green">
                        <i className="fas fa-check-circle"></i>
                    </div>
                    <div className="stat-info">
                        <h3>Completed</h3>
                        <p>{stats.completed}</p>
                    </div>
                </div>
            </div>

            <div className="section-title">Upcoming Assigned Appointments</div>
            <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>No upcoming appointments.</p>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
