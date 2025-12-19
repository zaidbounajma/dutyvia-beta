import { useEffect, useRef, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function ChatBox({ match }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const scrollerRef = useRef(null);

  // charger messages
  useEffect(() => {
    let ignore = false;

    const load = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', match.id)
        .order('created_at', { ascending: true });
      if (!ignore && !error) setMessages(data ?? []);
    };
    load();

    // realtime
    const channel = supabase
      .channel(`msg:${match.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `match_id=eq.${match.id}` },
        (payload) => setMessages((prev) => (payload.eventType === 'INSERT' ? [...prev, payload.new] : prev))
      )
      .subscribe();

    return () => { ignore = true; supabase.removeChannel(channel); };
  }, [match.id]);

  useEffect(() => {
    scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('messages').insert({ match_id: match.id, sender_id: user.id, content: text.trim() });
    setText('');
  };

  return (
    <div className="card" style={{ display:'grid', gap: 12 }}>
      <div className="muted">Chat pour la demande #{match.request_id}</div>
      <div ref={scrollerRef} style={{ height: 260, overflow:'auto', border:'1px solid color-mix(in oklab, Canvas 70%, black 8%)', borderRadius:10, padding:10 }}>
        {messages.map(m => (
          <div key={m.id} style={{ margin: '8px 0' }}>
            <span className="pill">{m.sender_id?.slice(0,8)}</span>{' '}
            <span>{m.content}</span>
          </div>
        ))}
        {!messages.length && <div className="muted">Aucun message.</div>}
      </div>
      <form onSubmit={send} className="row" style={{ alignItems:'center' }}>
        <div className="col"><input value={text} onChange={e=>setText(e.target.value)} placeholder="Écrire un message…" /></div>
        <button className="btn" style={{ width:130 }}>Envoyer</button>
      </form>
    </div>
  );
}
