import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function Acheteur() {
  const [product, setProduct] = useState('');
  const [airport, setAirport] = useState('CDG');
  const [time, setTime] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [mine, setMine] = useState([]);

  // mes demandes
  useEffect(() => {
    let ignore = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq('requester_id', user.id)
        .order('id', { ascending: false });
      if (!ignore && !error) setMine(data ?? []);
    })();

    // live sur mes demandes
    const sub = supabase.channel('rq:mine').on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'requests' },
      () => { /* on recharge quand ça bouge */ }
    ).subscribe();

    return () => { ignore = true; supabase.removeChannel(sub); };
  }, []);

  const canSave = useMemo(() => product.trim() && airport.trim() && time.trim() && maxPrice !== '', [product, airport, time, maxPrice]);

  const createRequest = async (e) => {
    e.preventDefault();
    if (!canSave) return;
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Non connecté');

      const { error } = await supabase.from('requests').insert({
        product_name: product.trim(),
        airport: airport.trim(),
        time_window: time.trim(),
        requester_id: user.id,
        status: 'open',
        max_price_eur: Number(maxPrice) || null
      });

      if (error) throw error;

      setProduct('');
      setTime('');
      setMaxPrice('');
      // rafraîchir
      const { data, error: e2 } = await supabase
          .from('requests').select('*').eq('requester_id', user.id).order('id', { ascending:false });
      if (!e2) setMine(data ?? []);
    } catch (e2) {
      alert('Erreur: ' + e2.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2>Demande (Acheteur)</h2>
      <p>Création et suivi de vos demandes d’achat auprès des voyageurs.</p>

      <div className="card" style={{ marginTop: 10 }}>
        <h3>Nouvelle demande</h3>
        <form onSubmit={createRequest} className="row">
          <div className="col">
            <label>Produit</label>
            <input value={product} onChange={e=>setProduct(e.target.value)} placeholder="Marlboro Red (200) / Dior Sauvage 100ml ..." />
          </div>
          <div className="col">
            <label>Aéroport</label>
            <select value={airport} onChange={e=>setAirport(e.target.value)}>
              <option>CDG</option><option>ORY</option><option>NCE</option><option>LYS</option>
            </select>
          </div>
          <div className="col">
            <label>Créneau de réception (ex: 18:00-18:30)</label>
            <input value={time} onChange={e=>setTime(e.target.value)} placeholder="18:00-18:30" />
          </div>
          <div className="col">
            <label>Prix max (€)</label>
            <input type="number" min="0" value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="40" />
          </div>
          <div style={{ alignSelf:'end' }}>
            <button className="btn" disabled={!canSave || saving}>{saving?'Envoi…':'Créer la demande'}</button>
          </div>
        </form>
      </div>

      <div style={{ marginTop: 24 }}>
        <h3>Mes demandes</h3>
        <div className="list">
          {mine.map(r => (
            <div className="item" key={r.id}>
              <div className="row" style={{ alignItems:'center', justifyContent:'space-between' }}>
                <h4>#{r.id} — {r.product_name}</h4>
                <span className="pill">{r.status}</span>
              </div>
              <div className="muted">Lieu : {r.airport} — Créneau : {r.time_window ?? 'N/A'} — Prix max: {r.max_price_eur ?? '—'}€</div>
            </div>
          ))}
          {!mine.length && <div className="muted">Aucune demande.</div>}
        </div>
      </div>
    </div>
  );
}
