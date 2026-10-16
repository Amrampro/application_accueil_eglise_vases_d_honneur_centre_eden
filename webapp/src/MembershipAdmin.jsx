import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  Download,
  Users,
  Search,
  ArrowLeft,
} from "lucide-react";
import { Modal, Notice } from "./Shared";
import {
  memberApi,
  ageRanges,
  maritalStatuses,
  channels,
  actionKinds,
  formatDay,
  formatDateTime,
  localDateTime,
  actionDateToIso,
} from "./member-api";
import "./membership.css";
function useData(path) {
  const [data, setData] = useState(null),
    [error, setError] = useState(""),
    [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    memberApi(path)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [path, version]);
  return { data, error, reload };
}
function Pagination({ data, onPage }) {
  if (!data) return null;
  const pages = Math.max(1, Math.ceil(data.total / 20));
  return (
    <div className="member-pagination">
      <span>
        {data.total} membre(s) · Page {data.page} sur {pages} · 20 par page
      </span>
      <div>
        <button
          className="button secondary"
          disabled={data.page <= 1}
          onClick={() => onPage(data.page - 1)}
        >
          Précédent
        </button>
        <button
          className="button secondary"
          disabled={data.page >= pages}
          onClick={() => onPage(data.page + 1)}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}
function SearchBox({
  onSearch,
  placeholder = "Rechercher un nom ou un téléphone",
}) {
  return (
    <form
      className="member-search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(new FormData(e.currentTarget).get("q"));
      }}
    >
      <label>
        <Search size={18} />
        <input
          aria-label={placeholder}
          name="q"
          placeholder={placeholder}
          maxLength={255}
        />
      </label>
      <button className="button secondary">Rechercher</button>
    </form>
  );
}
function Confirm({ title, children, onConfirm, onClose }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal title={title} onClose={onClose}>
      <p>{children}</p>
      {error && <Notice>{error}</Notice>}
      <div className="hero-actions">
        <button
          className="button danger-button"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onClose();
            } catch (e) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          }}
        >
          Confirmer
        </button>
        <button className="button secondary" onClick={onClose}>
          Annuler
        </button>
      </div>
    </Modal>
  );
}
export function MemberPicker({
  name,
  label,
  initial,
  admin = true,
  required = false,
  onPick,
}) {
  const [selected, setSelected] = useState(initial || null),
    [query, setQuery] = useState(""),
    [result, setResult] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    setResult(null);
    if (query.trim().length < 2)
      return () => {
        active = false;
      };
    const timer = setTimeout(() => {
      memberApi(
        `${admin ? "/admin/membership/members" : "/member/directory"}?q=${encodeURIComponent(query)}`,
      )
        .then((d) => {
          if (active) {
            setResult(d);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, admin]);
  function pick(member) {
    setSelected(member);
    setQuery("");
    setResult(null);
    onPick?.(member);
  }
  return (
    <div className="member-picker">
      <label>
        {label}
        {required ? " *" : ""}
        <input name={name} type="hidden" value={selected?.id || ""} />
        <input
          aria-label={label}
          value={
            selected ? `${selected.full_name} · ${selected.phone || ""}` : query
          }
          onChange={(e) => {
            setSelected(null);
            onPick?.(null);
            setQuery(e.target.value);
          }}
          placeholder="Rechercher par nom ou téléphone (2 caractères min.)"
          required={required && !selected}
          autoComplete="off"
          maxLength={255}
        />
      </label>
      {selected && (
        <button type="button" className="text-link" onClick={() => pick(null)}>
          Effacer la sélection
        </button>
      )}
      {error && <Notice>{error}</Notice>}
      {result && (
        <div className="member-picker-results">
          {result.rows.map((m) => (
            <button type="button" key={m.id} onClick={() => pick(m)}>
              <strong>{m.full_name}</strong>
              <span>
                {m.phone} · {m.municipality || "Commune non renseignée"}
              </span>
            </button>
          ))}
          {!result.rows.length && <p>Aucun membre trouvé.</p>}
          {result.total > 20 && (
            <small>20 premiers résultats. Précisez votre recherche.</small>
          )}
        </div>
      )}
    </div>
  );
}
function MemberTable({ data, onOpen, actions }) {
  return (
    <>
      <div className="admin-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Nom et prénoms</th>
              <th>Téléphone</th>
              <th>Commune</th>
              <th>Adhésion</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((m) => (
              <tr key={m.id}>
                <td>
                  <button className="text-link" onClick={() => onOpen(m)}>
                    {m.full_name}
                  </button>
                  <small>{m.sex === "male" ? "Homme" : "Femme"}</small>
                </td>
                <td>{m.phone}</td>
                <td>{m.municipality || "—"}</td>
                <td>{formatDay(m.joined_on)}</td>
                <td>
                  <div className="table-actions">
                    <button
                      className="button secondary"
                      onClick={() => onOpen(m)}
                    >
                      Fiche complète
                    </button>
                    {actions?.(m)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.rows.length && <Notice>Aucun membre pour cette recherche.</Notice>}
    </>
  );
}
function ActionForm({ prefix, memberId, action, onSaved }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const body = Object.fromEntries(new FormData(e.currentTarget));
    try {
      body.scheduled_at = actionDateToIso(body.scheduled_at);
      if (body.completed_at)
        body.completed_at = actionDateToIso(body.completed_at);
      await memberApi(
        action
          ? `${prefix}/actions/${action.id}`
          : `${prefix}/members/${memberId}/actions`,
        { method: action ? "PUT" : "POST", body },
      );
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="form action-form" onSubmit={submit}>
      <h3>
        {action
          ? "Mettre à jour le suivi"
          : "Programmer ou enregistrer une action"}
      </h3>
      <div className="form-grid">
        {!action && (
          <label>
            Action
            <select name="kind" required>
              {Object.entries(actionKinds).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          État
          <select name="status" defaultValue={action?.status || "planned"}>
            <option value="planned">À faire</option>
            <option value="completed">Réalisée</option>
          </select>
        </label>
        <label>
          Date et heure de l’action
          <input
            type="datetime-local"
            name="scheduled_at"
            defaultValue={localDateTime(action?.scheduled_at)}
            required
          />
        </label>
        {action && (
          <label>
            Réalisée le (si terminée)
            <input
              type="datetime-local"
              name="completed_at"
              defaultValue={
                action.completed_at ? localDateTime(action.completed_at) : ""
              }
            />
          </label>
        )}
      </div>
      <p className="member-help">
        Les dates et heures sont exprimées à l’heure de Bruxelles.
      </p>
      <label>
        Observation *
        <textarea
          name="observation"
          rows={4}
          defaultValue={action?.observation || ""}
          maxLength={10000}
          required
        />
      </label>
      {error && <Notice>{error}</Notice>}
      <button className="button" disabled={busy}>
        {busy
          ? "Enregistrement…"
          : action
            ? "Enregistrer le suivi"
            : "Enregistrer l’action"}
      </button>
    </form>
  );
}
export function MemberProfile({ path, onClose, groupPrefix }) {
  const { data: m, error, reload } = useData(path),
    [editing, setEditing] = useState(null),
    [actionVersion, setActionVersion] = useState(0);
  const details = m
    ? {
        Sexe: m.sex === "male" ? "Homme" : "Femme",
        Téléphone: m.phone,
        Quartier: m.neighborhood,
        Commune: m.municipality,
        Profession: m.profession,
        "Communauté fréquentée": m.community,
        "Fréquentation régulière": m.attends_regularly ? "Oui" : "Non",
        "Tranche d’âge": ageRanges[m.age_range],
        "Situation matrimoniale": maritalStatuses[m.marital_status],
        "Culte n°": m.service_number,
        Adhésion: formatDay(m.joined_on),
        "Fiche enregistrée le": formatDateTime(m.created_at),
        "Nom de la personne qui l’a invité": m.referrer_name,
        "Contact de cette personne": m.referrer_contact,
        "Autre canal": m.referral_other,
      }
    : {};
  let referral = [];
  if (m) {
    try {
      referral = JSON.parse(m.referral_channels);
    } catch {
      referral = [];
    }
  }
  return (
    <Modal title={m ? m.full_name : "Fiche membre"} onClose={onClose}>
      {error && <Notice>{error}</Notice>}
      {!m && !error && <p>Chargement…</p>}
      {m && (
        <div className="member-profile">
          <dl className="member-detail-grid">
            {Object.entries(details).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v || "Non renseigné"}</dd>
              </div>
            ))}
            <div>
              <dt>A connu l’église par</dt>
              <dd>
                {referral.map((c) => channels[c]).join(", ") || "Non renseigné"}
              </dd>
            </div>
          </dl>
          <h3>Commentaires et précisions</h3>
          <p className="pre-line">{m.notes || "Aucun commentaire."}</p>
          <h3>Groupes</h3>
          <p>{m.groups.map((g) => g.name).join(", ") || "Aucun groupe."}</p>
          <h3>Ma décision aujourd’hui</h3>
          {m.decisions.map((d, i) => (
            <details className="member-decision-detail" key={i}>
              <summary>
                {d.decision_number}. {d.meaning}
              </summary>
              <p className="pre-line">{d.directive}</p>
            </details>
          ))}
          {!m.decisions.length && <p>Aucune décision sélectionnée.</p>}
          <h3 className="spaced">Historique du suivi</h3>
          {!m.actions.length && <p>Aucune action enregistrée.</p>}
          <div className="member-timeline">
            {m.actions.map((a) => (
              <article key={a.id}>
                <div className="section-heading">
                  <strong>
                    {actionKinds[a.kind]} ·{" "}
                    {a.status === "planned" ? "À faire" : "Réalisée"}
                  </strong>
                  {groupPrefix &&
                    Number(groupPrefix.split("/").at(-1)) === a.group_id && (
                      <button
                        className="text-link"
                        onClick={() => setEditing(a)}
                      >
                        Mettre à jour
                      </button>
                    )}
                </div>
                <p>
                  {formatDateTime(a.scheduled_at)} ·{" "}
                  {a.current_group_name || a.group_name} · {a.actor_name}
                </p>
                {a.completed_at && (
                  <p>Réalisée le {formatDateTime(a.completed_at)}</p>
                )}
                <p className="pre-line">{a.observation}</p>
              </article>
            ))}
          </div>
          {groupPrefix && (
            <ActionForm
              key={`new-${actionVersion}`}
              prefix={groupPrefix}
              memberId={m.id}
              onSaved={() => {
                setActionVersion((v) => v + 1);
                reload();
              }}
            />
          )}
          {editing && (
            <ActionForm
              key={editing.id}
              prefix={groupPrefix}
              memberId={m.id}
              action={editing}
              onSaved={() => {
                setEditing(null);
                reload();
              }}
            />
          )}
        </div>
      )}
    </Modal>
  );
}
export function MemberManagement() {
  const [tab, setTab] = useState("members"),
    [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [from, setFrom] = useState(localDateTime().slice(0, 10)),
    [to, setTo] = useState(localDateTime().slice(0, 10)),
    [profile, setProfile] = useState(null);
  const query = new URLSearchParams({
    page: String(page),
    q,
    ...(tab === "new" ? { from, to } : {}),
  });
  const { data, error, reload } = useData("/admin/membership/members?" + query);
  return (
    <div className="membership-admin">
      <div
        className="member-tabs"
        role="tablist"
        aria-label="Liste des membres"
      >
        <button
          role="tab"
          aria-selected={tab === "members"}
          onClick={() => {
            setTab("members");
            setPage(1);
          }}
        >
          Membres
        </button>
        <button
          role="tab"
          aria-selected={tab === "new"}
          onClick={() => {
            setTab("new");
            setPage(1);
          }}
        >
          Nouveaux
        </button>
      </div>
      {tab === "new" && (
        <div className="member-date-filter">
          <label>
            Adhésion du
            <input
              type="date"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label>
            Au
            <input
              type="date"
              min={from}
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <p>
            Pour une journée précise, choisissez la même date dans les deux
            champs.
          </p>
        </div>
      )}
      <SearchBox
        onSearch={(value) => {
          setQ(value);
          setPage(1);
        }}
      />
      {error && (
        <Notice>
          {error} <button onClick={reload}>Réessayer</button>
        </Notice>
      )}
      {data ? (
        <>
          <MemberTable data={data} onOpen={setProfile} />
          <Pagination data={data} onPage={setPage} />
        </>
      ) : (
        !error && <p>Chargement…</p>
      )}
      {profile && (
        <MemberProfile
          path={`/admin/membership/members/${profile.id}`}
          onClose={() => setProfile(null)}
        />
      )}
    </div>
  );
}
function DecisionEditor({ item, onSaved, onClose }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={item.id ? "Modifier la décision" : "Ajouter une décision"}
      onClose={onClose}
    >
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await memberApi(
              "/admin/membership/decisions" + (item.id ? `/${item.id}` : ""),
              {
                method: item.id ? "PUT" : "POST",
                body: Object.fromEntries(new FormData(e.currentTarget)),
              },
            );
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Numéro de décision
          <input
            name="decision_number"
            type="number"
            min="1"
            max="4294967295"
            defaultValue={item.decision_number || ""}
            required
          />
        </label>
        <label>
          Décision / signification
          <textarea
            name="meaning"
            rows={3}
            maxLength={500}
            defaultValue={item.meaning || ""}
            required
          />
        </label>
        <label>
          Directive
          <textarea
            name="directive"
            rows={7}
            maxLength={10000}
            defaultValue={item.directive || ""}
            required
          />
        </label>
        {error && <Notice>{error}</Notice>}
        <button className="button" disabled={busy}>
          Enregistrer
        </button>
      </form>
    </Modal>
  );
}
export function DecisionManagement() {
  const { data, error, reload } = useData("/admin/membership/decisions"),
    [editor, setEditor] = useState(null),
    [deleting, setDeleting] = useState(null);
  return (
    <div>
      <div className="section-heading">
        <p>
          Ces décisions sont proposées dans le formulaire des nouveaux membres.
        </p>
        <button className="button" onClick={() => setEditor({})}>
          <Plus size={18} /> Ajouter une décision
        </button>
      </div>
      {error && <Notice>{error}</Notice>}
      {data && (
        <div className="admin-table-wrap">
          <table>
            <thead>
              <tr>
                <th>N° de décision</th>
                <th>Décision / signification</th>
                <th>Directive</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.id}>
                  <td>{d.decision_number}</td>
                  <td>{d.meaning}</td>
                  <td className="decision-directive pre-line">{d.directive}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="icon-button"
                        aria-label={`Modifier la décision ${d.decision_number}`}
                        onClick={() => setEditor(d)}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        className="icon-button danger"
                        aria-label={`Supprimer la décision ${d.decision_number}`}
                        onClick={() => setDeleting(d)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data.length && (
            <Notice>Aucune décision. Ajoutez la première décision.</Notice>
          )}
        </div>
      )}
      {editor && (
        <DecisionEditor
          item={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            reload();
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Supprimer cette décision ?"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await memberApi(`/admin/membership/decisions/${deleting.id}`, {
              method: "DELETE",
            });
            reload();
          }}
        >
          Elle disparaîtra du formulaire. Les décisions déjà choisies resteront
          conservées dans les fiches des membres.
        </Confirm>
      )}
    </div>
  );
}
function GroupEditor({ item, onSaved, onClose }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  return (
    <Modal
      title={item.id ? "Modifier le groupe" : "Créer un groupe"}
      onClose={onClose}
    >
      <form
        className="form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const body = Object.fromEntries(new FormData(e.currentTarget));
            if (!body.leader_id)
              throw new Error(
                "Sélectionnez un responsable dans les résultats de recherche.",
              );
            await memberApi(
              "/admin/membership/groups" + (item.id ? `/${item.id}` : ""),
              { method: item.id ? "PUT" : "POST", body },
            );
            onSaved();
          } catch (e) {
            setError(e.message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          Nom du groupe
          <input
            name="name"
            maxLength={255}
            defaultValue={item.name || ""}
            required
          />
        </label>
        <label>
          Description
          <textarea
            name="description"
            rows={4}
            maxLength={10000}
            defaultValue={item.description || ""}
          />
        </label>
        <MemberPicker
          name="leader_id"
          label="Responsable"
          required
          initial={
            item.leader_id
              ? { id: item.leader_id, full_name: item.leader_name }
              : null
          }
        />
        <MemberPicker
          name="assistant_id"
          label="Assistant du responsable"
          initial={
            item.assistant_id
              ? { id: item.assistant_id, full_name: item.assistant_name }
              : null
          }
        />
        {error && <Notice>{error}</Notice>}
        <button className="button" disabled={busy}>
          Enregistrer le groupe
        </button>
      </form>
    </Modal>
  );
}
function GroupWorkspace({ groupId, admin, onBack }) {
  const prefix = `${admin ? "/admin/membership" : "/member"}/groups/${groupId}`;
  const {
    data: group,
    error: groupError,
    reload: reloadGroup,
  } = useData(prefix);
  const [page, setPage] = useState(1),
    [q, setQ] = useState(""),
    [profile, setProfile] = useState(null),
    [removing, setRemoving] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [toAdd, setToAdd] = useState(null),
    [pickerVersion, setPickerVersion] = useState(0),
    [coordinator, setCoordinator] = useState(null),
    [showCoordinator, setShowCoordinator] = useState(false);
  const {
    data,
    error: listError,
    reload: reloadMembers,
  } = useData(
    `${prefix}/members?${new URLSearchParams({ page: String(page), q })}`,
  );
  function refresh() {
    reloadGroup();
    reloadMembers();
  }
  async function add() {
    if (!toAdd) return;
    setBusy(true);
    setError("");
    try {
      await memberApi(prefix + "/members", {
        method: "POST",
        body: { member_id: toAdd.id },
      });
      setToAdd(null);
      setPickerVersion((v) => v + 1);
      setPage(1);
      refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function download(format) {
    setBusy(true);
    setError("");
    try {
      const blob = await memberApi(`${prefix}/export/${format}`, {
        download: true,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `groupe-${groupId}.${format}`;
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="group-workspace">
      <button className="text-link" onClick={onBack}>
        <ArrowLeft size={18} /> Retour aux groupes
      </button>
      {groupError && <Notice>{groupError}</Notice>}
      {group && (
        <>
          <div className="section-heading">
            <div>
              <h2>{group.name}</h2>
              <p className="pre-line">{group.description}</p>
            </div>
            <div className="hero-actions">
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => download("xlsx")}
              >
                <Download size={18} /> Excel
              </button>
              <button
                className="button secondary"
                disabled={busy}
                onClick={() => download("pdf")}
              >
                <Download size={18} /> PDF
              </button>
            </div>
          </div>
          <p>
            Responsable : <strong>{group.leader_name}</strong> · Assistant :{" "}
            <strong>{group.assistant_name || "Non désigné"}</strong> ·
            Coordinateur :{" "}
            <strong>{group.coordinator_name || "Non désigné"}</strong>
          </p>
          <button
            className="text-link"
            onClick={() => setShowCoordinator((s) => !s)}
          >
            Changer le coordinateur
          </button>
          {showCoordinator && (
            <form
              className="form coordinator-form"
              onSubmit={async (e) => {
                e.preventDefault();
                setBusy(true);
                setError("");
                try {
                  await memberApi(prefix + "/coordinator", {
                    method: "PUT",
                    body: { member_id: coordinator?.id || null },
                  });
                  setShowCoordinator(false);
                  refresh();
                } catch (e) {
                  setError(e.message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              <p>
                Choisissez une personne déjà présente dans ce groupe. Elle
                pourra également gérer le groupe.
              </p>
              <MemberPicker
                name="coordinator_id"
                label="Nouveau coordinateur"
                admin={admin}
                onPick={setCoordinator}
              />
              <button className="button" disabled={busy}>
                {coordinator
                  ? "Désigner le coordinateur"
                  : "Retirer le coordinateur"}
              </button>
            </form>
          )}
          <div className="group-add">
            <MemberPicker
              key={pickerVersion}
              label="Ajouter un membre au groupe"
              name="member_id"
              admin={admin}
              onPick={setToAdd}
            />
            <button className="button" disabled={!toAdd || busy} onClick={add}>
              <Plus size={18} /> Ajouter au groupe
            </button>
          </div>
        </>
      )}
      {(error || listError) && <Notice>{error || listError}</Notice>}
      <SearchBox
        onSearch={(value) => {
          setQ(value);
          setPage(1);
        }}
      />
      {data ? (
        <>
          <MemberTable
            data={data}
            onOpen={setProfile}
            actions={(m) => (
              <button
                className="icon-button danger"
                aria-label={`Retirer ${m.full_name} du groupe`}
                disabled={busy}
                onClick={() => setRemoving(m)}
              >
                <Trash2 size={18} />
              </button>
            )}
          />
          <Pagination data={data} onPage={setPage} />
        </>
      ) : (
        !listError && <p>Chargement des membres…</p>
      )}
      {profile && (
        <MemberProfile
          path={`${prefix}/members/${profile.id}`}
          groupPrefix={prefix}
          onClose={() => setProfile(null)}
        />
      )}
      {removing && (
        <Confirm
          title="Retirer ce membre du groupe ?"
          onClose={() => setRemoving(null)}
          onConfirm={async () => {
            await memberApi(`${prefix}/members/${removing.id}`, {
              method: "DELETE",
            });
            setPage(1);
            refresh();
          }}
        >
          {removing.full_name} sera retiré du groupe. Sa fiche et son historique
          de suivi seront conservés.
        </Confirm>
      )}
    </div>
  );
}
export function GroupManagement({ admin = true }) {
  const { data, error, reload } = useData(
      `${admin ? "/admin/membership" : "/member"}/groups`,
    ),
    [editor, setEditor] = useState(null),
    [deleting, setDeleting] = useState(null),
    [groupId, setGroupId] = useState(null);
  if (groupId)
    return (
      <GroupWorkspace
        key={groupId}
        groupId={groupId}
        admin={admin}
        onBack={() => {
          setGroupId(null);
          reload();
        }}
      />
    );
  return (
    <div className="membership-admin">
      <div className="section-heading">
        <div>
          <h2>{admin ? "Groupes de l’église" : "Mes groupes à gérer"}</h2>
          <p>
            {admin
              ? "Désignez les responsables et accompagnez les membres."
              : "Les groupes dont vous êtes responsable, assistant ou coordinateur apparaissent ici."}
          </p>
        </div>
        {admin && (
          <button className="button" onClick={() => setEditor({})}>
            <Plus size={18} /> Créer un groupe
          </button>
        )}
      </div>
      {error && (
        <Notice>
          {error} <button onClick={reload}>Réessayer</button>
        </Notice>
      )}
      <div className="member-group-grid">
        {data?.map((g) => (
          <article className="member-group-card" key={g.id}>
            <Users size={28} />
            <h3>{g.name}</h3>
            <p className="pre-line">{g.description}</p>
            <dl>
              <dt>Responsable</dt>
              <dd>{g.leader_name}</dd>
              <dt>Assistant</dt>
              <dd>{g.assistant_name || "Non désigné"}</dd>
              <dt>Coordinateur</dt>
              <dd>{g.coordinator_name || "Non désigné"}</dd>
            </dl>
            <p>{g.member_count} membre(s)</p>
            <div className="hero-actions">
              <button className="button" onClick={() => setGroupId(g.id)}>
                Gérer le groupe
              </button>
              {admin && (
                <>
                  <button
                    className="icon-button"
                    aria-label={`Modifier ${g.name}`}
                    onClick={() => setEditor(g)}
                  >
                    <Pencil size={18} />
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={`Supprimer ${g.name}`}
                    onClick={() => setDeleting(g)}
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {data && !data.length && (
        <Notice>
          {admin
            ? "Aucun groupe pour le moment."
            : "Aucun groupe ne vous est confié pour le moment. L’équipe de l’église peut vous renseigner."}
        </Notice>
      )}
      {editor && (
        <GroupEditor
          item={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            reload();
          }}
        />
      )}
      {deleting && (
        <Confirm
          title="Supprimer ce groupe ?"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await memberApi(`/admin/membership/groups/${deleting.id}`, {
              method: "DELETE",
            });
            reload();
          }}
        >
          Le groupe {deleting.name} sera supprimé. L’historique des actions
          restera conservé dans les fiches des membres.
        </Confirm>
      )}
    </div>
  );
}
