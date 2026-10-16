import test from "node:test";
import assert from "node:assert/strict";
import mysql from "mysql2/promise";
import dotenv from "dotenv";
import { readFile } from "node:fs/promises";
import bcrypt from "bcryptjs";
import ExcelJS from "exceljs";
dotenv.config({ path: new URL("../.env", import.meta.url) });
process.env.NODE_ENV = "test";
const database = `vase_members_test_${process.pid}_${Date.now()}`;
const config = {
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
  dateStrings: true,
};
test("Parcours membres isolé : inscription, doublons, droits, groupes, suivi et exports", async () => {
  const db = await mysql.createConnection(config);
  let server, pool;
  try {
    await db.query(
      `CREATE DATABASE \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await db.query(`USE \`${database}\``);
    await db.query(
      await readFile(
        new URL("../database/schema.sql", import.meta.url),
        "utf8",
      ),
    );
    process.env.DB_NAME = database;
    ({ pool } = await import("../config/db.js"));
    const { app } = await import("../server.js");
    server = app.listen(0, "127.0.0.1");
    await new Promise((r) => server.once("listening", r));
    const base = `http://127.0.0.1:${server.address().port}/api`;
    const call = async (path, method = "GET", body, token) => {
      const r = await fetch(base + path, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      });
      return {
        status: r.status,
        data: r.status === 204 ? null : await r.json(),
      };
    };
    const body = {
      full_name: "Élodie Kouamé",
      sex: "female",
      phone: "+2250700000001",
      neighborhood: "Éden",
      municipality: "Yopougon",
      profession: "Enseignante",
      community: "Centre Éden",
      attends_regularly: true,
      referral_channels: ["person", "internet"],
      referrer_name: "Marie",
      referrer_contact: "0102030405",
      age_range: "21-30",
      marital_status: "single",
      decision_ids: [1, 12],
      service_number: "2",
      notes: "Accueil et prière",
    };
    const decisions = await call("/membership/decisions");
    assert.equal(decisions.data.length, 12);
    assert.equal(decisions.data[0].directive, undefined);
    const created = await call("/membership/register", "POST", body);
    assert.equal(created.status, 201);
    assert.equal(created.data.token, undefined);
    const duplicate = await call("/membership/register", "POST", {
      ...body,
      full_name: "ELODIE  KOUAME",
      phone: "00225 07 00 00 00 01",
    });
    assert.equal(duplicate.status, 409);
    const [records] = await db.query("SELECT * FROM members");
    assert.equal(records.length, 1);
    assert.ok(await bcrypt.compare("password", records[0].password_hash));
    const leadId = records[0].id;
    const concurrent = await Promise.all([
      call("/membership/register", "POST", {
        ...body,
        full_name: "Concurrent",
        phone: "0102030406",
      }),
      call("/membership/register", "POST", {
        ...body,
        full_name: "Concurrent",
        phone: "0102030406",
      }),
    ]);
    assert.deepEqual(concurrent.map((r) => r.status).sort(), [201, 409]);
    assert.equal(
      (await call("/membership/register", "POST", { ...body, sex: "male" }))
        .status,
      201,
    );
    assert.equal(
      (
        await call("/membership/register", "POST", {
          ...body,
          full_name: "Assistant",
          phone: "0102030407",
          sex: "male",
        })
      ).status,
      201,
    );
    assert.equal(
      (
        await call("/membership/register", "POST", {
          ...body,
          full_name: "Visiteur",
          phone: "0102030408",
        })
      ).status,
      201,
    );
    const [assistRows] = await db.query(
      "SELECT id FROM members WHERE full_name='Assistant'",
    );
    const assistantId = assistRows[0].id;
    const [guestRows] = await db.query(
      "SELECT id FROM members WHERE full_name='Visiteur'",
    );
    const guestId = guestRows[0].id;
    await db.execute(
      "INSERT INTO admins(email,name,password_hash) VALUES(?,?,?)",
      [
        "membership@test.example",
        "Admin test",
        await bcrypt.hash("admin-test-password", 4),
      ],
    );
    const admin = (
      await call("/auth/login", "POST", {
        email: "membership@test.example",
        password: "admin-test-password",
      })
    ).data.token;
    const token = (
      await call("/membership/login", "POST", {
        full_name: body.full_name,
        phone: body.phone,
        sex: body.sex,
        password: "password",
      })
    ).data.token;
    const guestToken = (
      await call("/membership/login", "POST", {
        full_name: "Visiteur",
        phone: "0102030408",
        sex: "female",
        password: "password",
      })
    ).data.token;
    assert.ok(token);
    assert.equal(
      (await call("/admin/me", "GET", undefined, token)).status,
      401,
    );
    assert.equal(
      (await call("/admin/membership/members", "GET", undefined, token)).status,
      401,
    );
    assert.equal(
      (await call("/member/me", "GET", undefined, admin)).status,
      401,
    );
    assert.deepEqual(
      (await call("/member/groups", "GET", undefined, token)).data,
      [],
    );
    const group = await call(
      "/admin/membership/groups",
      "POST",
      {
        name: "Groupe Éden",
        description: "Suivi des nouveaux",
        leader_id: leadId,
        assistant_id: assistantId,
      },
      admin,
    );
    assert.equal(group.status, 201);
    const groupId = group.data.id;
    const prefix = `/member/groups/${groupId}`;
    assert.equal(
      (await call("/member/groups", "GET", undefined, token)).data.length,
      1,
    );
    assert.equal(
      (await call(prefix, "GET", undefined, guestToken)).status,
      403,
    );
    assert.equal(
      (
        await call(
          prefix + "/members",
          "POST",
          { member_id: guestId },
          guestToken,
        )
      ).status,
      403,
    );
    assert.equal(
      (await call(prefix + "/members", "POST", { member_id: guestId }, token))
        .status,
      201,
    );
    assert.equal(
      (
        await call(
          prefix + "/coordinator",
          "PUT",
          { member_id: guestId },
          token,
        )
      ).status,
      200,
    );
    const assistantToken = (
      await call("/membership/login", "POST", {
        full_name: "Assistant",
        phone: "0102030407",
        sex: "male",
        password: "password",
      })
    ).data.token;
    assert.equal(
      (await call(prefix, "GET", undefined, assistantToken)).status,
      200,
    );
    const action = await call(
      `${prefix}/members/${guestId}/actions`,
      "POST",
      {
        kind: "call",
        status: "planned",
        scheduled_at: "2026-10-17T10:00:00+02:00",
        observation: "Appeler pour souhaiter la bienvenue",
      },
      token,
    );
    assert.equal(action.status, 201);
    assert.equal(
      (
        await call(
          `${prefix}/actions/${action.data.id}`,
          "PUT",
          {
            status: "completed",
            scheduled_at: "2026-10-17T10:00:00+02:00",
            completed_at: "2026-10-17T10:15:00+02:00",
            observation: "Appel effectué, souhaite une visite",
          },
          assistantToken,
        )
      ).status,
      200,
    );
    const full = (
      await call(
        `/admin/membership/members/${guestId}`,
        "GET",
        undefined,
        admin,
      )
    ).data;
    assert.equal(full.actions[0].status, "completed");
    assert.match(full.actions[0].observation, /visite/);
    assert.equal(full.actions[0].actor_name, body.full_name);
    assert.equal(full.referrer_name, "Marie");
    assert.equal(full.password_hash, undefined);
    assert.equal(full.decisions.length, 2);
    const bad = await call(
      `${prefix}/members/${guestId}/actions`,
      "POST",
      {
        kind: "call",
        status: "planned",
        scheduled_at: "not-a-date",
        observation: "x",
      },
      token,
    );
    assert.equal(bad.status, 400);
    assert.equal(
      (await call("/admin/membership/decisions/12", "DELETE", undefined, admin))
        .status,
      204,
    );
    assert.equal(
      (
        await call(
          `/admin/membership/members/${guestId}`,
          "GET",
          undefined,
          admin,
        )
      ).data.decisions.length,
      2,
    );
    const addedDecision = await call(
      "/admin/membership/decisions",
      "POST",
      {
        decision_number: 25,
        meaning: "Test décision",
        directive: "Test directive",
      },
      admin,
    );
    assert.equal(addedDecision.status, 201);
    assert.equal(
      (
        await call(
          `/admin/membership/decisions/${addedDecision.data.id}`,
          "PUT",
          {
            decision_number: 25,
            meaning: "Test modifié",
            directive: "Nouvelle directive",
          },
          admin,
        )
      ).status,
      200,
    );
    const pdf = await fetch(`${base}${prefix}/export/pdf`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(pdf.status, 200);
    assert.match(
      Buffer.from(await pdf.arrayBuffer()).toString("ascii", 0, 5),
      /%PDF-/,
    );
    const xlsx = await fetch(`${base}${prefix}/export/xlsx`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.equal(xlsx.status, 200);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(await xlsx.arrayBuffer()));
    assert.equal(workbook.worksheets[0].rowCount, 4);
    assert.equal(workbook.worksheets[0].getCell("A1").value, "Nom et prénoms");
    for (let n = 0; n < 23; n++)
      await db.execute(
        "INSERT INTO members(full_name,sex,phone,phone_normalized,referral_channels,age_range,marital_status,notes,joined_on,password_hash,identity_key) VALUES(?,'male',?,?,'[]','21-30','single','','2026-01-01',?,?)",
        [
          `Pagination ${n}`,
          `010000${String(n).padStart(4, "0")}`,
          `010000${String(n).padStart(4, "0")}`,
          records[0].password_hash,
          String(n).padStart(64, "0"),
        ],
      );
    const page1 = (
      await call("/admin/membership/members?page=1", "GET", undefined, admin)
    ).data;
    const page2 = (
      await call("/admin/membership/members?page=2", "GET", undefined, admin)
    ).data;
    assert.equal(page1.rows.length, 20);
    assert.equal(page2.rows.length, 8);
    assert.ok(page1.rows.every((a) => !page2.rows.some((b) => b.id === a.id)));
    const filtered = await call(
      "/admin/membership/members?from=2026-01-01&to=2026-01-01",
      "GET",
      undefined,
      admin,
    );
    assert.equal(filtered.data.total, 23);
    assert.equal(
      (
        await call(
          "/admin/membership/members?from=2026-02-01&to=2026-01-01",
          "GET",
          undefined,
          admin,
        )
      ).status,
      400,
    );
    assert.equal(
      (await call(`${prefix}/members/${leadId}`, "DELETE", undefined, token))
        .status,
      400,
    );
    await call(prefix + "/coordinator", "PUT", { member_id: null }, token);
    assert.equal(
      (await call(`${prefix}/members/${guestId}`, "DELETE", undefined, token))
        .status,
      204,
    );
    assert.equal(
      (await call(`${prefix}/members/${guestId}`, "GET", undefined, token))
        .status,
      404,
    );
    assert.equal(
      (
        await call(
          `/admin/membership/groups/${groupId}`,
          "DELETE",
          undefined,
          admin,
        )
      ).status,
      204,
    );
    assert.equal(
      (
        await call(
          `/admin/membership/members/${guestId}`,
          "GET",
          undefined,
          admin,
        )
      ).data.actions.length,
      1,
    );
    assert.equal(
      (
        await call(
          "/member/password",
          "POST",
          { current: "password", password: "new-member-password" },
          token,
        )
      ).status,
      200,
    );
    assert.equal(
      (await call("/member/me", "GET", undefined, token)).status,
      401,
    );
  } finally {
    if (server) await new Promise((r) => server.close(r));
    if (pool) await pool.end();
    await db.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await db.end();
  }
});
