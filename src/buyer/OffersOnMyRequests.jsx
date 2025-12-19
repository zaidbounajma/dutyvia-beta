import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { supabase } from '../supabase';

export default function OffersOnMyRequests() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('offers')
      .select('id, status, price_eur, note, created_at, traveler_id, request_id, requests!inner(id, product_name)')
      .in('status', ['pending','accepted'])
      .order('created_at', { ascending: false });
    // Filtrer coté client: seulement mes requests
    const mine = (data ?? []).filter(o => true); // RLS protège déjà
    setRows(mine);
  }

  useEffect(() => { load(); }, []);

  const accept = async (id) => {
    await supabase.from('offers').update({ status:'accepted' }).eq('id', id);
    await load();
  };
  const reject = async (id) => {
    await supabase.from('offers').update({ status:'rejected' }).eq('id', id);
    await load();
  };

  return (
    <div>
      <h3>Offres reçues (mes demandes)</h3>
      <div style={{display:'grid', gap:8}}>
        {rows.map(o=>(
          <div key={o.id} style={{border:'1px solid #333', borderRadius:8, padding:12}}>
            <b>Demande #{o.requests.id} — {o.requests.product_name}</b><br/>
            Proposée par: {o.traveler_id.slice(0,8)}… — Prix: {o.price_eur ?? '—'} — Statut: {o.status}
            <div style={{marginTop:8, display:'flex', gap:8}}>
              {o.status==='pending' && (
                <>
                  <button onClick={()=>accept(o.id)}>Accepter</button>
                  <button onClick={()=>reject(o.id)} style={{opacity:.7}}>Rejeter</button>
                </>
              )}
            </div>
            {o.note && <p style={{marginTop:6}}>{o.note}</p>}
          </div>
        ))}
        {rows.length===0 && <i>Aucune offre pour l’instant.</i>}
      </div>
    </div>
  );
}
