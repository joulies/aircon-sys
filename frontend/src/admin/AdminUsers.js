import React, { useState, useEffect } from 'react';
import AdminLayout from './AdminLayout';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                const response = await fetch('http://localhost:5000/admin/users');
                if (!response.ok) throw new Error('Failed to fetch users');
                const data = await response.json();
                setUsers(data);
            } catch (err) {
                console.error('Error fetching users:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    if (loading) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Users Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
            </AdminLayout>
        );
    }

    if (error) {
        return (
            <AdminLayout>
                <div className="page-header">
                    <h2>Users Management</h2>
                </div>
                <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Users Management</h2>
            </div>

            <div className="recent-section">
                {users.length === 0 ? (
                    <p style={{ color: '#666' }}>No users found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Email</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Phone</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Join Date</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '500' }}>{user.fname} {user.lname}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{user.email}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{user.contact}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>
                                        {new Date(user.created_at).toLocaleDateString()}
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

export default AdminUsers;
