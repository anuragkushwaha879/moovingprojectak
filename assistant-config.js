/* =========================================================================
   Mooving CRM — AI Assistant Config
   -------------------------------------------------------------------------
   ⚠️ IMPORTANT SECURITY NOTE (read this before deploying):
   This key is used directly from the browser, so anyone who views the page
   source (Ctrl+U) or opens DevTools can see and copy it. That is normal for
   a quick internal tool, but it means:
     1. Go to Google AI Studio / Google Cloud Console -> this API key ->
        "Application restrictions" -> HTTP referrers, and add only your
        CRM's real domain (e.g. https://yourcompany.web.app/*). This stops
        random people from using YOUR key on THEIR sites.
     2. Set a daily quota / budget alert on this key so a leak can't run up
        a large bill.
     3. If this key has ever been shared publicly (chat, screenshot, repo,
        etc.), rotate it (delete + create a new one) — treat any key that
        has appeared outside your own machine as compromised.
     4. For a production rollout, move this call behind a small backend
        (Cloud Function) instead of calling Gemini directly from the browser.
   ========================================================================= */
window.MOOVING_ASSISTANT_CONFIG = {
  geminiApiKey: "AQ.Ab8RN6LfTh5iAetsXsy1eIWgz5o_aVSIFXNrTJG70_oDMLF0Hg",
  model: "gemini-3.8-flash",
  assistantName: "Moo Assistant"
};
