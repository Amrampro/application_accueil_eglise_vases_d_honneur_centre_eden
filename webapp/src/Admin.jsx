import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Flower2,
  LogOut,
  Plus,
  Search,
  ArrowUpRight,
  Check,
  Trash2,
  Pencil,
  Inbox,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { api } from "./api";
import { Modal, Notice } from "./Shared";
import { labels } from "./config";
import MediaUpload, { BatchPanoramas } from "./MediaUpload";
const fieldLabels = {
  name: "Nom",
  description: "Description",
  ministry_id: "Ministère",
  tour_id: "Lieu de visite",
  leader: "Responsable",
  phone: "Téléphone",
  email: "E-mail",
  kind: "Usage du contact",
  schedule: "Horaires / programme",
  location: "Lieu / quartier",
  starts_at: "Date et heure",
  role: "Rôle",
  image_url: "Photo",
  sort_order: "Ordre d’affichage",
  published: "Visible sur l’accueil",
  icon: "Icône (texte)",
  church_name: "Nom de l’église",
  tagline: "Phrase d’accueil",
  welcome_text: "Texte de bienvenue",
  address: "Adresse",
  service_times: "Horaires des cultes",
  hero_image: "URL de l’image d’accueil (HTTPS)",
};
const fields = {
  churches: [
    "name",
    "description",
    "address",
    "phone",
    "image_url",
    "sort_order",
    "published",
  ],
  tours: ["name", "description", "image_url", "sort_order", "published"],
  panoramas: [
    "name",
    "tour_id",
    "description",
    "image_url",
    "sort_order",
    "published",
  ],
  ministries: ["name", "description", "sort_order", "published"],
  departments: [
    "name",
    "ministry_id",
    "description",
    "leader",
    "phone",
    "sort_order",
    "published",
  ],
  schools: [
    "name",
    "description",
    "schedule",
    "location",
    "sort_order",
    "published",
  ],
  contacts: [
    "name",
    "description",
    "phone",
    "email",
    "kind",
    "sort_order",
    "published",
  ],
  events: [
    "name",
    "description",
    "starts_at",
    "location",
    "sort_order",
    "published",
  ],
  pastors: [
    "name",
    "description",
    "role",
    "image_url",
    "sort_order",
    "published",
  ],
  cells: [
    "name",
    "description",
    "location",
    "leader",
    "phone",
    "schedule",
    "sort_order",
    "published",
  ],
  settings: [
    "church_name",
    "tagline",
    "welcome_text",
    "address",
    "service_times",
    "hero_image",
  ],
};
const types = {
  appointment: "Rendez-vous pastoral",
  enrollment: "Inscription à une formation",
  prayer: "Intention de prière",
  testimony: "Témoignage",
};
const statuses = { new: "Nouvelle", in_progress: "En cours", done: "Traitée" };
function Editor({ resource, item, ministries, tours, onSaved }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      fields[resource].map((k) => [
        k,
        k === "published" ? (form.has(k) ? 1 : 0) : form.get(k) || "",
      ]),
    );
    if (body.starts_at) body.starts_at = new Date(body.starts_at).toISOString();
    try {
      await api(
        resource === "settings"
          ? "/admin/settings"
          : `/admin/content/${resource}${item?.id ? "/" + item.id : ""}`,
        { method: resource === "settings" || item?.id ? "PUT" : "POST", body },
      );
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form" onSubmit={submit}>
      <div className="form-grid">
        {fields[resource].map((key) => {
          let value =
            item?.[key] ??
            (key === "published" ? 1 : key === "sort_order" ? 0 : "");
          if (key === "starts_at" && value) {
            const date = new Date(value);
            value = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
              .toISOString()
              .slice(0, 16);
          }
          return (
            <label
              key={key}
              className={
                ["description", "welcome_text", "service_times"].includes(key)
                  ? "full"
                  : key === "published"
                    ? "checkbox full"
                    : ""
              }
            >
              {key === "published" ? (
                <>
                  <input
                    name={key}
                    type="checkbox"
                    defaultChecked={Boolean(value)}
                  />
                  {fieldLabels[key]}
                </>
              ) : (
                <>
                  {fieldLabels[key]}
                  {["name", "church_name", "ministry_id"].includes(key)
                    ? " *"
                    : ""}
                  {key === "ministry_id" ? (
                    <select name={key} defaultValue={value} required>
                      <option value="">Choisir un ministère</option>
                      {ministries.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  ) : key === "tour_id" ? (
                    <select name={key} defaultValue={value} required>
                      <option value="">Choisir un lieu</option>
                      {tours.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : ["image_url", "hero_image"].includes(key) ? (
                    <MediaUpload
                      name={key}
                      value={value}
                      panorama={resource === "panoramas"}
                      required={resource === "panoramas"}
                      onBusyChange={setBusy}
                    />
                  ) : key === "kind" ? (
                    <select name={key} defaultValue={value || "general"}>
                      {[
                        ["general", "Général"],
                        ["serve", "Intégration / servir"],
                        ["cells", "Familles / cellules"],
                        ["whatsapp", "WhatsApp"],
                        ["prayer", "Prière"],
                        ["marriage", "Mariage"],
                        ["tribes", "Tribus"],
                        ["testimony", "Témoignage"],
                      ].map(([k, l]) => (
                        <option key={k} value={k}>
                          {l}
                        </option>
                      ))}
                    </select>
                  ) : ["description", "welcome_text", "service_times"].includes(
                      key,
                    ) ? (
                    <textarea
                      name={key}
                      rows={4}
                      defaultValue={value}
                      maxLength={resource === "settings" ? 4000 : 10000}
                    />
                  ) : (
                    <input
                      name={key}
                      defaultValue={value}
                      type={
                        key === "starts_at"
                          ? "datetime-local"
                          : key === "sort_order"
                            ? "number"
                            : key === "email"
                              ? "email"
                              : "text"
                      }
                      min={key === "sort_order" ? 0 : undefined}
                      maxLength={resource === "settings" ? 4000 : 500}
                      required={["name", "church_name"].includes(key)}
                    />
                  )}
                </>
              )}
            </label>
          );
        })}
      </div>
      {error && <Notice>{error}</Notice>}
      <button className="button" disabled={busy}>
        {busy ? "Enregistrement…" : "Enregistrer"} <Check size={18} />
      </button>
    </form>
  );
}
export default function Admin() {
  const [token, setToken] = useState(sessionStorage.getItem("vh-token")),
    [verified, setVerified] = useState(false),
    [resource, setResource] = useState("dashboard"),
    [rows, setRows] = useState([]),
    [ministries, setMinistries] = useState([]),
    [tours, setTours] = useState([]),
    [batch, setBatch] = useState(false),
    [summary, setSummary] = useState(null),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [editor, setEditor] = useState(null),
    [deleting, setDeleting] = useState(null),
    [query, setQuery] = useState(""),
    [statusFilter, setStatusFilter] = useState("all");
  const generation = useRef(0);
  const logout = useCallback(() => {
    generation.current++;
    sessionStorage.removeItem("vh-token");
    setToken(null);
    setVerified(false);
    setRows([]);
    setSummary(null);
    setEditor(null);
    setResource("dashboard");
  }, []);
  useEffect(() => {
    window.addEventListener("vh-session-expired", logout);
    return () => window.removeEventListener("vh-session-expired", logout);
  }, [logout]);
  useEffect(() => {
    if (token)
      api("/admin/me")
        .then(() => setVerified(true))
        .catch((e) => {
          setError(e.message);
          logout();
        });
  }, [token, logout]);
  useEffect(() => {
    if (!verified) return;
    let timer;
    const activity = () => {
      clearTimeout(timer);
      timer = setTimeout(logout, 900000);
    };
    for (const event of ["pointerdown", "keydown", "scroll"])
      window.addEventListener(event, activity, { passive: true });
    activity();
    return () => {
      clearTimeout(timer);
      for (const event of ["pointerdown", "keydown", "scroll"])
        window.removeEventListener(event, activity);
    };
  }, [verified, logout]);
  const load = useCallback(async () => {
    if (!verified) return;
    const current = ++generation.current;
    setLoading(true);
    setError("");
    try {
      if (resource === "dashboard") {
        const entries = await Promise.all(
          Object.keys(labels).map(async (key) => [
            key,
            (await api("/admin/content/" + key)).length,
          ]),
        );
        const requests = await api("/admin/requests");
        if (current === generation.current)
          setSummary({ counts: Object.fromEntries(entries), requests });
      } else if (resource === "settings") {
        const result = await api("/admin/settings");
        if (current === generation.current) setRows(result);
      } else if (resource === "requests") {
        const result = await api("/admin/requests");
        if (current === generation.current) setRows(result);
      } else if (resource !== "password") {
        const [result, allMinistries, allTours] = await Promise.all([
          api("/admin/content/" + resource),
          api("/admin/content/ministries"),
          api("/admin/content/tours"),
        ]);
        if (current === generation.current) {
          setRows(result);
          setMinistries(allMinistries);
          setTours(allTours);
        }
      }
    } catch (e) {
      if (current === generation.current) setError(e.message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [resource, verified]);
  useEffect(() => {
    setQuery("");
    setStatusFilter("all");
    setRows([]);
    setMessage("");
    load();
  }, [load]);
  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api("/auth/login", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      sessionStorage.setItem("vh-token", result.token);
      setToken(result.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  async function remove() {
    setLoading(true);
    try {
      await api(
        resource === "requests"
          ? `/admin/requests/${deleting.id}`
          : `/admin/content/${resource}/${deleting.id}`,
        { method: "DELETE" },
      );
      setDeleting(null);
      setMessage("Élément supprimé.");
      await load();
    } catch (e) {
      setError(e.message);
      setDeleting(null);
    } finally {
      setLoading(false);
    }
  }
  async function changeStatus(row, status) {
    try {
      await api("/admin/requests/" + row.id, {
        method: "PATCH",
        body: { status },
      });
      await load();
      setMessage("Statut mis à jour.");
    } catch (e) {
      setError(e.message);
    }
  }
  async function password(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api("/admin/password", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      logout();
      setMessage(
        "Mot de passe modifié. Connectez-vous avec le nouveau mot de passe.",
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }
  if (!token)
    return (
      <div className="login-page">
        <div className="login-art">
          <Flower2 size={110} strokeWidth={0.8} />
          <h1>
            Au service
            <br />
            de notre <em>famille.</em>
          </h1>
          <p>Vases d’honneur · Centre Eden</p>
        </div>
        <div className="login-form">
          <Link className="text-link" to="/">
            ← Retour à l’accueil
          </Link>
          <span className="eyebrow">ESPACE ÉQUIPE</span>
          <h2>
            Bienvenue dans
            <br />
            l’administration.
          </h2>
          <p>Connectez-vous pour gérer les informations de l’église.</p>
          {error && <Notice>{error}</Notice>}
          {message && <Notice>{message}</Notice>}
          <form className="form" onSubmit={login}>
            <label>
              E-mail
              <input
                type="email"
                name="email"
                required
                autoComplete="username"
              />
            </label>
            <label>
              Mot de passe
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button className="button" disabled={loading}>
              {loading ? "Connexion…" : "Se connecter"}{" "}
              <ArrowUpRight size={18} />
            </button>
          </form>
        </div>
      </div>
    );
  if (!verified)
    return <div className="loading">Vérification de la session…</div>;
  const visible = Array.isArray(rows)
    ? rows.filter(
        (r) =>
          (resource !== "requests" ||
            statusFilter === "all" ||
            r.status === statusFilter) &&
          [r.name, r.first_name, r.last_name, r.phone, r.email, r.reason]
            .filter(Boolean)
            .join(" ")
            .toLocaleLowerCase("fr")
            .includes(query.toLocaleLowerCase("fr")),
      )
    : [];
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="brand" to="/">
          <img src="/images/logo.png" alt="Vases d’honneur" />
          <span>
            VASES D’HONNEUR<small>ADMINISTRATION</small>
          </span>
        </Link>
        <span className="eyebrow">VOTRE ESPACE</span>
        <button
          className={resource === "dashboard" ? "active" : ""}
          onClick={() => setResource("dashboard")}
        >
          <ChurchIcon /> Vue d’ensemble
        </button>
        <button
          className={resource === "requests" ? "active" : ""}
          onClick={() => setResource("requests")}
        >
          <Inbox size={18} /> Demandes reçues
        </button>
        <span className="eyebrow">CONTENUS DE L’ÉGLISE</span>
        {Object.entries(labels).map(([key, label]) => (
          <button
            key={key}
            className={resource === key ? "active" : ""}
            onClick={() => setResource(key)}
          >
            {label}
          </button>
        ))}
        <span className="eyebrow">PARAMÈTRES</span>
        <button
          className={resource === "settings" ? "active" : ""}
          onClick={() => setResource("settings")}
        >
          <Settings size={18} /> Informations générales
        </button>
        <button onClick={() => setResource("password")}>
          <ShieldCheck size={18} /> Mot de passe
        </button>
        <button onClick={logout}>
          <LogOut size={18} /> Déconnexion
        </button>
      </aside>
      <main className="admin-main">
        <div className="admin-top">
          <span>Centre Eden / Administration</span>
          <Link to="/" className="text-link">
            Voir l’accueil <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="section-heading">
          <div>
            <span className="eyebrow">GESTION DE L’ÉGLISE</span>
            <h1>
              {labels[resource] ||
                {
                  dashboard: "Vue d’ensemble",
                  requests: "Demandes reçues",
                  settings: "Informations générales",
                  password: "Mot de passe",
                }[resource]}
            </h1>
          </div>
          {resource === "panoramas" && (
            <button className="button secondary" onClick={() => setBatch(true)}>
              <Plus size={18} /> Ajouter plusieurs photos 360°
            </button>
          )}
          {labels[resource] && (
            <button className="button" onClick={() => setEditor({})}>
              <Plus size={18} /> Ajouter
            </button>
          )}
        </div>
        {error && <Notice>{error}</Notice>}
        {message && <Notice>{message}</Notice>}
        {loading ? (
          <div className="loading">Chargement…</div>
        ) : resource === "dashboard" && summary ? (
          <>
            <div className="stats-grid">
              <article>
                <small>Nouvelles demandes</small>
                <strong>
                  {summary.requests.filter((r) => r.status === "new").length}
                </strong>
                <button
                  className="text-link"
                  onClick={() => setResource("requests")}
                >
                  Ouvrir la boîte de réception →
                </button>
              </article>
              {Object.entries(summary.counts)
                .slice(0, 3)
                .map(([key, n]) => (
                  <article key={key}>
                    <small>{labels[key]}</small>
                    <strong>{n}</strong>
                    <button
                      className="text-link"
                      onClick={() => setResource(key)}
                    >
                      Gérer →
                    </button>
                  </article>
                ))}
            </div>
            <div className="callout">
              <Check />
              <div>
                <h3>Votre accueil, toujours à jour.</h3>
                <p>
                  Les modifications enregistrées sont visibles à la prochaine
                  ouverture d’une page de l’accueil. Vous pouvez masquer un
                  contenu sans le supprimer.
                </p>
              </div>
            </div>
            <h2 className="spaced">Dernières demandes</h2>
            {summary.requests.slice(0, 5).map((r) => (
              <div className="request-summary" key={r.id}>
                <span>
                  <strong>
                    {r.first_name} {r.last_name}
                  </strong>
                  <small>{types[r.type]}</small>
                </span>
                <span className="badge">{statuses[r.status]}</span>
              </div>
            ))}
            {!summary.requests.length && (
              <Notice>Aucune demande pour le moment.</Notice>
            )}
          </>
        ) : resource === "settings" && rows.church_name ? (
          <Editor
            key="settings"
            resource="settings"
            item={rows}
            ministries={[]}
            tours={[]}
            onSaved={() => {
              setMessage("Informations enregistrées.");
              load();
            }}
          />
        ) : resource === "password" ? (
          <form className="form narrow" onSubmit={password}>
            <label>
              Mot de passe actuel
              <input
                name="current"
                type="password"
                required
                autoComplete="current-password"
              />
            </label>
            <label>
              Nouveau mot de passe (12 caractères minimum)
              <input
                name="password"
                type="password"
                minLength={12}
                maxLength={72}
                required
                autoComplete="new-password"
              />
            </label>
            <button className="button">Modifier le mot de passe</button>
          </form>
        ) : (
          <>
            <div className="filter-bar">
              <label className="search">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Rechercher…"
                />
              </label>
              {resource === "requests" && (
                <select
                  aria-label="Filtrer par statut"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Tous les statuts</option>
                  {Object.entries(statuses).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              )}
              <span>{visible.length} résultat(s)</span>
            </div>
            {resource === "requests" ? (
              <div className="request-list">
                {visible.map((r) => (
                  <article className="request-card" key={r.id}>
                    <div className="section-heading">
                      <div>
                        <span className="eyebrow">{types[r.type]}</span>
                        <h3>
                          {r.first_name} {r.last_name}
                        </h3>
                      </div>
                      <select
                        aria-label="Statut de la demande"
                        value={r.status}
                        onChange={(e) => changeStatus(r, e.target.value)}
                      >
                        {Object.entries(statuses).map(([k, v]) => (
                          <option key={k} value={k}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                    <small>
                      {new Date(r.created_at).toLocaleString("fr-FR")}
                    </small>
                    <p className="pre-line">{r.reason}</p>
                    <p>
                      {[
                        r.sex,
                        r.need_type,
                        r.preferred_date &&
                          "Date souhaitée : " +
                            new Date(r.preferred_date).toLocaleDateString(
                              "fr-FR",
                            ),
                        r.school_name,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <div className="request-actions">
                      {r.phone && (
                        <a href={"tel:" + r.phone.replace(/\s/g, "")}>
                          {r.phone}
                        </a>
                      )}
                      {r.email && <a href={"mailto:" + r.email}>{r.email}</a>}
                      <button
                        className="danger text-link"
                        onClick={() => setDeleting(r)}
                      >
                        <Trash2 size={16} /> Supprimer
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="admin-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Informations</th>
                      <th>Publication</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <small>
                            {row.ministry_id &&
                              ministries.find((m) => m.id === row.ministry_id)
                                ?.name}
                          </small>
                        </td>
                        <td>
                          {row.description?.slice(0, 100) ||
                            row.phone ||
                            row.location ||
                            "À compléter"}
                        </td>
                        <td>
                          <span
                            className={
                              "badge " + (!row.published ? "muted" : "")
                            }
                          >
                            {row.published ? "Publié" : "Masqué"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button
                              aria-label={"Modifier " + row.name}
                              className="icon-button"
                              onClick={() => setEditor(row)}
                            >
                              <Pencil size={17} />
                            </button>
                            <button
                              aria-label={"Supprimer " + row.name}
                              className="icon-button danger"
                              onClick={() => setDeleting(row)}
                            >
                              <Trash2 size={17} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {!visible.length && (
              <Notice>
                Aucun élément.{" "}
                {resource !== "requests" &&
                  "Ajoutez votre premier contenu avec le bouton Ajouter."}
              </Notice>
            )}
          </>
        )}
        {editor && (
          <Modal
            title={editor.id ? "Modifier le contenu" : "Ajouter un contenu"}
            onClose={() => setEditor(null)}
          >
            <Editor
              resource={resource}
              item={editor}
              ministries={ministries}
              tours={tours}
              onSaved={() => {
                setEditor(null);
                setMessage("Contenu enregistré.");
                load();
              }}
            />
          </Modal>
        )}
        {batch && (
          <Modal
            title="Ajouter plusieurs photos 360°"
            onClose={() => setBatch(false)}
          >
            {tours.length ? (
              <BatchPanoramas
                tours={tours}
                onSaved={() => {
                  setBatch(false);
                  setMessage("Photos enregistrées.");
                  load();
                }}
              />
            ) : (
              <Notice>
                Créez d’abord un lieu dans « Lieux de visite », puis ajoutez ses
                photos ici.
              </Notice>
            )}
          </Modal>
        )}
        {deleting && (
          <Modal
            title="Supprimer cet élément ?"
            onClose={() => setDeleting(null)}
          >
            <p>
              {deleting.name || `${deleting.first_name} ${deleting.last_name}`}{" "}
              sera supprimé définitivement. Un ministère contenant des
              départements ou une formation liée à des inscriptions ne peut pas
              être supprimé.
            </p>
            <div className="hero-actions">
              <button
                className="button danger-button"
                onClick={remove}
                disabled={loading}
              >
                Confirmer la suppression
              </button>
              <button
                className="button secondary"
                onClick={() => setDeleting(null)}
              >
                Annuler
              </button>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}
function ChurchIcon() {
  return <Flower2 size={18} />;
}
