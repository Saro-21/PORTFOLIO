/* ═══════════════════════════════════════════════════════════════════════════
 *  bp.js — SARABHOJI PORTFOLIO BACKEND · PCB-OS SERVER v1.0
 *  Express + Nodemailer + File-based message store
 *  Run: node src/bp.js
 * ═══════════════════════════════════════════════════════════════════════════ */

import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createTransport } from "nodemailer";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── CONFIG ── */
const PORT = process.env.PORT || 4000;
const OWNER_EMAIL = process.env.OWNER_EMAIL || "sarabhoji21@gmail.com";
const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";       // Gmail App Password
const MESSAGES_DIR = path.join(__dirname, "..", "data", "messages");
const LOG_FILE = path.join(__dirname, "..", "data", "server.log");

/* ── ENSURE DATA DIRS ── */
fs.mkdirSync(MESSAGES_DIR, { recursive: true });
fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });

/* ── LOGGER ── */
function log(level, msg, meta = {}) {
  const ts = new Date().toISOString();
  const metaStr = Object.keys(meta).length
    ? " " + JSON.stringify(meta)
    : "";
  const line = `[${ts}] [${level}] ${msg}${metaStr}`;

  const colors = {
    BOOT: "\x1b[32m",    // green
    INFO: "\x1b[36m",    // cyan
    WARN: "\x1b[33m",    // yellow
    ERROR: "\x1b[31m",   // red
    TX: "\x1b[35m",      // magenta
    ACK: "\x1b[32m",     // green
  };
  console.log(`${colors[level] || "\x1b[0m"}${line}\x1b[0m`);
  fs.appendFileSync(LOG_FILE, line + "\n");
}

/* ── RATE LIMITER (in-memory) ── */
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;  // 1 min
const RATE_LIMIT_MAX = 10;            // max requests per window per IP

function rateLimit(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const entry = rateLimitMap.get(ip) || { count: 0, start: now };

  if (now - entry.start > RATE_LIMIT_WINDOW) {
    entry.count = 1;
    entry.start = now;
  } else {
    entry.count++;
  }

  rateLimitMap.set(ip, entry);

  if (entry.count > RATE_LIMIT_MAX) {
    log("WARN", "RATE_LIMIT_EXCEEDED", { ip });
    return res.status(429).json({
      status: "ERROR",
      code: "RATE_LIMITED",
      message: "Too many requests. Cool down and retry.",
    });
  }
  next();
}

/* Clean up stale rate limit entries every 5 min */
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.start > RATE_LIMIT_WINDOW * 2) rateLimitMap.delete(ip);
  }
}, 5 * 60 * 1000);

/* ── SANITIZE ── */
function sanitize(str = "") {
  return str
    .replace(/[<>]/g, "")
    .replace(/&/g, "&amp;")
    .trim()
    .slice(0, 2000);
}

/* ── EMAIL TRANSPORT ── */
let transporter = null;
if (SMTP_USER && SMTP_PASS) {
  transporter = createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  transporter.verify()
    .then(() => log("BOOT", "SMTP TRANSPORT VERIFIED ✓"))
    .catch(err => log("WARN", "SMTP VERIFY FAILED — emails will be saved locally only", { error: err.message }));
} else {
  log("WARN", "SMTP credentials not set — contact messages saved to disk only. Set SMTP_USER & SMTP_PASS env vars to enable email.");
}

/* ═══════════════════════════════════════════════════════════════
 *  PORTFOLIO DATA — mirrors fp.jsx frontend data
 * ═══════════════════════════════════════════════════════════════ */

const PROFILE = {
  name: "Sarabhoji M",
  initials: "SM",
  role: ["AI/ML ENGINEER", "FULL-STACK DEV", "DATA SCIENTIST", "CLOUD ARCHITECT", "SYSTEMS BUILDER"],
  university: "Velammal Institute of Technology (VIT)",
  location: "Thiruvallur, Tamil Nadu, India",
  cgpa: 8.96,
  degree: "B.Tech AI & Data Science",
  graduationYear: "Sep 2028",
  status: "OPEN_TO_WORK",
  bio: [
    "I'm Sarabhoji M — a B.Tech AI & Data Science engineer at Velammal Institute of Technology, maintaining a CGPA of 8.96.",
    "I architect intelligent systems end-to-end — from raw data pipelines to real-time WebSocket dashboards monitoring 37 Tamil Nadu districts. My URBANSCAN platform achieves 95%+ AI accuracy; NUTRI-BUS bridges live bus networks with cloud kitchen logistics at city scale.",
    "Proficient across the full ML lifecycle: Pandas/NumPy for data engineering, TensorFlow & PyTorch for model training, LLM integration via Groq/LLaMA, cloud deployment on Azure, and FastAPI & Django for backend systems. I ship production-grade code, not prototypes.",
  ],
  links: {
    github: "https://github.com/Saro-21",
    linkedin: "https://linkedin.com/in/sarabhoji-m-29aab3381",
    email: "sarabhoji21@gmail.com",
    phone: "+918939706162",
    location_maps: "https://maps.google.com?q=Thiruvallur+Tamil+Nadu",
  },
};

