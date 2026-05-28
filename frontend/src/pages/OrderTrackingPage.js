import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { showAlert } from '../utils/alertDialog';
import '../styles/order-tracking.css';

function OrderTrackingPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);
  const [refundRequest, setRefundRequest] = useState(null);
  const [, setRefreshing] = useState(false);

  const loadOrderDetails = useCallback(async () => {
    try {
      setRefreshing(true);
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

      // Fetch refund request status
      try {
        const refundRes = await fetch(`http://localhost:5000/orders/${orderId}/refund-status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (refundRes.ok) {
          const refundData = await refundRes.json();
          setRefundRequest(refundData);
        }
      } catch (err) {
        // Refund endpoint might not exist yet, ignore
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [orderId]);

  useEffect(() => {
    loadOrderDetails();
  }, [loadOrderDetails]);

  // Auto-refresh every 30 seconds to show real-time updates
  useEffect(() => {
    const interval = setInterval(loadOrderDetails, 30000);
    return () => clearInterval(interval);
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

  const canCancelOrder = () => {
    if (!order) return false;

    // Disable if refund request exists
    if (refundRequest) {
      return false;
    }

    if (order.status?.toLowerCase() === 'completed' || order.status?.toLowerCase() === 'cancelled') {
      return false;
    }

    // Check appointment date - cannot cancel on or after appointment date
    if (order.appointment?.date) {
      const appointmentDate = new Date(order.appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate <= today) {
        return false;
      }
    }

    // For PayMaya/GCash, require payment confirmation
    if (order.payment_method?.toLowerCase() !== 'cod') {
      const paymentStatus = order.payment_status?.toLowerCase();
      return paymentStatus === 'half paid' || paymentStatus === 'fully_paid';
    }

    // For COD, only check appointment date (already checked above)
    return true;
  };

  const handleCancelOrder = async () => {
    if (!canCancelOrder()) {
      if (refundRequest) {
        const status = refundRequest.status?.charAt(0).toUpperCase() + refundRequest.status?.slice(1);
        showAlert(`Cannot cancel order. Your refund request is currently ${status.toLowerCase()}.`, 'Information');
      } else if (order.status?.toLowerCase() === 'completed') {
        showAlert('Cannot cancel this order. The installation has been completed.', 'Information');
      } else if (order.status?.toLowerCase() === 'cancelled') {
        showAlert('This order has already been cancelled.', 'Information');
      } else if (order.payment_method?.toLowerCase() !== 'cod' &&
          (order.payment_status?.toLowerCase() === 'pending confirmation' ||
           order.payment_status?.toLowerCase() === 'unpaid')) {
        showAlert('Your payment must be confirmed by our admin team before you can cancel this order.', 'Information');
      } else {
        showAlert('Cannot cancel order on or after the appointment date. Cancellations are only allowed before your appointment date.', 'Information');
      }
      return;
    }

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
        showAlert('Order cancelled successfully', 'Success');
        loadOrderDetails();
      } else {
        const data = await response.json();
        showAlert(data.message || 'Failed to cancel order', 'Error');
      }
    } catch (err) {
      console.error('Error cancelling order:', err);
      showAlert('Error cancelling order', 'Error');
    }
  };

  const handleRequestRefund = async () => {
    if (!refundReason.trim()) {
      showAlert('Please provide a reason for the refund request', 'Information');
      return;
    }

    setSubmittingRefund(true);
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`http://localhost:5000/orders/${orderId}/refund`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: refundReason })
      });

      if (response.ok) {
        showAlert('Refund request submitted successfully', 'Success');
        setShowRefundModal(false);
        setRefundReason('');
        loadOrderDetails();
      } else {
        const data = await response.json();
        showAlert(data.message || 'Failed to request refund', 'Error');
      }
    } catch (err) {
      console.error('Error requesting refund:', err);
      showAlert('Error requesting refund', 'Error');
    } finally {
      setSubmittingRefund(false);
    }
  };

  const handlePrintReceipt = () => {
    window.print();
  };

  if (loading) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Loading...</p><Footer /></div>;
  if (error) return <div><Header /><p style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</p><Footer /></div>;
  if (!order) return <div><Header /><p style={{ textAlign: 'center', padding: '20px' }}>Order not found</p><Footer /></div>;

  const canCancel = canCancelOrder();
  const canRefund = order.status?.toLowerCase() === 'cancelled' && (order.payment_method?.toLowerCase() === 'gcash' || order.payment_method?.toLowerCase() === 'paymaya') && !refundRequest;

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
            {refundRequest && (
              <div style={{
                backgroundColor: refundRequest.status === 'pending' ? '#fff3cd' : refundRequest.status === 'approved' ? '#d4edda' : '#f8d7da',
                border: `1px solid ${refundRequest.status === 'pending' ? '#ffeaa7' : refundRequest.status === 'approved' ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: '4px',
                padding: '12px',
                marginBottom: '15px',
                color: refundRequest.status === 'pending' ? '#856404' : refundRequest.status === 'approved' ? '#155724' : '#721c24'
              }}>
                <p style={{ margin: 0, fontWeight: '600' }}>
                  💬 Refund Request {refundRequest.status?.charAt(0).toUpperCase() + refundRequest.status?.slice(1)}
                </p>
                <p style={{ margin: '5px 0 0 0', fontSize: '13px' }}>
                  {refundRequest.status === 'pending' && 'Our team is reviewing your refund request.'}
                  {refundRequest.status === 'approved' && 'Your refund has been approved. You will receive it within 3-5 business days.'}
                  {refundRequest.status === 'rejected' && 'Your refund request has been rejected.'}
                </p>
              </div>
            )}
            {canCancel && (
              <button className="action-btn cancel-btn" onClick={handleCancelOrder}>
                <i className="fa fa-times"></i> Cancel Order
              </button>
            )}
            {!canCancel && !refundRequest && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="action-btn cancel-btn" disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                  <i className="fa fa-times"></i> Cancel Order (Unavailable)
                </button>
                {order.status?.toLowerCase() === 'completed' && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#dc3545', fontStyle: 'italic' }}>
                    ✓ Installation completed. Orders cannot be cancelled after completion.
                  </p>
                )}
                {order.status?.toLowerCase() === 'cancelled' && (
                  <p style={{ margin: 0, fontSize: '12px', color: '#6c757d', fontStyle: 'italic' }}>
                    This order has already been cancelled.
                  </p>
                )}
              </div>
            )}
            {canRefund && (
              <button className="action-btn refund-btn" onClick={() => setShowRefundModal(true)}>
                <i className="fa fa-undo"></i> Request Refund
              </button>
            )}
            <button className="action-btn print-btn" onClick={handlePrintReceipt}>
              <i className="fa fa-print"></i> Print Receipt
            </button>
          </div>
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white', borderRadius: '8px', padding: '30px',
              maxWidth: '500px', width: '90%'
            }}>
              <h2>Request Refund</h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Please provide a reason for your refund request. Our team will review and respond within 3-5 business days.
              </p>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600' }}>
                  Reason for Refund: <span style={{ color: 'red' }}>*</span>
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter your reason for requesting a refund..."
                  style={{
                    width: '100%', padding: '10px', border: '1px solid #ddd',
                    borderRadius: '4px', fontSize: '14px', fontFamily: 'Arial, sans-serif',
                    minHeight: '80px', resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundReason('');
                  }}
                  disabled={submittingRefund}
                  style={{
                    padding: '10px 20px', backgroundColor: '#ccc',
                    color: '#333', border: 'none', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestRefund}
                  disabled={submittingRefund}
                  style={{
                    padding: '10px 20px', backgroundColor: '#007bff',
                    color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer'
                  }}
                >
                  {submittingRefund ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        )}

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

            {(order.payment_method?.toLowerCase() === 'gcash' || order.payment_method?.toLowerCase() === 'paymaya') && (
              <>
                <hr style={{ margin: '12px 0', borderColor: '#e0e0e0' }} />
                <div style={{ backgroundColor: '#f0f7ff', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #d4e8f7' }}>
                  <h4 style={{ margin: '0 0 12px 0', color: '#2c6d91', fontSize: '14px', fontWeight: '600' }}>💳 Payment Breakdown (50/50)</h4>

                  <div className="summary-line" style={{ fontSize: '13px', marginBottom: '6px', color: '#555' }}>
                    <span>50% of Products:</span>
                    <span style={{ color: '#2c6d91' }}>₱ {(parseFloat(order.subtotal) * 0.5).toFixed(2)}</span>
                  </div>

                  <div className="summary-line" style={{ fontSize: '13px', marginBottom: '10px', color: '#555' }}>
                    <span>Installation Fee:</span>
                    <span style={{ color: '#2c6d91' }}>₱ {parseFloat(order.installation_fee).toFixed(2)}</span>
                  </div>

                  <div className="summary-line" style={{ color: '#fff', fontWeight: '600', backgroundColor: '#2c6d91', padding: '8px 6px', borderRadius: '4px', marginBottom: '10px' }}>
                    <span>Downpayment Due Now:</span>
                    <span>₱ {((parseFloat(order.subtotal) * 0.5) + parseFloat(order.installation_fee)).toFixed(2)}</span>
                  </div>

                  <div className="summary-line" style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                    <span>Remaining 50% of Products:</span>
                    <span style={{ color: '#2c6d91' }}>₱ {(parseFloat(order.subtotal) * 0.5).toFixed(2)}</span>
                  </div>

                  <div className="summary-line" style={{ color: '#fff', fontWeight: '600', backgroundColor: '#5a8fb3', padding: '8px 6px', borderRadius: '4px' }}>
                    <span>Balance Due on Appointment:</span>
                    <span>₱ {(parseFloat(order.subtotal) * 0.5).toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}

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
