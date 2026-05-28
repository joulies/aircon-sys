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
    const [unavailableEmployees, setUnavailableEmployees] = useState({});
    const [assignmentError, setAssignmentError] = useState(null);
    const [assignmentSuccess, setAssignmentSuccess] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const appointmentsResponse = await fetch('https://aircon-sys.onrender.com/admin/appointments');
                if (!appointmentsResponse.ok) throw new Error('Failed to fetch appointments');
                const appointmentsData = await appointmentsResponse.json();
                setAppointments(appointmentsData.slice(0, 10));

                const employeesResponse = await fetch('https://aircon-sys.onrender.com/admin/employees');
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

                // Fetch unavailable employees for each appointment
                const unavailableMap = {};
                for (const apt of appointmentsData.slice(0, 10)) {
                    try {
                        const unavailableResponse = await fetch(`https://aircon-sys.onrender.com/appointments/${apt.id}/unavailable-employees`);
                        if (unavailableResponse.ok) {
                            const data = await unavailableResponse.json();
                            unavailableMap[apt.id] = data.unavailable_employee_ids || [];
                            console.log(`[FRONTEND] Appointment ${apt.id} unavailable employees:`, unavailableMap[apt.id]);
                        } else {
                            console.warn(`[FRONTEND] Failed to fetch unavailable employees for appointment ${apt.id}`);
                        }
                    } catch (err) {
                        console.error(`[FRONTEND] Error fetching unavailable employees for appointment ${apt.id}:`, err);
                    }
                }
                setUnavailableEmployees(unavailableMap);
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

        console.log(`[CONFIRM] Appointment ${appointmentId}, SelectedEmpId=${selectedEmpId}`);

        if (!selectedEmpId) {
            setAssignmentError('Please select an employee first');
            return;
        }

        try {
            setAssignmentError(null);
            setAssignmentSuccess(null);
            console.log(`[CONFIRM] Assigning employee ${selectedEmpId} to appointment ${appointmentId}`);
            const response = await fetch(`https://aircon-sys.onrender.com/appointments/${appointmentId}/assign`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assigned_to: selectedEmpId })
            });

            const data = await response.json();

            if (!response.ok) {
                const errorMsg = data.error || data.message || 'Failed to assign employee';
                console.error('Assignment error:', errorMsg);
                setAssignmentError(errorMsg);
                throw new Error(errorMsg);
            }

            const selectedEmployee = employees.find(e => e.id === parseInt(selectedEmpId));
            const apt = appointments.find(a => a.id === appointmentId);

            setAssignmentStatus({
                ...assignmentStatus,
                [appointmentId]: { assigned: true, employeeId: selectedEmpId, employeeName: `${selectedEmployee.fname} ${selectedEmployee.lname}` }
            });

            setEditingId(null);
            setAssignmentSuccess(`✓ ${selectedEmployee.fname} ${selectedEmployee.lname} assigned to ${apt.fname} ${apt.lname} on ${new Date(apt.appointment_date).toLocaleDateString()} at ${apt.appointment_time}`);
            setTimeout(() => setAssignmentSuccess(null), 4000);
        } catch (err) {
            console.error('Error assigning employee:', err);
            setAssignmentError(err.message);
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

            {assignmentError && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    backgroundColor: '#f8d7da',
                    color: '#721c24',
                    border: '1px solid #f5c6cb',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <strong>⚠ Error:</strong>
                    <div style={{ flex: 1, marginLeft: '12px' }}>{assignmentError}</div>
                    <button onClick={() => setAssignmentError(null)} style={{
                        background: 'none',
                        border: 'none',
                        color: '#721c24',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0'
                    }}>×</button>
                </div>
            )}

            {assignmentSuccess && (
                <div style={{
                    padding: '12px 16px',
                    marginBottom: '16px',
                    backgroundColor: '#d4edda',
                    color: '#155724',
                    border: '1px solid #c3e6cb',
                    borderRadius: '4px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <strong>✓ Success:</strong>
                    <div style={{ flex: 1, marginLeft: '12px' }}>{assignmentSuccess}</div>
                    <button onClick={() => setAssignmentSuccess(null)} style={{
                        background: 'none',
                        border: 'none',
                        color: '#155724',
                        cursor: 'pointer',
                        fontSize: '18px',
                        padding: '0'
                    }}>×</button>
                </div>
            )}

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
                                                <>
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
                                                        {employees.filter(emp => {
                                                            const isUnavailable = unavailableEmployees[apt.id]?.includes(emp.id);
                                                            return !isUnavailable;
                                                        }).map((emp) => (
                                                            <option key={emp.id} value={emp.id}>
                                                                {emp.fname} {emp.lname}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    {unavailableEmployees[apt.id]?.length > 0 && (
                                                        <div style={{
                                                            fontSize: '11px',
                                                            color: '#999',
                                                            marginTop: '4px',
                                                            fontStyle: 'italic'
                                                        }}>
                                                            {unavailableEmployees[apt.id].length} employee(s) unavailable at this time
                                                        </div>
                                                    )}
                                                </>
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
