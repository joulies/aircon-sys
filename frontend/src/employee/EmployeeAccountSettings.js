import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const EmployeeAccountSettings = () => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                email: user.email || '',
                phone: user.phone || '',
                role: 'Technician'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <div>
            <div className="page-header">
                <h2>Account Settings</h2>
            </div>

            <div style={{ maxWidth: '600px' }}>
                <div style={{
                    background: 'var(--card)',
                    borderRadius: '10px',
                    padding: '25px',
                    boxShadow: '0 8px 24px rgba(38,70,83,0.06)',
                    borderLeft: '6px solid var(--brand)'
                }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontWeight: '600',
                            color: 'var(--brand)',
                            marginBottom: '8px',
                            display: 'block',
                            fontSize: '14px'
                        }}>Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #e6eef0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontWeight: '600',
                            color: 'var(--brand)',
                            marginBottom: '8px',
                            display: 'block',
                            fontSize: '14px'
                        }}>Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #e6eef0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontWeight: '600',
                            color: 'var(--brand)',
                            marginBottom: '8px',
                            display: 'block',
                            fontSize: '14px'
                        }}>Phone</label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #e6eef0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{
                            fontWeight: '600',
                            color: 'var(--brand)',
                            marginBottom: '8px',
                            display: 'block',
                            fontSize: '14px'
                        }}>Role</label>
                        <input
                            type="text"
                            name="role"
                            value={formData.role}
                            disabled
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #e6eef0',
                                borderRadius: '6px',
                                fontSize: '14px',
                                outline: 'none',
                                background: 'var(--muted)',
                                color: '#999',
                                boxSizing: 'border-box',
                                cursor: 'not-allowed'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '25px' }}>
                        <button
                            style={{
                                padding: '10px 18px',
                                borderRadius: '6px',
                                border: '0',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                transition: '0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                background: 'var(--accent)',
                                color: '#fff'
                            }}
                        >
                            Save Changes
                        </button>
                        <button
                            style={{
                                padding: '10px 18px',
                                borderRadius: '6px',
                                border: '1px solid var(--brand)',
                                cursor: 'pointer',
                                fontWeight: '600',
                                fontSize: '13px',
                                transition: '0.2s',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                color: 'var(--brand)',
                                background: 'transparent'
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployeeAccountSettings;
