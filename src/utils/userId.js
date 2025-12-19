// src/utils/userId.js
// Génère / récupère un identifiant utilisateur Dutyvia basé sur le localStorage.
// Cette fois on génère un VRAI uuid compatible avec les colonnes Postgres uuid.

const UUID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/;

// Petit fallback pour générer un uuid v4 "à la main" si crypto.randomUUID n'existe pas
function generateUuidFallback() {
  let dt = new Date().getTime();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (dt + Math.random() * 16) % 16 | 0;
    dt = Math.floor(dt / 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getDutyviaUserId() {
  if (typeof window === "undefined") return null;

  const KEY = "dutyvia_user_id";

  try {
    const existing = window.localStorage.getItem(KEY);

    // 🔎 Si on a déjà quelque chose et que ça ressemble à un vrai uuid → on le garde
    if (existing && UUID_REGEX.test(existing)) {
      return existing;
    }

    // Sinon : soit rien, soit un vieux "user_xxx" invalide → on génère un nouveau uuid
    const newId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : generateUuidFallback();

    window.localStorage.setItem(KEY, newId);
    return newId;
  } catch {
    // Si localStorage est cassé, on renvoie null
    return null;
  }
}
