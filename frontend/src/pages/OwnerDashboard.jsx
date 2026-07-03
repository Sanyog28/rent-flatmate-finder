import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, API_BASE } from '../api/client';

export default function OwnerDashboard() {
  const [listings, setListings] = useState([]);

  const load = async () => {
    const { listings } = await api.get('/api/listings/mine');
    setListings(listings);
  };
  useEffect(() => { load(); }, []);

  const markFilled = async (id) => {
    await api.patch(`/api/listings/${id}/fill`, {});
    load();
  };
  const remove = async (id) => {
    if (!confirm('Delete this listing?')) return;
    await api.delete(`/api/listings/${id}`);
    load();
  };

  return (
    <div>
      <h2>My Listings</h2>
      <Link to="/owner/new"><button>+ Post New Listing</button></Link>
      <div className="grid">
        {listings.map((l) => (
          <div key={l.id} className="card">
            {l.photos?.[0] && <img className="card-img" src={`${API_BASE}${l.photos[0]}`} alt="" />}
            <div className="card-body">
              <h3>{l.title} {l.isFilled && <span className="tag">FILLED</span>}</h3>
              <p>{l.location} · ₹{l.rent}</p>
              {!l.isFilled && <button onClick={() => markFilled(l.id)}>Mark as Filled</button>}
              <button onClick={() => remove(l.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}