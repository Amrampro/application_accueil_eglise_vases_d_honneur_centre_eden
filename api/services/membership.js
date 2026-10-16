import { createHash } from "node:crypto";
export const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
export function text(value, label, max = 255, required = false) {
  if (value == null && !required) return "";
  if (
    typeof value !== "string" ||
    value.trim().length > max ||
    (required && !value.trim())
  )
    fail(`${label} : valeur invalide.`);
  return value.trim();
}
export function id(value) {
  const result = Number(value);
  if (!Number.isSafeInteger(result) || result < 1 || result > 4294967295)
    fail("Identifiant invalide.");
  return result;
}
export function choice(value, choices, label) {
  if (!choices.includes(value)) fail(`${label} : choix invalide.`);
  return value;
}
export function normalizeName(value) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("fr")
    .replace(/[^\p{L}\p{N}]/gu, "");
}
export function normalizePhone(value) {
  const raw = text(value, "Téléphone", 40, true);
  if (!/^[+\d\s().-]+$/.test(raw)) fail("Téléphone invalide.");
  const phone = raw.replace(/\D/g, "").replace(/^00/, "");
  if (phone.length < 8 || phone.length > 15)
    fail("Le téléphone doit contenir entre 8 et 15 chiffres.");
  return phone;
}
export function identityKey(name, sex, phone) {
  return createHash("sha256")
    .update(JSON.stringify([normalizeName(name), sex, phone]))
    .digest("hex");
}
export function day(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail("Date invalide.");
  return value;
}
export function dateTime(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}.*(?:Z|[+-]\d{2}:\d{2})$/.test(value) ||
    !Number.isFinite(Date.parse(value))
  )
    fail("Date et heure invalides.");
  return new Date(value).toISOString().slice(0, 19).replace("T", " ");
}
export function registration(body) {
  const full_name = text(body.full_name, "Nom et prénoms", 255, true);
  if (normalizeName(full_name).length < 2)
    fail("Saisissez le nom et les prénoms.");
  const sex = choice(body.sex, ["male", "female"], "Sexe");
  const phone = text(body.phone, "Téléphone", 40, true);
  const phone_normalized = normalizePhone(phone);
  const channels = body.referral_channels ?? [];
  if (!Array.isArray(channels) || channels.length > 5)
    fail("Canaux de découverte invalides.");
  channels.forEach((c) =>
    choice(c, ["person", "internet", "flyer", "evangelism", "other"], "Canal"),
  );
  if (typeof body.attends_regularly !== "boolean")
    fail("Précisez si vous fréquentez régulièrement cette communauté.");
  const decisions = body.decision_ids ?? [];
  if (
    !Array.isArray(decisions) ||
    decisions.length > 100 ||
    new Set(decisions.map(Number)).size !== decisions.length
  )
    fail("Décisions invalides.");
  return {
    full_name,
    sex,
    phone,
    phone_normalized,
    neighborhood: text(body.neighborhood, "Quartier"),
    municipality: text(body.municipality, "Commune"),
    profession: text(body.profession, "Profession"),
    community: text(body.community, "Communauté fréquentée"),
    attends_regularly: body.attends_regularly ? 1 : 0,
    referral_channels: JSON.stringify([...new Set(channels)]),
    referrer_name: text(
      body.referrer_name,
      "Nom de la personne",
      255,
      channels.includes("person"),
    ),
    referrer_contact: text(body.referrer_contact, "Contact de la personne"),
    referral_other: text(
      body.referral_other,
      "Autre canal",
      500,
      channels.includes("other"),
    ),
    age_range: choice(
      body.age_range,
      ["10-20", "21-30", "31-35", "36-45", "46+"],
      "Tranche d’âge",
    ),
    marital_status: choice(
      body.marital_status,
      [
        "single",
        "engaged",
        "married",
        "cohabiting",
        "divorced",
        "separated",
        "widowed",
      ],
      "Situation matrimoniale",
    ),
    service_number: text(body.service_number, "Numéro de culte", 30),
    notes: text(body.notes, "Commentaires", 10000),
    identity_key: identityKey(full_name, sex, phone_normalized),
    decision_ids: decisions.map(id),
  };
}
export function decision(body) {
  return {
    decision_number: id(body.decision_number),
    meaning: text(body.meaning, "Décision / signification", 500, true),
    directive: text(body.directive, "Directive", 10000, true),
  };
}
export function pagination(query) {
  const page = query.page === undefined ? 1 : id(query.page);
  if (page > 1000000) fail("Page invalide.");
  return { page, limit: 20, offset: (page - 1) * 20 };
}
