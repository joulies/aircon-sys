const express = require("express");
const router = express.Router();

let users = [];

// SIGNUP
router.post("/signup", (req, res) => {
  const { fname, lname, email, contact, password } = req.body;

  const exists = users.find(u => u.email === email);
  if (exists) {
    return res.status(400).json({ message: "User already exists" });
  }

  const newUser = {
    id: users.length + 1,
    fname,
    lname,
    email,
    contact,
    password
  };

  users.push(newUser);

  res.json({
    success: true,
    message: "Signup successful",
    user: newUser
  });
});

module.exports = router;