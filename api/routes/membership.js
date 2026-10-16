import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import { pool } from "../config/db.js";
import { auth } from "../middlewares/auth.js";
import { wrap } from "../controllers/content.js";
import {
  registration,
  decision,
  fail,
  id,
  text,
  choice,
  uniqueIdentification,
  pagination,
  day,
  dateTime,
} from "../services/membership.js";
import { exportGroup } from "../services/member-export.js";
const router = Router();
router.use(
  ["/membership", "/member", "/admin/membership"],
  (req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  },
);
const profileColumns =
  "id,unique_identification,full_name,sex,neighborhood,municipality,phone,profession,community,attends_regularly,referral_channels,referrer_name,referrer_contact,referral_other,age_range,marital_status,service_number,notes,joined_on,created_at";
const limited = (limit) =>
  rateLimit({
    windowMs: 900000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      message: "Trop de tentatives. Réessayez dans quelques minutes.",
    },
  });
async function transaction(fn) {
  const db = await pool.getConnection();
  try {
    await db.beginTransaction();
    const result = await fn(db);
    await db.commit();
    return result;
  } catch (e) {
    await db.rollback();
    throw e;
  } finally {
    db.release();
  }
}
async function memberAuth(req, res, next) {
  try {
    const payload = jwt.verify(
      req.headers.authorization?.replace(/^Bearer /, ""),
      process.env.JWT_SECRET,
      { algorithms: ["HS256"], audience: "church-member" },
    );
    const [rows] = await pool.execute(
      "SELECT id,full_name,token_version FROM members WHERE id=?",
      [payload.sub],
    );
    if (!rows[0] || rows[0].token_version !== payload.version)
      fail("Session expirée. Reconnectez-vous.", 401);
    req.member = rows[0];
    next();
  } catch (e) {
    if (e.code && !e.name?.includes("Token")) return next(e);
    res
      .status(401)
      .json({ message: "Veuillez vous connecter à votre espace membre." });
  }
}
router.get(
  "/membership/decisions",
  wrap(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT id,decision_number,meaning FROM decision_today ORDER BY decision_number,id",
    );
    res.json(rows);
  }),
);
router.post(
  "/membership/register",
  limited(30),
  wrap(async (req, res) => {
    const values = registration(req.body);
    const decisionIds = values.decision_ids;
    delete values.decision_ids;
    values.password_hash = await bcrypt.hash("password", 12);
    values.joined_on = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Brussels",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
    let identification;
    try {
      identification = await transaction(async (db) => {
        let decisions = [];
        if (decisionIds.length) {
          [decisions] = await db.query(
            "SELECT * FROM decision_today WHERE id IN (?) LOCK IN SHARE MODE",
            [decisionIds],
          );
          if (decisions.length !== decisionIds.length)
            fail("Une décision a été modifiée. Rechargez le formulaire.");
        }
        const [result] = await db.execute(
          `INSERT INTO members (${Object.keys(values).join(",")}) VALUES (${Object.keys(
            values,
          )
            .map(() => "?")
            .join(",")})`,
          Object.values(values),
        );
        for (const d of decisions)
          await db.execute(
            "INSERT INTO member_decisions (member_id,decision_id,decision_number,meaning,directive) VALUES (?,?,?,?,?)",
            [result.insertId, d.id, d.decision_number, d.meaning, d.directive],
          );
        const [members] = await db.execute(
          "SELECT unique_identification FROM members WHERE id=?",
          [result.insertId],
        );
        return members[0].unique_identification;
      });
    } catch (e) {
      if (e.code === "ER_DUP_ENTRY")
        fail(
          "Ce membre est déjà dans le système. Choisissez « Je suis déjà membre ».",
          409,
        );
      throw e;
    }
    res.status(201).json({
      message: "Bienvenue ! Vos informations ont bien été prises en compte.",
      unique_identification: identification,
    });
  }),
);
router.post(
  "/membership/login",
  limited(15),
  wrap(async (req, res) => {
    const identification = uniqueIdentification(req.body.unique_identification);
    const password = text(req.body.password, "Mot de passe", 250, true);
    const [rows] = await pool.execute(
      "SELECT id,unique_identification,full_name,password_hash,token_version FROM members WHERE unique_identification=?",
      [identification],
    );
    const member = rows[0];
    if (!member || !(await bcrypt.compare(password, member.password_hash)))
      fail("Identifiant membre ou mot de passe incorrect.", 401);
    res.json({
      token: jwt.sign(
        { version: member.token_version },
        process.env.JWT_SECRET,
        {
          subject: String(member.id),
          audience: "church-member",
          expiresIn: "2h",
          algorithm: "HS256",
        },
      ),
      name: member.full_name,
      unique_identification: member.unique_identification,
    });
  }),
);
router.use("/member", memberAuth);
router.use("/admin/membership", auth);
router.get(
  "/member/me",
  wrap(async (req, res) => {
    const [rows] = await pool.execute(
      `SELECT ${profileColumns} FROM members WHERE id=?`,
      [req.member.id],
    );
    res.json(rows[0]);
  }),
);
router.post(
  "/member/password",
  wrap(async (req, res) => {
    const current = text(req.body.current, "Mot de passe actuel", 250, true);
    const password = text(req.body.password, "Nouveau mot de passe", 72, true);
    if (
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72 ||
      password === "password"
    )
      fail("Choisissez un mot de passe personnel de 8 à 72 caractères.");
    const [rows] = await pool.execute(
      "SELECT password_hash FROM members WHERE id=?",
      [req.member.id],
    );
    if (!(await bcrypt.compare(current, rows[0].password_hash)))
      fail("Mot de passe actuel incorrect.");
    await pool.execute(
      "UPDATE members SET password_hash=?,token_version=token_version+1 WHERE id=?",
      [await bcrypt.hash(password, 12), req.member.id],
    );
    res.json({ message: "Mot de passe modifié. Reconnectez-vous." });
  }),
);
async function listMembers(req, res, directory = false) {
  const { page, offset } = pagination(req.query);
  const q = text(req.query.q, "Recherche", 255);
  const where = [],
    args = [];
  if (directory && q.length < 2)
    return res.json({ rows: [], total: 0, page, page_size: 20 });
  if (q) {
    where.push(
      "(full_name LIKE ? OR phone LIKE ? OR unique_identification LIKE ?)",
    );
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  if (!directory) {
    if (req.query.from) {
      where.push("joined_on>=?");
      args.push(day(req.query.from));
    }
    if (req.query.to) {
      where.push("joined_on<=?");
      args.push(day(req.query.to));
    }
    if (req.query.from && req.query.to && req.query.from > req.query.to)
      fail("La date de fin doit suivre la date de début.");
  }
  const filter = where.length ? " WHERE " + where.join(" AND ") : "";
  const [count] = await pool.execute(
    "SELECT COUNT(*) AS total FROM members" + filter,
    args,
  );
  const [rows] = await pool.execute(
    `SELECT id,unique_identification,full_name,sex,phone,municipality,joined_on FROM members${filter} ORDER BY joined_on DESC,id DESC LIMIT 20 OFFSET ${offset}`,
    args,
  );
  res.json({ rows, total: count[0].total, page, page_size: 20 });
}
router.get(
  "/admin/membership/members",
  wrap((req, res) => listMembers(req, res)),
);
router.get(
  "/member/directory",
  wrap((req, res) => listMembers(req, res, true)),
);
async function memberProfile(memberId, groupId) {
  const [rows] = await pool.execute(
    `SELECT ${profileColumns} FROM members WHERE id=?`,
    [id(memberId)],
  );
  if (!rows[0]) fail("Membre introuvable.", 404);
  const [decisions] = await pool.execute(
    "SELECT decision_number,meaning,directive FROM member_decisions WHERE member_id=? ORDER BY decision_number",
    [memberId],
  );
  const [groups] = await pool.execute(
    "SELECT g.id,g.name FROM member_groups g JOIN group_members gm ON gm.group_id=g.id WHERE gm.member_id=?",
    [memberId],
  );
  const [actions] = await pool.execute(
    `SELECT a.*,g.name AS current_group_name FROM member_actions a LEFT JOIN member_groups g ON g.id=a.group_id WHERE a.member_id=?${groupId ? " AND a.group_id=?" : ""} ORDER BY a.scheduled_at DESC,a.id DESC`,
    groupId ? [memberId, groupId] : [memberId],
  );
  return {
    ...rows[0],
    decisions,
    groups: groupId ? groups.filter((g) => g.id === groupId) : groups,
    actions,
  };
}
router.get(
  "/admin/membership/members/:id",
  wrap(async (req, res) => res.json(await memberProfile(id(req.params.id)))),
);
router.get(
  "/admin/membership/decisions",
  wrap(async (req, res) => {
    const [rows] = await pool.query(
      "SELECT * FROM decision_today ORDER BY decision_number,id",
    );
    res.json(rows);
  }),
);
router.post(
  "/admin/membership/decisions",
  wrap(async (req, res) => {
    const d = decision(req.body);
    const [r] = await pool.execute(
      "INSERT INTO decision_today (decision_number,meaning,directive) VALUES (?,?,?)",
      Object.values(d),
    );
    res.status(201).json({ id: r.insertId });
  }),
);
router.put(
  "/admin/membership/decisions/:id",
  wrap(async (req, res) => {
    const d = decision(req.body);
    const [r] = await pool.execute(
      "UPDATE decision_today SET decision_number=?,meaning=?,directive=? WHERE id=?",
      [...Object.values(d), id(req.params.id)],
    );
    if (!r.affectedRows) fail("Décision introuvable.", 404);
    res.json({ message: "Décision enregistrée." });
  }),
);
router.delete(
  "/admin/membership/decisions/:id",
  wrap(async (req, res) => {
    const [r] = await pool.execute("DELETE FROM decision_today WHERE id=?", [
      id(req.params.id),
    ]);
    if (!r.affectedRows) fail("Décision introuvable.", 404);
    res.status(204).end();
  }),
);
const groupSelect =
  "SELECT g.*,l.full_name AS leader_name,a.full_name AS assistant_name,c.full_name AS coordinator_name,(SELECT COUNT(*) FROM group_members gm WHERE gm.group_id=g.id) AS member_count FROM member_groups g JOIN members l ON l.id=g.leader_id LEFT JOIN members a ON a.id=g.assistant_id LEFT JOIN members c ON c.id=g.coordinator_id";
async function getGroup(req, groupId, db = pool, lock = false) {
  const [rows] = await db.execute(
    "SELECT * FROM member_groups WHERE id=?" + (lock ? " FOR UPDATE" : ""),
    [id(groupId)],
  );
  const group = rows[0];
  if (!group) fail("Groupe introuvable.", 404);
  if (
    !req.admin &&
    ![group.leader_id, group.assistant_id, group.coordinator_id].includes(
      req.member?.id,
    )
  )
    fail("Vous ne gérez pas ce groupe.", 403);
  return group;
}
async function requireGroupMember(db, groupId, memberId) {
  const [rows] = await db.execute(
    "SELECT member_id FROM group_members WHERE group_id=? AND member_id=?",
    [groupId, id(memberId)],
  );
  if (!rows.length) fail("Cette personne ne fait pas partie du groupe.", 404);
}
router.get(
  "/admin/membership/groups",
  wrap(async (req, res) => {
    const [rows] = await pool.query(groupSelect + " ORDER BY g.id DESC");
    res.json(rows);
  }),
);
router.get(
  "/member/groups",
  wrap(async (req, res) => {
    const [rows] = await pool.execute(
      groupSelect +
        " WHERE g.leader_id=? OR g.assistant_id=? OR g.coordinator_id=? ORDER BY g.id DESC",
      [req.member.id, req.member.id, req.member.id],
    );
    res.json(rows);
  }),
);
async function saveGroup(req, res) {
  const values = {
    name: text(req.body.name, "Nom du groupe", 255, true),
    description: text(req.body.description, "Description", 10000),
    leader_id: id(req.body.leader_id),
    assistant_id: req.body.assistant_id ? id(req.body.assistant_id) : null,
  };
  if (values.leader_id === values.assistant_id)
    fail(
      "Le responsable et son assistant doivent être deux membres différents.",
    );
  const groupId = await transaction(async (db) => {
    let groupId;
    if (req.params.id) {
      await getGroup(req, req.params.id, db, true);
      groupId = id(req.params.id);
      await db.execute(
        "UPDATE member_groups SET name=?,description=?,leader_id=?,assistant_id=? WHERE id=?",
        [...Object.values(values), groupId],
      );
    } else {
      const [r] = await db.execute(
        "INSERT INTO member_groups (name,description,leader_id,assistant_id) VALUES (?,?,?,?)",
        Object.values(values),
      );
      groupId = r.insertId;
    }
    for (const memberId of [values.leader_id, values.assistant_id].filter(
      Boolean,
    ))
      await db.execute(
        "INSERT IGNORE INTO group_members (group_id,member_id) VALUES (?,?)",
        [groupId, memberId],
      );
    return groupId;
  });
  res.status(req.params.id ? 200 : 201).json({ id: groupId });
}
router.post("/admin/membership/groups", wrap(saveGroup));
router.put("/admin/membership/groups/:id", wrap(saveGroup));
router.delete(
  "/admin/membership/groups/:id",
  wrap(async (req, res) => {
    const group = await getGroup(req, req.params.id);
    await pool.execute("DELETE FROM member_groups WHERE id=?", [group.id]);
    res.status(204).end();
  }),
);
// Shared endpoints retain the same authorization checks for administrators and group managers.
for (const prefix of ["/member/groups", "/admin/membership/groups"]) {
  router.get(
    prefix + "/:id",
    wrap(async (req, res) => {
      const group = await getGroup(req, req.params.id);
      const [rows] = await pool.execute(groupSelect + " WHERE g.id=?", [
        group.id,
      ]);
      res.json(rows[0]);
    }),
  );
  router.get(
    prefix + "/:id/members",
    wrap(async (req, res) => {
      const group = await getGroup(req, req.params.id);
      const { page, offset } = pagination(req.query);
      const q = text(req.query.q, "Recherche");
      const filter =
        " FROM group_members gm JOIN members m ON m.id=gm.member_id WHERE gm.group_id=? AND (m.full_name LIKE ? OR m.phone LIKE ? OR m.unique_identification LIKE ?)";
      const args = [group.id, `%${q}%`, `%${q}%`, `%${q}%`];
      const [count] = await pool.execute(
        "SELECT COUNT(*) AS total" + filter,
        args,
      );
      const [rows] = await pool.execute(
        "SELECT m.id,m.unique_identification,m.full_name,m.phone,m.sex,m.municipality,m.joined_on" +
          filter +
          ` ORDER BY m.full_name,m.id LIMIT 20 OFFSET ${offset}`,
        args,
      );
      res.json({ rows, total: count[0].total, page, page_size: 20 });
    }),
  );
  router.post(
    prefix + "/:id/members",
    wrap(async (req, res) => {
      await transaction(async (db) => {
        const g = await getGroup(req, req.params.id, db, true);
        const memberId = id(req.body.member_id);
        const [exists] = await db.execute("SELECT id FROM members WHERE id=?", [
          memberId,
        ]);
        if (!exists.length) fail("Membre introuvable.", 404);
        await db.execute(
          "INSERT IGNORE INTO group_members (group_id,member_id) VALUES (?,?)",
          [g.id, memberId],
        );
      });
      res.status(201).json({ message: "Membre ajouté au groupe." });
    }),
  );
  router.delete(
    prefix + "/:id/members/:memberId",
    wrap(async (req, res) => {
      await transaction(async (db) => {
        const g = await getGroup(req, req.params.id, db, true);
        const memberId = id(req.params.memberId);
        if ([g.leader_id, g.assistant_id, g.coordinator_id].includes(memberId))
          fail(
            "Changez d’abord le responsable, l’assistant ou le coordinateur avant de le retirer du groupe.",
          );
        const [r] = await db.execute(
          "DELETE FROM group_members WHERE group_id=? AND member_id=?",
          [g.id, memberId],
        );
        if (!r.affectedRows) fail("Membre absent du groupe.", 404);
      });
      res.status(204).end();
    }),
  );
  router.put(
    prefix + "/:id/coordinator",
    wrap(async (req, res) => {
      await transaction(async (db) => {
        const g = await getGroup(req, req.params.id, db, true);
        const coordinatorId = req.body.member_id
          ? id(req.body.member_id)
          : null;
        if (coordinatorId) await requireGroupMember(db, g.id, coordinatorId);
        await db.execute(
          "UPDATE member_groups SET coordinator_id=? WHERE id=?",
          [coordinatorId, g.id],
        );
      });
      res.json({ message: "Coordinateur enregistré." });
    }),
  );
  router.get(
    prefix + "/:id/members/:memberId",
    wrap(async (req, res) => {
      const g = await getGroup(req, req.params.id);
      const memberId = id(req.params.memberId);
      await requireGroupMember(pool, g.id, memberId);
      res.json(await memberProfile(memberId, req.admin ? undefined : g.id));
    }),
  );
  router.post(
    prefix + "/:id/members/:memberId/actions",
    wrap(async (req, res) => {
      const kind = choice(
        req.body.kind,
        ["call", "visit", "message"],
        "Action",
      );
      const status = choice(req.body.status, ["planned", "completed"], "État");
      const scheduled = dateTime(req.body.scheduled_at);
      const observation = text(
        req.body.observation,
        "Observation",
        10000,
        true,
      );
      const actionId = await transaction(async (db) => {
        const g = await getGroup(req, req.params.id, db, true);
        const memberId = id(req.params.memberId);
        await requireGroupMember(db, g.id, memberId);
        let actorName = req.member?.full_name;
        if (req.admin) {
          const [admins] = await db.execute(
            "SELECT name FROM admins WHERE id=?",
            [req.admin.id],
          );
          actorName = admins[0].name;
        }
        const [r] = await db.execute(
          "INSERT INTO member_actions (member_id,group_id,group_name,kind,status,scheduled_at,completed_at,observation,actor_member_id,actor_admin_id,actor_name) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
          [
            memberId,
            g.id,
            g.name,
            kind,
            status,
            scheduled,
            status === "completed" ? scheduled : null,
            observation,
            req.member?.id ?? null,
            req.admin?.id ?? null,
            actorName,
          ],
        );
        return r.insertId;
      });
      res.status(201).json({ id: actionId });
    }),
  );
  router.put(
    prefix + "/:id/actions/:actionId",
    wrap(async (req, res) => {
      const status = choice(req.body.status, ["planned", "completed"], "État");
      const observation = text(
        req.body.observation,
        "Observation",
        10000,
        true,
      );
      const scheduled = dateTime(req.body.scheduled_at);
      await transaction(async (db) => {
        const g = await getGroup(req, req.params.id, db, true);
        const [rows] = await db.execute(
          "SELECT member_id FROM member_actions WHERE id=? AND group_id=?",
          [id(req.params.actionId), g.id],
        );
        if (!rows[0]) fail("Action introuvable.", 404);
        const completed =
          status === "completed"
            ? dateTime(req.body.completed_at || new Date().toISOString())
            : null;
        await db.execute(
          "UPDATE member_actions SET status=?,observation=?,scheduled_at=?,completed_at=? WHERE id=? AND group_id=?",
          [
            status,
            observation,
            scheduled,
            completed,
            id(req.params.actionId),
            g.id,
          ],
        );
      });
      res.json({ message: "Suivi mis à jour." });
    }),
  );
  router.get(
    prefix + "/:id/export/:format",
    wrap(async (req, res) => {
      const group = await getGroup(req, req.params.id);
      choice(req.params.format, ["xlsx", "pdf"], "Format");
      const [members] = await pool.execute(
        "SELECT m.full_name,m.sex,m.phone,m.neighborhood,m.municipality,m.profession,m.joined_on FROM members m JOIN group_members gm ON gm.member_id=m.id WHERE gm.group_id=? ORDER BY m.full_name,m.id",
        [group.id],
      );
      await exportGroup(res, group, members, req.params.format);
    }),
  );
}
export default router;
