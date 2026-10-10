import { useState } from "react";
import { Upload, Check } from "lucide-react";
import { api } from "./api";
import { Notice } from "./Shared";
const base = import.meta.env.VITE_API_URL || "/api";
export function mediaUrl(url) {
  if (url?.startsWith("/api/media/") && base !== "/api")
    return base.replace(/\/$/, "") + url.slice(4);
  return url;
}
export async function upload(file, panorama = false) {
  if (file.size > 32 * 1024 * 1024) throw new Error("La photo dépasse 32 Mo.");
  const response = await fetch(base + "/admin/media", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + sessionStorage.getItem("vh-token"),
      "Content-Type": file.type || "application/octet-stream",
      "X-Media-Type": panorama ? "panorama" : "photo",
    },
    body: file,
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.message || "Impossible de téléverser la photo.");
  return result;
}
export default function MediaUpload({
  name,
  value = "",
  panorama = false,
  required = false,
  onBusyChange,
}) {
  const [url, setUrl] = useState(value),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function select(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    onBusyChange?.(true);
    setError("");
    try {
      const r = await upload(file, panorama);
      setUrl(r.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      onBusyChange?.(false);
      e.target.value = "";
    }
  }
  return (
    <span className="media-field">
      <input
        name={name}
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Téléversez une image ou collez son URL HTTPS"
        required={required}
      />
      <span className="upload-label">
        <Upload size={18} />
        {busy ? "Téléversement…" : "Choisir une photo"}
        <input
          aria-label={
            panorama ? "Téléverser une photo 360°" : "Téléverser une photo"
          }
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy}
          onChange={select}
        />
      </span>
      {panorama && (
        <small>
          Photo 360° équirectangulaire 2:1. JPEG, PNG ou WebP, 32 Mo maximum.
        </small>
      )}
      {url && (
        <img
          className="media-preview"
          src={mediaUrl(url)}
          alt="Aperçu de la photo"
        />
      )}
      {error && <Notice>{error}</Notice>}
    </span>
  );
}
export function BatchPanoramas({ tours, onSaved }) {
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const f = new FormData(e.currentTarget),
      files = f.getAll("photos");
    let added = 0;
    const failures = [];
    for (const file of files) {
      try {
        const image = await upload(file, true);
        await api("/admin/content/panoramas", {
          method: "POST",
          body: {
            name: file.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
            tour_id: Number(f.get("tour_id")),
            image_url: image.url,
            published: 1,
            sort_order: added,
          },
        });
        added++;
      } catch (err) {
        failures.push(file.name + " : " + err.message);
      }
    }
    setBusy(false);
    if (!failures.length) onSaved();
    else
      setMessage(`${added} photo(s) enregistrée(s). ${failures.join(" / ")}`);
  }
  return (
    <form className="form" onSubmit={submit}>
      <p>
        Ajoutez plusieurs points de vue à un lieu. Chaque photo pourra ensuite
        être renommée, réordonnée ou masquée.
      </p>
      <label>
        Lieu *
        <select name="tour_id" required>
          <option value="">Choisir un lieu</option>
          {tours.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
      <label>
        Photos 360° *
        <input
          name="photos"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          required
        />
      </label>
      <small>
        Photos équirectangulaires 2:1, au moins 1024 × 512 pixels, 32 Mo maximum
        par photo.
      </small>
      {message && <Notice>{message}</Notice>}
      <button className="button" disabled={busy}>
        {busy ? "Enregistrement des photos…" : "Enregistrer les photos"}
        <Check size={18} />
      </button>
    </form>
  );
}
