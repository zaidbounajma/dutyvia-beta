import supabase from '../supabase';

/**
 * Le voyageur accepte une demande -> crée un match.
 * Le trigger SQL calcule automatiquement prix/commissions et met la demande à 'accepted'.
 */
export async function acceptRequest(requestId) {
  const user = (await supabase.auth.getUser())?.data?.user;
  if (!user) throw new Error("Non connecté");

  // un match par request (contrainte uniq_match_request côté DB)
  const { data, error } = await supabase
    .from('matches')
    .insert({
      request_id: requestId,
      traveler_id: user.id,
      status: 'accepted',
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
