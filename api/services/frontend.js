import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const frontendDirectory = process.env.WEBAPP_DIST_DIR
  ? path.resolve(process.env.WEBAPP_DIST_DIR)
  : fileURLToPath(new URL("../../webapp/dist/", import.meta.url));

export function serveFrontend(app, directory = frontendDirectory) {
  // API errors must never be replaced by the application's HTML document.
  app.use("/api", (req, res) =>
    res.status(404).json({ message: "Route introuvable." }),
  );
  app.use(express.static(directory, { index: false, dotfiles: "deny" }));
  app.use((req, res, next) => {
    let pathname;
    try {
      pathname = decodeURIComponent(req.path);
    } catch {
      return next();
    }
    if (
      !["GET", "HEAD"].includes(req.method) ||
      !req.accepts("html") ||
      path.posix.extname(pathname) ||
      /(?:^|\/)\./.test(pathname) ||
      /^\/(?:assets|images)(?:\/|$)/.test(pathname)
    )
      return next();

    res.set("Cache-Control", "no-cache");
    res.sendFile(path.join(directory, "index.html"), (error) => {
      if (!error) return;
      if (error.code === "ENOENT" && !res.headersSent)
        return res.status(503).json({
          message:
            "Les fichiers de l’application sont absents. Compilez et déployez le dossier webapp/dist.",
        });
      next(error);
    });
  });
}
