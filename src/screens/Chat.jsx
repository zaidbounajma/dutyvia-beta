// src/screens/Chat.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function ChatScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [openChatId, setOpenChatId] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const [actionError, setActionError] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadChats = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase
          .from("requests")
          .select("*")
          .order("updated_at", { ascending: false });

        if (error) throw error;

        if (isMounted) {
          // On garde celles où il y a déjà du chat ou un statut avancé
          const filtered = (data || []).filter((r) => {
            const hasChat =
              r.chat_log && r.chat_log.trim().length > 0;
            const status = (r.status || "open").toLowerCase();
            const isActive = [
              "open",
              "accepted",
              "payment_pending",
              "paid",
            ].includes(status);
            return hasChat || isActive;
          });
          setRequests(filtered);
        }
      } catch (e) {
        console.error("❌ Erreur chargement chat:", e);
        if (isMounted) {
          setErrorMsg(
            "Impossible de charger les conversations pour le moment."
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadChats();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDate = (d) => {
    if (!d) return "—";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString("fr-FR");
  };

  const toggleChat = (id) => {
    if (openChatId === id) {
      setOpenChatId(null);
      setChatText("");
    } else {
      setOpenChatId(id);
      setChatText("");
    }
  };

  const sendChatMessage = async (req) => {
    if (!chatText.trim()) return;
    setChatSending(true);
    setActionError("");
    setActionMsg("");

    try {
      const previous = req.chat_log || "";
      // Ne pas marquer acheteur/voyageur ici, c'est juste "Chat"
      const newLine = chatText.trim();
      const newLog = previous ? `${previous}\n${newLine}` : newLine;

      const { data, error } = await supabase
        .from("requests")
        .update({ chat_log: newLog })
        .eq("id", req.id)
        .select("*")
        .single();

      if (error) throw error;

      setRequests((prev) =>
        prev.map((r) => (r.id === req.id ? data : r))
      );
      setChatText("");
      setActionMsg("Message envoyé.");
    } catch (e) {
      console.error("❌ Erreur envoi message (onglet chat):", e);
      setActionError(
        e.message || "Erreur lors de l’envoi du message."
      );
    } finally {
      setChatSending(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Chat</div>
          <div className="page-subtitle">
            Toutes vos conversations acheteur / voyageur, regroupées sur
            une seule page.
          </div>
        </div>
        {!loading && (
          <div style={{ fontSize: 12, color: "#a3a092" }}>
            {requests.length} conversation(s)
          </div>
        )}
      </div>

      {actionError && (
        <div className="alert-error" style={{ marginBottom: 8 }}>
          ❌ {actionError}
        </div>
      )}
      {actionMsg && (
        <div className="alert-success" style={{ marginBottom: 8 }}>
          ✅ {actionMsg}
        </div>
      )}

      {loading ? (
        <p>Chargement des conversations...</p>
      ) : errorMsg ? (
        <p className="alert-error">❌ {errorMsg}</p>
      ) : requests.length === 0 ? (
        <p>Pas encore de conversation active.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 10,
          }}
        >
          {requests.map((r) => {
            const messages = (r.chat_log || "")
              .split("\n")
              .filter(Boolean);
            const isChatOpen = openChatId === r.id;

            return (
              <section key={r.id} className="checkout-card">
                <div className="checkout-card-header">
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#f6f0da",
                    }}
                  >
                    #{r.id} ·{" "}
                    {r.product_label ||
                      r.product_name ||
                      "Produit inconnu"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#a3a092",
                      textAlign: "right",
                    }}
                  >
                    Dernière mise à jour :{" "}
                    <strong style={{ color: "#f6f0da" }}>
                      {formatDate(r.updated_at)}
                    </strong>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#c3bda5",
                    marginBottom: 4,
                  }}
                >
                  Ville de rendez-vous :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {r.target_city || r.target_airport || "Non précisé"}
                  </strong>{" "}
                  · Statut :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {r.status || "open"}
                  </strong>
                </div>

                <div style={{ marginTop: 8, marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => toggleChat(r.id)}
                  >
                    💬{" "}
                    {isChatOpen
                      ? "Fermer la conversation"
                      : "Ouvrir la conversation"}
                  </button>
                </div>

                {isChatOpen && (
                  <div
                    style={{
                      borderRadius: 10,
                      border: "1px solid #262430",
                      padding: 8,
                      marginBottom: 8,
                      background:
                        "radial-gradient(circle at top left, #171321, #050509)",
                    }}
                  >
                    <div
                      style={{
                        maxHeight: 150,
                        overflowY: "auto",
                        marginBottom: 6,
                        paddingRight: 4,
                      }}
                    >
                      {messages.length === 0 ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8b8570",
                          }}
                        >
                          Aucun message pour le moment.
                        </div>
                      ) : (
                        messages.map((line, idx) => (
                          <div
                            key={idx}
                            style={{
                              fontSize: 12,
                              color: "#f6f0da",
                              marginBottom: 2,
                            }}
                          >
                            {line}
                          </div>
                        ))
                      )}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: 6,
                        alignItems: "center",
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Votre message…"
                        value={chatText}
                        onChange={(e) => setChatText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            sendChatMessage(r);
                          }
                        }}
                        style={{
                          flex: 1,
                          fontSize: 12,
                        }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        disabled={chatSending}
                        onClick={() => sendChatMessage(r)}
                      >
                        Envoyer
                      </button>
                    </div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
