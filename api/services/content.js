export const resources = {
  churches: {
    fields: [
      "name",
      "description",
      "address",
      "phone",
      "image_url",
      "sort_order",
      "published",
    ],
  },
  tours: {
    fields: ["name", "description", "image_url", "sort_order", "published"],
  },
  panoramas: {
    fields: [
      "name",
      "description",
      "tour_id",
      "image_url",
      "sort_order",
      "published",
    ],
  },
  ministries: {
    fields: ["name", "description", "icon", "sort_order", "published"],
  },
  departments: {
    fields: [
      "name",
      "description",
      "ministry_id",
      "leader",
      "phone",
      "sort_order",
      "published",
    ],
  },
  schools: {
    fields: [
      "name",
      "description",
      "schedule",
      "location",
      "sort_order",
      "published",
    ],
  },
  contacts: {
    fields: [
      "name",
      "description",
      "phone",
      "email",
      "kind",
      "sort_order",
      "published",
    ],
  },
  events: {
    fields: [
      "name",
      "description",
      "starts_at",
      "location",
      "sort_order",
      "published",
    ],
  },
  pastors: {
    fields: [
      "name",
      "description",
      "role",
      "image_url",
      "sort_order",
      "published",
    ],
  },
  cells: {
    fields: [
      "name",
      "description",
      "location",
      "leader",
      "phone",
      "schedule",
      "sort_order",
      "published",
    ],
  },
};
export const requestFields = {
  appointment: [
    "first_name",
    "last_name",
    "sex",
    "need_type",
    "reason",
    "phone",
    "email",
    "preferred_date",
  ],
  enrollment: ["first_name", "last_name", "phone", "email", "school_id"],
  prayer: ["first_name", "last_name", "phone", "email", "reason"],
  testimony: ["first_name", "last_name", "phone", "email", "reason"],
};
const invalid = (message) => {
  throw Object.assign(new Error(message), { status: 400 });
};
export function validateContent(resource, body) {
  if (!Object.hasOwn(resources, resource))
    throw Object.assign(new Error("Rubrique inconnue."), { status: 404 });
  const spec = resources[resource];
  const out = {};
  for (const key of spec.fields) {
    if (body[key] === undefined) continue;
    const value = body[key];
    if (["sort_order", "ministry_id", "tour_id", "published"].includes(key)) {
      const n = Number(value);
      if (
        !Number.isInteger(n) ||
        n < 0 ||
        n > 2147483647 ||
        (key === "published" && n > 1) ||
        (["ministry_id", "tour_id"].includes(key) && n === 0)
      )
        invalid("Valeur numérique invalide.");
      out[key] = n;
    } else {
      if (
        typeof value !== "string" ||
        value.length >
          ({
            description: 10000,
            name: 255,
            leader: 255,
            role: 255,
            email: 255,
            phone: 100,
            kind: 100,
            icon: 100,
          }[key] || 500)
      )
        invalid("Texte invalide ou trop long.");
      out[key] = value.trim() || null;
    }
  }
  if (!out.name) invalid("Le nom est obligatoire.");
  if (resource === "departments" && !out.ministry_id)
    invalid("Choisissez un ministère.");
  if (resource === "panoramas" && (!out.tour_id || !out.image_url))
    invalid("Choisissez un lieu et une photo panoramique.");
  if (out.image_url && !validImageUrl(out.image_url))
    invalid("Téléversez une photo ou utilisez une URL HTTPS.");
  if (out.starts_at) {
    if (!Number.isFinite(Date.parse(out.starts_at))) invalid("Date invalide.");
    out.starts_at = new Date(out.starts_at)
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");
  }
  return out;
}
export function validImageUrl(value) {
  return (
    /^\/api\/media\/[a-f0-9-]+\.jpg$/.test(value) || /^https:\/\//.test(value)
  );
}
export function validateRequest(body) {
  if (!Object.hasOwn(requestFields, body.type))
    invalid("Type de demande inconnu.");
  const fields = requestFields[body.type];
  if (!fields) invalid("Type de demande inconnu.");
  const out = { type: body.type };
  for (const key of fields) {
    const value = body[key];
    if (key === "school_id") {
      if (!Number.isInteger(Number(value)) || Number(value) < 1)
        invalid("Choisissez une école.");
      out[key] = Number(value);
    } else {
      if (
        value !== undefined &&
        (typeof value !== "string" ||
          value.length > (key === "reason" ? 4000 : 250))
      )
        invalid("Champ invalide ou trop long.");
      out[key] = (value || "").trim() || null;
    }
  }
  for (const key of [
    "first_name",
    "last_name",
    ...(body.type === "enrollment" ? ["phone"] : []),
    ...(["appointment", "prayer", "testimony"].includes(body.type)
      ? ["reason"]
      : []),
  ])
    if (!out[key]) invalid("Veuillez remplir les champs obligatoires.");
  if (
    body.type === "appointment" &&
    (!["Femme", "Homme", "Non précisé"].includes(out.sex) ||
      !["Spirituel", "Familial", "Professionnel", "Autre"].includes(
        out.need_type,
      ))
  )
    invalid("Choisissez le sexe et le type de besoin.");
  if (out.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))
    invalid("Adresse e-mail invalide.");
  if (out.phone && !/^\+?[\d\s().-]{8,25}$/.test(out.phone))
    invalid("Numéro de téléphone invalide.");
  if (
    out.preferred_date &&
    (!/^\d{4}-\d{2}-\d{2}$/.test(out.preferred_date) ||
      !Number.isFinite(Date.parse(out.preferred_date)) ||
      new Date(out.preferred_date).toISOString().slice(0, 10) !==
        out.preferred_date ||
      out.preferred_date < new Date().toISOString().slice(0, 10))
  )
    invalid("Choisissez une date future.");
  return out;
}
