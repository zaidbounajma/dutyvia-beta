// supabase/functions/confirm-payment/index.ts
// @ts-nocheck
//
// MVP: on marque une commande comme "payée" dans la table orders.
// - Attend { orderId } en JSON (string ou number).
// - Met payment_status = 'paid'.
// - NE TOUCHE PLUS À "status" (pour éviter le check constraint).

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

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
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const rawId = body?.orderId ?? body?.order_id;

    // 🔹 On accepte string ou number, on force en number
    const orderId = Number(rawId);

    if (!orderId || !Number.isFinite(orderId)) {
      return new Response(
        JSON.stringify({ error: "orderId manquant ou invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1) Vérifier que la commande existe (optionnel, mais plus propre)
    const { data: existingOrder, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();

    if (orderError) {
      console.error("❌ Erreur lecture order:", orderError);
      // On ne bloque pas forcément si la ligne existe déjà mais erreur de lecture
    }

    if (!existingOrder) {
      console.error("❌ Order non trouvée pour id=", orderId);
      return new Response(
        JSON.stringify({ error: `Order not found for id=${orderId}` }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 2) Mettre payment_status = 'paid' (et seulement ça)
    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({
        payment_status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .select("*")
      .single();

    if (updateError || !updatedOrder) {
      console.error(
        "❌ Erreur update paiement:",
        updateError || "no updatedOrder"
      );
      return new Response(
        JSON.stringify({
          error: "Failed to update payment_status",
          details:
            updateError?.message ||
            updateError?.hint ||
            updateError?.details ||
            updateError ||
            null,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Order #${orderId} marked as paid (payment_status).`,
        order: updatedOrder,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("❌ Internal error in confirm-payment:", e);
    return new Response(
      JSON.stringify({
        error: "Internal error in confirm-payment",
        details: e instanceof Error ? e.message : String(e),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
