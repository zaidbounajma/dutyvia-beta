// src/pages/CreateRequest.jsx
import { useState } from 'react';
import supabase from '../supabase';

export default function CreateRequest() {
  const [form, setForm] = useState({
    product_name: '',
    brand: '',
    category: '',
    max_price: '',
    airport: '',
    meetup_location: '',
  });
  const [loading, setLoading] = useState(false);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const payload = {
      ...form,
      max_price: form.max_price ? Number(form.max_price) : null,
      status: 'open',
    };

    const { error } = await supabase.from('requests').insert([payload]);

    setLoading(false);
    if (error) return alert(error.message);
    alert('✅ Demande créée !');
    setForm({ product_name:'', brand:'', category:'', max_price:'', airport:'', meetup_location:'' });
  }

  const input = { padding:'10px 12px', border:'1px solid #e5e7eb', borderRadius:8, width:'100%' };
  const label = { fontWeight:600, marginTop:10, marginBottom:6, display:'block' };
  const btn = { marginTop:14, padding:'12px 14px', borderRadius:8, background:'#1555cc', color:'#fff', border:'none', fontWeight:700 };

  return (
    <section>
      <h2>Créer une demande</h2>
      <form onSubmit={onSubmit} style={{ maxWidth: 520 }}>
        <label style={label}>Produit</label>
        <input name="product_name" value={form.product_name} onChange={onChange} style={input} required />

        <label style={label}>Marque</label>
        <input name="brand" value={form.brand} onChange={onChange} style={input} />

        <label style={label}>Catégorie</label>
        <input name="category" value={form.category} onChange={onChange} style={input} />

        <label style={label}>Prix max (€)</label>
        <input name="max_price" type="number" step="1" value={form.max_price} onChange={onChange} style={input} />

        <label style={label}>Aéroport</label>
        <input name="airport" value={form.airport} onChange={onChange} style={input} />

        <label style={label}>Lieu de RDV</label>
        <input name="meetup_location" value={form.meetup_location} onChange={onChange} style={input} />

        <button style={btn} disabled={loading}>{loading ? 'Envoi…' : 'Créer'}</button>
      </form>
    </section>
  );
}
