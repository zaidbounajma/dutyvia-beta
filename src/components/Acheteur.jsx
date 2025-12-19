// src/components/Acheteur.jsx
import { useEffect, useMemo, useState } from 'react';
import { createRequest, fetchRequests, updateRequestStatus } from '../api/requests';

export default function Acheteur() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    product_name: '',
    airport: '',
    meeting_place: '',
    time_window: '',
    max_price_eur: '',
  });
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function load() {
    setLoading(true);
    setErrorMsg('');
    try {
      const rows = await fetchRequests();
      setRequests(rows);
    } catch (e) {
      setErrorMsg(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setErrorMsg('');
    try {
      if (!form.product_name.trim()) {
        setErrorMsg('Le nom du produit est requis.');
        setSaving(false);
        return;
      }

      const payload = {
        product_name: form.product_name.trim(),
      };

      // champs optionnels (on les passe si remplis)
      if (form.airport.trim()) payload.airport = form.airport.trim();
      if (form.meeting_place.trim()) payload.meeting_place = form.meeting_place.trim();
      if (form.time_window.trim()) payload.time_window = form.time_window.trim();
      if (form.max_price_eur) payload.max_price_eur = Number(form.max_price_eur);

      await createRequest(payload);
      setForm({
        product_name: '',
        airport: '',
        meeting_place: '',
        time_window: '',
        max_price_eur: '',
      });
      load();
    } catch (e) {
      setErrorMsg(e.message ?? String(e));
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(id, status) {
    try {
      await updateRequestStatus(id, status);
      load();
    } catch (e) {
      alert(e.message ?? String(e));
    }
  }

  const open = useMemo(() => requests.filter(r => r.status === 'open'), [requests]);
  const closed = useMemo(() => requests.filter(r => r.status !== 'open'), [requests]);

  return (
    <div className="stack">
      <h2>Demande (Acheteur)</h2>
      <p>Création et suivi de vos demandes d’achat auprès des voyageurs.</p>

      <form className="card" onSubmit={onSubmit}>
        <h3>Créer une demande</h3>
        <div className="grid">
          <label>
            Produit *
            <input
              value={form.product_name}
              onChange={(e) => setForm(f => ({ ...f, product_name: e.target.value }))}
              placeholder="Ex: Lindt Excellence 100g"
              required
            />
          </label>
          <label>
            Aéroport (optionnel)
            <input
              value={form.airport}
              onChange={(e) => setForm(f => ({ ...f, airport: e.target.value }))}
              placeholder="Ex: CDG, ORY"
            />
          </label>
          <label>
            Lieu de rendez-vous (optionnel)
            <input
              value={form.meeting_place}
              onChange={(e) => setForm(f => ({ ...f, meeting_place: e.target.value }))}
              placeholder="Ex: Porte 12, Hall 2"
            />
          </label>
          <label>
            Créneau horaire (optionnel)
            <input
              value={form.time_window}
              onChange={(e) => setForm(f => ({ ...f, time_window: e.target.value }))}
              placeholder="Ex: 18h-20h"
            />
          </label>
          <label>
            Prix max € (optionnel)
            <input
              type="number"
              min="0"
              step="1"
              value={form.max_price_eur}
              onChange={(e) => setForm(f => ({ ...f, max_price_eur: e.target.value }))}
              placeholder="Ex: 25"
            />
          </label>
        </div>

        {errorMsg && <div className="error">{errorMsg}</div>}

        <button disabled={saving}>
          {saving ? 'Enregistrement…' : 'Publier la demande'}
        </button>
      </form>

      <section className="stack">
        <h3>Demandes ouvertes</h3>
        {loading ? <div>Chargement…</div> : (
          <ul className="list">
            {open.map(r => (
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
                <div className="actions">
                  <button onClick={() => changeStatus(r.id, 'completed')}>Marquer livrée</button>
                  <button className="ghost" onClick={() => changeStatus(r.id, 'cancelled')}>Annuler</button>
                </div>
              </li>
            ))}
            {open.length === 0 && <li>Aucune demande ouverte.</li>}
          </ul>
        )}
      </section>

      <section className="stack">
        <h3>Demandes clôturées</h3>
        {loading ? <div /> : (
          <ul className="list">
            {closed.map(r => (
              <li key={r.id} className="row">
                <div>
                  <div className="title">{r.product_name}</div>
                  <div className="meta">Status: {r.status}</div>
                </div>
                <div className="actions">
                  <button className="ghost" onClick={() => changeStatus(r.id, 'open')}>Ré-ouvrir</button>
                </div>
              </li>
            ))}
            {closed.length === 0 && <li>Aucune demande clôturée.</li>}
          </ul>
        )}
      </section>
    </div>
  );
}
