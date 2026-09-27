/* =========================================================================
   Mooving CRM — Shared Widget: Live Clock + AI Help Avatar
   Include this AFTER assistant-config.js, right before </body>, on every
   page that should show it. Pure vanilla JS — no build step needed.
   ========================================================================= */
(function () {
  "use strict";

  const CFG = window.MOOVING_ASSISTANT_CONFIG || {};
  const API_KEY = CFG.geminiApiKey || "";
  const MODEL = CFG.model || "gemini-2.5-flash";
  const NAME = CFG.assistantName || "Moo Assistant";

  const AVATAR_STYLES = {
    classic: { skin: "#ffd6ae", hair: "#3b2a1a", accent: "#1f4e79", accent2: "#2563eb" },
    warm:    { skin: "#f3b98a", hair: "#5a2e12", accent: "#b45309", accent2: "#f59e0b" },
    cool:    { skin: "#ffe0c2", hair: "#111827", accent: "#0f766e", accent2: "#14b8a6" },
    rose:    { skin: "#ffdfc4", hair: "#6b21a8", accent: "#9d174d", accent2: "#ec4899" }
  };

  function currentStyleKey() {
    const saved = localStorage.getItem("moo-avatar-style");
    return AVATAR_STYLES[saved] ? saved : "classic";
  }

  function buildAvatarSvg(styleKey) {
    const s = AVATAR_STYLES[styleKey] || AVATAR_STYLES.classic;
    return `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M12,98 Q50,66 88,98 Z" fill="#e2e8f0"/>
      <path d="M12,98 Q50,72 88,98 L88,100 L12,100 Z" fill="${s.accent}"/>
      <g class="mooAvatarHand">
        <circle cx="79" cy="80" r="7.5" fill="${s.skin}"/>
      </g>
      <g class="mooAvatarHead">
        <ellipse cx="50" cy="46" rx="22" ry="24" fill="${s.skin}"/>
        <path d="M27,36 Q28,14 50,14 Q72,14 73,36 Q73,24 50,21 Q27,24 27,36Z" fill="${s.hair}"/>
        <path d="M24,39 Q24,11 50,11 Q76,11 76,39" fill="none" stroke="#0f172a" stroke-width="3" stroke-linecap="round"/>
        <circle cx="24" cy="41" r="5" fill="#0f172a"/>
        <circle cx="76" cy="41" r="5" fill="#0f172a"/>
        <path d="M76,45 Q79,56 69,59" fill="none" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round"/>
        <circle cx="68" cy="60" r="2.3" fill="#0f172a"/>
        <g class="mooAvatarBlink">
          <ellipse cx="42" cy="47" rx="2.4" ry="3" fill="#1e293b"/>
          <ellipse cx="58" cy="47" rx="2.4" ry="3" fill="#1e293b"/>
        </g>
        <path d="M41,57 Q50,63 59,57" fill="none" stroke="#8a4b2f" stroke-width="2.2" stroke-linecap="round" fill="none"/>
      </g>
    </svg>
  `;
  }

  /* ---------------- Styles ---------------- */
  const style = document.createElement("style");
  style.textContent = `
    #mooLiveClock{
      display:flex; align-items:center; gap:6px;
      font-size:12px; font-weight:700; color:var(--muted, #64748b);
      background:var(--card-bg, #fff); border:1px solid var(--border, #e2e8f0);
      padding:6px 12px; border-radius:20px; white-space:nowrap;
    }
    #mooLiveClock .dot{
      width:7px; height:7px; border-radius:50%; background:#16a34a;
      box-shadow:0 0 0 rgba(22,163,74,.6); animation:mooPulse 2s infinite;
    }
    @keyframes mooPulse{
      0%{ box-shadow:0 0 0 0 rgba(22,163,74,.5); }
      70%{ box-shadow:0 0 0 6px rgba(22,163,74,0); }
      100%{ box-shadow:0 0 0 0 rgba(22,163,74,0); }
    }
    #mooFab{
      position:fixed; right:24px; bottom:24px; z-index:500;
      width:44px; height:44px; border-radius:50%; border:none; cursor:pointer;
      background:linear-gradient(135deg,#1f4e79,#2563eb);
      display:flex; align-items:center; justify-content:center;
      box-shadow:0 8px 24px rgba(31,78,121,.45);
      animation:mooFloat 3s ease-in-out infinite;
      transition:left 1.8s cubic-bezier(.4,0,.2,1), top 1.8s cubic-bezier(.4,0,.2,1), transform .25s ease;
    }
    #mooFab.mooRoaming{ right:auto; bottom:auto; }
    #mooFab.mooFleeing{ transition:left .35s cubic-bezier(.34,1.56,.64,1), top .35s cubic-bezier(.34,1.56,.64,1); }
    #mooFab:hover{ transform:translateY(-4px) scale(1.06); animation-play-state:paused; }
    #mooFab svg{ width:28px; height:28px; overflow:visible; }
    @keyframes mooFloat{
      0%,100%{ transform:translateY(0); }
      50%{ transform:translateY(-6px); }
    }
    #mooFab .mooRing{
      position:absolute; inset:-6px; border-radius:50%;
      border:2px solid rgba(56,189,248,.55);
      animation:mooRing 2.4s ease-out infinite;
    }
    @keyframes mooRing{
      0%{ transform:scale(.85); opacity:.9; }
      100%{ transform:scale(1.35); opacity:0; }
    }
    #mooFab .mooBadge{
      position:absolute; top:-2px; right:-2px; background:#e2131f; color:#fff;
      font-size:9px; font-weight:800; padding:2px 5px; border-radius:8px; z-index:2;
    }
    .mooAvatarHead{ animation:mooNod 4s ease-in-out infinite; transform-origin:50% 70%; }
    @keyframes mooNod{
      0%,85%,100%{ transform:rotate(0deg); }
      90%{ transform:rotate(-4deg); }
      95%{ transform:rotate(3deg); }
    }
    .mooAvatarHand{ animation:mooWave 2.6s ease-in-out infinite; transform-origin:85% 85%; }
    @keyframes mooWave{
      0%,60%,100%{ transform:rotate(0deg); }
      70%{ transform:rotate(-18deg); }
      80%{ transform:rotate(10deg); }
      90%{ transform:rotate(-14deg); }
    }
    .mooAvatarBlink{ animation:mooBlink 4.5s ease-in-out infinite; }
    @keyframes mooBlink{
      0%,92%,100%{ transform:scaleY(1); }
      95%{ transform:scaleY(.1); }
    }
    #mooChatPanel{
      position:fixed; right:24px; bottom:94px; z-index:500;
      width:340px; max-width:90vw; height:460px; max-height:70vh;
      background:var(--card-bg, #fff); border:1px solid var(--border, #e2e8f0);
      border-radius:16px; box-shadow:0 20px 50px rgba(0,0,0,.25);
      display:none; flex-direction:column; overflow:hidden;
      font-family:'Segoe UI', system-ui, -apple-system, sans-serif;
    }
    #mooChatPanel.open{ display:flex; }
    #mooChatHead{
      background:linear-gradient(135deg,#1f4e79,#163a5c); color:#fff;
      padding:14px 16px; display:flex; align-items:center; gap:10px;
    }
    #mooChatHead .av{ width:38px; height:38px; border-radius:50%; background:rgba(255,255,255,.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
    #mooChatHead .av svg{ width:26px; height:26px; }
    #mooChatHead .av .mooOnlineDot{ position:relative; }
    #mooChatHead .ti{ flex:1; }
    #mooChatHead .ti b{ display:block; font-size:13px; }
    #mooChatHead .ti span{ font-size:11px; color:#9fd3ff; }
    #mooChatHead button{ background:none; border:none; color:#fff; font-size:18px; cursor:pointer; opacity:.8; }
    #mooChatHead button:hover{ opacity:1; }
    #mooChatBody{ flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:10px; background:var(--bg,#f8fafc); }
    .mooMsg{ max-width:85%; padding:9px 12px; border-radius:12px; font-size:13px; line-height:1.45; word-wrap:break-word; }
    .mooMsg.bot{ background:var(--card-bg,#fff); border:1px solid var(--border,#e2e8f0); color:var(--text,#0f172a); align-self:flex-start; border-bottom-left-radius:2px; }
    .mooMsg.user{ background:var(--navy,#1f4e79); color:#fff; align-self:flex-end; border-bottom-right-radius:2px; }
    .mooMsg.typing{ font-style:italic; color:var(--muted,#64748b); }
    #mooChatFoot{ display:flex; gap:8px; padding:10px; border-top:1px solid var(--border,#e2e8f0); background:var(--card-bg,#fff); }
    #mooChatInput{ flex:1; border:1px solid var(--border,#e2e8f0); border-radius:20px; padding:9px 14px; font-size:13px; outline:none; background:var(--bg,#f8fafc); color:var(--text,#0f172a); }
    #mooChatSend{ background:var(--navy,#1f4e79); color:#fff; border:none; width:36px; height:36px; border-radius:50%; cursor:pointer; font-size:15px; flex-shrink:0; }
    #mooChatSend:disabled{ opacity:.5; cursor:default; }
    @media (max-width:480px){
      #mooChatPanel{ right:12px; left:12px; width:auto; bottom:88px; }
      #mooFab{ right:16px; bottom:16px; }
    }
  `;
  document.head.appendChild(style);

  /* ---------------- Live real-time clock (injected into top bar) ---------------- */
  function mountClock() {
    const bar = document.querySelector(".top-app-bar");
    if (!bar || document.getElementById("mooLiveClock")) return;
    const el = document.createElement("div");
    el.id = "mooLiveClock";
    el.innerHTML = `<span class="dot"></span><span id="mooLiveClockText">--:--:--</span>`;
    // insert as first child of the bar's right-hand group if present, else append
    const rightGroup = bar.querySelector("div:last-child");
    if (rightGroup) rightGroup.insertBefore(el, rightGroup.firstChild);
    else bar.appendChild(el);

    function tick() {
      const now = new Date();
      const txt = now.toLocaleString("en-IN", {
        weekday: "short", day: "2-digit", month: "short",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
      });
      const t = document.getElementById("mooLiveClockText");
      if (t) t.textContent = txt;
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ---------------- Voice (AI avatar only) ---------------- */
  function isMuted() {
    return localStorage.getItem("moo-voice-muted") === "true";
  }

  function speak(text) {
    try {
      if (isMuted()) return;
      if (!("speechSynthesis" in window) || !text) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(v => /hi-IN/i.test(v.lang));
      const inVoice = voices.find(v => /en-IN/i.test(v.lang));
      u.voice = hindiVoice || inVoice || null;
      u.lang = (hindiVoice || inVoice) ? u.voice.lang : "en-IN";
      u.rate = 1;
      u.pitch = 1.05;
      window.speechSynthesis.speak(u);
    } catch (e) { /* speech synthesis not available — silently skip */ }
  }

  const BYE_LINES = ["Bye bye! 👋", "Phir milte hain!", "Chalte hain, kaam karo!", "Tata! 😄"];
  const GREET_TEMPLATES = [
    "Namaste {name}, kaise hain aap?",
    "Hi {name}! Aaj ka din kaisa ja raha hai?",
    "Welcome back, {name}!",
    "{name}, kaam shuru karte hain?"
  ];

  window.mooSetUserName = function (name) {
    if (!name) return;
    window.__mooUserName = name;
    if (sessionStorage.getItem("moo-greeted") === "1") return;
    sessionStorage.setItem("moo-greeted", "1");
    const line = GREET_TEMPLATES[Math.floor(Math.random() * GREET_TEMPLATES.length)].replace("{name}", name);
    setTimeout(() => speak(line), 1200);
  };

  /* ---------------- AI Help Avatar ---------------- */
  function mountAssistant() {
    const fab = document.createElement("button");
    fab.id = "mooFab";
    fab.title = NAME;
    const styleKey = currentStyleKey();
    fab.innerHTML = `<span class="mooRing"></span>${buildAvatarSvg(styleKey)}<span class="mooBadge">AI</span>`;

    const panel = document.createElement("div");
    panel.id = "mooChatPanel";
    panel.innerHTML = `
      <div id="mooChatHead">
        <div class="av">${buildAvatarSvg(styleKey)}</div>
        <div class="ti"><b>${escapeHtml(NAME)}</b><span>Online • Ask me anything</span></div>
        <button id="mooMuteBtn" title="Mute voice">${isMuted() ? "🔇" : "🔊"}</button>
        <button id="mooChatClose" title="Close">✕</button>
      </div>
      <div id="mooChatBody"></div>
      <div id="mooChatFoot">
        <input id="mooChatInput" type="text" placeholder="Apna sawaal likhein..." />
        <button id="mooChatSend">➤</button>
      </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const body = panel.querySelector("#mooChatBody");
    const input = panel.querySelector("#mooChatInput");
    const sendBtn = panel.querySelector("#mooChatSend");
    let history = [];
    let opened = false;
    let roamTimer = null;

    /* ---- Roaming: gentle wander confined to a safe bottom-right corner,
       then settle permanently so it never drifts over buttons/content. ---- */
    const SIZE = 44;
    const ZONE_W = 220;
    const ZONE_H = 180;
    const MAX_ROAMS = 3;
    let roamCount = 0;

    function pickRoamSpot() {
      const margin = 20;
      const xMax = window.innerWidth - SIZE - margin;
      const xMin = Math.max(margin, xMax - ZONE_W);
      const yMax = window.innerHeight - SIZE - margin;
      const yMin = Math.max(margin, yMax - ZONE_H);
      const x = xMin + Math.random() * Math.max(0, xMax - xMin);
      const y = yMin + Math.random() * Math.max(0, yMax - yMin);
      return { x, y };
    }

    function settlePermanently() {
      if (roamTimer) clearInterval(roamTimer);
      roamTimer = null;
      fab.classList.remove("mooRoaming", "mooFleeing");
      fab.style.left = "";
      fab.style.top = "";
    }

    function roamStep() {
      if (opened) return;
      if (roamCount >= MAX_ROAMS) { settlePermanently(); return; }
      roamCount++;
      const { x, y } = pickRoamSpot();
      fab.classList.add("mooRoaming");
      fab.classList.remove("mooFleeing");
      fab.style.left = x + "px";
      fab.style.top = y + "px";
      if (roamCount >= MAX_ROAMS) setTimeout(settlePermanently, 1800);
    }

    function startRoaming() {
      if (roamTimer) clearInterval(roamTimer);
      roamTimer = setInterval(roamStep, 9000);
      setTimeout(roamStep, 4000);
    }
    startRoaming();

    function flee() {
      if (roamCount >= MAX_ROAMS) return; // already settled — stay put, just open chat
      const { x, y } = pickRoamSpot();
      fab.classList.add("mooRoaming", "mooFleeing");
      fab.style.left = x + "px";
      fab.style.top = y + "px";
      if (Math.random() < 0.5) speak(BYE_LINES[Math.floor(Math.random() * BYE_LINES.length)]);
      setTimeout(() => fab.classList.remove("mooFleeing"), 400);
    }

    function addMsg(role, text) {
      const div = document.createElement("div");
      div.className = "mooMsg " + (role === "user" ? "user" : "bot");
      div.textContent = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
      return div;
    }

    function openPanel() {
      opened = true;
      panel.classList.add("open");
      if (body.children.length === 0) {
        addMsg("bot", `Namaste 👋 Main ${NAME} hoon. Mujhse CRM ke bare me ya kisi bhi general sawaal ke baare me pooch sakte hain.`);
      }
      setTimeout(() => input.focus(), 150);
    }

    function closePanel() {
      opened = false;
      panel.classList.remove("open");
      if (Math.random() < 0.35) speak(BYE_LINES[Math.floor(Math.random() * BYE_LINES.length)]);
      setTimeout(roamStep, 2500);
    }

    // First click on a roaming/idle avatar = playful dash-away, then settle and open chat.
    fab.addEventListener("click", () => {
      if (opened) { closePanel(); return; }
      flee();
      setTimeout(openPanel, 420);
    });
    panel.querySelector("#mooChatClose").addEventListener("click", closePanel);
    panel.querySelector("#mooMuteBtn").addEventListener("click", (e) => {
      const nowMuted = !isMuted();
      localStorage.setItem("moo-voice-muted", String(nowMuted));
      e.currentTarget.textContent = nowMuted ? "🔇" : "🔊";
      e.currentTarget.title = nowMuted ? "Unmute voice" : "Mute voice";
      if (nowMuted) window.speechSynthesis.cancel();
    });

    async function send() {
      const text = input.value.trim();
      if (!text) return;
      if (!API_KEY) {
        addMsg("bot", "AI assistant abhi configure nahi hua hai (API key missing).");
        return;
      }
      addMsg("user", text);
      history.push({ role: "user", parts: [{ text }] });
      input.value = "";
      sendBtn.disabled = true;
      const typingEl = addMsg("bot", "Type kar raha hoon...");
      typingEl.classList.add("typing");

      try {
        const sysPrompt = {
          role: "user",
          parts: [{
            text: "You are " + NAME + ", a warm, helpful, general-purpose voice-and-text assistant embedded inside 'Mooving CRM' (an internal project & task management tool). Answer ANY question the person asks — general knowledge, explanations, coding help, writing help, math, advice, or questions about how to use this CRM (dashboard, projects, tasks, analytics, admin panel) — the same way a capable assistant like Gemini or ChatGPT would, not just CRM topics. Keep replies reasonably concise (roughly 2-6 sentences unless the question genuinely needs more, e.g. step-by-step instructions or code). Reply in the same language/style the person used — if they write in Hinglish, reply in Hinglish; otherwise match their language. You do not have live access to this company's actual database records (specific project names, numbers, etc.), so say so briefly if asked for that instead of guessing."
          }]
        };
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [sysPrompt, ...history],
              generationConfig: { maxOutputTokens: 600, temperature: 0.7 }
            })
          }
        );
        const data = await resp.json();
        typingEl.remove();

        if (data.error) {
          addMsg("bot", "Sorry, AI se javab nahi mil paaya (" + (data.error.message || "error") + ").");
          return;
        }
        const reply =
          data?.candidates?.[0]?.content?.parts?.map(p => p.text).join("") ||
          "Sorry, samajh nahi paya. Dobara try karein.";
        addMsg("bot", reply);
        speak(reply);
        history.push({ role: "model", parts: [{ text: reply }] });
        if (history.length > 12) history = history.slice(-12);
      } catch (err) {
        typingEl.remove();
        addMsg("bot", "Network error — connection check karein.");
      } finally {
        sendBtn.disabled = false;
      }
    }

    sendBtn.addEventListener("click", send);
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });
  }

  function escapeHtml(v) {
    return String(v).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
  }

  function init() {
    mountClock();
    const enabled = localStorage.getItem("crm-assistant-enabled") !== "false";
    if (enabled) mountAssistant();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
