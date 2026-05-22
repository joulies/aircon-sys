import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/checkout.css';

// Barangay data for each city in Cavite
const barangayData = {
  dasma: [
    'Zone I', 'Zone I-A', 'Zone II', 'Zone III', 'Zone IV',
    'Burol I', 'Burol II', 'Burol III', 'Burol Main',
    'Datu Esmael',
    'Emmanuel Bergado I', 'Emmanuel Bergado II',
    'Fatima I', 'Fatima II', 'Fatima III',
    'Luzviminda I', 'Luzviminda II',
    'Paliparan I', 'Paliparan II', 'Paliparan III',
    'Sabang',
    'Saint Peter I', 'Saint Peter II',
    'Salawag',
    'Salitran I', 'Salitran II', 'Salitran III', 'Salitran IV',
    'Sampaloc I', 'Sampaloc II', 'Sampaloc III', 'Sampaloc IV', 'Sampaloc V',
    'San Agustin I', 'San Agustin II', 'San Agustin III',
    'San Andres I', 'San Andres II',
    'San Antonio de Padua I', 'San Antonio de Padua II',
    'San Dionisio', 'San Esteban',
    'San Francisco I', 'San Francisco II',
    'San Isidro', 'San Jose', 'San Juan',
    'San Lorenzo Ruiz I', 'San Lorenzo Ruiz II',
    'San Luis I', 'San Luis II',
    'San Manuel I', 'San Manuel II',
    'San Mateo', 'San Miguel', 'San Miguel II',
    'San Nicolas I', 'San Nicolas II',
    'San Roque', 'San Simon',
    'Santa Cristina I', 'Santa Cristina II',
    'Santa Cruz I', 'Santa Cruz II',
    'Santa Fe', 'Santa Lucia', 'Santa Maria',
    'Santo Cristo', 'Santo Niño'
  ],
  bacoor: [
    'Bayanan', 'Dulong Bayan',
    'Habay I', 'Habay II',
    'Kaingen',
    'Ligas I', 'Ligas II', 'Ligas III',
    'Maliksi I', 'Maliksi II', 'Maliksi III',
    'Mambog I', 'Mambog II', 'Mambog III', 'Mambog IV', 'Mambog V',
    'Molino I', 'Molino II', 'Molino III', 'Molino IV', 'Molino V', 'Molino VI', 'Molino VII',
    'Niog I', 'Niog II', 'Niog III',
    'Panapaan I', 'Panapaan II', 'Panapaan III', 'Panapaan IV',
    'P.F. Espiritu I', 'P.F. Espiritu II',
    'Queens Row Central', 'Queens Row East', 'Queens Row West',
    'Real I', 'Real II',
    'Salinas I', 'Salinas II', 'Salinas III', 'Salinas IV',
    'San Nicolas I', 'San Nicolas II', 'San Nicolas III',
    'Talaba I', 'Talaba II', 'Talaba III'
  ],
  imus: [
    'Alapan I-A', 'Alapan I-B', 'Alapan I-C',
    'Alapan II-A', 'Alapan II-B',
    'Anabu I-A', 'Anabu I-B', 'Anabu I-C', 'Anabu I-D', 'Anabu I-E', 'Anabu I-F', 'Anabu I-G',
    'Anabu II-A', 'Anabu II-B', 'Anabu II-C', 'Anabu II-D', 'Anabu II-E', 'Anabu II-F',
    'Bayan Luma I', 'Bayan Luma II', 'Bayan Luma III', 'Bayan Luma IV', 'Bayan Luma V', 'Bayan Luma VI', 'Bayan Luma VII', 'Bayan Luma VIII',
    'Bucandala I', 'Bucandala II', 'Bucandala III', 'Bucandala IV', 'Bucandala V',
    'Carsadang Bago I', 'Carsadang Bago II',
    'Magdalo', 'Maharlika',
    'Malagasang I-A', 'Malagasang I-B', 'Malagasang I-C', 'Malagasang I-D', 'Malagasang I-E', 'Malagasang I-F', 'Malagasang I-G',
    'Malagasang II-A', 'Malagasang II-B', 'Malagasang II-C', 'Malagasang II-D', 'Malagasang II-E', 'Malagasang II-F', 'Malagasang II-G',
    'Medicion I-A', 'Medicion I-B', 'Medicion I-C', 'Medicion I-D',
    'Medicion II-A', 'Medicion II-B', 'Medicion II-C', 'Medicion II-D', 'Medicion II-E',
    'Pag-asa I', 'Pag-asa II', 'Pag-asa III',
    'Palico I', 'Palico II', 'Palico III', 'Palico IV',
    'Pasong Buaya I', 'Pasong Buaya II',
    'Poblacion I-A', 'Poblacion I-B', 'Poblacion I-C',
    'Poblacion II-A', 'Poblacion II-B', 'Poblacion II-C', 'Poblacion II-D',
    'Poblacion III-A', 'Poblacion III-B',
    'Poblacion IV-A', 'Poblacion IV-B', 'Poblacion IV-C',
    'Tanzang Luma I', 'Tanzang Luma II', 'Tanzang Luma III', 'Tanzang Luma IV', 'Tanzang Luma V', 'Tanzang Luma VI',
    'Toclong I-A', 'Toclong I-B', 'Toclong I-C'
  ]
};

function CheckoutPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [formData, setFormData] = useState({
    room_size: '',
    capacity: '',
    property_type: '',
    house: '',
    province: 'Cavite',
    city: '',
    barangay: '',
    zip: '',
    payment_method: 'cod',
    receipt_file: null
  });

  useEffect(() => {
    loadCheckoutData();
  }, []);

  const loadCheckoutData = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCartItems(data.items || []);
      }
    } catch (err) {
      console.error('Error loading cart:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'city') {
      // Reset barangay when city changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        barangay: ''
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      receipt_file: e.target.files[0]
    }));
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const calculateDownpayment = () => {
    const subtotal = calculateSubtotal();
    const installFee = 500;

    if (formData.payment_method === 'gcash' || formData.payment_method === 'paymaya') {
      return (subtotal * 0.5) + installFee;
    } else if (formData.payment_method === 'cod') {
      return subtotal + installFee;
    }
    return 0;
  };

  const calculateBalance = () => {
    const subtotal = calculateSubtotal();

    if (formData.payment_method === 'gcash' || formData.payment_method === 'paymaya') {
      return subtotal * 0.5;
    }
    return 0;
  };

  const installationFee = 500;
  const subtotal = calculateSubtotal();
  const total = subtotal + installationFee;

  const handleSubmitCheckout = async (e) => {
    e.preventDefault();

    if (!formData.room_size || !formData.capacity || !formData.house) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const formDataObj = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'receipt_file' && formData[key]) {
          formDataObj.append(key, formData[key]);
        } else if (key !== 'receipt_file') {
          formDataObj.append(key, formData[key]);
        }
      });

