require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth');
const homesRoutes = require('./routes/homes');
const bookingsRoutes = require('./routes/bookings');
const paymentsRoutes = require('./routes/payments');

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ['https://flatio-liart.vercel.app/', 'https://flatio-liart.vercel.app/'], credentials: true }));
app.use(express.json());ht

app.use('/api/auth', authRoutes);
app.use('/api/homes', homesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Home Rental API is running' });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
