import { Link } from 'react-router-dom';
import { API_BASE } from '../api/client';

function scoreClass(score) {
  if (score >= 80) return 'high';
  if (score >= 50) return 'mid';
  return 'low';
}

export default function ListingCard({ listing }) {
  const photo = listing.photos?.[0];
  return (
    <div className="card">
      {photo && <img src={`${API_BASE}${photo}`} alt={listing.title} className="card-img" />}
      <div className="card-body">
        <h3>{listing.title}</h3>
        <p>{listing.location}</p>
        <p>₹{listing.rent} / month · {listing.roomType} · {listing.furnishingStatus}</p>
        <p>Available from: {listing.availableFrom}</p>
        {listing.compatibility && (
          <div className={`score-badge score-${scoreClass(listing.compatibility.score)}`}>
            Compatibility: {listing.compatibility.score}/100
            <div className="explanation">{listing.compatibility.explanation}</div>
          </div>
        )}
        <Link to={`/listings/${listing.id}`}>View Details</Link>
      </div>
    </div>
  );
}