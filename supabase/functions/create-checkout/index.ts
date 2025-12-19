// @ts-nocheck
// supabase/functions/create-checkout/index.ts
// Version DUMMY : pas de Stripe, juste une redirection propre vers l'app.

const APP_URL = Deno.env.get("APP_URL") || "http://localhost:5173";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

Deno.serve(async (req: Request): Promise<Response> => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({
        ok: false,
        error: "Method not allowed. Use POST.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const body: any = await req.json().catch(() => ({}));
    const orderId = body?.orderId;
    const amountEur = Number(body?.amountEur || 0);

    console.log("➡️ create-checkout DUMMY – body reçu:", body);

    if (!orderId) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Missing orderId in request body",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!amountEur || amountEur <= 0) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: "Invalid amountEur in request body",
          amountEur,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Ici on FAIT COMME SI le paiement avait réussi
    const redirectUrl = APP_URL; // tu peux mettre `${APP_URL}/checkout-success?orderId=${orderId}` si tu veux une page dédiée

    return new Response(
      JSON.stringify({
        ok: true,
        url: redirectUrl,
        debug: { orderId, amountEur },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("💥 create-checkout DUMMY error:", err);

    return new Response(
      JSON.stringify({
        ok: false,
        error: "Internal error in dummy create-checkout",
        details: String(err),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
