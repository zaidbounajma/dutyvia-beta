// src/screens/Checkout.jsx
import React, { useMemo, useState } from "react";
import { supabase } from "../supabaseClient";
import { useCart } from "../context/CartContext";

export default function Checkout() {
  const cart = useCart();
  const items = cart.items || cart.cartItems || [];
  const clearCart = cart.clearCart || (() => {});

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const { subtotal, commission, grandTotal } = useMemo(() => {
    const sub = (items || []).reduce((sum, it) => {
      const price = Number(it.unit_price_eur || it.base_price_eur || 0);
      const qty = Number(it.quantity || 1);
      return sum + price * qty;
    }, 0);
    const comm = sub * 0.1;
    return { subtotal: sub, commission: comm, grandTotal: sub + comm };
  }, [items]);

  const formatEuro = (val) => {
    const n = Number(val || 0);
    if (Number.isNaN(n)) return "—";
    return `${n.toFixed(2)} €`;
  };

  const readLinkedRequestId = () => {
    try {
      const raw = localStorage.getItem("dutyfree_current_request_id");
      if (!raw) return null;
      const n = Number(raw);
      return !Number.isNaN(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  };

  const setCurrentOrderId = (orderId) => {
    try {
      localStorage.setItem("dutyfree_current_order_id", String(orderId));
    } catch {}
  };

  const getCurrentOrderId = () => {
    try {
      const raw = localStorage.getItem("dutyfree_current_order_id");
      if (!raw) return null;
      const n = Number(raw);
      return !Number.isNaN(n) && n > 0 ? n : null;
    } catch {
      return null;
    }
  };

  const clearLocalCheckoutState = () => {
    try {
      localStorage.removeItem("dutyfree_cart");
      localStorage.removeItem("dutyfree_current_request_id");
      localStorage.removeItem("dutyfree_current_order_id");
    } catch {}
  };

  const handlePay = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!items || items.length === 0) {
      setErrorMsg("Votre panier est vide.");
      return;
    }

    try {
      setLoading(true);

      const linkedRequestId = readLinkedRequestId();

      // 1) Create order (server-side)
      const { data: orderRes, error: orderErr } = await supabase.functions.invoke(
        "create-order",
        {
          body: {
            cartItems: items,
            user_id: null,
            request_id: linkedRequestId,
          },
        }
      );

      if (orderErr) {
        console.error("❌ create-order invoke error:", orderErr);
        throw new Error(orderErr.message || "Erreur lors de la création de la commande (serveur).");
      }

      // ✅ Compatibilité anciennes/nouvelles versions
      const orderId =
        orderRes?.orderId ??
        orderRes?.id ??
        orderRes?.order?.id ??
        null;

      // si create-order version "ok:true" existe, on la respecte, sinon on accepte le format ancien
      const okFlag = typeof orderRes?.ok === "boolean" ? orderRes.ok : true;

      if (!okFlag || !orderId) {
        console.error("❌ create-order response:", orderRes);
        throw new Error(orderRes?.error || orderRes?.message || "Impossible de créer la commande.");
      }

      setCurrentOrderId(orderId);

      const serverTotal = Number(orderRes?.total_eur || orderRes?.total || 0);
      const amountToCharge = serverTotal > 0 ? serverTotal : grandTotal;

      // 2) Start Stripe checkout
      const { data: stripeRes, error: stripeErr } = await supabase.functions.invoke(
        "create-checkout-stripe",
        {
          body: {
            orderId,
            amount: amountToCharge,
          },
        }
      );

      if (stripeErr) {
        console.error("❌ create-checkout-stripe invoke error:", stripeErr);
        throw new Error(stripeErr.message || "Impossible de démarrer le paiement Stripe.");
      }

      const stripeUrl =
        stripeRes?.url ??
        stripeRes?.checkoutUrl ??
        stripeRes?.checkout_url ??
        null;

      if (!stripeUrl) {
        console.error("❌ create-checkout-stripe response:", stripeRes);
        throw new Error(stripeRes?.error || stripeRes?.message || "URL Stripe manquante.");
      }

      setSuccessMsg("Redirection vers Stripe… finalisez le paiement, puis revenez sur Dutyvia.");
      window.location.href = stripeUrl;
    } catch (e) {
      console.error("❌ Erreur handlePay:", e);
      setErrorMsg(e?.message || "Erreur lors du paiement. Merci de réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshPaymentStatus = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    const orderId = getCurrentOrderId();
    if (!orderId) {
      setErrorMsg("Aucune commande en cours à vérifier.");
      return;
    }

    try {
      setChecking(true);

      const { data, error } = await supabase.functions.invoke("confirm-payment", {
        body: { orderId },
      });

      if (error) {
        console.warn("⚠️ confirm-payment invoke error:", error);
        setSuccessMsg(`Vérification effectuée pour la commande #${orderId}.`);
        return;
      }

      if (data?.payment_status === "paid") {
        setSuccessMsg(`✅ Paiement confirmé en base pour la commande #${orderId}.`);
      } else {
        setSuccessMsg(
          `Vérification effectuée pour la commande #${orderId} (statut: ${data?.payment_status || "unknown"}).`
        );
      }
    } catch (e) {
      console.warn("⚠️ refresh status failed:", e);
      setSuccessMsg(`Vérification effectuée pour la commande #${orderId}.`);
    } finally {
      setChecking(false);
    }
  };

  const hasItems = items && items.length > 0;

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Checkout</div>
          <div className="page-subtitle">Vérifiez votre panier et finalisez le paiement.</div>
        </div>
      </div>

      {errorMsg && (
        <div className="alert-error" style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
          ❌ {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="alert-success" style={{ marginBottom: 8, whiteSpace: "pre-wrap" }}>
          ✅ {successMsg}
        </div>
      )}

      {!hasItems && !successMsg && <p>Votre panier est vide.</p>}

      {hasItems && (
        <section className="checkout-card">
          <div className="checkout-card-header">
            <div className="checkout-card-title">Votre commande</div>
            <div style={{ fontSize: 11, color: "#9ca3af" }}>{items.length} article(s)</div>
          </div>

          <div
            style={{
              borderRadius: 10,
              border: "1px solid #262430",
              padding: 8,
              background: "radial-gradient(circle at top left, #171321, #050509)",
              marginBottom: 8,
            }}
          >
            {items.map((it) => {
              const price = Number(it.unit_price_eur || it.base_price_eur || 0);
              const qty = Number(it.quantity || 1);
              const lineTotal = price * qty;

              return (
                <div
                  key={`${it.id}-${it.name}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    color: "#f6f0da",
                    marginBottom: 4,
                  }}
                >
                  <div>
                    <div>{it.name}</div>
                    <div style={{ fontSize: 11, color: "#a3a092" }}>
                      Qté {qty} · {formatEuro(price)} / unité
                    </div>
                  </div>
                  <div style={{ fontWeight: 600, marginLeft: 8 }}>{formatEuro(lineTotal)}</div>
                </div>
              );
            })}
          </div>

          <div
            style={{
              fontSize: 12,
              color: "#e5e7eb",
              display: "flex",
              flexDirection: "column",
              gap: 4,
              marginBottom: 10,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Sous-total</span>
              <span>{formatEuro(subtotal)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Commission (10%)</span>
              <span>{formatEuro(commission)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600, marginTop: 4 }}>
              <span>Total TTC</span>
              <span>{formatEuro(grandTotal)}</span>
            </div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 6 }}>
              * Le total final est recalculé côté serveur au moment de créer la commande.
            </div>
          </div>

          <div className="actions-row" style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading || checking}
              onClick={() => {
                clearCart();
                clearLocalCheckoutState();
                setErrorMsg("");
                setSuccessMsg("");
              }}
            >
              Vider le panier
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={loading || checking}
              onClick={handleRefreshPaymentStatus}
            >
              {checking ? "Vérification..." : "Rafraîchir le statut"}
            </button>

            <button
              type="button"
              className="btn btn-primary"
              disabled={loading || checking}
              onClick={handlePay}
            >
              {loading ? "Redirection vers Stripe..." : "Payer maintenant"}
            </button>
          </div>
        </section>
      )}
    </>
  );
}
