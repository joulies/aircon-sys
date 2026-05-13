import React, { useState } from 'react';
import AdminLayout from './AdminLayout';

const AdminSettings = () => {
    const [settings, setSettings] = useState({
        companyName: 'VA Industrial Electrical Services',
        companyEmail: 'admin@va-services.com',
        companyPhone: '09123456789',
        companyAddress: '123 Main Street, City',
        refundTimeout: 30,
        maxOrderValue: 100000
    });

    const [saved, setSaved] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = () => {
        // Save settings to backend
        console.log('Saving settings:', settings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Settings</h2>
            </div>

            {saved && (
                <div style={{
                    backgroundColor: '#d4edda',
                    border: '1px solid #c3e6cb',
                    borderRadius: '8px',
                    padding: '15px',
                    marginBottom: '20px',
                    color: '#155724'
                }}>
                    ✓ Settings saved successfully
                </div>
            )}

            <div className="recent-section">
                <h3 style={{ marginBottom: '25px' }}>Company Information</h3>
                <form style={{ maxWidth: '600px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Company Name
                        </label>
                        <input
                            type="text"
                            name="companyName"
                            value={settings.companyName}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Company Email
                        </label>
                        <input
                            type="email"
                            name="companyEmail"
                            value={settings.companyEmail}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Company Phone
                        </label>
                        <input
                            type="tel"
                            name="companyPhone"
                            value={settings.companyPhone}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Company Address
                        </label>
                        <textarea
                            name="companyAddress"
                            value={settings.companyAddress}
                            onChange={handleChange}
                            rows="3"
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box',
                                fontFamily: 'inherit'
                            }}
                        />
                    </div>
                </form>
            </div>

            <div className="recent-section" style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '25px' }}>Business Policies</h3>
                <form style={{ maxWidth: '600px' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Refund Timeout (Days)
                        </label>
                        <input
                            type="number"
                            name="refundTimeout"
                            value={settings.refundTimeout}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            Number of days customers have to request a refund
                        </small>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                            Maximum Order Value (₱)
                        </label>
                        <input
                            type="number"
                            name="maxOrderValue"
                            value={settings.maxOrderValue}
                            onChange={handleChange}
                            style={{
                                width: '100%',
                                padding: '10px',
                                borderRadius: '4px',
                                border: '1px solid #ddd',
                                fontSize: '14px',
                                boxSizing: 'border-box'
                            }}
                        />
                        <small style={{ color: '#666', marginTop: '5px', display: 'block' }}>
                            Maximum amount allowed for a single order
                        </small>
                    </div>
                </form>
            </div>

            <div style={{ marginTop: '30px', textAlign: 'right' }}>
                <button
                    onClick={handleSave}
                    style={{
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        padding: '12px 30px',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '600'
                    }}
                >
                    Save Settings
                </button>
            </div>
        </AdminLayout>
    );
};

export default AdminSettings;
