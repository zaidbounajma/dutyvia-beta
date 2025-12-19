import { useEffect, useState } from "react";
import { listOpenRequestsExcept } from "../api/requests.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { createThread } from "./Chats.jsx";

export default function Traveler({ onNavigate }) {
  const { user } = useAuth();
  const [open, setOpen] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const rows = await listOpenRequestsExcept(user.id);
        setOpen(rows);
      } catch (e) {
        setErr(e.message ?? String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user.id]);

  async function contactBuyer(req) {
    try {
      const thread = await createThread({
        request_id: req.id,
        buyer_id: req.buyer_id,
        traveler_id: user.id
      });
      // on redirige vers Chats et on sauvegarde le fil sélectionné
      localStorage.setItem("df_last_thread", String(thread.id));
      onNavigate?.("chats");
    } catch (e) {
      alert(e.message ?? String(e));
    }
  }

  return (
    <>
      <div className="section-header">
        <div className="section-title">Voyageur</div>
        <div className="section-sub">Demandes ouvertes des acheteurs.</div>
      </div>

      {loading && <div className="empty-msg">Chargement…</div>}
      {err && <div style={{ color: "#f87171" }}>Erreur : {err}</div>}

      <ul className="checkout-list" style={{ marginTop: "0.75rem" }}>
        {open.map((r) => (
          <li key={r.id} className="checkout-item-line" style={{ alignItems: "center" }}>
            <div>
              <div className="checkout-qtyname">{r.product_name}</div>
              <div className="checkout-priceeach">Aéroport: {r.airport || "—"}</div>
            </div>
            <button className="primary-btn" onClick={() => contactBuyer(r)}>Contacter</button>
          </li>
        ))}
        {(!loading && open.length === 0) && <div className="empty-msg">Aucune demande ouverte.</div>}
      </ul>
    </>
  );
}
