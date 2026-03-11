require('dotenv').config();
const mongoose = require('mongoose');
const Home = require('../models/Home');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/home-rental';

const sampleHomes = [
  {
    title: 'Cozy Beachfront Villa',
    description: 'Wake up to stunning ocean views in this beautiful beachfront villa. Perfect for families or couples looking for a relaxing getaway. Features a private balcony, fully equipped kitchen, and direct beach access.',
    location: 'Miami Beach, Florida',
    pricePerNight: 285,
    images: [
      'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Beach Access', 'Pool', 'Parking', 'Kitchen', 'Ocean View', 'Washer/Dryer'],
  },
  {
    title: 'Mountain View Cabin',
    description: 'Escape to the mountains in this rustic yet modern cabin. Surrounded by pine trees with breathtaking mountain views. Great for hiking enthusiasts and nature lovers.',
    location: 'Asheville, North Carolina',
    pricePerNight: 195,
    images: [
      'https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800',
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ],
    amenities: ['WiFi', 'Fireplace', 'Mountain View', 'Parking', 'Kitchen', 'Hot Tub', 'Pets Allowed', 'Hiking Trails'],
  },
  {
    title: 'Downtown Loft Apartment',
    description: 'Stylish loft in the heart of the city. Walking distance to restaurants, museums, and nightlife. Modern decor with high ceilings and industrial charm.',
    location: 'New York, New York',
    pricePerNight: 320,
    images: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=800',
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Central Location', 'Elevator', 'Kitchen', 'Gym', 'Doorman', 'Rooftop Access'],
  },
  {
    title: 'Lake House Retreat',
    description: 'Peaceful lake house with private dock. Perfect for fishing, kayaking, or simply relaxing by the water. Includes paddle boards and kayaks for guests.',
    location: 'Lake Tahoe, California',
    pricePerNight: 350,
    images: [
      'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?w=800',
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    ],
    amenities: ['WiFi', 'Lake Access', 'Private Dock', 'Kayaks', 'Fire Pit', 'Kitchen', 'Hot Tub', 'Parking', 'Washer/Dryer'],
  },
  {
    title: 'Desert Oasis',
    description: 'Unique adobe-style home in the desert with stunning sunset views. Features a private pool and outdoor living space. Close to Joshua Tree National Park.',
    location: 'Palm Springs, California',
    pricePerNight: 275,
    images: [
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800',
      'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800',
    ],
    amenities: ['WiFi', 'Pool', 'Air Conditioning', 'Parking', 'Kitchen', 'Desert View', 'Outdoor Shower', 'Fire Pit'],
  },
  {
    title: 'Historic French Quarter Condo',
    description: 'Charming condo in a historic building steps from Bourbon Street. Exposed brick, high ceilings, and authentic New Orleans character. Perfect for experiencing the city.',
    location: 'New Orleans, Louisiana',
    pricePerNight: 225,
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800',
    ],
    amenities: ['WiFi', 'Air Conditioning', 'Historic Building', 'Central Location', 'Kitchen', 'Balcony', 'Walk to French Quarter'],
  },
  {
    title: 'Luxury Ski Chalet',
    description: 'Stunning chalet with ski-in/ski-out access. Premium finishes, sauna, and mountain views. Perfect for a winter vacation with family or friends.',
    location: 'Aspen, Colorado',
    pricePerNight: 550,
    images: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1605540436563-5bca919ae766?w=800',
      'https://images.unsplash.com/photo-1596178060812-7a2c0e48f2e2?w=800',
    ],
    amenities: ['WiFi', 'Ski-in/Ski-out', 'Hot Tub', 'Fireplace', 'Sauna', 'Parking', 'Kitchen', 'Mountain View', 'Washer/Dryer'],
  },
  {
    title: 'Seaside Cottage',
    description: 'Quaint cottage just steps from the beach. White sand beaches, calm waters, and stunning sunrises. Ideal for a quiet romantic getaway.',
    location: 'Cape Cod, Massachusetts',
    pricePerNight: 210,
    images: [
      'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800',
      'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800',
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800',
    ],
    amenities: ['WiFi', 'Beach Access', 'Kitchen', 'Parking', 'Outdoor Shower', 'Fire Pit', 'Bike Rental Nearby', 'Washer/Dryer'],
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    await Home.deleteMany({});
    await Home.insertMany(sampleHomes);

    console.log(`Seeded ${sampleHomes.length} homes successfully`);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seed();
