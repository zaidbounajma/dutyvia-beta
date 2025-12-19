import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../supabaseClient";

export default function MyMatches() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    async function load() {
      if (!user?.id) {
        setErr("Pas d'utilisateur connecté.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setErr(null);

      // pareil que pour requests : on prend tout, puis on filtre
      const { data, error } = await supabase
        .from("matches")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("[MyMatches] raw matches:", { data, error });

      if (error) {
        setErr(error.message || "Erreur de chargement.");
        setMatches([]);
      } else {
        // on ne garde que ceux où l'utilisateur est l'acheteur
        const mine = (data || []).filter((m) => {
          return (
            m.user_id === user.id ||
            m.buyer_id === user.id ||
            m.requester_id === user.id
          );
        });

        setMatches(mine);
      }

      setLoading(false);
    }

    load();
  }, [user]);

  return (
    <div className="text-white text-sm max-w-xl mx-auto w-full">
      <div className="mb-4">
        <div className="text-white font-semibold text-lg">
          Mes voyageurs
        </div>
        <div className="text-[12px] text-gray-400 leading-relaxed">
          Les voyageurs qui ont accepté d'acheter pour toi.
          <br />
          Quand un match est confirmé, tu pourras discuter avec le voyageur.
        </div>
      </div>

      {loading && (
        <div className="text-gray-400 text-xs">
          Chargement...
        </div>
      )}

      {err && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-xl p-4 text-xs text-red-300 mb-4">
          <div className="font-semibold text-red-300 text-sm">
            ⚠ Erreur
          </div>
          <div className="mt-1 leading-relaxed">{err}</div>
        </div>
      )}

      {!loading && !err && matches.length === 0 && (
        <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4 text-[12px] text-gray-400 leading-relaxed">
          Aucun voyageur n'a encore accepté ta demande.
          <br />
          Dès qu'un voyageur se propose, il apparaîtra ici ✈
        </div>
      )}

      {!loading && !err && matches.length > 0 && (
        <div className="space-y-3">
          {matches.map((m) => (
            <div
              key={m.id}
              className="bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700/70 rounded-2xl p-4 shadow-xl shadow-black/40"
            >
              <div className="flex justify-between">
                <div className="text-white font-semibold text-sm">
                  Voyageur
                </div>
                <div className="text-[11px] text-gray-400">
                  {m.status || "en cours"}
                </div>
              </div>

              <div className="text-[12px] text-gray-300 mt-2 leading-relaxed">
                ID voyageur :{" "}
                <span className="text-white font-semibold">
                  {m.traveler_id || m.carrier_id || "—"}
                </span>
              </div>

              <div className="text-[12px] text-gray-300 leading-relaxed">
                Demande liée :{" "}
                <span className="text-white font-semibold">
                  {m.request_id || "—"}
                </span>
              </div>

              <div className="text-[11px] text-gray-500 mt-2">
                Match créé le{" "}
                {m.created_at
                  ? new Date(m.created_at).toLocaleString([], {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
              </div>

              <div className="text-[11px] text-blue-400 underline mt-3">
                Chat (bientôt)
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
