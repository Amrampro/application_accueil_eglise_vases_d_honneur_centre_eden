export function validHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password;
  } catch {
    return false;
  }
}
export function validMapUrl(value) {
  if (!validHttpsUrl(value)) return false;
  const url = new URL(value);
  return (
    !url.port &&
    ((url.hostname === "goo.gl" && url.pathname.startsWith("/maps/")) ||
      url.hostname === "maps.app.goo.gl" ||
      url.hostname === "maps.google.com" ||
      (["google.com", "www.google.com"].includes(url.hostname) &&
        url.pathname.startsWith("/maps")))
  );
}
export function embedFromMapUrl(value) {
  if (!validMapUrl(value)) return "";
  const url = new URL(value);
  if (url.pathname.startsWith("/maps/embed")) return url.href;
  const decoded = decodeURIComponent(url.href);
  const coordinates = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
  const query = coordinates
    ? `${coordinates[1]},${coordinates[2]}`
    : url.searchParams.get("query") || url.searchParams.get("q");
  if (!query) return "";
  const placeId = url.searchParams.get("query_place_id");
  return `https://www.google.com/maps?q=${encodeURIComponent(placeId ? "place_id:" + placeId : query)}&output=embed`;
}
export async function resolveMapEmbed(value, request = fetch) {
  let current = value;
  for (let hop = 0; hop < 6; hop++) {
    if (!validMapUrl(current)) throw new Error("Lien Google Maps invalide.");
    const embed = embedFromMapUrl(current);
    if (embed) return embed;
    const response = await request(current, {
      redirect: "manual",
      signal: AbortSignal.timeout(5000),
    });
    await response.body?.cancel();
    const next = response.headers.get("location");
    if (!next || response.status < 300 || response.status >= 400) break;
    current = new URL(next, current).href;
  }
  throw new Error(
    "Impossible de préparer la carte. Ajoutez l’URL de la carte intégrée obtenue dans Google Maps : Partager > Intégrer une carte (l’adresse src, sans le code iframe).",
  );
}
