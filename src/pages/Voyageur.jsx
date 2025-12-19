import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Voyageur() {
  const [openReqs, setOpenReqs] = useState([]);
  const [myMatches, setMyMatches] = useState([]);

  // liste des demandes ouvertes visibles
  const loadOpen = async () => {
    const { data, error } = await supabase
      .from('requests')
      .select('id, product_name, airport, time_window, requester_id, status, max_price_eur')
      .eq('status', 'open')
      .order('id', { ascending:false });
    if (!error) setOpenReqs(data ?? []);
  };

  // mes matches
  const loadMatches = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from('matches')
      .select('id, request_id, status, requests!inner(product_name, airport, time_window)')
      .eq('traveler_id', user.id)
      .order('id', { ascending:false });
    if (!error) setMyMatches(data ?? []);
  };

  useEffect(() => {
    loadOpen();
    loadMatches();
  }, []);

  const accept = async (requestId) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert('Non connecté');
    const { error } = await supabase.from('matches').insert({
      request_id: requestId,
      traveler_id: user.id,
      status: 'accepted'
    });
    if (error) return alert(error.message);
    await loadOpen();
    await loadMatches();
  };

  return (
    <div>
      <h2>Voyageur</h2>
      <p>Consultez les demandes ouvertes et acceptez celles que vous pouvez réaliser.</p>

      <div style={{ marginTop: 18 }}>
        <h3>Demandes ouvertes</h3>
        <div className="list">
          {openReqs.map(r => (
            <div className="item" key={r.id}>
              <h4>#{r.id} — {r.product_name}</h4>
              <div className="muted">Lieu : {r.airport} — Créneau : {r.time_window ?? 'N/A'} — Prix max: {r.max_price_eur ?? '—'}€</div>
              <div className="row" style={{ marginTop: 6 }}>
                <button className="btn" onClick={()=>accept(r.id)}>Accepter</button>
              </div>
            </div>
          ))}
          {!openReqs.length && <div className="muted">Pas de demandes visibles.</div>}
        </div>
      </div>

      <div style={{ marginTop: 28 }}>
        <h3>Mes demandes acceptées</h3>
        <div className="list">
          {myMatches.map(m => (
            <div className="item" key={m.id}>
              <h4>Match #{m.id} — {m.requests?.product_name}</h4>
              <div className="muted">Lieu : {m.requests?.airport} — {m.requests?.time_window}</div>
              <span className="pill">{m.status}</span>
            </div>
          ))}
          {!myMatches.length && <div className="muted">Aucune demande acceptée.</div>}
        </div>
      </div>
    </div>
  );
}
