import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminEmployees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showPasswords, setShowPasswords] = useState({});
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        fname: '',
        lname: '',
        email: '',
        contact: '',
        password: ''
    });
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                setLoading(true);
                const response = await fetch('https://aircon-sys.onrender.com/admin/employees');
                if (!response.ok) throw new Error('Failed to fetch employees');
                const data = await response.json();
                setEmployees(data);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchEmployees();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();
        setFormError(null);

        // Validation
        if (!formData.fname || !formData.lname || !formData.email || !formData.contact || !formData.password) {
            setFormError('All fields are required');
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            setFormError('Invalid email format');
            return;
        }

        if (!/^\d{11}$/.test(formData.contact.replace(/[^\d]/g, ''))) {
            setFormError('Phone number must be 11 digits');
            return;
        }

        try {
            setFormLoading(true);
            const response = await fetch('https://aircon-sys.onrender.com/admin/add-employee', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    fname: formData.fname,
                    lname: formData.lname,
                    email: formData.email,
                    contact: formData.contact,
                    password: formData.password
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add employee');
            }

            // Add the new employee to the list
            setEmployees(prev => [...prev, data.employee]);
            
            // Reset form and close modal
            setFormData({ fname: '', lname: '', email: '', contact: '', password: '' });
            setShowModal(false);
            setFormError(null);
        } catch (err) {
            console.error('Error adding employee:', err);
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Employees Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Employees Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Employees Management</h2>
                <button 
                    onClick={() => setShowModal(true)}
                    style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600'
                }}>+ Add Employee</button>
            </div>

            {/* Add Employee Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '8px',
                        padding: '30px',
                        width: '90%',
                        maxWidth: '500px',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px' }}>Add New Employee</h3>
                        
                        {formError && (
                            <div style={{
                                backgroundColor: '#f8d7da',
                                color: '#721c24',
                                padding: '12px',
                                borderRadius: '4px',
                                marginBottom: '15px',
                                border: '1px solid #f5c6cb'
                            }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>First Name</label>
                                <input
                                    type="text"
                                    name="fname"
                                    value={formData.fname}
                                    onChange={handleInputChange}
                                    placeholder="Enter first name"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Last Name</label>
                                <input
                                    type="text"
                                    name="lname"
                                    value={formData.lname}
                                    onChange={handleInputChange}
                                    placeholder="Enter last name"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="Enter email"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Phone Number</label>
                                <input
                                    type="tel"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleInputChange}
                                    placeholder="09XXXXXXXXX (11 digits)"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600', color: '#333' }}>Password</label>
                                <input
                                    type="text"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    placeholder="Enter password"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        fontSize: '14px',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                <button
                                    type="submit"
                                    disabled={formLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: formLoading ? '#ccc' : '#28a745',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: formLoading ? 'not-allowed' : 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    {formLoading ? 'Adding...' : 'Add Employee'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setFormData({ fname: '', lname: '', email: '', contact: '', password: '' });
                                        setFormError(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '10px',
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        fontSize: '14px',
                                        fontWeight: '600'
                                    }}
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="recent-section">
                {employees.length === 0 ? (
                    <p style={{ color: '#666' }}>No employees found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Employee ID</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Phone</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Position</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Password</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Join Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((employee) => (
                                <tr key={employee.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '500' }}>#{employee.id}</td>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '500' }}>{employee.fname} {employee.lname}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{employee.email}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{employee.contact}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{employee.position || 'Technician'}</td>
                                    <td style={{ padding: '12px', color: '#666', fontFamily: 'monospace', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span>{showPasswords[employee.id] ? employee.password : '••••••••'}</span>
                                            <button
                                                onClick={() => setShowPasswords(prev => ({ ...prev, [employee.id]: !prev[employee.id] }))}
                                                style={{
                                                    padding: '2px 8px',
                                                    backgroundColor: '#17a2b8',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '3px',
                                                    cursor: 'pointer',
                                                    fontSize: '10px'
                                                }}
                                            >
                                                {showPasswords[employee.id] ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(employee.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button style={{ marginRight: '8px', padding: '5px 10px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Edit</button>
                                        <button style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
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

export default AdminEmployees;
