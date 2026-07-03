import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, API_BASE } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ListingDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [listing, setListing] = useState(null);
  const [compatibility, setCompatibility] = useState(null);
  const [message, setMessage] = useState('');

  const load = async () => {
    const data = await api.get(`/api/listings/${id}`);
    setListing(data.listing);
    setCompatibility(data.compatibility);
  };

  useEffect(() => { load(); }, [id]);

  const expressInterest = async () => {
    setMessage('');
    try {
      const res = await api.post('/api/interests', { listingId: Number(id) });
      setMessage(`Interest sent! Compatibility score: ${res.compatibility.score}/100`);
    } catch (err) { setMessage(err.message); }
  };

  const recompute = async () => {
    setMessage('');
    try {
      const res = await api.post(`/api/listings/${id}/recompute-score`);
      setCompatibility(res.compatibility);
      setMessage('Score recomputed.');
    } catch (err) { setMessage(err.message); }
  };

  if (!listing) return <p>Loading...</p>;

  return (
    <div className="listing-detail">
      <h2>{listing.title}</h2>
      <div className="photos">
        {(listing.photos || []).map((p, i) => <img key={i} src={`${API_BASE}${p}`} alt="" />)}
      </div>
      <p><strong>Location:</strong> {listing.location}</p>
      <p><strong>Rent:</strong> ₹{listing.rent}/month</p>
      <p><strong>Available from:</strong> {listing.availableFrom}</p>
      <p><strong>Type:</strong> {listing.roomType} · {listing.furnishingStatus}</p>
      <p>{listing.description}</p>
      <p><strong>Owner:</strong> {listing.owner?.name}</p>

      {compatibility && (
        <div className="score-box">
          <h4>Compatibility Score: {compatibility.score}/100 ({compatibility.method})</h4>
          <p>{compatibility.explanation}</p>
          {user?.role === 'tenant' && <button onClick={recompute}>Recompute Score</button>}
        </div>
      )}

      {user?.role === 'tenant' && !listing.isFilled && (
        <button onClick={expressInterest}>Express Interest</button>
      )}
      {listing.isFilled && <p className="filled">This listing has been filled.</p>}
      {message && <p className="info">{message}</p>}
    </div>
  );
}