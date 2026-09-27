/* =========================================================================
   Mooving CRM — Resilience / "Self-Healing" Helper
   -------------------------------------------------------------------------
   Two jobs:
   1. withTimeout(promise, ms) — if a Firestore call hangs (huge dataset,
      flaky connection) longer than `ms`, we stop waiting, show a small
      retry banner, and hand back control instead of freezing the page.
   2. A global window.onerror / unhandledrejection catcher so one bad query
      shows a friendly banner+retry instead of a blank/broken screen.

   Honest note: this can't literally "auto-fix" bad data or a broken
   security rule — nothing running only in the browser can. What it *can*
   do is stop a slow/failed read from hanging the UI, retry once
   automatically, and give the person an obvious manual retry button rather
   than a silent freeze.
   ========================================================================= */

export function withTimeout(promise, ms = 8000, label = "request") {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error("TIMEOUT:" + label)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

/** Run `fn` (an async function) once, and if it fails/times out, wait 1.2s and try once more before giving up. */
export async function withRetry(fn, { attempts = 2, timeoutMs = 8000, label = "request" } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await withTimeout(fn(), timeoutMs, label);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise(r => setTimeout(r, 1200));
    }
  }
  throw lastErr;
}

function ensureBannerEl() {
  let el = document.getElementById("crmSelfHealBanner");
  if (el) return el;
  el = document.createElement("div");
  el.id = "crmSelfHealBanner";
  el.style.cssText = "position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:600;background:#dc2626;color:#fff;padding:10px 18px;border-radius:10px;font-size:13px;font-weight:700;box-shadow:0 8px 20px rgba(0,0,0,.3);display:flex;gap:12px;align-items:center;";
  document.body.appendChild(el);
  return el;
}

export function showRetryBanner(message, onRetry) {
  const el = ensureBannerEl();
  el.innerHTML = `<span>⚠️ ${message}</span>`;
  const btn = document.createElement("button");
  btn.textContent = "🔄 Retry";
  btn.style.cssText = "background:#fff;color:#dc2626;border:none;border-radius:6px;padding:4px 10px;font-weight:800;cursor:pointer;";
  btn.onclick = () => { el.remove(); if (onRetry) onRetry(); };
  el.appendChild(btn);
  setTimeout(() => { if (document.getElementById("crmSelfHealBanner") === el) el.remove(); }, 15000);
}

window.addEventListener("unhandledrejection", (ev) => {
  console.error("Unhandled error:", ev.reason);
});
window.addEventListener("error", (ev) => {
  console.error("Page error:", ev.error || ev.message);
});
