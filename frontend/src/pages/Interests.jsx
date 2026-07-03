import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function Interests() {
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    api.get('/api/interests/sent').then(({ interests }) => setInterests(interests));
  }, []);

  return (
    <div>
      <h2>My Interest Requests</h2>
      <table className="table">
        <thead><tr><th>Listing</th><th>Owner</th><th>Score</th><th>Status</th><th>Chat</th></tr></thead>
        <tbody>
          {interests.map((i) => (
            <tr key={i.id}>
              <td><Link to={`/listings/${i.listing.id}`}>{i.listing.title}</Link></td>
              <td>{i.listing.owner?.name}</td>
              <td>{i.compatibilityScore?.score ?? '-'}</td>
              <td>{i.status}</td>
              <td>{i.status === 'accepted' && <Link to={`/chat/${i.id}`}>Open Chat</Link>}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}