import supabase from '../supabase';

/**
 * Crée une demande à partir d’un produit du catalogue.
 * On enregistre product_id + infos pour fallback/affichage.
 * Le pricing/commissions se calculeront plus tard au match (trigger SQL).
 */
export async function createRequestFromProduct(product, {
  airport,
  meetup,
  qty,
  maxPriceOverride, // optionnel
}) {
  const user = (await supabase.auth.getUser())?.data?.user;
  if (!user) throw new Error("Non connecté");

  // base_price du catalogue pour afficher un “max_price” de sécurité (facultatif)
  const base_price = Number(product.base_price_eur ?? 0);
  const max_price = maxPriceOverride != null ? Number(maxPriceOverride) : base_price * qty;

  const row = {
    requester_id: user.id,
    product_id: product.id ?? null,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    airport,
    meetup_location: meetup,
    quantity: qty,
    max_price: max_price,      // utile pour affichage côté voyageur
    status: 'open',            // default aussi côté DB
  };

  const { data, error } = await supabase
    .from('requests')
    .insert(row)
    .select('id')
    .single();

  if (error) throw error;
  return data;
}
