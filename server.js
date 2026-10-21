require("dotenv").config();
const express = require("express");
const OpenAI = require("openai");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

const client = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN_SECRET || crypto.randomBytes(32).toString("hex");
const METRICS_FILE = process.env.METRICS_FILE || path.join(__dirname, "metrics.json");

function readMetrics() {
  try {
    const data = JSON.parse(fs.readFileSync(METRICS_FILE, "utf8"));
    return { visitors: data.visitors || {}, requests: data.requests || [] };
  } catch (_) {
    return { visitors: {}, requests: [] };
  }
}
let metrics = readMetrics();
function writeMetrics() {
  try { fs.writeFileSync(METRICS_FILE, JSON.stringify(metrics, null, 2)); }
  catch (e) { console.error("Metrics save failed:", e.message); }
}
function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}
function makeToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + 8 * 60 * 60 * 1000 })).toString("base64url");
  const sig = crypto.createHmac("sha256", ADMIN_TOKEN).update(payload).digest("base64url");
  return payload + "." + sig;
}
function isAdmin(req) {
  const token = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = crypto.createHmac("sha256", ADMIN_TOKEN).update(payload).digest("base64url");
  if (!safeEqual(sig, expected)) return false;
  try { return JSON.parse(Buffer.from(payload, "base64url").toString()).exp > Date.now(); }
  catch (_) { return false; }
}
function adminOnly(req, res, next) {
  if (!isAdmin(req)) return res.status(401).json({ error: "Admin login প্রয়োজন।" });
  next();
}

app.get("/api/health", (_req, res) => res.json({ ok: true, configured: Boolean(client) }));

app.post("/api/admin/login", (req, res) => {
  if (!ADMIN_PASSWORD) {
    return res.status(503).json({ error: "ADMIN_PASSWORD সেট করা হয়নি। Hosting Environment Variables-এ সেট করো।" });
  }
  if (!safeEqual(req.body && req.body.password, ADMIN_PASSWORD)) {
    return res.status(401).json({ error: "পাসওয়ার্ড সঠিক নয়।" });
  }
  res.json({ token: makeToken() });
});

app.get("/api/admin/stats", adminOnly, (_req, res) => {
  const visitorList = Object.values(metrics.visitors);
  const requests = metrics.requests.slice(-100).reverse();
  const today = new Date().toISOString().slice(0, 10);
  res.json({
    totalVisitors: visitorList.length,
    totalRequests: metrics.requests.length,
    todayVisitors: visitorList.filter(v => (v.lastSeen || "").slice(0, 10) === today).length,
    todayRequests: metrics.requests.filter(r => (r.at || "").slice(0, 10) === today).length,
    recent: requests.map(r => ({ at: r.at, visitor: r.visitor, status: r.status }))
  });
});

app.post("/api/chat", async (req, res) => {
  const visitor = String((req.body && req.body.visitorId) || "anonymous").slice(0, 80);
  const now = new Date().toISOString();
  if (!metrics.visitors[visitor]) metrics.visitors[visitor] = { firstSeen: now, lastSeen: now, requests: 0 };
  metrics.visitors[visitor].lastSeen = now;
  metrics.visitors[visitor].requests += 1;
  const record = { at: now, visitor: visitor.slice(0, 12), status: "started" };
  metrics.requests.push(record);
  if (metrics.requests.length > 5000) metrics.requests = metrics.requests.slice(-5000);
  writeMetrics();

  try {
    if (!client) return res.status(503).json({ error: "AI সেটআপ করা হয়নি। .env ফাইলে OPENAI_API_KEY যোগ করুন।" });
    const messages = req.body && req.body.messages;
    if (!Array.isArray(messages) || messages.length === 0) return res.status(400).json({ error: "একটি মেসেজ লিখুন।" });
    const safeMessages = messages.slice(-16).map(m => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: String(m.content || "").slice(0, 12000)
    }));
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      messages: [
        { role: "system", content:
          "You are Breaking Bad AI, a helpful assistant and app-building coding partner. " +
          "Answer in the user's language, especially Bangla when they use Bangla. " +
          "For app requests, provide a clear plan, practical code, file names, and beginner-friendly setup steps. " +
          "Be honest about limitations and never claim code was deployed or executed unless it actually was."
        },
        ...safeMessages
      ]
    });
    record.status = "success";
    writeMetrics();
    res.json({ reply: response.choices?.[0]?.message?.content || "দুঃখিত, উত্তর পাওয়া যায়নি।" });
  } catch (err) {
    record.status = "error";
    writeMetrics();
    console.error("AI request failed:", err?.message || err);
    res.status(500).json({ error: "AI উত্তর দিতে পারেনি। API key, billing এবং model সেটিং পরীক্ষা করুন।" });
  }
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`Breaking Bad AI running at http://localhost:${port}`));
