import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import cors from "cors";
import bodyParser from "body-parser";

const db = new Database("database.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS officers (id TEXT PRIMARY KEY, data TEXT, order_index INTEGER);
  CREATE TABLE IF NOT EXISTS rosters (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS config (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS log_overrides (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS gse_entries (id TEXT PRIMARY KEY, data TEXT);
  CREATE TABLE IF NOT EXISTS justify_entries (id TEXT PRIMARY KEY, data TEXT);
`);

// Add order_index column if it doesn't exist (for existing databases)
try {
  db.exec(`ALTER TABLE officers ADD COLUMN order_index INTEGER;`);
} catch (e) {
  // Column already exists
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(bodyParser.json({ limit: '50mb' }));

  // Specific route for officers to handle order
  app.get('/api/officers', (req, res) => {
    const rows = db.prepare(`SELECT data FROM officers ORDER BY order_index ASC`).all();
    res.json(rows.map((row: any) => JSON.parse(row.data)));
  });

  app.post('/api/officers', (req, res) => {
    const { id, order_index, ...data } = req.body;
    const json = JSON.stringify({ id, order_index, ...data });
    db.prepare(`INSERT OR REPLACE INTO officers (id, data, order_index) VALUES (?, ?, ?)`).run(id, json, order_index || 0);
    res.json({ success: true });
  });

  app.delete('/api/officers/:id', (req, res) => {
    db.prepare(`DELETE FROM officers WHERE id = ?`).run(req.params.id);
    res.json({ success: true });
  });

  // Generic API routes for other collections
  const collections = ['rosters', 'config', 'log_overrides', 'gse_entries', 'justify_entries'];

  collections.forEach(col => {
    app.get(`/api/${col}`, (req, res) => {
      const rows = db.prepare(`SELECT data FROM ${col}`).all();
      res.json(rows.map((row: any) => JSON.parse(row.data)));
    });

    app.post(`/api/${col}`, (req, res) => {
      const { id, ...data } = req.body;
      const json = JSON.stringify({ id, ...data });
      db.prepare(`INSERT OR REPLACE INTO ${col} (id, data) VALUES (?, ?)`).run(id, json);
      res.json({ success: true });
    });

    app.delete(`/api/${col}/:id`, (req, res) => {
      db.prepare(`DELETE FROM ${col} WHERE id = ?`).run(req.params.id);
      res.json({ success: true });
    });
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
