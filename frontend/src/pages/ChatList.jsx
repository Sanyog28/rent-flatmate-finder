import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function ChatList() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    api.get('/api/chat/conversations').then(({ conversations }) => setConversations(conversations));
  }, []);

  return (
    <div>
      <h2>My Conversations</h2>
      <ul>
        {conversations.map((c) => (
          <li key={c.id}>
            <Link to={`/chat/${c.id}`}>
              {c.listing?.title} — {user.role === 'tenant' ? c.listing?.owner?.name : c.tenant?.name}
            </Link>
          </li>
        ))}
        {conversations.length === 0 && <p>No active conversations yet. Accepted interests will appear here.</p>}
      </ul>
    </div>
  );
}