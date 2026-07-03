import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function OwnerInterests() {
  const [interests, setInterests] = useState([]);

  const load = async () => {
    const { interests } = await api.get('/api/interests/received');
    setInterests(interests);
  };
  useEffect(() => { load(); }, []);

  const respond = async (id, status) => {
    await api.patch(`/api/interests/${id}`, { status });
    load();
  };

  return (
    <div>
      <h2>Received Interest Requests</h2>
      <table className="table">
        <thead><tr><th>Listing</th><th>Tenant</th><th>Score</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {interests.map((i) => (
            <tr key={i.id}>
              <td>{i.listing?.title}</td>
              <td>{i.tenant?.name} ({i.tenant?.email})</td>
              <td>{i.compatibilityScore?.score ?? '-'}<br /><small>{i.compatibilityScore?.explanation}</small></td>
              <td>{i.status}</td>
              <td>
                {i.status === 'pending' && (
                  <>
                    <button onClick={() => respond(i.id, 'accepted')}>Accept</button>
                    <button onClick={() => respond(i.id, 'declined')}>Decline</button>
                  </>
                )}
                {i.status === 'accepted' && <Link to={`/chat/${i.id}`}>Open Chat</Link>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}