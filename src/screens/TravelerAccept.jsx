import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase } from "../supabaseClient";

/**
 * Liste les demandes OPEN pour que le voyageur puisse en accepter une.
 * - Filtres simples : aéroport + recherche texte
 * - Bouton "Accepter" -> status='accepted', traveler_id = auth.uid()
 * - Après acceptation, la ligne disparaît de la liste (car n’est plus OPEN)
 */
export default function TravelerAccept({ onAccepted }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [errorMsg, setErrorMsg] = useState("");

  const [airport, setAirport] = useState("");    // filtre par aéroport
  const [q, setQ] = useState("");               // recherche texte
  const [acceptingId, setAcceptingId] = useState(null);

  // Charger les demandes OPEN visibles par tous (policy req_select_open)
  async function loadOpen() {
    setLoading(true); setErrorMsg("");
    try {
      let query = supabase
        .from("requests")
        .select("id, requester_id, product_name, brand, category, quantity, max_price, airport, meetup_location, status, created_at")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(100);

      if (airport.trim()) query = query.eq("airport", airport.trim());

      const { data, error } = await query;
      if (error) throw error;

      let list = data || [];
      if (q.trim()) {
        const qq = q.trim().toLowerCase();
        list = list.filter(r =>
          (r.product_name || "").toLowerCase().includes(qq) ||
          (r.brand || "").toLowerCase().includes(qq) ||
          (r.category || "").toLowerCase().includes(qq)
        );
      }

      setRows(list);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [airport]);

  const airports = useMemo(() => {
    const uniq = new Set((rows || []).map(r => r.airport).filter(Boolean));
    return ["", ...Array.from(uniq)];
  }, [rows]);

  async function acceptRequest(reqId) {
    if (!user?.id) {
      return alert("Connecte-toi pour accepter une demande.");
    }
    setAcceptingId(reqId);
    setErrorMsg("");
    try {
      // Mise à jour qui déclenche la policy req_traveler_accept_open:
      // - la ligne doit être OPEN (USING)
      // - le résultat doit être ACCEPTED + traveler_id = auth.uid() (WITH CHECK)
      const { error } = await supabase
        .from("requests")
        .update({ status: "accepted", traveler_id: user.id })
        .eq("id", reqId)
        .eq("status", "open");
      if (error) throw error;

      // Retire localement + callback
      setRows(prev => prev.filter(r => r.id !== reqId));
      onAccepted?.(reqId);
    } catch (e) {
      setErrorMsg(e.message || String(e));
    } finally {
      setAcceptingId(null);
    }
  }

  return (
    <section className="max-w-2xl w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white text-sm">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="text-white font-semibold text-lg">Demandes à accepter</div>
        <button onClick={loadOpen} className="text-[11px] px-3 py-1.5 rounded bg-gray-800 border border-gray-700">
          Rafraîchir
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <select
          value={airport}
          onChange={e => setAirport(e.target.value)}
          className="text-[12px] bg-gray-800 border border-gray-700 rounded px-2 py-1"
          title="Filtrer par aéroport"
        >
          {airports.map(a => (
            <option key={a || "all"} value={a}>{a ? `Aéroport: ${a}` : "Tous les aéroports"}</option>
          ))}
        </select>

        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Rechercher (produit, marque, catégorie)"
          className="flex-1 text-[12px] bg-gray-800 border border-gray-700 rounded px-2 py-1"
          onKeyDown={(e) => { if (e.key === "Enter") loadOpen(); }}
        />
        <button onClick={loadOpen} className="text-[11px] px-3 py-1.5 rounded bg-blue-600">
          Rechercher
        </button>
      </div>

      {loading && <div className="text-[12px] text-gray-400">Chargement…</div>}
      {errorMsg && <div className="bg-red-600/20 border border-red-600/40 rounded p-2 text-[12px] text-red-300 mb-3">{errorMsg}</div>}
      {!loading && !errorMsg && rows.length === 0 && (
        <div className="text-[12px] text-gray-400">Aucune demande ouverte pour l’instant.</div>
      )}

      <ul className="flex flex-col gap-3">
        {rows.map(r => (
          <li key={r.id} className="bg-gray-800 border border-gray-700 rounded p-3">
            <div className="flex justify-between items-start gap-2">
              <div className="font-semibold text-white text-[13px]">
                {r.product_name} <span className="text-gray-400">· #{r.id}</span>
              </div>
              <div className="px-2 py-1 rounded text-[11px] bg-blue-600">En attente</div>
            </div>

            <div className="text-[11px] text-gray-400 mt-1">
              {r.brand && <>Marque : <span className="text-gray-200">{r.brand}</span> · </>}
              {r.category && <>Catégorie : <span className="text-gray-200">{r.category}</span> · </>}
              Quantité : <span className="text-gray-200">{r.quantity ?? 1}</span> ·
              Budget max : <span className="text-gray-200">{r.max_price ?? "—"} €</span>
            </div>
            <div className="text-[11px] text-gray-400">
              Aéroport : <span className="text-gray-200">{r.airport || "—"}</span> ·
              Remise : <span className="text-gray-200">{r.meetup_location || "—"}</span>
            </div>
            <div className="text-[11px] text-gray-500">Créée : {new Date(r.created_at).toLocaleString()}</div>

            <div className="mt-3 flex gap-2">
              <button
                className="text-[11px] px-3 py-1.5 rounded bg-green-600 hover:bg-green-500 disabled:opacity-40"
                onClick={() => acceptRequest(r.id)}
                disabled={acceptingId === r.id}
              >
                {acceptingId === r.id ? "Acceptation…" : "Accepter"}
              </button>
              {/* Bouton détail si besoin plus tard */}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
