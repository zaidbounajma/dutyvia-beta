import { useEffect, useState } from 'react';
import ChatBox from '../components/ChatBox';
import { supabase } from '../supabaseClient';

export default function MesChats() {
  const [matches, setMatches] = useState([]);
  const [active, setActive] = useState(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    // matches où je suis acheteur OU voyageur
    const { data, error } = await supabase
      .from('matches')
      .select(`
        id, request_id, status,
        requests!inner(id, product_name, requester_id)
      `)
      .or(`traveler_id.eq.${user.id},requests.requester_id.eq.${user.id}`)
      .order('id', { ascending:false });
    if (!error) {
      setMatches(data ?? []);
      if (!active && data?.length) setActive(data[0]);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="row" style={{ alignItems:'start' }}>
      <div className="col" style={{ maxWidth: 360 }}>
        <h3>Conversations</h3>
        <div className="list">
          {matches.map(m => (
            <div className="item" key={m.id} style={{ borderColor: active?.id===m.id?'#0d6efd':'' }}>
              <div style={{ display:'flex', justifyContent:'space-between', gap:10 }}>
                <h4>#{m.id} • Req {m.request_id}</h4>
                <span className="pill">{m.status}</span>
              </div>
              <div className="muted">{m.requests?.product_name}</div>
              <button className="btn" onClick={()=>setActive(m)}>Ouvrir le chat</button>
            </div>
          ))}
          {!matches.length && <div className="muted">Aucun match/conversation.</div>}
        </div>
      </div>

      <div className="col">
        <h3>Messagerie</h3>
        {!active ? <div className="muted">Sélectionne une conversation.</div> : <ChatBox match={active} />}
      </div>
    </div>
  );
}
