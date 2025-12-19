import { useEffect, useState } from "react";
import { closeRequest, createRequest, listMyRequests } from "../api/requests.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Buyer() {
  const { user } = useAuth();
  const [form, setForm] = useState({ product_name: "", airport: "" });
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true);
    setErr("");
    try {
      const rows = await listMyRequests(user.id);
      setMine(rows);
    } catch (e) {
      setErr(e.message ?? String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    try {
      if (!form.product_name.trim()) return;
      await createRequest(form);
      setForm({ product_name: "", airport: "" });
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    }
  }

  async function onClose(id) {
    try {
      await closeRequest(id);
      await load();
    } catch (e) {
      setErr(e.message ?? String(e));
    }
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Demande (Acheteur)</div>
        <div className="section-sub">Crée des demandes vues par les voyageurs.</div>
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.6rem", gridTemplateColumns: "1fr 240px auto" }}>
        <input
          placeholder="Produit (ex: Lindt 100g)"
          value={form.product_name}
          onChange={(e) => setForm((f) => ({ ...f, product_name: e.target.value }))}
          className="tab-btn"
          style={{ borderRadius: "8px" }}
        />
        <input
          placeholder="Aéroport (ex: CDG)"
          value={form.airport}
          onChange={(e) => setForm((f) => ({ ...f, airport: e.target.value }))}
          className="tab-btn"
          style={{ borderRadius: "8px" }}
        />
        <button className="primary-btn" type="submit">Publier</button>
      </form>

      <div className="section-sub" style={{ marginTop: "0.5rem" }}>
        {loading ? "Chargement…" : err ? <span style={{ color: "#f87171" }}>Erreur : {err}</span> : null}
      </div>

      <ul className="checkout-list" style={{ marginTop: "1rem" }}>
        {mine.map((r) => (
          <li key={r.id} className="checkout-item-line" style={{ alignItems: "center" }}>
            <div>
              <div className="checkout-qtyname">{r.product_name}</div>
              <div className="checkout-priceeach">Aéroport: {r.airport || "—"} · Statut: {r.status}</div>
            </div>
            {r.status === "open" && (
              <button className="tab-btn" onClick={() => onClose(r.id)}>Clore</button>
            )}
          </li>
        ))}
        {(!loading && mine.length === 0) && <div className="empty-msg">Aucune demande.</div>}
      </ul>
    </>
  );
}
