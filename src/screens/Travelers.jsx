// src/screens/Travelers.jsx
// Vue côté VOYAGEUR : voir les demandes par ville, accepter, livrer, chatter.

import React, { useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

export default function Travelers() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [actionMsg, setActionMsg] = useState("");
  const [actionError, setActionError] = useState("");
  const [actingId, setActingId] = useState(null);

  const [selectedCity, setSelectedCity] = useState("ALL");

  // Chat
  const [openChatId, setOpenChatId] = useState(null);
  const [chatText, setChatText] = useState("");
  const [chatSending, setChatSending] = useState(false);

  // Chargement des demandes
  useEffect(() => {
    let isMounted = true;

    const loadRequests = async () => {
      try {
        setLoading(true);
        setErrorMsg("");

        // On charge toutes les demandes, triées par date
        const { data, error } = await supabase
          .from("requests")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!isMounted) return;

        setRequests(data || []);
      } catch (e) {
        console.error("❌ Erreur chargement demandes voyageur:", e);
        if (isMounted) {
          setErrorMsg(
            "Impossible de charger les demandes pour le moment (côté voyageur)."
          );
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

  const setStatus = async (id, newStatus, successText) => {
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

      if (successText) {
        setActionMsg(`Demande #${id} ${successText}.`);
      }
    } catch (e) {
      console.error("❌ Erreur update demande (voyageur):", e);
      setActionError(
        e.message ||
          "Erreur lors de la mise à jour de la demande (côté voyageur)."
      );
    } finally {
      setActingId(null);
    }
  };

  const acceptRequest = (req) => {
    setStatus(req.id, "accepted", "acceptée");
  };

  const cancelRequest = (req) => {
    setStatus(req.id, "cancelled", "annulée");
  };

  const markDelivered = (req) => {
    setStatus(req.id, "delivered", "marquée comme livrée");
  };

  // Chat voyageur
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
      const prefix = "[Voyageur]";
      const newLine = `${prefix} ${chatText.trim()}`;
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
    } catch (e) {
      console.error("❌ Erreur envoi message chat (voyageur):", e);
      setActionError(
        e.message || "Erreur lors de l’envoi du message (voyageur)."
      );
    } finally {
      setChatSending(false);
    }
  };

  // Liste des villes disponibles (target_city ou target_airport)
  const availableCities = useMemo(() => {
    const set = new Set();
    requests.forEach((r) => {
      const city = r.target_city || r.target_airport;
      if (city) set.add(city);
    });
    return Array.from(set);
  }, [requests]);

  // Filtrage par ville et statut (côté voyageur on s'intéresse surtout aux demandes "actives")
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const status = (r.status || "open").toLowerCase();
      // On cache les demandes clairement terminées/annulées sauf si tu veux tout voir
      const isTerminal =
        status === "cancelled" ||
        status === "canceled" ||
        status === "delivered";

      // Si tu veux voir seulement les actives, on exclut les terminales par défaut
      // Pour l'instant, on garde tout (mais tu peux filtrer ici plus tard)

      if (selectedCity !== "ALL") {
        const city = r.target_city || r.target_airport;
        if (city !== selectedCity) return false;
      }
      return true;
    });
  }, [requests, selectedCity]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Mes voyageurs</div>
          <div className="page-subtitle">
            Vue côté voyageur : sélectionnez une ville et acceptez des
            demandes duty free, discutez avec les acheteurs et marquez les
            livraisons.
          </div>
        </div>

        {/* Filtre ville */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <label
            style={{
              fontSize: 11,
              color: "#a3a092",
            }}
          >
            Filtrer par ville / aéroport
          </label>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            style={{
              fontSize: 12,
              padding: "4px 8px",
              borderRadius: 8,
              border: "1px solid #374151",
              backgroundColor: "#020617",
              color: "#e5e7eb",
            }}
          >
            <option value="ALL">Toutes les villes</option>
            {availableCities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
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
        <p>Chargement des demandes...</p>
      ) : errorMsg ? (
        <p className="alert-error">❌ {errorMsg}</p>
      ) : filteredRequests.length === 0 ? (
        <p>
          Aucune demande à afficher pour cette ville. Changez de filtre ou
          revenez plus tard.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: 10,
          }}
        >
          {filteredRequests.map((r) => {
            const status = (r.status || "open").toLowerCase();

            const canAccept = status === "open";
            const canCancel =
              status === "open" || status === "accepted";
            const canMarkDelivered =
              status === "paid" || status === "delivered";

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
                  Acheteur :{" "}
                  <strong style={{ color: "#f6f0da" }}>
                    {r.requester_name || "—"}
                  </strong>
                  {rendezVousCity && (
                    <>
                      {" · "}Rencontre à :{" "}
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

                {/* BOUTON CHAT voyageur */}
                <div style={{ marginTop: 10, marginBottom: 6 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => toggleChat(r.id)}
                  >
                    💬{" "}
                    {isChatOpen
                      ? "Fermer le chat"
                      : "Discuter avec l’acheteur"}
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
                          conversation avec l’acheteur.
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
                        placeholder="Votre message (voyageur)…"
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

                {/* Boutons d'action voyageur */}
                <div className="actions-row" style={{ marginTop: 10 }}>
                  {canAccept && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => acceptRequest(r)}
                      disabled={actingId === r.id}
                    >
                      {actingId === r.id
                        ? "Acceptation..."
                        : "Accepter la demande"}
                    </button>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => cancelRequest(r)}
                      disabled={actingId === r.id}
                    >
                      {actingId === r.id
                        ? "Annulation..."
                        : "Refuser / Annuler"}
                    </button>
                  )}

                  {canMarkDelivered && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => markDelivered(r)}
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
