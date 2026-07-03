import { useEffect, useState } from 'react';
import { api } from '../api/client';
import ListingCard from '../components/ListingCard';

export default function Browse() {
  const [listings, setListings] = useState([]);
  const [filters, setFilters] = useState({ location: '', minBudget: '', maxBudget: '' });
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.location) params.set('location', filters.location);
    if (filters.minBudget) params.set('minBudget', filters.minBudget);
    if (filters.maxBudget) params.set('maxBudget', filters.maxBudget);
    try {
      const { listings } = await api.get(`/api/listings/browse?${params}`);
      setListings(listings);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <h2>Browse Listings</h2>
      <div className="filters">
        <input placeholder="Location" value={filters.location}
          onChange={(e) => setFilters({ ...filters, location: e.target.value })} />
        <input placeholder="Min budget" type="number" value={filters.minBudget}
          onChange={(e) => setFilters({ ...filters, minBudget: e.target.value })} />
        <input placeholder="Max budget" type="number" value={filters.maxBudget}
          onChange={(e) => setFilters({ ...filters, maxBudget: e.target.value })} />
        <button onClick={load}>Search</button>
      </div>
      {loading && <p>Loading...</p>}
      <div className="grid">
        {listings.map((l) => <ListingCard key={l.id} listing={l} />)}
      </div>
      {!loading && listings.length === 0 && (
        <p>No listings found. Try adjusting filters or complete your profile for better matches.</p>
      )}
    </div>
  );
}