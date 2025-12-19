import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { getUserChats } from "../api/chats.js";

export default function Conversations({ onSelectChat }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [chats, setChats] = useState([]);
  const [errMsg, setErrMsg] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setErrMsg("Pas d'utilisateur connecté.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrMsg(null);

      try {
        const list = await getUserChats(user.id);
        setChats(list);
      } catch (e) {
        console.error("Conversations load() error:", e);
        setErrMsg("Erreur de chargement (check console).");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  return (
    <div className="p-4 space-y-3 text-white text-sm">
      <div className="text-white font-semibold text-sm">
        Mes conversations
      </div>

      {loading && (
        <div className="text-gray-400 text-xs">
          Chargement...
        </div>
      )}

      {errMsg && (
        <div className="text-red-400 text-xs">
          {errMsg}
        </div>
      )}

      {!loading && !errMsg && chats.length === 0 && (
        <div className="text-gray-400 text-xs">
          Aucune conversation trouvée.
        </div>
      )}

      {!loading && !errMsg && chats.length > 0 && (
        <div className="space-y-2">
          {chats.map((c) => (
            <button
              key={c.chatId}
              className="w-full text-left bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-700 px-4 py-3 flex flex-col"
              onClick={() => onSelectChat(c.chatId, c.otherUser)}
            >
              <div className="flex items-center justify-between text-white font-medium">
                <span>{c.otherUser.name}</span>
                <span className="text-[10px] text-gray-400">
                  {c.lastAt
                    ? new Date(c.lastAt).toLocaleString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                        day: "2-digit",
                        month: "2-digit",
                      })
                    : ""}
                </span>
              </div>
              <div className="text-[12px] text-gray-300 line-clamp-1">
                {c.lastMessage || "(pas de preview)"}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
