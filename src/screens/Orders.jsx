// src/screens/Orders.jsx
import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [requestsById, setRequestsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [localPaidIds, setLocalPaidIds] = useState([]);

  // Charger les IDs payés côté front (localStorage)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("dutyfree_paid_orders");
      if (!raw) {
        setLocalPaidIds([]);
        return;
      }
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        setLocalPaidIds(
          parsed.map((x) => Number(x)).filter((n) => !Number.isNaN(n))
        );
      } else {
        setLocalPaidIds([]);
      }
    } catch {
      setLocalPaidIds([]);
    }
  }, []);

  // Charger les commandes + demandes depuis Supabase
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        const [ordersRes, requestsRes] = await Promise.all([
          supabase
            .from("orders")
            .select("*")
            .order("created_at", { ascending: false }),
          supabase.from("requests").select("*"),
        ]);

        if (ordersRes.error) throw ordersRes.error;
        if (requestsRes.error) throw requestsRes.error;

        if (!isMounted) return;

        setOrders(ordersRes.data || []);

        const reqMap = {};
        (requestsRes.data || []).forEach((r) => {
          if (r && r.id != null) reqMap[r.id] = r;
        });
        setRequestsById(reqMap);
      } catch (e) {
        console.error("❌ Erreur chargement orders/requests:", e);
        if (isMounted) {
          setErrorMsg(e?.message || "Impossible de charger vos commandes.");
          setOrders([]);
          setRequestsById({});
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const formatDateTime = (d) => {
    if (!d) return "Non précisé";
    const date = new Date(d);
    if (Number.isNaN(date.getTime())) return "Non précisé";
    return date.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEuro = (val) => {
    if (val == null) return "—";
    const n = Number(val);
    if (Number.isNaN(n)) return "—";
    return `${n.toFixed(2)} €`;
  };

  const renderOrderStatusBadge = (statusRaw) => {
    const s = (statusRaw || "created").toLowerCase();
    let label = "CRÉÉE";
    let bg = "rgba(148, 163, 184, 0.12)";
    let color = "#e5e7eb";
    let border = "1px solid rgba(148, 163, 184, 0.5)";

    if (s === "confirmed") {
      label = "CONFIRMÉE";
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

  // ✅ COMME AVANT : localStorage peut “forcer” PAYÉE, même si payment_status est encore pending en DB
  const renderPaymentBadge = (order, isPaidLocal) => {
    const rawPay = order.payment_status || "";
    const p = String(rawPay).toLowerCase();

    const isPaidBackend = p === "paid";
    const isPendingBackend = p === "payment_pending" || p === "pending";

    const isPaid = isPaidLocal || isPaidBackend;

    if (isPaid) {
      return (
        <span
          style={{
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(34, 197, 94, 0.12)",
            color: "#bbf7d0",
            border: "1px solid rgba(34, 197, 94, 0.4)",
            whiteSpace: "nowrap",
          }}
        >
          PAYÉE
        </span>
      );
    }

    if (isPendingBackend) {
      return (
        <span
          style={{
            fontSize: 10,
            padding: "3px 8px",
            borderRadius: 999,
            background: "rgba(251, 191, 36, 0.12)",
            color: "#fde68a",
            border: "1px solid rgba(251, 191, 36, 0.5)",
            whiteSpace: "nowrap",
          }}
        >
          EN COURS DE PAIEMENT
        </span>
      );
    }

    return (
      <span
        style={{
          fontSize: 10,
          padding: "3px 8px",
          borderRadius: 999,
          background: "rgba(248, 113, 113, 0.12)",
          color: "#fecaca",
          border: "1px solid rgba(248, 113, 113, 0.4)",
          whiteSpace: "nowrap",
        }}
      >
        NON PAYÉE
      </span>
    );
  };

  const renderRequestStatusBadge = (statusRaw) => {
    const s = (statusRaw || "open").toLowerCase();
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
          padding: "2px 6px",
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

  const enrichedOrders = useMemo(() => {
    return (orders || []).map((o) => ({
      ...o,
      _isPaidLocal: localPaidIds.includes(Number(o?.id)),
    }));
  }, [orders, localPaidIds]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Mes commandes</div>
          <div className="page-subtitle">
            Historique des commandes Dutyvia, avec statut de paiement simplifié.
          </div>
        </div>
        {!loading && (
          <div style={{ fontSize: 12, color: "#a3a092" }}>
            {enrichedOrders.length} commande(s)
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="alert-error" style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
          ❌ {errorMsg}
        </div>
      )}

      {loading ? (
        <p>Chargement de vos commandes...</p>
      ) : enrichedOrders.length === 0 ? (
        <p>Vous n’avez pas encore de commande.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 10 }}>
          {enrichedOrders.map((order) => {
            const created = formatDateTime(order.created_at);
            const total = formatEuro(order.total_eur);

            const requestId = order.request_id || null;
            const linkedRequest = requestId != null ? requestsById[requestId] : null;

            return (
              <section key={order.id} className="checkout-card">
                <div className="checkout-card-header">
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#f6f0da" }}>
                      Commande #{order.id}
                    </div>
                    <div style={{ fontSize: 11, color: "#9ca3af" }}>Créée le {created}</div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                    {renderPaymentBadge(order, order._isPaidLocal)}
                    {renderOrderStatusBadge(order.status)}
                  </div>
                </div>

                <div style={{ fontSize: 12, color: "#c3bda5", marginTop: 4, marginBottom: 2 }}>
                  Montant total : <strong style={{ color: "#f6f0da" }}>{total}</strong>
                </div>

                {linkedRequest && (
                  <div style={{ marginTop: 10, paddingTop: 8, borderTop: "1px dashed rgba(75, 85, 99, 0.7)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, color: "#e5e7eb", fontWeight: 500 }}>
                        Demande liée #{linkedRequest.id}
                      </div>
                      {renderRequestStatusBadge(linkedRequest.status)}
                    </div>

                    <div style={{ fontSize: 12, color: "#c3bda5", marginBottom: 2 }}>
                      Produit :{" "}
                      <strong style={{ color: "#f6f0da" }}>
                        {linkedRequest.product_label || linkedRequest.product_name || "Produit inconnu"}
                      </strong>
                    </div>

                    <div style={{ fontSize: 12, color: "#a3a092" }}>
                      Ville / lieu :{" "}
                      <strong style={{ color: "#f6f0da" }}>
                        {linkedRequest.target_city || linkedRequest.target_airport || "Non précisé"}
                      </strong>{" "}
                      · Budget max :{" "}
                      <strong style={{ color: "#f6f0da" }}>{formatEuro(linkedRequest.max_budget_eur)}</strong>{" "}
                      · Quantité :{" "}
                      <strong style={{ color: "#f6f0da" }}>{linkedRequest.quantity || 1}</strong>
                    </div>

                    {linkedRequest.details && (
                      <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 3 }}>
                        Détails : {linkedRequest.details}
                      </div>
                    )}
                  </div>
                )}

                {!linkedRequest && requestId && (
                  <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 8 }}>
                    Liée à la demande #{requestId}, mais impossible de charger les détails.
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
