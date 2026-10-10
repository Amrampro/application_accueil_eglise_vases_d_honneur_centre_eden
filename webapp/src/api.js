const base = import.meta.env.VITE_API_URL || "/api";
export async function api(path, options = {}) {
  const token = sessionStorage.getItem("vh-token");
  let response;
  try {
    response = await fetch(base + path, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Connexion impossible. Vérifiez que l’API est démarrée.");
  }
  if (response.status === 204) return null;
  const data = await response
    .json()
    .catch(() => ({ message: "Réponse du serveur invalide." }));
  if (!response.ok) {
    if (response.status === 401) {
      sessionStorage.removeItem("vh-token");
      window.dispatchEvent(new Event("vh-session-expired"));
    }
    throw new Error(data.message || "Une erreur est survenue.");
  }
  return data;
}
