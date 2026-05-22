import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import '../styles/appointment.css';

const API = 'http://localhost:5000';

// ─── Helper ──────────────────────────────────────────────────────────────────
const to24h = (time12) => {
  const [time, period] = time12.split(' ');
  let [h, m] = time.split(':').map(Number);
  if (period === 'PM' && h !== 12) h += 12;
  if (period === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const to12h = (time24) => {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, '0')} ${period}`;
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('authToken')}`,
});

// ─── Sub-components ───────────────────────────────────────────────────────────

function DatePicker({ currentMonth, selectedDate, dateAvailability, calendarLoading, onDateClick, onPrevMonth, onNextMonth }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const days = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const monthYear = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

  const getClass = (day) => {
    if (!day) return 'empty';
    const dateToCheck = new Date(year, month, day);
    if (dateToCheck <= today) return 'calendar-day disabled-past';

    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    const avail = dateAvailability[dateStr];

    let cls = 'calendar-day';
    if (selectedDate && day === selectedDate.getDate() && month === selectedDate.getMonth()) cls += ' selected';
    if (!avail) return cls + ' availability-unknown';
    if (avail.is_fully_booked) return cls + ' fully-booked';
    if (avail.has_slots) return cls + ' available';
    return cls + ' availability-unknown';
  };

  const isDisabled = (day) => {
    if (!day) return true;
    const dateToCheck = new Date(year, month, day);
    if (dateToCheck <= today) return true;
    const dateStr = new Date(year, month, day).toISOString().split('T')[0];
    return dateAvailability[dateStr]?.is_fully_booked === true;
  };

  return (
    <div className="calendar-section">
      <h3>Select Date</h3>
      <div className="calendar-header">
        <button onClick={onPrevMonth}>&lt;</button>
        <span>{monthYear}</span>
        <button onClick={onNextMonth}>&gt;</button>
      </div>

      {/* Loading indicator */}
      {calendarLoading && (
        <div style={{ fontSize: 12, color: '#2c6d91', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', border: '2px solid #2c6d91', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          Checking availability...
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, flexWrap: 'wrap', fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#d4edda', border: '1px solid #c3e6cb', borderRadius: 2, display: 'inline-block' }} />
          Available
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 2, display: 'inline-block' }} />
          Fully Booked
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 12, height: 12, background: '#fff3cd', border: '1px solid #ffeaa7', borderRadius: 2, display: 'inline-block' }} />
          Checking...
        </span>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="calendar-header-day">{d}</div>
        ))}
        {days.map((day, idx) => (
          <button
            key={idx}
            className={getClass(day)}
            onClick={() => day && !isDisabled(day) && onDateClick(day)}
            disabled={isDisabled(day)}
            title={
              day
                ? dateAvailability[new Date(year, month, day).toISOString().split('T')[0]]?.is_fully_booked
                  ? 'Fully booked'
                  : 'Click to select'
                : ''
            }
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimeSlotGrid({ timeSlots, slotStatus, slotCapacity, selectedTime, onSelectTime, dateSelected, userBookedTimes = [] }) {
  if (!dateSelected) {
    return (
      <div className="time-section">
        <h3>Select Time</h3>
        <p style={{ color: '#888', fontSize: 14 }}>Please select a date first.</p>
      </div>
    );
  }

  if (timeSlots.length === 0) {
    return (
      <div className="time-section">
        <h3>Select Time</h3>
        <p style={{ color: '#888', fontSize: 14 }}>Loading available slots...</p>
      </div>
    );
  }

  return (
    <div className="time-section">
      <h3>Select Time</h3>
      <div className="time-slots">
        {timeSlots.map((slot) => {
          const status      = slotStatus[slot] || 'unknown';
          const cap         = slotCapacity[slot] || {};
          const isBooked    = status === 'booked';
          const isUserOwned = userBookedTimes.includes(slot); // user already has this slot
          const isSelected  = selectedTime === slot;
          const { booked = 0, total = 0, remaining = 0 } = cap;

          // Colour of the capacity bar fill
          const fillPct  = total > 0 ? (booked / total) * 100 : 0;
          const barColor = isBooked ? '#dc3545' : remaining === 1 ? '#fd7e14' : '#28a745';

          return (
            <button
              key={slot}
              className={`time-slot ${isSelected ? 'selected' : ''} ${isBooked ? 'slot-booked' : ''}`}
              onClick={() => !isBooked && !isUserOwned && onSelectTime(slot)}
              disabled={isBooked}
              style={{
                position: 'relative',
                opacity: isBooked ? 0.65 : 1,
                cursor: (isBooked || isUserOwned) ? 'not-allowed' : 'pointer',
                background: isUserOwned ? '#ffeeba' : isBooked ? '#f8d7da' : isSelected ? '#2c6d91' : '#fff',
                borderColor: isUserOwned ? '#ffc107' : isBooked ? '#f5c6cb' : isSelected ? '#2c6d91' : '#ddd',
                color: isUserOwned ? '#856404' : isBooked ? '#721c24' : isSelected ? '#fff' : '#333',
                paddingBottom: 10,
                overflow: 'hidden',
              }}
            >
              {/* Slot label */}
              <span style={{ fontWeight: 700, fontSize: 15 }}>{slot}</span>

              {/* Capacity text */}
              {total > 0 && (
                <span style={{
                  display: 'block',
                  fontSize: 11,
                  marginTop: 3,
                  fontWeight: 500,
                  color: isSelected ? 'rgba(255,255,255,0.85)' : isBooked ? '#721c24' : '#555',
                }}>
                  {isUserOwned
                    ? '✗ Already booked by you'
                    : isBooked
                    ? '✗ Fully booked'
                    : `${remaining} of ${total} slot${total !== 1 ? 's' : ''} remaining`}
                </span>
              )}

              {/* Capacity bar */}
              {total > 0 && (
                <span style={{
                  display: 'block',
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  height: 4,
                  width: '100%',
                  background: 'rgba(0,0,0,0.08)',
                }}>
                  <span style={{
                    display: 'block',
                    height: '100%',
                    width: `${fillPct}%`,
                    background: isSelected ? 'rgba(255,255,255,0.5)' : barColor,
                    transition: 'width 0.3s ease',
                  }} />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ConfirmationMessage({ date, time }) {
  return (
    <div style={{
      background: '#d4edda',
      border: '1px solid #c3e6cb',
      borderRadius: 8,
      padding: '16px 20px',
      marginBottom: 20,
      color: '#155724',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
    }}>
      <span style={{ fontSize: 20 }}>✅</span>
      <div>
        <strong style={{ display: 'block', marginBottom: 4 }}>Appointment Selected</strong>
        <span style={{ fontSize: 14 }}>
          {date?.toDateString()} at {time} — Please proceed to checkout.
        </span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function AppointmentPage() {
  const navigate = useNavigate();

  // Calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [dateAvailability, setDateAvailability] = useState({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Time slots
  const [timeSlots, setTimeSlots] = useState([]);       // display labels e.g. ["8:00 AM", "1:00 PM"]
  const [slotStatus, setSlotStatus] = useState({});     // { "8:00 AM": "available"|"booked" }
  const [slotCapacity, setSlotCapacity] = useState({}); // { "8:00 AM": { booked, total, remaining } }
  const [selectedTime, setSelectedTime] = useState(null);

  // Cart / validation
  const [cartItems, setCartItems] = useState([]);
  const [cartError, setCartError] = useState(null);

  // Booking state
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]); // [{ date: 'YYYY-MM-DD', time: '08:00' }]

  // ─────────────────────────────────────────────────────────────────────────
  const checkExistingAppointment = async () => {
    try {
      const res = await fetch(`${API}/appointments`, { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      const today = new Date(); today.setHours(0, 0, 0, 0);
      // Store all upcoming booked date+time pairs
      const slots = (data.appointments || [])
        .filter(a => new Date(a.appointment_date) >= today)
        .map(a => ({
          date: a.appointment_date.split('T')[0],
          time: a.appointment_time,
          number: a.appointment_number,
        }));
      setBookedSlots(slots);
    } catch (err) {
      console.error('[AppointmentPage] Could not check existing appointments:', err);
    }
  };

  const validateCart = async () => {
    try {
      const res = await fetch(`${API}/cart`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to load cart');
      const data = await res.json();
      const items = data.items || [];
      setCartItems(items);

      if (items.length === 0) {
        setCartError('Your cart is empty. Please add items before scheduling an appointment.');
        return;
      }
      const invalid = items.filter(i => i.quantity > i.num_stocks);
      if (invalid.length > 0) {
        setCartError(
          `Cart contains items that exceed available stock:\n${invalid
            .map(i => `${i.product_name}: ${i.quantity} requested, only ${i.num_stocks} available`)
            .join('\n')}`
        );
        return;
      }
      setCartError(null);
    } catch (err) {
      setCartError('Error loading cart: ' + err.message);
    }
  };

  const fetchMonthAvailability = useCallback(async (month) => {
    setCalendarLoading(true);
    const year = month.getFullYear();
    const mo = month.getMonth();
    const daysInMonth = new Date(year, mo + 1, 0).getDate();
    const today = new Date(); today.setHours(0,0,0,0);

    // Collect future dates only
    const futureDates = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, mo, d);
      if (dateObj > today) futureDates.push(dateObj.toISOString().split('T')[0]);
    }

    // Fetch in batches of 5 to avoid flooding the backend
    const BATCH = 5;
    for (let i = 0; i < futureDates.length; i += BATCH) {
      const batch = futureDates.slice(i, i + BATCH);
      const results = await Promise.all(
        batch.map(dateStr =>
          fetch(`${API}/appointments/available-slots/${dateStr}`)
            .then(r => {
              if (!r.ok) {
                console.error(`[Availability] HTTP ${r.status} for ${dateStr}`);
                return null;
              }
              return r.json();
            })
            .catch(err => {
              console.error(`[Availability] Fetch failed for ${dateStr}:`, err);
              return null;
            })
        )
      );
      const updates = {};
      batch.forEach((dateStr, idx) => {
        const data = results[idx];
        if (data) {
          updates[dateStr] = {
            is_fully_booked: data.is_fully_booked,
            has_slots: (data.total_available_slots || 0) > 0,
          };
        } else {
          // Mark as unknown so user can still click and try
          updates[dateStr] = { is_fully_booked: false, has_slots: true };
        }
      });
      setDateAvailability(prev => ({ ...prev, ...updates }));
    }
    setCalendarLoading(false);
  }, []);

  const fetchDateSlots = async (date) => {
    const dateStr = date.toISOString().split('T')[0];
    try {
      const res = await fetch(`${API}/appointments/available-slots/${dateStr}`);
      if (!res.ok) {
        console.error(`[fetchDateSlots] HTTP ${res.status} for ${dateStr}`);
        setErrorMessage(`Could not load time slots (server error ${res.status}). Please try again.`);
        return;
      }
      const data = await res.json();
      console.log('[fetchDateSlots] Response:', data);

      // Fallback: if no available_times, use defaults
      const rawTimes = data.available_times && data.available_times.length > 0
        ? data.available_times
        : ['08:00', '13:00'];

      const labels = rawTimes.map(to12h);
      setTimeSlots(labels);

      // Build slot status and capacity from slot_capacity (keyed by 24h time)
      const status = {};
      const capacity = {};
      labels.forEach(label => {
        const key24 = to24h(label);
        const cap = data.slot_capacity?.[key24] || { booked: 0, total: data.total_technicians || 0, remaining: data.total_technicians || 0 };
        status[label] = cap.remaining > 0 ? 'available' : 'booked';
        capacity[label] = cap;
      });
      setSlotStatus(status);
      setSlotCapacity(capacity);
    } catch (err) {
      console.error('[AppointmentPage] fetchDateSlots error:', err);
      setErrorMessage('Could not connect to server. Please make sure the backend is running.');
    }
  };

  // ── On mount: validate cart + check for existing appointment ──────────────
  useEffect(() => {
    validateCart();
    checkExistingAppointment();
  }, []);

  // ── When month changes, fetch availability for that month ─────────────────
  useEffect(() => {
    fetchMonthAvailability(currentMonth);
  }, [currentMonth, fetchMonthAvailability]);

  // ── When date changes, fetch time slots for that date ─────────────────────
  useEffect(() => {
    if (selectedDate) {
      setSelectedTime(null);
      setSuccessMessage(null);
      setErrorMessage(null);
      fetchDateSlots(selectedDate);
    }
  }, [selectedDate]);

  // ── Redirect on invalid cart items ───────────────────────────────────────
  useEffect(() => {
    if (cartItems.length > 0) {
      const invalid = cartItems.filter(i => i.quantity > i.num_stocks);
      if (invalid.length > 0) navigate('/cart');
    }
  }, [cartItems, navigate]);

  const handleDateClick = (day) => {
    const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    setSelectedDate(selected);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setErrorMessage('Please select both a date and a time slot.');
      return;
    }
    if (cartError) {
      setErrorMessage('Please fix your cart before booking.');
      return;
    }
    // Block only if this exact date+time is already booked by the user
    const selectedDateStr = selectedDate.toISOString().split('T')[0];
    const selectedTime24 = to24h(selectedTime);
    const conflict = bookedSlots.find(s => s.date === selectedDateStr && s.time === selectedTime24);
    if (conflict) {
      setErrorMessage(
        `You already have an appointment on ${selectedDate.toDateString()} at ${selectedTime}. Please choose a different date or time.`
      );
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          appointment_date: selectedDate.toISOString().split('T')[0],
          appointment_time: to24h(selectedTime),
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMessage(`Appointment selected. Please proceed to checkout.`);
        // Refresh slot status to reflect the new booking
        fetchDateSlots(selectedDate);
        // Navigate to checkout after a short delay
        setTimeout(() => navigate('/checkout'), 1800);
      } else {
        setErrorMessage(data.message || 'Failed to book appointment. Please try again.');
        // If slot just got taken, refresh availability
        fetchDateSlots(selectedDate);
        fetchMonthAvailability(currentMonth);
      }
    } catch (err) {
      setErrorMessage('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────

  const selectedDateStr = selectedDate ? selectedDate.toISOString().split('T')[0] : null;
  const selectedTime24 = selectedTime ? to24h(selectedTime) : null;
  const hasConflict = !!(selectedDateStr && selectedTime24 &&
    bookedSlots.find(s => s.date === selectedDateStr && s.time === selectedTime24));

  const canSubmit =
    !cartError &&
    !loading &&
    !hasConflict &&
    selectedDate &&
    selectedTime &&
    slotStatus[selectedTime] === 'available';

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

          {/* Cart Error */}
          {cartError && (
            <div style={{
              background: '#f8d7da', border: '2px solid #721c24', borderRadius: 6,
              padding: 20, marginBottom: 20, color: '#721c24', textAlign: 'center'
            }}>
              <strong style={{ display: 'block', marginBottom: 8 }}>⚠ Cannot Proceed to Checkout</strong>
              <p style={{ whiteSpace: 'pre-line', margin: '10px 0' }}>{cartError}</p>
              <button
                style={{ marginTop: 10, padding: '10px 20px', background: '#721c24', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
                onClick={() => navigate('/cart')}
              >
                Go Back to Fix Cart
              </button>
            </div>
          )}

          {/* Booked slots info — only shown if user has upcoming appointments */}
          {bookedSlots.length > 0 && (
            <div style={{
              background: '#e8f4f8', border: '1px solid #b8d9ea', borderRadius: 6,
              padding: '10px 16px', marginBottom: 16, color: '#1a5276', fontSize: 13
            }}>
              <strong>ℹ Your booked time slots (unavailable):</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
                {bookedSlots.map((s, i) => (
                  <li key={i}>
                    {new Date(s.date + 'T00:00:00').toDateString()} at {to12h(s.time)}
                    {s.number ? ` (#${s.number})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Main booking UI — only show if cart is valid */}
          {!cartError && (
            <>
              <div className="appointment-content">
                <DatePicker
                  currentMonth={currentMonth}
                  selectedDate={selectedDate}
                  dateAvailability={dateAvailability}
                  calendarLoading={calendarLoading}
                  onDateClick={handleDateClick}
                  onPrevMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
                  onNextMonth={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
                />

                <TimeSlotGrid
                  timeSlots={timeSlots}
                  slotStatus={slotStatus}
                  slotCapacity={slotCapacity}
                  selectedTime={selectedTime}
                  onSelectTime={setSelectedTime}
                  dateSelected={!!selectedDate}
                  userBookedTimes={selectedDateStr
                    ? bookedSlots.filter(s => s.date === selectedDateStr).map(s => to12h(s.time))
                    : []}
                />
              </div>

              {/* Summary */}
              {selectedDate && selectedTime && !successMessage && (
                <div className="appointment-summary">
                  <p><strong>Selected Date:</strong> {selectedDate.toDateString()}</p>
                  <p><strong>Selected Time:</strong> {selectedTime}</p>
                </div>
              )}

              {/* Success message */}
              {successMessage && (
                <ConfirmationMessage date={selectedDate} time={selectedTime} />
              )}

              {/* Error message */}
              {errorMessage && (
                <div style={{
                  background: '#f8d7da', border: '1px solid #f5c6cb', borderRadius: 6,
                  padding: '12px 16px', marginBottom: 16, color: '#721c24', fontSize: 14
                }}>
                  ⚠ {errorMessage}
                </div>
              )}

              <button
                className="apply-btn"
                onClick={handleSubmit}
                disabled={!canSubmit}
                style={{
                  opacity: canSubmit ? 1 : 0.6,
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                }}
              >
                {loading ? 'Booking...' : 'Continue to Checkout'}
              </button>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

export default AppointmentPage;