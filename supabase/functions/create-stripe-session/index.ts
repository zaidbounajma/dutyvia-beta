// supabase/functions/create-stripe-session/index.ts
// @ts-nocheck
//
// Crée une session Stripe Checkout à partir du panier.
// Attend { cartItems, request_id } en JSON.
// Retourne { url } pour rediriger l'utilisateur.
//
// À configurer via `supabase secrets set` :
// - STRIPE_SECRET_KEY       = ta clé secrète Stripe (sk_test_...)
// - STRIPE_SUCCESS_URL      = URL complète de retour en cas de succès (ex: http://localhost:5173)
// - STRIPE_CANCEL_URL       = URL complète de retour en cas d'annulation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "npm:stripe@13.10.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const SUCCESS_URL = Deno.env.get("STRIPE_SUCCESS_URL");
    const CANCEL_URL = Deno.env.get("STRIPE_CANCEL_URL");

    if (!STRIPE_SECRET_KEY || !SUCCESS_URL || !CANCEL_URL) {
      const msg =
        "Missing STRIPE_SECRET_KEY, STRIPE_SUCCESS_URL or STRIPE_CANCEL_URL in Edge Function environment.";
      console.error("❌ Stripe env manquantes:", {
        hasKey: !!STRIPE_SECRET_KEY,
        hasSuccess: !!SUCCESS_URL,
        hasCancel: !!CANCEL_URL,
      });
      return new Response(
        JSON.stringify({ error: msg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ⚠️ Important : on instancie Stripe ici (et pas en top-level) pour éviter certains soucis
    const stripe = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16",
    });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const cartItems = Array.isArray(body?.cartItems) ? body.cartItems : [];
    const request_id = body?.request_id ?? null;

    if (!cartItems.length) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Construction des line_items Stripe
    const line_items = cartItems
      .map((item) => {
        const unit = Number(
          item.unit_price_eur ?? item.base_price_eur ?? 0,
        );
        const qty = Number(item.quantity ?? 1);
        const name =
          item.name ||
          item.product_label ||
          item.product_name ||
          "Article Dutyvia";

        if (!Number.isFinite(unit) || unit <= 0) {
          return null;
        }

        return {
          quantity: qty > 0 ? qty : 1,
          price_data: {
            currency: "eur",
            product_data: {
              name,
            },
            // Stripe attend des centimes
            unit_amount: Math.round(unit * 100),
          },
        };
      })
      .filter(Boolean);

    if (!line_items.length) {
      return new Response(
        JSON.stringify({
          error:
            "Impossible de créer le paiement Stripe : panier invalide (prix à 0 ?).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url: SUCCESS_URL,
      cancel_url: CANCEL_URL,
      metadata: {
        request_id: request_id ? String(request_id) : "",
        source: "dutyvia",
      },
    });

    if (!session.url) {
      const msg = "Stripe session created but no URL returned.";
      console.error("❌", msg, session);
      return new Response(
        JSON.stringify({ error: msg }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("❌ Internal error in create-stripe-session:", e);
    return new Response(
      JSON.stringify({
        error:
          e?.message ||
          "Internal error in create-stripe-session (voir logs Supabase).",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
