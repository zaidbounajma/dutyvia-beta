import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import ChatWindow from './ChatWindow';

export default function MatchesList() {
  const [matches, setMatches] = useState([]);
  const [active, setActive] = useState(null);

  useEffect(() => {
    supabase.from('matches')
      .select('id, status, traveler_id, request_id, requests!inner(id, product_name, requester_id)')
      .order('created_at', { ascending: false })
      .then(({ data }) => setMatches(data ?? []));
  }, []);

  return (
    <div>
      <h3>Mes chats</h3>
      <div style={{display:'grid', gridTemplateColumns:'280px 1fr', gap:16}}>
        <div style={{borderRight:'1px solid #333', paddingRight:12}}>
          {(matches ?? []).map(m => (
            <div key={m.id}
                 onClick={()=>setActive(m.id)}
                 style={{
                  padding:'8px 10px', borderRadius:8, cursor:'pointer',
                  background: active===m.id ? '#1f2937' : 'transparent'
                 }}>
              Match #{m.id} — {m.requests.product_name}
              <div style={{opacity:.6, fontSize:12}}>Statut: {m.status}</div>
            </div>
          ))}
          {matches.length===0 && <i>Aucun match pour le moment.</i>}
        </div>
        <div>
          {active ? <ChatWindow matchId={active} /> : <i>Sélectionnez un match pour discuter.</i>}
        </div>
      </div>
    </div>
  );
}
