import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import sharp from "sharp";
import { unlink } from "node:fs/promises";
import { mediaDirectory } from "../services/media.js";
import { pool } from "../config/db.js";
process.env.NODE_ENV = "test";
const { app } = await import("../server.js");
test("Parcours complet avec MySQL : authentification, CRUD, demandes et révocation", async () => {
  const server = app.listen(0, "127.0.0.1");
  await new Promise((r) => server.once("listening", r));
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const email = `test-${Date.now()}@example.test`;
  const password = "Temporary-test-password-123";
  let adminId, departmentId, ministryId, requestId, schoolId;
  let tourId, panoramaId, mediaFile;
  const call = async (path, method = "GET", body, token) => {
    const r = await fetch(base + path, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: r.status, data: r.status === 204 ? null : await r.json() };
  };
  try {
    const [created] = await pool.execute(
      "INSERT INTO admins (email,name,password_hash) VALUES (?,?,?)",
      [email, "Test", await bcrypt.hash(password, 4)],
    );
    adminId = created.insertId;
    assert.equal((await call("/health")).status, 200);
    const content = await call("/content");
    assert.equal(content.status, 200);
    assert.ok(content.data.ministries.length >= 8);
    assert.ok(content.data.departments.length >= 48);
    assert.equal((await call("/admin/content/ministries")).status, 401);
    assert.equal(
      (await call("/auth/login", "POST", { email, password: "wrong" })).status,
      401,
    );
    const login = await call("/auth/login", "POST", { email, password });
    assert.equal(login.status, 200);
    const token = login.data.token;
    const tour = await call(
      "/admin/content/tours",
      "POST",
      { name: "TEST visite", published: 1 },
      token,
    );
    assert.equal(tour.status, 201);
    tourId = tour.data.id;
    const photo = await sharp({
      create: { width: 1024, height: 512, channels: 3, background: "#d3b31e" },
    })
      .png()
      .toBuffer();
    const unauth = await fetch(base + "/admin/media", {
      method: "POST",
      headers: { "Content-Type": "image/png" },
      body: photo,
    });
    assert.equal(unauth.status, 401);
    const uploaded = await fetch(base + "/admin/media", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "image/png",
        "X-Media-Type": "panorama",
      },
      body: photo,
    });
    assert.equal(uploaded.status, 201);
    const media = await uploaded.json();
    mediaFile = media.url.split("/").at(-1);
    assert.equal((await fetch(base + media.url.slice(4))).status, 200);
    const pano = await call(
      "/admin/content/panoramas",
      "POST",
      {
        name: "TEST panorama",
        tour_id: tourId,
        image_url: media.url,
        published: 1,
      },
      token,
    );
    assert.equal(pano.status, 201);
    panoramaId = pano.data.id;
    assert.ok(
      (await call("/content")).data.panoramas.some((p) => p.id === panoramaId),
    );
    assert.equal(
      (await call("/admin/content/tours/" + tourId, "DELETE", undefined, token))
        .status,
      409,
    );
    await call(
      "/admin/content/tours/" + tourId,
      "PUT",
      { name: "TEST visite", published: 0 },
      token,
    );
    assert.ok(
      !(await call("/content")).data.panoramas.some((p) => p.id === panoramaId),
    );
    const m = await call(
      "/admin/content/ministries",
      "POST",
      { name: "TEST ministère", published: 0 },
      token,
    );
    assert.equal(m.status, 201);
    ministryId = m.data.id;
    assert.ok(
      !(await call("/content")).data.ministries.some(
        (m) => m.id === ministryId,
      ),
    );
    const d = await call(
      "/admin/content/departments",
      "POST",
      { name: "TEST département", ministry_id: ministryId, published: 1 },
      token,
    );
    assert.equal(d.status, 201);
    departmentId = d.data.id;
    assert.ok(
      !(await call("/content")).data.departments.some(
        (d) => d.id === departmentId,
      ),
      "Un ministère masqué doit masquer ses départements.",
    );
    assert.equal(
      (
        await call(
          "/admin/content/ministries/" + ministryId,
          "DELETE",
          undefined,
          token,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call(
          "/admin/content/departments/" + departmentId,
          "PUT",
          { name: "TEST modifié", ministry_id: ministryId, published: 1 },
          token,
        )
      ).status,
      200,
    );
    const [schools] = await pool.query(
      "SELECT id FROM schools WHERE published=1 LIMIT 1",
    );
    schoolId = schools[0].id;
    const req = await call("/requests", "POST", {
      type: "enrollment",
      first_name: "TEST",
      last_name: email,
      phone: "+225 01 03 88 44 44",
      school_id: schoolId,
    });
    assert.equal(req.status, 201);
    const inbox = await call("/admin/requests", "GET", undefined, token);
    requestId = inbox.data.find((r) => r.last_name === email).id;
    assert.equal(
      (
        await call(
          "/admin/requests/" + requestId,
          "PATCH",
          { status: "in_progress" },
          token,
        )
      ).status,
      200,
    );
    assert.equal(
      (
        await call(
          "/admin/content/schools/" + schoolId,
          "DELETE",
          undefined,
          token,
        )
      ).status,
      409,
    );
    assert.equal(
      (
        await call("/requests", "POST", {
          type: "appointment",
          first_name: "TEST",
          last_name: email,
          reason: "test",
        })
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          "/admin/password",
          "POST",
          { current: password, password: "New-test-password-1234" },
          token,
        )
      ).status,
      200,
    );
    assert.equal(
      (await call("/admin/me", "GET", undefined, token)).status,
      401,
    );
  } finally {
    if (panoramaId)
      await pool.execute("DELETE FROM panoramas WHERE id=?", [panoramaId]);
    if (tourId) await pool.execute("DELETE FROM tours WHERE id=?", [tourId]);
    if (mediaFile) await unlink(mediaDirectory + "/" + mediaFile);
    if (requestId)
      await pool.execute("DELETE FROM requests WHERE id=?", [requestId]);
    if (departmentId)
      await pool.execute("DELETE FROM departments WHERE id=?", [departmentId]);
    if (ministryId)
      await pool.execute("DELETE FROM ministries WHERE id=?", [ministryId]);
    if (adminId) await pool.execute("DELETE FROM admins WHERE id=?", [adminId]);
    await new Promise((r) => server.close(r));
    await pool.end();
  }
});
