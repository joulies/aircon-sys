import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminAssignEmployees = () => {
    const [appointments, setAppointments] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedEmployees, setSelectedEmployees] = useState({});
    const [assignmentStatus, setAssignmentStatus] = useState({});
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const appointmentsResponse = await fetch('http://localhost:5000/admin/appointments');
                if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
                const appointmentsData = await appointmentsResponse.json();
                setAppointments(appointmentsData.slice(0, 10));

                const employeesResponse = await fetch('http://localhost:5000/admin/employees');
                if (!employeesResponse.ok) throw new Error('Failed to fetch employees');
                const employeesData = await employeesResponse.json();
                setEmployees(employeesData);

                // Initialize assignment status based on existing assigned_employee_id field
                const status = {};
                appointmentsData.forEach(apt => {
                    if (apt.assigned_employee_id) {
                        const assignedEmployee = employeesData.find(e => e.id === apt.assigned_employee_id);
                        if (assignedEmployee) {
                            status[apt.id] = { 
                                assigned: true, 
                                employeeId: apt.assigned_employee_id,
                                employeeName: `${assignedEmployee.fname} ${assignedEmployee.lname}`
                            };
                        }
                    }
                });
                setAssignmentStatus(status);
            } catch (err) {
                console.error('Error fetching data:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleEmployeeSelect = (appointmentId, employeeId) => {
        setSelectedEmployees({
            ...selectedEmployees,
            [appointmentId]: employeeId
        });
    };

    const handleConfirmAssignment = async (appointmentId) => {
        const selectedEmpId = selectedEmployees[appointmentId];
        
        if (!selectedEmpId) {
            alert('Please select an employee first');
            return;
        }

        try {
            const response = await fetch(`http://localhost:5000/appointments/${appointmentId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assigned_to: selectedEmpId })
            });

            if (!response.ok) {
                throw new Error('Failed to assign employee');
            }

            const selectedEmployee = employees.find(e => e.id === parseInt(selectedEmpId));
            
            setAssignmentStatus({
                ...assignmentStatus,
                [appointmentId]: { assigned: true, employeeId: selectedEmpId, employeeName: `${selectedEmployee.fname} ${selectedEmployee.lname}` }
            });

            setEditingId(null);
            alert('Employee assigned successfully!');
        } catch (err) {
            console.error('Error assigning employee:', err);
            alert('Error assigning employee: ' + err.message);
        }
    };

    const handleChangeAssignment = (appointmentId) => {
        setEditingId(appointmentId);
        setSelectedEmployees({
            ...selectedEmployees,
            [appointmentId]: assignmentStatus[appointmentId]?.employeeId || ''
        });
    };

    const handleCancel = () => {
        setEditingId(null);
        setSelectedEmployees({});
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Assign Employees</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Assign Employees</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Assign Employees to Appointments</h2>
            </div>

            <div className="recent-section">
                {appointments.length === 0 ? (
                    <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>No appointments found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Appointment ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Customer</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Time</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Assigned Employee</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map((apt) => {
                                const isAssigned = assignmentStatus[apt.id]?.assigned;
                                const isEditing = editingId === apt.id;

                                return (
                                    <tr key={apt.id} style={{ borderBottom: '1px solid #eee' }}>
                                        <td style={{ padding: '12px', color: '#333' }}>#{apt.id}</td>
                                        <td style={{ padding: '12px', color: '#333' }}>{apt.fname} {apt.lname}</td>
                                        <td style={{ padding: '12px', color: '#666' }}>
                                            {new Date(apt.appointment_date).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '12px', color: '#666' }}>{apt.appointment_time}</td>
                                        <td style={{ padding: '12px' }}>
                                            {isAssigned && !isEditing ? (
                                                <span style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#d4edda',
                                                    color: '#155724',
                                                    borderRadius: '4px',
                                                    fontSize: '14px'
                                                }}>
                                                    ✓ {assignmentStatus[apt.id].employeeName}
                                                </span>
                                            ) : (
                                                <select
                                                    value={selectedEmployees[apt.id] || ''}
                                                    onChange={(e) => handleEmployeeSelect(apt.id, e.target.value)}
                                                    style={{
                                                        padding: '8px',
                                                        borderRadius: '4px',
                                                        border: '1px solid #ddd',
                                                        cursor: 'pointer',
                                                        width: '100%'
                                                    }}
                                                >
                                                    <option value="">Select Employee</option>
                                                    {employees.map((emp) => (
                                                        <option key={emp.id} value={emp.id}>
                                                            {emp.fname} {emp.lname}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px' }}>
                                            {isAssigned && !isEditing ? (
                                                <button
                                                    onClick={() => handleChangeAssignment(apt.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '14px'
                                                    }}
                                                >
                                                    Change
                                                </button>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleConfirmAssignment(apt.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '4px',
                                                            cursor: 'pointer',
                                                            fontSize: '14px'
                                                        }}
                                                    >
                                                        Confirm
                                                    </button>
                                                    {isEditing && (
                                                        <button
                                                            onClick={handleCancel}
                                                            style={{
                                                                padding: '6px 12px',
                                                                backgroundColor: '#6c757d',
                                                                color: 'white',
                                                                border: 'none',
                                                                borderRadius: '4px',
                                                                cursor: 'pointer',
                                                                fontSize: '14px'
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </AdminLayout>
    );
};

export default AdminAssignEmployees;
