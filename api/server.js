import express from "express";
import helmet from "helmet";
import cors from "cors";
import { pool } from "./config/db.js";
import router from "./routes/index.js";
import { mediaDirectory } from "./services/media.js";
import { serveFrontend } from "./services/frontend.js";
export const app = express();
app.disable("x-powered-by");
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:"],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://google.com",
          "https://maps.google.com",
        ],
      },
    },
  }),
);
app.use(
  cors({
    origin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  }),
);
app.use(express.json({ limit: "100kb" }));
app.use(
  "/api/media",
  (req, res, next) => {
    res.set("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(mediaDirectory, {
    maxAge: "7d",
    index: false,
    dotfiles: "deny",
  }),
);
app.use("/api", router);
serveFrontend(app);
app.use((req, res) => res.status(404).json({ message: "Route introuvable." }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  console.error(error.code || error.message);
  const status =
    error.status ||
    (["ER_ROW_IS_REFERENCED_2", "ER_DUP_ENTRY"].includes(error.code)
      ? 409
      : error.code === "ER_NO_REFERENCED_ROW_2"
        ? 400
        : 503);
  res.status(status).json({
    message: error.status
      ? error.message
      : status === 409
        ? "Cet élément est encore utilisé ou existe déjà."
        : status === 400
          ? "La référence sélectionnée n’existe pas."
          : "Le service est momentanément indisponible. Vérifiez la connexion et le schéma MySQL.",
  });
});
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error(
    "Définissez JWT_SECRET avec au moins 32 caractères dans api/.env.",
  );
if (process.env.NODE_ENV !== "test") {
  const server = app.listen(Number(process.env.PORT || 3001), "0.0.0.0", () =>
    console.log(
      `API Vases d’honneur : http://localhost:${process.env.PORT || 3001}/api`,
    ),
  );
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(async () => {
        await pool.end();
        process.exit(0);
      }),
    );
}
