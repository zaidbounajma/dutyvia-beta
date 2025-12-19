// supabase/functions/create-checkout-stripe/index.ts
// @ts-nocheck
//
// Crée une vraie session Stripe Checkout et renvoie session.url
// Reçoit { orderId, amount } depuis le front.

import Stripe from "https://esm.sh/stripe@12.18.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_URL = Deno.env.get("APP_URL") ?? "http://localhost:5173";
const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

const stripe =
  STRIPE_SECRET_KEY &&
  new Stripe(STRIPE_SECRET_KEY, {
    apiVersion: "2022-11-15",
    httpClient: Stripe.createFetchHttpClient(),
  });

Deno.serve(async (req) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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

    if (!orderId) {
      return new Response(
        JSON.stringify({ error: "orderId manquant dans la requête." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let amountNumber = Number(rawAmount);
    if (!amountNumber || !Number.isFinite(amountNumber) || amountNumber <= 0) {
      // fallback minimal si amount foire
      amountNumber = 1;
    }

    const amountInCents = Math.round(amountNumber * 100);

    // Création de la session Stripe Checkout
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `Dutyvia – Commande #${orderId}`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      success_url: `${APP_URL}/?checkout=success&orderId=${orderId}`,
      cancel_url: `${APP_URL}/?checkout=cancel&orderId=${orderId}`,
    });

    if (!session.url) {
      throw new Error("Stripe session created but no URL returned.");
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
