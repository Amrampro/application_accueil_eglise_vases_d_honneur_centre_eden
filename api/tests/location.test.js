import test from "node:test";
import assert from "node:assert/strict";
import {
  validHttpsUrl,
  validMapUrl,
  embedFromMapUrl,
  resolveMapEmbed,
} from "../services/location.js";

test("Les liens de localisation acceptent Google Maps et refusent les autres hôtes", () => {
  assert.ok(validMapUrl("https://goo.gl/maps/HErpJJU6x13EurFr7"));
  assert.ok(validMapUrl("https://maps.app.goo.gl/example"));
  for (const url of [
    "javascript:alert(1)",
    "https://google.com.evil.test/maps",
    "https://localhost/maps",
    "https://user@google.com/maps",
    "https://google.com:444/maps",
  ])
    assert.equal(validMapUrl(url), false);
  assert.equal(validHttpsUrl("http://payment.test"), false);
  assert.ok(validHttpsUrl("https://payment.test/give"));
});
test("La carte utilise les coordonnées du lieu et non celles de la vue", () => {
  const result = embedFromMapUrl(
    "https://www.google.com/maps/place/Eden/@1,2,15z/data=!3d5.123!4d-4.456",
  );
  assert.equal(new URL(result).searchParams.get("q"), "5.123,-4.456");
  assert.equal(embedFromMapUrl("https://maps.app.goo.gl/example"), "");
});
test("Les liens courts sont résolus et chaque redirection est contrôlée", async () => {
  const request = async () =>
    new Response(null, {
      status: 302,
      headers: { location: "https://www.google.com/maps?q=5.1,-4.2" },
    });
  assert.equal(
    new URL(
      await resolveMapEmbed("https://goo.gl/maps/example", request),
    ).searchParams.get("q"),
    "5.1,-4.2",
  );
  let calls = 0;
  await assert.rejects(
    resolveMapEmbed("https://goo.gl/maps/example", async () => {
      calls++;
      return new Response(null, {
        status: 302,
        headers: { location: "https://localhost/private" },
      });
    }),
    /invalide/,
  );
  assert.equal(calls, 1);
  await assert.rejects(
    resolveMapEmbed(
      "https://goo.gl/maps/example",
      async () => new Response(null),
    ),
    /carte/,
  );
});
