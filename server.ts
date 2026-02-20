import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("project_pulse.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    owner TEXT,
    priority TEXT DEFAULT 'medium',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS blockers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    description TEXT NOT NULL,
    reporter TEXT NOT NULL,
    resolved INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(task_id) REFERENCES tasks(id)
  );

  CREATE TABLE IF NOT EXISTS activity (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user TEXT NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS project_settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // WebSocket broadcast helper
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // API Routes
  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks ORDER BY updated_at DESC").all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { title, description, owner, priority } = req.body;
    const result = db.prepare("INSERT INTO tasks (title, description, owner, priority) VALUES (?, ?, ?, ?)").run(title, description, owner, priority);
    const newTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(result.lastInsertRowid);
    
    db.prepare("INSERT INTO activity (user, action, details) VALUES (?, ?, ?)").run(owner || 'System', 'created task', title);
    
    broadcast({ type: "TASK_CREATED", payload: newTask });
    broadcast({ type: "ACTIVITY_NEW", payload: { user: owner || 'System', action: 'created task', details: title, created_at: new Date().toISOString() } });
    
    res.json(newTask);
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { id } = req.params;
    const { status, owner, title } = req.body;
    
    if (status) {
      db.prepare("UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(status, id);
    }
    
    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    
    db.prepare("INSERT INTO activity (user, action, details) VALUES (?, ?, ?)").run(owner || 'System', `updated task status to ${status}`, updatedTask.title);
    
    broadcast({ type: "TASK_UPDATED", payload: updatedTask });
    broadcast({ type: "ACTIVITY_NEW", payload: { user: owner || 'System', action: `updated task status to ${status}`, details: updatedTask.title, created_at: new Date().toISOString() } });
    
    res.json(updatedTask);
  });

  app.get("/api/blockers", (req, res) => {
    const blockers = db.prepare("SELECT * FROM blockers WHERE resolved = 0 ORDER BY created_at DESC").all();
    res.json(blockers);
  });

  app.post("/api/blockers", (req, res) => {
    const { task_id, description, reporter } = req.body;
    const result = db.prepare("INSERT INTO blockers (task_id, description, reporter) VALUES (?, ?, ?)").run(task_id, description, reporter);
    const newBlocker = db.prepare("SELECT * FROM blockers WHERE id = ?").get(result.lastInsertRowid);
    
    db.prepare("INSERT INTO activity (user, action, details) VALUES (?, ?, ?)").run(reporter, 'flagged a blocker', description);
    
    broadcast({ type: "BLOCKER_CREATED", payload: newBlocker });
    broadcast({ type: "ACTIVITY_NEW", payload: { user: reporter, action: 'flagged a blocker', details: description, created_at: new Date().toISOString() } });
    
    res.json(newBlocker);
  });

  app.post("/api/blockers/:id/resolve", (req, res) => {
    const { id } = req.params;
    const { user } = req.body;
    db.prepare("UPDATE blockers SET resolved = 1 WHERE id = ?").run(id);
    
    const blocker = db.prepare("SELECT * FROM blockers WHERE id = ?").get(id);
    db.prepare("INSERT INTO activity (user, action, details) VALUES (?, ?, ?)").run(user || 'System', 'resolved a blocker', blocker.description);
    
    broadcast({ type: "BLOCKER_RESOLVED", payload: { id } });
    broadcast({ type: "ACTIVITY_NEW", payload: { user: user || 'System', action: 'resolved a blocker', details: blocker.description, created_at: new Date().toISOString() } });
    
    res.json({ success: true });
  });

  app.get("/api/activity", (req, res) => {
    const activity = db.prepare("SELECT * FROM activity ORDER BY created_at DESC LIMIT 50").all();
    res.json(activity);
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM project_settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const { key, value } = req.body;
    db.prepare("INSERT OR REPLACE INTO project_settings (key, value) VALUES (?, ?)").run(key, value);
    res.json({ success: true });
  });

  app.get("/api/github/stats", async (req, res) => {
    const repoUrl = db.prepare("SELECT value FROM project_settings WHERE key = 'github_repo'").get()?.value;
    if (!repoUrl) {
      return res.status(400).json({ error: "GitHub repo not configured" });
    }

    try {
      // Parse owner and repo from URL
      const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
      if (!match) return res.status(400).json({ error: "Invalid GitHub URL" });
      const [_, owner, repoName] = match;
      const cleanRepo = repoName.replace(/\.git$/, "");

      const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Project-Pulse-App'
      };

      const [commitsRes, pullsRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/commits?per_page=10`, { headers }),
        fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/pulls?state=all&per_page=10`, { headers })
      ]);

      if (!commitsRes.ok || !pullsRes.ok) {
        throw new Error("GitHub API error");
      }

      const commits = await commitsRes.json();
      const pulls = await pullsRes.json();

      res.json({
        owner,
        repo: cleanRepo,
        commits: (commits as any[]).map(c => ({
          sha: c.sha,
          message: c.commit.message,
          author: c.commit.author.name,
          date: c.commit.author.date,
          url: c.html_url
        })),
        pulls: (pulls as any[]).map(p => ({
          id: p.id,
          title: p.title,
          user: p.user.login,
          state: p.state,
          created_at: p.created_at,
          url: p.html_url
        }))
      });
    } catch (error) {
      console.error("GitHub fetch error:", error);
      res.status(500).json({ error: "Failed to fetch GitHub data" });
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
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
