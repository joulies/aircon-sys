const mysql = require("mysql2");

// ─── Config helpers ───────────────────────────────────────────────────────────

async function getConfigValue(db, key, defaultValue) {
  return new Promise((resolve) => {
    db.query(
      "SELECT setting_value FROM technician_config WHERE setting_key = ?",
      [key],
      (err, results) => {
        if (err || !results || results.length === 0) resolve(defaultValue);
        else resolve(results[0].setting_value);
      }
    );
  });
}

async function getAvailableTimeSlots(db) {
  const slotsStr = await getConfigValue(db, "available_time_slots", "08:00,13:00");
  return slotsStr.split(",").map((s) => s.trim());
}

// Kept for backward compat but no longer drives capacity — technician count does
async function getMaxAppointmentsPerDay(db) {
  const max = await getConfigValue(db, "max_appointments_per_day", "2");
  return parseInt(max);
}

// ─── Core capacity helpers ────────────────────────────────────────────────────

// Total technicians in the system
function getTotalTechnicians(db) {
  return new Promise((resolve) => {
    db.query(
      "SELECT COUNT(*) as cnt FROM user_signup WHERE role = 'employee'",
      (err, rows) => resolve(err ? 0 : rows[0].cnt || 0)
    );
  });
}

// Number of appointments already booked at a specific date+time (= technicians consumed)
function getBookingsAtSlot(db, date, time) {
  return new Promise((resolve) => {
    db.query(
      `SELECT COUNT(*) as cnt FROM appointments
       WHERE appointment_date = ? AND appointment_time = ?`,
      [date, time],
      (err, rows) => resolve(err ? 0 : rows[0].cnt || 0)
    );
  });
}

// Remaining capacity for a slot = total techs − bookings at that slot
async function getSlotCapacity(db, date, time) {
  const [total, booked] = await Promise.all([
    getTotalTechnicians(db),
    getBookingsAtSlot(db, date, time),
  ]);
  return { total, booked, remaining: Math.max(0, total - booked) };
}

// ─── Slot availability (used internally + by booking route) ──────────────────

// A slot is available if remaining capacity > 0
async function isSlotAvailableForDate(db, date, time) {
  const { remaining } = await getSlotCapacity(db, date, time);
  return remaining > 0;
}

// Legacy signature kept — technicianId ignored, slot-level capacity is what matters
async function isSlotAvailable(db, technicianId, date, time) {
  return isSlotAvailableForDate(db, date, time);
}

// ─── Date-level helpers ───────────────────────────────────────────────────────

// A date is fully booked when ALL time slots have 0 remaining capacity
async function isDateFullyBooked(db, date) {
  const slots = await getAvailableTimeSlots(db);
  for (const slot of slots) {
    const available = await isSlotAvailableForDate(db, date, slot);
    if (available) return false;
  }
  return true;
}

// Returns time slots that are fully booked (0 capacity left) — shown as ✗ in UI
async function getBookedTimesForDate(db, date) {
  const slots = await getAvailableTimeSlots(db);
  const booked = [];
  for (const slot of slots) {
    const available = await isSlotAvailableForDate(db, date, slot);
    if (!available) booked.push(slot);
  }
  return booked;
}

// ─── Slot info for the available-slots route ──────────────────────────────────

// Returns per-slot availability info for a date
// Shape: { "08:00": { is_available, booked, total, remaining }, ... }
async function getAvailableSlotsForDate(db, date) {
  const slots = await getAvailableTimeSlots(db);
  const total = await getTotalTechnicians(db);
  const result = {};

  for (const slot of slots) {
    const booked = await getBookingsAtSlot(db, date, slot);
    const remaining = Math.max(0, total - booked);
    result[slot] = {
      is_available: remaining > 0,
      booked,
      total,
      remaining,
    };
  }

  // Wrap in a single "pool" key so the existing route shape still works
  // (frontend reads data.slots and data.total_available_slots)
  return { pool: { name: "Technician Pool", slots: result } };
}

// ─── Technician helpers (used by assign route) ────────────────────────────────

async function getAvailableTechnicians(db, date, time) {
  return new Promise((resolve) => {
    db.query(
      `SELECT id, fname, lname FROM user_signup WHERE role = 'employee' ORDER BY fname ASC`,
      async (err, employees) => {
        if (err || !employees) { resolve([]); return; }

        // A technician is available if they haven't been assigned an appointment at this slot
        const available = [];
        for (const tech of employees) {
          const alreadyAssigned = await new Promise((res) => {
            db.query(
              `SELECT COUNT(*) as cnt FROM appointments
               WHERE assigned_employee_id = ? AND appointment_date = ? AND appointment_time = ?`,
              [tech.id, date, time],
              (err, rows) => res(err ? 1 : rows[0].cnt || 0)
            );
          });
          if (!alreadyAssigned) {
            available.push({ id: tech.id, name: `${tech.fname} ${tech.lname}`, fname: tech.fname, lname: tech.lname });
          }
        }
        resolve(available);
      }
    );
  });
}

// Count appointments assigned to a technician on a date (for admin schedule view)
function countAppointmentsOnDate(db, technicianId, date) {
  return new Promise((resolve) => {
    db.query(
      `SELECT COUNT(*) as count FROM appointments
       WHERE assigned_employee_id = ? AND appointment_date = ?`,
      [technicianId, date],
      (err, results) => resolve(err || !results ? 0 : results[0].count || 0)
    );
  });
}

// ─── Mark slot helpers (kept for backward compat, no-ops under new model) ─────
// Under the new model capacity is derived from the appointments table directly,
// so these are no longer needed for availability — but kept so existing call
// sites in server.js don't break.

async function markSlotAsUnavailable(db, technicianId, date, time) {
  // no-op — capacity is now computed from appointment count vs technician count
  return Promise.resolve();
}

async function markSlotAsAvailable(db, technicianId, date, time) {
  // no-op
  return Promise.resolve();
}

// ─── Next available date ──────────────────────────────────────────────────────

async function findNextAvailableDate(db, technicianId, startDate, slots) {
  let currentDate = new Date(startDate);
  for (let i = 0; i < 90; i++) {
    currentDate.setDate(currentDate.getDate() + 1);
    const dateStr = currentDate.toISOString().split("T")[0];
    const fullyBooked = await isDateFullyBooked(db, dateStr);
    if (!fullyBooked) return currentDate;
  }
  return null;
}

// ─── isTimeSlotBooked (used by booking route to block double-user booking) ────
// A user cannot book a slot that already has a booking — each user gets their
// own technician. This just checks if the slot has any capacity left.
async function isTimeSlotBooked(db, date, time) {
  const available = await isSlotAvailableForDate(db, date, time);
  return !available;
}

// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getConfigValue,
  getAvailableTimeSlots,
  getMaxAppointmentsPerDay,
  getTotalTechnicians,
  getBookingsAtSlot,
  getSlotCapacity,
  isSlotAvailable,
  isSlotAvailableForDate,
  countAppointmentsOnDate,
  getAvailableTechnicians,
  getAvailableSlotsForDate,
  markSlotAsUnavailable,
  markSlotAsAvailable,
  findNextAvailableDate,
  isDateFullyBooked,
  isTimeSlotBooked,
  getBookedTimesForDate,
};