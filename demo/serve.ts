/**
 * CHRONO Live Demo Server
 * 
 * Serves the interactive visual timeline scrubber at http://localhost:3333
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PORT = 3333;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_FILE = path.join(__dirname, "index.html");

const server = http.createServer((req, res) => {
  if (req.url === "/" || req.url === "/index.html") {
    fs.readFile(HTML_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Error loading demo UI");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(data);
    });
  } else {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
});

server.listen(PORT, () => {
  console.log(`\n=============================================================`);
  console.log(`🚀 CHRONO Interactive Scrubber Demo is LIVE!`);
  console.log(`👉 Open in your browser: http://localhost:${PORT}`);
  console.log(`👉 Or open file directly: file://${HTML_FILE.replace(/\\/g, "/")}`);
  console.log(`=============================================================\n`);
});