const PROJECTS = [
  {
    id: "URB",
    ref: "U2",
    num: "01",
    icon: "🛰",
    title: "URBANSCAN",
    tagline: "AI Smart City Surveillance",
    period: "MAY–JUN 2026",
    badge: "DEPLOYED",
    tech: ["HTML", "CSS", "JavaScript", "Python", "Node.js", "Express.js", "WebSocket", "NLP"],
    metrics: [
      { value: "95%+", label: "AI Accuracy" },
      { value: "37", label: "Districts" },
      { value: "<9s", label: "Latency" },
      { value: "10", label: "Categories" },
    ],
    description: "Full-stack real-time surveillance dashboard detecting graffiti vandalism across all 37 Tamil Nadu districts. NLP-powered anomaly classification, interactive SVG geospatial mapping, paginated incident history, 4-format export: CSV, JSON, GeoJSON, PDF.",
    color: "#00FF41",
    github: "https://github.com/Saro-21",
    demo: "https://github.com/Saro-21",
  },
  {
    id: "NTB",
    ref: "U3",
    num: "02",
    icon: "🍱",
    title: "NUTRI-BUS",
    tagline: "Smart Commuter Meal Platform",
    period: "JUL–AUG 2025",
    badge: "LIVE",
    tech: ["Mobile App", "Web Platform", "REST API", "DBMS", "Cloud Logistics", "Analytics"],
    metrics: [
      { value: "3", label: "Stakeholder Layers" },
      { value: "∞", label: "Scalable Orders" },
      { value: "Live", label: "Schedule Sync" },
      { value: "Multi", label: "City Coverage" },
    ],
    description: "Food-tech transportation ecosystem enabling commuters to access fresh meals during travel. Coordinates real-time bus schedules with cloud kitchen dispatch. Revenue model: per-meal, subscriptions, enterprise partnerships.",
    color: "#B87333",
    github: "https://github.com/Saro-21",
    demo: "https://github.com/Saro-21",
  },
];

const SKILLS = [
  { key: "LANG",  name: "Languages",    color: "#00FF41", items: [
    { name: "Python",     proficiency: 92 },
    { name: "Java",       proficiency: 85 },
    { name: "C++",        proficiency: 82 },
    { name: "JavaScript", proficiency: 88 },
  ]},
  { key: "ML_AI", name: "ML / AI",      color: "#FF6B35", items: [
    { name: "TensorFlow",  proficiency: 90 },
    { name: "PyTorch",     proficiency: 88 },
    { name: "Scikit-learn", proficiency: 85 },
    { name: "Keras",       proficiency: 82 },
    { name: "LLMs",        proficiency: 78 },
    { name: "Groq",        proficiency: 75 },
    { name: "LLaMA",       proficiency: 80 },
  ]},
  { key: "DATA",  name: "Data & Viz",   color: "#FFD166", items: [
    { name: "Pandas",     proficiency: 92 },
    { name: "NumPy",      proficiency: 90 },
    { name: "Matplotlib", proficiency: 85 },
    { name: "Seaborn",    proficiency: 83 },
    { name: "Plotly",     proficiency: 80 },
    { name: "PowerBI",    proficiency: 78 },
  ]},
  { key: "DB",    name: "Databases",    color: "#00B4FF", items: [
    { name: "MySQL",      proficiency: 88 },
    { name: "MongoDB",    proficiency: 85 },
    { name: "PostgreSQL", proficiency: 87 },
    { name: "Vector DBs", proficiency: 75 },
  ]},
  { key: "CLOUD", name: "DevOps/Cloud", color: "#B87333", items: [
    { name: "Git",       proficiency: 90 },
    { name: "Docker",    proficiency: 80 },
    { name: "Azure",     proficiency: 82 },
    { name: "FastAPI",   proficiency: 88 },
    { name: "Streamlit", proficiency: 85 },
    { name: "Jupyter",   proficiency: 87 },
  ]},
  { key: "WEB",   name: "Web Dev",      color: "#C084FC", items: [
    { name: "HTML5",  proficiency: 88 },
    { name: "CSS3",   proficiency: 87 },
    { name: "React",  proficiency: 82 },
    { name: "Flask",  proficiency: 85 },
    { name: "Django", proficiency: 80 },
  ]},
];

