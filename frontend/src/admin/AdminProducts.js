import React, { useState, useEffect, useRef } from 'react';
import { showAlert } from '../utils/alertDialog';
import AdminLayout from './AdminLayout';

const emptyForm = {
    product_name: '',
    brand_name: '',
    model_name: '',
    price: '',
    num_stocks: ''
};

const AdminProducts = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [formError, setFormError] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Image upload state
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef(null);

    // Delete confirm state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch('http://localhost:5000/admin/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            console.error('Error fetching products:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const openAddModal = () => {
        setModalMode('add');
        setFormData(emptyForm);
        setImageFile(null);
        setImagePreview(null);
        setFormError(null);
        setShowModal(true);
    };

    const openEditModal = (product) => {
        setModalMode('edit');
        setSelectedProduct(product);
        setFormData({
            product_name: product.product_name || '',
            brand_name: product.brand_name || '',
            model_name: product.model_name || '',
            price: product.price || '',
            num_stocks: product.num_stocks || ''
        });
        setImageFile(null);
        setImagePreview(
            product.image && product.image !== 'default.jpg'
                ? `http://localhost:5000/uploads/${product.image}`
                : null
        );
        setFormError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setFormData(emptyForm);
        setFormError(null);
        setSelectedProduct(null);
        setImageFile(null);
        setImagePreview(null);
        setDragOver(false);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageSelect = (file) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setFormError('Please select a valid image file (JPG, PNG, WEBP, etc.)');
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError('Image must be smaller than 5MB');
            return;
        }
        setFormError(null);
        setImageFile(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    const handleFileInputChange = (e) => handleImageSelect(e.target.files[0]);

    const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
    const handleDragLeave = () => setDragOver(false);
    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        handleImageSelect(e.dataTransfer.files[0]);
    };

    const removeImage = () => {
        setImageFile(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const validateForm = () => {
        if (!formData.product_name.trim()) return 'Product name is required';
        if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) return 'Valid price is required';
        if (formData.num_stocks === '' || isNaN(formData.num_stocks) || Number(formData.num_stocks) < 0) return 'Valid stock count is required';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validateForm();
        if (validationError) { setFormError(validationError); return; }

        setFormLoading(true);
        setFormError(null);

        try {
            const url = modalMode === 'add'
                ? 'http://localhost:5000/products'
                : `http://localhost:5000/products/${selectedProduct.id}`;
            const method = modalMode === 'add' ? 'POST' : 'PUT';

            // Use FormData to support file upload
            const body = new FormData();
            body.append('product_name', formData.product_name);
            body.append('brand_name', formData.brand_name);
            body.append('model_name', formData.model_name);
            body.append('price', Number(formData.price));
            body.append('num_stocks', Number(formData.num_stocks));
            if (imageFile) body.append('image', imageFile);

            // No Content-Type header — browser sets it with multipart boundary automatically
            const response = await fetch(url, { method, body });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to save product');

            await fetchProducts();
            closeModal();
        } catch (err) {
            setFormError(err.message);
        } finally {
            setFormLoading(false);
        }
    };

    const openDeleteConfirm = (product) => { setDeleteTarget(product); setShowDeleteConfirm(true); };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleteLoading(true);
        try {
            const response = await fetch(`http://localhost:5000/products/${deleteTarget.id}`, { method: 'DELETE' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Failed to delete product');
            setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
            setShowDeleteConfirm(false);
            setDeleteTarget(null);
        } catch (err) {
            showAlert('Error: ' + err.message, 'Error');
        } finally {
            setDeleteLoading(false);
        }
    };

    // ---- Shared styles ----
    const inputStyle = {
        width: '100%', padding: '10px 12px',
        border: '1px solid #ddd', borderRadius: '6px',
        fontSize: '14px', boxSizing: 'border-box', outline: 'none'
    };
    const labelStyle = {
        display: 'block', marginBottom: '5px',
        fontWeight: '600', color: '#333', fontSize: '13px'
    };
    const overlayStyle = {
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
    };
    const modalStyle = {
        backgroundColor: 'white', borderRadius: '10px', padding: '30px',
        width: '90%', maxWidth: '520px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        maxHeight: '90vh', overflowY: 'auto'
    };

    if (loading) return (
        <AdminLayout>
            <div className="page-header"><h2>Products Management</h2></div>
            <p style={{ textAlign: 'center', color: '#666' }}>Loading...</p>
        </AdminLayout>
    );

    if (error) return (
        <AdminLayout>
            <div className="page-header"><h2>Products Management</h2></div>
            <p style={{ textAlign: 'center', color: '#dc3545' }}>Error: {error}</p>
        </AdminLayout>
    );

    return (
        <AdminLayout>
            <div className="page-header">
                <h2>Products Management</h2>
                <button onClick={openAddModal} style={{
                    backgroundColor: '#007bff', color: 'white', border: 'none',
                    padding: '10px 20px', borderRadius: '5px', cursor: 'pointer',
                    fontSize: '14px', fontWeight: '600'
                }}>
                    + Add Product
                </button>
            </div>

            {/* ── Add / Edit Modal ── */}
            {showModal && (
                <div style={overlayStyle}>
                    <div style={modalStyle}>
                        <h3 style={{ margin: '0 0 20px 0', color: '#333', fontSize: '20px' }}>
                            {modalMode === 'add' ? 'Add New Product' : 'Edit Product'}
                        </h3>

                        {formError && (
                            <div style={{
                                backgroundColor: '#f8d7da', color: '#721c24',
                                padding: '12px', borderRadius: '6px',
                                marginBottom: '15px', border: '1px solid #f5c6cb', fontSize: '14px'
                            }}>
                                {formError}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                            {/* ── Image Upload ── */}
                            <div>
                                <label style={labelStyle}>Product Image</label>

                                {imagePreview ? (
                                    <div style={{ position: 'relative' }}>
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            style={{
                                                width: '100%', maxHeight: '180px',
                                                objectFit: 'cover', borderRadius: '8px',
                                                border: '2px solid #ddd', display: 'block'
                                            }}
                                        />
                                        {/* Remove button */}
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            title="Remove image"
                                            style={{
                                                position: 'absolute', top: '8px', right: '8px',
                                                backgroundColor: '#dc3545', color: 'white',
                                                border: 'none', borderRadius: '50%',
                                                width: '28px', height: '28px',
                                                cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                                            }}>
                                            ✕
                                        </button>
                                        {/* Change image button */}
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            style={{
                                                marginTop: '8px', padding: '5px 14px',
                                                backgroundColor: '#6c757d', color: 'white',
                                                border: 'none', borderRadius: '4px',
                                                cursor: 'pointer', fontSize: '12px'
                                            }}>
                                            Change Image
                                        </button>
                                        {imageFile && (
                                            <span style={{ marginLeft: '10px', fontSize: '12px', color: '#666' }}>
                                                {imageFile.name} ({(imageFile.size / 1024).toFixed(1)} KB)
                                            </span>
                                        )}
                                    </div>
                                ) : (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        style={{
                                            border: `2px dashed ${dragOver ? '#007bff' : '#ccc'}`,
                                            borderRadius: '8px', padding: '30px 20px',
                                            textAlign: 'center', cursor: 'pointer',
                                            backgroundColor: dragOver ? '#e8f0fe' : '#fafafa',
                                            transition: 'all 0.2s'
                                        }}>
                                        <div style={{ fontSize: '38px', marginBottom: '8px' }}>🖼️</div>
                                        <p style={{ margin: 0, fontWeight: '600', color: '#333', fontSize: '14px' }}>
                                            Click to upload or drag & drop
                                        </p>
                                        <p style={{ margin: '4px 0 0', color: '#999', fontSize: '12px' }}>
                                            JPG, PNG, WEBP — max 5MB
                                        </p>
                                    </div>
                                )}

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileInputChange}
                                    style={{ display: 'none' }}
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Product Name <span style={{ color: '#dc3545' }}>*</span></label>
                                <input type="text" name="product_name" value={formData.product_name}
                                    onChange={handleInputChange} placeholder="e.g. Split-Type Aircon 1.5HP" style={inputStyle} />
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Brand Name</label>
                                    <input type="text" name="brand_name" value={formData.brand_name}
                                        onChange={handleInputChange} placeholder="e.g. Carrier" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Model Name</label>
                                    <input type="text" name="model_name" value={formData.model_name}
                                        onChange={handleInputChange} placeholder="e.g. XCE015EA" style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Price (₱) <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input type="number" name="price" value={formData.price}
                                        onChange={handleInputChange} placeholder="e.g. 25000"
                                        min="0" step="0.01" style={inputStyle} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={labelStyle}>Stock <span style={{ color: '#dc3545' }}>*</span></label>
                                    <input type="number" name="num_stocks" value={formData.num_stocks}
                                        onChange={handleInputChange} placeholder="e.g. 10"
                                        min="0" style={inputStyle} />
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                <button type="submit" disabled={formLoading} style={{
                                    flex: 1, padding: '11px',
                                    backgroundColor: formLoading ? '#ccc' : (modalMode === 'add' ? '#28a745' : '#007bff'),
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: formLoading ? 'not-allowed' : 'pointer',
                                    fontSize: '14px', fontWeight: '600'
                                }}>
                                    {formLoading ? 'Saving...' : (modalMode === 'add' ? 'Add Product' : 'Save Changes')}
                                </button>
                                <button type="button" onClick={closeModal} style={{
                                    flex: 1, padding: '11px', backgroundColor: '#6c757d',
                                    color: 'white', border: 'none', borderRadius: '6px',
                                    cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteConfirm && deleteTarget && (
                <div style={overlayStyle}>
                    <div style={{ ...modalStyle, maxWidth: '400px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗑️</div>
                        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Delete Product?</h3>
                        <p style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                            Are you sure you want to delete <strong>{deleteTarget.product_name}</strong>?
                            This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button onClick={handleDelete} disabled={deleteLoading} style={{
                                flex: 1, padding: '11px',
                                backgroundColor: deleteLoading ? '#ccc' : '#dc3545',
                                color: 'white', border: 'none', borderRadius: '6px',
                                cursor: deleteLoading ? 'not-allowed' : 'pointer',
                                fontSize: '14px', fontWeight: '600'
                            }}>
                                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
                            </button>
                            <button onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }} style={{
                                flex: 1, padding: '11px', backgroundColor: '#6c757d',
                                color: 'white', border: 'none', borderRadius: '6px',
                                cursor: 'pointer', fontSize: '14px', fontWeight: '600'
                            }}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Products Table ── */}
            <div className="recent-section">
                {products.length === 0 ? (
                    <p style={{ color: '#666' }}>No products found</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #eee' }}>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Image</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Product Name</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Brand</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Model</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Price</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Stock</th>
                                <th style={{ padding: '12px', textAlign: 'left', color: '#666', fontWeight: '600' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>
                                        <img
                                            src={
                                                product.image && product.image !== 'default.jpg'
                                                    ? `http://localhost:5000/uploads/${product.image}`
                                                    : '/default.jpg'
                                            }
                                            alt={product.product_name}
                                            style={{
                                                width: '48px', height: '48px',
                                                objectFit: 'cover', borderRadius: '6px',
                                                border: '1px solid #eee'
                                            }}
                                            onError={(e) => { e.target.src = '/default.jpg'; }}
                                        />
                                    </td>
                                    <td style={{ padding: '12px', color: '#333', fontWeight: '500' }}>{product.product_name}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{product.brand_name || 'N/A'}</td>
                                    <td style={{ padding: '12px', color: '#666' }}>{product.model_name || 'N/A'}</td>
                                    <td style={{ padding: '12px', color: '#333' }}>₱{Number(product.price).toLocaleString()}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '3px 10px', borderRadius: '12px',
                                            fontSize: '13px', fontWeight: '600',
                                            backgroundColor: product.num_stocks <= 3 ? '#fff3cd' : '#d4edda',
                                            color: product.num_stocks <= 3 ? '#856404' : '#155724'
                                        }}>
                                            {product.num_stocks}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <button onClick={() => openEditModal(product)} style={{
                                            marginRight: '8px', padding: '5px 12px',
                                            backgroundColor: '#007bff', color: 'white',
                                            border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                                        }}>Edit</button>
                                        <button onClick={() => openDeleteConfirm(product)} style={{
                                            padding: '5px 12px', backgroundColor: '#dc3545',
                                            color: 'white', border: 'none', borderRadius: '4px',
                                            cursor: 'pointer', fontSize: '12px', fontWeight: '500'
                                        }}>Delete</button>
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

export default AdminProducts;