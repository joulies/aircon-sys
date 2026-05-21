import React from 'react';

const EmployeeAssignedAppointments = () => {
    return (
        <div>
            <div className="page-header">
                <h2>Your Assigned Appointments</h2>
            </div>

            <div className="empty-state">
                <i className="fas fa-calendar-times"></i>
                <p>No assigned appointments at this time.</p>
            </div>
        </div>
    );
};

export default EmployeeAssignedAppointments;
