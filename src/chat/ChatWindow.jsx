import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';

export default function ChatWindow({ matchId }) {
  const { user } = useAuth();
  const [msgs, setMsgs] = useState([]);
  const [text, setText] = useState('');
  const bottomRef = useRef(null);

  async function load() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });
    setMsgs(data ?? []);
  }

  useEffect(() => {
    if (!matchId) return;
    load();
    const channel = supabase
      .channel(`msg:${matchId}`)
      .on('postgres_changes',
          { event:'INSERT', schema:'public', table:'messages', filter:`match_id=eq.${matchId}` },
          payload => setMsgs(prev => [...prev, payload.new]))
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [matchId]);

  useEffect(()=>{ bottomRef.current?.scrollIntoView({behavior:'smooth'}); }, [msgs]);

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await supabase.from('messages').insert({
      match_id: matchId, sender_id: user.id, content: text.trim()
    });
    setText('');
  };

  return (
    <div style={{border:'1px solid #333', borderRadius:8, padding:12, height:360, display:'flex', flexDirection:'column'}}>
      <div style={{flex:1, overflow:'auto', display:'grid', gap:6}}>
        {msgs.map(m=>(
          <div key={m.id} style={{alignSelf: m.sender_id===user.id?'end':'start', background:'#1f2937', padding:'6px 10px', borderRadius:8}}>
            <div style={{opacity:.6, fontSize:12}}>{m.sender_id===user.id ? 'Moi' : m.sender_id.slice(0,8)+'…'}</div>
            {m.content}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={send} style={{display:'flex', gap:8, marginTop:8}}>
        <input value={text} onChange={e=>setText(e.target.value)} placeholder="Votre message…" style={{flex:1}} />
        <button type="submit">Envoyer</button>
      </form>
    </div>
  );
}