const CERTIFICATIONS = [
  {
    ref: "C1",
    title: "PostgreSQL Certification",
    org: "Hasavaji Educates",
    date: "Aug 2025",
    color: "#00B4FF",
    link: "https://linkedin.com/in/sarabhoji-m-29aab3381",
  },
  {
    ref: "C2",
    title: "Fundamentals of Data Science & Analytics",
    org: "Hasavaji Educates",
    date: "Feb 2026",
    color: "#C084FC",
    link: "https://linkedin.com/in/sarabhoji-m-29aab3381",
  },
  {
    ref: "A1",
    title: "Award of Appreciation — Outstanding Contributions",
    org: "VIT",
    date: "2025",
    color: "#FFD166",
    link: "https://linkedin.com/in/sarabhoji-m-29aab3381",
  },
];

const JOURNEY = [
  { year: "2022",          event: "B.Tech AI & DS Enrolled",  place: "VIT, Thiruvallur",              color: "#00FF41" },
  { year: "Aug 2025",      event: "PostgreSQL Certified",     place: "Hasavaji Educates",             color: "#00B4FF" },
  { year: "Jul–Aug 2025",  event: "NUTRI-BUS Shipped",        place: "Full-stack food-tech",          color: "#B87333" },
  { year: "Feb 2026",      event: "Data Science Certified",   place: "Hasavaji Educates",             color: "#C084FC" },
  { year: "May–Jun 2026",  event: "URBANSCAN Deployed",       place: "Live · 37 Tamil Nadu districts", color: "#00FF41" },
  { year: "Sep 2028",      event: "Expected Graduation",      place: "B.Tech AI & Data Science",      color: "#FFD166" },
];

const METRICS = [
  { value: "95%+", label: "ML MODEL ACCURACY" },
  { value: "8.96", label: "CGPA SCORE" },
  { value: "37",   label: "DISTRICTS MONITORED" },
  { value: "2",    label: "LIVE SYSTEMS" },
  { value: "<9s",  label: "WEBSOCKET LATENCY" },
  { value: "6+",   label: "TECH DOMAINS" },
  { value: "10",   label: "INCIDENT CATEGORIES" },
  { value: "VIT",  label: "INSTITUTION" },
];


/* ═══════════════════════════════════════════════════════════════
 *  EXPRESS APP
 * ═══════════════════════════════════════════════════════════════ */

const app = express();

/* ── MIDDLEWARE ── */
app.use(cors({
  origin: process.env.CORS_ORIGIN || "*",
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
}));
app.use(express.json({ limit: "50kb" }));

/* ── API KEY AUTHENTICATION ── */
const API_KEY = process.env.API_KEY || "YOUR_API_KEY_HERE";

app.use((req, res, next) => {
  const clientKey = req.headers['x-api-key'];
  if (clientKey !== API_KEY && req.path.startsWith('/api')) {
    log("WARN", "UNAUTHORIZED_ACCESS_ATTEMPT", { ip: req.ip, path: req.path });
    return res.status(401).json({ status: "ERROR", code: "UNAUTHORIZED", message: "Invalid or missing API Key" });
  }
  next();
});

app.use(rateLimit);

/* Request logger */
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    log("INFO", `${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`, { ip: req.ip });
  });
  next();
});


/* ═══════════════════════════════════════════════════════════════
 *  API ROUTES
 * ═══════════════════════════════════════════════════════════════ */

/* ── HEALTH CHECK ── */
app.get("/api/health", (req, res) => {
  res.json({
    status: "NOMINAL",
    server: "SARABHOJI_PCB_OS",
    version: "1.0.0",
    uptime: process.uptime().toFixed(1) + "s",
    timestamp: new Date().toISOString(),
    smtp: transporter ? "CONFIGURED" : "DISABLED",
  });
});

/* ── PROFILE ── */
app.get("/api/profile", (req, res) => {
  res.json({ status: "OK", data: PROFILE });
});

