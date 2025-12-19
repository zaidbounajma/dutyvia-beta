// src/pages/TravelerRequests.jsx
import { useEffect, useState } from 'react';
import supabase from '../supabase';

export default function TravelerRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadOpen() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requests')
      .select('id, product_name, brand, category, airport, meetup_location, max_price, created_at')
      .eq('status', 'open')
      .order('id', { ascending: false });

    if (error) alert(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadOpen(); }, []);

  return (
    <section>
      <h2>Demandes ouvertes (Voyageur)</h2>
      <button onClick={loadOpen} disabled={loading}>
        {loading ? 'Chargement…' : 'Recharger'}
      </button>

      <div style={{ marginTop: 12 }}>
        {rows.length === 0 ? (
          <p>Aucune demande ouverte.</p>
        ) : rows.map(r => (
          <div key={r.id} style={{ background:'#eef6ff', padding:12, borderRadius:10, marginBottom:10 }}>
            <b>{r.product_name}</b> • {r.brand} — {r.category}<br/>
            Max {r.max_price} € • Aéroport: {r.airport}<br/>
            Lieu: {r.meetup_location}<br/>
            <small style={{ color:'#6b7280' }}>{new Date(r.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </section>
  );
}
