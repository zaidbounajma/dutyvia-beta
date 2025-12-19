// src/logic/createRequest.js
import supabase from '../supabase';

export async function createRequestFromProduct(product, { airport, meetup, qty }) {
  // 1) Récupérer l'utilisateur courant
  const { data: auth, error: authErr } = await supabase.auth.getUser();
  if (authErr || !auth?.user?.id) {
    throw new Error("Non connecté : impossible de créer la demande");
  }
  const requesterId = auth.user.id;

  // 2) Construire la ligne request
  const row = {
    requester_id: requesterId,                 // ⟵ IMPORTANT
    product_id: product.id ?? null,            // si tu as une FK produit
    product_name: product.name,
    brand: product.brand ?? null,
    category: product.category ?? 'autre',
    max_price: product.base_price ?? null,     // ou ton champ max_price si différent
    price_at_request: product.base_price ?? null,
    airport: (airport || 'CDG').toUpperCase(),
    meetup_location: meetup || null,
    status: 'open',
    // si tu stockes la quantité :
    quantity: qty ?? 1
  };

  // 3) Insert
  const { data, error } = await supabase
    .from('requests')
    .insert([row])
    .select()
    .single();

  if (error) throw error;
  return data; // renvoie la request créée
}
