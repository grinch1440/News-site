// Vercel Serverless Function — /api/article
// Called (via vercel.json rewrite) whenever someone visits /article/:slug.
// Fetches that one article from Supabase, and returns a full HTML page with
// correct <title>/description/Open-Graph/Twitter tags baked in server-side —
// so pasting an article link into WhatsApp/Twitter/Facebook/Slack shows a
// real preview card instead of generic site-wide branding.
//
// After that, the page loads the exact same app.js/data.js/config.js/style.css
// as every other page, so a human visitor gets the normal, fully interactive
// site — this function only changes what's in <head> before the app boots.
//
// NOTE: these two values are duplicated from config.js on purpose (a
// serverless function can't read a browser-only script file at runtime).
// If you ever rotate your Supabase anon key, update it in BOTH places.
const SUPABASE_URL = "https://xtjklkewypmgtnjzxnqw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Jbq6Ix2C9YdiwNA4yP_uRw_mO6-MKND";

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

module.exports = async function handler(req, res) {
  const slug = (req.query && req.query.slug) || "";
  const host = req.headers && req.headers.host ? req.headers.host : "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const pageUrl = protocol + "://" + host + "/article/" + encodeURIComponent(slug);

  let article = null;
  try {
    const apiUrl = SUPABASE_URL + "/rest/v1/articles?slug=eq." + encodeURIComponent(slug) +
      "&select=title,dek,image,slug&limit=1";
    const resp = await fetch(apiUrl, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    });
    if (resp.ok) {
      const rows = await resp.json();
      article = rows && rows[0] ? rows[0] : null;
    }
  } catch (e) {
    console.error("api/article fetch failed", e);
  }

  const brand = "Bashline";
  const title = article ? article.title + " — " + brand : brand;
  const description = article ? (article.dek || "").slice(0, 200) : "Independent news, analysis, and perspective on global events.";
  const image = article && article.image ? article.image : "";

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">

<meta property="og:type" content="article">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${escapeHtml(pageUrl)}">
${image ? `<meta property="og:image" content="${escapeHtml(image)}">` : ""}

<meta name="twitter:card" content="${image ? "summary_large_image" : "summary"}">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
${image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : ""}

<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">

<link rel="stylesheet" href="/style.css">
</head>
<body>

<div id="app"></div>

<script>
  (function () {
    function showFatal(msg) {
      var app = document.getElementById("app");
      if (app && app.getAttribute("data-vantage-loaded") !== "1") {
        console.error("Bashline load error:", msg);
        app.innerHTML = '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:2rem;box-sizing:border-box;background:#F7F4EC;font-family:sans-serif;text-align:center;">' +
          '<div><h2 style="font-family:Georgia,serif;color:#10192B;margin:0 0 0.6rem;">Bashline is having trouble loading</h2>' +
          '<p style="color:#5B6472;margin:0 0 1.2rem;">Please check your connection and try again.</p>' +
          '<button onclick="location.reload()" style="background:#10192B;color:#F7F4EC;border:none;padding:0.65rem 1.5rem;border-radius:4px;font-size:0.9rem;cursor:pointer;">Reload</button></div></div>';
      }
    }
    window.addEventListener("error", function (e) {
      showFatal((e && e.message ? e.message : "Unknown error") + (e && e.filename ? " — " + e.filename.split("/").pop() + ":" + e.lineno : ""));
    });
    window.addEventListener("unhandledrejection", function (e) {
      var reason = e && e.reason ? (e.reason.message || e.reason) : "Unknown rejection";
      showFatal("Unhandled error: " + reason);
    });
  })();
</script>

<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
<script src="https://unpkg.com/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mammoth@1.7.0/mammoth.browser.min.js"></script>
<script src="/data.js"></script>
<script src="/config.js"></script>
<script src="/app.js"></script>
</body>
</html>`);
};
    
