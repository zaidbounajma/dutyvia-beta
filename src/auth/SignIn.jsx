import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function SignIn() {
  const { signIn, signUp } = useAuth();

  const [email, setEmail] = useState("demo@dutyfree.test");
  const [password, setPassword] = useState("demo1234");

  const [mode, setMode] = useState("signin"); // "signin" | "signup"
  const [errorMsg, setErrorMsg] = useState("");
  const [okMsg, setOkMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setOkMsg("");

    try {
      if (mode === "signin") {
        // tentative login
        await signIn(email, password);
        setOkMsg("Connexion réussie ✅");
      } else {
        // tentative création compte
        const resSignup = await signUp(email, password);

        // Après signup, on tente direct de se connecter
        try {
          await signIn(email, password);
          setOkMsg(
            "Compte créé (ou déjà existant) et connecté ✅"
          );
        } catch (err2) {
          // si login refuse (ex: email doit être confirmé)
          console.warn("[SignIn] signIn after signUp failed:", err2);
          setOkMsg(
            "Compte créé. Vérifie ton email si confirmation requise."
          );
        }
      }
    } catch (err) {
      console.error("[SignIn] error:", err);
      setErrorMsg(err.message || "Erreur d'authentification");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-xs w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white shadow-xl shadow-black/40">
      <div className="text-center mb-4">
        <div className="text-white font-semibold text-lg">
          DutyFree
        </div>
        <div className="text-[12px] text-gray-400 leading-relaxed">
          {mode === "signin"
            ? "Connecte-toi pour continuer"
            : "Crée ton compte"}
        </div>
      </div>

      {errorMsg && (
        <div className="bg-red-600/20 border border-red-600/40 rounded-lg p-2 text-[12px] text-red-300 mb-3 whitespace-pre-wrap">
          {errorMsg}
        </div>
      )}

      {okMsg && (
        <div className="bg-green-600/20 border border-green-600/40 rounded-lg p-2 text-[12px] text-green-300 mb-3 whitespace-pre-wrap">
          {okMsg}
        </div>
      )}

      <form className="flex flex-col gap-3 text-[13px]" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-gray-300">Email</label>
          <input
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-blue-600/50"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value.trim())}
            required
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[12px] text-gray-300">Mot de passe</label>
          <input
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-[13px] outline-none focus:ring-2 focus:ring-blue-600/50"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="text-[11px] text-gray-500 leading-relaxed">
            Min 6 caractères.
          </div>
        </div>

        <button
          disabled={loading}
          className="mt-2 w-full rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 shadow-lg shadow-blue-600/30 disabled:opacity-40"
          type="submit"
        >
          {loading
            ? "..."
            : mode === "signin"
            ? "Se connecter"
            : "Créer mon compte"}
        </button>
      </form>

      <div className="text-[11px] text-gray-400 text-center mt-4">
        {mode === "signin" ? (
          <>
            Pas de compte ?{" "}
            <button
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={() => {
                setMode("signup");
                setErrorMsg("");
                setOkMsg("");
              }}
            >
              Créer un compte
            </button>
          </>
        ) : (
          <>
            Déjà un compte ?{" "}
            <button
              className="text-blue-400 hover:text-blue-300 underline"
              onClick={() => {
                setMode("signin");
                setErrorMsg("");
                setOkMsg("");
              }}
            >
              Se connecter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
