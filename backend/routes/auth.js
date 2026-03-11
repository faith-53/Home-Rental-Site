const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const fs = require('fs');
const User = require('../models/User');
const validate = require('../middleware/validate');

const router = express.Router();
const DEBUG_LOG_PATH = 'c:\\Users\\user\\Desktop\\Home Rental Site\\.cursor\\debug.log';

const generateToken = (id) => {
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Disable caching for all auth routes
router.use((req, res, next) => {
  res.set({
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store'
  });
  next();
});

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name cannot exceed 100 characters'),
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  async (req, res) => {
    try {
      // Check if user already exists first
      const { name, email, password } = req.body;
      
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Create new user
      const user = await User.create({ 
        name, 
        email: email.toLowerCase(), 
        password 
      });

      // Generate token
      const token = generateToken(user._id);

      // Send response
      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        token: token
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').trim().notEmpty().withMessage('Email is required').isEmail().withMessage('Please enter a valid email'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate token
      const token = generateToken(user._id);

      return res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || 'user',
        token: token
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;