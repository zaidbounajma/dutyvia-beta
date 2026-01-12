// supabase/functions/create-checkout-stripe/index.ts
// @ts-nocheck
//
// Crée une vraie session Stripe Checkout et renvoie session.url
// Reçoit { orderId, amount, returnUrl? } depuis le front.
// - returnUrl (si fourni) prime
// - sinon: on déduit depuis headers Origin/Referer
// - sinon: fallback APP_URL (secret Supabase)
// - sinon: localhost

import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const APP_URL_FALLBACK = Deno.env.get("APP_URL") ?? "http://localhost:5173";

const stripe =
  STRIPE_SECRET_KEY &&
  new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });

function normalizeBaseUrl(urlStr: string) {
  try {
    const u = new URL(urlStr);
    return `${u.protocol}//${u.host}`; // enlève path/query
  } catch {
    return null;
  }
}

function guessBaseUrl(req: Request) {
  // 1) returnUrl passé par le front (le plus fiable)
  // -> géré dans le handler (body.returnUrl)

  // 2) Origin header
  const origin = req.headers.get("origin");
  const originBase = origin ? normalizeBaseUrl(origin) : null;
  if (originBase) return originBase;

  // 3) Referer header
  const referer = req.headers.get("referer");
  const refererBase = referer ? normalizeBaseUrl(referer) : null;
  if (refererBase) return refererBase;

  // 4) Fallback env
  return normalizeBaseUrl(APP_URL_FALLBACK) || APP_URL_FALLBACK;
}

Deno.serve(async (req) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!stripe) {
    return new Response(
      JSON.stringify({
        error:
          "STRIPE_SECRET_KEY manquant. Configure ton secret Stripe dans les secrets de fonction.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const orderId = body.orderId;
    const rawAmount = body.amount;
    const returnUrl = body.returnUrl; // optionnel

    if (!orderId) {
      return new Response(JSON.stringify({ error: "orderId manquant." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let amountNumber = Number(rawAmount);
    if (!amountNumber || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      amountNumber = 1;
    }
    const amountInCents = Math.round(amountNumber * 100);

    // Base URL = returnUrl (si fourni) ou headers (origin/referer) ou APP_URL
    let baseUrl = null;
    if (returnUrl) baseUrl = normalizeBaseUrl(String(returnUrl));
    if (!baseUrl) baseUrl = guessBaseUrl(req);

    // URLs de retour Stripe
    const successUrl = `${baseUrl}/?checkout=success&orderId=${orderId}`;
    const cancelUrl = `${baseUrl}/?checkout=cancel&orderId=${orderId}`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: { name: `Dutyvia – Commande #${orderId}` },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    if (!session.url) {
      throw new Error("Stripe session created but no URL returned.");
    }

    return new Response(JSON.stringify({ url: session.url }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("💥 Erreur interne create-checkout-stripe:", err);
    return new Response(
      JSON.stringify({
        error: "Internal error in create-checkout-stripe",
        message: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
