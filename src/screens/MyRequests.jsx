// src/screens/MyRequests.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useCart } from "../context/CartContext";

export default function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [actingId, setActingId] = useState(null);

  const cartCtx = useCart();
  const addToCart = cartCtx?.addToCart || (() => {});
  const clearCart = cartCtx?.clearCart || (() => {});

  // Chat
  const [openChatId, setOpenChatId] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        const { data, error } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (isMounted) setRequests(data || []);
      } catch (e) {
        console.error("❌ Erreur chargement requests:", e);
        if (isMounted) {
          setErrorMsg("Impossible de charger vos demandes pour le moment.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadRequests();
    return () => {
      isMounted = false;
    };
  }, []);

  const renderStatusBadge = (status) => {
    const s = (status || "open").toLowerCase();
    let label = "OUVERTE";
    let bg = "rgba(245, 194, 66, 0.12)";
    let color = "#f5c242";
    let border = "1px solid rgba(245, 194, 66, 0.5)";

    if (s === "accepted") {
      label = "ACCEPTÉE";
      bg = "rgba(34, 197, 94, 0.12)";
      color = "#bbf7d0";
      border = "1px solid rgba(34, 197, 94, 0.4)";
    } else if (s === "payment_pending") {
      label = "EN COURS DE PAIEMENT";
      bg = "rgba(251, 191, 36, 0.12)";
      color = "#fde68a";
      border = "1px solid rgba(251, 191, 36, 0.5)";
    } else if (s === "paid") {
      label = "PAYÉE";
      bg = "rgba(34, 197, 94, 0.12)";
      color = "#bbf7d0";
      border = "1px solid rgba(34, 197, 94, 0.4)";
    } else if (s === "delivered") {
      label = "LIVRÉE";
      bg = "rgba(59, 130, 246, 0.12)";
      color = "#bfdbfe";
      border = "1px solid rgba(59, 130, 246, 0.4)";
    } else if (s === "cancelled" || s === "canceled") {
      label = "ANNULÉE";
      bg = "rgba(248, 113, 113, 0.12)";
      color = "#fecaca";
      border = "1px solid rgba(248, 113, 113, 0.4)";
    }

    return (
      <span
        style={{
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 999,
          background: bg,
          color,
          border,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
    );
  };

  const formatDate = (d) => {
    if (!d) return "Non précisé";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "Non précisé";
    return date.toLocaleDateString("fr-FR");
  };

  const formatEuro = (val) => {
    if (val == null) return "—";
    const n = Number(val);
    if (Number.isNaN(n)) return "—";
    return `${n.toFixed(2)} €`;
  };

  const updateStatus = async (id, newStatus, msgLabel) => {
    setActionError("");
    setActionMsg("");
    setActingId(id);

    try {
      const { data, error } = await supabase
        .from("requests")
        .update({ status: newStatus })
        .eq("id", id)
        .select("*")
        .single();

      if (error) throw error;

      setRequests((prev) => prev.map((r) => (r.id === id ? data : r)));

      if (msgLabel) {
        setActionMsg(`Demande #${id} ${msgLabel}.`);
      }
    } catch (e) {
      console.error("❌ Erreur update demande:", e);
      setActionError(
        e.message || "Erreur lors de la mise à jour de la demande."
      );
    } finally {
      setActingId(null);
    }
  };

  const createOrderFromRequest = async (r) => {
    setActionError("");
    setActionMsg("");
    setActingId(r.id);

    try {
      // On vide le panier et on prépare le produit
      clearCart();

      const label = r.product_label || r.product_name || "Produit duty free";
      const qty = r.quantity || 1;
      const price = Number(r.max_budget_eur || 0);

      addToCart({
        id: r.product_id || r.id,
        name: label,
        unit_price_eur: price,
        quantity: qty,
      });

      // Lier cette demande au futur paiement (Checkout + StripeReturnHandler)
      try {
        localStorage.setItem(
          "dutyfree_current_request_id",
          String(r.id)
        );
      } catch {
        // ignore si localStorage plante
      }

      const { data, error } = await supabase
        .from("requests")
        .update({ status: "payment_pending" })
        .eq("id", r.id)
        .select("*")
        .single();

      if (error) throw error;

      setRequests((prev) =>
        prev.map((req) => (req.id === r.id ? data : req))
      );

      setActionMsg(
        `Commande préparée depuis la demande #${r.id}. La demande est en cours de paiement et le produit est dans votre panier.`
      );
    } catch (e) {
      console.error("❌ Erreur création commande depuis demande:", e);
      setActionError(
        e.message ||
          "Erreur lors de la création de la commande depuis cette demande."
      );
    } finally {
      setActingId(null);
    }
  };

  // Chat acheteur
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
      const prefix = "[Acheteur]";
      const newLine = `${prefix} ${chatText.trim()}`;
      const newLog = previous ? `${previous}\n${newLine}` : newLine;

      const { data, error } = await supabase
        .from("requests")
        .update({ chat_log: newLog })
        .eq("id", req.id)
        .select("*")
        .single();

      if (error) throw error;

      setRequests((prev) => prev.map((r) => (r.id === req.id ? data : r)));
      setChatText("");
    } catch (e) {
      console.error("❌ Erreur envoi message chat:", e);
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
          <div className="page-title">Mes demandes</div>
          <div className="page-subtitle">
            Suivi des demandes envoyées aux voyageurs, avec chat pour
            organiser le rendez-vous et le paiement.
          </div>
        </div>
        {!loading && (
          <div style={{ fontSize: 12, color: "#a3a092" }}>
            {requests.length} demande(s)
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
        <p>Chargement de vos demandes...</p>
      ) : errorMsg ? (
        <p className="alert-error">❌ {errorMsg}</p>
      ) : requests.length === 0 ? (
        <p>Vous n’avez pas encore créé de demande.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 10,
          }}
        >
          {requests.map((r) => {
            const status = (r.status || "open").toLowerCase();

            const canCancel = status === "open" || status === "accepted";
            const canCreateOrder = status === "accepted";
            const canMarkPaid = status === "payment_pending";
            const canMarkDelivered = status === "paid";

            const rendezVousCity =
              r.target_city || r.target_airport || null;

            const isChatOpen = openChatId === r.id;
            const messages = (r.chat_log || "")
              .split("\n")
              .filter(Boolean);

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
                    {r.product_label ||
                      r.product_name ||
                      "Produit inconnu"}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    {renderStatusBadge(r.status)}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#c3bda5",
                    marginBottom: 4,
                  }}
                >
                  Demandeur :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {r.requester_name || "—"}
                  </strong>
                  {rendezVousCity && (
                    <>
                      {" · "}Ville de rendez-vous :{" "}
                      <strong style={{ color: "#f6f0da" }}>
                        {rendezVousCity}
                      </strong>
                    </>
                  )}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "#a3a092",
                    marginBottom: 4,
                  }}
                >
                  Quantité :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {r.quantity || 1}
                  </strong>{" "}
                  · Budget max :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {formatEuro(r.max_budget_eur)}
                  </strong>{" "}
                  · Date souhaitée :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {formatDate(r.target_date)}
                  </strong>
                </div>

                {r.details && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#c3bda5",
                      marginTop: 4,
                    }}
                  >
                    Détails : {r.details}
                  </div>
                )}

                {/* BOUTON CHAT HYPER VISIBLE */}
                <div style={{ marginTop: 10, marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => toggleChat(r.id)}
                  >
                    💬 {isChatOpen ? "Fermer le chat" : "Ouvrir le chat"}
                  </button>
                </div>

                {/* Zone de chat */}
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
                          Aucun message pour le moment. Commencez la
                          conversation avec le voyageur.
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
                        placeholder="Votre message (acheteur)…"
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

                {/* Boutons d'action */}
                <div className="actions-row" style={{ marginTop: 10 }}>
                  {canCancel && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        updateStatus(r.id, "cancelled", "annulée")
                      }
                      disabled={actingId === r.id}
                    >
                      {actingId === r.id
                        ? "Annulation..."
                        : "Annuler la demande"}
                    </button>
                  )}

                  {canCreateOrder && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => createOrderFromRequest(r)}
                      disabled={actingId === r.id}
                    >
                      Créer une commande
                    </button>
                  )}

                  {canMarkPaid && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        updateStatus(
                          r.id,
                          "paid",
                          "marquée comme payée (test)"
                        )
                      }
                      disabled={actingId === r.id}
                    >
                      Marquer comme payée (test)
                    </button>
                  )}

                  {canMarkDelivered && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        updateStatus(
                          r.id,
                          "delivered",
                          "marquée comme livrée"
                        )
                      }
                      disabled={actingId === r.id}
                    >
                      Marquer comme livrée
                    </button>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
