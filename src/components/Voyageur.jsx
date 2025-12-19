// src/components/Voyageur.jsx
import { useEffect, useState } from 'react';
import { fetchRequests } from '../api/requests';

export default function Voyageur() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const rows = await fetchRequests();
        setRequests(rows.filter(r => r.status === 'open'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="stack">
      <h2>Voyageur</h2>
      <p>Liste des demandes ouvertes (à titre informatif pour l’instant).</p>

      {loading ? <div>Chargement…</div> : (
        <ul className="list">
          {requests.map(r => (
            <li key={r.id} className="row">
              <div>
                <div className="title">{r.product_name}</div>
                <div className="meta">
                  {r.airport ? `Aéroport: ${r.airport} • ` : ''}
                  {r.meeting_place ? `Rdv: ${r.meeting_place} • ` : ''}
                  {r.time_window ? `Créneau: ${r.time_window} • ` : ''}
                  {r.max_price_eur != null ? `Max: ${r.max_price_eur}€ • ` : ''}
                  Status: {r.status}
                </div>
              </div>
            </li>
          ))}
          {requests.length === 0 && <li>Aucune demande ouverte visible.</li>}
        </ul>
      )}
    </div>
  );
}
