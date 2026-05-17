// Minimal Express server for Azure App Service (Linux Node).
// Serves the built client SPA. This app stores state in localStorage and
// uses no server functions, so a static SPA host is sufficient.
import express from "express";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The Lovable / TanStack Start + Cloudflare Vite plugin emits client assets
// under one of these directories depending on plugin version. Pick whichever
// exists at runtime.
const candidates = [
  path.join(__dirname, "dist", "client"),
  path.join(__dirname, "dist"),
  path.join(__dirname, ".output", "public"),
  path.join(__dirname, "build", "client"),
];

const staticDir = candidates.find(
  (p) => fs.existsSync(p) && fs.existsSync(path.join(p, "index.html")),
);

if (!staticDir) {
  console.error(
    "[server] No built client found. Looked in:\n" + candidates.join("\n"),
  );
  process.exit(1);
}

console.log("[server] Serving static SPA from", staticDir);

const app = express();
const port = process.env.PORT || 8080;

app.disable("x-powered-by");

app.use(
  express.static(staticDir, {
    index: false,
    maxAge: "1h",
    setHeaders: (res, filePath) => {
      if (/\.(?:js|css|woff2?|png|jpg|jpeg|svg|webp|ico)$/i.test(filePath)) {
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
      }
    },
  }),
);

// SPA fallback — every non-asset GET returns index.html so client-side
// routing (TanStack Router) can handle the URL.
app.get(/.*/, (_req, res) => {
  res.sendFile(path.join(staticDir, "index.html"));
});

app.listen(port, () => {
  console.log(`[server] Listening on port ${port}`);
});
