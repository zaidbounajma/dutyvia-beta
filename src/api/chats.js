import { supabase } from "../supabaseClient";

/**
 * getUserChats(userId)
 *
 * Objectif :
 * - Récupérer les conversations (threads) où l'utilisateur apparaît
 * - Pour l'instant on ne filtre pas par userId car on ne connaît pas encore le nom exact des colonnes
 * - On log le résultat pour que tu me dises quelles colonnes il y a
 */
export async function getUserChats(userId) {
  const { data, error } = await supabase
    .from("df_threads")
    .select("*")
    .order("created_at", { ascending: false });

  console.log("getUserChats() raw df_threads =>", { data, error, userId });

  if (error) {
    console.error("getUserChats error:", error);
    throw error;
  }

  // Pour l'instant on mappe en version très générique
  // On ne sait pas encore les bons champs d'ID utilisateur,
  // donc on va juste afficher l'id du thread.
  return (data || []).map((thread) => {
    return {
      chatId: thread.id,
      otherUser: {
        id: "unknown",
        name: "Conversation " + thread.id,
      },
      lastMessage: "(chargement…)",
      lastAt: thread.updated_at || thread.created_at,
    };
  });
}

/**
 * getChatMessages(threadId)
 *
 * Charge tous les messages associés à un thread.
 * On suppose que df_messages a une colonne genre thread_id ou conversation_id.
 * On va essayer `thread_id` parce que c'est le plus probable,
 * et on log le résultat.
 */
export async function getChatMessages(threadId) {
  const { data, error } = await supabase
    .from("df_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  console.log("getChatMessages() raw df_messages =>", {
    threadId,
    data,
    error,
  });

  if (error) {
    console.error("getChatMessages error:", error);
    throw error;
  }

  // on renvoie brut pour l'instant
  return data || [];
}

/**
 * sendMessage(...)
 *
 * On essaie d'insérer un message dans df_messages.
 * Hypothèses de colonnes possibles:
 * - thread_id
 * - sender_id
 * - content / body / text
 *
 * On va tenter { thread_id, sender_id, content }
 * et on log la réponse. Si Supabase nous dit "column does not exist",
 * tu me dis les bons noms et je l'adapte.
 */
export async function sendMessage({ chatId, senderId, content }) {
  const { data, error } = await supabase
    .from("df_messages")
    .insert([
      {
        thread_id: chatId,
        sender_id: senderId,
        content: content,
      },
    ])
    .select("*")
    .single();

  console.log("sendMessage() insert into df_messages =>", {
    chatId,
    senderId,
    content,
    data,
    error,
  });

  if (error) {
    console.error("sendMessage error:", error);
    throw error;
  }

  return data;
}
