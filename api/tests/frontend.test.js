import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { mkdtemp, writeFile, mkdir, rm, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { serveFrontend } from "../services/frontend.js";

test("Les accès directs et rechargements servent les pages, sans absorber les erreurs API ni les ressources absentes", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "church-routing-"));
  const html =
    '<!doctype html><html lang="fr"><body><div id="root">Application Éden</div></body></html>';
  await writeFile(path.join(directory, "index.html"), html);
  await mkdir(path.join(directory, "assets"));
  await writeFile(
    path.join(directory, "assets", "app.js"),
    'console.log("application");',
  );
  await writeFile(path.join(directory, ".env"), "SECRET=not-public");
  const app = express();
  app.get("/api/existing", (req, res) => res.json({ ok: true }));
  serveFrontend(app, directory);
  app.use((req, res) =>
    res.status(404).json({ message: "Route introuvable." }),
  );
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    for (const route of [
      "/",
      "/contacts",
      "/admin",
      "/admin/",
      "/membre/connexion",
      "/membre/espace",
      "/nous-localiser",
      "/eglises",
      "/contacts?source=direct",
    ]) {
      const response = await fetch(base + route, {
        headers: { Accept: "text/html" },
      });
      assert.equal(response.status, 200, route);
      assert.match(response.headers.get("content-type"), /text\/html/);
      assert.equal(await response.text(), html);
      assert.equal(response.headers.get("cache-control"), "no-cache");
    }
    const head = await fetch(base + "/admin", {
      method: "HEAD",
      headers: { Accept: "text/html" },
    });
    assert.equal(head.status, 200);
    assert.equal(await head.text(), "");
    const js = await fetch(base + "/assets/app.js");
    assert.equal(js.status, 200);
    assert.match(await js.text(), /console/);
    assert.deepEqual(await (await fetch(base + "/api/existing")).json(), {
      ok: true,
    });
    for (const route of [
      "/api",
      "/api/unknown",
      "/api/media/missing.jpg",
      "/api/admin/unknown",
    ]) {
      const response = await fetch(base + route, {
        headers: { Accept: "text/html" },
      });
      assert.equal(response.status, 404, route);
      assert.match(response.headers.get("content-type"), /application\/json/);
    }
    for (const route of [
      "/assets/missing.js",
      "/assets/missing",
      "/images/missing.jpg",
      "/.env",
    ]) {
      const response = await fetch(base + route, {
        headers: { Accept: "text/html" },
      });
      assert.equal(response.status, 404, route);
      assert.notEqual(await response.text(), html);
    }
    assert.equal(
      (await fetch(base + "/contacts", { method: "POST" })).status,
      404,
    );
    assert.equal(
      (
        await fetch(base + "/contacts", {
          headers: { Accept: "application/json" },
        })
      ).status,
      404,
    );
  } finally {
    await new Promise((r) => server.close(r));
    assert.equal(path.dirname(directory), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith("church-routing-"));
    await rm(directory, { recursive: true, force: true });
  }
});

test("La règle Apache fait partie des fichiers publiés par Vite", async () => {
  const rules = await readFile(
    new URL("../../webapp/public/.htaccess", import.meta.url),
    "utf8",
  );
  assert.match(rules, /RewriteRule \^api/);
  assert.match(rules, /\/index\.html/);
});
