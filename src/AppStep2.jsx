import { useState } from "react";
import "./styles.css";

export default function AppStep2() {
  const [screen, setScreen] = useState("home");

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="p-4 border-b border-gray-800 bg-gray-900 flex flex-wrap items-start gap-2 text-sm">
        <div className="flex-1 min-w-[150px]">
          <div className="font-medium text-white">DutyFree</div>

          <div className="text-[12px] text-gray-400">
            demo@dutyfree.test
          </div>
          <div className="text-[11px] text-gray-500 break-all">
            demo-user-123
          </div>
        </div>

        <nav className="flex gap-2 flex-wrap text-[12px]">
          <TabButton
            active={screen === "home"}
            onClick={() => setScreen("home")}
            label="Home"
          />
          <TabButton
            active={screen === "catalog"}
            onClick={() => setScreen("catalog")}
            label="Catalogue"
          />
          <TabButton
            active={screen === "cart"}
            onClick={() => setScreen("cart")}
            label="Panier"
          />
          <TabButton
            active={screen === "checkout"}
            onClick={() => setScreen("checkout")}
            label="Paiement"
          />
          <TabButton
            active={screen === "requests"}
            onClick={() => setScreen("requests")}
            label="Mes demandes"
          />
          <TabButton
            active={screen === "matches"}
            onClick={() => setScreen("matches")}
            label="Mes voyageurs"
          />

          <button
            className="px-3 py-1 rounded bg-gray-700 border border-gray-600 text-white font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Logout
          </button>
        </nav>
      </header>

      <main className="flex-1 p-4">
        {screen === "home" && (
          <SectionCard
            title="Home"
            desc="Écran d'accueil. (Step2 version light)"
          />
        )}

        {screen === "catalog" && (
          <SectionCard
            title="Catalogue"
            desc="Ici on affichera les produits duty free."
          />
        )}

        {screen === "cart" && (
          <SectionCard
            title="Panier"
            desc="Ici le contenu du panier utilisateur."
          />
        )}

        {screen === "checkout" && (
          <SectionCard
            title="Paiement"
            desc="Ici le récap + confirmation de commande."
          />
        )}

        {screen === "requests" && (
          <SectionCard
            title="Mes demandes"
            desc="Ici les demandes envoyées aux voyageurs."
          />
        )}

        {screen === "matches" && (
          <SectionCard
            title="Mes voyageurs"
            desc="Ici les voyageurs qui ont accepté."
          />
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded ${
        active
          ? "bg-blue-600 text-white font-medium"
          : "bg-gray-800 border border-gray-700 text-white font-medium"
      }`}
    >
      {label}
    </button>
  );
}

// une mini carte visuelle
function SectionCard({ title, desc }) {
  return (
    <section className="max-w-xl w-full bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-gray-700/70 rounded-2xl p-4 shadow-xl shadow-black/40 text-sm mb-6">
      <div className="text-white font-semibold text-lg mb-1">{title}</div>
      <div className="text-[12px] text-gray-400 leading-relaxed">
        {desc}
      </div>
    </section>
  );
}
