import React from 'react';

const EmployeeAppointmentsHistory = () => {
    return (
        <div>
            <div className="page-header">
                <h2>Appointments History</h2>
            </div>

            <div className="appointments-table">
                <table>
                    <thead>
                        <tr>
                            <th>Appointment Date</th>
                            <th>Location</th>
                            <th>Service Type</th>
                            <th>Status</th>
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
        </div>
    );
};

export default EmployeeAppointmentsHistory;
