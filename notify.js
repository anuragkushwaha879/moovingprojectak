/* =========================================================================
   Mooving CRM — Notification Helper
   -------------------------------------------------------------------------
   Sending a notification does two writes: the actual notification doc
   (read realtime on notifications.html / dashboard bell), and a +1 bump to
   the target user's `unreadCount` field on their profile doc. That field is
   what every sidebar reads for the little red badge number — so nothing
   else has to query/listen to the notifications collection just to know
   "is there anything unread", which is the whole point of this helper.
   ========================================================================= */

import { collection, addDoc, doc, setDoc, increment, serverTimestamp }
from "https://www.gstatic.com/firebasejs/10.13.2/firebase-firestore.js";

export async function sendNotification(db, targetUid, title, message) {
  if (!targetUid) return;
  try {
    await addDoc(collection(db, "notifications"), {
      targetUid, title, message, read: false, createdAt: serverTimestamp()
    });
  } catch (e) { console.error("notification create failed", e); }

  try {
    await setDoc(doc(db, "users", targetUid), { unreadCount: increment(1) }, { merge: true });
  } catch (e) { console.error("unreadCount bump failed", e); }
}
