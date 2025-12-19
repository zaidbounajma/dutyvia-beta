// @ts-nocheck
// supabase/functions/confirm-payment-stripe/index.ts
// Best effort : ne casse pas l'UX. Vérifie Stripe si stripe_session_id existe.
// Si Stripe dit paid/complete => update orders + requests (si request_id lié).

import Stripe from "https://esm.sh/stripe@13?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

if (!STRIPE_SECRET_KEY || !SERVICE_ROLE_KEY || !SUPABASE_URL) {
  console.error("❌ Missing env vars in confirm-payment-stripe:", {
    hasStripe: !!STRIPE_SECRET_KEY,
    hasServiceRole: !!SERVICE_ROLE_KEY,
    hasUrl: !!SUPABASE_URL,
  });
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed. Use POST." });
  }

  let orderId: any = null;
  let paymentStatusResult = "unknown";
  const warnings: string[] = [];

  try {
    const body: any = await req.json().catch(() => ({}));
    orderId = body?.orderId;

    if (!orderId) {
      return json({ ok: false, error: "Missing orderId in request body" });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // 1) Lire la commande
    let stripeSessionId: string | null = null;
    let requestId: number | null = null;
    let orderStatus: string | null = null;

    try {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("id, payment_status, status, stripe_session_id, request_id")
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        warnings.push(`DB read warning: ${orderError.message || String(orderError)}`);
      }

      if (!order) {
        warnings.push("Order not found in database.");
        return json({ ok: true, orderId, payment_status: paymentStatusResult, warnings });
      }

      orderStatus = order.status ?? null;
      stripeSessionId = order.stripe_session_id ?? null;
      requestId = order.request_id ? Number(order.request_id) : null;

      if (order.payment_status === "paid") {
        paymentStatusResult = "paid";
        // best effort: on tente aussi de payer la request liée si elle est encore en pending
        if (requestId && requestId > 0) {
          try {
            await supabase
              .from("requests")
              .update({ status: "paid" })
              .eq("id", requestId)
              .in("status", ["open", "accepted", "payment_pending"]);
          } catch {
            // ignore
          }
        }
        return json({ ok: true, orderId, requestId: requestId || null, payment_status: "paid", warnings });
      }
    } catch (dbErr) {
      warnings.push(`Exception reading order: ${String(dbErr)}`);
    }

    // 2) Si pas de session Stripe => best effort ok
    if (!stripeSessionId) {
      warnings.push("No stripe_session_id found on this order. Payment status is unknown.");
      return json({ ok: true, orderId, requestId: requestId || null, payment_status: paymentStatusResult, warnings });
    }

    // 3) Lire la session Stripe
    let session: any = null;
    try {
      session = await stripe.checkout.sessions.retrieve(stripeSessionId);
    } catch (stripeErr) {
      warnings.push(`Stripe read warning: ${String(stripeErr)}`);
      return json({ ok: true, orderId, requestId: requestId || null, payment_status: paymentStatusResult, warnings });
    }

    const stripePaymentStatus = session.payment_status || session.status || "unknown";

    // 4) Si paid/complete => update DB
    if (stripePaymentStatus === "paid" || stripePaymentStatus === "complete") {
      paymentStatusResult = "paid";

      const currentStatus = (orderStatus || "").toString().toLowerCase();
      const shouldForceConfirmed =
        !currentStatus ||
        currentStatus === "created" ||
        currentStatus === "payment_pending" ||
        currentStatus === "pending";

      // update order (best effort)
      try {
        const payload: any = {
          payment_status: "paid",
          ...(shouldForceConfirmed ? { status: "confirmed" } : {}),
          updated_at: new Date().toISOString(),
        };

        let { error: updateError } = await supabase.from("orders").update(payload).eq("id", orderId);

        // retry sans updated_at si colonne absente
        if (updateError && String(updateError).toLowerCase().includes("updated_at")) {
          warnings.push("orders.updated_at not available; retrying without it.");
          const payloadNoUpdatedAt: any = {
            payment_status: "paid",
            ...(shouldForceConfirmed ? { status: "confirmed" } : {}),
          };
          const r = await supabase.from("orders").update(payloadNoUpdatedAt).eq("id", orderId);
          updateError = r.error || null;
        }

        if (updateError) warnings.push(`DB update warning (order): ${updateError.message || String(updateError)}`);
      } catch (e) {
        warnings.push(`DB update exception (order): ${String(e)}`);
      }

      // update request liée (best effort)
      if (requestId && !Number.isNaN(requestId) && requestId > 0) {
        try {
          const { error: reqErr } = await supabase
            .from("requests")
            .update({ status: "paid" })
            .eq("id", requestId)
            .in("status", ["open", "accepted", "payment_pending"]);

          if (reqErr) warnings.push(`DB update warning (request): ${reqErr.message || String(reqErr)}`);
        } catch (e) {
          warnings.push(`DB update exception (request): ${String(e)}`);
        }
      }
    } else {
      warnings.push(`Stripe session not paid yet (status=${stripePaymentStatus}).`);
    }

    return json({
      ok: true,
      orderId,
      requestId: requestId || null,
      payment_status: paymentStatusResult,
      warnings,
    });
  } catch (err) {
    return json({
      ok: true,
      orderId,
      payment_status: "unknown",
      warnings: ["Global error in confirm-payment-stripe. See logs for details.", String(err)],
    });
  }
});
