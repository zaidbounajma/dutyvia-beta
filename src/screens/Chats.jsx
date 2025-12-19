import { useEffect, useMemo, useRef, useState } from "react";
import { listMessages, listMyThreads, sendMessage, subscribeMessages } from "../api/chats.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Chats() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [msgs, setMsgs] = useState([]);
  const [draft, setDraft] = useState("");
  const unsubRef = useRef(null);

  // Charger mes fils
  useEffect(() => {
    (async () => {
      const ths = await listMyThreads(user.id);
      setThreads(ths);
      // sélection auto dernier fil (ou celui stocké)
      const saved = localStorage.getItem("df_last_thread");
      const startId = saved && ths.some(t => String(t.id) === saved) ? Number(saved) : (ths[0]?.id ?? null);
      setActiveId(startId);
    })();
    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [user.id]);

  // Charger messages + abonnement
  useEffect(() => {
    if (!activeId) return;
    (async () => {
      const data = await listMessages(activeId);
      setMsgs(data);
    })();
    if (unsubRef.current) unsubRef.current();
    unsubRef.current = subscribeMessages(activeId, (m) => {
      setMsgs((cur) => [...cur, m]);
    });
    localStorage.setItem("df_last_thread", String(activeId));
    return () => {
      if (unsubRef.current) unsubRef.current();
      unsubRef.current = null;
    };
  }, [activeId]);

  async function onSend(e) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !activeId) return;
    setDraft("");
    await sendMessage(activeId, text);
  }

  const activeThread = useMemo(() => threads.find(t => t.id === activeId), [threads, activeId]);

  return (
    <>
      <div className="section-header">
        <div className="section-title">Chats</div>
        <div className="section-sub">Messagerie acheteur ↔ voyageur (temps réel).</div>
      </div>

      {/* sélecteur de fil */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
        {threads.map((t) => (
          <button
            key={t.id}
            className={`tab-btn ${t.id === activeId ? "active" : ""}`}
            onClick={() => setActiveId(t.id)}
            title={`Demande: ${t.product_name}`}
          >
            Fil #{t.id} · {t.product_name}
          </button>
        ))}
        {threads.length === 0 && <div className="empty-msg">Aucune conversation.</div>}
      </div>

      {/* zone messages */}
      <div className="section-card" style={{ gap: "0.75rem" }}>
        <div className="section-sub">
          {activeThread ? `Fil #${activeThread.id} — ${activeThread.product_name}` : "Sélectionnez un fil."}
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid var(--border-color)",
          borderRadius: "12px",
          padding: "0.75rem",
          minHeight: "200px",
          maxHeight: "45vh",
          overflowY: "auto"
        }}>
          {msgs.map((m) => (
            <div key={m.id} style={{
              display: "flex",
              justifyContent: m.author_id === user.id ? "flex-end" : "flex-start",
              marginBottom: "0.4rem"
            }}>
              <div style={{
                background: m.author_id === user.id ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.06)",
                border: "1px solid var(--border-color)",
                padding: "0.5rem 0.65rem",
                borderRadius: "10px",
                maxWidth: "72%"
              }}>
                <div style={{ fontSize: "0.9rem" }}>{m.body}</div>
                <div className="checkout-priceeach" style={{ marginTop: "0.15rem" }}>
                  {new Date(m.created_at).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          {msgs.length === 0 && <div className="empty-msg">Aucun message.</div>}
        </div>

        {/* input */}
        <form onSubmit={onSend} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            className="tab-btn"
            style={{ flex: 1, borderRadius: 10 }}
            placeholder="Écrire un message…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button className="primary-btn" type="submit">Envoyer</button>
        </form>
      </div>
    </>
  );
}
