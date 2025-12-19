import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';

export default function OfferForm() {
  const { user } = useAuth();
  const [openRequests, setOpenRequests] = useState([]);
  const [requestId, setRequestId] = useState('');
  const [price, setPrice] = useState('');
  const [note, setNote] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    supabase.from('requests').select('id, product_name, airport, status')
      .eq('status','open').then(({ data }) => setOpenRequests(data ?? []));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    if (!requestId) return setMsg('Choisis une demande.');
    const { error } = await supabase.from('offers').insert({
      request_id: Number(requestId),
      traveler_id: user.id,
      price_eur: price ? Number(price) : null,
      note
    });
    setMsg(error ? error.message : 'Offre envoyée ✅');
    if (!error) { setPrice(''); setNote(''); }
  };

  return (
    <div>
      <h3>Proposer une offre (Voyageur)</h3>
      <form onSubmit={submit} style={{display:'grid', gap:8, maxWidth:480}}>
        <select value={requestId} onChange={e=>setRequestId(e.target.value)}>
          <option value="">— Sélectionner une demande ouverte —</option>
          {openRequests.map(r=>(
            <option key={r.id} value={r.id}>#{r.id} — {r.product_name} ({r.airport ?? '—'})</option>
          ))}
        </select>
        <input value={price} onChange={e=>setPrice(e.target.value)} placeholder="Prix (optionnel)" />
        <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Message pour l’acheteur (optionnel)" />
        <button type="submit">Envoyer l’offre</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}
