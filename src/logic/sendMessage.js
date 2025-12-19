import supabase from '../supabase';

export async function sendMessage({ matchId, body }) {
  const user = (await supabase.auth.getUser())?.data?.user;
  if (!user) throw new Error("Non connecté");
  if (!body?.trim()) return;

  const { error } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: user.id,
      body: body.trim()
    });

  if (error) throw error;
}
