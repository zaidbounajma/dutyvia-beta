import "./styles.css";

export default function RootStep1() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-4">
      <header className="p-4 border-b border-gray-800 bg-gray-900 rounded-lg mb-6">
        <div className="text-white font-semibold text-lg">DutyFree (test étape 1)</div>
        <div className="text-[12px] text-gray-400">Juste styles + header</div>
      </header>

      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
        <div className="text-white font-semibold text-base mb-2">Étape 1 OK ✅</div>
        <div className="text-[13px] text-gray-300 leading-relaxed">
          Si tu lis ce message, <code>styles.css</code> ne crash pas l'app.
        </div>
      </div>
    </div>
  );
}
