import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('listings');
  const [listings, setListings] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    pricePerNight: '',
    images: '',
    amenities: '',
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      return;
    }
    loadData();
  }, [user, navigate, activeTab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'listings') {
        const data = await api.get('/homes?limit=100');
        setListings(data.homes || []);
      } else {
        const data = await api.get('/bookings/admin/all');
        setBookings(data || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleListingSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const images = formData.images.split(',').map((url) => url.trim()).filter(Boolean);
      const amenities = formData.amenities.split(',').map((item) => item.trim()).filter(Boolean);
      const payload = {
        ...formData,
        pricePerNight: Number(formData.pricePerNight),
        images,
        amenities,
      };

      if (editingListing) {
        await api.put(`/homes/${editingListing._id}`, payload);
      } else {
        await api.post('/homes', payload);
      }
      setShowForm(false);
      setEditingListing(null);
      setFormData({ title: '', description: '', location: '', pricePerNight: '', images: '', amenities: '' });
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save listing');
    }
  };

  const handleDeleteListing = async (id) => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      await api.delete(`/homes/${id}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete listing');
    }
  };

  const handleEditListing = (listing) => {
    setEditingListing(listing);
    setFormData({
      title: listing.title,
      description: listing.description,
      location: listing.location,
      pricePerNight: listing.pricePerNight.toString(),
      images: listing.images?.join(', ') || '',
      amenities: listing.amenities?.join(', ') || '',
    });
    setShowForm(true);
  };

  const handleBookingUpdate = async (bookingId, updates) => {
    try {
      await api.put(`/bookings/admin/${bookingId}`, updates);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to update booking');
    }
  };

  const handleDeleteBooking = async (id) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;
    try {
      await api.delete(`/bookings/admin/${id}`);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to delete booking');
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  if (!user || user.role !== 'admin') return null;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">Admin Dashboard</h1>
        <p className="mt-1 text-stone-600">Manage listings and bookings</p>
      </div>

      <div className="mb-6 border-b border-stone-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('listings')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'listings'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            Listings
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium ${
              activeTab === 'bookings'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-stone-500 hover:border-stone-300 hover:text-stone-700'
            }`}
          >
            Bookings
          </button>
        </nav>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {activeTab === 'listings' && (
        <div>
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-stone-900">All Listings</h2>
            <button
              onClick={() => {
                setShowForm(true);
                setEditingListing(null);
                setFormData({ title: '', description: '', location: '', pricePerNight: '', images: '', amenities: '' });
              }}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
            >
              Add New Listing
            </button>
          </div>

          {showForm && (
            <div className="mb-6 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-lg font-semibold text-stone-900">
                {editingListing ? 'Edit Listing' : 'Create New Listing'}
              </h3>
              <form onSubmit={handleListingSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-stone-700">Title</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Description</label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Location</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-stone-700">Price per Night ($)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.pricePerNight}
                      onChange={(e) => setFormData({ ...formData, pricePerNight: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Images (comma-separated URLs)</label>
                  <input
                    type="text"
                    value={formData.images}
                    onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                    placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700">Amenities (comma-separated)</label>
                  <input
                    type="text"
                    value={formData.amenities}
                    onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                    placeholder="WiFi, Pool, Parking, Kitchen"
                    className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white hover:bg-amber-600"
                  >
                    {editingListing ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingListing(null);
                      setFormData({ title: '', description: '', location: '', pricePerNight: '', images: '', amenities: '' });
                    }}
                    className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : listings.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center">
              <p className="text-lg text-stone-600">No listings found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => {
                const image = listing.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
                return (
                  <div
                    key={listing._id}
                    className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                  >
                    <div className="h-32 w-40 shrink-0 overflow-hidden bg-stone-100 sm:h-36 sm:w-48">
                      <img src={image} alt={listing.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h3 className="font-semibold text-stone-900">{listing.title}</h3>
                        <p className="text-sm text-stone-500">{listing.location}</p>
                        <p className="mt-1 text-sm text-stone-600">${listing.pricePerNight}/night</p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleEditListing(listing)}
                          className="rounded-lg border border-stone-300 px-3 py-1 text-sm font-medium text-stone-700 hover:bg-stone-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteListing(listing._id)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'bookings' && (
        <div>
          <h2 className="mb-4 text-xl font-semibold text-stone-900">All Bookings</h2>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 animate-pulse rounded-2xl bg-stone-200" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <div className="rounded-2xl border border-stone-200 bg-white py-16 text-center">
              <p className="text-lg text-stone-600">No bookings found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => {
                const home = booking.homeId;
                const user = booking.userId;
                const image = home?.images?.[0] || 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800';
                return (
                  <div
                    key={booking._id}
                    className="flex overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
                  >
                    <div className="h-32 w-40 shrink-0 overflow-hidden bg-stone-100 sm:h-36 sm:w-48">
                      <img src={image} alt={home?.title} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-4">
                      <div>
                        <h3 className="font-semibold text-stone-900">{home?.title || 'Home'}</h3>
                        <p className="text-sm text-stone-500">{home?.location}</p>
                        <p className="mt-1 text-sm text-stone-600">
                          Guest: {user?.name || 'Unknown'} ({user?.email || 'N/A'})
                        </p>
                        <p className="text-sm text-stone-600">
                          {formatDate(booking.checkInDate)} – {formatDate(booking.checkOutDate)}
                        </p>
                        <p className="text-sm font-medium text-stone-900">${booking.totalPrice} total</p>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button
                          onClick={() => handleDeleteBooking(booking._id)}
                          className="rounded-lg border border-red-300 px-3 py-1 text-sm font-medium text-red-700 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