/* ── PROJECTS ── */
app.get("/api/projects", (req, res) => {
  res.json({ status: "OK", count: PROJECTS.length, data: PROJECTS });
});

app.get("/api/projects/:id", (req, res) => {
  const proj = PROJECTS.find(p => p.id === req.params.id.toUpperCase());
  if (!proj) return res.status(404).json({ status: "ERROR", code: "NOT_FOUND", message: "Project not found" });
  res.json({ status: "OK", data: proj });
});

/* ── SKILLS ── */
app.get("/api/skills", (req, res) => {
  res.json({ status: "OK", count: SKILLS.length, data: SKILLS });
});

app.get("/api/skills/:key", (req, res) => {
  const group = SKILLS.find(s => s.key === req.params.key.toUpperCase());
  if (!group) return res.status(404).json({ status: "ERROR", code: "NOT_FOUND", message: "Skill group not found" });
  res.json({ status: "OK", data: group });
});

/* ── CERTIFICATIONS ── */
app.get("/api/certifications", (req, res) => {
  res.json({ status: "OK", count: CERTIFICATIONS.length, data: CERTIFICATIONS });
});

/* ── JOURNEY / TIMELINE ── */
app.get("/api/journey", (req, res) => {
  res.json({ status: "OK", count: JOURNEY.length, data: JOURNEY });
});

/* ── METRICS ── */
app.get("/api/metrics", (req, res) => {
  res.json({ status: "OK", count: METRICS.length, data: METRICS });
});

/* ── CONTACT FORM ── */
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    /* Validate */
    const errors = {};
    if (!name || !sanitize(name))       errors.name    = "REQUIRED";
    if (!email || !sanitize(email))      errors.email   = "REQUIRED";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "INVALID";
    if (!message || !sanitize(message))  errors.message = "REQUIRED";

    if (Object.keys(errors).length) {
      log("WARN", "CONTACT_VALIDATION_FAIL", errors);
      return res.status(400).json({ status: "ERROR", code: "VALIDATION", errors });
    }

    const cleanData = {
      name:    sanitize(name),
      email:   sanitize(email),
      subject: sanitize(subject || "(no subject)"),
      message: sanitize(message),
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "unknown",
    };

    /* Save to disk */
    const filename = `msg_${Date.now()}_${cleanData.name.replace(/\s+/g, "_").slice(0, 20)}.json`;
    const filepath = path.join(MESSAGES_DIR, filename);
    fs.writeFileSync(filepath, JSON.stringify(cleanData, null, 2));
    log("TX", `MESSAGE SAVED → ${filename}`, { from: cleanData.email });

    /* Send email notification if SMTP configured */
    if (transporter) {
      try {
        await transporter.sendMail({
          from: `"Portfolio Contact" <${SMTP_USER}>`,
          to: OWNER_EMAIL,
          replyTo: cleanData.email,
          subject: `[PORTFOLIO] ${cleanData.subject} — from ${cleanData.name}`,
          html: `
            <div style="font-family:'Courier New',monospace;background:#000A00;color:#C8E6C0;padding:24px;border:1px solid #B87333;border-radius:4px;">
              <h2 style="color:#00FF41;margin:0 0 16px 0;font-size:14px;letter-spacing:2px;">◈ NEW TRANSMISSION RECEIVED</h2>
              <table style="width:100%;border-collapse:collapse;">
                <tr><td style="color:#B87333;padding:6px 12px 6px 0;font-size:12px;white-space:nowrap;">FROM:</td><td style="padding:6px 0;font-size:13px;">${cleanData.name} &lt;${cleanData.email}&gt;</td></tr>
                <tr><td style="color:#B87333;padding:6px 12px 6px 0;font-size:12px;white-space:nowrap;">SUBJECT:</td><td style="padding:6px 0;font-size:13px;">${cleanData.subject}</td></tr>
                <tr><td style="color:#B87333;padding:6px 12px 6px 0;font-size:12px;white-space:nowrap;">TIME:</td><td style="padding:6px 0;font-size:13px;">${cleanData.timestamp}</td></tr>
              </table>
              <div style="margin:16px 0;padding:16px;background:#001200;border-left:3px solid #00FF41;font-size:13px;line-height:1.6;white-space:pre-wrap;">${cleanData.message}</div>
              <div style="margin-top:12px;font-size:10px;color:#4A7A4A;">PCB-OS SERVER · AUTO-NOTIFICATION</div>
            </div>
          `,
          text: `New message from ${cleanData.name} (${cleanData.email})\nSubject: ${cleanData.subject}\n\n${cleanData.message}\n\nTime: ${cleanData.timestamp}`,
        });
        log("ACK", "EMAIL SENT TO OWNER ✓", { to: OWNER_EMAIL });
      } catch (emailErr) {
        log("ERROR", "EMAIL SEND FAILED", { error: emailErr.message });
        /* Message is still saved on disk — don't fail the request */
      }
    }

    res.json({
      status: "ACK",
      message: "Transmission received. ACK guaranteed within 24h.",
      id: filename.replace(".json", ""),
    });

  } catch (err) {
    log("ERROR", "CONTACT_HANDLER_ERROR", { error: err.message });
    res.status(500).json({ status: "ERROR", code: "SERVER_ERROR", message: "Internal server error" });
  }
});

