import { useEffect } from "react";

const FN_BASE = "https://mlvobwxaaeveyvvxlybm.supabase.co/functions/v1";

export default function ConfirmPaymentWatcher({ onDone }) {
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const flag = sp.get("checkout");
    const orderId = sp.get("order");
    if (flag === "success" && orderId) {
      fetch(`${FN_BASE}/confirm-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: Number(orderId) }),
      })
        .then(r => r.json())
        .then(res => onDone?.(res))
        .catch(err => onDone?.({ error: String(err) }));
    }
  }, [onDone]);

  return null; // n'affiche rien
}
