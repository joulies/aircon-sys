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
      setOrder(data);
      buildTimeline(data);
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
        status: 'Installation Scheduled',
        date: orderData.appointment?.date ? new Date(orderData.appointment.date) : null,
        completed: orderData.appointment?.date ? new Date(orderData.appointment.date) <= new Date() : false,
        icon: 'fa-calendar'
      },
      {
        status: 'Technician Assigned',
        date: null,
        completed: !!orderData.technician?.id,
        icon: 'fa-user-tie'
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
            <h1>Order #{order.id}</h1>
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
            {timeline.map((step, index) => (
              <div key={index} className={`timeline-step ${step.completed ? 'completed' : 'pending'}`}>
                <div className="timeline-marker">
                  <i className={`fa ${step.icon}`}></i>
                </div>
                <div className="timeline-content">
                  <h4>{step.status}</h4>
                  {step.date && <p>{step.date.toLocaleDateString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Information */}
        <div className="order-info-section">
          <h3>Order Information</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>Delivery Address</h4>
              {order.address && (
                <p>
                  {order.address.house} <br />
                  {order.address.barangay}, {order.address.city} <br />
                  {order.address.province} {order.address.zip}
                </p>
              )}
            </div>

            {order.appointment && (
              <div className="info-card">
                <h4>Appointment Details</h4>
                <p>
                  <strong>Date:</strong> {new Date(order.appointment.date).toLocaleDateString()} <br />
                  <strong>Time:</strong> {order.appointment.time}
                </p>
              </div>
            )}

            {order.technician && (
              <div className="info-card">
                <h4>Assigned Technician</h4>
                <p>
                  <strong>Name:</strong> {order.technician.name} <br />
                  <strong>Contact:</strong> {order.technician.contact}
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
                  <td>₱ {parseFloat(item.price).toFixed(2)}</td>
                  <td>₱ {(item.quantity * parseFloat(item.price)).toFixed(2)}</td>
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
