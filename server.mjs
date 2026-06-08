// Node entrypoint for Azure App Service (Linux Node).
// This is a TanStack Start SSR app: vite build emits a server fetch-handler
// at dist/server/server.js plus static client assets at dist/client (no
// pre-rendered index.html — pages are rendered on the fly by the SSR handler).
// We serve static assets directly and hand everything else to the SSR handler.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { serve } from "srvx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const clientDir = path.join(__dirname, "dist", "client");
const serverEntry = path.join(__dirname, "dist", "server", "server.js");

if (!fs.existsSync(serverEntry)) {
  console.error(`[server] Built server entry not found at ${serverEntry}`);
  process.exit(1);
}

const { default: ssrServer } = await import(`file://${serverEntry}`);

async function fetchHandler(request) {
  const url = new URL(request.url);

  if (request.method === "GET" || request.method === "HEAD") {
    const filePath = path.join(clientDir, decodeURIComponent(url.pathname));
    if (filePath.startsWith(clientDir) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const headers = {};
      if (url.pathname.startsWith("/assets/")) {
        headers["cache-control"] = "public, max-age=31536000, immutable";
      }
      return new Response(fs.readFileSync(filePath), { headers });
    }
  }

  return ssrServer.fetch(request);
}

const port = process.env.PORT || 8080;

serve({
  fetch: fetchHandler,
  port,
  hostname: "0.0.0.0",
});

console.log(`[server] Listening on port ${port}, serving static assets from ${clientDir}`);
