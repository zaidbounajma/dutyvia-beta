import { supabase } from "../supabaseClient";

// comme avant, on veut un uuid pour attribuer la demande à un user réel.
// si pas d'uuid (utilisateur démo), on simule.
function looksLikeUUID(str) {
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
    str || ""
  );
}

/**
 * Crée une "request" par produit demandé.
 * items = [{ name, qty, price_eur / unit_price_eur }]
 */
export async function createRequestsForOrder({ userId, items }) {
  console.log("[createRequestsForOrder] incoming:", { userId, items });

  // si user pas uuid -> pas d'insertion, on simule
  if (!looksLikeUUID(userId)) {
    console.warn(
      "[createRequestsForOrder] userId pas UUID => simulation, pas d'insert dans `requests`."
    );
    throw {
      step: "requests",
      message:
        "SIMULATION_ONLY: pas d'utilisateur Supabase (userId non-UUID). Pas d'insertion dans requests.",
    };
  }

  // mappe chaque produit du panier -> une ligne request
  const rows = items.map((p) => {
    const unitPrice =
      p.price_eur ??
      p.unit_price_eur ??
      p.price ??
      0;

    return {
      // on ne sait pas encore si ta table s'attend à buyer_id ou user_id,
      // alors on va essayer les deux. Supabase ignorera la colonne inconnue.
      buyer_id: userId,
      user_id: userId,

      product_name: p.name,
      price_eur: unitPrice,
      status: "open", // en attente de voyageur
      // created_at laissé à la DB
    };
  });

  console.log("[createRequestsForOrder] draft rows:", rows);

  const { data, error } = await supabase
    .from("requests")
    .insert(rows)
    .select("*");

  if (error) {
    console.error("[createRequestsForOrder] insert error:", error);
    throw {
      step: "requests",
      message: error.message || "requests insert failed",
      details: error.details,
      hint: error.hint,
    };
  }

  console.log("[createRequestsForOrder] inserted:", data);

  return data;
}
