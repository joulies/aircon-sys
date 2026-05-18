import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/purchase-history.css';

function PurchaseHistoryPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/orders', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower === 'completed' || statusLower === 'delivered') return 'badge-success';
    if (statusLower === 'pending' || statusLower === 'processing') return 'badge-info';
    if (statusLower === 'cancelled') return 'badge-danger';
    if (statusLower === 'refunded') return 'badge-warning';
    return 'badge-secondary';
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedOrder(null);
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/order-tracking/${orderId}`);
  };

  return (
    <div>
      <Header />

      <nav className="breadcrumb">
        <Link to="/">HOME</Link> &nbsp;›&nbsp;
        <span className="active-crumb">MY PURCHASE HISTORY</span>
      </nav>

      <section className="purchase-history-container">
        {loading && <p style={{ textAlign: 'center', padding: '20px' }}>Loading orders...</p>}

        {!loading && orders.length === 0 && (
          <p style={{ textAlign: 'center', padding: '20px' }}>No orders found</p>
        )}

        {!loading && orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => (
              <div key={order.id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <h3>Order #{order.id}</h3>
                    <p className="order-date">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`order-status ${getStatusBadgeClass(order.status)}`}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>

                <div className="order-details">
                  <p>
                    <strong>Total Amount:</strong> ₱ {parseFloat(order.total_amount).toFixed(2)}
                  </p>
                  <p>
                    <strong>Payment Status:</strong> {order.payment_status}
                  </p>
                  <p>
                    <strong>Payment Method:</strong> {order.payment_method}
                  </p>
                </div>

                <div className="order-actions">
                  <button
                    className="details-btn"
                    onClick={() => handleViewDetails(order)}
                  >
                    <i className="fa fa-eye"></i> View Details
                  </button>
                  <button
                    className="track-btn"
                    onClick={() => handleTrackOrder(order.id)}
                  >
                    <i className="fa fa-map"></i> Track Order
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal for order details */}
      {showModal && selectedOrder && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Order Details</h2>
              <button className="close-btn" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              <h3>Products</h3>
              <table className="details-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td>₱ {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      <td>₱ {(item.quantity * parseFloat(item.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 style={{ marginTop: '20px' }}>Installation Location</h3>
              {selectedOrder.address && (
                <p>
                  {selectedOrder.address.house}, {selectedOrder.address.barangay},
                  {selectedOrder.address.city}, {selectedOrder.address.province}{' '}
                  {selectedOrder.address.zip}
                </p>
              )}

              {selectedOrder.appointment && (
                <>
                  <h3 style={{ marginTop: '20px' }}>Appointment Details</h3>
                  <p>
                    <strong>Date:</strong>{' '}
                    {new Date(selectedOrder.appointment.date).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Time:</strong> {selectedOrder.appointment.time}
                  </p>
                </>
              )}

              {selectedOrder.technician && (
                <>
                  <h3 style={{ marginTop: '20px' }}>Assigned Technician</h3>
                  <p>
                    <strong>Name:</strong> {selectedOrder.technician.name}
                  </p>
                  <p>
                    <strong>Contact:</strong> {selectedOrder.technician.contact}
                  </p>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button className="close-modal-btn" onClick={closeModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default PurchaseHistoryPage;
