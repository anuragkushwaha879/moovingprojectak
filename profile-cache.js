/* =========================================================================
   Mooving CRM — Profile Cache Helper
   -------------------------------------------------------------------------
   Every page used to call getDoc(users/{uid}) on every single load. This
   caches that document in sessionStorage (cleared automatically when the
   browser tab closes) for a short TTL, so navigating between Dashboard ->
   Tasks -> Analytics -> Profile only re-reads it once every few minutes,
   not once per click.
   ========================================================================= */

import { doc, getDoc, setDoc }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const TTL_MS = 5 * 60 * 1000; // 5 minutes

function cacheKey(uid) { return "crm-profile-" + uid; }

export function getCachedProfile(uid) {
  try {
    const raw = sessionStorage.getItem(cacheKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.t > TTL_MS) return null;
    return parsed.data;
  } catch (e) { return null; }
}

export function setCachedProfile(uid, data) {
  try {
    sessionStorage.setItem(cacheKey(uid), JSON.stringify({ t: Date.now(), data }));
  } catch (e) { /* storage full/blocked — safe to ignore */ }
}

export function clearCachedProfile(uid) {
  try { sessionStorage.removeItem(cacheKey(uid)); } catch (e) {}
}

/**
 * Fetch (and auto-create) a user's profile doc, using the session cache
 * first. Pass forceFresh=true right after you know the doc changed (e.g.
 * just after updating the display name) to bypass the cache once.
 */
export async function getUserProfile(db, user, forceFresh) {
  if (!forceFresh) {
    const cached = getCachedProfile(user.uid);
    if (cached) return cached;
  }
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  let data;
  if (snap.exists()) {
    data = snap.data();
  } else {
    data = { name: user.displayName || user.email, email: user.email, role: "User", createdAt: new Date().toISOString(), unreadCount: 0 };
    await setDoc(ref, data);
  }
  setCachedProfile(user.uid, data);
  return data;
}
