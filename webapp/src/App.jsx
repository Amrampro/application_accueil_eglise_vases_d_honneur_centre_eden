import { useCallback, useEffect, useState } from "react";
import {
  Link,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Heart,
  Users,
  BookOpen,
  CalendarDays,
  Church,
  Search,
  Phone,
  Mail,
  MapPin,
  Check,
  Settings,
  Flower2,
  HandHeart,
  ShieldCheck,
  RefreshCw,
} from "lucide-react";
import { api } from "./api";
import Admin from "./Admin";
import MemberPortal from "./Members";
import { Modal, Notice } from "./Shared";
import { KioskHome, Churches, Tours, Location, Donation } from "./Kiosk";
import { mediaUrl } from "./MediaUpload";
import { House, Maximize } from "lucide-react";

const icons = [
  Users,
  HandHeart,
  BookOpen,
  Heart,
  Flower2,
  ShieldCheck,
  Settings,
  Church,
];

function Header() {
  const location = useLocation();
  const home = location.pathname === "/";
  return (
    <header className="kiosk-header">
      <Link
        to="/"
        className="kiosk-logo"
        aria-label="Vases d’honneur — Accueil"
      >
        <img src="/images/logo.png" alt="Vases d’honneur" />
      </Link>
      <div className="kiosk-header-title">
        <span>VASES D’HONNEUR</span>
        <small>Votre espace de découverte</small>
      </div>
      <div className="kiosk-header-actions">
        {!home && (
          <Link to="/" className="kiosk-home-button">
            <House size={23} />
            Accueil
          </Link>
        )}
        <button
          className="kiosk-fullscreen"
          aria-label="Afficher en plein écran"
          onClick={() => {
            if (document.fullscreenElement) document.exitFullscreen?.();
            else document.documentElement.requestFullscreen?.().catch(() => {});
          }}
        >
          <Maximize size={22} />
        </button>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="kiosk-footer">
      <span>Vases d’honneur · Centre Eden</span>
      <Link to="/">Retour à l’accueil</Link>
      <Link to="/admin">
        Espace équipe <ShieldCheck size={14} />
      </Link>
    </footer>
  );
}
function PageHeading({ eyebrow, title, description }) {
  return (
    <div className="page-heading">
      <Link className="text-link" to="/">
        <ArrowLeft size={16} /> Accueil
      </Link>
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}
function Ministries({ data }) {
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const departments = data.departments.filter(
    (d) =>
      (filter === "all" || d.ministry_id === Number(filter)) &&
      d.name.toLocaleLowerCase("fr").includes(search.toLocaleLowerCase("fr")),
  );
  return (
    <section className="section">
      <PageHeading
        eyebrow="VIVRE ET SERVIR ENSEMBLE"
        title="Nos ministères"
        description="Choisissez un ministère pour consulter ses départements."
      />
      <div className="ministry-grid">
        {data.ministries.map((m, i) => {
          const Icon = icons[i % icons.length];
          return (
            <button
              className={
                "ministry-card " + (Number(filter) === m.id ? "active" : "")
              }
              key={m.id}
              onClick={() => {
                setFilter(String(m.id));
                document
                  .getElementById("departements")
                  .scrollIntoView({ behavior: "smooth" });
              }}
            >
              <Icon />
              <h3>{m.name}</h3>
              <p>
                {m.description ||
                  `${data.departments.filter((d) => d.ministry_id === m.id).length} départements à découvrir`}
              </p>
              <ArrowUpRight size={18} />
            </button>
          );
        })}
      </div>
      <div id="departements" className="section-heading">
        <h2>
          Les <em>départements</em>
        </h2>
        <span>
          {departments.length} résultat{departments.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="filter-bar">
        <label className="search">
          <Search size={18} />
          <input
            placeholder="Rechercher un département"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrer par ministère"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Tous les ministères</option>
          {data.ministries.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
      <div className="department-grid">
        {departments.map((d) => (
          <button
            className="department-card"
            key={d.id}
            onClick={() => setSelected(d)}
          >
            <small>
              {data.ministries.find((m) => m.id === d.ministry_id)?.name}
            </small>
            <h3>{d.name}</h3>
            <ArrowUpRight size={20} />
          </button>
        ))}
      </div>
      {!departments.length && (
        <Notice>Aucun département ne correspond à votre recherche.</Notice>
      )}
      <div className="callout">
        <HandHeart />
        <div>
          <h3>Vous souhaitez servir ?</h3>
          <p>
            Commencez par le cours de membres et l’intégration dans les
            départements.
          </p>
        </div>
        <Link className="button" to="/contacts">
          Contacter l’équipe <ArrowRight size={16} />
        </Link>
      </div>
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          <p>
            {selected.description ||
              "Découvrez ce département et son rôle auprès de notre équipe d’intégration."}
          </p>
          {selected.leader && <p>Responsable : {selected.leader}</p>}
          {selected.phone && (
            <a
              className="button"
              href={"tel:" + selected.phone.replace(/\s/g, "")}
            >
              Appeler le responsable
            </a>
          )}
          <ContactCard
            contact={data.contacts.find((c) => c.kind === "serve")}
          />
        </Modal>
      )}
    </section>
  );
}

function Departments({ data }) {
  const [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null);
  const ministryName = (department) =>
    data.ministries.find((m) => m.id === department.ministry_id)?.name;
  const normalize = (text) =>
    text
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLocaleLowerCase("fr")
      .trim();
  const departments = data.departments.filter((d) =>
    normalize(d.name).includes(normalize(search)),
  );
  return (
    <section className="section departments-page">
      <PageHeading
        eyebrow="DÉCOUVRIR NOS ÉQUIPES"
        title="Nos départements"
        description="Recherchez un département ou touchez une carte pour en savoir plus."
      />
      <div className="filter-bar departments-search">
        <label className="search">
          <Search size={22} />
          <input
            type="search"
            aria-label="Rechercher un département"
            placeholder="Rechercher un département…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <span role="status">
          {departments.length} département{departments.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="large-department-grid">
        {departments.map((d, i) => (
          <button
            key={d.id}
            className="large-department-card"
            onClick={() => setSelected(d)}
          >
            <span className="department-symbol">
              <Users size={30} />
            </span>
            <span className="department-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{d.name}</h2>
            {ministryName(d) && (
              <span className="department-ministry">
                Ministère : {ministryName(d)}
              </span>
            )}
            {d.description && <p>{d.description}</p>}
            <span className="department-open">
              Découvrir ce département <ArrowUpRight size={22} />
            </span>
          </button>
        ))}
      </div>
      {!departments.length && (
        <Notice>Aucun département ne correspond à votre recherche.</Notice>
      )}
      {selected && (
        <Modal title={selected.name} onClose={() => setSelected(null)}>
          {ministryName(selected) && (
            <p className="department-ministry">
              Ministère : {ministryName(selected)}
            </p>
          )}
          <p>
            {selected.description ||
              "Notre équipe d’intégration vous renseignera sur ce département et les étapes pour y servir."}
          </p>
          {selected.leader && <p>Responsable : {selected.leader}</p>}
          {selected.phone && (
            <a
              className="button"
              href={"tel:" + selected.phone.replace(/\s/g, "")}
            >
              Appeler le responsable
            </a>
          )}
          <ContactCard
            contact={data.contacts.find((c) => c.kind === "serve")}
          />
        </Modal>
      )}
    </section>
  );
}
function ContactCard({ contact }) {
  if (!contact) return null;
  const c = contact;
  return (
    <article className="contact-card">
      <span className="contact-icon">
        <Phone size={20} />
      </span>
      <h3>{c.name}</h3>
      <p>{c.description}</p>
      {c.phone && (
        <a
          className="text-link"
          href={
            c.kind === "whatsapp"
              ? `https://wa.me/${c.phone.replace(/\D/g, "")}`
              : "tel:" + c.phone.replace(/\s/g, "")
          }
        >
          {c.phone} <ArrowUpRight size={16} />
        </a>
      )}
      {c.email && (
        <a className="text-link" href={"mailto:" + c.email}>
          <Mail size={15} />
          {c.email}
        </a>
      )}
    </article>
  );
}
function RequestForm({ type, data, school, onDone }) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const values = Object.fromEntries(new FormData(e.currentTarget));
      const result = await api("/requests", {
        method: "POST",
        body: { ...values, type },
      });
      e.target.reset();
      onDone(result.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form">
      <div className="form-grid">
        <label>
          Prénom *
          <input
            name="first_name"
            required
            maxLength={250}
            autoComplete="given-name"
          />
        </label>
        <label>
          Nom *
          <input
            name="last_name"
            required
            maxLength={250}
            autoComplete="family-name"
          />
        </label>
        <label>
          Téléphone {type === "enrollment" ? "*" : ""}
          <input
            name="phone"
            type="tel"
            required={type === "enrollment"}
            placeholder="+225 …"
            maxLength={25}
          />
        </label>
        <label>
          E-mail
          <input name="email" type="email" maxLength={250} />
        </label>
        {type === "appointment" && (
          <>
            <label>
              Sexe *
              <select name="sex" required>
                <option value="">Sélectionner</option>
                {["Femme", "Homme", "Non précisé"].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label>
              Type de besoin *
              <select name="need_type" required>
                <option value="">Sélectionner</option>
                {["Spirituel", "Familial", "Professionnel", "Autre"].map(
                  (s) => (
                    <option key={s}>{s}</option>
                  ),
                )}
              </select>
            </label>
            <label>
              Date souhaitée
              <input
                type="date"
                name="preferred_date"
                min={new Date().toISOString().slice(0, 10)}
              />
            </label>
          </>
        )}
        {type === "enrollment" && (
          <label className="full">
            Formation *
            <select name="school_id" defaultValue={school || ""} required>
              <option value="">Choisir une formation</option>
              {data.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      {type !== "enrollment" && (
        <label>
          {type === "appointment"
            ? "Motif du rendez-vous"
            : type === "prayer"
              ? "Votre sujet de prière"
              : "Votre témoignage"}{" "}
          *<textarea name="reason" required maxLength={4000} rows={4} />
        </label>
      )}
      <p className="form-help">
        * Champs obligatoires. Ces informations sont transmises uniquement à
        l’équipe d’administration pour traiter votre demande. Une date souhaitée
        ne constitue pas un rendez-vous confirmé.
      </p>
      <label className="checkbox">
        <input type="checkbox" required /> J’accepte que l’équipe utilise ces
        informations pour me répondre.
      </label>
      {error && <Notice>{error}</Notice>}
      <button className="button" disabled={busy}>
        {busy ? "Envoi en cours…" : "Envoyer ma demande"}{" "}
        <ArrowRight size={18} />
      </button>
    </form>
  );
}
function Pastoral({ data }) {
  const [success, setSuccess] = useState("");
  return (
    <section className="section pastoral-page">
      <PageHeading
        eyebrow="NOUS SOMMES À VOS CÔTÉS"
        title="Rendez-vous pastoral"
        description="Remplissez ce formulaire pour demander un rendez-vous avec un pasteur."
      />
      {success ? (
        <div className="pastoral-success">
          <Check size={48} />
          <h2>Votre demande est enregistrée.</h2>
          <p>{success}</p>
          <Link to="/" className="button">
            Retour à l’accueil <ArrowRight size={20} />
          </Link>
        </div>
      ) : (
        <div className="pastoral-layout">
          <div className="pastoral-form">
            <RequestForm
              type="appointment"
              data={data}
              onDone={(m) => {
                setSuccess(m);
                window.scrollTo({ top: 0 });
              }}
            />
          </div>
          <aside>
            <img src="/images/appointment.jpg" alt="" />
            <h2>Un temps pour vous.</h2>
            <p>
              Spirituel, familial, professionnel : partagez votre besoin avec
              notre équipe.
            </p>
            <p>La date souhaitée sera confirmée par le secrétariat.</p>
            <Link to="/contacts" className="text-link">
              Contacter le secrétariat <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
function Accompaniment({ data }) {
  const [type, setType] = useState(null),
    [success, setSuccess] = useState("");
  const close = useCallback(() => setType(null), []);
  return (
    <section className="section">
      <PageHeading
        eyebrow="UN PAS À LA FOIS"
        title={
          <>
            Nous sommes <em>à vos côtés.</em>
          </>
        }
        description="Vous êtes nouveau ? Vous avez besoin d’écoute, de prière ou d’un accompagnement ? Notre équipe est là pour vous."
      />
      {success && (
        <Notice>
          <Check size={18} /> {success}
        </Notice>
      )}
      <div className="journey-grid three">
        {[
          [
            "appointment",
            "Rencontrer un pasteur",
            "Déposez votre demande de rendez-vous.",
            CalendarDays,
          ],
          [
            "prayer",
            "Confier une prière",
            "Partagez votre intention avec notre équipe.",
            Heart,
          ],
          [
            "testimony",
            "Partager un témoignage",
            "Racontez ce que Dieu a fait dans votre vie.",
            HandHeart,
          ],
        ].map(([key, title, desc, Icon]) => (
          <button
            className="journey-card"
            key={key}
            onClick={() => setType(key)}
          >
            <Icon size={30} />
            <h3>{title}</h3>
            <p>{desc}</p>
            <span className="card-bottom">
              Commencer <ArrowUpRight size={20} />
            </span>
          </button>
        ))}
      </div>
      <h2 className="spaced">
        Un contact pour <em>chaque besoin.</em>
      </h2>
      <div className="contact-grid">
        {data.contacts.map((c) => (
          <ContactCard key={c.id} contact={c} />
        ))}
      </div>
      {type && (
        <Modal
          title={
            type === "appointment"
              ? "Demande de rendez-vous"
              : type === "prayer"
                ? "Confier une prière"
                : "Partager un témoignage"
          }
          onClose={close}
        >
          <RequestForm
            type={type}
            data={data}
            onDone={(message) => {
              setSuccess(message);
              setType(null);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
          />
        </Modal>
      )}
    </section>
  );
}
function Schools({ data }) {
  const [school, setSchool] = useState(null),
    [success, setSuccess] = useState("");
  const close = useCallback(() => setSchool(null), []);
  return (
    <section className="section">
      <PageHeading
        eyebrow="GRANDIR DANS LA FOI"
        title="Nos formations"
        description="Choisissez une formation pour demander votre inscription."
      />
      {success && <Notice>{success}</Notice>}
      <div className="journey-grid three">
        {data.schools.map((s, i) => (
          <article className="journey-card" key={s.id}>
            <div className="card-top">
              <BookOpen size={28} />
              <span>0{i + 1}</span>
            </div>
            <h3>{s.name}</h3>
            <p>
              {s.description ||
                "Contactez notre équipe pour découvrir le parcours et les conditions d’inscription."}
            </p>
            {s.schedule && (
              <p>
                <CalendarDays size={16} /> {s.schedule}
              </p>
            )}
            {s.location && (
              <p>
                <MapPin size={16} /> {s.location}
              </p>
            )}
            <button className="button" onClick={() => setSchool(s.id)}>
              Je souhaite m’inscrire <ArrowUpRight size={16} />
            </button>
          </article>
        ))}
      </div>
      {!data.schools.length && (
        <Notice>Les formations seront bientôt présentées ici.</Notice>
      )}
      {school && (
        <Modal title="Demande d’inscription" onClose={close}>
          <RequestForm
            type="enrollment"
            data={data}
            school={school}
            onDone={(m) => {
              setSuccess(m);
              setSchool(null);
            }}
          />
        </Modal>
      )}
    </section>
  );
}
function Discover({ data }) {
  const s = data.settings;
  return (
    <section className="section">
      <PageHeading
        eyebrow="VASE D’HONNEUR · CENTRE EDEN"
        title={
          <>
            Une église. <em>Une famille.</em>
          </>
        }
        description={s.welcome_text}
      />
      <div className="about-grid">
        <div className="about-art">
          <Flower2 size={110} strokeWidth={0.8} />
          <h2>
            Bienvenue
            <br />
            <em>chez vous.</em>
          </h2>
        </div>
        <div>
          <h2>{s.tagline}</h2>
          <p>
            Explorez nos ministères, découvrez les formations et échangez avec
            l’équipe pour trouver votre place.
          </p>
          {s.address && (
            <p>
              <MapPin size={18} /> {s.address}
            </p>
          )}
          {s.service_times && (
            <p className="pre-line">
              <CalendarDays size={18} /> {s.service_times}
            </p>
          )}
          <Link className="button" to="/accompagnement">
            Je suis nouveau <ArrowUpRight size={18} />
          </Link>
        </div>
      </div>
      <h2 className="spaced">
        L’équipe <em>pastorale</em>
      </h2>
      <div className="contact-grid">
        {data.pastors.map((p) => (
          <article className="contact-card" key={p.id}>
            {p.image_url && (
              <img
                className="pastor-photo"
                src={mediaUrl(p.image_url)}
                alt={p.name}
              />
            )}
            <h3>{p.name}</h3>
            <span className="eyebrow">{p.role}</span>
            <p>{p.description}</p>
          </article>
        ))}
      </div>
      {!data.pastors.length && (
        <Notice>Pour rencontrer le pasteur, contactez le secrétariat.</Notice>
      )}
      <h2 className="spaced">
        Une famille dans <em>votre quartier.</em>
      </h2>
      <div className="contact-grid">
        {data.cells.map((c) => (
          <article className="contact-card" key={c.id}>
            <h3>{c.name}</h3>
            <p>{c.description}</p>
            <p>
              {[c.location, c.schedule, c.leader].filter(Boolean).join(" · ")}
            </p>
            {c.phone && (
              <a href={"tel:" + c.phone.replace(/\s/g, "")}>{c.phone}</a>
            )}
          </article>
        ))}
      </div>
      <ContactCard contact={data.contacts.find((c) => c.kind === "cells")} />
    </section>
  );
}
function Agenda({ data }) {
  return (
    <section className="section">
      <PageHeading
        eyebrow="LES RENDEZ-VOUS DE NOTRE FAMILLE"
        title="Agenda"
        description="Retrouvez les cultes, rencontres et événements publiés par notre équipe."
      />
      <div className="event-list">
        {[...data.events]
          .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
          .map((e) => (
            <article className="event-card" key={e.id}>
              <div className="date-block">
                {e.starts_at ? (
                  <>
                    <strong>
                      {new Date(e.starts_at).toLocaleDateString("fr-FR", {
                        day: "2-digit",
                      })}
                    </strong>
                    <span>
                      {new Date(e.starts_at).toLocaleDateString("fr-FR", {
                        month: "short",
                      })}
                    </span>
                  </>
                ) : (
                  <CalendarDays />
                )}
              </div>
              <div>
                <h3>{e.name}</h3>
                <p>{e.description}</p>
                <small>
                  {e.starts_at &&
                    new Date(e.starts_at).toLocaleString("fr-FR", {
                      dateStyle: "full",
                      timeStyle: "short",
                    })}{" "}
                  {e.location && " · " + e.location}
                </small>
              </div>
            </article>
          ))}
      </div>
      {!data.events.length && (
        <Notice>
          Aucun événement annoncé pour le moment. Le secrétariat peut vous
          renseigner sur les prochaines rencontres.
        </Notice>
      )}
      {data.settings.service_times && (
        <div className="callout pre-line">{data.settings.service_times}</div>
      )}
    </section>
  );
}
function PublicApp() {
  const memberLocation = useLocation();
  useEffect(() => {
    if (
      memberLocation.pathname !== "/membre" &&
      !memberLocation.pathname.startsWith("/membre/")
    )
      sessionStorage.removeItem("vh-member-token");
  }, [memberLocation.pathname]);
  useEffect(() => {
    sessionStorage.removeItem("vh-token");
  }, []);
  const [data, setData] = useState(null),
    [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const [idle, setIdle] = useState(false);
  const load = useCallback(() => {
    setError("");
    api("/content")
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    window.scrollTo({ top: 0 });
    load();
  }, [location.pathname, load]);
  useEffect(() => {
    if (!data) return;
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 },
    );
    document.querySelectorAll(".reveal").forEach((e) => observer.observe(e));
    return () => observer.disconnect();
  }, [data, location.pathname]);
  useEffect(() => {
    let warning, reset;
    const active = () => {
      setIdle(false);
      clearTimeout(warning);
      clearTimeout(reset);
      warning = setTimeout(() => setIdle(true), 270000);
      reset = setTimeout(() => {
        setIdle(false);
        navigate("/");
        window.dispatchEvent(new Event("vh-kiosk-reset"));
      }, 300000);
    };
    for (const event of ["pointerdown", "keydown", "scroll"])
      window.addEventListener(event, active, { passive: true });
    active();
    return () => {
      clearTimeout(warning);
      clearTimeout(reset);
      for (const event of ["pointerdown", "keydown", "scroll"])
        window.removeEventListener(event, active);
    };
  }, [navigate]);
  const [resetKey, setResetKey] = useState(0);
  useEffect(() => {
    const reset = () => setResetKey((k) => k + 1);
    window.addEventListener("vh-kiosk-reset", reset);
    return () => window.removeEventListener("vh-kiosk-reset", reset);
  }, []);
  return (
    <>
      <Header />
      <main key={resetKey}>
        {error ? (
          <div className="section">
            <Notice>{error}</Notice>
            <button className="button" onClick={load}>
              <RefreshCw size={18} /> Réessayer
            </button>
          </div>
        ) : !data ? (
          <div className="loading">
            <Flower2 className="spin" />
            <p>Bienvenue…</p>
          </div>
        ) : (
          <Routes>
            <Route index element={<KioskHome data={data} />} />
            <Route path="membre/*" element={<MemberPortal />} />
            <Route path="nous-localiser" element={<Location data={data} />} />
            <Route path="donner" element={<Donation data={data} />} />
            <Route path="eglises" element={<Churches data={data} />} />
            <Route path="visiter" element={<Tours data={data} />} />
            <Route path="decouvrir" element={<Discover data={data} />} />
            <Route path="ministeres" element={<Ministries data={data} />} />
            <Route path="departements" element={<Departments data={data} />} />
            <Route path="formations" element={<Schools data={data} />} />
            <Route
              path="accompagnement"
              element={<Accompaniment data={data} />}
            />
            <Route path="rdv-pastoral" element={<Pastoral data={data} />} />
            <Route path="agenda" element={<Agenda data={data} />} />
            <Route
              path="contacts"
              element={
                <section className="section">
                  <PageHeading
                    eyebrow="PARLONS ENSEMBLE"
                    title="Nous contacter"
                    description="Choisissez le contact correspondant à votre besoin."
                  />
                  <div className="contact-grid">
                    {data.contacts.map((c) => (
                      <ContactCard key={c.id} contact={c} />
                    ))}
                  </div>
                </section>
              }
            />
            <Route
              path="*"
              element={
                <section className="section">
                  <h1>Cette page n’existe pas.</h1>
                  <Link to="/" className="button">
                    Retour à l’accueil
                  </Link>
                </section>
              }
            />
          </Routes>
        )}
      </main>
      <Footer />
      {idle && (
        <div className="idle-notice" role="status">
          L’écran reviendra à l’accueil dans quelques instants. Touchez l’écran
          pour continuer.
        </div>
      )}
    </>
  );
}
export default function App() {
  return (
    <Routes>
      <Route path="/admin/*" element={<Admin />} />
      <Route path="/*" element={<PublicApp />} />
    </Routes>
  );
}
