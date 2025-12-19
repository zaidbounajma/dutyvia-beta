import { useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { supabase } from "../supabaseClient";

export default function Checkout({ goCart }) {
  const { items, clearCart } = useCart();
  const { user } = useAuth();

  const [creating, setCreating] = useState(false);
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // récup du prix unitaire avec fallback
  function getUnitPrice(item) {
    if (typeof item.unit_price_eur === "number") return item.unit_price_eur;
    if (typeof item.unit_price_base_eur === "number") return item.unit_price_base_eur;
    if (typeof item.price_eur === "number") return item.price_eur;
    if (typeof item.price === "number") return item.price;
    return 0;
  }

  // on normalise le panier pour travailler proprement
  const normalizedItems = useMemo(() => {
    return items.map((it) => {
      const unitPrice = getUnitPrice(it);

      return {
        id: it.id ?? it.product_id ?? null,
        product_name: it.name ?? it.product_name ?? "Produit",
        brand: it.brand ?? it.maker ?? null,
        category: it.category ?? it.type ?? null,
        qty: it.qty ?? 1,
        unitPrice,
      };
    });
  }, [items]);

  // totaux
  const subTotalLines = normalizedItems.reduce(
    (sum, it) => sum + it.unitPrice * it.qty,
    0
  );
  const serviceFee = subTotalLines * 0.1;
  const estimatedTotal = subTotalLines + serviceFee;

  async function handleCreateOrder() {
    setCreating(true);
    setErrorMsg("");
    setDone(false);

    // sécurité de base
    if (!user || !user.id) {
      setErrorMsg("Pas d'utilisateur Supabase connecté.");
      setCreating(false);
      return;
    }

    if (normalizedItems.length === 0) {
      setErrorMsg("Panier vide.");
      setCreating(false);
      return;
    }

    try {
      //
      // 1. Créer la commande principale dans "orders"
      //
      const orderPayload = {
        buyer_id: user.id,
        user_id: user.id,
        status: "created",
        total_items: normalizedItems.length,
        total_base_eur: subTotalLines,
        total_buyer_eur: subTotalLines,
        platform_comm_eur: serviceFee,
        total_eur: estimatedTotal,
      };

      const { data: orderInsertData, error: orderErr } = await supabase
        .from("orders")
        .insert(orderPayload)
        .select("id")
        .single();

      if (orderErr) {
        console.error("[Checkout] insert orders error:", orderErr);
        throw new Error("orders: " + (orderErr.message || JSON.stringify(orderErr)));
      }

      const newOrderId = orderInsertData.id;
      console.log("[Checkout] new order id:", newOrderId);

      //
      // 2. Insérer les lignes (produits du panier) dans "order_items"
      //
      for (const line of normalizedItems) {
        const lineTotal = line.unitPrice * line.qty;
        const platformComm = lineTotal * 0.1;

        const linePayload = {
          order_id: newOrderId,
          product_id: line.id,
          product_name: line.product_name,
          qty: line.qty,

          unit_price_base_eur: line.unitPrice,
          unit_price_buyer_eur: line.unitPrice,

          line_base_eur: lineTotal,
          line_buyer_eur: lineTotal,

          platform_comm_eur: platformComm,
          traveler_comm_eur: 0,
          tax_eur: 0,
          discount_eur: 0,

          // champ libre qui existe chez toi
          unit_price_eur: line.unitPrice,

          // ⚠ surtout PAS line_total_eur (colonne générée dans la DB)
        };

        const { error: itemErr } = await supabase
          .from("order_items")
          .insert(linePayload);

        if (itemErr) {
          console.error("[Checkout] insert order_items error:", itemErr);
          throw new Error("order_items: " + (itemErr.message || JSON.stringify(itemErr)));
        }
      }

      //
      // 3. Créer la demande "requests" pour connecter avec un voyageur
      //
      // On prend le premier article du panier comme produit demandé
      const first = normalizedItems[0];

      // max_price = combien l'acheteur est prêt à payer pour CET item
      const maxPrice = Math.round(first.unitPrice * first.qty);

      // Valeurs par défaut pour la démo (à rendre dynamiques plus tard)
      const defaultAirport = "CDG";
      const defaultMeetup = "CDG T2, Hall Arrivées, 18:00-18:30";

      // On force des valeurs par défaut pour les champs NOT NULL
      const safeProductName =
        first.product_name && first.product_name.trim() !== ""
          ? first.product_name
          : "Produit duty free";

      const safeCategory =
        first.category && first.category.trim() !== ""
          ? first.category
          : "autre"; // important : pas null

      const safeBrand =
        first.brand && first.brand.trim() !== ""
          ? first.brand
          : "N/A";

      const requestPayload = {
        requester_id: user.id,          // ← c'est TOI (uuid actuel)
        airport: defaultAirport,
        product_name: safeProductName,
        brand: safeBrand,
        category: safeCategory,
        quantity: first.qty,
        max_price: maxPrice,
        meetup_location: defaultMeetup,
        status: "open",
      };

      const { error: reqErr } = await supabase
        .from("requests")
        .insert(requestPayload);

      if (reqErr) {
        console.error("[Checkout] insert requests error:", reqErr);
        throw new Error("requests: " + (reqErr.message || JSON.stringify(reqErr)));
      }

      //
      // 4. Succès : on clean le panier et on affiche le message vert
      //
      clearCart();
      setDone(true);
    } catch (err) {
      console.error("[Checkout] general error:", err);
      // ça va s'afficher dans le bloc rouge en haut du paiement
      setErrorMsg(err.message || String(err));
    } finally {
      setCreating(false);
    }
  }

  // panier vide + pas encore de succès
  if (normalizedItems.length === 0 && !done) {
    return (
      <section className="max-w-xl w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white shadow-xl shadow-black/40 text-sm">
        <div className="text-white font-semibold text-lg flex items-center gap-2">
          Paiement
        </div>
        <div className="text-[12px] text-gray-400 leading-relaxed">
          Ton panier est vide.
        </div>
        <button
          className="mt-4 text-[12px] px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white"
          onClick={goCart}
        >
          ← Panier
        </button>
      </section>
    );
  }

  // succès total (commande ok + request publiée)
  if (done) {
    return (
      <section className="max-w-xl w-full bg-gray-900 border border-green-600/50 rounded-xl p-4 text-white shadow-xl shadow-black/40 text-sm">
        <div className="text-white font-semibold text-lg mb-2">
          ✅ Commande créée !
        </div>
        <div className="text-[12px] text-gray-300 leading-relaxed">
          Ta demande a été publiée pour les voyageurs ✈
        </div>

        <div className="text-[11px] text-gray-500 leading-relaxed mt-2">
          Tu peux suivre le statut dans "Mes demandes".
        </div>

        <button
          className="mt-4 text-[12px] px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30"
          onClick={goCart}
        >
          Retour au panier
        </button>
      </section>
    );
  }

  // affichage normal du checkout avant clic
  return (
    <section className="max-w-xl w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white shadow-xl shadow-black/40 text-sm">
      <div className="text-white font-semibold text-lg flex items-center gap-2">
        Paiement
      </div>

      <div className="text-[12px] text-gray-400 leading-relaxed mb-4">
        Récapitulatif de ta commande
      </div>

      <button
        className="text-[12px] px-3 py-2 rounded bg-gray-800 border border-gray-700 text-white mb-4"
        onClick={goCart}
        disabled={creating}
      >
        ← Panier
      </button>

      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-2 text-[12px] text-red-300 mb-4 whitespace-pre-wrap">
          <div className="font-semibold text-red-300">⚠ Erreur</div>
          <div>Impossible de créer la commande.</div>
          <div>Message: {errorMsg}</div>
        </div>
      )}

      <ul className="text-[13px] text-gray-100 mb-4">
        {normalizedItems.map((it, idx) => (
          <li key={idx} className="mb-1">
            {it.product_name} × {it.qty} • {(it.unitPrice * it.qty).toFixed(2)} €
          </li>
        ))}
      </ul>

      <div className="text-[13px] text-gray-200 mb-1">
        Sous-total lignes :{" "}
        <span className="font-semibold">
          {subTotalLines.toFixed(2)} €
        </span>
      </div>

      <div className="text-[13px] text-gray-200 mb-1">
        Commission service (+10%) :{" "}
        <span className="font-semibold">
          {serviceFee.toFixed(2)} €
        </span>
      </div>

      <div className="text-[13px] text-gray-100 font-semibold mb-3">
        Total estimé : {estimatedTotal.toFixed(2)} €
      </div>

      <div className="text-[11px] text-gray-400 leading-relaxed mb-4">
        Après validation :
        1) ta commande est enregistrée,
        2) une demande est publiée pour les voyageurs,
        3) tu pourras suivre dans "Mes demandes".
      </div>

      <button
        disabled={creating}
        className="text-[12px] px-3 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-600/30 disabled:opacity-40"
        onClick={handleCreateOrder}
      >
        {creating
          ? "Création de la demande..."
          : "Confirmer la commande"}
      </button>
    </section>
  );
}