/* ── GET ALL MESSAGES (admin, protected in production) ── */
app.get("/api/messages", (req, res) => {
  try {
    const files = fs.readdirSync(MESSAGES_DIR).filter(f => f.endsWith(".json")).sort().reverse();
    const messages = files.map(f => {
      const data = JSON.parse(fs.readFileSync(path.join(MESSAGES_DIR, f), "utf-8"));
      return { id: f.replace(".json", ""), ...data };
    });
    res.json({ status: "OK", count: messages.length, data: messages });
  } catch (err) {
    log("ERROR", "MESSAGES_READ_ERROR", { error: err.message });
    res.status(500).json({ status: "ERROR", message: "Failed to read messages" });
  }
});

/* ── FULL PORTFOLIO DUMP (single endpoint for SSR / crawlers) ── */
app.get("/api/portfolio", (req, res) => {
  res.json({
    status: "OK",
    data: {
      profile: PROFILE,
      projects: PROJECTS,
      skills: SKILLS,
      certifications: CERTIFICATIONS,
      journey: JOURNEY,
      metrics: METRICS,
    },
  });
});


/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({
    status: "ERROR",
    code: "NOT_FOUND",
    message: `Route ${req.method} ${req.path} not found`,
    availableEndpoints: [
      "GET  /api/health",
      "GET  /api/profile",
      "GET  /api/projects",
      "GET  /api/projects/:id",
      "GET  /api/skills",
      "GET  /api/skills/:key",
      "GET  /api/certifications",
      "GET  /api/journey",
      "GET  /api/metrics",
      "GET  /api/portfolio",
      "POST /api/contact",
      "GET  /api/messages",
    ],
  });
});

/* ── ERROR HANDLER ── */
app.use((err, req, res, next) => {
  log("ERROR", "UNHANDLED_ERROR", { error: err.message, stack: err.stack?.split("\n")[0] });
  res.status(500).json({ status: "ERROR", code: "SERVER_ERROR", message: "Internal server error" });
});


/* ═══════════════════════════════════════════════════════════════
 *  BOOT
 * ═══════════════════════════════════════════════════════════════ */
app.listen(PORT, () => {
  console.log("");
  console.log("\x1b[32m  ╔══════════════════════════════════════════════╗\x1b[0m");
  console.log("\x1b[32m  ║   SARABHOJI_PCB_OS · BACKEND SERVER v1.0    ║\x1b[0m");
  console.log("\x1b[32m  ╠══════════════════════════════════════════════╣\x1b[0m");
  console.log(`\x1b[32m  ║\x1b[0m  PORT       : \x1b[36m${PORT}\x1b[0m`);
  console.log(`\x1b[32m  ║\x1b[0m  SMTP       : \x1b[36m${transporter ? "ENABLED" : "DISABLED (save-only)"}\x1b[0m`);
  console.log(`\x1b[32m  ║\x1b[0m  MESSAGES   : \x1b[36m${MESSAGES_DIR}\x1b[0m`);
  console.log(`\x1b[32m  ║\x1b[0m  CORS       : \x1b[36m${process.env.CORS_ORIGIN || "*"}\x1b[0m`);
  console.log(`\x1b[32m  ║\x1b[0m  STATUS     : \x1b[32m● NOMINAL\x1b[0m`);
  console.log("\x1b[32m  ╚══════════════════════════════════════════════╝\x1b[0m");
  console.log("");
  log("BOOT", `SERVER ONLINE → http://localhost:${PORT}`);
  log("BOOT", "ALL SYSTEMS NOMINAL ✓");
});
