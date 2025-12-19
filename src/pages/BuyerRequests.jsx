// src/pages/BuyerRequests.jsx
import { useEffect, useState } from 'react';
import supabase from '../supabase';

export default function BuyerRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadMine() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('id, product_name, brand, category, airport, meetup_location, status, created_at, max_price')
      .order('id', { ascending: false }); // si RLS filtre par requester_id, ça renverra seulement les tiennes

    if (error) alert(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadMine(); }, []);

  return (
    <section>
      <h2>Demandes (Acheteur)</h2>
      <button onClick={loadMine} disabled={loading}>
        {loading ? 'Chargement…' : 'Recharger'}
      </button>
      <div style={{ marginTop: 12 }}>
        {rows.length === 0 ? (
          <p>Aucune demande.</p>
        ) : rows.map(r => (
          <div key={r.id} style={{ background:'#f3f4f6', padding:12, borderRadius:10, marginBottom:10 }}>
            <b>{r.product_name}</b> • {r.brand} — {r.category}<br/>
            Max {r.max_price} € • Aéroport: {r.airport}<br/>
            Lieu: {r.meetup_location}<br/>
            <span style={{ color:'#6b7280' }}>Statut: {r.status} • {new Date(r.created_at).toLocaleString()}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
