# Home Rental Booking Web Application

A full-stack home rental booking platform built with React, Node.js, Express, and MongoDB.

## Features

- **User Authentication** – Register, log in, and log out with secure password hashing and JWT tokens
- **Home Listings** – Browse available homes with title, description, location, price, images, and amenities
- **Filtering & Search** – Filter by location, price range, and search by keywords
- **Property Details** – View full descriptions, images, amenities, and availability
- **Booking System** – Book properties with date selection, availability checks, and double-booking prevention

## Tech Stack

- **Frontend:** React, React Router, Tailwind CSS, Vite
- **Backend:** Node.js, Express
- **Database:** MongoDB with Mongoose

## Prerequisites

- Node.js 18+
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- npm or yarn

## Setup Instructions

### 1. Clone and install dependencies

```bash
# Backend
cd backend
npm install

# Frontend (from project root)
cd frontend
npm install
```

### 2. Configure environment variables

Create a `.env` file in the `backend` folder:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your settings:

```
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/home-rental
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

For MongoDB Atlas, use your connection string:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/home-rental
```

### 3. Seed the database

```bash
cd backend
npm run seed
```

This adds 8 sample homes with images and amenities.

### 4. Start the application

**Terminal 1 – Backend:**

```bash
cd backend
npm start
```

The API runs at `http://localhost:5000`.

**Terminal 2 – Frontend:**

```bash
cd frontend
npm run dev
```

The app runs at `http://localhost:5173`.

## API Endpoints

### Authentication

| Method | Endpoint      | Description   |
|--------|---------------|---------------|
| POST   | /api/auth/register | Register user |
| POST   | /api/auth/login    | Log in        |

### Homes

| Method | Endpoint                    | Description                    |
|--------|-----------------------------|--------------------------------|
| GET    | /api/homes                  | List homes (filter, search)    |
| GET    | /api/homes/locations        | Get distinct locations         |
| GET    | /api/homes/:id              | Get home by ID                 |
| GET    | /api/homes/:id/available    | Get booked dates for home      |

Query params for `GET /api/homes`: `location`, `minPrice`, `maxPrice`, `search`, `page`, `limit`

### Bookings (requires auth)

| Method | Endpoint        | Description          |
|--------|-----------------|----------------------|
| GET    | /api/bookings   | Get user's bookings  |
| POST   | /api/bookings   | Create booking       |

## Project Structure

```
├── backend/
│   ├── config/         # Database config
│   ├── middleware/     # Auth, validation
│   ├── models/         # User, Home, Booking
│   ├── routes/         # API routes
│   ├── scripts/        # Seed script
│   └── index.js
├── frontend/
│   └── src/
│       ├── api/        # API client
│       ├── components/
│       ├── context/    # Auth context
│       ├── pages/
│       └── main.jsx
└── README.md
```

## Usage

1. Open `http://localhost:5173`
2. Browse homes and use filters (location, price, search)
3. Click a home to view details
4. Register or log in to make a booking
5. Select check-in and check-out dates
6. Click "Reserve" to confirm
7. View your bookings under "My Bookings"

## License

MIT
