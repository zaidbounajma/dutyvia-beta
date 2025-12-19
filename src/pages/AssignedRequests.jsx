// src/pages/AssignedRequests.jsx
import { useEffect, useState } from 'react';
import supabase from '../supabase';

export default function AssignedRequests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadAssigned() {
    setLoading(true);
    // Exemples de jointure simple: matches + requests
    const { data, error } = await supabase
      .from('matches')
      .select('id, status, request:requests(id, product_name, brand, category, airport, meetup_location)')
      .order('id', { ascending: false });

    if (error) alert(error.message);
    setRows(data || []);
    setLoading(false);
  }

  useEffect(() => { loadAssigned(); }, []);

  return (
    <section>
      <h2>Demandes assignées</h2>
      <button onClick={loadAssigned} disabled={loading}>
        {loading ? 'Chargement…' : 'Recharger'}
      </button>

      <div style={{ marginTop: 12 }}>
        {rows.length === 0 ? (
          <p>Aucune demande assignée.</p>
        ) : rows.map(m => (
          <div key={m.id} style={{ background:'#f3f4f6', padding:12, borderRadius:10, marginBottom:10 }}>
            <b>Match #{m.id}</b> — <i>{m.status}</i><br/>
            {m.request ? (
              <>
                {m.request.product_name} • {m.request.brand} — {m.request.category}<br/>
                Aéroport: {m.request.airport} • Lieu: {m.request.meetup_location}
              </>
            ) : <em>(Demande indisponible)</em>}
          </div>
        ))}
      </div>
    </section>
  );
}
