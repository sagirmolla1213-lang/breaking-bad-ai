const $ = (s) => document.querySelector(s);
const form = $("#chat-form"), promptInput = $("#prompt"), chat = $("#chat"), welcome = $("#welcome");
let messages = [];
let conversations = JSON.parse(localStorage.getItem("premium-ai-history") || "[]");
let currentId = null;
let visitorId = localStorage.getItem("breaking-bad-ai-visitor");
if (!visitorId) {
  visitorId = (crypto.randomUUID ? crypto.randomUUID() : "v-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  localStorage.setItem("breaking-bad-ai-visitor", visitorId);
}

function saveHistory() {
  localStorage.setItem("premium-ai-history", JSON.stringify(conversations.slice(0, 40)));
  renderHistory();
}
function renderHistory() {
  const root = $("#history"); root.innerHTML = "";
  conversations.forEach((c) => {
    const b = document.createElement("button");
    b.className = "history-item"; b.textContent = c.title || "নতুন চ্যাট";
    b.onclick = () => loadConversation(c.id); root.appendChild(b);
  });
}
function showChat() { welcome.classList.add("hidden"); chat.classList.remove("hidden"); }
function addMessage(role, content) {
  showChat();
  const row = document.createElement("div"); row.className = "message " + role;
  const avatar = document.createElement("div"); avatar.className = "avatar"; avatar.textContent = role === "user" ? "তু" : "✦";
  const bubble = document.createElement("div"); bubble.className = "bubble"; bubble.textContent = content;
  row.append(avatar, bubble); chat.appendChild(row); chat.scrollTop = chat.scrollHeight;
}
function startNew() { currentId = null; messages = []; chat.innerHTML = ""; chat.classList.add("hidden"); welcome.classList.remove("hidden"); promptInput.focus(); }
function loadConversation(id) {
  const c = conversations.find(x => x.id === id); if (!c) return;
  currentId = id; messages = c.messages.map(m => ({...m})); chat.innerHTML = "";
  welcome.classList.add("hidden"); chat.classList.remove("hidden");
  messages.forEach(m => addMessage(m.role, m.content));
  $("#sidebar").classList.remove("open");
}
function saveConversation() {
  if (!messages.length) return;
  if (!currentId) currentId = String(Date.now());
  const title = (messages.find(m => m.role === "user")?.content || "নতুন চ্যাট").slice(0, 34);
  const item = { id: currentId, title, messages, updatedAt: Date.now() };
  conversations = [item, ...conversations.filter(c => c.id !== currentId)];
  saveHistory();
}
async function sendMessage(text) {
  const content = text.trim(); if (!content) return;
  messages.push({role:"user", content}); addMessage("user", content); promptInput.value = "";
  $("#send").disabled = true; $("#status").textContent = "AI উত্তর তৈরি করছে…";
  const waiting = document.createElement("div"); waiting.className = "message";
  waiting.innerHTML = '<div class="avatar">✦</div><div class="bubble">ভাবছি…</div>'; chat.appendChild(waiting); chat.scrollTop = chat.scrollHeight;
  try {
    const r = await fetch("/api/chat", {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({messages, visitorId})});
    const data = await r.json(); if (!r.ok) throw new Error(data.error || "Request failed");
    waiting.remove(); messages.push({role:"assistant", content:data.reply}); addMessage("assistant", data.reply); saveConversation();
  } catch (e) {
    waiting.remove(); addMessage("assistant", "সমস্যা হয়েছে: " + e.message + "\n\nREADME.md অনুযায়ী API key সেটআপ করে সার্ভার চালু করো।");
  } finally { $("#send").disabled = false; $("#status").textContent = "AI প্রস্তুত"; promptInput.focus(); }
}
form.addEventListener("submit", e => {e.preventDefault(); sendMessage(promptInput.value);});
promptInput.addEventListener("keydown", e => {if(e.key === "Enter" && !e.shiftKey){e.preventDefault(); form.requestSubmit();}});
$("#new-chat").onclick = startNew;
$("#clear-history").onclick = () => {if(confirm("সব সংরক্ষিত চ্যাট মুছে ফেলবে?")){conversations=[];saveHistory();startNew();}};
$("#login-button").onclick = () => $("#login-dialog").showModal();
$("#menu-button").onclick = () => $("#sidebar").classList.toggle("open");
document.querySelectorAll(".suggestion").forEach(b => b.onclick = () => {promptInput.value=b.dataset.prompt;promptInput.focus();});
$("#demo-auth").onclick = () => {$("#auth-note").textContent="এটি শুধু UI demo—বাস্তব অ্যাকাউন্ট তৈরি হয়নি। Firebase Authentication সংযুক্ত করতে README দেখো।";};
renderHistory();
fetch("/api/health").then(r=>r.json()).then(d=>{if(!d.configured)$("#status").textContent="API key সেটআপ প্রয়োজন";}).catch(()=>{});
