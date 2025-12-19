// supabase/functions/stripe-webhook/index.ts
// @ts-nocheck
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY")!;

// NOTE: version simple (pas de vérification de signature en TEST).
// En prod, on vérifiera `Stripe-Signature` avec STRIPE_WEBHOOK_SECRET.

Deno.serve(async (req) => {
  try {
    if (req.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const body = await req.json(); // Stripe envoie { id, type, data: { object: {...} } }
    const eventType = body?.type;
    const session = body?.data?.object;

    // On ne traite que le paiement réussi
    if (eventType === "checkout.session.completed") {
      const orderId = Number(session?.client_reference_id);
      const paymentIntent = session?.payment_intent ?? null;
      const stripeSessionId = session?.id ?? null;

      if (!orderId) {
        console.log("Webhook: pas d'orderId -> rien à faire");
        return new Response("ok-no-order", { status: 200 });
      }

      // Maj de la commande en base
      const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
      const { error } = await admin
        .from("orders")
        .update({
          payment_status: "paid",
          stripe_payment_intent: paymentIntent,
          stripe_session_id: stripeSessionId,
        })
        .eq("id", orderId);

      if (error) {
        console.error("Update orders error:", error);
        return new Response("db-error", { status: 500 });
      }

      console.log(`Order #${orderId} -> paid ✅`);
      return new Response("ok", { status: 200 });
    }

    // Tous les autres événements : on répond 200 sans rien faire
    return new Response("ignored", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("err", { status: 500 });
  }
});
