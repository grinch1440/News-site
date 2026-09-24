// Vercel Serverless Function — /sitemap.xml
// Lists every article (with its real slug and last-updated date) plus every
// static/category page, so Google can discover and re-crawl the whole site
// without needing to follow links one by one. Regenerated fresh on every
// request, so new articles show up automatically — no manual updating needed.
const SUPABASE_URL = "https://xtjklkewypmgtnjzxnqw.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Jbq6Ix2C9YdiwNA4yP_uRw_mO6-MKND";

// Keep this in sync with CATEGORIES in data.js (minus "opinion", which has
// its own dedicated /opinion page rather than living under /category/).
const CATEGORY_IDS = [
  "world", "politics", "entertainment", "business", "sports", "technology",
  "health", "analysis", "beyond", "africa", "americas", "asia", "europe",
  "middle-east", "oceania",
];

function escapeXml(s) {
  return String(s || "").replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

module.exports = async function handler(req, res) {
  const host = req.headers && req.headers.host ? req.headers.host : "";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const base = protocol + "://" + host;

  let articles = [];
  try {
    const apiUrl = SUPABASE_URL + "/rest/v1/articles?select=slug,published_at&order=published_at.desc";
    const resp = await fetch(apiUrl, {
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: "Bearer " + SUPABASE_ANON_KEY },
    });
    if (resp.ok) articles = await resp.json();
  } catch (e) {
    console.error("sitemap fetch failed", e);
  }

  const staticUrls = [
    { loc: "/", priority: "1.0" },
    { loc: "/opinion", priority: "0.6" },
    { loc: "/about", priority: "0.3" },
    { loc: "/contact", priority: "0.3" },
    { loc: "/privacy", priority: "0.2" },
  ].concat(CATEGORY_IDS.map(id => ({ loc: "/category/" + id, priority: "0.6" })));

  const urlEntries = staticUrls.map(u =>
    `  <url><loc>${escapeXml(base + u.loc)}</loc><priority>${u.priority}</priority></url>`
  ).concat(
    (articles || []).map(a =>
      `  <url><loc>${escapeXml(base + "/article/" + a.slug)}</loc>` +
      (a.published_at ? `<lastmod>${new Date(a.published_at).toISOString()}</lastmod>` : "") +
      `<priority>0.8</priority></url>`
    )
  ).join("\n");

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`);
};
