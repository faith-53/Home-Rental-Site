import { useState, useEffect } from 'react';
import { api } from '../api/client';
import HomeCard from '../components/HomeCard';
import FilterBar from '../components/FilterBar';

export default function HomePage() {
  const [homes, setHomes] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api.get('/homes/locations').then(setLocations).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: filters.page || 1 });
    if (filters.location) params.set('location', filters.location);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.search) params.set('search', filters.search);

    api
      .get(`/homes?${params}`)
      .then(({ homes: h, total: t, page: p, pages: ps }) => {
        setHomes(h);
        setTotal(t);
        setPage(p);
        setPages(ps);
      })
      .catch(() => setHomes([]))
      .finally(() => setLoading(false));
  }, [filters]);

  const handleFilter = (newFilters) => {
    setFilters({ ...newFilters, page: 1 });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-900">
          Find your perfect getaway
        </h1>
        <p className="mt-2 text-stone-600">
          Discover unique homes and experiences around the world.
        </p>
      </div>

      <div className="mb-8">
        <FilterBar locations={locations} onFilter={handleFilter} />
      </div>

      {loading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-2xl bg-stone-200"
            />
          ))}
        </div>
      ) : homes.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center shadow-sm">
          <p className="text-lg text-stone-600">No homes match your criteria.</p>
          <p className="mt-2 text-sm text-stone-500">
            Try adjusting your filters or search terms.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 text-sm text-stone-600">
            {total} {total === 1 ? 'home' : 'homes'} found
          </p>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {homes.map((home) => (
              <HomeCard key={home._id} home={home} />
            ))}
          </div>
          {pages > 1 && (
            <div className="mt-8 flex justify-center gap-2">
              <button
                onClick={() => setFilters((f) => ({ ...f, page: page - 1 }))}
                disabled={page <= 1}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="flex items-center px-4 text-sm text-stone-600">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setFilters((f) => ({ ...f, page: page + 1 }))}
                disabled={page >= pages}
                className="rounded-lg border border-stone-300 px-4 py-2 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