const token = localStorage.getItem('authToken');
if (!token) {
  navigate('/login');
  return;
}

      const response = await fetch('http://localhost:5000/checkout', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataObj
      });

      if (response.ok) {
        alert('Order placed successfully!');
        navigate('/purchase-history');
      } else {
        alert('Failed to place order');
      }
    } catch (err) {
      console.error('Error submitting checkout:', err);
      alert('Error placing order');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <Header />

      <nav className="breadcrumb">
        <a href="/">HOME</a> &nbsp;›&nbsp;
        <a href="/cart">CART</a> &nbsp;›&nbsp;
        <a href="/appointment">APPOINTMENT</a> &nbsp;›&nbsp;
        <span className="active-crumb">CHECKOUT</span>
      </nav>

      <div className="container checkout-layout">
        <div className="checkout-left">
          <div className="checkout-card checkout-form">
            <h3>Please fill out this form to purchase</h3>
            <hr />

            <form onSubmit={handleSubmitCheckout} encType="multipart/form-data">
              <div className="form-group">
                <label>Room size in sqm:</label>
                <input
                  type="text"
                  name="room_size"
                  value={formData.room_size}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Establishment Capacity (No. of rooms/offices):</label>
                <input
                  type="text"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Property Type:</label>
                <select
                  name="property_type"
                  value={formData.property_type}
                  onChange={handleInputChange}
                >
                  <option value="">Select property type</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                  <option value="industrial">Industrial</option>
                </select>
              </div>

              <h4>Delivery Address</h4>

              <div className="form-group">
                <label>House No./Street Name:</label>
                <input
                  type="text"
                  name="house"
                  value={formData.house}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Province:</label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  disabled
                  readOnly
                />
              </div>

              <div className="form-group">
                <label>City:</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a city</option>
                  <option value="dasma">Dasmariñas</option>
                  <option value="bacoor">Bacoor</option>
                  <option value="imus">Imus</option>
                </select>
              </div>

              <div className="form-group">
                <label>Barangay:</label>
                <select
                  name="barangay"
                  value={formData.barangay}
                  onChange={handleInputChange}
                  required
                  disabled={!formData.city}
                >
                  <option value="">
                    {formData.city ? 'Select a barangay' : 'Please select a city first'}
                  </option>
                  {formData.city &&
                    barangayData[formData.city]?.map((brgy) => (
                      <option key={brgy} value={brgy}>
                        {brgy}
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Zip Code:</label>
                <input
                  type="text"
                  name="zip"
                  value={formData.zip}
                  onChange={handleInputChange}
                />
              </div>

              <h4>Payment Method</h4>

              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    name="payment_method"
                    value="gcash"
                    checked={formData.payment_method === 'gcash'}
                    onChange={handleInputChange}
                  />
                  GCash
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    name="payment_method"
                    value="paymaya"
                    checked={formData.payment_method === 'paymaya'}
                    onChange={handleInputChange}
                  />
                  PayMaya
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="radio"
                    name="payment_method"
                    value="cod"
                    checked={formData.payment_method === 'cod'}
                    onChange={handleInputChange}
                  />
                  Cash on Delivery (COD)
                </label>
              </div>

              {(formData.payment_method === 'gcash' || formData.payment_method === 'paymaya') && (
                <div className="form-group">
                  <label>Upload Receipt/Proof of Payment:</label>
                  <input
                    type="file"
                    name="receipt_file"
                    onChange={handleFileChange}
                    accept="image/*"
                  />
                </div>
              )}

              <button type="submit" className="submit-btn">
                Place Order
              </button>
            </form>
          </div>
        </div>

        <div className="checkout-right">
          <div className="checkout-card order-summary">
            <h3>Order Summary</h3>
            <hr />

            <div className="summary-items">
              {cartItems.map((item) => (
                <div key={item.id} className="summary-item">
                  <span className="item-name">
                    {item.product_name} x{item.quantity}
                  </span>
                  <span className="item-price">
                    ₱ {(parseFloat(item.price) * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>

            <hr />

            <div className="summary-total">
              <div className="total-row">
                <span>Subtotal (Products):</span>
                <span>₱ {subtotal.toFixed(2)}</span>
              </div>
              <div className="total-row">
                <span>Installation Fee:</span>
                <span>₱ {installationFee.toFixed(2)}</span>
              </div>

              {(formData.payment_method === 'gcash' || formData.payment_method === 'paymaya') && (
                <>
                  <hr style={{ margin: '10px 0', borderColor: '#e0e0e0' }} />
                  <div style={{ backgroundColor: '#f0f7ff', padding: '12px', borderRadius: '6px', marginBottom: '12px', border: '1px solid #d4e8f7' }}>
                    <h4 style={{ margin: '0 0 12px 0', color: '#2c6d91', fontSize: '14px', fontWeight: '600' }}>💳 Payment Breakdown (50/50)</h4>

                    <div className="total-row" style={{ fontSize: '13px', marginBottom: '6px', color: '#555' }}>
                      <span>50% of Products:</span>
                      <span style={{ color: '#2c6d91' }}>₱ {(subtotal * 0.5).toFixed(2)}</span>
                    </div>

                    <div className="total-row" style={{ fontSize: '13px', marginBottom: '10px', color: '#555' }}>
                      <span>Installation Fee:</span>
                      <span style={{ color: '#2c6d91' }}>₱ {installationFee.toFixed(2)}</span>
                    </div>

                    <div className="total-row" style={{ color: '#fff', fontWeight: '600', backgroundColor: '#2c6d91', padding: '8px 6px', borderRadius: '4px', marginBottom: '10px' }}>
                      <span>Downpayment Due Now:</span>
                      <span>₱ {calculateDownpayment().toFixed(2)}</span>
                    </div>

                    <div className="total-row" style={{ fontSize: '13px', color: '#555', marginBottom: '6px' }}>
                      <span>Remaining 50% of Products:</span>
                      <span style={{ color: '#2c6d91' }}>₱ {calculateBalance().toFixed(2)}</span>
                    </div>

                    <div className="total-row" style={{ color: '#fff', fontWeight: '600', backgroundColor: '#5a8fb3', padding: '8px 6px', borderRadius: '4px' }}>
                      <span>Balance Due on Appointment:</span>
                      <span>₱ {calculateBalance().toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="total-row final" style={{ color: '#2c6d91', fontWeight: 'bold', fontSize: '15px' }}>
                    <strong>Grand Total:</strong>
                    <strong>₱ {(calculateDownpayment() + calculateBalance()).toFixed(2)}</strong>
                  </div>

                  <p style={{ fontSize: '0.85em', color: '#888', marginTop: '8px', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                    * Full amount must be paid before installation is completed
                  </p>
                </>
              )}

              {formData.payment_method === 'cod' && (
                <>
                  <hr style={{ margin: '10px 0', borderColor: '#e0e0e0' }} />
                  <div className="total-row final" style={{ color: '#2c6d91', fontWeight: 'bold' }}>
                    <strong>Total Due on Appointment Date:</strong>
                    <strong>₱ {calculateDownpayment().toFixed(2)}</strong>
                  </div>
                  <p style={{ fontSize: '0.85em', color: '#888', marginTop: '8px', fontStyle: 'italic', margin: '8px 0 0 0' }}>
                    * Payment required after installation is completed
                  </p>
                </>
              )}

              {(formData.payment_method !== 'gcash' && formData.payment_method !== 'paymaya' && formData.payment_method !== 'cod') && (
                <div className="total-row final">
                  <strong>Total:</strong>
                  <strong>₱ {total.toFixed(2)}</strong>
                </div>
              )}
            </div>

            <button className="print-btn" onClick={handlePrint}>
              <i className="fa fa-print"></i> Print Order
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default CheckoutPage;
