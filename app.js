/* ============================================================================
   VANTAGE — app logic
   Data (articles, settings, comments, messages, subscribers) lives in Supabase
   so every visitor sees the same live site. Dark-mode + "just subscribed" are
   the only things still kept per-browser (they're just UI state, not content).
   ============================================================================ */

/* --------------------------------- Local UI state storage ----------------------- */

function localGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}
function localSet(key, value) {
  try { localStorage.setItem(key, value); return true; } catch (e) { return false; }
}

/* --------------------------------- Supabase ------------------------------------- */

let db = null;
let CONFIGURED = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
let LOAD_ERROR = null;
if (CONFIGURED) {
  try {
    if (window.supabase && typeof window.supabase.createClient === "function") {
      db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } else {
      CONFIGURED = false;
      LOAD_ERROR = "A required script (Supabase) didn't finish loading. This usually means a slow or interrupted internet connection. Try reloading the page.";
    }
  } catch (e) {
    CONFIGURED = false;
    LOAD_ERROR = "Failed to connect to Supabase: " + (e && e.message ? e.message : e);
  }
}

function rowToArticle(r) {
  const gallery = (r.images && r.images.length) ? r.images : (r.image ? [r.image] : []);
  return {
    id: r.id, title: r.title, dek: r.dek || "", category: r.category, author: r.author,
    dateline: r.dateline, date: r.published_at, image: r.image, images: gallery, video: r.video || "",
    breaking: !!r.breaking, trending: !!r.trending, featured: !!r.featured,
    breakingUntil: r.breaking_until || null, trendingUntil: r.trending_until || null,
    type: r.type || "news", body: r.body || [],
  };
}

async function fetchArticles() {
  const { data, error } = await db.from("articles").select("*").order("published_at", { ascending: false });
  if (error) { console.error("fetchArticles", error); return []; }
  return data.map(rowToArticle);
}

async function fetchSettings() {
  const { data, error } = await db.from("site_settings").select("id, brand_name, tagline").eq("id", 1).single();
  if (error) { console.error("fetchSettings", error); return { brandName: BRAND, tagline: TAGLINE }; }
  return { brandName: data.brand_name, tagline: data.tagline };
}

async function insertArticle(a) {
  const { data, error } = await db.rpc("create_article", {
    input: S.admin.passcode || "",
    p_id: a.id, p_title: a.title, p_dek: a.dek, p_category: a.category, p_author: a.author,
    p_dateline: a.dateline, p_published_at: a.date, p_image: a.image,
    p_images: a.images || [], p_video: a.video || null,
    p_breaking: a.breaking, p_trending: a.trending, p_featured: a.featured,
    p_type: a.type, p_body: a.body,
    p_breaking_until: a.breakingUntil || null, p_trending_until: a.trendingUntil || null,
  });
  if (error) { console.error("insertArticle", error); return false; }
  return data === true;
}

async function updateArticleRow(id, a) {
  const { data, error } = await db.rpc("update_article", {
    input: S.admin.passcode || "",
    p_id: id, p_title: a.title, p_dek: a.dek, p_category: a.category, p_author: a.author,
    p_dateline: a.dateline, p_image: a.image, p_images: a.images || [], p_video: a.video || null,
    p_breaking: a.breaking, p_trending: a.trending, p_featured: a.featured,
    p_type: a.type, p_body: a.body,
    p_breaking_until: a.breakingUntil || null, p_trending_until: a.trendingUntil || null,
  });
  if (error) { console.error("updateArticleRow", error); return false; }
  return data === true;
}

async function deleteArticleRow(id) {
  const { data, error } = await db.rpc("delete_article", { input: S.admin.passcode || "", p_id: id });
  if (error) { console.error("deleteArticleRow", error); return false; }
  return data === true;
}

async function updateSettingsRow(s) {
  const { error } = await db.from("site_settings").update({
    brand_name: s.brandName, tagline: s.tagline,
  }).eq("id", 1);
  if (error) console.error("updateSettingsRow", error);
  return !error;
}

async function checkAdminPasscode(input) {
  const { data, error } = await db.rpc("check_admin_passcode", { input: input });
  if (error) { console.error("checkAdminPasscode", error); return false; }
  return data === true;
}

async function changeAdminPasscode(currentInput, newPasscode) {
  const { data, error } = await db.rpc("set_admin_passcode", { current_input: currentInput, new_passcode: newPasscode });
  if (error) { console.error("changeAdminPasscode", error); return false; }
  return data === true;
}

async function fetchComments(articleId) {
  const { data, error } = await db.from("comments").select("*").eq("article_id", articleId).order("created_at", { ascending: true });
  if (error) { console.error("fetchComments", error); return []; }
  return data.map(r => ({ id: r.id, name: r.name, text: r.body, date: r.created_at }));
}

async function insertComment(articleId, name, text) {
  const row = { id: uid(), article_id: articleId, name: name, body: text };
  const { error } = await db.from("comments").insert(row);
  if (error) console.error("insertComment", error);
  return !error;
}

async function fetchMessages() {
  const { data, error } = await db.rpc("get_messages", { input: S.admin.passcode || "" });
  if (error) { console.error("fetchMessages", error); return []; }
  return (data || []).map(r => ({ id: r.id, name: r.name, email: r.email, subject: r.subject, message: r.body, date: r.created_at }));
}

async function insertMessage(m) {
  const { error } = await db.from("messages").insert({
    id: uid(), name: m.name, email: m.email, subject: m.subject, body: m.message,
  });
  if (error) console.error("insertMessage", error);
  return !error;
}

async function fetchSubscribers() {
  const { data, error } = await db.rpc("get_subscribers", { input: S.admin.passcode || "" });
  if (error) { console.error("fetchSubscribers", error); return []; }
  return (data || []).map(r => r.email);
}

async function insertSubscriber(email) {
  const { error } = await db.from("subscribers").upsert({ id: uid(), email: email }, { onConflict: "email" });
  if (error) console.error("insertSubscriber", error);
  return !error;
}

