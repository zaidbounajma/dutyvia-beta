// @ts-nocheck
// supabase/functions/create-order/index.ts
//
// MVP+ : crée une commande dans "orders" à partir du panier.
// - Attend { cartItems, user_id, request_id } en JSON.
// - Recalcule subtotal + commission 10% + total côté serveur.
// - INSERT dans orders avec total_eur + request_id.
// - Best effort: insert order_items + set requests.status='payment_pending' si request_id.
// - Répond toujours en 200 avec ok:true/false pour ne pas casser l'UX.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST,OPTIONS",
};

function json(data: any) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request): Promise<Response> => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "Method not allowed" });
  }

  const warnings: string[] = [];

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
    const SERVICE_ROLE_KEY =
      Deno.env.get("SERVICE_ROLE_KEY") ||
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
      "";

    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      console.error("❌ Env manquante:", {
        hasUrl: !!SUPABASE_URL,
        hasServiceKey: !!SERVICE_ROLE_KEY,
      });
      return json({
        ok: false,
        error:
          "Missing SUPABASE_URL or SERVICE_ROLE_KEY / SUPABASE_SERVICE_ROLE_KEY in Edge Function environment.",
      });
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const cartItems = Array.isArray(body?.cartItems) ? body.cartItems : [];
    const user_id = body?.user_id ?? null;

    // request_id normalisé en number si possible
    let request_id: number | null = null;
    if (body?.request_id != null && String(body.request_id).trim() !== "") {
      const n = Number(body.request_id);
      if (!Number.isNaN(n) && n > 0) request_id = n;
    }

    if (!cartItems.length) {
      return json({ ok: false, error: "Cart is empty" });
    }

    // 💰 Recalcul total côté serveur
    let subtotal = 0;
    const normalizedItems: any[] = [];

    for (const item of cartItems) {
      const unit = Number(item.unit_price_eur ?? item.base_price_eur ?? 0);
      const qty = Number(item.quantity ?? 1);

      if (!Number.isFinite(unit) || unit <= 0) continue;
      if (!Number.isFinite(qty) || qty <= 0) continue;

      subtotal += unit * qty;

      // Normalisation item pour insertion order_items
      normalizedItems.push({
        product_id: item.id ?? item.product_id ?? null,
        name: item.name ?? item.product_name ?? null,
        unit_price_eur: unit,
        quantity: qty,
      });
    }

    if (subtotal <= 0) {
      return json({ ok: false, error: "Cart subtotal is invalid" });
    }

    const commission = Math.round(subtotal * 0.1 * 100) / 100;
    const total = Math.round((subtotal + commission) * 100) / 100;

    // 1) INSERT dans orders
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id,
        request_id: request_id || null,
        total_eur: total,
        // optionnel si tes colonnes existent / contraintes ok
        // payment_status: "payment_pending",
        // status: "created",
      })
      .select("id, total_eur, created_at, request_id")
      .single();

    if (orderError || !order) {
      console.error("❌ Error inserting order:", orderError);
      return json({
        ok: false,
        error:
          orderError?.message ||
          orderError?.details ||
          "Error inserting order",
      });
    }

    const orderId = order.id;

    // 2) Best effort: INSERT order_items
    // ⚠️ Si ta table order_items a d'autres colonnes obligatoires/contraintes,
    // on n'échoue pas la commande : on ajoute un warning.
    try {
      if (normalizedItems.length > 0) {
        const rows = normalizedItems.map((it) => ({
          order_id: orderId,
          product_id: it.product_id,
          product_name: it.name,
          unit_price_eur: it.unit_price_eur,
          quantity: it.quantity,
          line_total_eur: Math.round(it.unit_price_eur * it.quantity * 100) / 100,
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(rows);

        if (itemsErr) {
          console.warn("⚠️ order_items insert blocked/failed:", itemsErr);
          warnings.push(`order_items insert warning: ${itemsErr.message || String(itemsErr)}`);
        }
      }
    } catch (e) {
      console.warn("⚠️ order_items insert exception:", e);
      warnings.push(`order_items insert exception: ${String(e)}`);
    }

    // 3) Best effort: passer la request liée en payment_pending
    if (request_id) {
      try {
        const { error: reqErr } = await supabase
          .from("requests")
          .update({ status: "payment_pending" })
          .eq("id", request_id)
          .in("status", ["open", "accepted"]);

        if (reqErr) {
          console.warn("⚠️ requests update warning:", reqErr);
          warnings.push(`requests update warning: ${reqErr.message || String(reqErr)}`);
        }
      } catch (e) {
        console.warn("⚠️ requests update exception:", e);
        warnings.push(`requests update exception: ${String(e)}`);
      }
    }

    return json({
      ok: true,
      orderId,
      total_eur: order.total_eur,
      created_at: order.created_at,
      request_id: order.request_id,
      warnings,
    });
  } catch (e) {
    console.error("❌ Internal error in create-order:", e);
    return json({
      ok: false,
      error: "Internal error in create-order",
      details: e instanceof Error ? e.message : String(e),
    });
  }
});
