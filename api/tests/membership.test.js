import test from "node:test";
import assert from "node:assert/strict";
import {
  registration,
  normalizeName,
  normalizePhone,
  identityKey,
  decision,
  pagination,
  day,
  dateTime,
} from "../services/membership.js";
const body = {
  full_name: "Élodie  Kouamé",
  sex: "female",
  phone: "+225 07 00 00 00 01",
  attends_regularly: false,
  age_range: "21-30",
  marital_status: "single",
  decision_ids: [1, 2],
  referral_channels: ["internet"],
};
test("L’identité ignore accents, casse, espaces et format du téléphone", () => {
  const a = registration(body),
    b = registration({
      ...body,
      full_name: "elodie kouame",
      phone: "002250700000001",
    });
  assert.equal(a.identity_key, b.identity_key);
  assert.notEqual(
    a.identity_key,
    identityKey(body.full_name, "male", a.phone_normalized),
  );
  assert.equal(normalizeName("  Jean-Pierre  D’Arc "), "jeanpierredarc");
  assert.equal(normalizePhone("01 02 03 04 05"), "0102030405");
});
test("Le formulaire valide les choix et ne prend aucun privilège du navigateur", () => {
  const result = registration({
    ...body,
    password: "secret",
    token_version: 99,
    joined_on: "2000-01-01",
    id: 5,
  });
  for (const key of ["password", "token_version", "joined_on", "id"])
    assert.equal(result[key], undefined);
  for (const change of [
    { sex: "other" },
    { age_range: "35-45" },
    { marital_status: "unknown" },
    { attends_regularly: "no" },
    { decision_ids: [1, 1] },
    { decision_ids: [0] },
    { phone: "abc" },
    { full_name: "---" },
    { referral_channels: ["other"] },
    { referral_channels: ["person"] },
    { notes: "a".repeat(10001) },
  ])
    assert.throws(() => registration({ ...body, ...change }));
});
test("Les décisions, dates et pages sont bornées", () => {
  assert.deepEqual(
    decision({
      decision_number: 12,
      meaning: "Prière",
      directive: "Accompagner",
    }),
    { decision_number: 12, meaning: "Prière", directive: "Accompagner" },
  );
  assert.throws(() =>
    decision({
      decision_number: 0,
      meaning: "Prière",
      directive: "Accompagner",
    }),
  );
  assert.equal(pagination({ page: "2" }).offset, 20);
  assert.throws(() => pagination({ page: "1;DROP TABLE members" }));
  assert.throws(() => day("2026-02-30"));
  assert.throws(() => dateTime("2026-10-16T10:00"));
  assert.equal(dateTime("2026-10-16T10:00:00+02:00"), "2026-10-16 08:00:00");
});
import { localDateTime, actionDateToIso } from "../../webapp/src/member-api.js";
test("Les rendez-vous de suivi restent à l’heure de Bruxelles, été comme hiver", () => {
  assert.equal(localDateTime("2026-10-16T08:00:00Z"), "2026-10-16T10:00");
  assert.equal(actionDateToIso("2026-10-16T10:00"), "2026-10-16T08:00:00.000Z");
  assert.equal(actionDateToIso("2026-12-16T10:00"), "2026-12-16T09:00:00.000Z");
  assert.throws(() => actionDateToIso("2026-03-29T02:30"), /n’existe pas/);
});
