import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api, API_BASE, getToken } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Chat() {
  const { interestId } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [connected, setConnected] = useState(false);
  const wsRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get(`/api/chat/${interestId}/messages`).then(({ messages }) => setMessages(messages));

    const wsUrl = API_BASE.replace(/^http/, 'ws') + `/ws?token=${getToken()}&interestId=${interestId}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === 'message') setMessages((prev) => [...prev, data.message]);
    };

    return () => ws.close();
  }, [interestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = () => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== 1) return;
    wsRef.current.send(JSON.stringify({ type: 'message', content: input }));
    setInput('');
  };

  return (
    <div className="chat-page">
      <h2>Chat {connected ? '🟢' : '🔴'}</h2>
      <div className="messages">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.senderId === user.id ? 'mine' : 'theirs'}`}>
            <strong>{m.senderName || m.sender?.name}</strong>: {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input">
        <input value={input} onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message..." />
        <button onClick={send}>Send</button>
      </div>
    </div>
  );
}