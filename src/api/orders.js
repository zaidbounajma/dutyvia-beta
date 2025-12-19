import { supabase } from "../supabaseClient";

// petit helper pour savoir si une string ressemble à un uuid v4
function looksLikeUUID(str) {
  // format simple : 8-4-4-4-12 hex
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    str || ""
  );
}

export async function createOrder({ userId, items, serviceRate = 0.1 }) {
  console.log("[createOrder] incoming items:", items);

  // si le userId n'est PAS un uuid valide -> on simule direct
  if (!looksLikeUUID(userId)) {
    console.warn(
      "[createOrder] userId n'est pas un UUID Supabase. On passe en mode SIMULATION."
    );
    throw {
      step: "orders",
      message:
        "SIMULATION_ONLY: pas d'utilisateur Supabase (userId non-UUID). On n'insère pas en base.",
    };
  }

  // 1. fonction pour récupérer le prix unitaire, quelle que soit la clé
  function getUnitPrice(p) {
    return (
      p.price_eur ??
      p.unit_price_eur ?? // ancien format
      p.price ??
      0
    );
  }

  // 2. totaux globaux
  const subtotal = items.reduce(
    (sum, p) => sum + p.qty * getUnitPrice(p),
    0
  );
  const totalItems = items.reduce((sum, p) => sum + p.qty, 0);

  const platformCommission = subtotal * serviceRate;
  const grandTotal = subtotal + platformCommission;

  // 3. construire la commande
  const draftOrder = {
    user_id: userId,
    buyer_id: userId, // nullable mais on le met
    status: "created",
    total_items: totalItems,
    total_base_eur: subtotal,
    total_buyer_eur: subtotal,
    platform_comm_eur: platformCommission,
    total_eur: grandTotal,
  };

  console.log("[createOrder] draftOrder payload:", draftOrder);

  // 4. insérer dans "orders"
  const { data: orderData, error: orderErr } = await supabase
    .from("orders")
    .insert([draftOrder])
    .select("*")
    .single();

  if (orderErr) {
    console.error("[createOrder] insert orders error:", orderErr);
    throw {
      step: "orders",
      message: orderErr.message || "orders insert failed",
      details: orderErr.details,
      hint: orderErr.hint,
    };
  }

  const orderId = orderData.id;

  // 5. lignes order_items
  const lineItemsPayload = items.map((p) => {
    const unit = getUnitPrice(p);
    const lineTotal = unit * p.qty;

    const row = {
      order_id: orderId,
      product_id: p.id,
      product_name: p.name,

      qty: p.qty,

      unit_price_base_eur: unit,
      unit_price_buyer_eur: unit,

      line_base_eur: lineTotal,
      line_buyer_eur: lineTotal,

      platform_comm_eur: 0,
      traveler_comm_eur: 0,
      tax_eur: 0,
      discount_eur: 0,

      unit_price_eur: unit,
      line_total_eur: lineTotal,
    };

    console.log("[createOrder] line item row:", row);
    return row;
  });

  // 6. insert items
  const { data: itemsData, error: itemsErr } = await supabase
    .from("order_items")
    .insert(lineItemsPayload)
    .select("*");

  if (itemsErr) {
    console.error("[createOrder] insert order_items error:", itemsErr);
    throw {
      step: "order_items",
      message: itemsErr.message || "order_items insert failed",
      details: itemsErr.details,
      hint: itemsErr.hint,
    };
  }

  return {
    order: orderData,
    items: itemsData,
  };
}
