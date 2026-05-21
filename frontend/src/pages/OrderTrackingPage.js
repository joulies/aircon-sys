import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/order-tracking.css';

function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);

  const loadOrderDetails = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Order not found');
      const data = await response.json();
      setOrder(data.order);
      buildTimeline(data.order);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  const buildTimeline = (orderData) => {
    const timelineSteps = [
      {
        status: 'Order Placed',
        date: new Date(orderData.created_at),
        completed: true,
        icon: 'fa-check'
      },
      {
        status: 'Technician Assigned',
        date: null,
        completed: !!orderData.technician?.id,
        icon: 'fa-user-tie'
      },
      {
        status: 'Installation Scheduled',
        date: orderData.appointment?.date ? new Date(orderData.appointment.date) : null,
        completed: orderData.appointment?.date ? new Date(orderData.appointment.date) <= new Date() : false,
        icon: 'fa-calendar'
      },
      {
        status: 'Installation Complete',
        date: null,
        completed: orderData.status?.toLowerCase() === 'completed' || orderData.status?.toLowerCase() === 'delivered',
        icon: 'fa-check-circle'
      }
    ];
    setTimeline(timelineSteps);
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Order cancelled successfully');
        loadOrderDetails();
      } else {
        alert('Failed to cancel order');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      alert('Error cancelling order');
    }
  };

  const handleRequestRefund = async () => {
    if (!window.confirm('Request refund for this order?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        alert('Refund request submitted');
        loadOrderDetails();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to request refund');
      }
    } catch (err) {
      console.error('Error requesting refund:', err);
      alert('Error requesting refund');
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p><Footer /></div>;
  if (error) return <div><Header /><p style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</p><Footer /></div>;
  if (!order) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Order not found</p><Footer /></div>;

  const canCancel = order.status?.toLowerCase() !== 'completed' && order.status?.toLowerCase() !== 'cancelled';
  const canRefund = order.status?.toLowerCase() === 'cancelled' && (order.payment_method?.toLowerCase() === 'gcash' || order.payment_method?.toLowerCase() === 'paymaya');

  return (
    <div>
      <Header />

      <nav className="breadcrumb">
        <Link to="/">HOME</Link> &nbsp;›&nbsp;
        <Link to="/purchase-history">MY PURCHASE</Link> &nbsp;›&nbsp;
        <span className="active-crumb">ORDER TRACKING</span>
      </nav>

      <section className="tracking-container">
        <div className="order-header-section">
          <div className="order-header-info">
            <h1>{order.order_number}</h1>
            <span className={`order-status-badge status-${order.status?.toLowerCase()}`}>
              {order.status?.toUpperCase()}
            </span>
          </div>

          <div className="order-header-buttons">
            {canCancel && (
              <button className="action-btn cancel-btn" onClick={handleCancelOrder}>
                <i className="fa fa-times"></i> Cancel Order
              </button>
            )}
            {canRefund && (
              <button className="action-btn refund-btn" onClick={handleRequestRefund}>
                <i className="fa fa-undo"></i> Request Refund
              </button>
            )}
            <button className="action-btn print-btn" onClick={handlePrintReceipt}>
              <i className="fa fa-print"></i> Print Receipt
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="timeline-section">
          <h3>Order Status Timeline</h3>
          <div className="timeline">
            {timeline.map((step, index) => {
              let svgIcon = null;
              if (step.status === 'Order Placed') {
                svgIcon = (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                );
              } else if (step.status === 'Technician Assigned') {
                svgIcon = (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                );
              } else if (step.status === 'Installation Scheduled') {
                svgIcon = (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                );
              } else if (step.status === 'Installation Complete') {
                svgIcon = (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </svg>
                );
              }

              return (
                <div key={index} className={`timeline-step ${step.completed ? 'completed' : 'pending'}`}>
                  <div className="timeline-marker">
                    {svgIcon}
                  </div>
                  <div className="timeline-content">
                    <h4>{step.status}</h4>
                    {step.date && <p>{step.date.toLocaleDateString()}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Information */}
        <div className="order-info-section">
          <h3>Order Information</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>Order Details</h4>
              <p>
                <strong>Order #:</strong> {order.order_number} <br />
                <strong>Date:</strong> {new Date(order.created_at).toLocaleDateString()} <br />
                <strong>Payment Method:</strong> {order.payment_method?.toUpperCase()} <br />
                <strong>Payment Status:</strong> {order.payment_status}
              </p>
            </div>

            <div className="info-card">
              <h4>Delivery Address</h4>
              {order.address ? (
                <p>
                  {order.address.house} <br />
                  {order.address.barangay}, {order.address.city} <br />
                  {order.address.province} {order.address.zip}
                </p>
              ) : (
                <p>No address provided</p>
              )}
            </div>

            {order.roomDetails && (
              <div className="info-card">
                <h4>Room Details</h4>
                <p>
                  <strong>Room Size:</strong> {order.roomDetails.room_size} <br />
                  <strong>Capacity:</strong> {order.roomDetails.capacity} <br />
                  <strong>Property Type:</strong> {order.roomDetails.property_type}
                </p>
              </div>
            )}

            {order.appointment && (
              <div className="info-card">
                <h4>Appointment Details</h4>
                <p>
                  <strong>Appointment #:</strong> {order.appointment.number} <br />
                  <strong>Date:</strong> {new Date(order.appointment.date).toLocaleDateString()} <br />
                  <strong>Time:</strong> {order.appointment.time}
                </p>
              </div>
            )}

            {order.technician && (
              <div className="info-card">
                <h4>👤 Assigned Technician</h4>
                <p>
                  <strong>Name:</strong> {order.technician.name} <br />
                  <strong>📞 Phone:</strong> <a href={`tel:${order.technician.contact}`} style={{color: '#0066cc', textDecoration: 'none'}}>{order.technician.contact}</a>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Products */}
        <div className="products-section">
          <h3>Products Ordered</h3>
          <table className="products-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items?.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₱ {parseFloat(item.price).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>₱ {(item.quantity * parseFloat(item.price)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Price Summary */}
        <div className="price-summary-section">
          <div className="summary-card">
            <h3>Price Summary</h3>
            <div className="summary-line">
              <span>Subtotal:</span>
              <span>₱ {order.subtotal ? parseFloat(order.subtotal).toFixed(2) : '0.00'}</span>
            </div>
            <div className="summary-line">
              <span>Installation Fee:</span>
              <span>₱ {order.installation_fee ? parseFloat(order.installation_fee).toFixed(2) : '0.00'}</span>
            </div>
            <div className="summary-line total">
              <strong>Total Amount:</strong>
              <strong>₱ {parseFloat(order.total_amount).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default OrderTrackingPage;
