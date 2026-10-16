const base = import.meta.env?.VITE_API_URL || "/api";
export async function memberApi(path, options = {}) {
  const admin = path.startsWith("/admin/");
  const token = sessionStorage.getItem(admin ? "vh-token" : "vh-member-token");
  const response = await fetch(base + path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  }).catch(() => {
    throw new Error("Connexion impossible. Réessayez dans un instant.");
  });
  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem(admin ? "vh-token" : "vh-member-token");
      window.dispatchEvent(
        new Event(admin ? "vh-session-expired" : "vh-member-expired"),
      );
    }
    const result = await response.json().catch(() => ({}));
    throw new Error(
      result.message || "Impossible de réaliser cette opération.",
    );
  }
  if (options.download) return response.blob();
  return response.status === 204 ? null : response.json();
}
export const ageRanges = {
  "10-20": "10–20 ans",
  "21-30": "21–30 ans",
  "31-35": "31–35 ans",
  "36-45": "36–45 ans",
  "46+": "46 ans et plus",
};
export const maritalStatuses = {
  single: "Célibataire",
  engaged: "Fiancé(e)",
  married: "Marié(e)",
  cohabiting: "Concubinage",
  divorced: "Divorcé(e)",
  separated: "Séparé(e)",
  widowed: "Veuf / veuve",
};
export const channels = {
  person: "Une personne",
  internet: "Internet",
  flyer: "Prospectus / prospection",
  evangelism: "Évangélisation",
  other: "Autre",
};
export const actionKinds = {
  call: "Appel",
  visit: "Visite",
  message: "Message",
};
export const formatDay = (value) =>
  value
    ? new Date(value).toLocaleDateString("fr-FR", {
        timeZone: "Europe/Brussels",
      })
    : "—";
export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("fr-FR", { timeZone: "Europe/Brussels" })
    : "—";
export const localDateTime = (value) => {
  const date = value ? new Date(value) : new Date();
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Brussels",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  })
    .format(date)
    .replace(" ", "T");
};
export function actionDateToIso(value) {
  const requested = Date.parse(value + ":00Z");
  if (!Number.isFinite(requested)) throw new Error("Date et heure invalides.");
  const shown = Date.parse(localDateTime(new Date(requested)) + ":00Z");
  const result = new Date(requested - (shown - requested));
  if (localDateTime(result) !== value)
    throw new Error(
      "Cette heure n’existe pas lors du changement d’heure. Choisissez une autre heure.",
    );
  return result.toISOString();
}
