import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // CORS middleware to support embedded sandboxed iframes (with unique/null origins)
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
    
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // API Route FIRST - Google API Proxy to bypass browser CORS / iframe constraints
  app.all("/api/google-proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    console.log(`[Proxy] Received ${req.method} request for target URL: ${targetUrl}`);
    try {
      if (!targetUrl) {
        console.warn("[Proxy] Missing 'url' query parameter");
        res.status(400).json({ error: "Missing 'url' query parameter" });
        return;
      }

      if (!targetUrl.startsWith("https://www.googleapis.com/") && !targetUrl.startsWith("https://sheets.googleapis.com/")) {
        console.warn(`[Proxy] Invalid target URL domain: ${targetUrl}`);
        res.status(400).json({ error: "Only Google APIs are supported by this proxy" });
        return;
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.warn("[Proxy] Missing Authorization header");
        res.status(401).json({ error: "Missing Authorization header" });
        return;
      }

      const fetchOptions: any = {
        method: req.method,
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      };

      if (["POST", "PUT", "PATCH"].includes(req.method) && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
        console.log(`[Proxy] Forwarding request body of length: ${fetchOptions.body.length}`);
      }

      console.log(`[Proxy] Fetching target URL...`);
      const googleResponse = await fetch(targetUrl, fetchOptions);
      console.log(`[Proxy] Google responded with status: ${googleResponse.status}`);
      
      // Pass along the status code
      res.status(googleResponse.status);

      // Handle 204 or empty bodies
      if (googleResponse.status === 204) {
        res.end();
        return;
      }

      const contentType = googleResponse.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const json = await googleResponse.json();
        console.log(`[Proxy] Returning JSON response`);
        res.json(json);
      } else {
        const text = await googleResponse.text();
        console.log(`[Proxy] Returning Text response of length: ${text.length}`);
        res.send(text);
      }
    } catch (error: any) {
      console.error("[Proxy] Critical Error:", error);
      res.status(500).json({ error: error.message || "Internal server error in Google Proxy" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
