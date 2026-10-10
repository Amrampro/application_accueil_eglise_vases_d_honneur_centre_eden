import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Church,
  Users,
  Network,
  BookOpen,
  CalendarDays,
  HeartHandshake,
  Phone,
  View,
  Move,
  ChevronLeft,
  Plus,
  Minus,
  RotateCcw,
  MapPin,
} from "lucide-react";
import "pannellum/build/pannellum.js";
import "pannellum/build/pannellum.css";
import { Notice } from "./Shared";
import { mediaUrl } from "./MediaUpload";

const choices = [
  ["churches", "Nos églises", "Découvrir notre famille", "/eglises", Church],
  [
    "ministries",
    "Nos ministères",
    "Trouver sa place et servir",
    "/ministeres",
    Users,
  ],
  [
    "departments",
    "Nos départements",
    "Découvrir les équipes et servir",
    "/departements",
    Network,
  ],
  ["schools", "Nos formations", "Grandir dans la foi", "/formations", BookOpen],
  ["agenda", "Agenda", "Nos prochaines rencontres", "/agenda", CalendarDays],
  [
    "appointment",
    "Rendez-vous pastoral",
    "Demander un accompagnement",
    "/rdv-pastoral",
    HeartHandshake,
  ],
  [
    "contacts",
    "Nous contacter",
    "Le bon contact pour votre besoin",
    "/contacts",
    Phone,
  ],
  [
    "visit",
    "Visiter notre église",
    "Explorer nos espaces en 360°",
    "/visiter",
    View,
  ],
];
export function KioskHome() {
  return (
    <section className="kiosk-home">
      <div className="kiosk-intro">
        <div>
          <span className="kiosk-eyebrow welcome-motion">
            BIENVENUE DANS VOTRE FAMILLE
          </span>
          <h1 className="heading-motion">
            Que souhaitez-vous{" "}
            <span className="discover-motion">découvrir ?</span>
          </h1>
          <p className="hint-motion">Touchez une case pour commencer.</p>
        </div>
        <div className="touch-instruction">
          <span className="touch-circle">
            <Move size={26} />
          </span>
          <span>
            C’est vous qui choisissez.<small>Explorez à votre rythme.</small>
          </span>
        </div>
      </div>
      <div className="kiosk-grid">
        {choices.map(([key, title, desc, path, Icon], index) => (
          <Link className={"kiosk-tile tile-" + key} key={key} to={path}>
            <img
              src={"/images/" + key + ".jpg"}
              alt=""
              loading={index < 4 ? "eager" : "lazy"}
            />
            <span className="tile-shade" />
            <span className="tile-badge">
              {key === "visit" ? "360°" : <Icon size={23} />}
            </span>
            <span className="tile-content">
              <span>
                <strong>{title}</strong>
                <small>{desc}</small>
              </span>
              <span className="tile-arrow">
                <ArrowRight size={23} />
              </span>
            </span>
          </Link>
        ))}
      </div>
      <div className="kiosk-bottom">
        <span>
          <span className="dot" /> Une église. Une famille. Une place pour vous.
        </span>
        <span>Choisissez • Découvrez • Revenez à l’accueil</span>
      </div>
    </section>
  );
}
export function Churches({ data }) {
  const churches = data.churches || [];
  return (
    <section className="section kiosk-section">
      <div className="page-heading">
        <span className="eyebrow">FAISONS CONNAISSANCE</span>
        <h1>Nos églises</h1>
        <p>
          Découvrez notre famille et retrouvez les informations pour nous
          rejoindre.
        </p>
      </div>
      <div className="church-grid">
        {churches.map((c) => (
          <article className="church-card" key={c.id}>
            <div className="church-photo">
              <img
                src={
                  c.image_url ? mediaUrl(c.image_url) : "/images/churches.jpg"
                }
                alt={c.image_url ? c.name : ""}
              />
              {!c.image_url && <small>Photo d’illustration</small>}
            </div>
            <div>
              <h2>{c.name}</h2>
              <p>{c.description}</p>
              {c.address && (
                <p>
                  <MapPin size={18} /> {c.address}
                </p>
              )}
              {c.phone && (
                <a
                  className="text-link"
                  href={"tel:" + c.phone.replace(/\s/g, "")}
                >
                  {c.phone}
                </a>
              )}
              <div className="hero-actions">
                <Link className="button" to="/decouvrir">
                  Découvrir l’église <ArrowRight size={18} />
                </Link>
                <Link className="button secondary" to="/visiter">
                  Visite à 360° <View size={18} />
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {!churches.length && (
        <Notice>
          Les églises seront bientôt présentées ici. Notre secrétariat peut vous
          renseigner.
        </Notice>
      )}
    </section>
  );
}
function Panorama({ scene, place, scenes, onSelect, onExit }) {
  const container = useRef(),
    viewer = useRef(),
    shell = useRef();
  const [error, setError] = useState("");
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shell.current.focus();
    const key = (e) => {
      if (e.key === "Escape") onExit();
      if (e.key === "Tab") {
        const nodes = shell.current.querySelectorAll('button,[tabindex="0"]');
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          e.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === shell.current)
        ) {
          e.preventDefault();
          last?.focus();
        } else if (
          !e.shiftKey &&
          (document.activeElement === last ||
            document.activeElement === shell.current)
        ) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [onExit]);
  useEffect(() => {
    setError("");
    try {
      const v = window.pannellum.viewer(container.current, {
        type: "equirectangular",
        panorama: mediaUrl(scene.image_url),
        autoLoad: true,
        showControls: false,
        draggable: true,
        mouseZoom: true,
        hfov: 100,
        minHfov: 35,
        maxHfov: 120,
        escapeHTML: true,
        orientationOnByDefault: false,
        strings: {
          loadingLabel: "Chargement de la visite…",
          genericWebGLError:
            "La visite 360° nécessite un navigateur compatible WebGL.",
        },
      });
      viewer.current = v;
      v.on("error", () =>
        setError(
          "La photo ne peut pas être affichée. Vérifiez le fichier panoramique et la connexion.",
        ),
      );
      return () => {
        v.destroy();
        viewer.current = null;
      };
    } catch {
      setError("La visite 360° n’est pas disponible sur ce navigateur.");
    }
  }, [scene.id, scene.image_url]);
  return createPortal(
    <div
      className="panorama-shell panorama-immersive"
      ref={shell}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={"Visite à 360° : " + place.name}
    >
      <div
        className="panorama-canvas"
        ref={container}
        aria-label={"Photo à 360° : " + scene.name}
        tabIndex={0}
      />
      <div className="panorama-help">
        <Move size={20} />
        <span>
          <strong>{place.name}</strong>Faites glisser pour regarder autour de
          vous
        </span>
      </div>
      {scenes.length > 1 && (
        <div
          className="scene-selector immersive-scenes"
          aria-label="Points de vue"
        >
          {scenes.map((s) => (
            <button
              className={scene.id === s.id ? "active" : ""}
              key={s.id}
              onClick={() => onSelect(s.id)}
              aria-pressed={scene.id === s.id}
            >
              <View size={20} />
              {s.name}
            </button>
          ))}
        </div>
      )}
      <div className="panorama-controls">
        <button
          className="icon-button"
          aria-label="Zoom avant"
          onClick={() => viewer.current?.setHfov(viewer.current.getHfov() - 10)}
        >
          <Plus />
        </button>
        <button
          className="icon-button"
          aria-label="Zoom arrière"
          onClick={() => viewer.current?.setHfov(viewer.current.getHfov() + 10)}
        >
          <Minus />
        </button>
        <button
          className="icon-button"
          aria-label="Recentrer la vue"
          onClick={() => viewer.current?.lookAt(0, 0, 100, 500)}
        >
          <RotateCcw />
        </button>
        <button className="panorama-leave" onClick={onExit}>
          <ChevronLeft size={22} /> Quitter la visite
        </button>
      </div>
      {error && (
        <div className="panorama-error">
          <Notice>{error}</Notice>
        </div>
      )}
    </div>,
    document.body,
  );
}
export function Tours({ data }) {
  const [place, setPlace] = useState(null),
    [selected, setSelected] = useState(null);
  const scenes = (data.panoramas || []).filter((p) => p.tour_id === place?.id);
  const scene = scenes.find((s) => s.id === selected) || scenes[0];
  const exitVisit = () => {
    setPlace(null);
    setSelected(null);
  };
  if (place && scene)
    return (
      <Panorama
        scene={scene}
        place={place}
        scenes={scenes}
        onSelect={setSelected}
        onExit={exitVisit}
      />
    );
  if (place)
    return (
      <section className="section visit-section">
        <button
          className="button secondary"
          onClick={() => {
            setPlace(null);
            setSelected(null);
          }}
        >
          <ChevronLeft size={20} /> Tous les lieux
        </button>
        <div className="visit-heading">
          <div>
            <span className="eyebrow">VISITE IMMERSIVE · 360°</span>
            <h1>{place.name}</h1>
          </div>
          <p>{place.description}</p>
        </div>
        <Notice>
          Les photos à 360° de ce lieu seront bientôt disponibles.
        </Notice>
      </section>
    );
  return (
    <section className="section kiosk-section">
      <div className="page-heading">
        <span className="eyebrow">COMME SI VOUS Y ÉTIEZ</span>
        <h1>Visiter notre église</h1>
        <p>
          Choisissez un lieu, puis faites glisser la photo pour regarder dans
          toutes les directions.
        </p>
      </div>
      <div className="places-grid">
        {(data.tours || []).map((t) => {
          const first = (data.panoramas || []).find((p) => p.tour_id === t.id);
          return (
            <button
              className="place-card"
              key={t.id}
              onClick={() => setPlace(t)}
            >
              <img
                src={
                  mediaUrl(t.image_url || first?.image_url) ||
                  "/images/visit.jpg"
                }
                alt=""
              />
              <span className="place-pill">360°</span>
              <span className="place-caption">
                <strong>{t.name}</strong>
                <small>
                  {
                    (data.panoramas || []).filter((p) => p.tour_id === t.id)
                      .length
                  }{" "}
                  point(s) de vue
                </small>
                <ArrowRight />
              </span>
            </button>
          );
        })}
      </div>
      {!(data.tours || []).length && (
        <div className="visit-empty">
          <View size={54} />
          <h2>Les portes s’ouvriront bientôt.</h2>
          <p>L’équipe prépare les photos à 360° de nos espaces.</p>
          <Link to="/contacts" className="button">
            Contacter l’équipe
          </Link>
        </div>
      )}
    </section>
  );
}
