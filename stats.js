/* =========================================================================
   Mooving CRM — Aggregate Stats Helper
   -------------------------------------------------------------------------
   Instead of running 5-8 getCountFromServer() queries (or scanning the whole
   crmprojects collection) every time the Dashboard loads, we keep small
   "counter" documents that are nudged with increment()/decrement() the
   moment a project is actually created / edited / deleted. The Dashboard
   then does exactly ONE read (two for a normal user: global + their own) no
   matter how many thousand projects exist.

   Docs used:
     stats/global            -> { total, pending, inProgress, completed,
                                   high, medium, low, updatedAt }
     stats_users/{ownerUid}  -> { total, pending, inProgress, completed,
                                   updatedAt }   (per-user breakdown)

   ⚠️ Honest limitation: these counters are updated by the browser, not a
   trusted backend. Firestore rules (see firestore.rules) only allow the
   known counter fields to be touched and only by +1/-1-sized writes in
   practice, but a determined signed-in user could still call increment()
   directly from DevTools and drift a number. For a public-facing product
   the "correct" fix is a Cloud Function that recomputes/validates these
   values server-side on every crmprojects write — flagging that here so
   it's a conscious tradeoff, not an oversight.
   ========================================================================= */

import { doc, setDoc, getDoc, getDocs, getCountFromServer, collection, query, where, increment, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

const STATUS_KEY = { "Pending": "pending", "In Progress": "inProgress", "Complete": "completed" };
const PRIORITY_KEY = { "High": "high", "Medium": "medium", "Low": "low" };

export function statusToField(status) { return STATUS_KEY[status] || null; }
export function priorityToField(p) { return PRIORITY_KEY[p] || null; }

/** Build a delta object {total:+1, pending:+1, high:+1} for a brand-new or deleted project. */
export function projectCreateOrDeleteDelta(status, priority, sign) {
  const d = { total: sign };
  const sf = statusToField(status); if (sf) d[sf] = sign;
  const pf = priorityToField(priority); if (pf) d[pf] = sign;
  return d;
}

/** Build a delta object for an edited project whose status/priority changed (total unaffected). */
export function projectEditDelta(oldStatus, newStatus, oldPriority, newPriority) {
  const d = {};
  if (oldStatus !== newStatus) {
    const oldF = statusToField(oldStatus); if (oldF) d[oldF] = (d[oldF] || 0) - 1;
    const newF = statusToField(newStatus); if (newF) d[newF] = (d[newF] || 0) + 1;
  }
  if (oldPriority !== newPriority) {
    const oldF = priorityToField(oldPriority); if (oldF) d[oldF] = (d[oldF] || 0) - 1;
    const newF = priorityToField(newPriority); if (newF) d[newF] = (d[newF] || 0) + 1;
  }
  return d;
}

function toIncrementPayload(deltas) {
  const payload = {};
  for (const k in deltas) {
    if (deltas[k]) payload[k] = increment(deltas[k]);
  }
  payload.updatedAt = serverTimestamp();
  return payload;
}

export async function bumpGlobalStats(db, deltas) {
  if (!deltas || !Object.keys(deltas).length) return;
  try {
    await setDoc(doc(db, "stats", "global"), toIncrementPayload(deltas), { merge: true });
  } catch (e) { console.error("stats(global) bump failed", e); }
}

export async function bumpUserStats(db, uid, deltas) {
  if (!uid || !deltas || !Object.keys(deltas).length) return;
  try {
    await setDoc(doc(db, "stats_users", uid), toIncrementPayload(deltas), { merge: true });
  } catch (e) { console.error("stats(user) bump failed", e); }
}

export async function getGlobalStats(db) {
  try {
    const ref = doc(db, "stats", "global");
    const snap = await getDoc(ref);
    if (snap.exists() && typeof snap.data().total === "number") {
      return snap.data();
    }
    // Doc missing or never initialized (e.g. projects that existed before
    // this counter system was added) — backfill once from a real count so
    // it doesn't show 0/blank forever, then every future load is 1 read.
    return await backfillGlobalStats(db);
  } catch (e) { console.error(e); return {}; }
}

async function backfillGlobalStats(db) {
  try {
    const base = collection(db, "crmprojects");
    const [total, pending, inProgress, completed, high, medium, low] = await Promise.all([
      getCountFromServer(query(base)),
      getCountFromServer(query(base, where("taskStatus", "==", "Pending"))),
      getCountFromServer(query(base, where("taskStatus", "==", "In Progress"))),
      getCountFromServer(query(base, where("taskStatus", "==", "Complete"))),
      getCountFromServer(query(base, where("taskPriority", "==", "High"))),
      getCountFromServer(query(base, where("taskPriority", "==", "Medium"))),
      getCountFromServer(query(base, where("taskPriority", "==", "Low")))
    ]);
    const fresh = {
      total: total.data().count, pending: pending.data().count,
      inProgress: inProgress.data().count, completed: completed.data().count,
      high: high.data().count, medium: medium.data().count, low: low.data().count,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "stats", "global"), fresh, { merge: true });
    return fresh;
  } catch (e) {
    console.error("stats backfill failed", e);
    return { total: 0, pending: 0, inProgress: 0, completed: 0, high: 0, medium: 0, low: 0 };
  }
}

export async function getUserStats(db, uid) {
  try {
    const ref = doc(db, "stats_users", uid);
    const snap = await getDoc(ref);
    if (snap.exists() && typeof snap.data().total === "number") {
      return snap.data();
    }
    return await backfillUserStats(db, uid);
  } catch (e) { console.error(e); return {}; }
}

async function backfillUserStats(db, uid) {
  try {
    const base = collection(db, "crmprojects");
    const owned = where("ownerUid", "==", uid);
    const [total, pending, inProgress, completed] = await Promise.all([
      getCountFromServer(query(base, owned)),
      getCountFromServer(query(base, owned, where("taskStatus", "==", "Pending"))),
      getCountFromServer(query(base, owned, where("taskStatus", "==", "In Progress"))),
      getCountFromServer(query(base, owned, where("taskStatus", "==", "Complete")))
    ]);
    const fresh = {
      total: total.data().count, pending: pending.data().count,
      inProgress: inProgress.data().count, completed: completed.data().count,
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "stats_users", uid), fresh, { merge: true });
    return fresh;
  } catch (e) {
    console.error("user stats backfill failed", e);
    return { total: 0, pending: 0, inProgress: 0, completed: 0 };
  }
}
