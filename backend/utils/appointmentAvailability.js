const mysql = require("mysql2");

// Get config value from technician_config table
async function getConfigValue(db, key, defaultValue) {
  return new Promise((resolve) => {
    db.query(
      "SELECT setting_value FROM technician_config WHERE setting_key = ?",
      [key],
      (err, results) => {
        if (err || !results || results.length === 0) {
          resolve(defaultValue);
        } else {
          resolve(results[0].setting_value);
        }
      }
    );
  });
}

// Get available time slots
async function getAvailableTimeSlots(db) {
  const slotsStr = await getConfigValue(db, 'available_time_slots', '08:00,13:00');
  return slotsStr.split(',').map(s => s.trim());
}

// Get max appointments per day
async function getMaxAppointmentsPerDay(db) {
  const max = await getConfigValue(db, 'max_appointments_per_day', '2');
  return parseInt(max);
}

// Check if a specific slot is available for a technician
async function isSlotAvailable(db, technicianId, date, time) {
  return new Promise((resolve) => {
    if (!technicianId) {
      // No specific technician, check if any slot is available
      resolve(true);
      return;
    }

    // Check if the slot is marked as unavailable
    db.query(
      `SELECT is_available FROM appointment_slots 
       WHERE technician_id = ? AND appointment_date = ? AND appointment_time = ?`,
      [technicianId, date, time],
      (err, results) => {
        if (err || !results || results.length === 0) {
          // Slot doesn't exist yet, so it should be available
          resolve(true);
        } else {
          resolve(results[0].is_available === 1);
        }
      }
    );
  });
}

// Count existing appointments for a technician on a date
async function countAppointmentsOnDate(db, technicianId, date) {
  return new Promise((resolve) => {
    const query = `
      SELECT COUNT(*) as count FROM appointments 
      WHERE assigned_employee_id = ? AND appointment_date = ?
    `;
    db.query(query, [technicianId, date], (err, results) => {
      if (err || !results) {
        resolve(0);
      } else {
        resolve(results[0].count || 0);
      }
    });
  });
}

// Get available technicians for a specific date and time
async function getAvailableTechnicians(db, date, time) {
  return new Promise((resolve) => {
    // Get all employees
    db.query(
      `SELECT id, fname, lname FROM user_signup WHERE role = 'employee' ORDER BY fname ASC`,
      async (err, employees) => {
        if (err || !employees) {
          resolve([]);
          return;
        }

        const maxAppointments = await getMaxAppointmentsPerDay(db);
        const availableTechs = [];

        for (const tech of employees) {
          const slotAvailable = await isSlotAvailable(db, tech.id, date, time);
          const appointmentCount = await countAppointmentsOnDate(db, tech.id, date);

          if (slotAvailable && appointmentCount < maxAppointments) {
            availableTechs.push({
              id: tech.id,
              name: `${tech.fname} ${tech.lname}`,
              fname: tech.fname,
              lname: tech.lname,
              appointments_today: appointmentCount,
              slots_remaining: maxAppointments - appointmentCount
            });
          }
        }

        resolve(availableTechs);
      }
    );
  });
}

// Get available slots for all technicians on a date
async function getAvailableSlotsForDate(db, date) {
  return new Promise((resolve) => {
    db.query(
      `SELECT id, fname, lname FROM user_signup WHERE role = 'employee' ORDER BY fname ASC`,
      async (err, employees) => {
        if (err || !employees) {
          resolve({});
          return;
        }

        const slots = await getAvailableTimeSlots(db);
        const maxAppointments = await getMaxAppointmentsPerDay(db);
        const result = {};

        for (const tech of employees) {
          result[tech.id] = {
            name: `${tech.fname} ${tech.lname}`,
            slots: {}
          };

          for (const slot of slots) {
            const slotAvailable = await isSlotAvailable(db, tech.id, date, slot);
            const appointmentCount = await countAppointmentsOnDate(db, tech.id, date);
            const isFull = appointmentCount >= maxAppointments;

            result[tech.id].slots[slot] = {
              is_available: slotAvailable && !isFull,
              booked: appointmentCount,
              max: maxAppointments,
              slots_remaining: Math.max(0, maxAppointments - appointmentCount)
            };
          }
        }

        resolve(result);
      }
    );
  });
}

// Mark a slot as unavailable
async function markSlotAsUnavailable(db, technicianId, date, time) {
  return new Promise((resolve, reject) => {
    // Try to insert first, if exists it will fail and we update
    db.query(
      `INSERT INTO appointment_slots (technician_id, appointment_date, appointment_time, is_available) 
       VALUES (?, ?, ?, 0)
       ON DUPLICATE KEY UPDATE is_available = 0`,
      [technicianId, date, time],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

// Mark a slot as available
async function markSlotAsAvailable(db, technicianId, date, time) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO appointment_slots (technician_id, appointment_date, appointment_time, is_available) 
       VALUES (?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE is_available = 1`,
      [technicianId, date, time],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

// Find next available date for a technician
async function findNextAvailableDate(db, technicianId, startDate, slots) {
  return new Promise((resolve) => {
    let currentDate = new Date(startDate);
    let found = false;
    let maxIterations = 90; // Search up to 90 days ahead
    let iteration = 0;

    const checkNextDate = async () => {
      if (found || iteration >= maxIterations) {
        resolve(found ? currentDate : null);
        return;
      }

      iteration++;
      const dateStr = currentDate.toISOString().split('T')[0];

      // Check if any slot is available
      let hasAvailableSlot = false;
      for (const slot of slots) {
        const available = await isSlotAvailable(db, technicianId, dateStr, slot);
        const count = await countAppointmentsOnDate(db, technicianId, dateStr);
        const maxAppointments = await getMaxAppointmentsPerDay(db);

        if (available && count < maxAppointments) {
          hasAvailableSlot = true;
          break;
        }
      }

      if (hasAvailableSlot) {
        found = true;
        resolve(currentDate);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
        checkNextDate();
      }
    };

    checkNextDate();
  });
}

// Check if a date is fully booked for all technicians
async function isDateFullyBooked(db, date) {
  return new Promise((resolve) => {
    db.query(
      `SELECT id FROM user_signup WHERE role = 'employee'`,
      async (err, employees) => {
        if (err || !employees || employees.length === 0) {
          resolve(false);
          return;
        }

        const slots = await getAvailableTimeSlots(db);
        const maxAppointments = await getMaxAppointmentsPerDay(db);

        for (const tech of employees) {
          for (const slot of slots) {
            const slotAvailable = await isSlotAvailable(db, tech.id, date, slot);
            const count = await countAppointmentsOnDate(db, tech.id, date);

            if (slotAvailable && count < maxAppointments) {
              // Found an available slot
              resolve(false);
              return;
            }
          }
        }

        // No available slots found
        resolve(true);
      }
    );
  });
}

module.exports = {
  getConfigValue,
  getAvailableTimeSlots,
  getMaxAppointmentsPerDay,
  isSlotAvailable,
  countAppointmentsOnDate,
  getAvailableTechnicians,
  getAvailableSlotsForDate,
  markSlotAsUnavailable,
  markSlotAsAvailable,
  findNextAvailableDate,
  isDateFullyBooked
};
