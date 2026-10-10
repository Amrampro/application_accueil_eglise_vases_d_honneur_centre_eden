import test from "node:test";
import assert from "node:assert/strict";
import { validateContent, validateRequest } from "../services/content.js";
test("Les rendez-vous exigent les informations pastorales du document", () => {
  assert.throws(() =>
    validateRequest({
      type: "appointment",
      first_name: "Anne",
      last_name: "Yao",
      reason: "Accompagnement",
    }),
  );
  assert.equal(
    validateRequest({
      type: "appointment",
      first_name: "Anne",
      last_name: "Yao",
      sex: "Femme",
      need_type: "Familial",
      reason: "Accompagnement",
    }).need_type,
    "Familial",
  );
});
test("Les inscriptions exigent un téléphone et une école", () => {
  assert.throws(() =>
    validateRequest({
      type: "enrollment",
      first_name: "Anne",
      last_name: "Yao",
      school_id: 1,
    }),
  );
  assert.throws(() =>
    validateRequest({
      type: "enrollment",
      first_name: "Anne",
      last_name: "Yao",
      phone: "+225 01 03 88 44 44",
      school_id: "x",
    }),
  );
});
test("Les champs inconnus ne peuvent pas modifier un statut ou un identifiant", () => {
  const r = validateRequest({
    type: "prayer",
    first_name: "Anne",
    last_name: "Yao",
    reason: "Prière",
    status: "done",
    id: 5,
  });
  assert.equal(r.status, undefined);
  assert.equal(r.id, undefined);
});
test("Le contenu protège les références et les URL", () => {
  assert.throws(() =>
    validateContent("departments", { name: "Test", ministry_id: 0 }),
  );
  assert.throws(() =>
    validateContent("pastors", {
      name: "Test",
      image_url: "javascript:alert(1)",
    }),
  );
  assert.throws(() => validateContent("admins", { name: "Test" }));
  assert.throws(() =>
    validateContent("ministries", { name: "Test", published: 3 }),
  );
});
test("Les textes trop longs et e-mails invalides sont refusés", () => {
  assert.throws(() => validateContent("ministries", { name: "a".repeat(256) }));
  assert.throws(() =>
    validateContent("ministries", { name: "Test", sort_order: 2147483648 }),
  );
  assert.throws(() =>
    validateRequest({
      type: "prayer",
      first_name: "A",
      last_name: "B",
      reason: "a".repeat(4001),
    }),
  );
  assert.throws(() =>
    validateRequest({
      type: "prayer",
      first_name: "A",
      last_name: "B",
      reason: "Prière",
      email: "incorrect",
    }),
  );
});
