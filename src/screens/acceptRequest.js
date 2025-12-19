// src/logic/acceptRequest.js
import { Alert } from 'react-native';
import supabase from '../supabase';

/**
 * Crée (ou récupère) un match pour (requestId, travelerId)
 * et NE TOUCHE PAS au status de la demande.
 *
 * Retourne { matchId } si OK, ou null si erreur.
 */
export async function acceptRequest({ requestId, travelerId }) {
  try {
    // 1) Vérifier si un match existe déjà pour ce duo
    const { data: existing, error: findErr } = await supabase
      .from('matches')
      .select('id')
      .eq('request_id', requestId)
      .eq('traveler_id', travelerId)
      .limit(1)
      .maybeSingle();

    if (findErr) throw findErr;

    if (existing?.id) {
      // Déjà créé → retourner l’existant
      return { matchId: existing.id };
    }

    // 2) Sinon créer le match
    const { data: inserted, error: insertErr } = await supabase
      .from('matches')
      .insert([{ request_id: requestId, traveler_id: travelerId, status: 'accepted' }])
      .select('id')
      .single();

    if (insertErr) throw insertErr;

    return { matchId: inserted.id };
  } catch (e) {
    console.error('acceptRequest error:', e);
    Alert.alert('Erreur', e.message || 'Impossible de créer le match.');
    return null;
  }
}
