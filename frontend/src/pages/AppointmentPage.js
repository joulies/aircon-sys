import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/appointment.css';

function AppointmentPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState(null);
  const [dateAvailability, setDateAvailability] = useState({}); // Track availability for each date
  const [availabilityError, setAvailabilityError] = useState(null);
  const [availableTechs, setAvailableTechs] = useState([]);
  const showCalendar = true;

  const timeSlots = ['8:00 AM', '1:00 PM'];

  useEffect(() => {
    validateCart();
  }, []);

  // Fetch availability for current month when it changes
  useEffect(() => {
    fetchMonthAvailability(currentMonth);
  }, [currentMonth]);

  // Fetch availability for selected date
  useEffect(() => {
    if (selectedDate) {
      fetchDateAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchMonthAvailability = async (month) => {
    try {
      const availability = {};
      
      // Fetch availability for first and a few sample days to determine month status
      const daysToCheck = [];
      for (let d = 1; d <= Math.min(7, new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()); d++) {
        const dateStr = new Date(month.getFullYear(), month.getMonth(), d).toISOString().split('T')[0];
        daysToCheck.push(dateStr);
      }
      
      for (const dateStr of daysToCheck) {
        try {
          const response = await fetch(`http://localhost:5000/appointments/available-slots/${dateStr}`);
          if (response.ok) {
            const data = await response.json();
            availability[dateStr] = {
              is_fully_booked: data.is_fully_booked,
              has_slots: data.total_available_slots > 0
            };
          }
        } catch (err) {
          console.error('[AppointmentPage] Error fetching availability for', dateStr, err);
        }
      }
      
      setDateAvailability(availability);
    } catch (err) {
      console.error('[AppointmentPage] Error fetching month availability:', err);
    }
  };

  const fetchDateAvailability = async (date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`http://localhost:5000/appointments/available-slots/${dateStr}`);
      
      if (!response.ok) {
        setAvailabilityError('Failed to fetch availability');
        return;
      }
      
      const data = await response.json();
      
      if (data.is_fully_booked) {
        setAvailabilityError(`This date is fully booked for all technicians.`);
        setAvailableTechs([]);
      } else {
        setAvailabilityError(null);
        // Extract available technicians from slots
        const techs = Object.entries(data.slots).map(([techId, techData]) => ({
          id: techId,
          name: techData.name
        }));
        setAvailableTechs(techs);
      }
    } catch (err) {
      console.error('[AppointmentPage] Error fetching date availability:', err);
      setAvailabilityError('Error checking availability');
    }
  };

  useEffect(() => {
    // Monitor cartItems for invalid entries - redirect immediately if found
    if (cartItems && cartItems.length > 0) {
      const invalidItems = cartItems.filter(item => item.quantity > item.num_stocks);
      if (invalidItems.length > 0) {
        console.warn('[AppointmentPage] Invalid items detected in cart items, will redirect to cart');
        navigate('/cart');
      } else {
        console.log('[AppointmentPage] All cart items valid');
      }
    }
  }, [cartItems, navigate]);

  const validateCart = async () => {
    try {
      console.log('[AppointmentPage] Validating cart...');
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://localhost:5000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Failed to load cart');
      const data = await response.json();
      console.log('[AppointmentPage] Cart data received:', data.items);
      
      // Log each item to verify num_stocks is present
      (data.items || []).forEach(item => {
        console.log(`[AppointmentPage] Item: ${item.product_name}, qty=${item.quantity}, stock=${item.num_stocks}`);
      });
      
      setCartItems(data.items || []);
      
      // Check if cart is empty
      if (!data.items || data.items.length === 0) {
        const emptyError = 'Your cart is empty. Please add items before scheduling an appointment.';
        console.warn('[AppointmentPage] Cart is empty:', emptyError);
        setCartError(emptyError);
        return;
      }
      
      // Check if any items exceed stock
      const invalidItems = (data.items || []).filter(item => item.quantity > item.num_stocks);
      if (invalidItems.length > 0) {
        const errorMsg = `Cart contains items that exceed available stock:\n${invalidItems
          .map(item => `${item.product_name}: ${item.quantity} requested but only ${item.num_stocks} available`)
          .join('\n')}`;
        console.error('[AppointmentPage] Cart validation failed:', errorMsg, invalidItems);
        setCartError(errorMsg);
        return;
      }
      
      console.log('[AppointmentPage] Cart validation PASSED');
      setCartError(null);
    } catch (err) {
      const errorMsg = 'Error loading cart: ' + err.message;
      console.error('[AppointmentPage] Error validating cart:', err);
      setCartError(errorMsg);
    }
  };

  useEffect(() => {
    // Monitor cartItems for invalid entries - redirect immediately if found
    if (cartItems && cartItems.length > 0) {
      const invalidItems = cartItems.filter(item => item.quantity > item.num_stocks);
      if (invalidItems.length > 0) {
        console.warn('[AppointmentPage] Invalid items detected in cart items, will redirect to cart');
        navigate('/cart');
      } else {
        console.log('[AppointmentPage] All cart items valid');
      }
    }
  }, [cartItems, navigate]);

  const getDaysInMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isDateDisabled = (day) => {
    if (day === null) return true;
    
    // Create the date to check
    const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Get today's date (at midnight)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Disable if date is today or in the past
    return dateToCheck <= today;
  };

  const handleDateClick = (day) => {
    if (!isDateDisabled(day)) {
      const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      setSelectedDate(selected);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const handleApply = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('[AppointmentPage] handleApply called');
    console.log('[AppointmentPage] cartError:', cartError);
    console.log('[AppointmentPage] cartItems:', cartItems);
    console.log('[AppointmentPage] selectedDate:', selectedDate);
    console.log('[AppointmentPage] selectedTime:', selectedTime);
    
    if (!selectedDate || !selectedTime) {
      console.error('[AppointmentPage] Missing date or time selection');
      alert('Please select both date and time');
      return;
    }

    // STRICT CHECK 1: Check for cart error
    if (cartError) {
      console.error('[AppointmentPage] BLOCKED - Cart error exists');
      alert('Cannot proceed. Please fix the items in your cart:\n\n' + cartError);
      navigate('/cart');
      return;
    }

    // STRICT CHECK 2: Must have cart items
    if (!cartItems || cartItems.length === 0) {
      console.error('[AppointmentPage] BLOCKED - Cart is empty');
      alert('Your cart is empty. Please add items before scheduling.');
      navigate('/cart');
      return;
    }

    // STRICT CHECK 3: No items can exceed stock
    const invalidItems = cartItems.filter(item => {
      const isInvalid = item.quantity > item.num_stocks;
      console.log(`[AppointmentPage] Check: ${item.product_name}: qty=${item.quantity} vs stock=${item.num_stocks} = ${isInvalid ? 'INVALID' : 'OK'}`);
      return isInvalid;
    });
    
    if (invalidItems.length > 0) {
      const errorMsg = `Cannot proceed! The following items exceed available stock:\n${invalidItems
        .map(item => `${item.product_name}: ${item.quantity} requested but only ${item.num_stocks} available`)
        .join('\n')}`;
      console.error('[AppointmentPage] BLOCKED - Items exceed stock');
      alert(errorMsg);
      navigate('/cart');
      return;
    }

    console.log('[AppointmentPage] All validation passed, creating appointment...');
    
    try {
      const appointmentData = {
        appointment_date: selectedDate.toISOString().split('T')[0],
        appointment_time: selectedTime
      };
      console.log('[AppointmentPage] Sending appointment request:', appointmentData);
      
      const response = await fetch('http://localhost:5000/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(appointmentData)
      });

      const data = await response.json();
      console.log('[AppointmentPage] Appointment response:', { status: response.status, ok: response.ok, data });

      if (response.ok) {
        console.log('[AppointmentPage] SUCCESS - Appointment created, navigating to checkout');
        navigate('/checkout');
      } else {
        console.error('[AppointmentPage] Backend rejected appointment:', data.message);
        alert('Cannot schedule appointment:\n' + (data.message || 'Failed to schedule appointment'));
        navigate('/cart');
      }
    } catch (err) {
      console.error('[AppointmentPage] Network error creating appointment:', err);
      alert('Error: ' + err.message);
    }
  };

  const getDateAvailabilityClass = (day) => {
    if (day === null || isDateDisabled(day)) return '';
    
    const dateStr = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      .toISOString().split('T')[0];
    const availability = dateAvailability[dateStr];
    
    if (!availability) return 'availability-unknown';
    if (availability.is_fully_booked) return 'fully-booked';
    if (availability.has_slots) return 'available';
    return 'availability-unknown';
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);
  const days = [];

  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div>
      <Header />

      <nav className="breadcrumb">
        <a href="/">HOME</a> &nbsp;›&nbsp;
        <span className="active-crumb">SET APPOINTMENT</span>
      </nav>

      <section className="appointment-container">
        <div className="appointment-card">
          <h2>Schedule Your Installation Appointment</h2>

          {/* CRITICAL ERROR BLOCK - if cart has issues, show error and block everything */}
          {cartError && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '2px solid #721c24',
              borderRadius: '6px',
              padding: '20px',
              marginBottom: '20px',
              color: '#721c24',
              textAlign: 'center'
            }}>
              <strong style={{ fontSize: '16px', display: 'block', marginBottom: '10px' }}>
                <i className="fa fa-exclamation-circle"></i> CANNOT PROCEED TO CHECKOUT
              </strong>
              <p style={{ whiteSpace: 'pre-line', margin: '10px 0' }}>
                {cartError}
              </p>
              <p style={{ fontSize: '14px', margin: '10px 0' }}>
                Please update your cart and try again.
              </p>
              <button 
                style={{
                  marginTop: '10px',
                  padding: '10px 20px',
                  backgroundColor: '#721c24',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onClick={() => navigate('/cart')}
              >
                Go Back to Fix Cart
              </button>
            </div>
          )}

          <div className="appointment-content" style={{ display: cartError ? 'none' : 'grid' }}>
            {showCalendar && (
              <div className="calendar-section">
                <h3>Select Date</h3>
                <div className="calendar-header">
                  <button onClick={handlePrevMonth}>&lt;</button>
                  <span>{monthYear}</span>
                  <button onClick={handleNextMonth}>&gt;</button>
                </div>

                <div className="calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="calendar-header-day">
                      {day}
                    </div>
                  ))}
                  {days.map((day, index) => (
                    <button
                      key={index}
                      className={`calendar-day ${day === null ? 'empty' : ''} ${
                        selectedDate &&
                        day === selectedDate.getDate() &&
                        currentMonth.getMonth() === selectedDate.getMonth()
                          ? 'selected'
                          : ''
                      } ${getDateAvailabilityClass(day)}`}
                      onClick={() => day && handleDateClick(day)}
                      disabled={isDateDisabled(day)}
                      title={
                        day && dateAvailability[new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0]]?.is_fully_booked
                          ? 'This date is fully booked'
                          : day && dateAvailability[new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day).toISOString().split('T')[0]]?.has_slots
                          ? 'Slots available'
                          : day
                          ? 'Checking availability...'
                          : ''
                      }
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="time-section">
              <h3>Select Time</h3>
              {availabilityError && (
                <div style={{
                  backgroundColor: '#f8d7da',
                  border: '1px solid #f5c6cb',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '15px',
                  color: '#721c24',
                  fontSize: '14px'
                }}>
                  <strong><i className="fa fa-exclamation-circle"></i></strong> {availabilityError}
                </div>
              )}
              {selectedDate && !availabilityError && availableTechs.length > 0 && (
                <div style={{
                  backgroundColor: '#d4edda',
                  border: '1px solid #c3e6cb',
                  borderRadius: '4px',
                  padding: '12px',
                  marginBottom: '15px',
                  color: '#155724',
                  fontSize: '14px'
                }}>
                  <strong><i className="fa fa-check-circle"></i></strong> {availableTechs.length} technician{availableTechs.length !== 1 ? 's' : ''} available
                </div>
              )}
              <div className="time-slots">
                {timeSlots.map((slot) => (
                  <button
                    key={slot}
                    className={`time-slot ${selectedTime === slot ? 'selected' : ''}`}
                    onClick={() => setSelectedTime(slot)}
                    disabled={availabilityError ? true : false}
                    style={{
                      opacity: availabilityError ? 0.5 : 1,
                      cursor: availabilityError ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {cartError && (
            <div style={{
              backgroundColor: '#f8d7da',
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              padding: '15px',
              marginBottom: '20px',
              color: '#721c24'
            }}>
              <strong><i className="fa fa-exclamation-circle"></i> Cart Error:</strong>
              <p style={{ marginTop: '8px', marginBottom: 0, whiteSpace: 'pre-line' }}>
                {cartError}
              </p>
              <button 
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  backgroundColor: '#721c24',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/cart')}
              >
                Go Back to Cart
              </button>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="appointment-summary">
              <p>
                <strong>Selected Date:</strong> {selectedDate.toDateString()}
              </p>
              <p>
                <strong>Selected Time:</strong> {selectedTime}
              </p>
            </div>
          )}

          <button 
            className="apply-btn" 
            onClick={(e) => {
              // Double-check validation on click
              const shouldDisable = !!cartError || cartItems.some(item => item.quantity > item.num_stocks) || cartItems.length === 0;
              if (shouldDisable) {
                e.preventDefault();
                e.stopPropagation();
                console.error('[AppointmentPage] Button click blocked - validation failed');
                return false;
              }
              handleApply(e);
            }}
            disabled={!!cartError || cartItems.some(item => item.quantity > item.num_stocks) || cartItems.length === 0}
            style={{
              opacity: (cartError || cartItems.some(item => item.quantity > item.num_stocks) || cartItems.length === 0) ? 0.6 : 1,
              cursor: (cartError || cartItems.some(item => item.quantity > item.num_stocks) || cartItems.length === 0) ? 'not-allowed' : 'pointer',
              pointerEvents: (cartError || cartItems.some(item => item.quantity > item.num_stocks) || cartItems.length === 0) ? 'none' : 'auto'
            }}
          >
            Continue to Checkout
          </button>
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AppointmentPage;