async function uploadImageFile(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${uid()}.${ext}`;
  const { error } = await db.storage.from("article-images").upload(path, file);
  if (error) { console.error("uploadImageFile", error); return { url: null, error }; }
  const { data } = db.storage.from("article-images").getPublicUrl(path);
  return { url: data ? data.publicUrl : null, error: null };
}

async function uploadVideoFile(file) {
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `${uid()}.${ext}`;
  const { error } = await db.storage.from("article-videos").upload(path, file);
  if (error) { console.error("uploadVideoFile", error); return { url: null, error }; }
  const { data } = db.storage.from("article-videos").getPublicUrl(path);
  return { url: data ? data.publicUrl : null, error: null };
}

/* ----------------------------------- State ------------------------------------ */

const S = {
  ready: false,
  articles: [],
  settings: { brandName: BRAND, tagline: TAGLINE },
  page: { name: "home" },
  dark: false,
  menuOpen: false,
  searchOpen: false,
  query: "",
  adminAuthed: false,
  admin: { tab: "articles", editing: null, editingImages: [], messages: [], subscribers: [], _messagesLoaded: false, _subsLoaded: false },
  comments: {}, // cache: articleId -> array
  commentsLoading: {},
};

async function init() {
  if (!CONFIGURED) {
    S.ready = "unconfigured";
    render();
    return;
  }
  const [articles, settings] = await Promise.all([fetchArticles(), fetchSettings()]);
  S.articles = articles;
  S.settings = settings;
  S.dark = localGet("vantage-dark-mode") === "true";
  S.page = window.VANTAGE_ADMIN_ENTRY ? { name: "admin" } : hashToPage(window.location.hash);
  history.replaceState({ vantagePage: S.page }, "", pageToHash(S.page));
  S.ready = true;
  render();
  if (S.page.name === "article" && S.page.id && !S.comments[S.page.id]) {
    loadCommentsFor(S.page.id);
  }
}

function pageToHash(page) {
  if (page.name === "category") return "#/category/" + encodeURIComponent(page.category || "");
  if (page.name === "article") return "#/article/" + encodeURIComponent(page.id || "");
  if (page.name === "opinion") return "#/opinion";
  if (page.name === "about") return "#/about";
  if (page.name === "privacy") return "#/privacy";
  if (page.name === "contact") return "#/contact";
  if (page.name === "admin") return "#/admin";
  return "#/";
}

function hashToPage(hash) {
  const h = (hash || "").replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean).map(function (s) { try { return decodeURIComponent(s); } catch (e) { return s; } });
  if (parts.length === 0) return { name: "home" };
  if (parts[0] === "category" && parts[1]) return { name: "category", category: parts[1] };
  if (parts[0] === "article" && parts[1]) return { name: "article", id: parts[1] };
  if (parts[0] === "opinion") return { name: "opinion" };
  if (parts[0] === "about") return { name: "about" };
  if (parts[0] === "privacy") return { name: "privacy" };
  if (parts[0] === "contact") return { name: "contact" };
  if (parts[0] === "admin") return { name: "admin" };
  return { name: "home" };
}

function goto(name, params) {
  S.page = Object.assign({ name: name }, params || {});
  S.menuOpen = false;
  S.searchOpen = false;
  S.query = "";
  const hash = pageToHash(S.page);
  if (window.location.hash !== hash) {
    history.pushState({ vantagePage: S.page }, "", hash);
  }
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
  if (name === "article" && params && params.id && !S.comments[params.id]) {
    loadCommentsFor(params.id);
  }
}

window.addEventListener("popstate", function (e) {
  const page = (e.state && e.state.vantagePage) || hashToPage(window.location.hash);
  S.page = page;
  S.menuOpen = false;
  S.searchOpen = false;
  S.query = "";
  render();
  window.scrollTo({ top: 0, behavior: "auto" });
  if (page.name === "article" && page.id && !S.comments[page.id]) {
    loadCommentsFor(page.id);
  }
});

async function loadCommentsFor(articleId) {
  S.commentsLoading[articleId] = true;
  const list = await fetchComments(articleId);
  S.comments[articleId] = list;
  S.commentsLoading[articleId] = false;
  render();
}

function getFiltered() {
  let list = S.articles.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const q = S.query.trim().toLowerCase();
  if (q) {
    list = list.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.dek.toLowerCase().includes(q) ||
      a.author.toLowerCase().includes(q) ||
      a.category.toLowerCase().includes(q)
    );
  }
  return list;
}

/* ------------------------------- Small helpers -------------------------------- */

function esc(str) {
  if (str === undefined || str === null) return "";
  return String(str)
    .replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function tagActive(article, key) {
  if (!article[key]) return false;
  const until = key === "breaking" ? article.breakingUntil : article.trendingUntil;
  if (!until) return true;
  return new Date(until).getTime() > Date.now();
}

function categoryLabel(id) {
  const c = CATEGORIES.find(c => c.id === id);
  return c ? c.label : id;
}

function dateline(a, size) {
  const coords = CITY_COORDS[a.dateline] || "";
  const parts = [];
  if (a.dateline) {
    parts.push(`<span class="dateline-city">${esc(a.dateline)}</span>`);
    if (coords) parts.push(`<span>${esc(coords)}</span>`);
  }
  parts.push(`<span>${esc(a.author)}</span>`);
  parts.push(`<span>${esc(fmtDate(a.date))}</span>`);
  return `<div class="dateline ${size === "md" ? "dateline-md" : ""}">${parts.join("<span>&middot;</span>")}</div>`;
}

function categoryTag(category) {
  return `<span class="cat-tag">${esc(categoryLabel(category))}</span>`;
}

function articleCard(a, variant) {
  if (variant === "row") {
    return `
      <button class="card-row" data-goto="article" data-params='{"id":"${a.id}"}'>
        <img src="${esc(a.image)}" alt="" loading="lazy">
        <div class="card-row-body">
          ${categoryTag(a.category)}
          <h3>${esc(a.title)}</h3>
          <span class="meta-mono">${a.dateline ? esc(a.dateline) + " &middot; " : ""}${esc(timeAgo(a.date))}</span>
        </div>
      </button>`;
  }
  return `
    <button class="card" data-goto="article" data-params='{"id":"${a.id}"}'>
      <div class="card-img"><img src="${esc(a.image)}" alt="" loading="lazy"></div>
      ${categoryTag(a.category)}
      <h3>${esc(a.title)}</h3>
      <p class="card-dek">${esc(a.dek)}</p>
      <div class="card-dateline">${dateline(a)}</div>
    </button>`;
}

function parseInlineMd(text) {
  let out = esc(text);
  out = out.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
  return out;
}

function renderBodyBlock(block, isFirst) {
  const trimmed = block.trim();
  if (/^##\s+/.test(trimmed)) {
    return `<h3>${parseInlineMd(trimmed.replace(/^##\s+/, ""))}</h3>`;
  }
  const lines = trimmed.split("\n").map(l => l.trim()).filter(Boolean);
  const isList = lines.length > 0 && lines.every(l => /^[-*]\s+/.test(l));
  if (isList) {
    return `<ul class="body-list">${lines.map(l => `<li>${parseInlineMd(l.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
  }
  const html = lines.map(l => parseInlineMd(l)).join("<br>");
  return `<p${isFirst ? ' class="drop-cap"' : ""}>${html}</p>`;
}

function emptyState(text) {
  return `<div class="empty-state"><p>${esc(text)}</p></div>`;
}

function videoEmbedHtml(url) {
  if (!url) return "";
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  if (yt) {
    return `<div class="video-embed"><iframe src="https://www.youtube.com/embed/${yt[1]}" allowfullscreen loading="lazy" title="Video"></iframe></div>`;
  }
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) {
    return `<div class="video-embed"><iframe src="https://player.vimeo.com/video/${vm[1]}" allowfullscreen loading="lazy" title="Video"></iframe></div>`;
  }
  return `<div class="video-embed video-file"><video controls preload="metadata" src="${esc(url)}"></video></div>`;
}

function galleryHtml(images) {
  if (!images || images.length === 0) return "";
  if (images.length === 1) {
    return `<div class="article-img"><img src="${esc(images[0])}" alt=""></div>`;
  }
  return `
    <div class="gallery" id="article-gallery">
      <div class="gallery-track">
        ${images.map(u => `<div class="gallery-slide"><img src="${esc(u)}" alt="" loading="lazy"></div>`).join("")}
      </div>
      <div class="gallery-dots">
        ${images.map((_, i) => `<span class="gallery-dot ${i === 0 ? "active" : ""}"></span>`).join("")}
      </div>
    </div>`;
}

let galleryTimer = null;
function stopGalleryAutoplay() {
  if (galleryTimer) { clearInterval(galleryTimer); galleryTimer = null; }
}
function initGallery() {
  stopGalleryAutoplay();
  const el = document.getElementById("article-gallery");
  if (!el) return;
  const track = el.querySelector(".gallery-track");
  const slides = el.querySelectorAll(".gallery-slide");
  const dots = el.querySelectorAll(".gallery-dot");
  if (slides.length <= 1) return;

  let index = 0;
  function goTo(i) {
    index = ((i % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    dots.forEach((d, di) => d.classList.toggle("active", di === index));
  }
  function next() { goTo(index + 1); }
  function startAutoplay() { stopGalleryAutoplay(); galleryTimer = setInterval(next, 4000); }
  startAutoplay();

  let startX = 0, deltaX = 0, dragging = false;
  track.addEventListener("touchstart", function (e) {
    dragging = true; startX = e.touches[0].clientX; stopGalleryAutoplay();
  }, { passive: true });
  track.addEventListener("touchmove", function (e) {
    if (!dragging) return;
    deltaX = e.touches[0].clientX - startX;
  }, { passive: true });
  track.addEventListener("touchend", function () {
    if (!dragging) return;
    dragging = false;
    if (deltaX < -40) next();
    else if (deltaX > 40) goTo(index - 1);
    deltaX = 0;
    startAutoplay();
  });

  dots.forEach((d, di) => d.addEventListener("click", function () { goTo(di); startAutoplay(); }));
}

/* --------------------------------- Masthead ------------------------------------ */

function renderClocks() {
  const now = new Date();
  return WORLD_CLOCKS.map(c => {
    const time = now.toLocaleTimeString("en-US", { timeZone: c.tz, hour: "2-digit", minute: "2-digit", hour12: false });
    return `<span class="clock"><span class="clock-label">${c.label}</span><span>${time}</span></span>`;
  }).join("");
}

const NAV_ITEMS = [
  { label: "World", name: "category", params: { category: "world" } },
  { label: "Politics", name: "category", params: { category: "politics" } },
  { label: "Entertainment", name: "category", params: { category: "entertainment" } },
  { label: "Business", name: "category", params: { category: "business" } },
  { label: "Sports", name: "category", params: { category: "sports" } },
  { label: "Technology", name: "category", params: { category: "technology" } },
  { label: "Health", name: "category", params: { category: "health" } },
  { label: "Opinion", name: "opinion", params: {} },
  { label: "Analysis", name: "category", params: { category: "analysis" } },
  { label: "Beyond the Headlines", name: "category", params: { category: "beyond" } },
  { label: "Africa", name: "category", params: { category: "africa" } },
  { label: "Americas", name: "category", params: { category: "americas" } },
  { label: "Asia", name: "category", params: { category: "asia" } },
  { label: "Europe", name: "category", params: { category: "europe" } },
  { label: "Middle East", name: "category", params: { category: "middle-east" } },
  { label: "Oceania", name: "category", params: { category: "oceania" } },
  { label: "About", name: "about", params: {} },
  { label: "Contact", name: "contact", params: {} },
];

function navButton(item, mobile) {
  return `<button class="${mobile ? "nav-item-mobile" : "nav-item"}" data-goto="${item.name}" data-params='${JSON.stringify(item.params)}'>${esc(item.label)}</button>`;
}

function renderMasthead() {
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  return `
    <header class="masthead">
      <div class="utility-bar">
        <span class="today">${today}</span>
        <div class="clocks">${renderClocks()}</div>
      </div>
      <div class="masthead-row">
        ${S.page.name !== "home" ? `
        <button class="icon-btn back-nav-btn" data-action="nav-back" aria-label="Back">
          <i data-lucide="arrow-left"></i>
        </button>` : ""}
        <button class="icon-btn menu-btn" data-toggle="menu" aria-label="Menu">
          <i data-lucide="${S.menuOpen ? "x" : "menu"}"></i>
        </button>
        <button class="brand" data-goto="home">
          <img class="brand-logo" src="/bashline-logo.png" alt="${esc(S.settings.brandName)}">
          <span class="brand-tagline">${esc(S.settings.tagline)}</span>
        </button>
        <div class="masthead-actions">
          <button class="icon-btn" data-toggle="search" aria-label="Search"><i data-lucide="search"></i></button>
          <button class="icon-btn" data-toggle="dark" aria-label="Toggle dark mode"><i data-lucide="${S.dark ? "sun" : "moon"}"></i></button>
        </div>
      </div>
      ${S.searchOpen ? `
        <div class="search-bar-wrap">
          <div class="search-bar">
            <i data-lucide="search"></i>
            <input id="search-input" type="text" value="${esc(S.query)}" placeholder="Search articles, authors, topics…" autocomplete="off">
            ${S.query ? `<button data-clear-search aria-label="Clear"><i data-lucide="x"></i></button>` : ""}
          </div>
        </div>` : ""}
      <nav class="nav-desktop">${NAV_ITEMS.map(i => navButton(i, false)).join("")}</nav>
      ${S.menuOpen ? `<nav class="nav-mobile">${NAV_ITEMS.map(i => navButton(i, true)).join("")}</nav>` : ""}
    </header>`;
}

function renderTicker() {
  const breaking = S.articles.filter(a => tagActive(a, "breaking"));
  if (breaking.length === 0) return "";
  const doubled = breaking.concat(breaking);
  return `
    <div class="ticker-wrap">
      <div class="ticker-row">
        <div class="ticker-label"><i data-lucide="radio"></i> Breaking</div>
        <div class="ticker-scroll">
          <div class="ticker-track">
            ${doubled.map(a => `<button class="ticker-item" data-goto="article" data-params='{"id":"${a.id}"}'>${esc(a.title)}</button>`).join("")}
          </div>
        </div>
      </div>
    </div>`;
}

/* ----------------------------------- Home -------------------------------------- */

function sectionHeader(title, sub, seeAllName, seeAllParams) {
  return `
    <div class="section-header">
      <div>
        <h2>${esc(title)}</h2>
        ${sub ? `<p class="section-sub">${esc(sub)}</p>` : ""}
      </div>
      ${seeAllName ? `<button class="see-all" data-goto="${seeAllName}" data-params='${JSON.stringify(seeAllParams || {})}'>See all <i data-lucide="chevron-right"></i></button>` : ""}
    </div>`;
}

function renderHome() {
  const sorted = S.articles.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  const hero = sorted.find(a => a.featured) || sorted[0];
  if (!hero) return `<div class="wrap">${emptyState("No articles yet. Add one from the admin dashboard.")}</div>`;
  const secondary = sorted.filter(a => a.id !== hero.id).slice(0, 2);
  const latest = sorted.filter(a => a.id !== hero.id).slice(0, 6);
  const trending = S.articles.filter(a => tagActive(a, "trending")).slice(0, 5);
  const world = S.articles.filter(a => a.category === "world").slice(0, 3);
  const politics = S.articles.filter(a => a.category === "politics").slice(0, 3);
  const opinionAnalysis = S.articles.filter(a => a.category === "opinion" || a.category === "analysis").slice(0, 3);
  const beyond = S.articles.filter(a => a.category === "beyond").slice(0, 3);
  const regionSections = [
    { id: "africa", label: "Africa", sub: "Stories from the continent" },
    { id: "americas", label: "Americas", sub: "North and South, coast to coast" },
    { id: "asia", label: "Asia", sub: "Across the region" },
    { id: "europe", label: "Europe", sub: "From capital to capital" },
    { id: "middle-east", label: "Middle East", sub: "On the ground, in context" },
    { id: "oceania", label: "Oceania", sub: "Pacific dispatches" },
  ].map(r => ({ ...r, articles: S.articles.filter(a => a.category === r.id).slice(0, 3) }))
   .filter(r => r.articles.length > 0);

  return `
    <div class="wrap">
      <section class="hero-section">
        <button class="hero-main" data-goto="article" data-params='{"id":"${hero.id}"}'>
          <div class="hero-img"><img src="${esc(hero.image)}" alt=""></div>
          ${tagActive(hero, "breaking") ? `<span class="badge-breaking">Breaking</span>` : ""}
          ${categoryTag(hero.category)}
          <h1>${esc(hero.title)}</h1>
          <p class="hero-dek">${esc(hero.dek)}</p>
          <div class="hero-dateline">${dateline(hero, "md")}</div>
        </button>
        <div class="hero-side">
          <span class="hero-side-label">Also in this edition</span>
          ${secondary.map(a => `
            <button class="hero-side-item" data-goto="article" data-params='{"id":"${a.id}"}'>
              <img src="${esc(a.image)}" alt="">
              <div>${categoryTag(a.category)}<h3>${esc(a.title)}</h3></div>
            </button>`).join("")}
        </div>
      </section>

      <section class="latest-trending">
        <div class="latest-col">
          ${sectionHeader("Latest News", "Freshly filed")}
          <div class="card-grid">${latest.map(a => articleCard(a)).join("")}</div>
        </div>
        <div class="trending-col">
          ${sectionHeader("Trending")}
          <div class="trending-list">
            ${trending.map((a, i) => `
              <button class="trending-item" data-goto="article" data-params='{"id":"${a.id}"}'>
                <span class="trending-num">${String(i + 1).padStart(2, "0")}</span>
                <div><h3>${esc(a.title)}</h3><span class="meta-mono">${a.dateline ? esc(a.dateline) + " &middot; " : ""}${esc(timeAgo(a.date))}</span></div>
              </button>`).join("")}
          </div>
        </div>
      </section>

      <section class="home-section">
        ${sectionHeader("World", "Dispatches from the field", "category", { category: "world" })}
        <div class="card-grid-3">${world.map(a => articleCard(a)).join("")}</div>
      </section>

      <section class="home-section">
        ${sectionHeader("Politics & Geopolitics", "Power, in motion", "category", { category: "politics" })}
        <div class="card-grid-3">${politics.map(a => articleCard(a)).join("")}</div>
      </section>

      <section class="home-section">
        ${sectionHeader("Opinion & Analysis", "Argued, not just reported", "opinion", {})}
        <div class="card-grid-3">${opinionAnalysis.map(a => articleCard(a)).join("")}</div>
      </section>

      ${regionSections.map(r => `
      <section class="home-section">
        ${sectionHeader(r.label, r.sub, "category", { category: r.id })}
        <div class="card-grid-3">${r.articles.map(a => articleCard(a)).join("")}</div>
      </section>`).join("")}
    </div>

    <section class="beyond-section">
      <div class="wrap">
        <div class="beyond-header">
          <div><span class="eyebrow">The Deeper Read</span><h2>Beyond the Headlines</h2></div>
          <button class="see-all" data-goto="category" data-params='{"category":"beyond"}'>See all <i data-lucide="chevron-right"></i></button>
        </div>
        <div class="beyond-grid">
          ${beyond.map(a => `
            <button class="beyond-item" data-goto="article" data-params='{"id":"${a.id}"}'>
              <span class="eyebrow">${esc(categoryLabel(a.category))}</span>
              <h3>${esc(a.title)}</h3>
              <p>${esc(a.dek)}</p>
            </button>`).join("")}
        </div>
      </div>
    </section>`;
}

/* ------------------------------- Category / Opinion ----------------------------- */

function renderCategoryPage(category) {
  const list = S.articles.filter(a => a.category === category).sort((a, b) => new Date(b.date) - new Date(a.date));
  return `
    <div class="wrap page-narrow">
      <div class="page-title-block">
        <span class="eyebrow">Section</span>
        <h1>${esc(categoryLabel(category))}</h1>
      </div>
      ${list.length === 0 ? emptyState("No stories filed in this section yet. Check back soon, or add one from the admin dashboard.")
        : `<div class="row-list">${list.map(a => articleCard(a, "row")).join("")}</div>`}
    </div>`;
}

function renderOpinionPage() {
  const list = S.articles.filter(a => a.type === "opinion").sort((a, b) => new Date(b.date) - new Date(a.date));
  return `
    <div class="wrap page-narrow">
      <div class="page-title-block">
        <span class="eyebrow">Opinion & Analysis</span>
        <h1>Perspective, on the record</h1>
        <p class="page-sub">Personal views and analysis from our editorial desk — clearly labeled, argued in the open, and separate from our straight news reporting.</p>
      </div>
      ${list.length === 0 ? emptyState("No opinion pieces published yet.")
        : `<div class="card-grid-2">${list.map(a => articleCard(a)).join("")}</div>`}
    </div>`;
}

function renderSearchResults() {
  const results = getFiltered();
  return `
    <div class="wrap page-narrow">
      <div class="search-title-row">
        <div>
          <span class="eyebrow">Search</span>
          <h1>${results.length} result${results.length !== 1 ? "s" : ""} for &ldquo;${esc(S.query)}&rdquo;</h1>
        </div>
        <button class="see-all" data-clear-search>Clear</button>
      </div>
      ${results.length === 0 ? emptyState("No stories match that search. Try a different keyword, category, or author name.")
        : `<div class="row-list">${results.map(a => articleCard(a, "row")).join("")}</div>`}
    </div>`;
}

/* --------------------------------- Article page --------------------------------- */

function renderArticlePage(id) {
  const article = S.articles.find(a => a.id === id);
  if (!article) {
    return `
      <div class="wrap page-tight center-text">
        <p class="not-found">This story couldn't be found — it may have been removed.</p>
        <button class="see-all" data-goto="home">Return to homepage</button>
      </div>`;
  }

  const comments = S.comments[article.id] || [];
  const loading = !!S.commentsLoading[article.id];
  const related = S.articles.filter(a => a.id !== article.id && a.category === article.category).slice(0, 3);
  const shareUrl = window.location.href;

  return `
    <article class="wrap page-tight">
      <button class="eyebrow-btn" data-goto="category" data-params='{"category":"${article.category}"}'>${esc(categoryLabel(article.category))}</button>
      ${tagActive(article, "breaking") ? `<span class="badge-breaking inline-badge">Breaking</span>` : ""}
      <h1 class="article-title">${esc(article.title)}</h1>
      <p class="article-dek">${esc(article.dek)}</p>

      <div class="article-meta-row">
        ${dateline(article, "md")}
        <div class="share-row">
          <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer" title="Share on X"><i data-lucide="twitter"></i></a>
          <a class="share-btn" href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer" title="Share on Facebook"><i data-lucide="facebook"></i></a>
          <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener noreferrer" title="Share on LinkedIn"><i data-lucide="linkedin"></i></a>
          <a class="share-btn" href="mailto:?subject=${encodeURIComponent(article.title)}&body=${encodeURIComponent(shareUrl)}" title="Share by email"><i data-lucide="mail"></i></a>
          <button class="share-btn" data-copy-link title="Copy link"><i data-lucide="link-2"></i></button>
        </div>
      </div>

      ${galleryHtml(article.images && article.images.length ? article.images : (article.image ? [article.image] : []))}

      ${article.video ? videoEmbedHtml(article.video) : ""}

      <div class="article-body">
        ${article.body.map((p, i) => renderBodyBlock(p, i === 0)).join("")}
      </div>

      ${related.length > 0 ? `
        <section class="related-section">
          <h2>Related coverage</h2>
          <div class="card-grid-3">${related.map(a => articleCard(a)).join("")}</div>
        </section>` : ""}

      <section class="discussion-section">
        <h2><i data-lucide="message-circle"></i> Discussion ${comments.length > 0 ? `<span class="discussion-count">(${comments.length})</span>` : ""}</h2>
        <div class="comment-list">
          ${loading ? `<p class="page-sub">Loading comments&hellip;</p>` : ""}
          ${!loading && comments.length === 0 ? `<p class="page-sub">Be the first to weigh in on this story.</p>` : ""}
          ${comments.map(c => `
            <div class="comment">
              <div class="comment-head"><span>${esc(c.name)}</span><span class="meta-mono">${esc(timeAgo(c.date))}</span></div>
              <p>${esc(c.text)}</p>
            </div>`).join("")}
        </div>
        <form class="comment-form" data-form="comment" data-article-id="${article.id}">
          <span class="form-label-strong">Leave a comment</span>
          <input name="name" placeholder="Your name" required>
          <textarea name="text" placeholder="Share your thoughts…" rows="3" required></textarea>
          <button type="submit" class="btn-primary">Post comment</button>
        </form>
      </section>
    </article>`;
}

/* ----------------------------------- About / Contact ----------------------------- */

function renderAboutPage() {
  const brandName = esc(S.settings.brandName);
  return `
    <div class="wrap page-tight">
      <span class="eyebrow">About</span>
      <h1>Independent. Unaffiliated. Accountable to readers.</h1>
      <div class="prose">
        <p>${brandName} is an independent media platform delivering news summaries, analysis, and perspective on global events — built for readers who want to understand not just what happened, but why it matters.</p>
        <p>We are not owned by a political party, a government, or a single corporate parent. Our reporting covers breaking news, world affairs, politics and geopolitics, and opinion, with a dedicated "Beyond the Headlines" desk devoted to the context that daily coverage often leaves out.</p>
        <p>We separate our news reporting from our opinion and analysis content, and we label each clearly, so readers always know whether they're reading a report or an argument.</p>
        <p>${brandName} is small by design. We would rather publish fewer stories, reported and reasoned carefully, than chase every headline. If you find an error in our reporting, tell us — we correct our mistakes openly.</p>
      </div>
      <div class="values-grid">
        ${[
          ["Independence", "No party affiliation, no state funding, no single owner with editorial control."],
          ["Transparency", "Opinion is labeled as opinion. Corrections are published, not buried."],
          ["Global vantage", "Datelines from the field, not just the wire — context alongside the headline."],
        ].map(v => `
          <div class="value-item"><i data-lucide="map-pin"></i><h3>${esc(v[0])}</h3><p>${esc(v[1])}</p></div>`).join("")}
      </div>
    </div>`;
}

function renderPrivacyPage() {
  const brandName = esc(S.settings.brandName);
  const email = "bisah348@gmail.com";
  const updated = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  return `
    <div class="wrap page-tight">
      <span class="eyebrow">Privacy Policy</span>
      <h1>How ${brandName} handles your information</h1>
      <p class="page-sub">Last updated: ${esc(updated)}</p>
      <div class="prose">
        <p>${brandName} respects your privacy. This page explains what information we collect when you use this site, why we collect it, and how you can reach us with questions.</p>

        <h3>Information we collect</h3>
        <p>We collect information you choose to give us directly:</p>
        <ul>
          <li><strong>Comments</strong> — the name and comment text you submit under an article.</li>
          <li><strong>Newsletter signup</strong> — the email address you provide to subscribe.</li>
          <li><strong>Contact form</strong> — the name, email address, subject, and message you send us.</li>
        </ul>
        <p>We do not require you to create an account or provide any information just to read the site.</p>

        <h3>How we use it</h3>
        <p>We use this information only to operate the site: to display your comments publicly under the article you posted them on, to send our newsletter to subscribed addresses, and to respond to messages sent through the contact form. We do not sell your information to third parties.</p>

        <h3>Cookies and advertising</h3>
        <p>This site may display advertisements served by Google AdSense. Google and its partners may use cookies to show ads based on your visits to this and other websites. You can learn more about how Google uses this data, and opt out of personalized advertising, at Google's Ads Settings page. If ads are not yet active on this site, this section describes how they will work once they are.</p>

        <h3>Third-party services</h3>
        <p>This site is hosted and delivered using third-party infrastructure providers (for web hosting and for data storage), who may process standard technical information such as IP addresses as part of delivering the site to you. These providers do not have access to use your information for their own purposes.</p>

        <h3>Your choices</h3>
        <p>You can unsubscribe from the newsletter at any time by contacting us. If you'd like a comment you posted removed, or would like to know what information we hold about you, email us and we'll take care of it.</p>

        <h3>Children's privacy</h3>
        <p>This site is not directed at children under 13, and we do not knowingly collect information from children.</p>

        <h3>Changes to this policy</h3>
        <p>We may update this policy from time to time as the site changes. The date at the top of this page reflects the most recent update.</p>

        <h3>Contact us</h3>
        <p>Questions about this policy or your information can be sent to <a href="mailto:${email}">${email}</a>.</p>
      </div>
    </div>`;
}

function renderContactPage() {
  const brandName = esc(S.settings.brandName);
  return `
    <div class="wrap page-medium">
      <span class="eyebrow">Contact</span>
      <h1>Get in touch with ${brandName}</h1>
      <p class="page-sub">Story tips, corrections, and general inquiries all reach our editorial desk.</p>
      <div class="contact-grid">
        <form class="contact-form" data-form="contact">
          <div id="contact-sent" class="sent-banner hidden"><i data-lucide="check"></i> Message sent. We'll be in touch soon.</div>
          <div class="two-col">
            <div class="field"><label>Name</label><input name="name" required></div>
            <div class="field"><label>Email</label><input name="email" type="email" required></div>
          </div>
          <div class="field"><label>Subject</label><input name="subject"></div>
          <div class="field"><label>Message</label><textarea name="message" rows="6" required></textarea></div>
          <button type="submit" class="btn-primary"><i data-lucide="send"></i> Send message</button>
        </form>
        <div class="contact-side">
          <div class="box">
            <h3>Editorial desk</h3>
            <a href="mailto:bisah348@gmail.com"><i data-lucide="mail"></i> bisah348@gmail.com</a>
            <a href="tel:+2348056052173"><i data-lucide="phone"></i> 0805 605 2173</a>
            <a href="tel:+2349074984479"><i data-lucide="phone"></i> 0907 498 4479</a>
            <a href="tel:+2348164882258"><i data-lucide="phone"></i> 0816 488 2258</a>
          </div>
          <div class="box">
            <h3>Follow ${brandName}</h3>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i data-lucide="instagram"></i> Instagram</a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i data-lucide="facebook"></i> Facebook</a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i data-lucide="twitter"></i> X / Twitter</a>
          </div>
        </div>
      </div>
    </div>`;
}

/* --------------------------------- Newsletter / Footer --------------------------- */

function renderNewsletter() {
  const subscribed = localGet("vantage-just-subscribed") === "true";
  return `
    <section class="newsletter">
      <div class="wrap newsletter-row">
        <div class="newsletter-copy">
          <h2>The daily briefing, in your inbox.</h2>
          <p>One email each morning. No noise, no spam.</p>
        </div>
        <div id="newsletter-form-slot">
          ${subscribed ? `<div class="subscribed-banner"><i data-lucide="check"></i> You're subscribed.</div>` : `
          <form class="newsletter-form" data-form="newsletter">
            <input type="email" name="email" required placeholder="you@email.com">
            <button type="submit">Subscribe</button>
          </form>`}
        </div>
      </div>
    </section>`;
}

function renderFooter() {
  const brandName = esc(S.settings.brandName);
  return `
    <footer class="site-footer">
      <div class="wrap footer-grid">
        <div>
          <span class="brand-name">${brandName}</span>
          <p class="footer-desc">Independent news, analysis, and perspective on global events — reported from the field, explained in context.</p>
          <div class="footer-social">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"><i data-lucide="instagram"></i></a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer"><i data-lucide="facebook"></i></a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"><i data-lucide="twitter"></i></a>
          </div>
        </div>
        <div>
          <h4>Sections</h4>
          <ul>${CATEGORIES.map(c => `<li><button data-goto="category" data-params='{"category":"${c.id}"}'>${esc(c.label)}</button></li>`).join("")}</ul>
        </div>
        <div>
          <h4>About</h4>
          <ul>
            <li><button data-goto="about">About us</button></li>
            <li><button data-goto="contact">Contact</button></li>
            <li><button data-goto="opinion">Opinion</button></li>
            <li><button data-goto="privacy">Privacy Policy</button></li>
          </ul>
        </div>
      </div>
      <div class="footer-bottom wrap">
        <p>&copy; ${new Date().getFullYear()} ${brandName}. All rights reserved. Sample edition — content shown is illustrative.</p>
      </div>
    </footer>`;
}

/* --------------------------------- Admin: gate ----------------------------------- */

function renderAdminGate() {
  return `
    <div class="admin-gate">
      <div class="admin-gate-head">
        <i data-lucide="lock"></i>
        <h1>Editor access</h1>
        <p class="page-sub">Enter the newsroom passcode to manage articles.</p>
      </div>
      <form data-form="admin-login">
        <input type="password" name="passcode" autofocus placeholder="Passcode">
        <div id="admin-login-error" class="error-text hidden">Incorrect passcode. Try again.</div>
        <button type="submit" class="btn-primary">Enter dashboard</button>
      </form>
    </div>`;
}

/* ------------------------------- Admin: dashboard --------------------------------- */

const ADMIN_TABS = [
  { id: "articles", label: "Articles", icon: "newspaper" },
  { id: "messages", label: "Messages", icon: "mail" },
  { id: "subscribers", label: "Subscribers", icon: "users" },
  { id: "settings", label: "Settings", icon: "settings" },
];

function renderAdminDashboard() {
  return `
    <div class="wrap admin-wrap">
      <div class="admin-head">
        <div class="admin-head-title"><i data-lucide="layout-dashboard"></i><h1>Newsroom Dashboard</h1></div>
        <button class="logout-btn" data-action="admin-logout"><i data-lucide="log-out"></i> Log out</button>
      </div>
      <div class="admin-tabs">
        ${ADMIN_TABS.map(t => `<button class="admin-tab ${S.admin.tab === t.id ? "active" : ""}" data-action="admin-tab" data-tab="${t.id}"><i data-lucide="${t.icon}"></i> ${t.label}</button>`).join("")}
      </div>
      ${renderAdminTabBody()}
    </div>`;
}

function renderAdminTabBody() {
  const a = S.admin;
  if (a.tab === "articles" && !a.editing) return renderAdminArticleList();
  if (a.tab === "articles" && a.editing) return renderArticleEditor(a.editing === "new" ? null : a.editing);
  if (a.tab === "messages") return renderAdminMessages();
  if (a.tab === "subscribers") return renderAdminSubscribers();
  if (a.tab === "settings") return renderAdminSettings();
  return "";
}

function renderAdminArticleList() {
  const list = S.articles.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
  return `
    <div>
      <div class="admin-list-head">
        <p class="page-sub">${S.articles.length} article${S.articles.length !== 1 ? "s" : ""} published</p>
        <button class="btn-primary" data-action="new-article"><i data-lucide="plus"></i> New article</button>
      </div>
      <div class="admin-article-list">
        ${list.map(a => `
          <div class="admin-article-row">
            <img src="${esc(a.image)}" alt="">
            <div class="admin-article-info">
              <div class="badges">
                ${a.breaking ? (tagActive(a, "breaking") ? `<span class="mini-badge breaking">Breaking</span>` : `<span class="mini-badge expired">Breaking (expired)</span>`) : ""}
                ${a.trending ? (tagActive(a, "trending") ? `<span class="mini-badge trending">Trending</span>` : `<span class="mini-badge expired">Trending (expired)</span>`) : ""}
                ${a.featured ? `<span class="mini-badge featured">Featured</span>` : ""}
                <span class="admin-article-title">${esc(a.title)}</span>
              </div>
              <span class="meta-mono">${esc(categoryLabel(a.category))} &middot; ${esc(a.author)} &middot; ${esc(fmtDate(a.date))}</span>
            </div>
            <button class="icon-btn" data-action="edit-article" data-id="${a.id}" title="Edit"><i data-lucide="pencil"></i></button>
            <button class="icon-btn danger" data-action="delete-article" data-id="${a.id}" title="Delete"><i data-lucide="trash-2"></i></button>
          </div>`).join("")}
      </div>
    </div>`;
}

function renderEditorImagesListInner() {
  const list = S.admin.editingImages || [];
  if (list.length === 0) return `<p class="page-sub">No photos added yet.</p>`;
  return `<div class="editor-images-grid">${list.map((url, i) => `
    <div class="editor-image-item">
      <img src="${esc(url)}" alt="">
      ${i === 0 ? `<span class="mini-badge featured cover-badge">Cover</span>` : ""}
      <button type="button" class="icon-btn danger remove-image-btn" data-action="remove-editor-image" data-index="${i}" title="Remove"><i data-lucide="x"></i></button>
    </div>`).join("")}</div>`;
}

function refreshEditorImagesList() {
  const el = document.getElementById("editor-images-list");
  if (el) el.innerHTML = renderEditorImagesListInner();
  if (window.lucide) window.lucide.createIcons();
}

function inlineHtmlToMd(el) {
  let s = "";
  el.childNodes.forEach(function (n) {
    if (n.nodeType === 3) {
      s += n.textContent;
    } else if (n.nodeType === 1) {
      const t = n.tagName.toLowerCase();
      const inner = inlineHtmlToMd(n);
      if (t === "strong" || t === "b") s += "**" + inner + "**";
      else if (t === "em" || t === "i") s += "*" + inner + "*";
      else if (t === "br") s += "\n";
      else s += inner;
    }
  });
  return s;
}

function docxHtmlToBlocks(html) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const blocks = [];
  doc.body.childNodes.forEach(function (node) {
    if (node.nodeType !== 1) return;
    const tag = node.tagName.toLowerCase();
    if (/^h[1-6]$/.test(tag)) {
      const text = inlineHtmlToMd(node).trim();
      if (text) blocks.push("## " + text);
    } else if (tag === "p") {
      const text = inlineHtmlToMd(node).trim();
      if (text) blocks.push(text);
    } else if (tag === "ul" || tag === "ol") {
      const items = Array.prototype.slice.call(node.children).map(function (li) {
        return "- " + inlineHtmlToMd(li).trim();
      }).filter(function (l) { return l !== "- "; });
      if (items.length) blocks.push(items.join("\n"));
    }
  });
  return blocks;
}

function renderArticleEditor(article) {
  const f = article || {
    title: "", dek: "", category: "world", author: "", dateline: "",
    video: "", breaking: false, trending: false, featured: false,
    breakingUntil: null, trendingUntil: null,
    type: "news", body: []
  };
  const bodyText = (f.body || []).join("\n\n");
  return `
    <form class="article-editor" data-form="article-editor" data-editing-id="${article ? article.id : ""}">
      <button type="button" class="back-btn" data-action="cancel-edit"><i data-lucide="chevron-left"></i> Back to articles</button>

      <div class="field"><label>Headline</label><input name="title" value="${esc(f.title)}" required></div>

      <div class="field"><label>Dek / summary</label><textarea name="dek" rows="2">${esc(f.dek)}</textarea></div>

      <div class="two-col">
        <div class="field">
          <label>Category</label>
          <select name="category">${CATEGORIES.map(c => `<option value="${c.id}" ${f.category === c.id ? "selected" : ""}>${esc(c.label)}</option>`).join("")}</select>
        </div>
        <div class="field">
          <label>Type</label>
          <select name="type">
            <option value="news" ${f.type === "news" ? "selected" : ""}>News</option>
            <option value="opinion" ${f.type === "opinion" ? "selected" : ""}>Opinion</option>
            <option value="analysis" ${f.type === "analysis" ? "selected" : ""}>Analysis</option>
          </select>
        </div>
      </div>

      <div class="two-col">
        <div class="field"><label>Author</label><input name="author" value="${esc(f.author)}" required></div>
        <div class="field">
          <label>Dateline city (optional)</label>
          <select name="dateline">
            <option value="" ${!f.dateline ? "selected" : ""}>— None —</option>
            ${CAPITALS.slice().sort((a, b) => a.country.localeCompare(b.country)).map(c => `<option value="${esc(c.city)}" ${f.dateline === c.city ? "selected" : ""}>${esc(c.city)}, ${esc(c.country)}</option>`).join("")}
          </select>
        </div>
      </div>

      <div class="field">
        <label><i data-lucide="images"></i> Photos</label>
        <div class="upload-row">
          <label for="editor-image-file" class="btn-secondary upload-btn"><i data-lucide="upload"></i> Add photos from phone</label>
          <input type="file" id="editor-image-file" accept="image/*" multiple class="hidden">
          <span id="editor-upload-status" class="meta-mono"></span>
        </div>
        <div class="url-add-row">
          <input type="text" id="editor-image-url-add" placeholder="…or paste an image URL">
          <button type="button" class="btn-secondary" data-action="add-image-url">Add</button>
        </div>
        <div id="editor-images-list" class="editor-images-list">${renderEditorImagesListInner()}</div>
        <p class="field-hint">The first photo is the cover shown on cards and the homepage. Add more than one for a swipeable gallery on the article itself.</p>
      </div>

      <div class="field">
        <label><i data-lucide="video"></i> Video (optional)</label>
        <div class="upload-row">
          <label for="editor-video-file" class="btn-secondary upload-btn"><i data-lucide="upload"></i> Upload video from phone</label>
          <input type="file" id="editor-video-file" accept="video/*" class="hidden">
          <span id="editor-video-upload-status" class="meta-mono"></span>
        </div>
        <input name="video" value="${esc(f.video || "")}" id="editor-video-input" placeholder="…or paste a video link (YouTube, Vimeo, or direct .mp4)">
        <p class="field-hint">Videos can take a while to upload on mobile data — a YouTube/Vimeo link is usually faster than uploading raw footage.</p>
      </div>

      <div class="field">
        <label>Article body (separate paragraphs with a blank line)</label>
        <div class="upload-row">
          <label for="editor-body-file" class="btn-secondary upload-btn"><i data-lucide="file-up"></i> Load from .txt or .docx</label>
          <input type="file" id="editor-body-file" accept=".txt,.docx" class="hidden">
          <span id="editor-body-file-status" class="meta-mono"></span>
        </div>
        <p class="field-hint">Formatting: <strong>**bold**</strong>, a line starting with <strong>## </strong> for a subheading, or <strong>- </strong> for a bullet list. Uploading a .docx carries this formatting over automatically.</p>
        <textarea name="bodyText" rows="10" required class="body-textarea">${esc(bodyText)}</textarea>
      </div>

      <div class="checkbox-row">
        <label><input type="checkbox" name="breaking" ${f.breaking ? "checked" : ""}> Breaking news</label>
        <label><input type="checkbox" name="trending" ${f.trending ? "checked" : ""}> Trending</label>
        <label><input type="checkbox" name="featured" ${f.featured ? "checked" : ""}> Featured (homepage hero)</label>
      </div>

      <div class="two-col expiry-row">
        <div class="field">
          <label>Auto-remove "Breaking" tag after</label>
          <select name="breakingExpiry">
            ${f.breakingUntil ? `<option value="keep" selected>Keep current setting${tagActive(f, "breaking") ? " (active)" : " (already expired)"}</option>` : ""}
            <option value="never" ${!f.breakingUntil ? "selected" : ""}>Never (stays until unticked)</option>
            <option value="1h">1 hour</option>
            <option value="3h">3 hours</option>
            <option value="6h">6 hours</option>
            <option value="12h">12 hours</option>
            <option value="24h">24 hours</option>
            <option value="3d">3 days</option>
            <option value="7d">7 days</option>
          </select>
        </div>
        <div class="field">
          <label>Auto-remove "Trending" tag after</label>
          <select name="trendingExpiry">
            ${f.trendingUntil ? `<option value="keep" selected>Keep current setting${tagActive(f, "trending") ? " (active)" : " (already expired)"}</option>` : ""}
            <option value="never" ${!f.trendingUntil ? "selected" : ""}>Never (stays until unticked)</option>
            <option value="1h">1 hour</option>
            <option value="3h">3 hours</option>
            <option value="6h">6 hours</option>
            <option value="12h">12 hours</option>
            <option value="24h">24 hours</option>
            <option value="3d">3 days</option>
            <option value="7d">7 days</option>
          </select>
        </div>
      </div>
      <p class="field-hint">This only hides the colored tag once time's up — the article itself stays published.</p>

      <div class="editor-actions">
        <button type="submit" class="btn-primary">${article ? "Save changes" : "Publish article"}</button>
        <button type="button" class="btn-secondary" data-action="cancel-edit">Cancel</button>
      </div>
    </form>`;
}

function renderAdminMessages() {
  const messages = S.admin.messages.slice();
  return `
    <div class="messages-list">
      ${!S.admin._messagesLoaded ? `<p class="page-sub">Loading&hellip;</p>` : ""}
      ${S.admin._messagesLoaded && messages.length === 0 ? emptyState("No messages yet.") : ""}
      ${messages.map(m => `
        <div class="message-item">
          <div class="message-head"><span><strong>${esc(m.name)}</strong> &middot; <span class="accent">${esc(m.email)}</span></span><span class="meta-mono">${esc(fmtDate(m.date))}</span></div>
          ${m.subject ? `<p class="message-subject">${esc(m.subject)}</p>` : ""}
          <p class="page-sub">${esc(m.message)}</p>
        </div>`).join("")}
    </div>`;
}

function renderAdminSubscribers() {
  const subs = S.admin.subscribers.slice();
  return `
    <div>
      <p class="page-sub">${S.admin._subsLoaded ? subs.length : "…"} subscriber${subs.length !== 1 ? "s" : ""}</p>
      <div class="subscriber-list">
        ${S.admin._subsLoaded && subs.length === 0 ? emptyState("No newsletter subscribers yet.") : ""}
        ${subs.map(s => `<div class="subscriber-item">${esc(s)}</div>`).join("")}
      </div>
    </div>`;
}

function renderAdminSettings() {
  return `
    <form class="settings-form" data-form="admin-settings">
      <div class="field"><label>Site / brand name</label><input name="brandName" value="${esc(S.settings.brandName)}" required></div>
      <div class="field"><label>Tagline</label><input name="tagline" value="${esc(S.settings.tagline)}"></div>
      <hr class="settings-divider">
      <p class="field-hint">To change the editor passcode, enter your current one plus a new one. Leave "New passcode" blank to keep it as-is.</p>
      <div class="field"><label>Current passcode</label><input type="password" name="currentPasscode" placeholder="Only needed to change the passcode"></div>
      <div class="field"><label>New passcode</label><input type="password" name="newPasscode" placeholder="Leave blank to keep current"></div>
      <div id="passcode-error" class="error-text hidden">That current passcode isn't correct — nothing was changed.</div>
      <div id="settings-error" class="error-text hidden">Couldn't save — check your connection and try again.</div>
      <button type="submit" class="btn-primary">Save settings</button>
      <div id="settings-saved" class="saved-msg hidden"><i data-lucide="check"></i> Saved</div>
    </form>`;
}

/* --------------------------------- Unconfigured notice ---------------------------- */

function renderLoadError() {
  return `
    <div class="admin-gate" style="max-width:480px;">
      <div class="admin-gate-head">
        <i data-lucide="wifi-off"></i>
        <h1>Couldn't load a required script</h1>
        <p class="page-sub">${esc(LOAD_ERROR || "A required script failed to load.")} This is almost always a connection issue, not a problem with the site's setup — try reloading once you have a stronger connection.</p>
      </div>
    </div>`;
}

function renderUnconfigured() {
  return `
    <div class="admin-gate" style="max-width:480px;">
      <div class="admin-gate-head">
        <i data-lucide="database"></i>
        <h1>Connect your database</h1>
        <p class="page-sub">This site needs a Supabase project to store articles. Open <code>config.js</code> and paste in your Project URL and anon key from Supabase &rarr; Project Settings &rarr; API. Run <code>schema.sql</code> in the Supabase SQL editor first.</p>
      </div>
    </div>`;
}

/* ---------------------------------- Root render ---------------------------------- */

function renderMain() {
  if (S.query.trim()) return renderSearchResults();
  const p = S.page;
  if (p.name === "home") return renderHome();
  if (p.name === "article") return renderArticlePage(p.id);
  if (p.name === "opinion") return renderOpinionPage();
  if (p.name === "category") return renderCategoryPage(p.category);
  if (p.name === "about") return renderAboutPage();
  if (p.name === "privacy") return renderPrivacyPage();
  if (p.name === "contact") return renderContactPage();
  if (p.name === "admin") {
    if (!S.adminAuthed) return renderAdminGate();
    return renderAdminDashboard();
  }
  return "";
}

function render() {
  const app = document.getElementById("app");

  if (S.ready === "unconfigured") {
    app.innerHTML = LOAD_ERROR ? renderLoadError() : renderUnconfigured();
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (!S.ready) {
    app.innerHTML = `
      <div class="loading-screen">
        <div class="loading-inner">
          <div class="loading-brand">${esc(BRAND)}</div>
          <div class="loading-sub">Loading edition&hellip;</div>
        </div>
      </div>`;
    return;
  }

  document.documentElement.classList.toggle("dark", S.dark);

  app.innerHTML = `
    ${renderMasthead()}
    ${renderTicker()}
    <main>${renderMain()}</main>
    ${renderNewsletter()}
    ${renderFooter()}
  `;
  app.setAttribute("data-vantage-loaded", "1");

  if (window.lucide) window.lucide.createIcons();
  initGallery();

  if (S.searchOpen) {
    const input = document.getElementById("search-input");
    if (input) {
      input.focus();
      const len = input.value.length;
      input.setSelectionRange(len, len);
    }
  }
}

/* --------------------------------- Event handling --------------------------------- */

document.addEventListener("click", async function (e) {
  const gotoBtn = e.target.closest("[data-goto]");
  if (gotoBtn) {
    const name = gotoBtn.getAttribute("data-goto");
    const paramsAttr = gotoBtn.getAttribute("data-params");
    let params = {};
    if (paramsAttr) { try { params = JSON.parse(paramsAttr); } catch (e) {} }
    goto(name, params);
    return;
  }

  const toggleBtn = e.target.closest("[data-toggle]");
  if (toggleBtn) {
    const kind = toggleBtn.getAttribute("data-toggle");
    if (kind === "menu") { S.menuOpen = !S.menuOpen; S.searchOpen = false; }
    if (kind === "search") { S.searchOpen = !S.searchOpen; S.menuOpen = false; }
    if (kind === "dark") {
      S.dark = !S.dark;
      localSet("vantage-dark-mode", S.dark ? "true" : "false");
    }
    render();
    return;
  }

  if (e.target.closest("[data-clear-search]")) {
    S.query = "";
    render();
    return;
  }

  if (e.target.closest("[data-copy-link]")) {
    const btn = e.target.closest("[data-copy-link]");
    navigator.clipboard.writeText(window.location.href).then(() => {
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (window.lucide) window.lucide.createIcons();
      setTimeout(() => { btn.innerHTML = '<i data-lucide="link-2"></i>'; if (window.lucide) window.lucide.createIcons(); }, 1800);
    }).catch(() => {});
    return;
  }

  const action = e.target.closest("[data-action]");
  if (action) {
    const act = action.getAttribute("data-action");
    if (act === "admin-logout") { S.adminAuthed = false; S.admin.passcode = null; render(); return; }
    if (act === "nav-back") { window.history.back(); return; }

    if (act === "admin-tab") {
      S.admin.tab = action.getAttribute("data-tab");
      S.admin.editing = null;
      render();
      if (S.admin.tab === "messages" && !S.admin._messagesLoaded) {
        const messages = await fetchMessages();
        S.admin.messages = messages;
        S.admin._messagesLoaded = true;
        render();
      }
      if (S.admin.tab === "subscribers" && !S.admin._subsLoaded) {
        const subs = await fetchSubscribers();
        S.admin.subscribers = subs;
        S.admin._subsLoaded = true;
        render();
      }
      return;
    }

    if (act === "new-article") { S.admin.editing = "new"; S.admin.editingImages = []; render(); return; }
    if (act === "edit-article") {
      const id = action.getAttribute("data-id");
      const found = S.articles.find(a => a.id === id);
      S.admin.editing = found || "new";
      S.admin.editingImages = found
        ? (found.images && found.images.length ? found.images.slice() : (found.image ? [found.image] : []))
        : [];
      render();
      return;
    }
    if (act === "cancel-edit") { S.admin.editing = null; S.admin.editingImages = []; render(); return; }
    if (act === "delete-article") {
      const id = action.getAttribute("data-id");
      if (confirm("Delete this article? This can't be undone.")) {
        await deleteArticleRow(id);
        S.articles = S.articles.filter(a => a.id !== id);
        render();
      }
      return;
    }
    if (act === "add-image-url") {
      const input = document.getElementById("editor-image-url-add");
      const url = input ? input.value.trim() : "";
      if (url) {
        S.admin.editingImages = (S.admin.editingImages || []).concat([url]);
        if (input) input.value = "";
        refreshEditorImagesList();
      }
      return;
    }
    if (act === "remove-editor-image") {
      const idx = parseInt(action.getAttribute("data-index"), 10);
      S.admin.editingImages = (S.admin.editingImages || []).filter((_, i) => i !== idx);
      refreshEditorImagesList();
      return;
    }
  }
});

document.addEventListener("input", function (e) {
  if (e.target.id === "search-input") {
    S.query = e.target.value;
    render();
  }
});

document.addEventListener("change", async function (e) {
  if (e.target.id === "editor-image-file") {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    const status = document.getElementById("editor-upload-status");
    const failures = [];
    for (let i = 0; i < files.length; i++) {
      if (status) status.textContent = `Uploading ${i + 1} of ${files.length}…`;
      const { url, error } = await uploadImageFile(files[i]);
      if (url) {
        S.admin.editingImages = (S.admin.editingImages || []).concat([url]);
        refreshEditorImagesList();
      } else {
        failures.push((error && error.message) || "unknown error");
      }
    }
    if (status) {
      status.textContent = failures.length
        ? `Upload failed: ${failures[0]}`
        : "Uploaded ✓";
    }
    e.target.value = "";
  }

  if (e.target.id === "editor-video-file") {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const status = document.getElementById("editor-video-upload-status");
    const urlInput = document.getElementById("editor-video-input");
    if (status) status.textContent = "Uploading video… this can take a moment.";
    const { url, error } = await uploadVideoFile(file);
    if (url) {
      if (urlInput) urlInput.value = url;
      if (status) status.textContent = "Uploaded ✓";
    } else {
      if (status) status.textContent = `Upload failed: ${(error && error.message) || "try again, or paste a video link below instead."}`;
    }
  }

  if (e.target.id === "editor-body-file") {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const status = document.getElementById("editor-body-file-status");
    const textarea = document.querySelector('textarea[name="bodyText"]');
    if (status) status.textContent = "Reading file…";
    try {
      if (/\.docx$/i.test(file.name)) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await window.mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
        const blocks = docxHtmlToBlocks(result.value);
        if (textarea) textarea.value = blocks.join("\n\n");
        if (status) status.textContent = "Loaded ✓ — formatting carried over";
      } else {
        const text = await file.text();
        if (textarea) textarea.value = text;
        if (status) status.textContent = "Loaded ✓";
      }
    } catch (err) {
      console.error("body file load", err);
      if (status) status.textContent = "Couldn't read that file — try pasting the text instead.";
    }
    e.target.value = "";
  }
});

document.addEventListener("submit", async function (e) {
  const form = e.target;
  const kind = form.getAttribute("data-form");
  if (!kind) return;
  e.preventDefault();
  const fd = new FormData(form);

  if (kind === "comment") {
    const articleId = form.getAttribute("data-article-id");
    const name = (fd.get("name") || "").toString().trim();
    const text = (fd.get("text") || "").toString().trim();
    if (!name || !text) return;
    await insertComment(articleId, name, text);
    const list = await fetchComments(articleId);
    S.comments[articleId] = list;
    render();
    return;
  }

  if (kind === "contact") {
    const name = (fd.get("name") || "").toString();
    const email = (fd.get("email") || "").toString();
    const message = (fd.get("message") || "").toString();
    if (!name || !email || !message) return;
    await insertMessage({ name: name, email: email, subject: (fd.get("subject") || "").toString(), message: message });
    S.admin._messagesLoaded = false;
    const banner = document.getElementById("contact-sent");
    if (banner) banner.classList.remove("hidden");
    form.reset();
    return;
  }

  if (kind === "newsletter") {
    const email = (fd.get("email") || "").toString().trim();
    if (!email) return;
    await insertSubscriber(email);
    S.admin._subsLoaded = false;
    localSet("vantage-just-subscribed", "true");
    const slot = document.getElementById("newsletter-form-slot");
    if (slot) slot.innerHTML = `<div class="subscribed-banner"><i data-lucide="check"></i> You're subscribed.</div>`;
    if (window.lucide) window.lucide.createIcons();
    return;
  }

  if (kind === "admin-login") {
    const passcode = (fd.get("passcode") || "").toString();
    const ok = await checkAdminPasscode(passcode);
    if (ok) {
      S.adminAuthed = true;
      S.admin.passcode = passcode;
      render();
    } else {
      const err = document.getElementById("admin-login-error");
      if (err) err.classList.remove("hidden");
    }
    return;
  }

  if (kind === "article-editor") {
    const title = (fd.get("title") || "").toString().trim();
    const bodyText = (fd.get("bodyText") || "").toString().trim();
    if (!title || !bodyText) return;
    const body = bodyText.split("\n\n").map(p => p.trim()).filter(Boolean);
    const editingId = form.getAttribute("data-editing-id");
    const images = (S.admin.editingImages || []).filter(Boolean);
    const coverImage = images[0] || img("article" + uid());
    const existingArticle = editingId ? S.articles.find(x => x.id === editingId) : null;

    function resolveExpiry(fieldName, existingUntil) {
      const choice = (fd.get(fieldName) || "never").toString();
      if (choice === "keep") return existingUntil || null;
      if (choice === "never") return null;
      const hoursMap = { "1h": 1, "3h": 3, "6h": 6, "12h": 12, "24h": 24, "3d": 72, "7d": 168 };
      const hours = hoursMap[choice];
      if (!hours) return null;
      return new Date(Date.now() + hours * 3600 * 1000).toISOString();
    }

    const data = {
      title: title,
      dek: (fd.get("dek") || "").toString(),
      category: (fd.get("category") || "world").toString(),
      type: (fd.get("type") || "news").toString(),
      author: (fd.get("author") || "").toString(),
      dateline: (fd.get("dateline") || "").toString(),
      image: coverImage,
      images: images,
      video: (fd.get("video") || "").toString().trim(),
      breaking: fd.get("breaking") === "on",
      trending: fd.get("trending") === "on",
      featured: fd.get("featured") === "on",
      breakingUntil: resolveExpiry("breakingExpiry", existingArticle ? existingArticle.breakingUntil : null),
      trendingUntil: resolveExpiry("trendingExpiry", existingArticle ? existingArticle.trendingUntil : null),
      body: body,
    };
    if (!editingId) {
      const newArticle = Object.assign({ id: uid(), date: new Date().toISOString() }, data);
      await insertArticle(newArticle);
      S.articles = [newArticle].concat(S.articles);
    } else {
      await updateArticleRow(editingId, data);
      S.articles = S.articles.map(x => x.id === editingId ? Object.assign({}, x, data) : x);
    }
    S.admin.editing = null;
    S.admin.editingImages = [];
    render();
    return;
  }

  if (kind === "admin-settings") {
    const next = {
      brandName: (fd.get("brandName") || "").toString(),
      tagline: (fd.get("tagline") || "").toString(),
    };
    const currentPasscode = (fd.get("currentPasscode") || "").toString();
    const newPasscode = (fd.get("newPasscode") || "").toString();
    const errEl = document.getElementById("passcode-error");
    if (errEl) errEl.classList.add("hidden");

    if (newPasscode) {
      const changed = await changeAdminPasscode(currentPasscode, newPasscode);
      if (!changed) {
        if (errEl) errEl.classList.remove("hidden");
        return;
      }
      S.admin.passcode = newPasscode;
    }

    const settingsSaved = await updateSettingsRow(next);
    const saved = document.getElementById("settings-saved");
    const settingsErr = document.getElementById("settings-error");
    if (settingsSaved) {
      S.settings = next;
      if (saved) saved.classList.remove("hidden");
      if (settingsErr) settingsErr.classList.add("hidden");
      setTimeout(() => saved.classList.add("hidden"), 2000);
    } else {
      if (settingsErr) settingsErr.classList.remove("hidden");
      if (saved) saved.classList.add("hidden");
    }
    return;
  }
});

/* refresh world clocks periodically without a full re-render disruption */
setInterval(() => {
  const clocksEl = document.querySelector(".clocks");
  if (clocksEl && S.ready === true) clocksEl.innerHTML = renderClocks();
}, 30000);

init();
