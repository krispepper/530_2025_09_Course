const express = require('express');
const router = express.Router();
const User = require('../models/User');

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Check if all fields are provided
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide email, password, and role' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = new User({
      email,
      password,
      role
    });

    await user.save();

    res.status(201).json({ 
      message: 'User registered successfully',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Register Error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if all fields are provided
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Create session
    req.session.userId = user._id;
    req.session.userRole = user.role;
    req.session.userEmail = user.email;

    res.json({ 
      message: 'Login successful',
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logout successful' });
  });
});

// @route   GET /api/auth/me
router.get('/me', (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  res.json({
    user: {
      id: req.session.userId,
      email: req.session.userEmail,
      role: req.session.userRole
    }
  });
});

module.exports = router;