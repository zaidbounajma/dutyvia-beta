import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../supabaseClient";

export default function MyTravelers({ onOpenChat }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true); setErrorMsg("");
      try {
        const { data, error } = await supabase
          .from("requests")
          .select("id, requester_id, product_name, airport, meetup_location, status, created_at")
          .eq("requester_id", user.id)
          .in("status", ["accepted", "matched"])
          .order("created_at", { ascending: false });
        if (error) throw error;
        setRows(data || []);
      } catch (e) { setErrorMsg(e.message || String(e)); }
      finally { setLoading(false); }
    }
    if (user?.id) load();
  }, [user?.id]);

  return (
    <section className="max-w-xl w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-sm">
      <div className="text-white font-semibold text-lg">Mes voyageurs</div>
      {loading && <p className="text-[12px] text-gray-400">Chargement…</p>}
      {errorMsg && <div className="bg-red-600/20 border border-red-600/40 rounded p-2 text-[12px] mt-2">{errorMsg}</div>}
      {!loading && !errorMsg && rows.length === 0 && (
        <div className="text-[12px] text-gray-400">Rien pour l’instant. Dès qu’une demande est acceptée, elle apparaît ici.</div>
      )}
      <ul className="flex flex-col gap-3 mt-3">
        {rows.map(r => (
          <li key={r.id} className="bg-gray-800 border border-gray-700 rounded p-3 text-[12px]">
            <div className="flex justify-between items-start">
              <div className="font-semibold text-white text-[13px]">{r.product_name} · #{r.id}</div>
              <div className="px-2 py-1 rounded text-[11px] bg-green-600">Match trouvé</div>
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              {r.airport && <>Aéroport : <span className="text-gray-200">{r.airport}</span> · </>}
              {r.meetup_location && <>Remise : <span className="text-gray-200">{r.meetup_location}</span> · </>}
              Créée : {new Date(r.created_at).toLocaleString()}
            </div>
            <div className="mt-3">
              <button className="text-[11px] px-3 py-1.5 rounded bg-gray-700" onClick={() => onOpenChat?.(r.id)}>
                Ouvrir le chat
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
