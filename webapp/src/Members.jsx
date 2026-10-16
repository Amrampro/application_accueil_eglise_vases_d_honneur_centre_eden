import { useEffect, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Users, UserPlus, LogIn, CheckCircle2, LogOut } from "lucide-react";
import { Notice } from "./Shared";
import { GroupManagement } from "./MembershipAdmin";
import { memberApi, ageRanges, maritalStatuses, channels } from "./member-api";
import "./membership.css";
function SelectChoices({ name, label, options, required = true }) {
  return (
    <label>
      {label}
      <select name={name} required={required} defaultValue="">
        <option value="">Choisir…</option>
        {Object.entries(options).map(([key, value]) => (
          <option key={key} value={key}>
            {value}
          </option>
        ))}
      </select>
    </label>
  );
}
function Registration() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [selectedChannels, setSelectedChannels] = useState([]),
    [version, setVersion] = useState(0);
  useEffect(() => {
    let current = true;
    memberApi("/membership/decisions")
      .then((d) => {
        if (current) {
          setDecisions(d);
          setError("");
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [version]);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const result = await memberApi("/membership/register", {
        method: "POST",
        body: {
          ...Object.fromEntries(data),
          attends_regularly: data.get("attends_regularly") === "yes",
          referral_channels: data.getAll("referral_channels"),
          decision_ids: data.getAll("decision_ids").map(Number),
        },
      });
      navigate("/membre/bienvenue", {
        replace: true,
        state: {
          registered: true,
          unique_identification: result.unique_identification,
        },
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section member-section">
      <Link className="text-link" to="/membre">
        ← Espace membre
      </Link>
      <div className="page-heading">
        <span className="eyebrow">FAISONS CONNAISSANCE</span>
        <h1>Je suis nouveau membre</h1>
        <p>
          Bienvenue au Centre Éden. Prenez quelques instants pour nous permettre
          de vous accueillir.
        </p>
      </div>
      {error && <Notice>{error}</Notice>}
      {!decisions ? (
        <div>
          <p>Chargement des décisions…</p>
          <button
            className="button secondary"
            onClick={() => setVersion((v) => v + 1)}
          >
            Réessayer
          </button>
        </div>
      ) : (
        <form className="form member-form" onSubmit={submit}>
          <fieldset disabled={busy}>
            <legend>Vos informations</legend>
            <div className="form-grid">
              <label className="full">
                Nom et prénoms *
                <input
                  name="full_name"
                  autoComplete="name"
                  maxLength={255}
                  required
                />
              </label>
              <SelectChoices
                name="sex"
                label="Sexe *"
                options={{ male: "Homme", female: "Femme" }}
              />
              <label>
                Téléphone *
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  maxLength={40}
                  required
                />
              </label>
              <label>
                Quartier
                <input name="neighborhood" maxLength={255} />
              </label>
              <label>
                Commune
                <input name="municipality" maxLength={255} />
              </label>
              <label>
                Profession
                <input name="profession" maxLength={255} />
              </label>
              <label>
                Communauté fréquentée
                <input name="community" maxLength={255} />
              </label>
              <SelectChoices
                name="attends_regularly"
                label="Y êtes-vous régulièrement ? *"
                options={{ yes: "Oui", no: "Non" }}
              />
              <SelectChoices
                name="age_range"
                label="Tranche d’âge *"
                options={ageRanges}
              />
              <SelectChoices
                name="marital_status"
                label="Situation matrimoniale *"
                options={maritalStatuses}
              />
              <label>
                Culte n° (facultatif)
                <input name="service_number" maxLength={30} />
              </label>
            </div>
          </fieldset>
          <fieldset disabled={busy}>
            <legend>J’ai connu Vases d’Honneur par…</legend>
            <div className="member-options">
              {Object.entries(channels).map(([key, value]) => (
                <label className="checkbox" key={key}>
                  <input
                    type="checkbox"
                    name="referral_channels"
                    value={key}
                    checked={selectedChannels.includes(key)}
                    onChange={(e) =>
                      setSelectedChannels((s) =>
                        e.target.checked
                          ? [...s, key]
                          : s.filter((c) => c !== key),
                      )
                    }
                  />
                  {value}
                </label>
              ))}
            </div>
            {selectedChannels.includes("person") && (
              <div className="form-grid">
                <label>
                  Nom de la personne *
                  <input name="referrer_name" maxLength={255} required />
                </label>
                <label>
                  Contact de la personne
                  <input name="referrer_contact" maxLength={255} />
                </label>
              </div>
            )}
            {selectedChannels.includes("other") && (
              <label>
                Précisez *
                <input name="referral_other" maxLength={500} required />
              </label>
            )}
          </fieldset>
          <fieldset disabled={busy}>
            <legend>Ma décision aujourd’hui</legend>
            <p>Vous pouvez cocher plusieurs décisions.</p>
            <div className="decision-options">
              {decisions.map((d) => (
                <label className="checkbox decision-option" key={d.id}>
                  <input type="checkbox" name="decision_ids" value={d.id} />
                  <span>
                    <b>{d.decision_number}.</b> {d.meaning}
                  </span>
                </label>
              ))}
            </div>
            {!decisions.length && (
              <p>Aucune décision proposée pour le moment.</p>
            )}
            <label>
              Commentaires ou précisions
              <textarea name="notes" rows={4} maxLength={10000} />
            </label>
          </fieldset>
          <p className="member-help">
            Ces informations sont transmises à l’équipe de l’église pour votre
            accueil et votre suivi. Les champs marqués * sont obligatoires.
          </p>
          {error && <Notice>{error}</Notice>}
          <button className="button" disabled={busy}>
            {busy ? "Enregistrement…" : "Enregistrer mes informations"}
          </button>
        </form>
      )}
    </section>
  );
}
function Login({ onLogin }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await memberApi("/membership/login", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      sessionStorage.setItem("vh-member-token", result.token);
      onLogin(result.token);
      navigate("/membre/espace", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="section member-section">
      <div className="page-heading">
        <h1>Je suis déjà membre</h1>
        <p>
          Connectez-vous avec votre identifiant membre à six chiffres et votre
          mot de passe.
        </p>
      </div>
      <form className="form narrow" onSubmit={submit}>
        <label>
          Identifiant membre (6 chiffres)
          <input
            name="unique_identification"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            autoComplete="username"
            minLength={6}
            maxLength={6}
            required
          />
        </label>
        <label>
          Mot de passe
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            maxLength={250}
            required
          />
        </label>
        <p className="member-help">
          Lors de votre première connexion, votre mot de passe est « password ».
          Vous pourrez ensuite le personnaliser. Si vous avez oublié votre
          identifiant, contactez l’équipe de l’église.
        </p>
        {error && <Notice>{error}</Notice>}
        <button className="button" disabled={busy}>
          {busy ? "Connexion…" : "Me connecter"} <LogIn size={18} />
        </button>
        <Link to="/membre/nouveau">Je suis nouveau membre</Link>
      </form>
    </section>
  );
}
function MemberSpace({ token, onLogout }) {
  const [me, setMe] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    memberApi("/member/me")
      .then((d) => {
        if (active) setMe(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [token]);
  async function password(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await memberApi("/member/password", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      onLogout("Mot de passe modifié. Reconnectez-vous.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  if (!token)
    return (
      <section className="section">
        <Notice>Connectez-vous pour accéder à votre espace membre.</Notice>
        <Link className="button" to="/membre/connexion">
          Me connecter
        </Link>
      </section>
    );
  return (
    <section className="section member-section">
      <div className="section-heading">
        <div>
          <span className="eyebrow">MON ESPACE MEMBRE</span>
          <h1>Bienvenue{me ? `, ${me.full_name}` : ""}</h1>
          {me && (
            <p>
              Identifiant membre : <strong>{me.unique_identification}</strong>
            </p>
          )}
        </div>
        <button className="button secondary" onClick={() => onLogout()}>
          <LogOut size={18} /> Déconnexion
        </button>
      </div>
      {error && <Notice>{error}</Notice>}
      <GroupManagement admin={false} />
      <details className="member-password">
        <summary>Personnaliser mon mot de passe</summary>
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
            Nouveau mot de passe
            <input
              name="password"
              type="password"
              minLength={8}
              maxLength={72}
              required
              autoComplete="new-password"
            />
          </label>
          <button className="button" disabled={busy}>
            Enregistrer le nouveau mot de passe
          </button>
        </form>
      </details>
    </section>
  );
}
export default function MemberPortal() {
  const location = useLocation();
  const [token, setToken] = useState(sessionStorage.getItem("vh-member-token")),
    [message, setMessage] = useState("");
  const navigate = useNavigate();
  const logout = (msg = "") => {
    sessionStorage.removeItem("vh-member-token");
    setToken(null);
    setMessage(msg);
    navigate("/membre/connexion", { replace: true });
  };
  useEffect(() => {
    const expired = () => {
      setToken(null);
      setMessage("Votre session a expiré. Reconnectez-vous.");
    };
    const reset = () => {
      sessionStorage.removeItem("vh-member-token");
      setToken(null);
    };
    window.addEventListener("vh-member-expired", expired);
    window.addEventListener("vh-kiosk-reset", reset);
    return () => {
      window.removeEventListener("vh-member-expired", expired);
      window.removeEventListener("vh-kiosk-reset", reset);
    };
  }, []);
  return (
    <>
      {message && (
        <div className="section">
          <Notice>{message}</Notice>
        </div>
      )}
      <Routes>
        <Route
          index
          element={
            <section className="section member-section">
              <div className="page-heading">
                <span className="eyebrow">UNE PLACE POUR VOUS</span>
                <h1>Membre</h1>
                <p>Nous sommes heureux de vous accueillir.</p>
              </div>
              <div className="member-entry-grid">
                <Link className="member-entry" to="nouveau">
                  <UserPlus size={36} />
                  <h2>Je suis nouveau membre</h2>
                  <p>Remplir ma fiche d’accueil et partager mes décisions.</p>
                </Link>
                <Link
                  className="member-entry"
                  to={token ? "espace" : "connexion"}
                >
                  <Users size={36} />
                  <h2>Je suis déjà membre</h2>
                  <p>Accéder à mon espace et aux groupes que je gère.</p>
                </Link>
              </div>
            </section>
          }
        />
        <Route path="nouveau" element={<Registration />} />
        <Route path="connexion" element={<Login onLogin={setToken} />} />
        <Route
          path="bienvenue"
          element={
            <section className="section member-welcome">
              <CheckCircle2 size={64} />
              <h1>Bienvenue au Centre Éden !</h1>
              <p>Vos informations ont bien été prises en compte.</p>
              {location.state?.unique_identification && (
                <p>
                  Votre identifiant membre :{" "}
                  <strong>{location.state.unique_identification}</strong>
                  <br />
                  Conservez ce numéro à six chiffres pour vous connecter à votre
                  espace membre.
                </p>
              )}
              <p>Merci. Notre équipe est heureuse de vous accueillir.</p>
              <Link className="button" to="/">
                Retour à l’accueil
              </Link>
            </section>
          }
        />
        <Route
          path="espace"
          element={<MemberSpace token={token} onLogout={logout} />}
        />
        <Route
          path="*"
          element={<Link to="/membre">Retour à l’espace membre</Link>}
        />
      </Routes>
    </>
  );
}
