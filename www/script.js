
const firebaseConfig = {
  apiKey: "AIzaSyCgWDZwmi30Rb4VmPCV3hL1ZGIKciKTwEg",
  authDomain: "xultra-a06af.firebaseapp.com",
  projectId: "xultra-a06af",
  storageBucket: "xultra-a06af.firebasestorage.app",
  messagingSenderId: "1098033128259",
  appId: "1:1098033128259:web:07e13268d9a864701505f6"
};
const IMGBB_KEY = "187599520be6b8250c05de33cee4aed8";
const ADMIN_EMAIL = "lordfamily1@proton.me";

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// ===== iOS-style push banners (replace browser alert) =====
const _nativeAlert = typeof window.alert === "function" ? window.alert.bind(window) : null;
let _toastQueue = [];
let _toastShowing = 0;
const TOAST_MAX = 4;

function xNotify(message, opts) {
  opts = opts || {};
  const text = String(message == null ? "" : message).trim();
  if (!text) return;
  const type = opts.type || guessToastType(text);
  const title = opts.title || toastTitleFor(type, text);
  const body = opts.body != null ? opts.body : splitToastBody(text, title);
  const duration = opts.duration != null ? opts.duration : (type === "err" ? 5500 : 4200);
  const onClick = opts.onClick || null;
  const sound = opts.sound !== false && (type === "info" || opts.forceSound);

  const stack = document.getElementById("iosToastStack") || ensureToastStack();
  while (stack.children.length >= TOAST_MAX) {
    const old = stack.firstElementChild;
    if (old) old.remove();
  }

  const el = document.createElement("div");
  el.className = "ios-toast type-" + type;
  el.innerHTML =
    `<div class="ios-icon">${toastIcon(type)}</div>` +
    `<div class="ios-body">` +
      `<div class="ios-app">XULTRA</div>` +
      `<div class="ios-title"></div>` +
      (body ? `<div class="ios-msg"></div>` : "") +
    `</div>` +
    `<div class="ios-time">maintenant</div>`;
  el.querySelector(".ios-title").textContent = title;
  const msgEl = el.querySelector(".ios-msg");
  if (msgEl) msgEl.textContent = body;

  const dismiss = () => {
    if (el._gone) return;
    el._gone = true;
    el.classList.add("out");
    setTimeout(() => el.remove(), 280);
  };
  el.addEventListener("click", () => {
    if (typeof onClick === "function") try { onClick(); } catch (e) {}
    dismiss();
  });
  stack.appendChild(el);
  if (sound) {
    try { playNotifSound && playNotifSound(); } catch (e) {}
  }
  setTimeout(dismiss, duration);
  return el;
}

function ensureToastStack() {
  let s = document.getElementById("iosToastStack");
  if (!s) {
    s = document.createElement("div");
    s.id = "iosToastStack";
    s.className = "ios-toast-stack";
    s.setAttribute("aria-live", "polite");
    document.body.appendChild(s);
  }
  return s;
}

function toastIcon(type) {
  if (type === "ok") return "✓";
  if (type === "err") return "!";
  if (type === "warn") return "⚠";
  return "●";
}

function guessToastType(text) {
  const t = text.toLowerCase();
  if (/erreur|error|impossible|refusé|refuse|bloqué|echec|échec|fail|interdit|permission refus/.test(t)) return "err";
  if (/attention|warn|plein|mute|banni|suspendu|requis|obligatoire/.test(t)) return "warn";
  if (/enregistr|ajout|publié|ok|succès|success|copié|envoyé|créé|upload|ami ajout|demande/.test(t)) return "ok";
  return "info";
}

function toastTitleFor(type, full) {
  const lines = String(full).split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0].length <= 48) return lines[0];
  if (type === "ok") return "Succès";
  if (type === "err") return "Erreur";
  if (type === "warn") return "Attention";
  if (full.length <= 56) return full;
  return "XULTRA";
}

function splitToastBody(full, title) {
  const lines = String(full).split(/\n+/).map(s => s.trim()).filter(Boolean);
  if (lines.length > 1 && lines[0] === title) return lines.slice(1).join("\n");
  if (title === full) return "";
  if (title === "Succès" || title === "Erreur" || title === "Attention" || title === "XULTRA") return full;
  return lines.length > 1 ? lines.slice(1).join("\n") : "";
}

// All site alerts → iOS banners (no browser dialogs)
window.alert = function (msg) {
  try {
    xNotify(msg);
  } catch (e) {
    if (_nativeAlert) _nativeAlert(String(msg));
  }
};

// ===== USERNAME TAGS Firebase (pseudo-xxxx + registry) =====
function genUsernameTag() {
  // Discord-style 4-digit discriminator (0001–9999)
  return String(Math.floor(Math.random() * 9999) + 1).padStart(4, "0");
}

function splitUsernameParts(username) {
  const u = String(username || "").toLowerCase();
  const m = u.match(/^([a-z0-9_]+)-([a-z0-9]{4,8})$/);
  if (m) return { base: m[1], tag: m[2], full: u };
  return { base: u.replace(/[^a-z0-9_]/g, ""), tag: null, full: u };
}

/** Affichage public : @shaman#4821 */
function formatHandle(uOrName) {
  if (!uOrName) return "@user";
  if (typeof uOrName === "object") {
    const parts = splitUsernameParts(uOrName.username || "");
    let base = (uOrName.baseUsername || parts.base || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
    let tag = String(uOrName.tag || parts.tag || "").replace(/[^a-z0-9]/gi, "").slice(0, 8);
    if (!base && uOrName.username) base = parts.base || String(uOrName.username).toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (!base && uOrName.displayName) base = String(uOrName.displayName).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20);
    if (!base) base = "user";
    if (tag) return "@" + base + "#" + String(tag).toUpperCase();
    // pas de faux #???? — tag absent = pas encore migré
    return "@" + base;
  }
  const s = String(uOrName).trim();
  if (s.includes("#")) {
    const clean = s.replace(/^@/, "");
    const [b, t] = clean.split("#");
    if (t && t !== "????") return "@" + (b || "user") + "#" + String(t).toUpperCase();
    return "@" + (b || "user");
  }
  const parts = splitUsernameParts(s.replace(/^@/, ""));
  if (parts.tag) return "@" + parts.base + "#" + String(parts.tag).toUpperCase();
  return "@" + (parts.base || s.replace(/^@/, "") || "user");
}

function formatHandleHTML(uOrName) {
  const h = formatHandle(uOrName);
  const m = h.match(/^@([^#]+)#(.+)$/);
  if (!m) return esc(h);
  return `<span class="h-at">@</span><span class="h-base">${esc(m[1])}</span><span class="h-hash">#${esc(m[2])}</span>`;
}

function handleForChat(m) {
  if (!m) return "@user#0000";
  if (m.tag || m.baseUsername) return formatHandle(m);
  if (m.handle && String(m.handle).includes("#")) return m.handle.startsWith("@") ? m.handle : "@" + m.handle;
  return formatHandle({ username: m.username, baseUsername: m.baseUsername, tag: m.tag });
}

function refreshHandlePreview() {
  const base = (document.getElementById("myUsername")?.value || "pseudo").trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "pseudo";
  let tag = (document.getElementById("myTag")?.value || "0000").trim().replace(/[^0-9a-zA-Z]/g, "").slice(0, 4) || "0000";
  const el = document.getElementById("handlePreviewLive");
  if (el) el.innerHTML = formatHandleHTML({ baseUsername: base, tag });
  try { refreshDsPreview(); } catch (e) {}
}

async function randomizeMyTag() {
  const base = (document.getElementById("myUsername")?.value || "user").trim().toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
  let tag = genUsernameTag();
  for (let i = 0; i < 12; i++) {
    const full = base + "-" + tag.toLowerCase();
    if (!(await isUsernameTaken(full, currentUser && currentUser.uid))) break;
    tag = genUsernameTag();
  }
  const input = document.getElementById("myTag");
  if (input) input.value = tag;
  refreshHandlePreview();
  xNotify("Nouveau tag : #" + tag.toUpperCase(), { type: "ok", title: "Tag" });
}

async function isUsernameTaken(full, exceptUid) {
  full = String(full || "").toLowerCase();
  try {
    const reg = await db.collection("usernames").doc(full).get();
    if (reg.exists) {
      const uid = reg.data().uid;
      if (exceptUid && uid === exceptUid) return false;
      return true;
    }
  } catch (e) {}
  try {
    const snap = await db.collection("users").where("username", "==", full).limit(1).get();
    if (snap.empty) return false;
    if (exceptUid && snap.docs[0].id === exceptUid) return false;
    return true;
  } catch (e) {
    return false;
  }
}

async function allocateUsername(baseRaw, exceptUid) {
  let base = String(baseRaw || "user").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (base.length < 2) base = "user";
  if (base.length > 20) base = base.slice(0, 20);
  const parts = splitUsernameParts(base);
  if (parts.tag) base = parts.base;
  for (let i = 0; i < 24; i++) {
    const tag = genUsernameTag();
    const full = base + "-" + tag;
    if (!(await isUsernameTaken(full, exceptUid))) {
      return { base, tag, username: full };
    }
  }
  // last resort: base + timestamp slice
  const tag = String(Date.now()).slice(-4);
  return { base, tag, username: base + "-" + tag };
}

/**
 * Inscription complète : Auth + pseudo + # auto + registry
 * @returns {{ cred, alloc }}
 */
async function registerWithAutoTag(email, password, basePseudo) {
  const base = String(basePseudo || "user").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (base.length < 2) throw new Error("Pseudo invalide (min 2, a-z 0-9 _)");
  if (!email || password.length < 6) throw new Error("Email / mot de passe invalide");

  const alloc = await allocateUsername(base, null);
  if (!alloc.tag || !alloc.username.includes("-")) {
    throw new Error("Impossible de générer un # unique");
  }

  const cred = await auth.createUserWithEmailAndPassword(email, password);
  const uid = cred.user.uid;

  // registry (retry)
  for (let i = 0; i < 3; i++) {
    try {
      await claimUsername(alloc.username, uid, null);
      break;
    } catch (e) {
      if (i === 2) console.warn("claimUsername", e);
      await new Promise(r => setTimeout(r, 200));
    }
  }

  const profile = {
    username: alloc.username,
    baseUsername: alloc.base,
    tag: String(alloc.tag),
    displayName: alloc.base,
    email: email,
    bio: "",
    avatar: "",
    bg: "",
    particles: "none",
    socials: [],
    gallery: [],
    playlist: [],
    require2FA: false,
    lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    friends: [],
    friendRequests: [],
    friendOutgoing: []
  };
  await db.collection("users").doc(uid).set(profile);

  // autofix sécurité : relire + ensure
  try {
    await ensureUserUsernameTag(uid);
  } catch (e) {}
  try {
    const check = await db.collection("users").doc(uid).get();
    const d = check.data() || {};
    if (!d.tag) {
      await db.collection("users").doc(uid).set({
        username: alloc.username,
        baseUsername: alloc.base,
        tag: alloc.tag
      }, { merge: true });
    }
  } catch (e) {}

  try { await cred.user.sendEmailVerification(); } catch (e) {}
  try { await ensureEarlyBadge(uid); } catch (e) {}

  return { cred, alloc };
}

async function claimUsername(full, uid, prevFull) {
  full = String(full || "").toLowerCase();
  if (!/^[a-z0-9_]+-[a-z0-9]{4,8}$/.test(full)) {
    throw new Error("Format pseudo invalide (pseudo-xxxx)");
  }
  if (prevFull && prevFull !== full) {
    try {
      const old = await db.collection("usernames").doc(String(prevFull).toLowerCase()).get();
      if (old.exists && old.data().uid === uid) {
        await db.collection("usernames").doc(String(prevFull).toLowerCase()).delete();
      }
    } catch (e) {}
  }
  const ref = db.collection("usernames").doc(full);
  const existing = await ref.get();
  if (existing.exists && existing.data().uid !== uid) {
    throw new Error("Pseudo déjà pris");
  }
  await ref.set({
    uid,
    username: full,
    base: splitUsernameParts(full).base,
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
}

async function ensureUserUsernameTag(uid) {
  if (!uid) return null;
  try {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return null;
    const d = doc.data() || {};
    let cur = (d.username || d.baseUsername || d.displayName || "user").toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!cur) cur = "user";
    const parts = splitUsernameParts(cur);
    // already has valid tag field or username-tag form
    if (d.tag && parts.tag && d.tag === parts.tag) {
      try { await claimUsername(parts.full || (parts.base + "-" + d.tag), uid, null); } catch (e) {}
      return { base: parts.base, tag: d.tag, username: parts.full || (parts.base + "-" + d.tag) };
    }
    if (parts.tag) {
      const patch = {
        username: parts.full,
        baseUsername: parts.base,
        tag: parts.tag
      };
      if (!d.displayName) patch.displayName = parts.base;
      await ref.set(patch, { merge: true });
      try { await claimUsername(parts.full, uid, null); } catch (e) {}
      return { base: parts.base, tag: parts.tag, username: parts.full };
    }
    // no tag yet → allocate
    const base = parts.base || cur.replace(/-/g, "").slice(0, 20) || "user";
    const alloc = await allocateUsername(base, uid);
    try { await claimUsername(alloc.username, uid, cur.includes("-") ? cur : null); } catch (e) {
      console.warn("claim", e);
    }
    await ref.set({
      username: alloc.username,
      baseUsername: alloc.base,
      tag: alloc.tag,
      displayName: d.displayName || alloc.base
    }, { merge: true });
    return alloc;
  } catch (e) {
    console.warn("ensureUserUsernameTag", e);
    return null;
  }
}

/** Admin : attribue un # à tous les comptes qui n'en ont pas */
async function adminFixAllTags() {
  if (!isAdmin) return;
  const snap = await db.collection("users").limit(200).get();
  let n = 0;
  for (const d of snap.docs) {
    const u = d.data();
    const parts = splitUsernameParts(u.username || "");
    if (u.tag && parts.tag) continue;
    if (parts.tag && u.tag) continue;
    if (parts.tag) {
      await d.ref.set({ tag: parts.tag, baseUsername: parts.base, username: parts.full }, { merge: true });
      n++;
      continue;
    }
    const base = (u.baseUsername || parts.base || u.username || "user").toLowerCase().replace(/[^a-z0-9_]/g, "") || "user";
    const alloc = await allocateUsername(base, d.id);
    try { await claimUsername(alloc.username, d.id, u.username || null); } catch (e) {}
    await d.ref.set({
      username: alloc.username,
      baseUsername: alloc.base,
      tag: alloc.tag
    }, { merge: true });
    n++;
  }
  loadAdminUsers();
  loadMembers();
  alert(n ? n + " tag(s) corrigé(s)" : "Tous les comptes ont déjà un #");
}


let currentUser = null;
let isRegisterMode = false;
let isAdmin = false;
let playlist = [];
let currentTrack = 0;
let isPlaying = false;
let viewingUser = null;

function esc(t) {
  const d = document.createElement("div");
  d.textContent = t || "";
  return d.innerHTML;
}

// ===== ROUTING =====
function getUserParam() {
  const p = new URLSearchParams(location.search);
  return (p.get("u") || p.get("user") || "").toLowerCase().trim();
}

function hideAllMainViews() {
  ["hubView", "homeView", "profileView", "voiceHubView", "hubPageAnime", "hubPagePaste", "hubPageGallery", "adminPage"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function showHome() {
  history.replaceState(null, "", location.pathname);
  hideAllMainViews();
  const hub = document.getElementById("hubView");
  if (hub) hub.style.display = "flex";
  const pageBg = document.getElementById("pageBg");
  if (pageBg) {
    pageBg.style.backgroundImage = "";
    pageBg.style.backgroundColor = "";
    pageBg.classList.remove("bg-custom", "bg-image");
  }
  const vbg = document.getElementById("pvBgVideo");
  if (vbg) {
    try { vbg.pause(); } catch (e) {}
    vbg.removeAttribute("src");
    vbg.style.display = "none";
  }
  const lofi = document.getElementById("lofiBg");
  const lofiBlur = document.querySelector(".lofi-blur");
  if (lofi) lofi.style.display = "block";
  if (lofiBlur) lofiBlur.style.display = "block";
  setParticles("none");
  viewingUser = null;
  try { syncHubProfileCard(); } catch (e) {}
}

function openSocialHub() {
  hideAllMainViews();
  const home = document.getElementById("homeView");
  if (home) home.style.display = "block";
  const lofi = document.getElementById("lofiBg");
  const lofiBlur = document.querySelector(".lofi-blur");
  if (lofi) lofi.style.display = "block";
  if (lofiBlur) lofiBlur.style.display = "block";
  try { loadFeed(); loadPublicChat(); loadMembers(); } catch (e) {}
}

function openGameHub() {
  openSlitherGame();
}

function closeHubPage() {
  showHome();
}

async function openAnimeHub() {
  hideAllMainViews();
  const page = document.getElementById("hubPageAnime");
  if (page) page.style.display = "flex";
  const body = document.getElementById("animeHubBody");
  if (!body) return;
  body.innerHTML = '<div class="loading">Chargement…</div>';
  try {
    const snap = await db.collection("users").limit(80).get();
    let html = "";
    snap.forEach(doc => {
      const u = doc.data();
      const list = u.animeList || [];
      if (!list.length) return;
      html += `<div class="hub-card">
        <div class="hub-card-head" onclick="showUserProfile('${esc(u.username || "")}')">
          <strong>${esc(u.displayName || u.username || "?")}</strong>
          <span class="handle-inline">${esc(formatHandle(u))}</span>
          <span class="badge">${list.length} animés</span>
        </div>
        <div class="hub-anime-row">${list.slice(0, 8).map(a =>
          `<div class="hub-anime-item"><img src="${esc(a.image || "")}" alt="" loading="lazy"><span>${esc(a.title || "")}</span></div>`
        ).join("")}</div>
      </div>`;
    });
    body.innerHTML = html || '<p class="hint">Aucun animé partagé pour le moment.</p>';
  } catch (e) {
    body.innerHTML = '<p class="hint">Erreur de chargement</p>';
  }
}

async function openPasteHub() {
  hideAllMainViews();
  const page = document.getElementById("hubPagePaste");
  if (page) page.style.display = "flex";
  const body = document.getElementById("pasteHubBody");
  if (!body) return;
  body.innerHTML = '<div class="loading">Chargement…</div>';
  try {
    let snap;
    try {
      snap = await db.collection("notes").orderBy("createdAt", "desc").limit(60).get();
    } catch (e) {
      snap = await db.collection("notes").limit(60).get();
    }
    let html = "";
    snap.forEach(doc => {
      const n = doc.data();
      if (n.exposure === "private") return;
      if (n.password) return; // hide passworded from public hub list detail
      const title = n.title || "Sans titre";
      const author = n.authorName || n.username || "Anonyme";
      html += `<div class="hub-card" onclick="openNoteById && openNoteById('${doc.id}')">
        <div class="hub-card-head"><strong>${esc(title)}</strong>
          <span class="badge">${esc(n.syntax || "text")}</span>
        </div>
        <p class="hint">${esc(author)} · ${(n.body || "").slice(0, 120)}</p>
      </div>`;
    });
    body.innerHTML = html || '<p class="hint">Aucune note publique.</p>';
  } catch (e) {
    body.innerHTML = '<p class="hint">Erreur de chargement</p>';
  }
}

async function openGalleryHub() {
  hideAllMainViews();
  const page = document.getElementById("hubPageGallery");
  if (page) page.style.display = "flex";
  const body = document.getElementById("galleryHubBody");
  if (!body) return;
  body.innerHTML = '<div class="loading">Chargement…</div>';
  try {
    const snap = await db.collection("users").limit(100).get();
    let html = '<p class="hint" style="margin-bottom:12px">Clique sur une personne pour voir sa galerie de profil.</p><div class="hub-gal-users">';
    snap.forEach(doc => {
      const u = doc.data();
      const gal = u.gallery || [];
      if (!gal.length) return;
      const av = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || "U")}&background=7c3aed&color=fff&size=64`;
      html += `<button type="button" class="hub-gal-user" onclick="showUserProfile('${esc(u.username || "")}');setTimeout(()=>{try{showPvTab('gallery',document.querySelectorAll('.pv-tab')[3])}catch(e){}},400)">
        <img src="${esc(av)}" alt="">
        <div><strong>${esc(u.displayName || u.username || "?")}</strong>
        <div class="hint">${gal.length} photo(s)</div></div>
      </button>`;
    });
    html += "</div>";
    body.innerHTML = html.includes("hub-gal-user") ? html : '<p class="hint">Aucune galerie pour le moment.</p>';
  } catch (e) {
    body.innerHTML = '<p class="hint">Erreur de chargement</p>';
  }
}

function openVoiceHub() {
  hideAllMainViews();
  const vh = document.getElementById("voiceHubView");
  if (vh) vh.style.display = "flex";
  const lofi = document.getElementById("lofiBg");
  const lofiBlur = document.querySelector(".lofi-blur");
  if (lofi) lofi.style.display = "none";
  if (lofiBlur) lofiBlur.style.display = "none";
  setParticles("none");
  ensureRolesCache();
  loadVoiceChannelsUI();
  updateVoiceHubUserPill();
  const hint = document.getElementById("vhGlobalHint");
  if (hint && _voiceGlobalCfg) hint.textContent = _voiceGlobalCfg.hint || "";
  if (VOICE_ROOM) {
    listenVoiceRoomChat(VOICE_ROOM);
    const lab = document.getElementById("vhChatRoomLabel");
    if (lab) lab.textContent = document.getElementById("voiceActiveName")?.textContent || VOICE_ROOM;
  }
}

function closeVoiceHub() {
  const vh = document.getElementById("voiceHubView");
  if (vh) vh.style.display = "none";
  // stay in voice if connected — only leave UI
  showHome();
}

function updateVoiceHubUserPill() {
  const el = document.getElementById("vhUserPill");
  if (!el) return;
  if (!currentUser) {
    el.innerHTML = '<button type="button" class="btn btn-outline" onclick="showHome();openModal(false)">Connexion</button>';
    return;
  }
  const name = (window.userProfile && (window.userProfile.displayName || window.userProfile.username)) || "User";
  const roleHtml = roleMiniHTML(window.userProfile || {});
  const handle = formatHandle(window.userProfile || {});
  el.innerHTML = `<span class="vh-uname">${esc(name)}</span><span class="vh-handle">${esc(handle)}</span>${roleHtml}`;
}

// ===== USER SEARCH =====
let _userSearchTimer = null;
let _userSearchCache = null;

function closeUserSearch() {
  const box = document.getElementById("userSearchResults");
  if (box) box.style.display = "none";
}

function onUserSearchInput(val) {
  clearTimeout(_userSearchTimer);
  const q = String(val || "").trim();
  if (q.length < 1) {
    closeUserSearch();
    return;
  }
  _userSearchTimer = setTimeout(() => runUserSearch(q), 220);
}

async function ensureUserSearchCache() {
  if (_userSearchCache && Date.now() - (_userSearchCache.ts || 0) < 45000) return _userSearchCache.list;
  try {
    let snap;
    try {
      snap = await db.collection("users").orderBy("createdAt", "desc").limit(150).get();
    } catch (e) {
      snap = await db.collection("users").limit(150).get();
    }
    _userSearchCache = {
      ts: Date.now(),
      list: snap.docs.map(d => ({ id: d.id, ...d.data() }))
    };
    return _userSearchCache.list;
  } catch (e) {
    return [];
  }
}

async function runUserSearch(raw) {
  const box = document.getElementById("userSearchResults");
  if (!box) return;
  let q = String(raw || "").toLowerCase().trim().replace(/^@/, "");
  let tagQ = null;
  if (q.includes("#")) {
    const parts = q.split("#");
    q = parts[0].replace(/[^a-z0-9_]/g, "");
    tagQ = (parts[1] || "").replace(/[^a-z0-9]/g, "");
  }
  box.style.display = "block";
  box.innerHTML = '<div class="hint" style="padding:10px">Recherche…</div>';
  const list = await ensureUserSearchCache();
  const hits = list.filter(u => {
    const un = String(u.username || "").toLowerCase();
    const base = String(u.baseUsername || splitUsernameParts(un).base || "").toLowerCase();
    const tag = String(splitUsernameParts(un).tag || "").toLowerCase();
    const dn = String(u.displayName || "").toLowerCase();
    if (tagQ) return base.includes(q) && tag.indexOf(tagQ) === 0;
    return base.includes(q) || un.includes(q) || dn.includes(q);
  }).slice(0, 12);
  if (!hits.length) {
    box.innerHTML = '<div class="hint" style="padding:12px">Aucun utilisateur trouvé</div>';
    return;
  }
  box.innerHTML = hits.map(u => {
    const av = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || "U")}&background=7c3aed&color=fff&size=64`;
    const handle = formatHandle(u);
    const uname = u.username || u.id;
    return `<button type="button" class="user-search-item" onclick="pickUserSearch('${esc(uname)}')">
      <img src="${esc(av)}" alt="">
      <div class="usi-text">
        <div class="usi-name">${esc(u.displayName || splitUsernameParts(uname).base || "User")}</div>
        <div class="usi-handle">${esc(handle)}</div>
      </div>
      ${roleMiniHTML(u)}
    </button>`;
  }).join("");
}

function pickUserSearch(username) {
  closeUserSearch();
  const input = document.getElementById("userSearchInput");
  if (input) input.value = "";
  showUserProfile(username);
}

document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".header-search-wrap");
  if (wrap && !wrap.contains(e.target)) closeUserSearch();
});

async function showUserProfile(username) {
  hideAllMainViews();
  document.getElementById("profileView").style.display = "block";
  const vh = document.getElementById("voiceHubView");
  if (vh) vh.style.display = "none";
  closeUserSearch();
  await ensureRolesCache();
  const lofi = document.getElementById("lofiBg");
  const lofiBlur = document.querySelector(".lofi-blur");
  if (lofi) lofi.style.display = "none";
  if (lofiBlur) lofiBlur.style.display = "none";
  let name = String(username || "").toLowerCase().trim().replace(/^@/, "");
  // Support @shaman#4821 → shaman-4821
  if (name.includes("#")) {
    const [b, t] = name.split("#");
    if (b && t) name = b.replace(/[^a-z0-9_]/g, "") + "-" + t.replace(/[^a-z0-9]/g, "");
  }
  history.replaceState(null, "", "?u=" + encodeURIComponent(name));

  document.getElementById("pvName").textContent = "Chargement…";
  document.getElementById("pvHandle").innerHTML = formatHandleHTML(name);
  const bioWrap = document.getElementById("pvBioWrap");
  if (bioWrap) bioWrap.style.display = "none";
  document.getElementById("pvSocials").innerHTML = "";
  const empty = document.getElementById("pvEmpty");
  if (empty) empty.textContent = "";

  try {
    let found = null;
    try {
      const snap = await db.collection("users").where("username", "==", name).limit(1).get();
      if (!snap.empty) found = { id: snap.docs[0].id, ...snap.docs[0].data() };
    } catch (e) { console.log(e); }
    // registry lookup
    if (!found) {
      try {
        const reg = await db.collection("usernames").doc(name).get();
        if (reg.exists && reg.data().uid) {
          const ud = await db.collection("users").doc(reg.data().uid).get();
          if (ud.exists) found = { id: ud.id, ...ud.data() };
        }
      } catch (e) {}
    }
    if (!found) {
      const all = await db.collection("users").limit(120).get();
      all.forEach(d => {
        const u = d.data();
        const un = (u.username || "").toLowerCase();
        if (un === name || (u.baseUsername || "").toLowerCase() === name) found = { id: d.id, ...u };
      });
    }
    // if viewing own profile while logged in and still not found, use own doc
    if (!found && currentUser) {
      const mine = await db.collection("users").doc(currentUser.uid).get();
      if (mine.exists) {
        const u = mine.data();
        if ((u.username || "").toLowerCase() === name || !u.username) {
          found = { id: mine.id, ...u };
          if (!u.username) found.username = name;
        }
      }
    }
    if (!found) {
      document.getElementById("pvName").textContent = "Introuvable";
      if (empty) empty.textContent = "Aucun profil @" + name;
      return;
    }
    renderProfileView(found);
  } catch (e) {
    console.error(e);
    document.getElementById("pvName").textContent = "Erreur";
    if (empty) empty.textContent = "Impossible de charger le profil";
  }
}

function renderProfileView(u) {
  viewingUser = u;
  const _dn = u.displayName || u.username || "User";
  const _pn = document.getElementById("pvName");
  if (_pn) {
    _pn.innerHTML = esc(_dn) + '<button type="button" class="inline-edit-btn" id="nameEditBtn" style="display:none" onclick="inlineEditName()">✎</button>';
  }
  const pvHandle = document.getElementById("pvHandle");
  if (pvHandle) {
    pvHandle.innerHTML = formatHandleHTML(u);
    pvHandle.title = "ID unique : " + (u.username || formatHandle(u));
  }
  const badgeBox = document.getElementById("pvBadges");
  if (badgeBox) badgeBox.innerHTML = renderBadgesHTML(computeBadges(u));
  // detailed role card
  let roleBox = document.getElementById("pvRoleDetail");
  if (!roleBox) {
    const handle = document.getElementById("pvHandle");
    if (handle && handle.parentNode) {
      roleBox = document.createElement("div");
      roleBox.id = "pvRoleDetail";
      roleBox.className = "pv-role-detail";
      handle.parentNode.insertBefore(roleBox, handle.nextSibling);
    }
  }
  if (roleBox) roleBox.innerHTML = roleDetailHTML(u);
  const av = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || "U")}&background=7c3aed&color=fff&size=200&bold=true`;
  document.getElementById("pvAvatar").src = av;

  let last = 0;
  try {
    if (u.lastSeen) {
      last = u.lastSeen.toDate ? u.lastSeen.toDate().getTime() : (typeof u.lastSeen === "number" ? u.lastSeen : 0);
    }
  } catch (e) {}
  const online = last && (Date.now() - last < 5 * 60 * 1000);
  const dot = document.getElementById("pvDot");
  if (dot) dot.style.display = online ? "block" : "none";
  // Dernière connexion — date + heure
  const lsEl = document.getElementById("pvLastSeen");
  if (lsEl) {
    if (last) {
      const d = new Date(last);
      const dateStr = d.toLocaleString("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
      if (online) {
        lsEl.innerHTML = `<span class="ls-online">● En ligne</span> · vu ${esc(dateStr)}`;
        lsEl.className = "pv-last-seen is-online";
      } else {
        const diff = Date.now() - last;
        let ago = "";
        if (diff < 3600000) ago = "il y a " + Math.max(1, Math.floor(diff / 60000)) + " min";
        else if (diff < 86400000) ago = "il y a " + Math.floor(diff / 3600000) + " h";
        else if (diff < 604800000) ago = "il y a " + Math.floor(diff / 86400000) + " j";
        else ago = "";
        lsEl.innerHTML = `Dernière connexion : <strong>${esc(dateStr)}</strong>${ago ? " · " + ago : ""}`;
        lsEl.className = "pv-last-seen";
      }
      lsEl.style.display = "block";
    } else {
      lsEl.textContent = "Dernière connexion : inconnue";
      lsEl.style.display = "block";
      lsEl.className = "pv-last-seen";
    }
  }
  updateFriendButton();
  const msgBtn = document.getElementById("btnMsgProfile");
  const actions = document.getElementById("pvActions");
  if (actions) {
    actions.style.display = (currentUser && viewingUser && viewingUser.id !== currentUser.uid) ? "flex" : "none";
  }

  const _bio = document.getElementById("pvBio");
  const _bioWrap = document.getElementById("pvBioWrap");
  if (_bio) _bio.textContent = u.bio || "";
  const _beb = document.getElementById("bioEditBox");
  if (_beb) _beb.style.display = "none";
  const _neb = document.getElementById("nameEditBox");
  if (_neb) _neb.style.display = "none";
  placeProfileBio(u);

  const socials = u.socials || [];
  const _socEl = document.getElementById("pvSocials");
  if (_socEl) {
    _socEl.innerHTML = renderSocialLinksHTML(socials, isOwnProfile());
    _socEl.style.display = "flex";
  }
  // personal playlist
  const pl = u.playlist || [];
  const box = document.getElementById("pvPlaylist");
  if (box) {
    if (!pl.length) box.innerHTML = '<p class="hint">Aucune musique sur ce profil</p>';
    else box.innerHTML = pl.map((t,i) => `<div class="pv-track" onclick="playUserTrack(${i})">
      <div><div class="pi-title">${esc(t.title||'?')}</div><div class="pi-artist">${esc(t.artist||'')}</div></div>
      <span>▶</span></div>`).join('');
    window._userPlaylist = pl;
  }
  const gbox = document.getElementById("pvGallery");
  if (gbox) {
    const gal = u.gallery || [];
    if (!gal.length) gbox.innerHTML = '<p class="hint">Galerie vide</p>';
    else {
      window._pvGal = gal;
      gbox.innerHTML = '<div class="gallery-grid">' + gal.map((img, i) =>
        `<div class="gallery-item" onclick="openLightboxIdx(${i})"><img src="${esc(img.url)}" alt="" loading="lazy"></div>`
      ).join('') + '</div>';
    }
  }
  // anime
  const abox = document.getElementById("pvAnime");
  if (abox) {
    const list = u.animeList || [];
    if (!list.length) abox.innerHTML = '<p class="hint">Aucun anime</p>';
    else abox.innerHTML = list.map(a =>
      `<div class="anime-row">
        ${a.image?`<img class="an-cover" src="${esc(a.image)}" alt="" loading="lazy">`:""}
        <div style="flex:1;min-width:0">
          <div class="an-title">${esc(a.title)}</div>
          ${a.synopsis?`<div class="hint" style="margin:2px 0;font-size:.68rem">${esc(a.synopsis.slice(0,120))}${(a.synopsis.length>120?"…":"")}</div>`:""}
        </div>
        <span class="an-status ${esc(a.status||"")}">${esc({watching:"En cours",completed:"Terminé",plan:"Planifié",dropped:"Drop"}[a.status]||a.status||"")}</span>
        ${a.score!=null?`<span class="an-score">${a.score}/10</span>`:""}
      </div>`
    ).join("");
  }
  // spotify
  const sbox = document.getElementById("pvSpotify");
  if (sbox) sbox.innerHTML = u.spotify ? spotifyEmbed(u.spotify) : "";

  // put socials in links tab (always visible)
  const linksPanel = document.getElementById("pvTab-links");
  const socialsEl = document.getElementById("pvSocials");
  if (linksPanel && socialsEl) {
    linksPanel.insertBefore(socialsEl, linksPanel.firstChild);
    socialsEl.style.display = "flex";
  }
  renderProfileBlocks(u.blocks || []);

  setParticles(sanitizeParticleType(u.particles));
  applyProfileDesign(u);
  loadProfileNotes(u);
  try { renderLinkedAccountsPanel(u); } catch (e) {}
  try { refreshLinkedAccountsUI(u.linkedAccounts || {}); } catch (e) {}
  try { renderProfileStream(u); } catch (e) {}
  // gallery with reactions wrappers
  if (u.gallery && u.gallery.length && u.id) {
    const gbox = document.getElementById("pvGallery");
    if (gbox) {
      window._pvGal = u.gallery;
      gbox.innerHTML = '<div class="gallery-grid">' + u.gallery.map((img, i) =>
        `<div class="gallery-item" onclick="openLightboxIdx(${i})">
          <img src="${esc(img.url)}" alt="" loading="lazy">
        </div>`
      ).join("") + '</div><div id="galDetail"></div>';
    }
  }
  setOwnProfileUI(isOwnProfile());
  if (isOwnProfile()) {
    const neb = document.getElementById("nameEditBtn");
    if (neb) neb.style.display = "inline-flex";
    const beb = document.getElementById("bioEditBtn");
    if (beb) beb.style.display = "inline-flex";
  }
  showPvTab("links", document.querySelector(".pv-tab"));
  // own profile: show delete on gallery items
  if (isOwnProfile()) {
    const gbox = document.getElementById("pvGallery");
    if (gbox && (u.gallery||[]).length) {
      window._pvGal = u.gallery;
      gbox.innerHTML = '<div class="gallery-grid">' + u.gallery.map((img, i) =>
        `<div class="gallery-item" onclick="openLightboxIdx(${i})">
          <img src="${esc(img.url)}" alt="" loading="lazy">
          <button type="button" class="gal-del" onclick="event.stopPropagation();inlineDelGal(${i})">✕</button>
        </div>`
      ).join("") + "</div>";
    }
    const socialsEl = document.getElementById("pvSocials");
    if (socialsEl && (u.socials||[]).length) {
      // re-apply with delete buttons - already rendered, patch
      socialsEl.querySelectorAll(".link").forEach((a, i) => {
        if (!a.querySelector(".link-del")) {
          const btn = document.createElement("button");
          btn.type = "button";
          btn.className = "link-del";
          btn.textContent = "✕";
          btn.onclick = (e) => { e.preventDefault(); e.stopPropagation(); inlineDelLink(i); };
          a.appendChild(btn);
        }
      });
    }
  }
}

function playUserTrack(i) {
  if (!window._userPlaylist || !window._userPlaylist.length) return;
  playlist = window._userPlaylist.map((t, idx) => ({ id: 'u'+idx, ...t, likes: t.likes||[] }));
  loadTrack(i);
  if (!isPlaying) togglePlay();
  showPlayer();
}

function openLightbox(url) {
  if (!url) return;
  document.getElementById("lightboxImg").src = url;
  document.getElementById("lightbox").classList.add("open");
}
function openLightboxIdx(i) {
  const gal = window._pvGal || [];
  if (gal[i] && gal[i].url) {
    openLightbox(gal[i].url);
    // inject reactions under lightbox if possible
    let panel = document.getElementById("lightboxReact");
    if (!panel) {
      const lb = document.getElementById("lightbox");
      if (lb) {
        panel = document.createElement("div");
        panel.id = "lightboxReact";
        panel.style.cssText = "position:relative;z-index:10001;padding:12px;max-width:480px;margin:0 auto;width:100%";
        lb.appendChild(panel);
      }
    }
    if (panel && viewingUser) {
      panel.innerHTML = `<div id="galReact-${i}"></div>`;
      loadGalReactions(viewingUser.id, i);
      panel.onclick = (e) => e.stopPropagation();
    }
  }
}
function closeLightbox() {
  document.getElementById("lightbox").classList.remove("open");
}

async function loadAdminUsers() {
  const box = document.getElementById("adminUsersList");
  if (!box) return;
  try {
    let snap;
    try { snap = await db.collection("users").orderBy("createdAt","desc").limit(150).get(); }
    catch(e) {
      try { snap = await db.collection("users").orderBy("lastSeen","desc").limit(150).get(); }
      catch(e2) { snap = await db.collection("users").limit(150).get(); }
    }
    if (snap.empty) { box.innerHTML = '<p class="hint">Aucun user</p>'; return; }
    const rows = snap.docs.map(d => {
      const u = d.data();
      const id = d.id;
      const flags = [];
      if (u.banned) flags.push("BAN");
      if (u.muted) flags.push("MUTE");
      if (u.banUntil && u.banUntil.toDate && u.banUntil.toDate() > new Date()) flags.push("TEMP");
      if (u.isMod) flags.push("MOD");
      const badge = flags.length ? flags.map(f => `<span class="ban-badge">${f}</span>`).join("") : "";
      const handle = formatHandle(u);
      const missingTag = !u.tag && !splitUsernameParts(u.username || "").tag;
      return `<div class="user-admin-card">
        <div class="ua-name">${esc(handle)} — ${esc(u.displayName||'')} ${badge}${missingTag?' <span class="ban-badge">NO TAG</span>':''}</div>
        <div class="ua-meta">ID: ${esc(id.slice(0,8))}… · IP: ${esc(u.lastIp||'—')}<br>Loc: ${esc(u.lastLocation||'—')}<br>Email: ${esc(u.email||'—')}</div>
        <div class="user-admin-actions">
          <button class="btn-danger" onclick="adminBan('${id}',true)">Ban</button>
          <button class="btn btn-outline" onclick="adminTempBan('${id}')">Temp 24h</button>
          <button class="btn btn-outline" onclick="adminMute('${id}',true)">Mute</button>
          <button class="btn btn-outline" onclick="adminMute('${id}',false)">Unmute</button>
          <button class="btn btn-outline" onclick="adminBan('${id}',false)">Unban</button>
          <button class="btn btn-outline" onclick="adminSetMod('${id}',${!u.isMod})">${u.isMod?'Unmod':'Mod'}</button>
          <button class="btn btn-outline" onclick="adminFixUserTag('${id}')">Fix #</button>
          <button class="btn-danger" onclick="adminDeleteUser('${id}')">Suppr</button>
        </div>
      </div>`;
    });
    box.innerHTML =
      `<div style="margin-bottom:10px;display:flex;gap:8px;flex-wrap:wrap">
        <button type="button" class="btn-primary" style="width:auto;margin:0;padding:8px 14px" onclick="adminFixAllTags()">🎲 Fixer tous les # manquants</button>
        <button type="button" class="btn btn-outline" onclick="loadAdminUsers()">Rafraîchir</button>
        <span class="hint" style="margin:0;align-self:center">${snap.size} utilisateur(s)</span>
      </div>` + rows.join("");
  } catch(e) { box.innerHTML = '<p class="hint">Erreur: ' + esc(e.message||'') + '</p>'; console.error(e); }
}

async function adminFixUserTag(uid) {
  if (!isAdmin || !uid) return;
  const r = await ensureUserUsernameTag(uid);
  // ensure as admin: force write if ensure ran as non-owner path fails
  if (!r) {
    const ref = db.collection("users").doc(uid);
    const doc = await ref.get();
    if (!doc.exists) return alert("User introuvable");
    const d = doc.data();
    const base = (d.baseUsername || splitUsernameParts(d.username||"").base || "user").toLowerCase().replace(/[^a-z0-9_]/g,"") || "user";
    const alloc = await allocateUsername(base, uid);
    await ref.set({ username: alloc.username, baseUsername: alloc.base, tag: alloc.tag }, { merge: true });
    try { await claimUsername(alloc.username, uid, d.username); } catch (e) {}
    alert("Tag: " + formatHandle(alloc));
  } else {
    alert("Tag: " + formatHandle(r));
  }
  loadAdminUsers();
  loadMembers();
}

async function adminBan(uid, ban) {
  if (!isAdmin) return;
  await db.collection("users").doc(uid).set({ banned: ban, banUntil: null }, { merge: true });
  loadAdminUsers();
  alert(ban ? "Banni" : "Unban OK");
}
async function adminTempBan(uid) {
  if (!isAdmin) return;
  const until = new Date(Date.now() + 24*60*60*1000);
  await db.collection("users").doc(uid).set({
    banUntil: firebase.firestore.Timestamp.fromDate(until),
    banned: false
  }, { merge: true });
  loadAdminUsers();
  alert("Temp ban 24h");
}
async function adminMute(uid, mute) {
  if (!isAdmin) return;
  await db.collection("users").doc(uid).set({ muted: mute }, { merge: true });
  loadAdminUsers();
  alert(mute ? "Mute" : "Unmute");
}
async function adminSetMod(uid, makeMod) {
  if (!isAdmin) return;
  await db.collection("users").doc(uid).set({ isMod: !!makeMod }, { merge: true });
  loadAdminUsers();
  alert(makeMod ? "Modérateur" : "Plus modo");
}
async function adminDeleteUser(uid) {
  if (!isAdmin || !confirm("Supprimer ce profil Firestore ? (le compte Auth restera)")) return;
  await db.collection("users").doc(uid).delete();
  loadAdminUsers();
  loadMembers();
  alert("Profil supprimé");
}

// personal playlist in my profile form
async function addMyTrack() {
  if (!currentUser) return;
  const title = document.getElementById("myTrackTitle").value.trim();
  const artist = document.getElementById("myTrackArtist").value.trim();
  const url = document.getElementById("myTrackUrl").value.trim();
  if (!url) return alert("Lien requis");
  if (!window._myPlaylist) window._myPlaylist = [];
  window._myPlaylist.push({ title: title||"Sans titre", artist: artist||"", url });
  document.getElementById("myTrackTitle").value = "";
  document.getElementById("myTrackArtist").value = "";
  document.getElementById("myTrackUrl").value = "";
  renderMyPlaylistEditor();
  try {
    await db.collection("users").doc(currentUser.uid).set({ playlist: window._myPlaylist }, { merge: true });
  } catch (e) { alert("Erreur save playlist: " + e.message); }
}
function renderMyPlaylistEditor() {
  const box = document.getElementById("myPlaylistEditor");
  if (!box) return;
  const pl = window._myPlaylist || [];
  box.innerHTML = pl.map((t,i) => `<div class="admin-track"><span>${esc(t.title)} — ${esc(t.artist)}</span>
    <button class="btn-danger" onclick="removeMyTrack(${i})">×</button></div>`).join("");
}
function removeMyTrack(i) {
  window._myPlaylist.splice(i,1);
  renderMyPlaylistEditor();
}


// ===== MODALS =====
function openModal(r) {
  isRegisterMode = r;
  switchTab(r);
  document.getElementById("authModal").classList.add("open");
}
function closeModal() {
  document.getElementById("authModal").classList.remove("open");
  document.getElementById("authError").textContent = "";
}
function switchTab(r) {
  isRegisterMode = r;
  document.getElementById("tabLogin").classList.toggle("active", !r);
  document.getElementById("tabRegister").classList.toggle("active", r);
  document.getElementById("authTitle").textContent = r ? "Inscription" : "Connexion";
  document.querySelector("#authModal .btn-primary").textContent = r ? "S'inscrire" : "Se connecter";
  document.getElementById("username").style.display = r ? "block" : "none";
  const box = document.getElementById("captchaBox");
  if (box) {
    box.style.display = r ? "block" : "none";
    if (r) refreshCaptcha();
  }
}
let _captchaResult = 0;
function refreshCaptcha() {
  const a = Math.floor(Math.random() * 8) + 2;
  const b = Math.floor(Math.random() * 8) + 1;
  _captchaResult = a + b;
  const lab = document.getElementById("captchaLabel");
  if (lab) lab.textContent = "Anti-bot : combien font " + a + " + " + b + " ?";
  const ans = document.getElementById("captchaAnswer");
  if (ans) ans.value = "";
}
function openAdmin() { openAdminPage(); }
function openAdminPage() {
  if (!isAdmin && !hasPerm("admin_panel")) return alert("Accès admin refusé");
  document.getElementById("adminPage").style.display = "block";
  document.body.style.overflow = "hidden";
  loadAdminPlaylist();
  loadAdminGallery();
  loadGalleryState();
  loadAdminUsers();
  loadVisits();
  loadAdminVideos();
  loadAdminVoiceUI();
  loadHomeConfigForm();
}
function closeAdmin() { closeAdminPage(); }
function closeAdminPage() {
  const p = document.getElementById("adminPage");
  if (p) p.style.display = "none";
  document.body.style.overflow = "";
}
function showAdminTab(n) {
  ["post", "music", "gallery", "voice", "video", "home", "users", "roles", "visits"].forEach(t => {
    const el = document.getElementById("tab-" + t);
    if (el) el.style.display = t === n ? "block" : "none";
  });
  document.querySelectorAll(".admin-tab, .admin-nav-btn").forEach(b => {
    const onclick = b.getAttribute("onclick") || "";
    b.classList.toggle("active", onclick.includes("'" + n + "'"));
  });
  if (n === "home") loadHomeConfigForm();
  if (n === "voice") loadAdminVoiceUI();
  if (n === "roles") loadAdminRolesUI();
}
function openProfile() {
  if (!currentUser) return;
  document.getElementById("profileModal").classList.add("open");
  loadMyProfileForm().then(() => {
    setTimeout(refreshDsPreview, 50);
  }).catch(() => setTimeout(refreshDsPreview, 50));
  bindDsPreviewListeners();
}
function closeProfile() {
  document.getElementById("profileModal").classList.remove("open");
}

// ===== AUTH =====
async function handleAuth() {
  const err = document.getElementById("authError");
  err.style.color = "#f87171";
  err.textContent = "";
  // honeypot
  const hp = document.getElementById("website");
  if (hp && hp.value) return;
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const username = document.getElementById("username").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");

  try {
    if (isRegisterMode) {
      if (!username || username.length < 2) throw new Error("Pseudo invalide (lettres, chiffres, _)");
      if (password.length < 6) throw new Error("Mot de passe trop court");
      const ans = parseInt(document.getElementById("captchaAnswer")?.value, 10);
      if (ans !== _captchaResult) throw new Error("Captcha incorrect");
      const { alloc } = await registerWithAutoTag(email, password, username);
      err.style.color = "#4ade80";
      err.textContent = "Compte créé ! " + formatHandle(alloc);
      try { xNotify(formatHandle(alloc), { type: "ok", title: "Bienvenue" }); } catch (e) {}
      setTimeout(closeModal, 1500);
    } else {
      const cred = await auth.signInWithEmailAndPassword(email, password);
      if (cred.user && !cred.user.emailVerified) {
        err.style.color = "#fbbf24";
        err.textContent = "Email non confirmé. Vérifie ta boîte mail.";
        const vh = document.getElementById("verifyHint");
        if (vh) { vh.style.display = "block"; vh.textContent = "Tu peux renvoyer le mail depuis Profil."; }
        // allow login but warn - strict: uncomment to force
        // await auth.signOut(); return;
      }
      // simple 2FA email gate if enabled
      try {
        const ud = await db.collection("users").doc(cred.user.uid).get();
        if (ud.exists && ud.data().require2FA) {
          const code = String(Math.floor(100000 + Math.random() * 900000));
          await db.collection("otp").doc(cred.user.uid).set({
            code, exp: Date.now() + 10 * 60 * 1000
          });
          // Without Cloud Functions we can't email the code automatically.
          // Fallback: show code prompt only for demo if same session - real A2F needs Cloud Function.
          console.log("2FA requested - configure Cloud Function to email OTP");
        }
      } catch (e) {}
      closeModal();
    }
  } catch (e) {
    err.textContent = (e.message || "Erreur").replace("Firebase: ", "").replace(/\(auth\/[^)]+\)\.?/, "").trim();
    if (isRegisterMode) refreshCaptcha();
  }
}
function logout() {
  try { if (typeof _voiceJoined !== "undefined" && _voiceJoined && typeof leaveVoiceRoom === "function") leaveVoiceRoom(); } catch (e) {}
  stopPresenceHeartbeat();
  auth.signOut().then(() => {
    const hint = document.getElementById("meAuthHint");
    if (hint) hint.textContent = "";
    const pe = document.getElementById("meAuthPass");
    if (pe) pe.value = "";
  });
}

auth.onAuthStateChanged(async u => {
  currentUser = u;
  isAdmin = !!(u && u.email === ADMIN_EMAIL);
  try { updateUI(); } catch (e) { console.error(e); }
  const safe = (fn) => { try { const r = fn(); if (r && r.catch) r.catch(err => console.warn(fn.name, err)); } catch (e) { console.warn(e); } };
  safe(loadFeed);
  safe(loadPlaylist);
  safe(loadGallery);
  safe(loadMembers);
  safe(loadChat);
  safe(loadHomeVideos);
  safe(loadAndApplyHomeConfig);
  safe(startInboxWatch);
  safe(startNotifWatch);
  safe(loadWeather);
  safe(loadVoiceChannelsUI);
  if (u) {
    try {
      try {
        const alloc = await ensureUserUsernameTag(u.uid);
        if (alloc) {
          const ud = await db.collection("users").doc(u.uid).get();
          if (ud.exists) window.userProfile = { id: u.uid, ...ud.data() };
        }
      } catch (e) { console.warn("tag ensure", e); }
      startPresenceHeartbeat();
      const ip = await getClientIp();
      const loc = await getIpLocation(ip);
      await db.collection("users").doc(u.uid).set({
        lastSeen: firebase.firestore.FieldValue.serverTimestamp(),
        lastIp: ip,
        lastLocation: loc
      }, { merge: true });
      // check ban
      const udoc = await db.collection("users").doc(u.uid).get();
      if (udoc.exists) {
        const d = udoc.data();
        window.userProfile = { id: u.uid, ...d };
        window._isMod = !!d.isMod;
        try { syncHubProfileCard(); } catch (e) {}
        try { refreshSecurityUI(); } catch (e) {}
        if (d.banned === true) {
          alert("Compte banni.");
          await auth.signOut();
          return;
        }
        if (d.banUntil && d.banUntil.toDate && d.banUntil.toDate() > new Date()) {
          alert("Compte temporairement suspendu jusqu'au " + d.banUntil.toDate().toLocaleString("fr-FR"));
          await auth.signOut();
          return;
        }
      }
    } catch (e) { console.log(e); }
  }
  logVisit();
  const param = getUserParam();
  if (param) showUserProfile(param);
  else showHome();
});

async function getClientIp() {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const d = await r.json();
    return d.ip || "unknown";
  } catch (e) { return "unknown"; }
}
async function getIpLocation(ip) {
  if (!ip || ip === "unknown") return "";
  try {
    const r = await fetch("https://ipapi.co/" + ip + "/json/");
    const d = await r.json();
    if (d.city) return (d.city || "") + ", " + (d.country_name || d.country || "");
    return d.country_name || "";
  } catch (e) { return ""; }
}

function isMuted() {
  return false; // checked async when posting
}
async function checkMuted() {
  if (!currentUser || isAdmin) return false;
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (!u.exists) return false;
    const d = u.data();
    if (d.muted === true) return true;
    if (d.muteUntil && d.muteUntil.toDate && d.muteUntil.toDate() > new Date()) return true;
  } catch (e) {}
  return false;
}

function updateUI() {
  const ab = document.getElementById("authButtons");
  if (ab) ab.style.display = currentUser ? "none" : "flex";
  const ub = document.getElementById("userBar");
  if (ub) ub.style.display = currentUser ? "flex" : "none";
  const adminBtn = document.getElementById("adminBtn");
  if (adminBtn) adminBtn.style.display = isAdmin ? "inline-flex" : "none";
  refreshMeCard();
  document.getElementById("createPost").style.display = currentUser ? "block" : "none";
  document.getElementById("adminBtn").style.display = isAdmin ? "inline-block" : "none";
  const fab = document.getElementById("inboxFab");
  if (fab) fab.style.display = currentUser ? "flex" : "none";
  const nf = document.getElementById("notifFab");
  if (nf) nf.style.display = currentUser ? "flex" : "none";
  if (currentUser) startNotifWatch();
  else {
    const np = document.getElementById("notifPanel");
    if (np) np.style.display = "none";
  }
  if (!currentUser && typeof leaveVoiceRoom === "function" && _voiceJoined) {
    leaveVoiceRoom();
  }
  if (currentUser) {
    loadFriends();
    if (!window._seenBeat) {
      window._seenBeat = setInterval(async () => {
        if (!auth.currentUser) return;
        try {
          await db.collection("users").doc(auth.currentUser.uid).set({
            lastSeen: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true });
        } catch(e) {}
      }, 120000);
    }
  } else {
    const fl = document.getElementById("friendsList");
    if (fl) fl.innerHTML = '<div class="hint" style="padding:8px">Connecte-toi pour voir tes amis</div>';
  }
}

async function logVisit() {
  try {
    let ip = "unknown";
    try {
      const r = await fetch("https://api.ipify.org?format=json");
      const d = await r.json();
      ip = d.ip;
    } catch (e) {}
    await db.collection("visits").add({
      ip,
      ua: (navigator.userAgent || "").slice(0, 200),
      at: firebase.firestore.FieldValue.serverTimestamp()
    });
  } catch (e) {}
}

async function uploadImgbb(input, targetId) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 32 * 1024 * 1024) return alert("Max 32 Mo");
  const fd = new FormData();
  fd.append("image", file);
  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_KEY}`, { method: "POST", body: fd });
    const data = await res.json();
    if (data.success) {
      document.getElementById(targetId).value = data.data.url;
      if (targetId === "myGalUrl") {
        await addMyGalImage();
      } else {
        refreshDsPreview();
        alert("Image uploadée !");
      }
    } else alert("Erreur upload");
  } catch (e) {
    alert("Erreur: " + e.message);
  }
  input.value = "";
}

// ===== MY PROFILE =====
const LT_PRESETS = {
  link: { icon: "🔗", label: "Mon lien", url: "", type: "link", effect: "normal" },
  collection: { icon: "📁", label: "Collection", url: "", type: "collection", effect: "normal", sub: "Groupe de liens" },
  file: { icon: "⬇️", label: "Téléchargement", url: "", type: "file", effect: "featured", sub: "Fichier / produit" },
  form: { icon: "📝", label: "Contact", url: "", type: "form", effect: "normal", sub: "Écris-moi" },
  instagram: { icon: "📸", label: "Instagram", url: "https://instagram.com/", type: "link", effect: "normal" },
  tiktok: { icon: "🎵", label: "TikTok", url: "https://tiktok.com/@", type: "link", effect: "normal" },
  youtube: { icon: "▶️", label: "YouTube", url: "https://youtube.com/@", type: "link", effect: "normal" },
  spotify: { icon: "🎧", label: "Spotify", url: "https://open.spotify.com/", type: "link", effect: "normal" },
  discord: { icon: "💬", label: "Discord", url: "https://discord.gg/", type: "link", effect: "normal" },
  x: { icon: "𝕏", label: "X / Twitter", url: "https://x.com/", type: "link", effect: "normal" },
  map: { icon: "📍", label: "Ma localisation", url: "https://maps.google.com/?q=", type: "map", effect: "featured", sub: "Voir sur la carte" },
  email: { icon: "✉️", label: "Email", url: "mailto:", type: "link", effect: "normal" },
  whatsapp: { icon: "📱", label: "WhatsApp", url: "https://wa.me/", type: "link", effect: "normal" }
};

function ltAddPreset(key) {
  const p = LT_PRESETS[key] || LT_PRESETS.link;
  addMySocialRow(p.icon, p.label, p.url, p.effect, p.sub || "", "", p.type || "link", "classic");
  const ed = document.getElementById("mySocialEditor");
  if (ed) ed.lastElementChild?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  try { xNotify(p.label + " ajouté — complète l’URL", { type: "ok", title: "Liens" }); } catch (e) {}
}

function ltQuickAdd() {
  const inp = document.getElementById("ltQuickUrl");
  let url = (inp && inp.value || "").trim();
  if (!url) return addMySocialRow();
  if (!/^https?:\/\//i.test(url) && !url.startsWith("mailto:")) url = "https://" + url;
  let icon = "🔗", label = "Lien", type = "link", effect = "normal";
  const u = url.toLowerCase();
  if (u.includes("instagram")) { icon = "📸"; label = "Instagram"; }
  else if (u.includes("tiktok")) { icon = "🎵"; label = "TikTok"; }
  else if (u.includes("youtube") || u.includes("youtu.be")) { icon = "▶️"; label = "YouTube"; }
  else if (u.includes("spotify")) { icon = "🎧"; label = "Spotify"; }
  else if (u.includes("discord")) { icon = "💬"; label = "Discord"; }
  else if (u.includes("twitter") || u.includes("x.com")) { icon = "𝕏"; label = "X"; }
  else if (u.includes("maps.google") || u.includes("goo.gl/maps")) { icon = "📍"; label = "Maps"; type = "map"; effect = "featured"; }
  else {
    try { label = new URL(url).hostname.replace("www.", ""); } catch (e) {}
  }
  addMySocialRow(icon, label, url, effect, "", "", type, "classic");
  if (inp) inp.value = "";
}

function addMySocialRow(icon, label, url, effect, sub, thumb, type, display) {
  const row = document.createElement("div");
  row.className = "social-row social-row-ext lt-link-card";
  const t = type || "link";
  const d = display || (effect === "featured" ? "featured" : "classic");
  const fx = effect || "normal";
  row.innerHTML = `
    <div class="lt-card-top">
      <input class="input soc-icon" placeholder="🔗" value="${esc(icon || "🔗")}" maxlength="4">
      <input class="input soc-label" placeholder="Titre du bouton" value="${esc(label || "")}">
      <button type="button" class="btn btn-outline lt-del" onclick="this.closest('.social-row').remove()">×</button>
    </div>
    <input class="input soc-sub" placeholder="Sous-titre (ex: canvas, totes, stickers)" value="${esc(sub || "")}">
    <input class="input soc-url" placeholder="https://…" value="${esc(url || "")}">
    <div class="lt-card-grid">
      <div>
        <label class="field-label">Type</label>
        <select class="input soc-type">
          <option value="link"${t==="link"?" selected":""}>Lien</option>
          <option value="map"${t==="map"?" selected":""}>📍 Maps</option>
          <option value="file"${t==="file"?" selected":""}>⬇️ Fichier</option>
          <option value="form"${t==="form"?" selected":""}>📝 Form</option>
          <option value="header"${t==="header"?" selected":""}>🏷 Titre</option>
        </select>
      </div>
      <div>
        <label class="field-label">Affichage</label>
        <select class="input soc-display">
          <option value="classic"${d==="classic"?" selected":""}>Classic</option>
          <option value="featured"${d==="featured"?" selected":""}>⭐ Featured</option>
          <option value="icon"${d==="icon"?" selected":""}>Icône seule</option>
        </select>
      </div>
    </div>
    <div class="lt-card-grid">
      <div>
        <label class="field-label">Effet</label>
        <select class="input soc-effect">
          <option value="normal"${fx==="normal"?" selected":""}>Normal</option>
          <option value="featured"${fx==="featured"?" selected":""}>⭐ Featured</option>
          <option value="spoiler"${fx==="spoiler"?" selected":""}>🌫️ Spoiler</option>
          <option value="pulse"${fx==="pulse"?" selected":""}>✨ Pulse</option>
          <option value="shimmer"${fx==="shimmer"?" selected":""}>💎 Shimmer</option>
          <option value="neon"${fx==="neon"?" selected":""}>Neon</option>
          <option value="shake"${fx==="shake"?" selected":""}>🔥 Shake</option>
        </select>
      </div>
      <div>
        <label class="field-label">Couleur (featured)</label>
        <input type="color" class="input soc-color color-input" value="${"#a855f7"}">
      </div>
    </div>
    <input class="input soc-thumb" placeholder="Miniature URL (optionnel)" value="${esc(thumb || "")}">
    <div class="upload-row" style="margin-top:6px">
      <span class="hint" style="flex:1;margin:0">Upload miniature</span>
      <label class="upload-btn">📁<input type="file" accept="image/*" hidden onchange="uploadSocThumb(this)"></label>
    </div>`;
  document.getElementById("mySocialEditor").appendChild(row);
}

function uploadSocThumb(input) {
  if (!input.files || !input.files[0]) return;
  const row = input.closest(".social-row");
  const thumb = row && row.querySelector(".soc-thumb");
  if (!thumb) return;
  // reuse imgbb via temporary field
  const fakeId = "tmpThumb_" + Date.now();
  let fake = document.getElementById(fakeId);
  if (!fake) {
    fake = document.createElement("input");
    fake.type = "hidden";
    fake.id = fakeId;
    document.body.appendChild(fake);
  }
  uploadImgbb(input, fakeId);
  const iv = setInterval(() => {
    if (fake.value) {
      thumb.value = fake.value;
      clearInterval(iv);
      fake.remove();
    }
  }, 400);
  setTimeout(() => clearInterval(iv), 20000);
}


async function saveMyProfile() {
  if (!currentUser) return alert("Non connecté");
  let baseInput = (document.getElementById("myUsername")?.value || "")
    .trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const typed = splitUsernameParts(baseInput);
  baseInput = typed.base;
  if (!baseInput || baseInput.length < 2) return alert("Pseudo invalide (min 2, a-z 0-9 _)");

  let tagInput = (document.getElementById("myTag")?.value || "")
    .trim().toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 4);
  if (tagInput.length < 4) {
    // auto-complete / generate
    tagInput = genUsernameTag();
  }

  let username = baseInput + "-" + tagInput;
  try {
    const mine = await db.collection("users").doc(currentUser.uid).get();
    const cur = mine.exists ? (mine.data().username || "") : "";
    if (await isUsernameTaken(username, currentUser.uid)) {
      if (cur === username) {
        // own
      } else {
        return alert("Combinaison @" + baseInput + "#" + tagInput.toUpperCase() + " déjà prise — change le # ou clique 🎲");
      }
    }
  } catch (e) {
    console.log("username check", e);
  }

  // flush block inputs into memory
  document.querySelectorAll("#myBlocksEditor [data-f]").forEach(el => {
    const i = +el.dataset.i;
    const f = el.dataset.f;
    if (window._myBlocks && window._myBlocks[i]) {
      if (f === "itemsJson") {
        try { window._myBlocks[i].items = JSON.parse(el.value); } catch (err) {}
      } else {
        window._myBlocks[i][f] = el.value;
      }
    }
  });

  const socials = [];
  document.querySelectorAll("#mySocialEditor .social-row").forEach(row => {
    const icon = row.querySelector(".soc-icon")?.value.trim() || "";
    const label = row.querySelector(".soc-label")?.value.trim() || "";
    const url = row.querySelector(".soc-url")?.value.trim() || "";
    const effect = row.querySelector(".soc-effect")?.value || "normal";
    const sub = row.querySelector(".soc-sub")?.value.trim() || "";
    const thumb = row.querySelector(".soc-thumb")?.value.trim() || "";
    const type = row.querySelector(".soc-type")?.value || "link";
    const display = row.querySelector(".soc-display")?.value || "classic";
    const color = row.querySelector(".soc-color")?.value || "";
    if (label || url) socials.push({
      icon: icon || "🔗",
      label: label || url,
      url: type === "header" ? "" : normalizeUrl(url),
      effect: display === "featured" ? "featured" : effect,
      sub, thumb, type, display, color
    });
  });

  const payload = {
    username,
    baseUsername: baseInput,
    tag: tagInput,
    displayName: (document.getElementById("myDisplayName")?.value || baseInput).trim().slice(0, 40),
    bio: (document.getElementById("myBio")?.value || "").trim().slice(0, 200),
    bioShow: document.getElementById("myBioShow") ? !!document.getElementById("myBioShow").checked : true,
    bioPos: document.getElementById("myBioPos")?.value || "under-name",
    avatar: (document.getElementById("myAvatar")?.value || "").trim(),
    bg: (document.getElementById("myBg")?.value || "").trim(),
    particles: sanitizeParticleType(document.getElementById("myParticles")?.value || "none"),
    socials,
    playlist: window._myPlaylist || [],
    gallery: window._myGallery || [],
    require2FA: !!(document.getElementById("my2FA") && document.getElementById("my2FA").checked),
    theme: document.getElementById("myTheme")?.value || "violet",
    btnStyle: document.getElementById("myBtnStyle")?.value || "fill",
    btnShape: document.getElementById("myBtnShape")?.value || "rounded",
    font: document.getElementById("myFont")?.value || "inter",
    headerLayout: document.getElementById("myHeaderLayout")?.value || "classic",
    bgType: (function(){
      const vid = (document.getElementById("myBgVideo")?.value || "").trim();
      const img = (document.getElementById("myBg")?.value || "").trim();
      const t = document.getElementById("myBgType")?.value || "theme";
      if (vid) return "video";
      if (img) return "image";
      return t;
    })(),
    bgColor: document.getElementById("myBgColor")?.value || "#0a0a0f",
    btnColor: document.getElementById("myBtnColor")?.value || "#7c3aed",
    btnTextColor: document.getElementById("myBtnText")?.value || "#ffffff",
    textColor: document.getElementById("myTextColor")?.value || "#f4f4f5",
    statusManual: document.getElementById("myStatus")?.value || "auto",
    animeList: window._myAnime || [],
    spotify: (document.getElementById("mySpotify")?.value || "").trim(),
    blocks: window._myBlocks || [],
    logo: (document.getElementById("myLogo")?.value || "").trim(),
    titleSize: document.getElementById("myTitleSize")?.value || "normal",
    bgVideo: (document.getElementById("myBgVideo")?.value || "").trim()
  };

  try {
    // claim username in Firebase registry
    try {
      const prev = (await db.collection("users").doc(currentUser.uid).get()).data()?.username;
      await claimUsername(payload.username, currentUser.uid, prev);
    } catch (e) {
      return alert("Pseudo: " + e.message);
    }
    await db.collection("users").doc(currentUser.uid).set(payload, { merge: true });
    closeProfile();
    loadMembers();
    await showUserProfile(username);
    alert("Profil enregistré !\n" + location.origin + "/?u=" + username);
  } catch (e) {
    console.error(e);
    alert("Erreur sauvegarde: " + e.message);
  }
}

// ===== FEED =====
async function loadFeed() {
  const feed = document.getElementById("feed");
  if (!feed) return;
  try {
    let snap;
    try {
      snap = await db.collection("posts").orderBy("createdAt", "desc").limit(25).get();
    } catch (e) {
      snap = await db.collection("posts").limit(25).get();
    }
    if (snap.empty) {
      feed.innerHTML = '<div class="loading">Aucun post.<br>Sois le premier !</div>';
      return;
    }
    let html = "";
    snap.forEach(doc => {
      const p = doc.data();
      const date = p.createdAt
        ? p.createdAt.toDate().toLocaleString("fr-FR", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit"
          })
        : "";
      const likes = p.likes || [];
      const liked = currentUser && likes.includes(currentUser.uid);
      const comments = p.comments || [];
      const show = comments.slice(0, 2);
      const rest = comments.length - 2;
      const authorHandle = formatHandle(p.authorUsername || p.authorHandle || "");
      const authorLink = p.authorUsername
        ? `<a href="?u=${encodeURIComponent(p.authorUsername)}" style="color:inherit;text-decoration:none" onclick="event.preventDefault();showUserProfile('${esc(p.authorUsername)}')">${esc(p.authorName || "Anonyme")} <span class="handle-inline">${esc(authorHandle)}</span></a>`
        : esc(p.authorName || "Anonyme");
      html += `<div class="post">
        <div class="post-header">
          <img class="post-avatar" src="https://ui-avatars.com/api/?name=${encodeURIComponent(p.authorName || "U")}&background=7c3aed&color=fff&size=64">
          <div><div class="post-author">${authorLink}</div><div class="post-date">${date}</div></div>
        </div>
        <div class="post-content">${esc(p.content)}</div>
        <div class="post-actions">
          <button class="action-btn" onclick="toggleLike('${doc.id}')">${liked ? "♥" : "♡"} ${likes.length}</button>
          <button class="action-btn" onclick="toggleComments('${doc.id}')">💬 ${comments.length}</button>
          ${(currentUser && (currentUser.uid === p.authorId || isAdmin)) ? `<button class="post-del" onclick="deletePost('${doc.id}')">Suppr</button>` : ""}
        </div>
        <div class="comments" id="c-${doc.id}" style="display:none">
          ${show.map(c => `<div class="comment"><strong>${esc(c.author)}</strong>${esc(c.text)}</div>`).join("")}
          ${rest > 0 ? `<button class="comment-more" onclick="showAllComments('${doc.id}')">Voir les ${rest} autres</button><div id="h-${doc.id}" style="display:none">${comments.slice(2).map(c => `<div class="comment"><strong>${esc(c.author)}</strong>${esc(c.text)}</div>`).join("")}</div>` : ""}
          ${currentUser ? `<form class="comment-form" onsubmit="addComment(event,'${doc.id}')"><input type="text" placeholder="Commenter..." maxlength="300" required><button type="submit">→</button></form>` : ""}
        </div>
      </div>`;
    });
    feed.innerHTML = html;
    setTimeout(attachCommentEmojis, 50);
  } catch (e) {
    console.error("loadFeed", e);
    feed.innerHTML = '<div class="loading">Impossible de charger le fil</div>';
  }
}
function toggleComments(id) {
  const el = document.getElementById("c-" + id);
  if (el) el.style.display = el.style.display === "none" ? "block" : "none";
}
function showAllComments(id) {
  const h = document.getElementById("h-" + id);
  if (h) h.style.display = "block";
  if (h && h.previousElementSibling) h.previousElementSibling.style.display = "none";
}
async function addComment(e, postId) {
  e.preventDefault();
  if (!currentUser) return;
  if (await checkMuted()) return alert("Tu es mute.");
  const input = e.target.querySelector("input");
  const text = input.value.trim().slice(0, 300);
  if (!text) return;
  let author = "User";
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) author = u.data().displayName || u.data().username || "User";
  } catch (e) {}
  await db.collection("posts").doc(postId).update({
    comments: firebase.firestore.FieldValue.arrayUnion({ author, text, uid: currentUser.uid, at: Date.now() })
  });
  input.value = "";
  loadFeed();
}
async function publishPost() {
  if (!currentUser) return;
  if (await checkMuted()) return alert("Tu es mute, impossible de poster.");
  const content = document.getElementById("postContent").value.trim().slice(0, 2000);
  if (!content) return;
  let authorName = "User", authorUsername = "";
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) {
      authorName = u.data().displayName || u.data().username || "User";
      authorUsername = u.data().username || "";
    }
  } catch (e) {}
  await db.collection("posts").add({
    content,
    authorId: currentUser.uid,
    authorName,
    authorUsername,
    likes: [],
    comments: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("postContent").value = "";
  loadFeed();
}
async function adminPublish() {
  if (!isAdmin) return alert("Accès admin requis");
  const content = document.getElementById("adminPost").value.trim().slice(0, 2000);
  if (!content) return alert("Texte vide");
  try {
    await db.collection("posts").add({
      content,
      authorId: currentUser.uid,
      authorName: (window.userProfile && window.userProfile.displayName) || "Shaman",
      authorUsername: (window.userProfile && window.userProfile.username) || "shaman",
      likes: [],
      comments: [],
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    document.getElementById("adminPost").value = "";
    loadFeed();
    alert("Publié !");
  } catch (e) {
    console.error(e);
    alert("Erreur publication : " + (e.message || e));
  }
}
async function toggleLike(postId) {
  if (!currentUser) return openModal(false);
  const ref = db.collection("posts").doc(postId);
  const doc = await ref.get();
  if (!doc.exists) return;
  const likes = doc.data().likes || [];
  if (likes.includes(currentUser.uid))
    await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
  else await ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
  loadFeed();
}

// ===== MUSIC =====
async function loadPlaylist() {
  try {
    let snap;
    try {
      snap = await db.collection("playlist").orderBy("createdAt", "asc").get();
    } catch (e) {
      snap = await db.collection("playlist").get();
    }
    playlist = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (playlist.length) loadTrack(0);
    updateLikeBtn();
  } catch (e) {}
}
function loadTrack(i) {
  if (!playlist.length) return;
  currentTrack = (i + playlist.length) % playlist.length;
  const t = playlist[currentTrack];
  const title = t.title || "Sans titre";
  const artist = t.artist || "—";
  ["trackTitle","trackTitleFloat"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=title; });
  ["trackArtist","trackArtistFloat"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=artist; });
  let url = t.url || "";
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    const m = url.match(/\/d\/([\w-]+)/) || url.match(/[?&]id=([\w-]+)/);
    if (m) url = "https://docs.google.com/uc?export=download&id=" + m[1];
  }
  const audioEl = document.getElementById("audio");
  if (!isSafeMediaUrl(url)) {
    console.warn("URL média refusée", url);
    if (audioEl) audioEl.removeAttribute("src");
    return;
  }
  if (audioEl) audioEl.src = url;
  updateLikeBtn();
  fetchTrackCover(t.title || "", t.artist || "");
}

async function fetchTrackCover(title, artist) {
  const img = document.getElementById("trackCover");
  if (!img) return;
  const q = (artist + " " + title).trim();
  if (!q || q === "Sans titre") {
    img.style.display = "none";
    img.src = "";
    return;
  }
  try {
    const res = await fetch(
      "https://itunes.apple.com/search?term=" + encodeURIComponent(q) + "&entity=song&limit=1"
    );
    const data = await res.json();
    if (data.results && data.results[0] && data.results[0].artworkUrl100) {
      let art = data.results[0].artworkUrl100.replace("100x100bb", "200x200bb");
      ["trackCover","trackCoverFloat"].forEach(id => {
        const im = document.getElementById(id);
        if (!im) return;
        im.src = art;
        im.style.display = "block";
        im.onerror = () => { im.style.display = "none"; };
      });
    } else {
      ["trackCover","trackCoverFloat"].forEach(id => {
        const im = document.getElementById(id);
        if (im) im.style.display = "none";
      });
    }
  } catch (e) {
    img.style.display = "none";
  }
}
function updateLikeBtn() {
  const btn = document.getElementById("likeTrackBtn");
  if (!btn || !playlist.length) return;
  const t = playlist[currentTrack];
  const likes = t.likes || [];
  const liked = currentUser && likes.includes(currentUser.uid);
  btn.textContent = liked ? "♥" : "♡";
  btn.classList.toggle("liked", !!liked);
}
async function toggleTrackLike() {
  if (!currentUser) return openModal(false);
  if (!playlist.length) return;
  const t = playlist[currentTrack];
  if (!t.id) return;
  const ref = db.collection("playlist").doc(t.id);
  const likes = t.likes || [];
  if (likes.includes(currentUser.uid))
    await ref.update({ likes: firebase.firestore.FieldValue.arrayRemove(currentUser.uid) });
  else await ref.update({ likes: firebase.firestore.FieldValue.arrayUnion(currentUser.uid) });
  await loadPlaylist();
  loadTrack(currentTrack);
}
function togglePlay() {
  const audio = document.getElementById("audio");
  if (isPlaying) {
    audio.pause();
    setPlayButtons("▶️");
    isPlaying = false;
  } else {
    audio.volume = window._lofiVol != null ? window._lofiVol : 0.4;
    audio.play()
      .then(() => { setPlayButtons("⏸️"); isPlaying = true; })
      .catch(() => {});
  }
}
function setPlayButtons(txt) {
  ["playBtn","playBtnFloat"].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=txt; });
}
function prevTrack() {
  const w = isPlaying;
  loadTrack(currentTrack - 1);
  if (w) {
    isPlaying = false;
    togglePlay();
  }
}
function nextTrack() {
  const w = isPlaying;
  loadTrack(currentTrack + 1);
  if (w) {
    isPlaying = false;
    togglePlay();
  }
}
document.getElementById("audio").onended = () => nextTrack();
function hidePlayer() {
  document.getElementById("musicPlayer").classList.add("hidden");
  document.getElementById("playerToggle").classList.add("show");
}
function showPlayer() {
  document.getElementById("musicPlayer").classList.remove("hidden");
  document.getElementById("playerToggle").classList.remove("show");
}
function openPlaylist() {
  const list = document.getElementById("playlistList");
  list.innerHTML = !playlist.length
    ? '<p style="text-align:center;color:#888;padding:20px">Vide</p>'
    : playlist
        .map(
          (t, i) =>
            `<div class="playlist-item ${i === currentTrack ? "active" : ""}" onclick="playFromList(${i})">
        <div style="flex:1"><div class="pi-title">${esc(t.title || "?")}</div>
        <div class="pi-artist">${esc(t.artist || "")} ${t.likes && t.likes.length ? "· ♥ " + t.likes.length : ""}</div></div>
        <span>${i === currentTrack && isPlaying ? "⏸" : "▶"}</span></div>`
        )
        .join("");
  document.getElementById("playlistModal").classList.add("open");
}
function closePlaylist() {
  document.getElementById("playlistModal").classList.remove("open");
}
function playFromList(i) {
  loadTrack(i);
  if (!isPlaying) togglePlay();
  closePlaylist();
}
async function addMusic() {
  if (!isAdmin) return;
  const title = document.getElementById("musicTitle").value.trim();
  const artist = document.getElementById("musicArtist").value.trim();
  const url = document.getElementById("musicUrl").value.trim();
  if (!url) return alert("Lien obligatoire");
  await db.collection("playlist").add({
    title: title || "Sans titre",
    artist: artist || "Inconnu",
    url,
    likes: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("musicTitle").value = "";
  document.getElementById("musicArtist").value = "";
  document.getElementById("musicUrl").value = "";
  loadPlaylist();
  loadAdminPlaylist();
  alert("Ajouté !");
}
async function deleteMusic(id) {
  if (!isAdmin || !confirm("Supprimer ?")) return;
  await db.collection("playlist").doc(id).delete();
  loadPlaylist();
  loadAdminPlaylist();
}
async function loadAdminPlaylist() {
  const box = document.getElementById("adminPlaylist");
  if (!box) return;
  try {
    const snap = await db.collection("playlist").get();
    box.innerHTML = snap.empty
      ? '<p class="hint">Vide</p>'
      : snap.docs
          .map(d => {
            const t = d.data();
            return `<div class="admin-track"><span>${esc(t.title)} — ${esc(t.artist)}</span>
          <button class="btn-danger" onclick="deleteMusic('${d.id}')">Suppr</button></div>`;
          })
          .join("");
  } catch (e) {}
}

// ===== GALLERY =====
async function loadGallery() {
  const area = document.getElementById("galleryArea");
  if (!area) return;
  try {
    const site = await db.collection("settings").doc("site").get();
    const enabled = site.exists && site.data().galleryEnabled === true;
    if (!enabled) {
      area.innerHTML =
        '<div class="coming-soon-box"><div class="coming-soon-icon">🖼️</div><h3>Coming Soon</h3><p>Galerie bientôt</p></div>';
      return;
    }
    let snap;
    try {
      snap = await db.collection("gallery").orderBy("createdAt", "desc").limit(40).get();
    } catch (e) {
      snap = await db.collection("gallery").limit(40).get();
    }
    if (snap.empty) {
      area.innerHTML = '<div class="coming-soon-box"><p>Galerie vide</p></div>';
      return;
    }
    area.innerHTML =
      '<div class="gallery-grid">' +
      snap.docs
        .map(d => {
          const g = d.data();
          return `<div class="gallery-item" data-url="${esc(g.url)}" onclick="openLightbox(this.dataset.url)"><img src="${esc(g.url)}" alt="" loading="lazy"></div>`;
        })
        .join("") +
      "</div>";
  } catch (e) {
    area.innerHTML = '<div class="coming-soon-box"><p>Galerie</p></div>';
  }
}
async function loadGalleryState() {
  try {
    const doc = await db.collection("settings").doc("site").get();
    const en = doc.exists && doc.data().galleryEnabled === true;
    const t = document.getElementById("galleryToggle");
    if (t) t.checked = en;
  } catch (e) {}
}
async function toggleGallery() {
  if (!isAdmin) return;
  const enabled = document.getElementById("galleryToggle").checked;
  await db.collection("settings").doc("site").set({ galleryEnabled: enabled }, { merge: true });
  loadGallery();
}
async function addGalleryImage() {
  if (!isAdmin) return;
  const url = document.getElementById("galleryUrl").value.trim();
  if (!url) return alert("URL requise");
  const caption = document.getElementById("galleryCaption").value.trim();
  await db.collection("gallery").add({
    url,
    caption,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("galleryUrl").value = "";
  document.getElementById("galleryCaption").value = "";
  loadGallery();
  loadAdminGallery();
  alert("Ajouté !");
}
async function loadAdminGallery() {
  const box = document.getElementById("adminGallery");
  if (!box) return;
  try {
    const snap = await db.collection("gallery").limit(20).get();
    box.innerHTML = snap.docs
      .map(
        d =>
          `<div class="admin-track"><span style="overflow:hidden;text-overflow:ellipsis;max-width:180px">${esc(
            d.data().caption || d.data().url
          )}</span><button class="btn-danger" onclick="deleteGallery('${d.id}')">Suppr</button></div>`
      )
      .join("");
  } catch (e) {}
}
async function deleteGallery(id) {
  if (!isAdmin || !confirm("Supprimer ?")) return;
  await db.collection("gallery").doc(id).delete();
  loadGallery();
  loadAdminGallery();
}

// ===== MEMBERS =====
let _membersUnsub = null;
let _presenceTimer = null;

function startPresenceHeartbeat() {
  if (_presenceTimer) clearInterval(_presenceTimer);
  if (!currentUser) return;
  const beat = () => {
    if (!currentUser) return;
    db.collection("users").doc(currentUser.uid).set({
      lastSeen: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(() => {});
  };
  beat();
  _presenceTimer = setInterval(beat, 45000);
}

function stopPresenceHeartbeat() {
  if (_presenceTimer) clearInterval(_presenceTimer);
  _presenceTimer = null;
}

async function loadMembers() {
  const box = document.getElementById("membersList");
  if (!box) return;
  // live listener once
  if (_membersUnsub) {
    // just rely on snapshot; force refresh by re-subscribe
    try { _membersUnsub(); } catch (e) {}
    _membersUnsub = null;
  }
  try {
    await ensureRolesCache();
  } catch (e) {}
  const renderSnap = (snap) => {
    if (!box) return;
    const now = Date.now();
    let online = 0;
    if (!snap || snap.empty) {
      box.innerHTML = '<div class="loading">Aucun membre</div>';
      const b = document.getElementById("onlineBadge");
      if (b) b.textContent = "0 en ligne";
      return;
    }
    // sort by lastSeen client-side
    const docs = snap.docs.slice().sort((a, b) => {
      const ta = a.data().lastSeen && a.data().lastSeen.toDate ? a.data().lastSeen.toDate().getTime() : 0;
      const tb = b.data().lastSeen && b.data().lastSeen.toDate ? b.data().lastSeen.toDate().getTime() : 0;
      return tb - ta;
    });
    box.innerHTML = docs.map(d => {
      const u = d.data();
      let last = 0;
      try { if (u.lastSeen) last = u.lastSeen.toDate().getTime(); } catch (e) {}
      const isOn = now - last < 3 * 60 * 1000;
      if (isOn) online++;
      const av = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.displayName || u.username || "U")}&background=7c3aed&color=fff&size=96`;
      const uname = u.username || d.id;
      const st = computeStatus(u.lastSeen, u.statusManual);
      const badges = computeBadges(u);
      const mini = badges.slice(0, 2).map(b => `<span title="${esc(b.label)}">${b.icon || "●"}</span>`).join("");
      const roleBit = roleMiniHTML(u);
      return `<div class="member-card" style="cursor:pointer" onclick="showUserProfile('${esc(uname)}')">
        <img src="${esc(av)}" alt="">
        <div class="m-name">${esc(u.displayName || splitUsernameParts(uname).base || "User")} ${roleBit}</div>
        <div class="usi-handle" style="font-size:.68rem">${esc(formatHandle(u))}</div>
        <div class="mini-badges">${mini}</div>
        <div class="m-status ${st === "online" ? "" : "off"}">${statusLabel(st)}</div>
      </div>`;
    }).join("");
    const badge = document.getElementById("onlineBadge");
    if (badge) badge.textContent = online + " en ligne";
  };
  try {
    _membersUnsub = db.collection("users").limit(60).onSnapshot(
      snap => renderSnap(snap),
      err => {
        console.warn("members live", err);
        db.collection("users").limit(60).get().then(renderSnap).catch(() => {
          box.innerHTML = '<div class="loading">Aucun membre</div>';
        });
      }
    );
  } catch (e) {
    console.error(e);
    box.innerHTML = '<div class="loading">Aucun membre</div>';
  }
}

async function loadVisits() {
  const box = document.getElementById("visitsList");
  if (!box) return;
  try {
    let snap;
    try {
      snap = await db.collection("visits").orderBy("at", "desc").limit(40).get();
    } catch (e) {
      snap = await db.collection("visits").limit(40).get();
    }
    box.innerHTML = snap.empty
      ? '<p class="hint">Aucune visite</p>'
      : snap.docs
          .map(d => {
            const v = d.data();
            const date = v.at ? v.at.toDate().toLocaleString("fr-FR") : "?";
            return `<div class="visit-row">${esc(v.ip)} · ${date}</div>`;
          })
          .join("");
  } catch (e) {
    box.innerHTML = '<p class="hint">—</p>';
  }
}



// ===== PUBLIC CHAT =====
let chatUnsub = null;
let _chatUnsub = null;
function loadChat() {
  const box = document.getElementById("publicChat");
  if (!box) return;
  if (_chatUnsub) { try { _chatUnsub(); } catch(e) {} _chatUnsub = null; }
  try {
    _chatUnsub = db.collection("chat").orderBy("at", "desc").limit(50)
      .onSnapshot(snap => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
        renderChat(msgs);
      }, err => {
        console.log("chat live fallback", err);
        db.collection("chat").limit(50).get().then(snap => {
          const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          renderChat(msgs);
        }).catch(() => { box.innerHTML = '<div class="loading">Chat indisponible</div>'; });
      });
  } catch (e) {
    box.innerHTML = '<div class="loading">Chat indisponible</div>';
  }
}
async function renderChat(msgs) {
  const box = document.getElementById("publicChat");
  if (!box) return;
  if (!msgs.length) {
    box.innerHTML = '<div class="loading">Aucun message — dis bonjour !</div>';
    return;
  }
  const canMod = isAdmin || window._isMod;
  const parts = await Promise.all(msgs.map(async m => {
    const role = m.role === "admin" ? "admin" : m.role === "mod" ? "mod" : "";
    const time = m.at && m.at.toDate ? m.at.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
    const del = canMod ? `<button class="cm-del" onclick="deleteChatMsg('${m.id}')">✕</button>` : "";
    const uname = m.username || "anon";
    const handle = handleForChat(m);
    const label = (m.displayName || splitUsernameParts(uname).base || "User") + " " + handle;
    let body = m.text || "";
    try { if (typeof decryptPublicText === "function") body = await decryptPublicText(body); } catch (e) {}
    return `<div class="chat-msg"><span class="cm-user ${role}" onclick="showUserProfile('${esc(uname)}')" title="${esc(handle)}">${esc(label)}</span>${esc(body)}<span class="cm-time">${time}</span>${del}</div>`;
  }));
  box.innerHTML = parts.join("");
  box.scrollTop = box.scrollHeight;
}
async function sendChat(e) {
  e.preventDefault();
  if (!currentUser) return openModal(false);
  if (await checkMuted()) return alert("Tu es mute.");
  const input = document.getElementById("chatInput");
  let text = stripDangerous(input.value.trim(), 300);
  if (!text) return;
  try {
    if (typeof encryptPublicText === "function") text = await encryptPublicText(text);
  } catch (err) {}
  let displayName = "User", username = "", role = "user", tag = "", baseUsername = "";
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) {
      const d = u.data();
      displayName = stripDangerous(d.displayName || d.username || "User", 40);
      username = stripDangerous(d.username || "", 32);
      tag = d.tag || splitUsernameParts(username).tag || "";
      baseUsername = d.baseUsername || splitUsernameParts(username).base || "";
      if (d.isMod) role = "mod";
    }
  } catch (e) {}
  if (isAdmin) role = "admin";
  if (!rateLimit("chat:" + (currentUser&&currentUser.uid), 15, 60000)) return alert("Anti-spam chat");
  const parts = splitUsernameParts(username);
  if (!tag) tag = parts.tag || "";
  if (!baseUsername) baseUsername = parts.base || "";
  await db.collection("chat").add({
    text, uid: currentUser.uid, displayName, username, role,
    baseUsername,
    tag,
    handle: formatHandle({ username, baseUsername, tag }),
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
  input.value = "";
  // live via onSnapshot
}
async function deleteChatMsg(id) {
  if (!isAdmin && !window._isMod) return;
  await db.collection("chat").doc(id).delete();
  loadChat();
}

// ===== PERSONAL GALLERY =====
async function addMyGalImage() {
  if (!currentUser) return alert("Connecte-toi");
  const url = document.getElementById("myGalUrl").value.trim();
  if (!url) return alert("URL requise — upload ou colle un lien");
  if (!window._myGallery) window._myGallery = [];
  window._myGallery.push({ url, at: Date.now() });
  document.getElementById("myGalUrl").value = "";
  renderMyGalleryEditor();
  try {
    await db.collection("users").doc(currentUser.uid).set(
      { gallery: window._myGallery },
      { merge: true }
    );
    alert("Image ajoutée à ta galerie !");
    // refresh profile view if open
    const param = getUserParam();
    if (param) showUserProfile(param);
  } catch (e) {
    console.error(e);
    alert("Erreur sauvegarde: " + e.message);
  }
}
function renderMyGalleryEditor() {
  const box = document.getElementById("myGalleryEditor");
  if (!box) return;
  const g = window._myGallery || [];
  if (!g.length) {
    box.innerHTML = '<p class="hint">Aucune image pour le moment</p>';
    return;
  }
  box.innerHTML = g.map((img, i) =>
    `<div class="admin-track" style="gap:8px">
      <img src="${esc(img.url)}" style="width:40px;height:40px;object-fit:cover;border-radius:8px" onerror="this.style.display='none'">
      <span style="overflow:hidden;text-overflow:ellipsis;flex:1;font-size:.7rem">${esc(img.url)}</span>
      <button class="btn-danger" onclick="removeMyGal(${i})">×</button>
    </div>`
  ).join("");
}
async function removeMyGal(i) {
  if (!currentUser) return;
  window._myGallery.splice(i, 1);
  renderMyGalleryEditor();
  try {
    await db.collection("users").doc(currentUser.uid).set(
      { gallery: window._myGallery },
      { merge: true }
    );
    const param = getUserParam();
    if (param) showUserProfile(param);
  } catch (e) {
    alert("Erreur: " + e.message);
  }
}

// ===== PARTICLES =====
let particleType = "none";
let particleCanvas = null;
let particleCtx = null;
let particles = [];
let particleAnim = null;

function initParticles() {
  particleCanvas = document.getElementById("particleCanvas");
  if (!particleCanvas) return;
  particleCtx = particleCanvas.getContext("2d");
  resizeParticles();
  window.addEventListener("resize", resizeParticles);
}
function resizeParticles() {
  if (!particleCanvas) return;
  particleCanvas.width = window.innerWidth;
  particleCanvas.height = window.innerHeight;
}
function sanitizeParticleType(type) {
  const allowed = ["none", "hearts", "stars", "snow", "sparkles", "music"];
  const t = String(type || "none").toLowerCase().trim();
  return allowed.includes(t) ? t : "none";
}

function setParticles(type) {
  particleType = sanitizeParticleType(type);
  particles = [];
  if (particleAnim) {
    cancelAnimationFrame(particleAnim);
    particleAnim = null;
  }
  if (!particleCtx) initParticles();
  if (!particleCanvas || !particleCtx) return;
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  if (particleType === "none") return;
  const count = particleType === "snow" ? 80 : 40;
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      s: Math.random() * 3 + 1,
      sp: Math.random() * 1.5 + 0.5,
      a: Math.random() * Math.PI * 2,
      o: Math.random() * 0.6 + 0.3
    });
  }
  animateParticles();
}

function animateParticles() {
  if (particleType === "none" || !particleCtx || !particleCanvas) return;
  // HARD whitelist — never draw user-controlled characters
  const symbols = { hearts: "♥", stars: "✦", snow: "❄", sparkles: "✨", music: "♪" };
  if (!symbols[particleType]) {
    particleType = "none";
    particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    return;
  }
  const sym = symbols[particleType];
  particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
  particles.forEach(p => {
    p.y += p.sp;
    p.x += Math.sin(p.a) * 0.5;
    p.a += 0.02;
    if (p.y > particleCanvas.height) {
      p.y = -10;
      p.x = Math.random() * particleCanvas.width;
    }
    particleCtx.globalAlpha = p.o;
    particleCtx.font = (p.s * 6 + 8) + "px serif";
    particleCtx.fillStyle =
      particleType === "hearts" ? "#e879f9" :
      particleType === "stars" ? "#fde68a" :
      particleType === "music" ? "#a78bfa" : "#e0e7ff";
    particleCtx.fillText(sym, p.x, p.y);
  });
  particleCtx.globalAlpha = 1;
  particleAnim = requestAnimationFrame(animateParticles);
}

initParticles();

// ===== EMAIL VERIFY / 2FA UI =====
async function resendVerification() {
  if (!auth.currentUser) return;
  try {
    await auth.currentUser.sendEmailVerification();
    alert("Email de confirmation renvoyé !");
  } catch (e) {
    alert(e.message);
  }
}
function toggle2FAHint() {
  // saved with profile
}
async function loadMyProfileForm() {
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    const d = u.exists ? u.data() : {};
    const _up = splitUsernameParts(d.username || d.baseUsername || "");
    const base = _up.base || d.baseUsername || d.username || "";
    const tag = d.tag || _up.tag || "";
    document.getElementById("myUsername").value = base;
    const tagEl = document.getElementById("myTag");
    if (tagEl) tagEl.value = tag;
    refreshHandlePreview();
    const uh = document.getElementById("usernameHint");
    if (uh && !document.getElementById("handlePreviewLive")) {
      uh.textContent = d.username ? "Ton handle : " + formatHandle(d) : "";
    }
    document.getElementById("myDisplayName").value = d.displayName || "";
    document.getElementById("myBio").value = d.bio || "";
    const bs = document.getElementById("myBioShow");
    if (bs) bs.checked = d.bioShow !== false;
    const bp = document.getElementById("myBioPos");
    if (bp) bp.value = d.bioPos || "under-name";
    document.getElementById("myAvatar").value = d.avatar || "";
    document.getElementById("myBg").value = d.bg || "";
    document.getElementById("myParticles").value = d.particles || "none";
    const map = {
      myTheme: d.theme || "violet",
      myBtnStyle: d.btnStyle || "fill",
      myBtnShape: d.btnShape || "rounded",
      myFont: d.font || "inter",
      myHeaderLayout: d.headerLayout || "classic",
      myBgType: d.bgType || "theme",
      myBgColor: d.bgColor || "#0a0a0f",
      myBtnColor: d.btnColor || "#7c3aed",
      myBtnText: d.btnTextColor || "#ffffff",
      myTextColor: d.textColor || "#f4f4f5",
      myLogo: d.logo || "",
      myTitleSize: d.titleSize || "normal",
      myBgVideo: d.bgVideo || ""
    };
    Object.keys(map).forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = map[id];
    });
    const tfa = document.getElementById("my2FA");
    if (tfa) tfa.checked = !!d.require2FA;
    try { refreshLinkedAccountsUI(d.linkedAccounts || {}); } catch (e) {}
    document.getElementById("mySocialEditor").innerHTML = "";
    (d.socials || []).forEach(s => {
      addMySocialRow(s.icon, s.label, s.url, s.effect, s.sub, s.thumb, s.type, s.display);
      const last = document.getElementById("mySocialEditor")?.lastElementChild;
      if (last && s.color) {
        const c = last.querySelector(".soc-color");
        if (c) c.value = s.color;
      }
    });
    if (!(d.socials || []).length) addMySocialRow("💬", "Discord", "https://discord.gg/", "normal", "", "", "link", "classic");
    window._myPlaylist = d.playlist || [];
    renderMyPlaylistEditor();
    window._myGallery = d.gallery || [];
    renderMyGalleryEditor();
    window._myAnime = d.animeList || [];
    renderMyAnimeEditor();
    window._myBlocks = d.blocks || [];
    renderMyBlocksEditor();
    const statusSel = document.getElementById("myStatus");
    if (statusSel) statusSel.value = d.statusManual || "auto";
    const sp = document.getElementById("mySpotify");
    if (sp) sp.value = d.spotify || "";
    const link = d.username ? "Ton lien : " + location.origin + location.pathname + "?u=" + d.username : "";
    document.getElementById("myProfileLink").textContent = link;
    const st = document.getElementById("emailVerifyStatus");
    if (st && auth.currentUser) {
      st.textContent = auth.currentUser.emailVerified
        ? "Email : confirmé ✓"
        : "Email : non confirmé — vérifie ta boîte";
      st.style.color = auth.currentUser.emailVerified ? "#4ade80" : "#fbbf24";
    }
    syncDesignChips();
  } catch (e) {
    console.error(e);
  }
}



// ===== INBOX LIVE + SOUND + SEEN + DELETE =====
let _inboxPoll = null;
let _lastUnreadCount = 0;
let _notifAudio = null;

function playNotifSound() {
  try {
    if (!rateLimit("notif-sound", 3, 10000)) return; // max 3 sons / 10s
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880;
    g.gain.value = 0.08;
    o.start();
    setTimeout(() => { o.frequency.value = 1175; }, 80);
    setTimeout(() => { o.stop(); ctx.close(); }, 200);
  } catch (e) {}
}

function startInboxWatch() {
  if (_inboxPoll) clearInterval(_inboxPoll);
  if (!currentUser) return;
  refreshUnreadBadge();
  // poll badge + if inbox list open refresh
  _inboxPoll = setInterval(() => {
    refreshUnreadBadge();
    const list = document.getElementById("inboxList");
    if (list && list.style.display !== "none" && document.getElementById("inboxModal")?.classList.contains("open")) {
      loadInboxList();
    }
  }, 5000);
}

async function refreshUnreadBadge() {
  if (!currentUser) return;
  try {
    const snap = await db.collection("dms")
      .where("members", "array-contains", currentUser.uid)
      .limit(40)
      .get();
    let count = 0;
    snap.forEach(d => {
      const t = d.data();
      if (t.unread && t.unread[currentUser.uid]) count++;
    });
    const badge = document.getElementById("inboxFabBadge");
    const badge2 = document.getElementById("inboxBadge");
    [badge, badge2].forEach(b => {
      if (!b) return;
      if (count > 0) {
        b.style.display = "flex";
        b.textContent = String(count);
      } else {
        b.style.display = "none";
      }
    });
    if (count > _lastUnreadCount && _lastUnreadCount >= 0) {
      playNotifSound();
      xNotify("Nouveau message privé", {
        type: "info",
        title: "Messages",
        body: count === 1 ? "1 conversation non lue" : count + " conversations non lues",
        duration: 4500,
        onClick: () => openInbox()
      });
    }
    _lastUnreadCount = count;
  } catch (e) {}
}

// ===== INBOX =====
let currentThreadId = null;
let currentThreadPeer = null;

function openInbox() {
  if (!currentUser) return openModal(false);
  document.getElementById("inboxModal").classList.add("open");
  document.getElementById("inboxList").style.display = "block";
  document.getElementById("inboxThread").style.display = "none";
  document.getElementById("inboxNew").style.display = "none";
  document.getElementById("inboxNewBtn").style.display = "block";
  loadInboxList();
}
function closeInbox() {
  document.getElementById("inboxModal").classList.remove("open");
}
function showNewDm() {
  document.getElementById("inboxList").style.display = "none";
  document.getElementById("inboxThread").style.display = "none";
  document.getElementById("inboxNew").style.display = "block";
  document.getElementById("inboxNewBtn").style.display = "none";
}
function backToInboxList() {
  currentThreadId = null;
  document.getElementById("inboxList").style.display = "block";
  document.getElementById("inboxThread").style.display = "none";
  document.getElementById("inboxNew").style.display = "none";
  document.getElementById("inboxNewBtn").style.display = "block";
  loadInboxList();
}

function threadIdFor(uidA, uidB) {
  return [uidA, uidB].sort().join("_");
}

async function loadInboxList() {
  const box = document.getElementById("inboxList");
  if (!box || !currentUser) return;
  try {
    const snap = await db.collection("dms")
      .where("members", "array-contains", currentUser.uid)
      .limit(40)
      .get();
    if (snap.empty) {
      box.innerHTML = '<p class="hint" style="text-align:center;padding:20px">Aucun message</p>';
      return;
    }
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    items.sort((a, b) => {
      const ta = a.updatedAt?.toMillis?.() || 0;
      const tb = b.updatedAt?.toMillis?.() || 0;
      return tb - ta;
    });
    box.innerHTML = items.map(t => {
      const peer = (t.memberInfo || []).find(m => m.uid !== currentUser.uid) || {};
      const preview = t.lastMessage || "";
      const unread = t.unread && t.unread[currentUser.uid];
      return `<div class="dm-item ${unread ? "unread" : ""}" onclick="openThread('${t.id}','${esc(peer.username || "")}','${esc(peer.displayName || peer.username || "User")}')">
        <div class="dm-name">${esc(peer.displayName || peer.username || "User")}</div>
        <div class="dm-preview">${esc(preview)}</div>
      </div>`;
    }).join("");
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="hint">Erreur chargement inbox</p>';
  }
}

async function openThread(tid, peerUser, peerName) {
  currentThreadId = tid;
  currentThreadPeer = peerUser;
  document.getElementById("inboxList").style.display = "none";
  document.getElementById("inboxNew").style.display = "none";
  document.getElementById("inboxNewBtn").style.display = "none";
  document.getElementById("inboxThread").style.display = "block";
  document.getElementById("threadWith").innerHTML = "→ " + esc(peerName) +
    ' <button class="btn-danger" style="float:right" onclick="deleteDmThread(\''+tid+'\')">Suppr conv</button>';
  try {
    await db.collection("dms").doc(tid).set(
      { ["unread." + currentUser.uid]: false },
      { merge: true }
    );
  } catch (e) {}
  refreshUnreadBadge();
  loadThreadMsgs(tid);
  }

let _dmUnsub = null;
function loadThreadMsgs(tid) {
  const box = document.getElementById("threadMsgs");
  if (!box) return;
  if (_dmUnsub) { try { _dmUnsub(); } catch(e) {} _dmUnsub = null; }
  try {
    _dmUnsub = db.collection("dms").doc(tid).collection("messages").orderBy("at", "asc").limit(100)
      .onSnapshot(snap => {
        const batch = [];
        snap.docs.forEach(d => {
          const m = d.data();
          if (currentUser && m.uid !== currentUser.uid && !m.seenBy) {
            batch.push(d.ref.set({ seenBy: currentUser.uid, seenAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true }));
          }
        });
        if (batch.length) Promise.all(batch).catch(() => {});

        (async () => {
          const other = (tid.split("_").find(id => currentUser && id !== currentUser.uid)) || "";
          const parts = await Promise.all(snap.docs.map(async d => {
            const m = d.data();
            const mine = currentUser && m.uid === currentUser.uid;
            const time = m.at && m.at.toDate ? m.at.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "";
            const seen = mine && m.seenBy ? '<span class="cm-seen"> · Vu</span>' : (mine ? '<span> · Envoyé</span>' : '');
            const del = `<button class="cm-del" onclick="deleteDmMsg('${tid}','${d.id}')" title="Supprimer">✕</button>`;
            let body = m.text || "";
            try {
              if (typeof decryptDmText === "function" && other) body = await decryptDmText(body, other);
              else if (typeof decryptPublicText === "function") body = await decryptPublicText(body);
            } catch (e) {}
            return `<div class="chat-msg ${mine ? "mine" : ""}" style="text-align:${mine ? "right" : "left"}">
              <span class="cm-user">${mine ? "Moi" : esc(m.displayName || "")}</span>
              ${esc(body)} ${del}
              <div class="cm-meta">${time}${seen}</div>
            </div>`;
          }));
          box.innerHTML = parts.join("") || '<div class="loading">Aucun message</div>';
          box.scrollTop = box.scrollHeight;
        })();
      }, err => {
        console.log(err);
        box.innerHTML = '<div class="loading">Erreur live</div>';
      });
  } catch (e) {
    box.innerHTML = '<div class="loading">Erreur</div>';
  }
}

async function deleteDmMsg(tid, msgId) {
  if (!currentUser || !confirm("Supprimer ce message ?")) return;
  try {
    await db.collection("dms").doc(tid).collection("messages").doc(msgId).delete();
    loadThreadMsgs(tid);
  } catch (e) {
    alert("Impossible de supprimer: " + e.message);
  }
}

async function deleteDmThread(tid) {
  if (!currentUser || !confirm("Supprimer toute la conversation ?")) return;
  try {
    const msgs = await db.collection("dms").doc(tid).collection("messages").limit(100).get();
    for (const d of msgs.docs) await d.ref.delete();
    await db.collection("dms").doc(tid).delete();
    backToInboxList();
  } catch (e) {
    alert(e.message);
  }
}

async function sendDm(e) {
  e.preventDefault();
  if (!currentUser || !currentThreadId) return;
  if (await checkMuted()) return alert("Mute");
  const input = document.getElementById("dmInput");
  let text = input.value.trim().slice(0, 500);
  if (!text) return;
  let displayName = "User";
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) displayName = u.data().displayName || u.data().username || "User";
  } catch (e) {}
  const other = (currentThreadId.split("_").find(id => id !== currentUser.uid)) || "";
  let storeText = text;
  try {
    if (other && typeof encryptDmText === "function") storeText = await encryptDmText(text, other);
  } catch (e) {}
  await db.collection("dms").doc(currentThreadId).collection("messages").add({
    text: storeText, uid: currentUser.uid, displayName, enc: true,
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
  await db.collection("dms").doc(currentThreadId).set({
    lastMessage: "🔒 Message chiffré",
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    ["unread." + other]: true
  }, { merge: true });
  input.value = "";
  loadThreadMsgs(currentThreadId);
}

async function startDm() {
  if (!currentUser) return;
  const toUser = document.getElementById("dmToUser").value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const text = document.getElementById("dmFirstMsg").value.trim().slice(0, 500);
  if (!toUser || !text) return alert("Pseudo + message requis");
  const snap = await db.collection("users").where("username", "==", toUser).limit(1).get();
  if (snap.empty) return alert("Utilisateur introuvable");
  const peer = snap.docs[0];
  const peerData = peer.data();
  if (peer.id === currentUser.uid) return alert("Tu ne peux pas t'écrire à toi-même");
  const tid = threadIdFor(currentUser.uid, peer.id);
  let me = { uid: currentUser.uid, username: "", displayName: "User" };
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) {
      me.username = u.data().username || "";
      me.displayName = u.data().displayName || me.username;
    }
  } catch (e) {}
  await db.collection("dms").doc(tid).set({
    members: [currentUser.uid, peer.id],
    memberInfo: [
      me,
      { uid: peer.id, username: peerData.username || toUser, displayName: peerData.displayName || toUser }
    ],
    lastMessage: text.slice(0, 80),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    unread: { [peer.id]: true, [currentUser.uid]: false }
  }, { merge: true });
  await db.collection("dms").doc(tid).collection("messages").add({
    text, uid: currentUser.uid, displayName: me.displayName,
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("dmToUser").value = "";
  document.getElementById("dmFirstMsg").value = "";
  openThread(tid, toUser, peerData.displayName || toUser);
}

function dmThisProfile() {
  if (!currentUser) return openModal(false);
  if (!viewingUser || !viewingUser.username) return;
  openInbox();
  showNewDm();
  document.getElementById("dmToUser").value = viewingUser.username;
}

// show msg button on profile
const _origRenderProfile = typeof renderProfileView === "function" ? renderProfileView : null;


// ===== EMOJI PICKER =====
const EMOJIS = "😀😃😄😁😆😅🤣😂🙂🙃😉😊😇🥰😍🤩😘😗☺😚😙🥲😋😛😜🤪😝🤑🤗🤭🤫🤔🤐🤨😐😑😶😏😒🙄😬😮‍💨🤥😌😔😪🤤😴😷🤒🤕🤢🤮🤧🥵🥶🥴😵🤯🤠🥳🥸😎🤓🧐😕😟🙁☹😮😯😲😳🥺😦😧😨😰😥😢😭😱😖😣😞😓😩😫🥱😤😡😠🤬😈👿💀☠💩🤡👹👺👻👽👾🤖😺😸😹😻😼😽🙀😿😾👋🤚🖐✋🖖👌🤌🤏✌🤞🤟🤘🤙👈👉👆🖕👇☝👍👎✊👊🤛🤜👏🙌👐🤲🤝🙏✍💅🤳💪🦾🦿🦵🦶👂🦻👃🧠🫀🫁🦷🦴👀👁👅👄💋🩸❤️🧡💛💚💙💜🖤🤍🤎💔❣️💕💞💓💗💖💘💝💟🔥✨⭐🌟💫⚡☀️🌙🌈☁️🌊🌹🥀🌺🌸🌼🌻🍀🍂🍁🎵🎶💬💭🗨".split(/(?:)/u).filter(e => e.trim());

let _emojiTarget = null;

function toggleEmoji(inputId, ev) {
  if (ev) ev.preventDefault();
  const picker = document.getElementById("emojiPicker");
  if (!picker) return;
  if (picker.style.display === "grid" && _emojiTarget === inputId) {
    picker.style.display = "none";
    return;
  }
  _emojiTarget = inputId;
  if (!picker.dataset.ready) {
    picker.innerHTML = EMOJIS.map(e => `<span onclick="insertEmoji('${e}')">${e}</span>`).join("");
    picker.dataset.ready = "1";
  }
  const btn = ev && ev.currentTarget;
  if (btn) {
    const r = btn.getBoundingClientRect();
    picker.style.left = Math.min(r.left, window.innerWidth - 300) + "px";
    picker.style.top = Math.max(8, r.top - 230) + "px";
  }
  picker.style.display = "grid";
}

function insertEmoji(emoji) {
  const el = document.getElementById(_emojiTarget);
  if (!el) return;
  const start = el.selectionStart || el.value.length;
  const end = el.selectionEnd || el.value.length;
  el.value = el.value.slice(0, start) + emoji + el.value.slice(end);
  el.focus();
  const pos = start + emoji.length;
  try { el.setSelectionRange(pos, pos); } catch (e) {}
}

document.addEventListener("click", (e) => {
  const picker = document.getElementById("emojiPicker");
  if (!picker || picker.style.display === "none") return;
  if (!picker.contains(e.target) && !e.target.classList.contains("emoji-btn")) {
    picker.style.display = "none";
  }
});

// Add emoji on comment forms dynamically after feed load
function attachCommentEmojis() {
  document.querySelectorAll(".comment-form").forEach(form => {
    if (form.dataset.emoji) return;
    form.dataset.emoji = "1";
    const input = form.querySelector("input");
    if (!input || !input.id) {
      input.id = "cmt_" + Math.random().toString(36).slice(2, 8);
    }
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "emoji-btn";
    btn.textContent = "😀";
    btn.onclick = (ev) => toggleEmoji(input.id, ev);
    form.insertBefore(btn, form.firstChild);
  });
}

// ===== HOME VIDEOS =====
async function loadHomeVideos() {
  const box = document.getElementById("homeVideos");
  const section = document.getElementById("homeVideosSection");
  if (!box) return;
  try {
    let snap;
    try {
      snap = await db.collection("videos").orderBy("createdAt", "desc").limit(10).get();
    } catch (e) {
      snap = await db.collection("videos").limit(10).get();
    }
    if (snap.empty) {
      if (section) section.style.display = "none";
      return;
    }
    if (section) section.style.display = "block";
    box.innerHTML = snap.docs.map(d => {
      const v = d.data();
      const embed = videoEmbed(v.url);
      return `<div class="video-card"><div class="vc-title">${esc(v.title || "Vidéo")}</div>${embed}</div>`;
    }).join("");
  } catch (e) {
    console.error("loadHomeVideos", e);
    if (section) {
      section.style.display = "block";
      box.innerHTML = '<p class="hint">Impossible de charger les vidéos</p>';
    }
  }
}

function videoEmbed(url) {
  if (!url) return '<p class="hint">Lien vidéo manquant</p>';
  url = String(url).trim();
  // YouTube: watch, youtu.be, embed, shorts, live, mobile
  let m = url.match(/(?:youtube\.com\/(?:watch\?.*?v=|embed\/|shorts\/|live\/)|youtu\.be\/|youtube-nocookie\.com\/embed\/)([\w-]{11})/);
  if (!m) m = url.match(/[?&]v=([\w-]{11})/);
  if (m) {
    const id = m[1];
    return '<div class="yt-wrap"><iframe src="https://www.youtube.com/embed/' + id + '?rel=0" title="YouTube" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe></div>';
  }
  m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (m) {
    return '<div class="yt-wrap"><iframe src="https://player.vimeo.com/video/' + m[1] + '" allowfullscreen loading="lazy"></iframe></div>';
  }
  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return '<video controls playsinline src="' + esc(url) + '" style="width:100%;border-radius:12px"></video>';
  }
  return '<p class="hint">Lien non reconnu — utilise un lien YouTube complet</p><a class="link" href="' + esc(url) + '" target="_blank" rel="noopener">Ouvrir le lien</a>';
}

async function addHomeVideo() {
  if (!isAdmin) return;
  const title = document.getElementById("videoTitle").value.trim();
  const url = document.getElementById("videoUrl").value.trim();
  if (!url) return alert("Lien requis");
  await db.collection("videos").add({
    title: title || "Vidéo",
    url,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  document.getElementById("videoTitle").value = "";
  document.getElementById("videoUrl").value = "";
  loadHomeVideos();
  loadAndApplyHomeConfig();
  loadFriends();
  loadAdminVideos();
  loadAdminVoiceUI();
  loadHomeConfigForm();
  alert("Vidéo ajoutée !");
}

async function loadAdminVideos() {
  const box = document.getElementById("adminVideos");
  if (!box) return;
  try {
    const snap = await db.collection("videos").limit(20).get();
    box.innerHTML = snap.docs.map(d => {
      const v = d.data();
      return `<div class="admin-track"><span>${esc(v.title)}</span>
        <button class="btn-danger" onclick="deleteHomeVideo('${d.id}')">Suppr</button></div>`;
    }).join("") || '<p class="hint">Aucune vidéo</p>';
  } catch (e) {}
}

async function deleteHomeVideo(id) {
  if (!isAdmin || !confirm("Supprimer ?")) return;
  await db.collection("videos").doc(id).delete();
  loadHomeVideos();
  loadAndApplyHomeConfig();
  loadFriends();
  loadAdminVideos();
  loadAdminVoiceUI();
  loadHomeConfigForm();
}


async function loadHomeConfigForm() {
  try {
    const doc = await db.collection("settings").doc("site").get();
    const c = doc.exists ? doc.data() : {};
    const st = document.getElementById("cfgSiteTitle");
    if (st) st.value = c.siteTitle || "XULTRA";
    const ss = document.getElementById("cfgSiteSub");
    if (ss) ss.value = c.siteSub || "ta bulle";
    const xu = document.getElementById("cfgXUser");
    if (xu) xu.value = c.xUser || "X";
    const lv = document.getElementById("cfgLofiVol");
    if (lv) lv.value = c.lofiVol != null ? c.lofiVol : 0.4;
    const la = document.getElementById("cfgLofiAuto");
    if (la) la.checked = c.lofiAuto !== false;
    const ly = document.getElementById("cfgLayout");
    if (ly) ly.value = c.layout || "3col";
    const hp = document.getElementById("homeLayoutPreset");
    if (hp) hp.value = c.layoutPreset || "default";
    renderHomeBlockOrderUI(c.blockOrder || HOME_BLOCKS_DEFAULT);
    const hw = c.hubWidgets || { changelog: true };
    ["weather", "online", "changelog", "chat", "lives"].forEach(k => {
      const el = document.getElementById("hubWenable-" + k);
      if (el) el.checked = !!hw[k];
    });
    const m = document.getElementById("cfgMaintenance");
    if (m) m.checked = !!c.maintenance;
    const mm = document.getElementById("cfgMaintMsg");
    if (mm) mm.value = c.maintenanceMsg || "Des changements sont en cours et des bugs sont en train d’être corrigés. Nous reviendrons bientôt.";
  } catch (e) {
    renderHomeBlockOrderUI(HOME_BLOCKS_DEFAULT);
  }
}

async function saveHomeConfig() {
  if (!isAdmin) return alert("Accès admin requis");
  const hubWidgets = {};
  ["weather", "online", "changelog", "chat", "lives"].forEach(k => {
    hubWidgets[k] = !!document.getElementById("hubWenable-" + k)?.checked;
  });
  const data = {
    siteTitle: document.getElementById("cfgSiteTitle")?.value.trim() || "XULTRA",
    siteSub: document.getElementById("cfgSiteSub")?.value.trim() || "",
    xUser: (document.getElementById("cfgXUser")?.value.trim() || "X").replace("@", ""),
    lofiVol: parseFloat(document.getElementById("cfgLofiVol")?.value || "0.4"),
    lofiAuto: !!document.getElementById("cfgLofiAuto")?.checked,
    layout: document.getElementById("cfgLayout")?.value || "3col",
    layoutPreset: document.getElementById("homeLayoutPreset")?.value || "default",
    blockOrder: window._homeBlockOrder || HOME_BLOCKS_DEFAULT,
    hubWidgets,
    maintenance: !!document.getElementById("cfgMaintenance")?.checked,
    maintenanceMsg: (document.getElementById("cfgMaintMsg")?.value || "").trim().slice(0, 500)
  };
  try {
    await db.collection("settings").doc("site").set(data, { merge: true });
    applyHomeConfig(data);
    applyHubWidgets(data.hubWidgets || {});
    applyMaintenanceMode(data);
    alert("Accueil enregistré !");
  } catch (e) {
    console.error(e);
    alert("Erreur enregistrement accueil : " + (e.message || e));
  }
}

function applyHomeConfig(c) {
  if (!c) return;
  // Homepage never inherits profile particles
  try { setParticles("none"); } catch (e) {}
  window._lofiVol = c.lofiVol != null ? c.lofiVol : 0.4;
  const audio = document.getElementById("audio");
  if (audio) audio.volume = window._lofiVol;
  const sub = document.getElementById("siteSubLabel");
  if (sub) sub.textContent = c.siteSub || "ta bulle";
  applyHomeLayoutPreset(c.layoutPreset || "default");
  applyHomeBlockOrder(c.blockOrder || HOME_BLOCKS_DEFAULT);
  const grid = document.getElementById("appGrid");
  if (grid && (!c.layoutPreset || c.layoutPreset === "default")) {
    grid.classList.remove("layout-2col", "layout-feed");
    if (c.layout === "2col") grid.style.gridTemplateColumns = "280px 1fr";
    else if (c.layout === "feed") grid.style.gridTemplateColumns = "1fr minmax(280px, 320px)";
    else if (!c.layoutPreset || c.layoutPreset === "default") grid.style.gridTemplateColumns = "";
  }
  // X embed
  if (c.xUser) {
    const link = document.getElementById("xTimelineLink");
    const box = document.getElementById("xEmbedBox");
    if (link && box) {
      box.innerHTML = "";
      const a = document.createElement("a");
      a.className = "twitter-timeline";
      a.setAttribute("data-theme", "dark");
      a.setAttribute("data-height", "420");
      const xu = String(c.xUser || "X").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 30) || "X";
      a.href = "https://twitter.com/" + xu + "?ref_src=twsrc%5Etfw";
      a.textContent = "Posts de @" + xu;
      box.appendChild(a);
      if (window.twttr && window.twttr.widgets) window.twttr.widgets.load(box);
    }
  }
  if (c.lofiAuto && playlist.length && !isPlaying) {
    setTimeout(() => {
      try {
        const audio = document.getElementById("audio");
        audio.volume = window._lofiVol || 0.4;
        audio.play().then(() => { setPlayButtons("⏸️"); isPlaying = true; }).catch(() => {});
      } catch (e) {}
    }, 1500);
  }
}

async function loadAndApplyHomeConfig() {
  try {
    const doc = await db.collection("settings").doc("site").get();
    if (doc.exists) {
      const c = doc.data();
      applyHomeConfig(c);
      applyHubWidgets(c.hubWidgets || { changelog: true });
      applyMaintenanceMode(c);
      window._siteSettings = c;
    } else {
      applyHomeConfig({ lofiVol: 0.4, lofiAuto: true, xUser: "X", layout: "3col" });
      applyHubWidgets({ changelog: true });
    }
  } catch (e) {
    applyHomeConfig({ lofiVol: 0.4, lofiAuto: true, xUser: "X" });
  }
}

// ===== HUB WIDGETS =====
function applyHubWidgets(hw) {
  hw = hw || {};
  const map = {
    weather: "hubW-weather",
    online: "hubW-online",
    changelog: "hubW-changelog",
    chat: "hubW-chat",
    lives: "hubW-lives"
  };
  Object.keys(map).forEach(k => {
    const el = document.getElementById(map[k]);
    if (el) el.style.display = hw[k] ? "block" : "none";
  });
  if (hw.weather) refreshHubWeather();
  if (hw.online) refreshHubOnline();
  if (hw.changelog) refreshHubChangelog();
  if (hw.chat) refreshHubChat();
  if (hw.lives) refreshHubLives();
}

function refreshHubWeather() {
  const body = document.getElementById("hubWeatherBody");
  if (!body) return;
  const icon = document.getElementById("wxIcon")?.textContent || "☁";
  const temp = document.getElementById("wxTemp")?.textContent || "—°";
  const city = document.getElementById("wxCity")?.textContent || "";
  const desc = document.getElementById("wxDesc")?.textContent || "";
  body.innerHTML = `<div style="font-size:1.4rem">${esc(icon)} ${esc(temp)}</div>
    <div class="hint">${esc(city)}</div><div class="hint">${esc(desc)}</div>`;
}

function refreshHubOnline() {
  const body = document.getElementById("hubOnlineBody");
  if (!body) return;
  const n = document.getElementById("onlineBadge")?.textContent || "0 en ligne";
  body.textContent = n;
}

function refreshHubChangelog() {
  const body = document.getElementById("hubChangelogBody");
  if (!body) return;
  const items = document.querySelectorAll(".cl-item");
  if (!items.length) {
    body.innerHTML = '<span class="hint">Pas encore d’entrées</span>';
    return;
  }
  body.innerHTML = Array.from(items).slice(0, 8).map(it => {
    const date = it.querySelector(".cl-date")?.textContent || "";
    const tag = it.querySelector(".cl-tag")?.textContent || "";
    const text = it.textContent.replace(date, "").replace(tag, "").trim();
    return `<div class="hw-cl-row"><span class="hw-cl-date">${esc(date)}</span>
      <span class="badge">${esc(tag)}</span> ${esc(text.slice(0, 80))}</div>`;
  }).join("");
}

let _hubChatUnsub = null;
function refreshHubChat() {
  const body = document.getElementById("hubChatBody");
  if (!body) return;
  if (_hubChatUnsub) { try { _hubChatUnsub(); } catch (e) {} _hubChatUnsub = null; }
  try {
    _hubChatUnsub = db.collection("chat").orderBy("at", "desc").limit(15)
      .onSnapshot(async snap => {
        const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() })).reverse();
        const parts = await Promise.all(msgs.map(async m => {
          let t = m.text || "";
          try { if (typeof decryptPublicText === "function") t = await decryptPublicText(t); } catch (e) {}
          return `<div class="hw-chat-line"><strong>${esc(m.displayName || m.username || "?")}</strong> ${esc(t)}</div>`;
        }));
        body.innerHTML = parts.join("") || '<span class="hint">Aucun message</span>';
        body.scrollTop = body.scrollHeight;
      }, () => { body.innerHTML = '<span class="hint">Chat indisponible</span>'; });
  } catch (e) {
    body.innerHTML = '<span class="hint">Chat indisponible</span>';
  }
}

async function sendHubChat(e) {
  e.preventDefault();
  const input = document.getElementById("hubChatInput");
  const main = document.getElementById("chatInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  if (main) main.value = text;
  input.value = "";
  try {
    if (typeof sendChat === "function") {
      const fake = { preventDefault() {} };
      await sendChat(fake);
    }
  } catch (err) {
    alert("Impossible d’envoyer");
  }
}

async function refreshHubLives() {
  const body = document.getElementById("hubLivesBody");
  if (!body) return;
  try {
    const snap = await db.collection("users").limit(80).get();
    const lives = [];
    snap.forEach(doc => {
      const u = doc.data();
      if (u.stream && u.stream.isLive && u.stream.channel) {
        lives.push(u);
      }
    });
    if (!lives.length) {
      body.innerHTML = '<span class="hint">Aucun live en cours</span>';
      return;
    }
    body.innerHTML = lives.map(u =>
      `<button type="button" class="hw-live-row" onclick="showUserProfile('${esc(u.username || "")}')">
        <span class="xstream-live-badge">● LIVE</span>
        <strong>${esc(u.displayName || u.username || "?")}</strong>
        <span class="hint">${esc(u.stream.title || u.stream.platform || "")}</span>
      </button>`
    ).join("");
  } catch (e) {
    body.innerHTML = '<span class="hint">—</span>';
  }
}

// ===== MAINTENANCE MODE =====
function isStaffUser() {
  return !!(isAdmin || window._isMod);
}

function applyMaintenanceMode(c) {
  c = c || window._siteSettings || {};
  const on = !!c.maintenance;
  window._maintenanceOn = on;
  const view = document.getElementById("maintenanceView");
  if (!view) return;
  const msg = document.getElementById("maintDesc");
  if (msg && c.maintenanceMsg) msg.textContent = c.maintenanceMsg;

  if (on && !isStaffUser()) {
    hideAllMainViews();
    view.style.display = "flex";
    const lofi = document.getElementById("lofiBg");
    if (lofi) lofi.style.display = "none";
    try { fillMaintChangelog(); } catch (e) {}
    try { initMaintPlayer(); } catch (e) {}
  } else {
    view.style.display = "none";
    try { maintStop(); } catch (e) {}
  }
}

function fillMaintChangelog() {
  const box = document.getElementById("maintChangelogList");
  if (!box) return;
  const items = document.querySelectorAll(".cl-item");
  if (!items.length) {
    box.innerHTML = '<p class="hint">Aucune entrée pour le moment.</p>';
    return;
  }
  box.innerHTML = Array.from(items).slice(0, 20).map(it => {
    const date = it.querySelector(".cl-date")?.textContent || "";
    const tag = it.querySelector(".cl-tag")?.textContent || "";
    let text = it.textContent || "";
    if (date) text = text.replace(date, "");
    if (tag) text = text.replace(tag, "");
    text = text.trim();
    return `<div class="maint-cl-item">
      <span class="maint-cl-date">${esc(date)}</span>
      <span class="badge">${esc(tag)}</span>
      <span class="maint-cl-text">${esc(text)}</span>
    </div>`;
  }).join("");
}

window._maintPlaylist = [];
window._maintIdx = 0;
window._maintPlaying = false;

async function initMaintPlayer() {
  const list = document.getElementById("maintPlaylistList");
  try {
    let snap;
    try {
      snap = await db.collection("playlist").orderBy("createdAt", "asc").get();
    } catch (e) {
      snap = await db.collection("playlist").get();
    }
    window._maintPlaylist = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    window._maintPlaylist = (typeof playlist !== "undefined" && playlist.length) ? playlist.slice() : [];
  }
  renderMaintPlaylist();
  if (window._maintPlaylist.length) {
    maintLoad(window._maintIdx || 0, false);
  } else if (list) {
    list.innerHTML = '<p class="hint">Aucune musique dans la playlist globale.</p>';
  }
  const audio = document.getElementById("maintAudio");
  if (audio && !audio._maintBound) {
    audio._maintBound = true;
    audio.addEventListener("ended", () => maintNext());
    audio.addEventListener("play", () => {
      window._maintPlaying = true;
      const b = document.getElementById("maintPlayBtn");
      if (b) b.textContent = "⏸️";
    });
    audio.addEventListener("pause", () => {
      window._maintPlaying = false;
      const b = document.getElementById("maintPlayBtn");
      if (b) b.textContent = "▶️";
    });
  }
}

function renderMaintPlaylist() {
  const box = document.getElementById("maintPlaylistList");
  if (!box) return;
  const pl = window._maintPlaylist || [];
  if (!pl.length) {
    box.innerHTML = '<p class="hint">Playlist vide</p>';
    return;
  }
  box.innerHTML = pl.map((t, i) =>
    `<button type="button" class="mp-pl-item ${i === window._maintIdx ? "active" : ""}" onclick="maintLoad(${i}, true)">
      <span class="mp-pl-num">${i + 1}</span>
      <span class="mp-pl-info"><strong>${esc(t.title || "Sans titre")}</strong>
      <span class="hint">${esc(t.artist || "")}</span></span>
    </button>`
  ).join("");
}

function maintLoad(i, autoplay) {
  const pl = window._maintPlaylist || [];
  if (!pl.length) return;
  window._maintIdx = ((i % pl.length) + pl.length) % pl.length;
  const t = pl[window._maintIdx];
  const audio = document.getElementById("maintAudio");
  const title = document.getElementById("maintTrackTitle");
  const artist = document.getElementById("maintTrackArtist");
  if (title) title.textContent = t.title || "Sans titre";
  if (artist) artist.textContent = t.artist || "Playlist XULTRA";
  if (audio) {
    audio.src = t.url || t.src || "";
    const vol = document.getElementById("maintVol");
    if (vol) audio.volume = parseFloat(vol.value) || 0.4;
    if (autoplay) audio.play().catch(() => {});
  }
  renderMaintPlaylist();
}

function maintToggle() {
  const audio = document.getElementById("maintAudio");
  if (!audio) return;
  if (!audio.src) {
    maintLoad(window._maintIdx || 0, true);
    return;
  }
  if (audio.paused) audio.play().catch(() => {});
  else audio.pause();
}

function maintNext() {
  maintLoad((window._maintIdx || 0) + 1, true);
}

function maintPrev() {
  maintLoad((window._maintIdx || 0) - 1, true);
}

function maintSetVol(v) {
  const audio = document.getElementById("maintAudio");
  if (audio) audio.volume = parseFloat(v) || 0;
}

function maintStop() {
  const audio = document.getElementById("maintAudio");
  if (audio) {
    try { audio.pause(); } catch (e) {}
  }
  window._maintPlaying = false;
}

async function maintStaffLogin() {
  const email = document.getElementById("maintEmail")?.value.trim();
  const pass = document.getElementById("maintPass")?.value;
  const err = document.getElementById("maintErr");
  if (err) err.textContent = "";
  if (!email || !pass) {
    if (err) err.textContent = "Email + mot de passe";
    return;
  }
  try {
    const cred = await auth.signInWithEmailAndPassword(email, pass);
    // wait profile load
    await new Promise(r => setTimeout(r, 800));
    const ud = await db.collection("users").doc(cred.user.uid).get();
    const d = ud.exists ? ud.data() : {};
    const staff = (cred.user.email === (typeof ADMIN_EMAIL !== "undefined" ? ADMIN_EMAIL : "lordfamily1@proton.me")) || !!d.isMod;
    if (!staff) {
      await auth.signOut();
      if (err) err.textContent = "Compte non autorisé (admin/modo uniquement)";
      return;
    }
    window._isMod = !!d.isMod;
    isAdmin = cred.user.email === (typeof ADMIN_EMAIL !== "undefined" ? ADMIN_EMAIL : "lordfamily1@proton.me");
    document.getElementById("maintenanceView").style.display = "none";
    showHome();
    xNotify("Accès staff maintenance", { type: "ok" });
  } catch (e) {
    if (err) err.textContent = e.message || "Erreur connexion";
  }
}

// re-check maintenance after auth
(function hookMaintAuth() {
  try {
    auth.onAuthStateChanged(() => {
      setTimeout(() => {
        try { applyMaintenanceMode(window._siteSettings || {}); } catch (e) {}
        try {
          const hw = (window._siteSettings && window._siteSettings.hubWidgets) || {};
          if (hw.online) refreshHubOnline();
          if (hw.weather) refreshHubWeather();
        } catch (e) {}
      }, 600);
    });
  } catch (e) {}
})();


function applyProfileDesign(u) {
  const pv = document.getElementById("profileView");
  if (!pv) return;
  const theme = u.theme || "violet";
  const font = u.font || "inter";
  const header = u.headerLayout || "classic";
  const btnStyle = u.btnStyle || "fill";
  const btnShape = u.btnShape || "rounded";
  const bgType = u.bgType || "theme";

  pv.className = "container theme-" + theme + " font-" + font;
  const hdr = document.getElementById("pvHeader");
  if (hdr) hdr.className = "pv-header " + header;

  // text colors
  const textC = u.textColor || "#f4f4f5";
  const name = document.getElementById("pvName");
  const handle = document.getElementById("pvHandle");
  const bio = document.getElementById("pvBio");
  if (name) { name.style.color = textC; name.style.webkitTextFillColor = textC; name.style.background = "none"; }
  if (handle) handle.style.color = textC;
  if (bio) bio.style.color = textC;

  // background — priority: video > image/gif > theme/flat
  const pageBg = document.getElementById("pageBg");
  const vbg = document.getElementById("pvBgVideo");
  const gradients = {
    violet: "linear-gradient(160deg,#1a0a2e,#0a0a0f 60%)",
    ocean: "linear-gradient(160deg,#0c1929,#0a0a0f 60%)",
    sunset: "linear-gradient(160deg,#2a1018,#0a0a0f 60%)",
    mint: "linear-gradient(160deg,#0a1f18,#0a0a0f 60%)",
    rose: "linear-gradient(160deg,#2a0a18,#0a0a0f 60%)",
    gold: "linear-gradient(160deg,#1f1808,#0a0a0f 60%)",
    noir: "linear-gradient(160deg,#111,#0a0a0f)",
    neon: "linear-gradient(160deg,#0a1a2a,#1a0a2e 50%,#0a0a0f)",
    pastel: "linear-gradient(160deg,#1a1520,#0a0a0f)",
    forest: "linear-gradient(160deg,#0a1a10,#0a0a0f)"
  };
  const hasVideo = !!(u.bgVideo && String(u.bgVideo).trim());
  const hasImg = !!(u.bg && String(u.bg).trim());
  // stop / hide video first
  if (vbg) {
    if (!hasVideo) {
      try { vbg.pause(); } catch (e) {}
      vbg.removeAttribute("src");
      vbg.load && vbg.load();
      vbg.style.display = "none";
    }
  }
  if (pageBg) {
    pageBg.classList.remove("bg-custom", "bg-image");
    if (hasVideo) {
      pageBg.style.backgroundImage = "none";
      pageBg.style.backgroundColor = "transparent";
      pageBg.classList.add("bg-custom");
      if (vbg) {
        vbg.muted = true;
        vbg.loop = true;
        vbg.playsInline = true;
        vbg.setAttribute("muted", "");
        vbg.setAttribute("playsinline", "");
        const bv = u.bgVideo.trim();
        if (!isSafeMediaUrl(bv)) {
          vbg.style.display = "none";
        } else {
          vbg.src = bv;
          vbg.style.display = "block";
          vbg.style.opacity = "0.88";
          vbg.style.zIndex = "-1";
          const p = vbg.play();
          if (p && p.catch) p.catch(() => {});
        }
      }
    } else if (hasImg) {
      if (vbg) { vbg.style.display = "none"; }
      const url = String(u.bg).trim().replace(/'/g, "%27").replace(/"/g, "%22");
      pageBg.style.backgroundImage = `linear-gradient(rgba(10,10,15,.35),rgba(10,10,15,.55)),url("${url}")`;
      pageBg.style.backgroundSize = "cover";
      pageBg.style.backgroundPosition = "center";
      pageBg.style.backgroundRepeat = "no-repeat";
      pageBg.style.backgroundColor = "#0a0a0f";
      pageBg.classList.add("bg-custom", "bg-image");
    } else if (bgType === "flat") {
      pageBg.style.backgroundImage = "none";
      pageBg.style.backgroundColor = u.bgColor || "#0a0a0f";
    } else {
      pageBg.style.backgroundImage = gradients[theme] || gradients.violet;
      pageBg.style.backgroundColor = "";
    }
  }

  // buttons
  const btnBg = u.btnColor || "#7c3aed";
  const btnTx = u.btnTextColor || "#fff";
  const radius = { pill: "999px", square: "6px", soft: "12px", rounded: "14px" }[btnShape] || "14px";
  const logoW = document.getElementById("pvLogoWrap");
  const logoI = document.getElementById("pvLogo");
  if (logoW && logoI) {
    if (u.logo) { logoI.src = u.logo; logoW.style.display = "block"; }
    else logoW.style.display = "none";
  }
  const nameEl = document.getElementById("pvName");
  if (nameEl) {
    const ts = u.titleSize || "normal";
    nameEl.style.fontSize = ts === "large" ? "2.4rem" : ts === "small" ? "1.2rem" : "";
  }
  const socials = document.getElementById("pvSocials");
  if (socials) {
    socials.querySelectorAll(".link").forEach(a => {
      a.style.borderRadius = radius;
      a.style.color = btnTx || "#fff";
      a.style.border = "1px solid rgba(255,255,255,.2)";
      if (btnStyle === "outline") {
        a.style.background = "rgba(10,10,15,.75)";
        a.style.border = "1.5px solid " + btnBg;
        a.style.color = btnBg;
        a.style.boxShadow = "none";
      } else if (btnStyle === "glass") {
        a.style.background = "rgba(20,20,30,.72)";
        a.style.backdropFilter = "blur(12px)";
        a.style.border = "1px solid rgba(255,255,255,.18)";
        a.style.boxShadow = "0 4px 16px rgba(0,0,0,.3)";
      } else if (btnStyle === "glow") {
        a.style.background = btnBg;
        a.style.boxShadow = "0 0 20px " + btnBg + "88";
      } else if (btnStyle === "shadow") {
        a.style.background = btnBg;
        a.style.boxShadow = "0 8px 24px rgba(0,0,0,.45)";
      } else {
        a.style.background = btnBg;
        a.style.boxShadow = "none";
      }
    });
  }
}


// ===== CATBOX MUSIC UPLOAD (like ImgBB) =====
async function uploadMusicFile(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 150 * 1024 * 1024) return alert("Max 150 Mo");
  const status = document.getElementById("musicUploadStatus");
  if (status) { status.textContent = "Upload en cours…"; status.style.color = "#a78bfa"; }
  const fd = new FormData();
  fd.append("reqtype", "fileupload");
  fd.append("fileToUpload", file);
  const endpoints = [
    "https://catbox.moe/user/api.php",
    "https://corsproxy.io/?" + encodeURIComponent("https://catbox.moe/user/api.php"),
    "https://api.allorigins.win/raw?url=" + encodeURIComponent("https://catbox.moe/user/api.php")
  ];
  // allorigins is GET only - skip for POST
  let url = null;
  let lastErr = "";
  for (const ep of ["https://catbox.moe/user/api.php", "https://corsproxy.io/?" + encodeURIComponent("https://catbox.moe/user/api.php")]) {
    try {
      const res = await fetch(ep, { method: "POST", body: fd });
      const text = (await res.text()).trim();
      if (text.startsWith("http")) { url = text; break; }
      lastErr = text;
    } catch (e) {
      lastErr = e.message;
    }
  }
  if (url) {
    const target = input.dataset.target || "musicUrl";
    const el = document.getElementById(target);
    if (el) el.value = url;
    if (target === "myTrackUrl") {
      const t = document.getElementById("myTrackTitle");
      if (t && !t.value) t.value = file.name.replace(/\.[^.]+$/, "").slice(0, 60);
    } else {
      const t = document.getElementById("musicTitle");
      if (t && !t.value) t.value = file.name.replace(/\.[^.]+$/, "").slice(0, 60);
    }
    if (status) { status.textContent = "Upload OK !"; status.style.color = "#4ade80"; }
  } else {
    if (status) { status.textContent = "Échec: " + lastErr + " — colle un lien Catbox manuel"; status.style.color = "#f87171"; }
    else alert("Upload bloqué. Va sur catbox.moe, upload, colle le lien.");
  }
  input.value = "";
}


// ===== FRIENDS + STATUS + BADGES =====
const SITE_LAUNCH = new Date("2026-07-28T00:00:00Z").getTime();
const EARLY_UNTIL = SITE_LAUNCH + 90 * 24 * 60 * 60 * 1000; // 3 months

function computeStatus(lastSeen, manual) {
  if (manual && manual !== "auto") return manual;
  let t = 0;
  try { if (lastSeen) t = lastSeen.toDate ? lastSeen.toDate().getTime() : lastSeen; } catch(e) {}
  if (!t) return "offline";
  const diff = Date.now() - t;
  if (diff < 3 * 60 * 1000) return "online";
  if (diff < 15 * 60 * 1000) return "away";
  return "offline";
}

function statusLabel(s) {
  return { online: "En ligne", away: "Absent", offline: "Hors ligne", dnd: "Ne pas déranger" }[s] || "Hors ligne";
}

function computeBadges(u) {
  const badges = [];
  let created = 0;
  try { if (u.createdAt) created = u.createdAt.toDate ? u.createdAt.toDate().getTime() : u.createdAt; } catch(e) {}
  if (created && created < EARLY_UNTIL) {
    badges.push({ id: "early", label: "Early User", icon: "✦", cls: "early" });
  }
  if (u.email === ADMIN_EMAIL || u.isAdmin) {
    badges.push({ id: "admin", label: "Admin", icon: "◆", cls: "admin-badge" });
  }
  if (u.isMod) {
    badges.push({ id: "mod", label: "Mod", icon: "◇", cls: "mod-badge" });
  }
  if (u.verified) {
    badges.push({ id: "verified", label: "Vérifié", icon: "✓", cls: "verified" });
  }
  // custom grade from roles collection
  const grade = resolveUserRole(u);
  if (grade) {
    badges.push({ id: "grade-" + grade.id, label: grade.name, icon: "●", cls: "grade-badge", color: grade.color });
  }
  if (Array.isArray(u.badges)) {
    u.badges.forEach(b => {
      if (b && b.id && !badges.find(x => x.id === b.id)) badges.push(b);
    });
  }
  return badges;
}

function renderBadgesHTML(badges) {
  return badges.map(b => {
    const style = b.color ? `style="border-color:${esc(b.color)};color:${esc(b.color)}"` : "";
    return `<span class="user-badge ${esc(b.cls || "")}" title="${esc(b.label)}" ${style}>${b.icon || "●"} ${esc(b.label)}</span>`;
  }).join("");
}

function resolveUserRole(u) {
  if (!u) return null;
  if (u.email === ADMIN_EMAIL || u.isAdmin) {
    return { id: "admin", name: "Admin", color: "#f472b6", permissions: {}, voicePermissions: {} };
  }
  if (!u.roleId || !_rolesCache || !_rolesCache.length) return null;
  return _rolesCache.find(r => r.id === u.roleId) || null;
}

function roleMiniHTML(u) {
  const r = resolveUserRole(u);
  if (!r) return "";
  const col = r.color || "#a78bfa";
  return `<span class="role-mini" style="color:${esc(col)};border-color:${esc(col)}">${esc(r.name)}</span>`;
}

function roleDetailHTML(u) {
  const r = resolveUserRole(u);
  if (!r) return '<p class="hint">Aucun grade assigné</p>';
  const sitePerms = r.permissions || {};
  const voicePerms = r.voicePermissions || {};
  const siteList = ROLE_PERMS.filter(p => p.zone !== "voice" && sitePerms[p.id])
    .map(p => `<li>${esc(p.label)}</li>`).join("") || "<li class=\"hint\">—</li>";
  const voiceList = ROLE_PERMS.filter(p => p.zone === "voice" && (voicePerms[p.id] || sitePerms[p.id]))
    .map(p => `<li>${esc(p.label)}</li>`).join("") || "<li class=\"hint\">—</li>";
  return `<div class="role-detail-card">
    <div class="role-detail-head">
      <span class="role-dot" style="background:${esc(r.color||"#a78bfa")}"></span>
      <strong style="color:${esc(r.color||"#e9d5ff")}">${esc(r.name)}</strong>
    </div>
    <div class="role-detail-cols">
      <div><div class="hint">Site</div><ul class="role-perm-list">${siteList}</ul></div>
      <div><div class="hint">Vocal</div><ul class="role-perm-list">${voiceList}</ul></div>
    </div>
  </div>`;
}

async function ensureRolesCache() {
  try {
    if (_rolesCache && _rolesCache._loaded && Date.now() - (_rolesCache._ts || 0) < 60000) return;
    const snap = await db.collection("roles").get();
    _rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _rolesCache.sort((a, b) => (b.position || 0) - (a.position || 0));
    _rolesCache._loaded = true;
    _rolesCache._ts = Date.now();
  } catch (e) {
    console.warn(e);
  }
}

async function loadFriends() {
  const box = document.getElementById("friendsList");
  const reqBox = document.getElementById("friendRequests");
  if (!box) return;
  const user = currentUser || auth.currentUser;
  if (!user) {
    box.innerHTML = '<div class="hint" style="padding:8px">Connecte-toi pour voir tes amis</div>';
    if (reqBox) reqBox.innerHTML = "";
    return;
  }
  currentUser = user;
  try {
    const me = await db.collection("users").doc(currentUser.uid).get();
    const myData = me.exists ? me.data() : {};
    const friendIds = myData.friends || [];
    const incoming = myData.friendRequests || [];
    const outgoing = myData.friendOutgoing || [];

    // requests
    if (reqBox) {
      if (!incoming.length) reqBox.innerHTML = "";
      else {
        const parts = [];
        for (const uid of incoming.slice(0, 10)) {
          const u = await db.collection("users").doc(uid).get();
          const d = u.exists ? u.data() : {};
          const name = d.displayName || d.username || "User";
          parts.push(`<div class="fr-req">
            <span style="flex:1">Demande de <strong>${esc(name)}</strong></span>
            <button class="btn" onclick="acceptFriend('${uid}')">✓</button>
            <button class="btn btn-outline" onclick="declineFriend('${uid}')">✕</button>
          </div>`);
        }
        reqBox.innerHTML = parts.join("");
      }
    }

    if (!friendIds.length) {
      box.innerHTML = '<div class="hint" style="padding:8px">Aucun ami — ajoute-en depuis les profils</div>';
      return;
    }

    // load friends data
    const rows = [];
    for (const uid of friendIds.slice(0, 40)) {
      const u = await db.collection("users").doc(uid).get();
      if (!u.exists) continue;
      const d = u.data();
      const st = computeStatus(d.lastSeen, d.statusManual);
      const av = d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.displayName||d.username||"U")}&background=7c3aed&color=fff&size=64`;
      const uname = d.username || uid;
      const badges = computeBadges(d);
      const mini = badges.slice(0, 2).map(b => b.icon || "●").join("");
      const mood = d.mood ? `<span class="friend-mood">· ${esc(d.mood)}</span>` : "";
      rows.push({ st, html: `<div class="friend-row" onclick="showUserProfile('${esc(uname)}')">
        <img src="${esc(av)}" alt="">
        <div class="fr-info">
          <div class="fr-name">${esc(d.displayName||d.username||"User")} ${mini}${mood}</div>
          <div class="fr-status ${st}"><span class="dot"></span>${statusLabel(st)}</div>
        </div>
      </div>` });
    }
    // sort online > away > offline
    const order = { online: 0, away: 1, offline: 2 };
    rows.sort((a, b) => order[a.st] - order[b.st]);
    box.innerHTML = rows.map(r => r.html).join("") || '<div class="hint">Aucun ami</div>';
  } catch (e) {
    console.error(e);
    box.innerHTML = '<div class="hint">Erreur amis</div>';
  }
}

async function sendFriendRequest(targetUid) {
  if (!currentUser || currentUser.uid === targetUid) return;
  try {
    const myRef = db.collection("users").doc(currentUser.uid);
    const theirRef = db.collection("users").doc(targetUid);
    const me = await myRef.get();
    const them = await theirRef.get();
    if (!them.exists) return alert("Utilisateur introuvable");
    const myData = me.data() || {};
    const theirData = them.data() || {};
    if ((myData.friends || []).includes(targetUid)) return alert("Déjà amis");
    if ((myData.friendOutgoing || []).includes(targetUid)) return alert("Demande déjà envoyée");
    // if they already sent us a request, accept
    if ((myData.friendRequests || []).includes(targetUid)) {
      return acceptFriend(targetUid);
    }
    await myRef.set({
      friendOutgoing: firebase.firestore.FieldValue.arrayUnion(targetUid)
    }, { merge: true });
    await theirRef.set({
      friendRequests: firebase.firestore.FieldValue.arrayUnion(currentUser.uid)
    }, { merge: true });
    await pushNotif(targetUid, (currentUser.displayName || "Quelqu'un") + " t'a envoyé une demande d'ami", "?u=");
    alert("Demande d'ami envoyée !");
    updateFriendButton();
  } catch (e) {
    alert("Erreur: " + e.message);
  }
}

async function acceptFriend(uid) {
  if (!currentUser) return;
  const myRef = db.collection("users").doc(currentUser.uid);
  const theirRef = db.collection("users").doc(uid);
  await myRef.set({
    friends: firebase.firestore.FieldValue.arrayUnion(uid),
    friendRequests: firebase.firestore.FieldValue.arrayRemove(uid),
    friendOutgoing: firebase.firestore.FieldValue.arrayRemove(uid)
  }, { merge: true });
  await theirRef.set({
    friends: firebase.firestore.FieldValue.arrayUnion(currentUser.uid),
    friendOutgoing: firebase.firestore.FieldValue.arrayRemove(currentUser.uid),
    friendRequests: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
  }, { merge: true });
  loadFriends();
  updateFriendButton();
  alert("Ami ajouté !");
}

async function declineFriend(uid) {
  if (!currentUser) return;
  await db.collection("users").doc(currentUser.uid).set({
    friendRequests: firebase.firestore.FieldValue.arrayRemove(uid)
  }, { merge: true });
  await db.collection("users").doc(uid).set({
    friendOutgoing: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
  }, { merge: true });
  loadFriends();
}

async function removeFriend(uid) {
  if (!currentUser || !confirm("Retirer cet ami ?")) return;
  await db.collection("users").doc(currentUser.uid).set({
    friends: firebase.firestore.FieldValue.arrayRemove(uid)
  }, { merge: true });
  await db.collection("users").doc(uid).set({
    friends: firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
  }, { merge: true });
  loadFriends();
  updateFriendButton();
}

async function toggleFriendAction() {
  if (!currentUser) return openModal(false);
  if (!viewingUser || !viewingUser.id) return;
  const uid = viewingUser.id;
  if (uid === currentUser.uid) return;
  const me = await db.collection("users").doc(currentUser.uid).get();
  const d = me.data() || {};
  if ((d.friends || []).includes(uid)) return removeFriend(uid);
  if ((d.friendOutgoing || []).includes(uid)) return alert("Demande en attente");
  if ((d.friendRequests || []).includes(uid)) return acceptFriend(uid);
  return sendFriendRequest(uid);
}

async function updateFriendButton() {
  const btn = document.getElementById("btnFriend");
  const actions = document.getElementById("pvActions");
  if (!btn || !viewingUser) return;
  if (!currentUser || viewingUser.id === currentUser.uid) {
    if (actions) actions.style.display = currentUser && viewingUser.id !== currentUser?.uid ? "flex" : "none";
    btn.style.display = "none";
    return;
  }
  if (actions) actions.style.display = "flex";
  btn.style.display = "inline-block";
  try {
    const me = await db.collection("users").doc(currentUser.uid).get();
    const d = me.data() || {};
    if ((d.friends || []).includes(viewingUser.id)) btn.textContent = "✓ Amis";
    else if ((d.friendOutgoing || []).includes(viewingUser.id)) btn.textContent = "En attente…";
    else if ((d.friendRequests || []).includes(viewingUser.id)) btn.textContent = "Accepter";
    else btn.textContent = "+ Ami";
  } catch (e) {
    btn.textContent = "+ Ami";
  }
}

// grant early badge on register if in window
async function ensureEarlyBadge(uid) {
  if (Date.now() > EARLY_UNTIL) return;
  try {
    await db.collection("users").doc(uid).set({
      badges: firebase.firestore.FieldValue.arrayUnion({
        id: "early", label: "Early User", icon: "✦", cls: "early"
      })
    }, { merge: true });
  } catch (e) {}
}


async function deletePost(id) {
  if (!currentUser || !confirm("Supprimer ce post ?")) return;
  try {
    await db.collection("posts").doc(id).delete();
    loadFeed();
  } catch (e) {
    alert("Erreur: " + e.message);
  }
}

function showPvTab(name, btn) {
  ["links", "anime", "music", "gallery", "accounts", "stream", "notes"].forEach(t => {
    const el = document.getElementById("pvTab-" + t);
    if (el) el.style.display = t === name ? "block" : "none";
  });
  document.querySelectorAll(".pv-tab").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  if (name === "accounts" && viewingUser) {
    try { renderLinkedAccountsPanel(viewingUser); } catch (e) {}
  }
  if (name === "stream" && viewingUser) {
    try { renderProfileStream(viewingUser); } catch (e) {}
  }
  if (name === "links") {
    const panel = document.getElementById("pvTab-links");
    const socials = document.getElementById("pvSocials");
    if (panel && socials) {
      // socials then blocks order: blocks first already in panel, append socials at top
      if (panel.firstChild) panel.insertBefore(socials, panel.firstChild);
      else panel.appendChild(socials);
    }
  }
  // section tools for own profile
  const own = isOwnProfile();
  const map = { links: "toolAddLink", anime: "toolAddAnime", music: "toolAddMusic", gallery: "toolAddGal" };
  Object.keys(map).forEach(k => {
    const el = document.getElementById(map[k]);
    if (el) el.style.display = (own && k === name) ? "inline-flex" : "none";
  });
}

async function addMyAnime() {
  if (!currentUser) return;
  const title = document.getElementById("animeTitle").value.trim();
  if (!title) return alert("Titre requis — cherche via MAL");
  const status = document.getElementById("animeStatus").value;
  const score = parseFloat(document.getElementById("animeScore").value) || null;
  const malId = document.getElementById("animeMalId")?.value || "";
  const image = document.getElementById("animeImage")?.value || "";
  const synopsis = document.getElementById("animeSynopsis")?.value || "";
  if (!window._myAnime) window._myAnime = [];
  window._myAnime.push({ title, status, score, malId, image, synopsis, at: Date.now() });
  document.getElementById("animeTitle").value = "";
  document.getElementById("animeScore").value = "";
  document.getElementById("animeMalId").value = "";
  document.getElementById("animeImage").value = "";
  document.getElementById("animeSynopsis").value = "";
  const picked = document.getElementById("animePicked");
  if (picked) { picked.style.display = "none"; picked.innerHTML = ""; }
  renderMyAnimeEditor();
  try {
    await db.collection("users").doc(currentUser.uid).set({ animeList: window._myAnime }, { merge: true });
  } catch (e) { alert(e.message); }
}
function renderMyAnimeEditor() {
  const box = document.getElementById("myAnimeEditor");
  if (!box) return;
  const list = window._myAnime || [];
  box.innerHTML = list.map((a, i) =>
    `<div class="admin-track" style="gap:8px">
      ${a.image?`<img src="${esc(a.image)}" style="width:28px;height:40px;object-fit:cover;border-radius:4px">`:""}
      <span style="flex:1">${esc(a.title)} (${a.status}${a.score!=null?" · "+a.score:""})</span>
    <button class="btn-danger" onclick="removeMyAnime(${i})">×</button></div>`
  ).join("") || '<p class="hint">Aucun anime</p>';
}
async function removeMyAnime(i) {
  window._myAnime.splice(i, 1);
  renderMyAnimeEditor();
  if (currentUser) {
    await db.collection("users").doc(currentUser.uid).set({ animeList: window._myAnime }, { merge: true });
  }
}

function spotifyEmbed(url) {
  if (!url) return "";
  const m = url.match(/playlist\/([a-zA-Z0-9]+)/) || url.match(/album\/([a-zA-Z0-9]+)/) || url.match(/track\/([a-zA-Z0-9]+)/);
  if (!m) return `<a class="link" href="${esc(url)}" target="_blank">Ouvrir Spotify</a>`;
  const type = url.includes("/album/") ? "album" : url.includes("/track/") ? "track" : "playlist";
  return `<div class="spotify-embed"><iframe src="https://open.spotify.com/embed/${type}/${m[1]}?utm_source=generator&theme=0" width="100%" height="${type==='track'?80:152}" frameBorder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy"></iframe></div>`;
}


function showDsTab(name, btn) {
  ["header","design","links","content","security"].forEach(t => {
    const el = document.getElementById("ds-" + t);
    if (el) el.style.display = t === name ? "block" : "none";
  });
  document.querySelectorAll(".ds-tab").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
}

function pickChip(hiddenId, btn) {
  const row = btn.parentElement;
  row.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
  btn.classList.add("active");
  const input = document.getElementById(hiddenId);
  if (input) input.value = btn.dataset.v;
  refreshDsPreview();
}

function pickTheme(btn) {
  document.querySelectorAll(".theme-swatch").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const input = document.getElementById("myTheme");
  if (input) input.value = btn.dataset.v;
  // auto set button color from theme
  const colors = {
    violet:"#7c3aed", ocean:"#0ea5e9", sunset:"#f97316", mint:"#34d399",
    rose:"#fb7185", gold:"#fbbf24", noir:"#52525b", neon:"#22d3ee",
    pastel:"#c4b5fd", forest:"#4ade80"
  };
  const bc = document.getElementById("myBtnColor");
  if (bc && colors[btn.dataset.v]) bc.value = colors[btn.dataset.v];
  refreshDsPreview();
}

function refreshDsPreview() {
  try {
    const get = (id) => document.getElementById(id);
    const name = (get("myDisplayName") && get("myDisplayName").value) || (get("myUsername") && get("myUsername").value) || "Ton nom";
    const user = (get("myUsername") && get("myUsername").value) || "pseudo";
    const bio = (get("myBio") && get("myBio").value) || "";
    const bioShow = get("myBioShow") ? get("myBioShow").checked : true;
    const av = (get("myAvatar") && get("myAvatar").value) || "";
    const btnC = (get("myBtnColor") && get("myBtnColor").value) || "#7c3aed";
    const btnT = (get("myBtnText") && get("myBtnText").value) || "#ffffff";
    const textC = (get("myTextColor") && get("myTextColor").value) || "#f4f4f5";
    const shape = (get("myBtnShape") && get("myBtnShape").value) || "rounded";
    const style = (get("myBtnStyle") && get("myBtnStyle").value) || "fill";
    const bgType = (get("myBgType") && get("myBgType").value) || "theme";
    const bgColor = (get("myBgColor") && get("myBgColor").value) || "#0a0a0f";
    const bgImg = (get("myBg") && get("myBg").value) || "";
    const theme = (get("myTheme") && get("myTheme").value) || "violet";
    const titleSize = (get("myTitleSize") && get("myTitleSize").value) || "normal";

    const n = get("dspName");
    const h = get("dspHandle");
    const b = get("dspBio");
    const a = get("dspAvatar");
    const btn = get("dspBtn");
    const prev = get("dsPreview");

    if (n) {
      n.textContent = name;
      n.style.color = textC;
      n.style.fontSize = titleSize === "large" ? "1.25rem" : titleSize === "small" ? "0.9rem" : "1rem";
    }
    if (h) { h.textContent = "@" + user; h.style.color = textC; }
    if (b) { b.textContent = bio; b.style.color = textC; }
    if (a) {
      if (av) {
        a.style.backgroundImage = "url('" + av.replace(/'/g, "%27") + "')";
        a.style.backgroundSize = "cover";
        a.style.backgroundPosition = "center";
        a.textContent = "";
      } else {
        a.style.backgroundImage = "none";
        a.textContent = (name[0] || "?").toUpperCase();
      }
    }
    if (btn) {
      const radius = { pill: "999px", square: "6px", soft: "12px", rounded: "14px" }[shape] || "14px";
      btn.style.borderRadius = radius;
      btn.style.color = btnT;
      btn.style.border = "none";
      if (style === "outline") {
        btn.style.background = "transparent";
        btn.style.border = "1.5px solid " + btnC;
        btn.style.color = btnC;
        btn.style.boxShadow = "none";
      } else if (style === "glass") {
        btn.style.background = "rgba(255,255,255,.12)";
        btn.style.border = "1px solid rgba(255,255,255,.15)";
        btn.style.boxShadow = "none";
      } else if (style === "glow") {
        btn.style.background = btnC;
        btn.style.boxShadow = "0 0 16px " + btnC;
      } else if (style === "shadow") {
        btn.style.background = btnC;
        btn.style.boxShadow = "0 6px 20px rgba(0,0,0,.5)";
      } else {
        btn.style.background = btnC;
        btn.style.boxShadow = "none";
      }
    }
    if (prev) {
      const gradients = {
        violet: "linear-gradient(160deg,#1a0a2e,#0a0a0f)",
        ocean: "linear-gradient(160deg,#0c1929,#0a0a0f)",
        sunset: "linear-gradient(160deg,#2a1018,#0a0a0f)",
        mint: "linear-gradient(160deg,#0a1f18,#0a0a0f)",
        rose: "linear-gradient(160deg,#2a0a18,#0a0a0f)",
        gold: "linear-gradient(160deg,#1f1808,#0a0a0f)",
        noir: "linear-gradient(160deg,#111,#0a0a0f)",
        neon: "linear-gradient(160deg,#0a1a2a,#1a0a2e)",
        pastel: "linear-gradient(160deg,#1a1520,#0a0a0f)",
        forest: "linear-gradient(160deg,#0a1a10,#0a0a0f)"
      };
      if (bgType === "image" && bgImg) {
        prev.style.backgroundImage = "linear-gradient(rgba(0,0,0,.55),rgba(0,0,0,.7)),url('" + bgImg.replace(/'/g, "%27") + "')";
        prev.style.backgroundSize = "cover";
        prev.style.backgroundPosition = "center";
        prev.style.backgroundColor = "";
      } else if (bgType === "flat") {
        prev.style.backgroundImage = "none";
        prev.style.backgroundColor = bgColor;
      } else {
        prev.style.backgroundImage = gradients[theme] || gradients.violet;
        prev.style.backgroundColor = "";
      }
    }
  } catch (err) {
    console.error("preview", err);
  }
}

// sync chips when loading profile form
function syncDesignChips() {
  const pairs = [
    ["myHeaderLayout", "#chipHeader .chip, .ds-panel .chip-row"],
    ["myBtnShape", null],
    ["myBtnStyle", null],
    ["myFont", null]
  ];
  // generic: find chip with data-v matching hidden input
  ["myHeaderLayout","myBtnShape","myBtnStyle","myFont"].forEach(id => {
    const input = document.getElementById(id);
    if (!input) return;
    document.querySelectorAll(`.chip[data-v="${input.value}"]`).forEach(c => {
      const row = c.parentElement;
      if (row) row.querySelectorAll(".chip").forEach(x => x.classList.remove("active"));
      c.classList.add("active");
    });
  });
  const theme = document.getElementById("myTheme")?.value || "violet";
  document.querySelectorAll(".theme-swatch").forEach(s => {
    s.classList.toggle("active", s.dataset.v === theme);
  });
  refreshDsPreview();
}


// ===== MAL / JIKAN ANIME SEARCH =====
let _animeSearchTimer = null;
let _animeCache = [];

function searchAnimeMAL(q) {
  clearTimeout(_animeSearchTimer);
  const box = document.getElementById("animeSuggest");
  if (!q || q.trim().length < 2) {
    if (box) box.style.display = "none";
    return;
  }
  _animeSearchTimer = setTimeout(() => fetchAnimeSuggestions(q.trim()), 500);
}

async function fetchAnimeSuggestions(q) {
  const box = document.getElementById("animeSuggest");
  if (!box) return;
  box.style.display = "block";
  box.innerHTML = '<div class="hint" style="padding:10px">Recherche…</div>';
  try {
    let list = await searchJikan(q);
    if (!list.length) list = await searchAniList(q);
    _animeCache = list;
    if (!_animeCache.length) {
      box.innerHTML = '<div class="hint" style="padding:10px">Aucun résultat</div>';
      return;
    }
    box.innerHTML = _animeCache.map((a, i) => {
      return `<div class="anime-suggest-item" onclick="pickAnimeMAL(${i})">
        <img src="${esc(a.image||"")}" alt="" onerror="this.style.display='none'">
        <div>
          <div class="as-title">${esc(a.title||"?")}</div>
          <div class="as-meta">${esc(a.meta||"")}</div>
        </div>
      </div>`;
    }).join("");
  } catch (e) {
    console.error(e);
    box.innerHTML = '<div class="hint" style="padding:10px">Erreur — réessaie dans 2s (limite API)</div>';
  }
}

async function searchJikan(q) {
  const urls = [
    "https://api.jikan.moe/v4/anime?q=" + encodeURIComponent(q) + "&limit=6&sfw=true",
    "https://corsproxy.io/?" + encodeURIComponent("https://api.jikan.moe/v4/anime?q=" + encodeURIComponent(q) + "&limit=6&sfw=true")
  ];
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.status === 429) {
        await new Promise(r => setTimeout(r, 1200));
        continue;
      }
      if (!res.ok) continue;
      const data = await res.json();
      const arr = data.data || [];
      return arr.map(a => ({
        title: a.title_english || a.title || "?",
        image: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || "",
        synopsis: (a.synopsis || "").replace(/\n+/g, " ").slice(0, 280),
        mal_id: a.mal_id || "",
        meta: [a.type, a.year || (a.aired?.from ? String(a.aired.from).slice(0,4) : ""), a.score ? "★ " + a.score : ""].filter(Boolean).join(" · ")
      }));
    } catch (e) {
      console.log("jikan fail", e);
    }
  }
  return [];
}

async function searchAniList(q) {
  try {
    const query = `query ($search: String) {
      Page(page: 1, perPage: 6) {
        media(search: $search, type: ANIME, sort: SEARCH_MATCH) {
          id
          idMal
          title { romaji english native }
          coverImage { large medium }
          description(asHtml: false)
          format
          seasonYear
          averageScore
        }
      }
    }`;
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables: { search: q } })
    });
    if (!res.ok) return [];
    const data = await res.json();
    const arr = data?.data?.Page?.media || [];
    return arr.map(a => ({
      title: a.title?.english || a.title?.romaji || a.title?.native || "?",
      image: a.coverImage?.large || a.coverImage?.medium || "",
      synopsis: (a.description || "").replace(/<[^>]+>/g, "").replace(/\n+/g, " ").slice(0, 280),
      mal_id: a.idMal || a.id || "",
      meta: [a.format, a.seasonYear, a.averageScore ? "★ " + (a.averageScore/10).toFixed(1) : ""].filter(Boolean).join(" · ")
    }));
  } catch (e) {
    console.log("anilist fail", e);
    return [];
  }
}

function pickAnimeMAL(i) {
  const a = _animeCache[i];
  if (!a) return;
  const title = a.title || "";
  const img = a.image || "";
  const syn = a.synopsis || "";
  document.getElementById("animeTitle").value = title;
  document.getElementById("animeMalId").value = a.mal_id || "";
  document.getElementById("animeImage").value = img;
  document.getElementById("animeSynopsis").value = syn;
  const box = document.getElementById("animeSuggest");
  if (box) box.style.display = "none";
  const picked = document.getElementById("animePicked");
  if (picked) {
    picked.style.display = "flex";
    picked.innerHTML = `<img src="${esc(img)}" alt="">
      <div><div class="ap-title">${esc(title)}</div>
      <div class="ap-syn">${esc(syn)}</div></div>`;
  }
}

// close suggest on outside click
document.addEventListener("click", (e) => {
  const wrap = document.querySelector(".anime-search-wrap");
  const box = document.getElementById("animeSuggest");
  if (box && wrap && !wrap.contains(e.target)) box.style.display = "none";
});


// ===== PROFILE BLOCKS (XULTRA-style) =====
function addBlock(type) {
  if (!window._myBlocks) window._myBlocks = [];
  const base = { id: "b" + Date.now(), type };
  if (type === "link") Object.assign(base, { title: "Mon lien", url: "", icon: "🔗" });
  if (type === "youtube") Object.assign(base, { title: "YouTube", url: "" });
  if (type === "tiktok") Object.assign(base, { title: "TikTok", url: "" });
  if (type === "instagram") Object.assign(base, { title: "Instagram", url: "" });
  if (type === "map") Object.assign(base, { title: "Lieu", url: "" });
  if (type === "file") Object.assign(base, { title: "Télécharger", url: "" });
  if (type === "form") Object.assign(base, { title: "Contact", placeholder: "Ton message..." });
  if (type === "header") Object.assign(base, { title: "Section" });
  if (type === "collection") Object.assign(base, { title: "Collection", items: [{ label: "Lien 1", url: "" }] });
  window._myBlocks.push(base);
  renderMyBlocksEditor();
}

function renderMyBlocksEditor() {
  const box = document.getElementById("myBlocksEditor");
  if (!box) return;
  const blocks = window._myBlocks || [];
  if (!blocks.length) {
    box.innerHTML = '<p class="hint">Aucun bloc — choisis un type ci-dessus</p>';
    return;
  }
  box.innerHTML = blocks.map((b, i) => {
    let fields = "";
    if (b.type === "header") {
      fields = `<input class="input" data-f="title" data-i="${i}" value="${esc(b.title||"")}" placeholder="Titre section" oninput="updBlock(this)">`;
    } else if (b.type === "form") {
      fields = `<input class="input" data-f="title" data-i="${i}" value="${esc(b.title||"")}" placeholder="Titre" oninput="updBlock(this)">
        <input class="input" data-f="placeholder" data-i="${i}" value="${esc(b.placeholder||"")}" placeholder="Placeholder" oninput="updBlock(this)">`;
    } else if (b.type === "collection") {
      fields = `<input class="input" data-f="title" data-i="${i}" value="${esc(b.title||"")}" placeholder="Nom collection" oninput="updBlock(this)">
        <input class="input" data-f="itemsJson" data-i="${i}" value="${esc(JSON.stringify(b.items||[]))}" placeholder='[{"label":"A","url":"https://"}]' oninput="updBlockItems(this)">
        <p class="hint">Format JSON : label + url</p>`;
    } else if (b.type === "map") {
      const sid = "mapSug_" + i;
      fields = `<input class="input" data-f="title" data-i="${i}" value="${esc(b.title||"")}" placeholder="Nom du lieu" oninput="updBlock(this)">
        <div class="map-search-wrap">
          <input class="input" data-f="url" data-i="${i}" id="mapUrl_${i}" value="${esc(b.url||"")}" placeholder="Cherche un lieu ou colle un lien Maps…" oninput="updBlock(this);searchMapPlace(this.value,'mapUrl_${i}','${sid}')">
          <div id="${sid}" class="map-suggest" style="display:none"></div>
        </div>
        <p class="hint">API Maps via OpenStreetMap + embed Google (sans clé)</p>`;
    } else {
      fields = `<input class="input" data-f="title" data-i="${i}" value="${esc(b.title||"")}" placeholder="Titre" oninput="updBlock(this)">
        <input class="input" data-f="url" data-i="${i}" value="${esc(b.url||"")}" placeholder="URL" oninput="updBlock(this)">`;
    }
    const labels = { link:"Lien", youtube:"YouTube", tiktok:"TikTok", instagram:"Instagram", map:"Maps", file:"Fichier", form:"Form", header:"Titre", collection:"Collection" };
    return `<div class="block-edit-card">
      <div class="be-type">${labels[b.type]||b.type}</div>
      ${fields}
      <button type="button" class="btn-danger" style="margin-top:6px" onclick="removeBlock(${i})">Suppr</button>
    </div>`;
  }).join("");
}

function updBlock(el) {
  const i = +el.dataset.i;
  const f = el.dataset.f;
  if (window._myBlocks[i]) window._myBlocks[i][f] = el.value;
}
function updBlockItems(el) {
  const i = +el.dataset.i;
  try {
    window._myBlocks[i].items = JSON.parse(el.value);
  } catch (e) {}
}
function removeBlock(i) {
  window._myBlocks.splice(i, 1);
  renderMyBlocksEditor();
}

function renderProfileBlocks(blocks) {
  const box = document.getElementById("pvBlocks");
  if (!box) return;
  if (!blocks || !blocks.length) {
    box.innerHTML = "";
    return;
  }
  box.innerHTML = blocks.map(b => {
    if (b.type === "header") {
      return `<div class="pv-block-header">${esc(b.title||"")}</div>`;
    }
    if (b.type === "link") {
      return `<a class="link pv-block" href="${esc(b.url)}" target="_blank" rel="noopener">${esc(b.icon||"🔗")} ${esc(b.title||"Lien")}</a>`;
    }
    if (b.type === "youtube") {
      const id = ytId(b.url);
      if (!id) return `<a class="link" href="${esc(b.url)}" target="_blank">${esc(b.title||"YouTube")}</a>`;
      return `<div class="pv-block pv-embed"><iframe src="https://www.youtube.com/embed/${id}" allowfullscreen allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" style="aspect-ratio:16/9;height:auto;min-height:180px"></iframe></div>`;
    }
    if (b.type === "tiktok") {
      return `<a class="link pv-block" href="${esc(b.url)}" target="_blank" rel="noopener">🎵 ${esc(b.title||"TikTok")}</a>
        <p class="hint" style="text-align:center">Ouvre TikTok pour voir la vidéo</p>`;
    }
    if (b.type === "instagram") {
      return `<a class="link pv-block" href="${esc(b.url)}" target="_blank" rel="noopener">📸 ${esc(b.title||"Instagram")}</a>`;
    }
    if (b.type === "map") {
      const src = mapsEmbedUrl(b.url || b.title || "", b.title || "");
      const openUrl = b.url || ("https://maps.google.com/maps?q=" + encodeURIComponent(b.title || ""));
      return `<div class="pv-block pv-map-wrap">
        <a class="link link-map" href="${esc(openUrl)}" target="_blank" rel="noopener">📍 ${esc(b.title||"Lieu")}</a>
        ${src ? `<div class="pv-map"><iframe src="${esc(src)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ""}
      </div>`;
    }
    if (b.type === "file") {
      return `<a class="link pv-block pv-file-btn" href="${esc(b.url)}" target="_blank" download>📁 ${esc(b.title||"Télécharger")}</a>`;
    }
    if (b.type === "form") {
      return `<div class="pv-block pv-form block-card" style="padding:12px">
        <div style="font-weight:600;margin-bottom:8px">${esc(b.title||"Contact")}</div>
        <input class="input" id="formName_${b.id}" placeholder="Ton nom">
        <textarea class="input" id="formMsg_${b.id}" rows="2" placeholder="${esc(b.placeholder||"Message...")}"></textarea>
        <button type="button" class="btn-primary" style="width:100%;margin:0" onclick="submitProfileForm('${esc(b.id)}','${esc(viewingUser&&viewingUser.id||"")}')">Envoyer</button>
      </div>`;
    }
    if (b.type === "collection") {
      const items = b.items || [];
      return `<div class="pv-block collection-group">
        <div class="cg-title">📂 ${esc(b.title||"Collection")}</div>
        ${items.filter(it=>it.url).map(it=>`<a class="link" href="${esc(it.url)}" target="_blank" style="margin-bottom:6px">${esc(it.label||"Lien")}</a>`).join("")}
      </div>`;
    }
    return "";
  }).join("");
}

function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Build a free embeddable map URL (Google embed + OSM fallback) — no API key required */
function mapsEmbedUrl(raw, title) {
  const s = String(raw || title || "").trim();
  if (!s) return "";
  // already embed
  if (/output=embed|google\.com\/maps\/embed|openstreetmap\.org\/export\/embed/i.test(s)) return s;
  // place_id style or full google URL
  if (/google\.[a-z.]+\/maps/i.test(s)) {
    try {
      const u = new URL(s.startsWith("http") ? s : "https://" + s);
      const q = u.searchParams.get("q") || u.searchParams.get("query") || "";
      const place = u.pathname.match(/place\/([^/]+)/);
      const query = q || (place ? decodeURIComponent(place[1].replace(/\+/g, " ")) : s);
      return "https://maps.google.com/maps?q=" + encodeURIComponent(query) + "&z=14&output=embed";
    } catch (e) {
      return "https://maps.google.com/maps?q=" + encodeURIComponent(s) + "&z=14&output=embed";
    }
  }
  // lat,lng
  const ll = s.match(/^(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)$/);
  if (ll) {
    return "https://maps.google.com/maps?q=" + encodeURIComponent(ll[1] + "," + ll[2]) + "&z=15&output=embed";
  }
  // plain place name / address
  return "https://maps.google.com/maps?q=" + encodeURIComponent(s) + "&z=14&output=embed";
}

let _mapSearchTimer = null;
async function searchMapPlace(query, targetInputId, suggestId) {
  const box = document.getElementById(suggestId);
  const q = String(query || "").trim();
  if (!box) return;
  if (q.length < 2) { box.style.display = "none"; return; }
  clearTimeout(_mapSearchTimer);
  _mapSearchTimer = setTimeout(async () => {
    try {
      // Nominatim OpenStreetMap — free, no key (rate-limited)
      const res = await fetch(
        "https://nominatim.openstreetmap.org/search?format=json&limit=6&q=" + encodeURIComponent(q),
        { headers: { "Accept-Language": "fr", "User-Agent": "XUltra/1.0" } }
      );
      if (!res.ok) throw new Error("maps search fail");
      const data = await res.json();
      if (!data.length) {
        box.innerHTML = '<div class="hint" style="padding:8px">Aucun lieu trouvé</div>';
        box.style.display = "block";
        return;
      }
      box.innerHTML = data.map((p, i) => {
        const name = p.display_name || q;
        const mapsUrl = "https://maps.google.com/maps?q=" + encodeURIComponent(name);
        return `<button type="button" class="map-suggest-item" onclick='pickMapPlace(${JSON.stringify(name)},${JSON.stringify(mapsUrl)},${JSON.stringify(targetInputId)},${JSON.stringify(suggestId)})'>
          📍 ${esc(name.slice(0, 90))}
        </button>`;
      }).join("");
      box.style.display = "block";
    } catch (e) {
      box.innerHTML = '<div class="hint" style="padding:8px">Recherche indisponible — colle un lien Google Maps</div>';
      box.style.display = "block";
    }
  }, 350);
}

function pickMapPlace(name, mapsUrl, inputId, suggestId) {
  const inp = document.getElementById(inputId);
  if (inp) {
    inp.value = mapsUrl;
    inp.dispatchEvent(new Event("input"));
  }
  // if inside block editor, also set title
  const row = inp && inp.closest(".block-edit-card");
  if (row) {
    const title = row.querySelector('[data-f="title"]');
    if (title && (!title.value || title.value === "Lieu")) title.value = String(name).split(",")[0].slice(0, 60);
    if (title) title.dispatchEvent(new Event("input"));
  }
  const box = document.getElementById(suggestId);
  if (box) box.style.display = "none";
  try { xNotify("Lieu sélectionné", { type: "ok", title: "Maps" }); } catch (e) {}
}

async function submitProfileForm(blockId, ownerUid) {
  if (!ownerUid) return alert("Erreur");
  const name = document.getElementById("formName_" + blockId)?.value.trim() || "Anonyme";
  const msg = document.getElementById("formMsg_" + blockId)?.value.trim();
  if (!msg) return alert("Message vide");
  try {
    await db.collection("formMessages").add({
      to: ownerUid,
      blockId,
      name,
      msg: msg.slice(0, 1000),
      from: currentUser ? currentUser.uid : null,
      at: firebase.firestore.FieldValue.serverTimestamp()
    });
    alert("Message envoyé !");
    const ta = document.getElementById("formMsg_" + blockId);
    if (ta) ta.value = "";
  } catch (e) {
    alert("Erreur: " + e.message);
  }
}


function revealSpoiler(el) {
  if (el.classList.contains("revealed")) {
    const href = el.dataset.href;
    if (href) window.open(href, "_blank", "noopener");
    return;
  }
  el.classList.add("revealed");
  // particle burst
  for (let i = 0; i < 12; i++) {
    const p = document.createElement("span");
    p.className = "spoiler-particle";
    p.style.left = (50 + (Math.random()-0.5)*80) + "%";
    p.style.top = (50 + (Math.random()-0.5)*60) + "%";
    p.style.setProperty("--dx", ((Math.random()-0.5)*100) + "px");
    p.style.setProperty("--dy", ((Math.random()-0.5)*80 - 40) + "px");
    el.appendChild(p);
    setTimeout(() => p.remove(), 800);
  }
  const hint = el.querySelector(".spoiler-hint");
  if (hint) hint.textContent = "Appuie encore pour ouvrir →";
}


function shareProfile() {
  const url = location.href;
  if (navigator.share) {
    navigator.share({ title: document.getElementById("pvName")?.textContent || "XULTRA", url }).catch(()=>{});
  } else {
    navigator.clipboard.writeText(url).then(() => alert("Lien copié !")).catch(() => prompt("Copie ce lien:", url));
  }
}
function showProfileQR() {
  const box = document.getElementById("pvQR");
  if (!box) return;
  if (box.style.display === "block") { box.style.display = "none"; return; }
  const url = encodeURIComponent(location.href);
  box.style.display = "block";
  box.innerHTML = `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&bgcolor=0a0a0f&color=e9d5ff&data=${url}" alt="QR" style="border-radius:12px;background:#fff;padding:8px">
    <p class="hint">Scan pour ouvrir ce profil</p>`;
}


function bindDsPreviewListeners() {
  const modal = document.getElementById("profileModal");
  if (!modal || modal.dataset.previewBound) return;
  modal.dataset.previewBound = "1";
  modal.addEventListener("input", (e) => {
    if (e.target.closest(".ds-body") || e.target.closest(".ds-preview")) {
      refreshDsPreview();
    }
  });
  modal.addEventListener("change", () => refreshDsPreview());
}



// ===== INLINE PROFILE EDIT (own profile) =====
function isOwnProfile() {
  return !!(currentUser && viewingUser && viewingUser.id === currentUser.uid);
}

function setOwnProfileUI(on) {
  const pv = document.getElementById("profileView");
  if (pv) pv.classList.toggle("is-own-profile", !!on);
  const ov = document.getElementById("avEditOverlay");
  if (ov) ov.style.display = on ? "flex" : "none";
  ["bioEditBtn","nameEditBtn"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = on ? "inline-flex" : "none";
  });
  const tools = document.getElementById("pvSectionTools");
  if (tools) tools.style.display = on ? "flex" : "none";
}

async function inlineSaveField(data) {
  if (!currentUser) return;
  await db.collection("users").doc(currentUser.uid).set(data, { merge: true });
  // merge into viewingUser
  if (viewingUser) Object.assign(viewingUser, data);
}

async function inlineUploadAvatar(input) {
  if (!input.files || !input.files[0] || !currentUser) return;
  const file = input.files[0];
  const fd = new FormData();
  fd.append("image", file);
  try {
    const res = await fetch("https://api.imgbb.com/1/upload?key=" + IMGBB_KEY, { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("upload fail");
    const url = data.data.url;
    await inlineSaveField({ avatar: url });
    const img = document.getElementById("pvAvatar");
    if (img) {
      img.src = url;
      img.classList.add("inline-flash");
      setTimeout(() => img.classList.remove("inline-flash"), 600);
    }
  } catch (e) {
    alert("Upload: " + e.message);
  }
  input.value = "";
}

async function inlineRemoveAvatar() {
  if (!confirm("Retirer l'avatar ?")) return;
  await inlineSaveField({ avatar: "" });
  const img = document.getElementById("pvAvatar");
  if (img && viewingUser) {
    img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingUser.displayName||viewingUser.username||"U")}&background=7c3aed&color=fff&size=200&bold=true`;
  }
}

function inlineEditBio() {
  document.getElementById("bioEditBox").style.display = "block";
  document.getElementById("inlineBioInput").value = document.getElementById("pvBio").textContent || "";
  document.getElementById("inlineBioInput").focus();
}
function inlineCancelBio() {
  document.getElementById("bioEditBox").style.display = "none";
}
async function inlineSaveBio() {
  const bio = document.getElementById("inlineBioInput").value.trim().slice(0, 150);
  await inlineSaveField({ bio });
  const el = document.getElementById("pvBio");
  const wrap = document.getElementById("pvBioWrap");
  if (bio) {
    el.textContent = bio;
    wrap.style.display = "inline-block";
    wrap.classList.add("inline-flash");
  } else {
    wrap.style.display = "none";
  }
  document.getElementById("bioEditBox").style.display = "none";
}

function inlineEditName() {
  document.getElementById("nameEditBox").style.display = "block";
  document.getElementById("inlineNameInput").value = (viewingUser && viewingUser.displayName) || "";
  document.getElementById("inlineNameInput").focus();
}
async function inlineSaveName() {
  const displayName = document.getElementById("inlineNameInput").value.trim().slice(0, 40);
  if (!displayName) return;
  await inlineSaveField({ displayName });
  const n = document.getElementById("pvName");
  // keep edit button inside
  n.innerHTML = esc(displayName) + '<button type="button" class="inline-edit-btn" id="nameEditBtn" onclick="inlineEditName()">✎</button>';
  n.classList.add("inline-flash");
  document.getElementById("nameEditBox").style.display = "none";
}

async function inlineAddGallery(input) {
  if (!input.files || !input.files[0] || !currentUser) return;
  const fd = new FormData();
  fd.append("image", input.files[0]);
  try {
    const res = await fetch("https://api.imgbb.com/1/upload?key=" + IMGBB_KEY, { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("fail");
    const url = data.data.url;
    const gal = (viewingUser.gallery || []).concat([{ url, at: Date.now() }]);
    await inlineSaveField({ gallery: gal });
    viewingUser.gallery = gal;
    // re-render gallery tab content
    const gbox = document.getElementById("pvGallery");
    if (gbox) {
      window._pvGal = gal;
      gbox.innerHTML = '<div class="gallery-grid">' + gal.map((img, i) =>
        `<div class="gallery-item inline-flash" onclick="openLightboxIdx(${i})">
          <img src="${esc(img.url)}" alt="" loading="lazy">
          <button type="button" class="gal-del" onclick="event.stopPropagation();inlineDelGal(${i})">✕</button>
        </div>`
      ).join("") + "</div>";
    }
    showPvTab("gallery", document.querySelectorAll(".pv-tab")[3]);
  } catch (e) {
    alert(e.message);
  }
  input.value = "";
}

async function inlineDelGal(i) {
  if (!confirm("Supprimer cette photo ?")) return;
  const gal = (viewingUser.gallery || []).slice();
  gal.splice(i, 1);
  await inlineSaveField({ gallery: gal });
  viewingUser.gallery = gal;
  const gbox = document.getElementById("pvGallery");
  if (!gal.length) gbox.innerHTML = '<p class="hint">Galerie vide</p>';
  else {
    window._pvGal = gal;
    gbox.innerHTML = '<div class="gallery-grid">' + gal.map((img, j) =>
      `<div class="gallery-item" onclick="openLightboxIdx(${j})">
        <img src="${esc(img.url)}" alt="" loading="lazy">
        <button type="button" class="gal-del" onclick="event.stopPropagation();inlineDelGal(${j})">✕</button>
      </div>`
    ).join("") + "</div>";
  }
}

async function inlineAddLink() {
  if (!viewingUser || !currentUser) return openModal(false);
  const label = prompt("Titre du lien ?");
  if (!label) return;
  let url = prompt("URL ?");
  if (!url) return;
  url = normalizeUrl(url);
  const socials = (viewingUser.socials || []).concat([{ icon: "🔗", label: label.trim(), url, effect: "normal" }]);
  await inlineSaveField({ socials });
  viewingUser.socials = socials;
  refreshProfileLinks();
  showPvTab("links", document.querySelector(".pv-tab"));
}


async function inlineDelLink(i) {
  if (!confirm("Supprimer ce lien ?")) return;
  const socials = (viewingUser.socials || []).slice();
  socials.splice(i, 1);
  await inlineSaveField({ socials });
  viewingUser.socials = socials;
  refreshProfileLinks();
}

async function inlineAddAnime() {
  const title = prompt("Nom de l'anime (ou cherche dans le Studio pour MAL) ?");
  if (!title) return;
  const list = (viewingUser.animeList || []).concat([{ title, status: "watching", score: null, at: Date.now() }]);
  await inlineSaveField({ animeList: list });
  viewingUser.animeList = list;
  const abox = document.getElementById("pvAnime");
  if (abox) {
    abox.innerHTML = list.map(a =>
      `<div class="anime-row inline-flash">
        ${a.image?`<img class="an-cover" src="${esc(a.image)}" alt="">`:""}
        <div style="flex:1"><div class="an-title">${esc(a.title)}</div></div>
        <span class="an-status ${esc(a.status||"")}">${esc(a.status||"")}</span>
      </div>`
    ).join("");
  }
  showPvTab("anime", document.querySelectorAll(".pv-tab")[1]);
}

async function inlineAddMusic() {
  const title = prompt("Titre ?");
  if (!title) return;
  const url = prompt("Lien MP3 (Catbox) ?");
  if (!url) return;
  const pl = (viewingUser.playlist || []).concat([{ title, artist: "", url }]);
  await inlineSaveField({ playlist: pl });
  viewingUser.playlist = pl;
  window._userPlaylist = pl;
  const box = document.getElementById("pvPlaylist");
  if (box) {
    box.innerHTML = pl.map((t,i) => `<div class="pv-track inline-flash" onclick="playUserTrack(${i})">
      <div><div class="pi-title">${esc(t.title||'?')}</div></div><span>▶</span></div>`).join("");
  }
  showPvTab("music", document.querySelectorAll(".pv-tab")[2]);
}

// Update showPvTab to toggle section tools
const _oldShowPv = showPvTab;
showPvTab = function(name, btn) {
  _oldShowPv(name, btn);
  if (!isOwnProfile()) return;
  const map = { links: "toolAddLink", anime: "toolAddAnime", music: "toolAddMusic", gallery: "toolAddGal" };
  Object.keys(map).forEach(k => {
    const el = document.getElementById(map[k]);
    if (el) el.style.display = k === name ? "inline-flex" : "none";
  });
};


// ===== INLINE PROFILE EDIT (own profile) =====
function isOwnProfile() {
  return !!(currentUser && viewingUser && viewingUser.id === currentUser.uid);
}

function peToast(msg) {
  xNotify(msg, { type: "ok", duration: 2800 });
}

async function peSave(fields) {
  if (!currentUser) return;
  try {
    await db.collection("users").doc(currentUser.uid).set(fields, { merge: true });
    Object.assign(viewingUser, fields);
    peToast("Enregistré ✓");
  } catch (e) {
    peToast("Erreur: " + e.message);
    throw e;
  }
}

function setupInlineEdit() {
  const pv = document.getElementById("profileView");
  if (!pv) return;
  if (isOwnProfile()) {
    pv.classList.add("pe-owner");
    ensureAvatarEditMenu();
    ensureSectionEditButtons();
  } else {
    pv.classList.remove("pe-owner");
  }
}

function ensureAvatarEditMenu() {
  const wrap = document.querySelector("#profileView .avatar-wrapper") || document.getElementById("pvAvatarWrap");
  if (!wrap || wrap.querySelector(".avatar-edit-menu")) return;
  const menu = document.createElement("div");
  menu.className = "avatar-edit-menu";
  menu.innerHTML = `
    <button type="button" onclick="event.stopPropagation();document.getElementById('peAvatarFile').click()">📷 Changer</button>
    <button type="button" class="danger" onclick="event.stopPropagation();peDeleteAvatar()">Supprimer</button>
  `;
  wrap.appendChild(menu);
  // mobile: tap avatar toggles menu
  wrap.addEventListener("click", (e) => {
    if (!isOwnProfile()) return;
    if (e.target.closest(".avatar-edit-menu button")) return;
    menu.classList.toggle("open");
  });
}

function ensureSectionEditButtons() {
  // Bio
  const bioWrap = document.getElementById("pvBioWrap");
  if (bioWrap && !document.getElementById("peBioBtn")) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "peBioBtn";
    btn.className = "pe-edit-btn";
    btn.textContent = "✎ Bio";
    btn.onclick = peEditBio;
    bioWrap.parentNode.insertBefore(btn, bioWrap.nextSibling);
  }
  // Name
  const name = document.getElementById("pvName");
  if (name && !name.dataset.pe) {
    name.dataset.pe = "1";
    name.title = "Cliquer pour éditer";
    name.onclick = () => { if (isOwnProfile()) peEditName(); };
  }
  // Gallery tab header add
  const gal = document.getElementById("pvGallery");
  if (gal && !document.getElementById("peGalAdd")) {
    const add = document.createElement("button");
    add.type = "button";
    add.id = "peGalAdd";
    add.className = "pe-add-btn";
    add.textContent = "+ Ajouter une photo";
    add.onclick = () => document.getElementById("peGalFile").click();
    gal.parentNode.appendChild(add);
  }
  // Anime add
  const anime = document.getElementById("pvAnime");
  if (anime && !document.getElementById("peAnimeAdd")) {
    const add = document.createElement("button");
    add.type = "button";
    add.id = "peAnimeAdd";
    add.className = "pe-add-btn";
    add.textContent = "+ Ajouter un anime";
    add.onclick = () => {
      openProfile();
      setTimeout(() => {
        showDsTab("content", document.querySelector('.ds-tab[onclick*="content"]'));
      }, 200);
    };
    anime.parentNode.appendChild(add);
  }
  // Links - open studio links
  const linksPanel = document.getElementById("pvTab-links");
  if (linksPanel && !document.getElementById("peLinksEdit")) {
    const add = document.createElement("button");
    add.type = "button";
    add.id = "peLinksEdit";
    add.className = "pe-add-btn";
    add.textContent = "✎ Éditer liens & blocs";
    add.onclick = () => {
      openProfile();
      setTimeout(() => {
        const tab = document.querySelector('.ds-tab[onclick*="links"]');
        if (tab) showDsTab("links", tab);
      }, 200);
    };
    linksPanel.appendChild(add);
  }
}

function peEditName() {
  if (document.getElementById("peNameEditor")) return;
  const el = document.getElementById("pvName");
  if (!el) return;
  const cur = (viewingUser && (viewingUser.displayName || viewingUser.username)) || "";
  const panel = document.createElement("div");
  panel.id = "peNameEditor";
  panel.className = "pe-editor-panel";
  panel.innerHTML =
    '<div class="pe-editor-title">Modifier le nom</div>' +
    '<div class="pe-editor-row">' +
    '<button type="button" class="emoji-btn" onclick="toggleEmoji(\'peNameField\', event)">😀</button>' +
    '<input id="peNameField" class="pe-inline-input" maxlength="40" value="' + esc(cur) + '">' +
    "</div>" +
    '<div class="pe-editor-actions">' +
    '<button type="button" class="btn-primary" onclick="peSaveName()">OK</button>' +
    '<button type="button" class="btn btn-outline" onclick="peCancelName()">✕</button>' +
    "</div>";
  el.style.display = "none";
  el.parentNode.insertBefore(panel, el.nextSibling);
  const f = document.getElementById("peNameField");
  if (f) f.focus();
}

async function peSaveName() {
  const field = document.getElementById("peNameField");
  const el = document.getElementById("pvName");
  if (!field || !el) return;
  const cur = (viewingUser && (viewingUser.displayName || viewingUser.username)) || "";
  const v = field.value.trim().slice(0, 40) || cur;
  await peSave({ displayName: v });
  el.textContent = v;
  el.style.display = "";
  el.classList.add("pe-flash");
  setTimeout(function () { el.classList.remove("pe-flash"); }, 600);
  peCancelName();
}

function peCancelName() {
  const el = document.getElementById("pvName");
  if (el) el.style.display = "";
  const p = document.getElementById("peNameEditor");
  if (p) p.remove();
}

function peEditBio() {
  if (document.getElementById("peBioEditor")) return;
  const cur = (viewingUser && viewingUser.bio) || "";
  const panel = document.createElement("div");
  panel.id = "peBioEditor";
  panel.className = "pe-editor-panel";
  panel.innerHTML =
    '<div class="pe-editor-title">Modifier la bio</div>' +
    '<div class="pe-editor-row">' +
    '<button type="button" class="emoji-btn" onclick="toggleEmoji(\'peBioField\', event)">😀</button>' +
    '<textarea id="peBioField" class="pe-inline-input bio" maxlength="200" rows="3" placeholder="Ta bio...">' +
    esc(cur) +
    "</textarea></div>" +
    '<div class="pe-editor-actions">' +
    '<button type="button" class="btn-primary" onclick="peSaveBio()">OK</button>' +
    '<button type="button" class="btn btn-outline" onclick="peCancelBio()">✕</button>' +
    "</div>";
  const wrap = document.getElementById("pvBioWrap");
  const anchor = wrap || document.getElementById("pvHandle");
  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(panel, anchor.nextSibling);
  }
  const field = document.getElementById("peBioField");
  if (field) {
    field.focus();
    try { field.setSelectionRange(field.value.length, field.value.length); } catch (e) {}
  }
}

async function peSaveBio() {
  const field = document.getElementById("peBioField");
  if (!field) return;
  const v = field.value.trim().slice(0, 200);
  await peSave({ bio: v });
  const span = document.getElementById("pvBio");
  const wrap = document.getElementById("pvBioWrap");
  if (span) span.textContent = v;
  if (wrap) {
    wrap.style.display = v ? "inline-block" : "none";
    if (v) {
      wrap.classList.add("pe-flash");
      setTimeout(function () { wrap.classList.remove("pe-flash"); }, 600);
    }
  }
  peCancelBio();
}

function peCancelBio() {
  const p = document.getElementById("peBioEditor");
  if (p) p.remove();
}

async function peUploadAvatar(input) {
  if (!input.files || !input.files[0] || !currentUser) return;
  peToast("Upload avatar…");
  // reuse imgbb
  const file = input.files[0];
  const fd = new FormData();
  fd.append("image", file);
  try {
    const res = await fetch("https://api.imgbb.com/1/upload?key=187599520be6b8250c05de33cee4aed8", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("ImgBB");
    const url = data.data.url;
    await peSave({ avatar: url });
    const img = document.getElementById("pvAvatar");
    if (img) {
      img.style.opacity = "0";
      img.src = url;
      img.onload = () => { img.style.transition = "opacity .4s"; img.style.opacity = "1"; };
    }
    peToast("Avatar mis à jour ✓");
  } catch (e) {
    peToast("Échec upload");
  }
  input.value = "";
  document.querySelector(".avatar-edit-menu")?.classList.remove("open");
}

async function peDeleteAvatar() {
  if (!confirm("Supprimer l'avatar ?")) return;
  await peSave({ avatar: "" });
  const img = document.getElementById("pvAvatar");
  const name = viewingUser.displayName || viewingUser.username || "U";
  if (img) img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=200&bold=true`;
  peToast("Avatar supprimé");
  document.querySelector(".avatar-edit-menu")?.classList.remove("open");
}

async function peUploadGallery(input) {
  if (!input.files || !input.files[0] || !currentUser) return;
  peToast("Upload photo…");
  const file = input.files[0];
  const fd = new FormData();
  fd.append("image", file);
  try {
    const res = await fetch("https://api.imgbb.com/1/upload?key=187599520be6b8250c05de33cee4aed8", { method: "POST", body: fd });
    const data = await res.json();
    if (!data.success) throw new Error("ImgBB");
    const url = data.data.url;
    const gal = viewingUser.gallery || [];
    gal.push({ url, at: Date.now() });
    await peSave({ gallery: gal });
    viewingUser.gallery = gal;
    // re-render gallery only
    const gbox = document.getElementById("pvGallery");
    if (gbox) {
      window._pvGal = gal;
      gbox.innerHTML = '<div class="gallery-grid">' + gal.map((img, i) =>
        `<div class="gallery-item pe-removable" onclick="openLightboxIdx(${i})">
          <img src="${esc(img.url)}" alt="" loading="lazy">
          <button type="button" class="pe-gal-del" onclick="event.stopPropagation();peDeleteGalImage(${i})">×</button>
        </div>`
      ).join("") + "</div>";
      gbox.classList.add("pe-flash");
      setTimeout(() => gbox.classList.remove("pe-flash"), 600);
    }
    peToast("Photo ajoutée ✓");
  } catch (e) {
    peToast("Échec upload");
  }
  input.value = "";
}

async function peDeleteGalImage(i) {
  if (!isOwnProfile() || !confirm("Supprimer cette photo ?")) return;
  const gal = (viewingUser.gallery || []).slice();
  gal.splice(i, 1);
  await peSave({ gallery: gal });
  viewingUser.gallery = gal;
  window._pvGal = gal;
  const gbox = document.getElementById("pvGallery");
  if (!gbox) return;
  if (!gal.length) gbox.innerHTML = '<p class="hint">Galerie vide</p>';
  else gbox.innerHTML = '<div class="gallery-grid">' + gal.map((img, idx) =>
    `<div class="gallery-item pe-removable" onclick="openLightboxIdx(${idx})">
      <img src="${esc(img.url)}" alt="" loading="lazy">
      <button type="button" class="pe-gal-del" onclick="event.stopPropagation();peDeleteGalImage(${idx})">×</button>
    </div>`
  ).join("") + "</div>";
  peToast("Photo supprimée");
}


// ===== PUBLIC VOICE ROOM (WebRTC + Firebase signaling) =====
/* VOICE_ROOM dynamic */
let _voiceJoined = false;
let _voiceMuted = false;
let _localStream = null;
let _voicePcs = {}; // uid -> RTCPeerConnection
let _voiceUnsubs = [];
let _voiceMembers = {};
let _makingOffer = {};

const RTC_CONFIG = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Free TURN (OpenRelay) — critical for hearing across NATs
    {
      urls: "turn:openrelay.metered.ca:80",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443",
      username: "openrelayproject",
      credential: "openrelayproject"
    },
    {
      urls: "turn:openrelay.metered.ca:443?transport=tcp",
      username: "openrelayproject",
      credential: "openrelayproject"
    }
  ],
  iceCandidatePoolSize: 4
};

let _voiceOutVol = 1;
let _voiceInGain = 1;
let _voiceTestOn = false;
let _voiceTestCtx = null;
let _voiceMeterRAF = null;
let _voiceAudioCtx = null;
let _voiceGainNode = null;
let _voiceAnalyser = null;


function voiceUiSet(joined) {
  const btn = document.getElementById("voiceJoinBtn");
  const mute = document.getElementById("voiceMuteBtn");
  const sub = document.getElementById("voiceSubs");
  const mem = document.getElementById("voiceMembers");
  if (btn) {
    btn.textContent = joined ? "Quitter" : "Rejoindre";
    btn.className = "voice-btn " + (joined ? "leave" : "join");
  }
  if (mute) mute.style.display = joined ? "inline-flex" : "none";
  const cam = document.getElementById("voiceCamBtn");
  if (cam) cam.style.display = joined ? "inline-flex" : "none";
  const scr = document.getElementById("voiceScreenBtn");
  if (scr) scr.style.display = joined ? "inline-flex" : "none";
  if (mem) mem.style.display = joined || Object.keys(_voiceMembers).length ? "flex" : "none";
  if (sub && !joined) sub.textContent = "1 salon · clique Rejoindre";
  if (!joined) {
    const vg = document.getElementById("voiceVideos");
    if (vg) { vg.style.display = "none"; vg.innerHTML = ""; }
    _voiceCamOn = false;
  }
}

async function toggleVoiceRoom() {
  if (_voiceJoined) await leaveVoiceRoom();
  else {
    if (!VOICE_ROOM) {
      alert("Choisis un salon dans la liste d'abord");
      return;
    }
    await joinVoiceRoom();
  }
}

async function joinVoiceRoom() {
  if (!currentUser) {
    if (_voiceGlobalCfg.requireLogin !== false) return openModal(false);
    return openModal(false);
  }
  if (!hasVoicePerm("voice")) return alert("Permission refusée : vocal");
  if (_voiceJoined) return;

  // Room rules (Discord-style)
  const room = (_voiceRoomsCache || []).find(r => r.id === VOICE_ROOM) || null;
  if (room) {
    if (room.locked && !isAdmin && !hasVoicePerm("manage_voice")) {
      return alert("Ce salon est verrouillé (admin / modo seulement).");
    }
    const lim = room.userLimit != null ? room.userLimit : (_voiceGlobalCfg.defaultLimit || 0);
    if (lim > 0) {
      try {
        const ms = await db.collection("voice").doc(VOICE_ROOM).collection("members").get();
        if (ms.size >= lim) return alert("Salon plein (" + lim + " max).");
      } catch (e) {}
    }
    window._currentVoiceRoomMeta = room;
  } else {
    window._currentVoiceRoomMeta = null;
  }

  if (!hasVoicePerm("speak")) {
    window._forceVoiceMute = true;
  } else {
    window._forceVoiceMute = false;
  }

  const subEl = document.getElementById("voiceSubs");
  if (subEl) subEl.textContent = "Demande du micro…";

  if (!window.isSecureContext) {
    alert("HTTPS requis pour le micro.");
    if (subEl) subEl.textContent = "HTTPS requis";
    return;
  }
  if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== "function") {
    alert("Navigateur incompatible avec le micro.");
    if (subEl) subEl.textContent = "Navigateur incompatible";
    return;
  }

  // Optional: ask permission status (Chrome)
  try {
    if (navigator.permissions && navigator.permissions.query) {
      const st = await navigator.permissions.query({ name: "microphone" });
      console.log("mic permission:", st.state);
      if (st.state === "denied") {
        alert(
          "Le micro est BLOQUÉ pour xultra.space.\n\n" +
          "1. Cadenas à gauche de l'URL\n" +
          "2. Microphone → Autoriser\n" +
          "3. Recharge (Ctrl+Shift+R)\n" +
          "4. Rejoindre"
        );
        if (subEl) subEl.textContent = "Micro bloqué — autorise puis F5";
        return;
      }
    }
  } catch (e) {}

  // Prefer default device, simplest constraints first
  let stream = null;
  let lastErr = null;
  const tries = [
    { audio: true },
    { audio: { deviceId: "default" } },
    { audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } }
  ];
  for (const c of tries) {
    try {
      stream = await navigator.mediaDevices.getUserMedia(c);
      break;
    } catch (e) {
      lastErr = e;
      console.warn("mic try failed", c, e.name, e.message);
    }
  }

  // Last resort: pick first input device explicitly
  if (!stream) {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === "audioinput");
      console.log("mics found", mics.length, mics.map(d => d.label || d.deviceId));
      if (mics.length) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: mics[0].deviceId } }
        });
      }
    } catch (e) {
      lastErr = e;
      console.warn("mic enumerate fail", e);
    }
  }

  if (!stream) {
    const name = (lastErr && lastErr.name) || "Error";
    const tip = {
      NotAllowedError: "Cadenas URL → Micro → Autoriser → Ctrl+Shift+R",
      PermissionDeniedError: "Cadenas URL → Micro → Autoriser → Ctrl+Shift+R",
      NotFoundError: "Aucun micro détecté (Windows Paramètres > Confidentialité > Micro)",
      DevicesNotFoundError: "Aucun micro détecté",
      NotReadableError: "Micro pris par Discord/OBS/Zoom — ferme-les",
      TrackStartError: "Micro pris par une autre appli",
      OverconstrainedError: "Réessaie après refresh",
      AbortError: "Réessaie"
    }[name] || ("Détail: " + name + " " + ((lastErr && lastErr.message) || ""));
    if (subEl) subEl.textContent = "Échec: " + name;
    alert("Impossible d'accéder au micro.\n\n" + tip);
    return;
  }

  _localStream = stream;
  _voiceJoined = true;
  _voiceMuted = false;
  if (window._forceVoiceMute) {
    _voiceMuted = true;
    try { stream.getAudioTracks().forEach(t => { t.enabled = false; }); } catch (e) {}
  }
  voiceUiSet(true);
  updateVoiceMuteBtn();

  const me = await db.collection("users").doc(currentUser.uid).get();
  const meData = me.exists ? me.data() : {};
  const name = meData.displayName || meData.username || "User";
  const av = meData.avatar || "";
  const uname = meData.username || "";
  await ensureRolesCache();
  const grade = resolveUserRole({ ...meData, email: currentUser.email });

  // presence + heartbeat (Firestore n'a pas onDisconnect comme RTDB)
  const pref = db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid);
  const writePresence = () => pref.set({
    uid: currentUser.uid,
    name,
    username: uname,
    avatar: av,
    muted: !!_voiceMuted,
    cam: !!_voiceCamOn,
    roleId: grade ? grade.id : null,
    roleName: grade ? grade.name : null,
    roleColor: grade ? grade.color : null,
    beat: Date.now(),
    joinedAt: firebase.firestore.FieldValue.serverTimestamp()
  }, { merge: true });
  await writePresence();
  const beatIv = setInterval(() => {
    if (!_voiceJoined || !currentUser) return;
    pref.set({ beat: Date.now(), muted: !!_voiceMuted, cam: !!_voiceCamOn }, { merge: true }).catch(() => {});
  }, 8000);
  _voiceUnsubs.push(() => clearInterval(beatIv));

  // listen members — ignore ghost (no beat > 25s)
  const unsubM = db.collection("voice").doc(VOICE_ROOM).collection("members")
    .onSnapshot(async snap => {
      const now = {};
      const stale = [];
      const tnow = Date.now();
      snap.forEach(d => {
        const data = d.data() || {};
        const beat = data.beat || (data.joinedAt && data.joinedAt.toDate ? data.joinedAt.toDate().getTime() : 0);
        if (beat && tnow - beat > 25000 && d.id !== (currentUser && currentUser.uid)) {
          stale.push(d.id);
          return;
        }
        now[d.id] = data;
      });
      // prune ghosts (best-effort)
      stale.forEach(id => {
        db.collection("voice").doc(VOICE_ROOM).collection("members").doc(id).delete().catch(() => {});
      });
      Object.keys(_voicePcs).forEach(uid => {
        if (!now[uid] || uid === currentUser.uid) {
          try { _voicePcs[uid].close(); } catch (e) {}
          delete _voicePcs[uid];
          const a = document.getElementById("vaudio-" + uid);
          if (a) a.remove();
          const vt = document.getElementById("vvid-" + uid);
          if (vt) vt.remove();
        }
      });
      _voiceMembers = now;
      renderVoiceMembers();
      updateVoiceVideoGrid();
      for (const uid of Object.keys(now)) {
        if (uid === currentUser.uid) continue;
        if (!_voicePcs[uid]) {
          const impolite = currentUser.uid > uid;
          await ensureVoicePc(uid, !impolite);
        }
      }
      const n = Object.keys(now).length;
      const sub = document.getElementById("voiceSubs");
      if (sub) sub.textContent = n + " dans le salon" + (_voiceMuted ? " · muet" : "");
    }, err => console.error("voice members", err));
  _voiceUnsubs.push(unsubM);

  // listen signals to me
  const unsubS = db.collection("voice").doc(VOICE_ROOM).collection("signals")
    .where("to", "==", currentUser.uid)
    .onSnapshot(async snap => {
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;
        const sig = change.doc.data();
        const from = sig.from;
        if (!from || from === currentUser.uid) continue;
        try {
          await handleVoiceSignal(from, sig);
        } catch (e) { console.error("signal", e); }
        // delete consumed
        try { await change.doc.ref.delete(); } catch (e) {}
      }
    }, err => console.error("voice signals", err));
  _voiceUnsubs.push(unsubS);

  ensureVoiceAudioBox();
  loadVoiceDevices();
  startVoiceMeter();
  setVoiceDebug("Dans le salon — en attente des autres…");
}

function ensureVoiceAudioBox() {
  if (!document.getElementById("voiceAudioBox")) {
    const box = document.createElement("div");
    box.id = "voiceAudioBox";
    document.body.appendChild(box);
  }
}

async function ensureVoicePc(remoteUid, shouldOffer) {
  if (_voicePcs[remoteUid] || !currentUser) return;
  const pc = new RTCPeerConnection(RTC_CONFIG);
  _voicePcs[remoteUid] = pc;

  // Audio tracks (never removed when cam toggles)
  if (_localStream && _localStream.getAudioTracks().length) {
    _localStream.getAudioTracks().forEach(t => {
      try { pc.addTrack(t, _localStream); } catch (e) {}
    });
  } else {
    try { pc.addTransceiver("audio", { direction: "sendrecv" }); } catch (e) {}
  }
  // Video: always create a sendrecv transceiver so replaceTrack works later
  try {
    if (_localStream && _localStream.getVideoTracks().length) {
      _localStream.getVideoTracks().forEach(t => {
        try { pc.addTrack(t, _localStream); } catch (e) {}
      });
    } else {
      pc.addTransceiver("video", { direction: "sendrecv" });
    }
  } catch (e) {
    try { pc.addTransceiver("video", { direction: "sendrecv" }); } catch (e2) {}
  }

  pc.onicecandidate = (ev) => {
    if (ev.candidate) {
      sendVoiceSignal(remoteUid, { type: "ice", candidate: ev.candidate.toJSON() });
    }
  };

  pc.ontrack = (ev) => {
    ensureVoiceAudioBox();
    // IMPORTANT: attach each track on its own MediaStream so video doesn't kill audio
    if (ev.track.kind === "audio") {
      let audio = document.getElementById("vaudio-" + remoteUid);
      if (!audio) {
        audio = document.createElement("audio");
        audio.id = "vaudio-" + remoteUid;
        audio.autoplay = true;
        audio.playsInline = true;
        document.getElementById("voiceAudioBox").appendChild(audio);
      }
      audio.srcObject = new MediaStream([ev.track]);
      audio.volume = _voiceOutVol;
      const tryPlay = () => audio.play().catch(() => {});
      tryPlay();
      setTimeout(tryPlay, 400);
      setTimeout(tryPlay, 1200);
      changeVoiceOutput();
      setVoiceDebug("Audio reçu");
    }
    if (ev.track.kind === "video") {
      showRemoteVoiceVideo(remoteUid, new MediaStream([ev.track]));
      setVoiceDebug("Vidéo reçue");
    }
  };

  pc.onconnectionstatechange = () => {
    setVoiceDebug("Connexion " + remoteUid.slice(0, 6) + ": " + pc.connectionState);
    if (pc.connectionState === "connected") {
      setVoiceDebug("Audio connecté ✓");
    }
    if (pc.connectionState === "failed") {
      setVoiceDebug("Échec — nouvel essai…");
      setTimeout(() => restartVoicePc(remoteUid), 1500);
    }
    if (["closed", "disconnected"].includes(pc.connectionState)) {
      try { pc.close(); } catch (e) {}
      delete _voicePcs[remoteUid];
    }
  };
  pc.oniceconnectionstatechange = () => {
    console.log("ICE", remoteUid, pc.iceConnectionState);
  };

  if (shouldOffer) {
    try {
      _makingOffer[remoteUid] = true;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      await sendVoiceSignal(remoteUid, { type: "offer", sdp: pc.localDescription.toJSON() });
    } catch (e) {
      console.error("offer", e);
    } finally {
      _makingOffer[remoteUid] = false;
    }
  }
}

async function handleVoiceSignal(from, sig) {
  if (!_voiceJoined) return;
  if (!_voicePcs[from]) await ensureVoicePc(from, false);
  const pc = _voicePcs[from];
  if (!pc) return;

  if (sig.type === "offer" && sig.sdp) {
    if (_makingOffer[from]) return; // glare ignore simple
    await pc.setRemoteDescription(sig.sdp);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);
    await sendVoiceSignal(from, { type: "answer", sdp: pc.localDescription.toJSON() });
  } else if (sig.type === "answer" && sig.sdp) {
    if (!pc.currentRemoteDescription) {
      await pc.setRemoteDescription(sig.sdp);
    }
  } else if (sig.type === "ice" && sig.candidate) {
    try {
      await pc.addIceCandidate(sig.candidate);
    } catch (e) {
      console.log("ice", e);
    }
  }
}

async function sendVoiceSignal(to, payload) {
  if (!currentUser) return;
  await db.collection("voice").doc(VOICE_ROOM).collection("signals").add({
    from: currentUser.uid,
    to,
    ...payload,
    at: firebase.firestore.FieldValue.serverTimestamp()
  });
}

function renderVoiceMembers() {
  const box = document.getElementById("voiceMembers");
  if (!box) return;
  const ids = Object.keys(_voiceMembers);
  if (!ids.length) {
    box.innerHTML = "";
    box.style.display = "none";
    return;
  }
  box.style.display = "flex";
  box.innerHTML = ids.map(uid => {
    const m = _voiceMembers[uid];
    const me = currentUser && uid === currentUser.uid;
    const roleBit = m.roleName
      ? `<span class="role-mini" style="color:${esc(m.roleColor||"#a78bfa")};border-color:${esc(m.roleColor||"#a78bfa")}">${esc(m.roleName)}</span>`
      : "";
    const uname = m.username || "";
    const click = uname ? `onclick="showUserProfile('${esc(uname)}')"` : "";
    return `<div class="voice-pill ${me ? "me" : ""}" ${click} style="cursor:pointer">
      <span class="vd"></span>
      <span>${esc(m.name || "User")}${m.muted ? " 🔇" : ""}${me ? " (toi)" : ""}</span>
      ${roleBit}
    </div>`;
  }).join("");
}

function toggleVoiceMute() {
  if (!_localStream) return;
  _voiceMuted = !_voiceMuted;
  _localStream.getAudioTracks().forEach(t => { t.enabled = !_voiceMuted; });
  updateVoiceMuteBtn();
  if (currentUser) {
    db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid)
      .set({ muted: _voiceMuted }, { merge: true }).catch(() => {});
  }
  const sub = document.getElementById("voiceSubs");
  if (sub && _voiceJoined) {
    const n = Object.keys(_voiceMembers).length;
    sub.textContent = n + " dans le salon" + (_voiceMuted ? " · muet" : "");
  }
}

function updateVoiceMuteBtn() {
  const mute = document.getElementById("voiceMuteBtn");
  if (!mute) return;
  mute.textContent = _voiceMuted ? "🔇" : "🎤";
  mute.className = "voice-btn" + (_voiceMuted ? " muted" : "");
  mute.title = _voiceMuted ? "Activer le micro" : "Couper le micro";
}



function setVoiceDebug(msg) {
  const el = document.getElementById("voiceDebug");
  if (el) el.textContent = msg || "";
}

function toggleVoiceSettings() {
  const box = document.getElementById("voiceSettings");
  if (!box) return;
  const open = box.style.display !== "none";
  box.style.display = open ? "none" : "block";
  if (!open) loadVoiceDevices();
}

async function loadVoiceDevices() {
  try {
    // need permission for labels
    if (!_localStream) {
      try {
        const tmp = await navigator.mediaDevices.getUserMedia({ audio: true });
        tmp.getTracks().forEach(t => t.stop());
      } catch (e) {}
    }
    const devices = await navigator.mediaDevices.enumerateDevices();
    const inputs = devices.filter(d => d.kind === "audioinput");
    const outputs = devices.filter(d => d.kind === "audiooutput");
    const inSel = document.getElementById("voiceInputDevice");
    const outSel = document.getElementById("voiceOutputDevice");
    if (inSel) {
      const cur = inSel.value;
      inSel.innerHTML = inputs.map(d =>
        `<option value="${esc(d.deviceId)}">${esc(d.label || "Micro " + d.deviceId.slice(0, 6))}</option>`
      ).join("") || '<option value="">Défaut</option>';
      if (cur) inSel.value = cur;
    }
    if (outSel) {
      const cur = outSel.value;
      outSel.innerHTML = outputs.map(d =>
        `<option value="${esc(d.deviceId)}">${esc(d.label || "Sortie " + d.deviceId.slice(0, 6))}</option>`
      ).join("") || '<option value="">Défaut</option>';
      if (cur) outSel.value = cur;
    }
  } catch (e) {
    console.warn(e);
  }
}

async function changeVoiceInput() {
  if (!_voiceJoined) return;
  const id = document.getElementById("voiceInputDevice")?.value;
  const echo = document.getElementById("voiceEcho")?.checked !== false;
  const noise = document.getElementById("voiceNoise")?.checked !== false;
  const constraints = {
    audio: {
      deviceId: id ? { exact: id } : undefined,
      echoCancellation: echo,
      noiseSuppression: noise
    }
  };
  try {
    const newStream = await navigator.mediaDevices.getUserMedia(constraints);
    const newTrack = newStream.getAudioTracks()[0];
    // replace track in all peer connections
    Object.values(_voicePcs).forEach(pc => {
      const sender = pc.getSenders().find(s => s.track && s.track.kind === "audio");
      if (sender) sender.replaceTrack(newTrack);
    });
    if (_localStream) _localStream.getTracks().forEach(t => t.stop());
    _localStream = newStream;
    if (_voiceMuted) newTrack.enabled = false;
    startVoiceMeter();
    setVoiceDebug("Micro changé");
  } catch (e) {
    alert("Changement micro: " + (e.message || e.name));
  }
}

async function changeVoiceOutput() {
  const id = document.getElementById("voiceOutputDevice")?.value;
  if (!id) return;
  document.querySelectorAll("#voiceAudioBox audio").forEach(async (a) => {
    if (typeof a.setSinkId === "function") {
      try { await a.setSinkId(id); } catch (e) { console.warn("setSinkId", e); }
    }
  });
}

function setVoiceInVol(v) {
  _voiceInGain = Math.max(0, Math.min(1, Number(v) / 100));
  const lab = document.getElementById("voiceInVolLabel");
  if (lab) lab.textContent = v + "%";
  // soft mute below 5%
  if (_localStream) {
    _localStream.getAudioTracks().forEach(t => {
      if (!_voiceMuted) t.enabled = _voiceInGain > 0.02;
    });
  }
}

function setVoiceOutVol(v) {
  _voiceOutVol = Math.max(0, Math.min(1, Number(v) / 100));
  const lab = document.getElementById("voiceOutVolLabel");
  if (lab) lab.textContent = v + "%";
  document.querySelectorAll("#voiceAudioBox audio").forEach(a => { a.volume = _voiceOutVol; });
}

function startVoiceMeter() {
  stopVoiceMeter();
  if (!_localStream) return;
  try {
    _voiceAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = _voiceAudioCtx.createMediaStreamSource(_localStream);
    _voiceAnalyser = _voiceAudioCtx.createAnalyser();
    _voiceAnalyser.fftSize = 256;
    src.connect(_voiceAnalyser);
    // do NOT connect to destination (would hear self always) — only for test
    const data = new Uint8Array(_voiceAnalyser.frequencyBinCount);
    const tick = () => {
      _voiceMeterRAF = requestAnimationFrame(tick);
      if (!_voiceAnalyser) return;
      _voiceAnalyser.getByteFrequencyData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) sum += data[i];
      const avg = sum / data.length / 255;
      const fill = document.getElementById("voiceMeterFill");
      if (fill) fill.style.width = Math.min(100, Math.round(avg * 180 * (_voiceMuted ? 0 : 1))) + "%";
    };
    tick();
  } catch (e) {
    console.warn("meter", e);
  }
}

function stopVoiceMeter() {
  if (_voiceMeterRAF) cancelAnimationFrame(_voiceMeterRAF);
  _voiceMeterRAF = null;
  if (_voiceTestOn) toggleVoiceTest(true);
  try { if (_voiceAudioCtx) _voiceAudioCtx.close(); } catch (e) {}
  _voiceAudioCtx = null;
  _voiceAnalyser = null;
}

function toggleVoiceTest(forceOff) {
  const btn = document.getElementById("voiceTestBtn");
  const hint = document.getElementById("voiceTestHint");
  if (forceOff || _voiceTestOn) {
    _voiceTestOn = false;
    try {
      if (_voiceTestCtx) {
        // disconnect path to speakers
        _voiceTestCtx.close();
      }
    } catch (e) {}
    _voiceTestCtx = null;
    if (btn) btn.textContent = "🎧 Tester mon micro";
    if (hint) hint.textContent = "Tu dois t'entendre en local";
    startVoiceMeter();
    return;
  }
  if (!_localStream) {
    alert("Rejoins le vocal d'abord (ou autorise le micro).");
    return;
  }
  try {
    _voiceTestOn = true;
    _voiceTestCtx = new (window.AudioContext || window.webkitAudioContext)();
    const src = _voiceTestCtx.createMediaStreamSource(_localStream);
    const gain = _voiceTestCtx.createGain();
    gain.gain.value = 0.7;
    src.connect(gain);
    gain.connect(_voiceTestCtx.destination);
    if (btn) btn.textContent = "⏹ Stop test";
    if (hint) hint.textContent = "Écoute-toi — si tu t'entends, le micro marche";
    setVoiceDebug("Test micro actif (loopback local)");
  } catch (e) {
    alert("Test micro: " + e.message);
    _voiceTestOn = false;
  }
}

async function rebuildVoiceConstraints() {
  if (_voiceJoined) await changeVoiceInput();
}

async function leaveVoiceRoom() {
  _voiceJoined = false;
  stopVoiceMeter();
  _voiceUnsubs.forEach(u => { try { u(); } catch (e) {} });
  _voiceUnsubs = [];
  Object.values(_voicePcs).forEach(pc => { try { pc.close(); } catch (e) {} });
  _voicePcs = {};
  if (_localStream) {
    _localStream.getTracks().forEach(t => t.stop());
    _localStream = null;
  }
  _voiceCamOn = false;
  _voiceScreenOn = false;
  try { closeVoiceFocus(); } catch (e) {}
  const sb = document.getElementById("voiceScreenBtn");
  if (sb) sb.classList.remove("cam-on");
  const vg = document.getElementById("voiceVideos");
  if (vg) { vg.innerHTML = ""; vg.style.display = "none"; }
  const cb = document.getElementById("voiceCamBtn");
  if (cb) cb.classList.remove("cam-on");
  setVoiceDebug("");
  const box = document.getElementById("voiceAudioBox");
  if (box) box.innerHTML = "";
  if (currentUser) {
    try {
      await db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid).delete();
    } catch (e) {}
  }
  _voiceMembers = {};
  voiceUiSet(false);
  renderVoiceMembers();
}

// leave voice on logout
const _prevAuthVoice = auth.onAuthStateChanged;


// ===== WEATHER =====
async function loadWeather() {
  const cityEl = document.getElementById("wxCity");
  const tempEl = document.getElementById("wxTemp");
  const descEl = document.getElementById("wxDesc");
  const iconEl = document.getElementById("wxIcon");
  if (!tempEl) return;
  const withTimeout = (p, ms) => Promise.race([
    p,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))
  ]);
  try {
    let lat, lon, city = "";
    try {
      const g = await withTimeout(fetch("https://ipapi.co/json/"), 4000);
      const gd = await g.json();
      lat = gd.latitude; lon = gd.longitude;
      city = [gd.city, gd.country_name].filter(Boolean).join(", ");
    } catch (e) {
      try {
        const g2 = await withTimeout(fetch("https://ip-api.com/json/?fields=status,city,country,lat,lon"), 4000);
        const gd = await g2.json();
        if (gd.status === "success") {
          lat = gd.lat; lon = gd.lon;
          city = [gd.city, gd.country].filter(Boolean).join(", ");
        }
      } catch (e2) {}
    }
    if (lat == null) throw new Error("geo");
    const w = await withTimeout(fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&timezone=auto`
    ), 5000);
    const wd = await w.json();
    const t = Math.round(wd.current?.temperature_2m ?? 0);
    const code = wd.current?.weather_code ?? 0;
    const map = {
      0: ["☀", "Clair"], 1: ["🌤", "Plutôt clair"], 2: ["⛅", "Partiellement nuageux"],
      3: ["☁", "Couvert"], 45: ["🌫", "Brouillard"], 48: ["🌫", "Brouillard"],
      51: ["🌦", "Bruine"], 61: ["🌧", "Pluie"], 63: ["🌧", "Pluie"],
      71: ["❄", "Neige"], 80: ["🌧", "Averses"], 95: ["⛈", "Orage"]
    };
    const [ic, desc] = map[code] || map[Math.floor(code/10)*10] || ["☁", "Météo"];
    if (tempEl) tempEl.textContent = t + "°";
    if (iconEl) iconEl.textContent = ic;
    if (cityEl) cityEl.textContent = city || "Ta région";
    if (descEl) descEl.textContent = desc;
  } catch (e) {
    console.warn("weather", e);
    if (cityEl) cityEl.textContent = "Météo indisponible";
  }
}

// ===== MULTI VOICE ROOMS =====
let VOICE_ROOM = null; // selected room id
let _voiceRoomsCache = [];
let _voiceCatsCache = [];

async function loadVoiceChannelsUI() {
  const box = document.getElementById("voiceChannelsList");
  if (!box) return;
  try {
    if (!_voiceGlobalCfg || !_voiceGlobalCfg._loaded) {
      try {
        const vdoc = await db.collection("settings").doc("voice").get();
        if (vdoc.exists) _voiceGlobalCfg = { ..._voiceGlobalCfg, ...vdoc.data(), _loaded: true };
        else _voiceGlobalCfg._loaded = true;
      } catch (e) { _voiceGlobalCfg._loaded = true; }
    }
    let roomsSnap, catsSnap;
    try {
      roomsSnap = await db.collection("voiceRooms").orderBy("order").get();
    } catch (e) {
      roomsSnap = await db.collection("voiceRooms").get();
    }
    try {
      catsSnap = await db.collection("voiceCategories").orderBy("order").get();
    } catch (e) {
      catsSnap = await db.collection("voiceCategories").get();
    }
    _voiceRoomsCache = roomsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    _voiceCatsCache = catsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (!_voiceRoomsCache.length) {
      _voiceRoomsCache = [{ id: "public", name: "Général", categoryId: "" }];
    }

    const counts = {};
    try {
      const tnow = Date.now();
      for (const r of _voiceRoomsCache.slice(0, 16)) {
        const ms = await db.collection("voice").doc(r.id).collection("members").get();
        let live = 0;
        ms.forEach(d => {
          const data = d.data() || {};
          const beat = data.beat || 0;
          if (!beat || tnow - beat < 30000) live++;
          else d.ref.delete().catch(() => {});
        });
        counts[r.id] = live;
      }
    } catch (e) {}

    let html = "";
    if (_voiceGlobalCfg.hint) {
      html += `<div class="hint" style="padding:4px 6px">${esc(_voiceGlobalCfg.hint)}</div>`;
    }
    const byCat = {};
    _voiceRoomsCache.forEach(r => {
      const c = r.categoryId || "_none";
      if (!byCat[c]) byCat[c] = [];
      byCat[c].push(r);
    });
    const catOrder = _voiceCatsCache.map(c => c.id);
    const orderedKeys = [...catOrder.filter(id => byCat[id]), ...Object.keys(byCat).filter(k => k === "_none" || !catOrder.includes(k))];
    orderedKeys.forEach(cid => {
      const roomsInCat = (byCat[cid] || []).filter(r => {
        if (_voiceGlobalCfg.hideEmpty && (counts[r.id] || 0) === 0 && VOICE_ROOM !== r.id && !_voiceJoined)
          return true; // still show empty by default for discovery — hideEmpty only dims
        return true;
      });
      if (!roomsInCat.length) return;
      if (cid !== "_none") {
        const cat = _voiceCatsCache.find(c => c.id === cid);
        html += `<div class="vc-cat">${esc(cat?.name || "Catégorie")}</div>`;
      } else if (_voiceCatsCache.length) {
        html += `<div class="vc-cat">Autres</div>`;
      }
      roomsInCat.forEach(r => {
        const active = VOICE_ROOM === r.id ? "active" : "";
        const n = counts[r.id] || 0;
        const lim = r.userLimit > 0 ? r.userLimit : 0;
        const lock = r.locked ? "🔒 " : "";
        const countTxt = lim ? `${n}/${lim}` : (n ? n + " ●" : "");
        const emptyCls = (_voiceGlobalCfg.hideEmpty && n === 0) ? " vc-empty" : "";
        html += `<div class="vc-room ${active}${emptyCls}" onclick="selectVoiceRoom('${esc(r.id)}','${esc(r.name||"Salon")}')">
          <span>🔊</span><span>${lock}${esc(r.name || "Salon")}</span>
          <span class="vc-count">${countTxt}</span>
        </div>`;
      });
    });
    box.innerHTML = html || '<div class="hint">Aucun salon — admin peut en créer</div>';
  } catch (e) {
    console.error(e);
    box.innerHTML = `<div class="vc-room" onclick="selectVoiceRoom('public','Général')"><span>🔊</span> Général</div>`;
  }
}

function selectVoiceRoom(id, name) {
  if (_voiceJoined && VOICE_ROOM && VOICE_ROOM !== id) {
    if (!confirm("Quitter le salon actuel pour rejoindre « " + name + " » ?")) return;
    leaveVoiceRoom().then(() => {
      VOICE_ROOM = id;
      finalizeSelectRoom(id, name);
    });
    return;
  }
  VOICE_ROOM = id;
  finalizeSelectRoom(id, name);
}

function finalizeSelectRoom(id, name) {
  const title = document.getElementById("voiceActiveName");
  const sub = document.getElementById("voiceSubs");
  const btn = document.getElementById("voiceJoinBtn");
  if (title) title.textContent = name || id;
  if (sub) sub.textContent = _voiceJoined ? "Connecté" : "Prêt — clique Rejoindre";
  if (btn) btn.disabled = false;
  document.querySelectorAll(".vc-room").forEach(el => {
    el.classList.toggle("active", el.getAttribute("onclick")?.includes("'" + id + "'"));
  });
  const lab = document.getElementById("vhChatRoomLabel");
  if (lab) lab.textContent = name || id;
  window._currentVoiceRoomMeta = (_voiceRoomsCache || []).find(r => r.id === id) || null;
  listenVoiceRoomChat(id);
}

let _voiceChatUnsub = null;

function listenVoiceRoomChat(roomId) {
  const box = document.getElementById("voiceRoomChat");
  if (!box) return;
  if (_voiceChatUnsub) {
    try { _voiceChatUnsub(); } catch (e) {}
    _voiceChatUnsub = null;
  }
  if (!roomId) {
    box.innerHTML = '<div class="hint">Sélectionne un salon</div>';
    return;
  }
  box.innerHTML = '<div class="loading">Chargement chat salon…</div>';
  try {
    _voiceChatUnsub = db.collection("voiceChat").doc(roomId).collection("messages")
      .orderBy("createdAt", "desc").limit(80)
      .onSnapshot(snap => {
        const msgs = [];
        snap.forEach(d => msgs.push({ id: d.id, ...d.data() }));
        msgs.reverse();
        if (!msgs.length) {
          box.innerHTML = '<div class="hint">Aucun message dans ce salon</div>';
          return;
        }
        box.innerHTML = msgs.map(m => {
          const roleBit = m.roleName
            ? `<span class="role-mini" style="color:${esc(m.roleColor||"#a78bfa")};border-color:${esc(m.roleColor||"#a78bfa")}">${esc(m.roleName)}</span>`
            : "";
          let time = "";
          try {
            if (m.createdAt && m.createdAt.toDate) time = m.createdAt.toDate().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
          } catch (e) {}
          const canDel = isAdmin || (currentUser && m.uid === currentUser.uid) || hasVoicePerm("manage_voice");
          const del = canDel
            ? `<button type="button" class="chat-del" onclick="deleteVoiceChatMsg('${esc(roomId)}','${esc(m.id)}')">×</button>`
            : "";
          const handle = handleForChat(m);
          return `<div class="chat-msg">
            <span class="cm-user" onclick="showUserProfile('${esc(m.username||"")}')" title="${esc(handle)}">${esc(m.displayName||"User")} <span class="handle-inline">${esc(handle)}</span></span>
            ${roleBit}
            ${esc(m.text||"")}
            <span class="cm-time">${time}</span>${del}
          </div>`;
        }).join("");
        box.scrollTop = box.scrollHeight;
      }, err => {
        box.innerHTML = '<div class="hint">Chat salon indisponible</div>';
        console.warn(err);
      });
  } catch (e) {
    box.innerHTML = '<div class="hint">Erreur chat salon</div>';
  }
}

async function sendVoiceRoomChat(e) {
  e.preventDefault();
  if (!currentUser) return openModal(false);
  if (!hasVoicePerm("voice_chat") && !hasVoicePerm("voice")) return alert("Permission refusée : chat vocal");
  if (!VOICE_ROOM) return alert("Choisis un salon d'abord");
  const input = document.getElementById("voiceChatInput");
  let text = (input?.value || "").trim().slice(0, 400);
  if (!text) return;
  try { if (typeof encryptPublicText === "function") text = await encryptPublicText(text); } catch (e) {}
  await ensureRolesCache();
  let displayName = "User", username = "", roleName = null, roleColor = null;
  try {
    const u = await db.collection("users").doc(currentUser.uid).get();
    if (u.exists) {
      const d = u.data();
      displayName = d.displayName || d.username || "User";
      username = d.username || "";
      const g = resolveUserRole({ ...d, email: currentUser.email });
      if (g) { roleName = g.name; roleColor = g.color; }
    }
  } catch (err) {}
  try {
    await db.collection("voiceChat").doc(VOICE_ROOM).collection("messages").add({
      text: stripDangerous ? stripDangerous(text, 400) : text,
      uid: currentUser.uid,
      displayName,
      username,
      roleName,
      roleColor,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    if (input) input.value = "";
  } catch (err) {
    alert("Erreur envoi : " + (err.message || err));
  }
}

async function deleteVoiceChatMsg(roomId, msgId) {
  if (!roomId || !msgId) return;
  try {
    await db.collection("voiceChat").doc(roomId).collection("messages").doc(msgId).delete();
  } catch (e) {
    alert("Suppression impossible : " + (e.message || e));
  }
}

// Admin voice management (Discord-style params)
async function loadVoiceGlobalSettings() {
  try {
    const doc = await db.collection("settings").doc("voice").get();
    if (doc.exists) _voiceGlobalCfg = { ..._voiceGlobalCfg, ...doc.data() };
  } catch (e) { console.warn(e); }
  const g = _voiceGlobalCfg;
  const set = (id, v, isCheck) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (isCheck) el.checked = !!v;
    else el.value = v != null ? v : "";
  };
  set("voiceAfkMin", g.afkMin || 5);
  set("voiceDefaultLimit", g.defaultLimit || 0);
  set("voiceRequireLogin", g.requireLogin !== false, true);
  set("voiceAllowCamDefault", g.allowCamDefault !== false, true);
  set("voiceAllowScreenDefault", g.allowScreenDefault !== false, true);
  set("voiceHideEmpty", g.hideEmpty !== false, true);
  set("voiceGlobalHint", g.hint || "");
}

async function saveVoiceGlobalSettings() {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  const data = {
    afkMin: Math.max(1, Math.min(120, parseInt(document.getElementById("voiceAfkMin")?.value || "5", 10))),
    defaultLimit: Math.max(0, Math.min(50, parseInt(document.getElementById("voiceDefaultLimit")?.value || "0", 10))),
    requireLogin: !!document.getElementById("voiceRequireLogin")?.checked,
    allowCamDefault: !!document.getElementById("voiceAllowCamDefault")?.checked,
    allowScreenDefault: !!document.getElementById("voiceAllowScreenDefault")?.checked,
    hideEmpty: !!document.getElementById("voiceHideEmpty")?.checked,
    hint: (document.getElementById("voiceGlobalHint")?.value || "").trim().slice(0, 200),
    updatedAt: Date.now()
  };
  try {
    await db.collection("settings").doc("voice").set(data, { merge: true });
    _voiceGlobalCfg = { ..._voiceGlobalCfg, ...data };
    loadVoiceChannelsUI();
    alert("Paramètres vocaux enregistrés !");
  } catch (e) {
    console.error(e);
    alert("Erreur : " + (e.message || e));
  }
}

async function adminAddVoiceCategory() {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  const name = document.getElementById("voiceCatName")?.value.trim();
  if (!name) return alert("Nom requis");
  try {
    await db.collection("voiceCategories").add({ name, order: Date.now() });
    document.getElementById("voiceCatName").value = "";
    await loadAdminVoiceUI();
    loadVoiceChannelsUI();
    alert("Catégorie créée");
  } catch (e) {
    alert("Erreur : " + (e.message || e));
  }
}

async function adminAddVoiceRoom() {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  const name = document.getElementById("voiceRoomName")?.value.trim();
  if (!name) return alert("Nom requis");
  const categoryId = document.getElementById("voiceRoomCat")?.value || "";
  try {
    await db.collection("voiceRooms").add({
      name,
      categoryId,
      order: Date.now(),
      userLimit: _voiceGlobalCfg.defaultLimit || 0,
      locked: false,
      allowCam: _voiceGlobalCfg.allowCamDefault !== false,
      allowScreen: _voiceGlobalCfg.allowScreenDefault !== false,
      desc: ""
    });
    document.getElementById("voiceRoomName").value = "";
    await loadAdminVoiceUI();
    loadVoiceChannelsUI();
    alert("Salon créé");
  } catch (e) {
    alert("Erreur : " + (e.message || e));
  }
}

async function adminDeleteVoiceRoom(id) {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  if (!confirm("Supprimer ce salon ?")) return;
  try {
    await db.collection("voiceRooms").doc(id).delete();
    closeVoiceRoomEdit();
    await loadAdminVoiceUI();
    loadVoiceChannelsUI();
  } catch (e) {
    alert("Erreur : " + (e.message || e));
  }
}

async function adminDeleteVoiceCategory(id) {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  if (!confirm("Supprimer cette catégorie ?")) return;
  try {
    await db.collection("voiceCategories").doc(id).delete();
    await loadAdminVoiceUI();
    loadVoiceChannelsUI();
  } catch (e) {
    alert("Erreur : " + (e.message || e));
  }
}

function openVoiceRoomEdit(id) {
  const r = (_voiceRoomsCache || []).find(x => x.id === id);
  if (!r) {
    // try from admin list cache
    const el = document.querySelector(`[data-room-id="${id}"]`);
    if (!el) return alert("Salon introuvable — recharge l'onglet Vocal");
  }
  const room = r || { id };
  document.getElementById("vrEditId").value = id;
  document.getElementById("vrEditName").value = room.name || "";
  document.getElementById("vrEditLimit").value = room.userLimit != null ? room.userLimit : 0;
  document.getElementById("vrEditOrder").value = room.order != null ? room.order : 0;
  document.getElementById("vrEditLocked").checked = !!room.locked;
  document.getElementById("vrEditAllowCam").checked = room.allowCam !== false;
  document.getElementById("vrEditAllowScreen").checked = room.allowScreen !== false;
  document.getElementById("vrEditDesc").value = room.desc || "";
  const catSel = document.getElementById("vrEditCat");
  if (catSel) {
    catSel.innerHTML = '<option value="">Sans catégorie</option>' +
      (_voiceCatsCache || []).map(c =>
        `<option value="${c.id}" ${c.id === (room.categoryId || "") ? "selected" : ""}>${esc(c.name || "")}</option>`
      ).join("");
  }
  const box = document.getElementById("voiceRoomEditBox");
  if (box) box.style.display = "block";
  box?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function closeVoiceRoomEdit() {
  const box = document.getElementById("voiceRoomEditBox");
  if (box) box.style.display = "none";
  const id = document.getElementById("vrEditId");
  if (id) id.value = "";
}

async function adminSaveVoiceRoomEdit() {
  if (!isAdmin && !hasPerm("manage_voice")) return alert("Permission refusée");
  const id = document.getElementById("vrEditId")?.value;
  if (!id) return alert("Aucun salon sélectionné");
  const payload = {
    name: (document.getElementById("vrEditName")?.value || "").trim() || "Salon",
    categoryId: document.getElementById("vrEditCat")?.value || "",
    userLimit: Math.max(0, Math.min(50, parseInt(document.getElementById("vrEditLimit")?.value || "0", 10))),
    order: parseInt(document.getElementById("vrEditOrder")?.value || "0", 10) || Date.now(),
    locked: !!document.getElementById("vrEditLocked")?.checked,
    allowCam: !!document.getElementById("vrEditAllowCam")?.checked,
    allowScreen: !!document.getElementById("vrEditAllowScreen")?.checked,
    desc: (document.getElementById("vrEditDesc")?.value || "").trim().slice(0, 200),
    updatedAt: Date.now()
  };
  try {
    await db.collection("voiceRooms").doc(id).set(payload, { merge: true });
    closeVoiceRoomEdit();
    await loadAdminVoiceUI();
    loadVoiceChannelsUI();
    alert("Salon enregistré !");
  } catch (e) {
    console.error(e);
    alert("Erreur : " + (e.message || e));
  }
}

async function loadAdminVoiceUI() {
  if (!isAdmin && !hasPerm("manage_voice")) return;
  try {
    await loadVoiceGlobalSettings();
    let cats, rooms;
    try {
      cats = await db.collection("voiceCategories").orderBy("order").get();
    } catch (e) {
      cats = await db.collection("voiceCategories").get();
    }
    try {
      rooms = await db.collection("voiceRooms").orderBy("order").get();
    } catch (e) {
      rooms = await db.collection("voiceRooms").get();
    }
    _voiceCatsCache = cats.docs.map(d => ({ id: d.id, ...d.data() }));
    _voiceRoomsCache = rooms.docs.map(d => ({ id: d.id, ...d.data() }));

    const catBox = document.getElementById("adminVoiceCats");
    const roomBox = document.getElementById("adminVoiceRooms");
    const sel = document.getElementById("voiceRoomCat");
    if (sel) {
      sel.innerHTML = '<option value="">Sans catégorie</option>' +
        _voiceCatsCache.map(c => `<option value="${c.id}">${esc(c.name || "")}</option>`).join("");
    }
    if (catBox) {
      catBox.innerHTML = _voiceCatsCache.map(c =>
        `<div class="admin-track"><span>${esc(c.name)}</span>
        <button class="btn-danger" onclick="adminDeleteVoiceCategory('${c.id}')">×</button></div>`
      ).join("") || '<p class="hint">Aucune catégorie</p>';
    }
    if (roomBox) {
      roomBox.innerHTML = _voiceRoomsCache.map(r => {
        const flags = [
          r.locked ? "🔒" : "",
          r.userLimit ? "👥" + r.userLimit : "",
          r.allowCam === false ? "📷✖" : "",
          r.allowScreen === false ? "🖥️✖" : ""
        ].filter(Boolean).join(" ");
        return `<div class="admin-track" data-room-id="${r.id}">
          <span>🔊 ${esc(r.name || "Salon")} <small class="hint">${flags}</small></span>
          <span style="display:flex;gap:6px">
            <button type="button" class="btn btn-outline" onclick="openVoiceRoomEdit('${r.id}')">Édit</button>
            <button type="button" class="btn-danger" onclick="adminDeleteVoiceRoom('${r.id}')">×</button>
          </span>
        </div>`;
      }).join("") || '<p class="hint">Aucun salon</p>';
    }
  } catch (e) {
    console.error(e);
    alert("Erreur chargement vocal admin : " + (e.message || e));
  }
}

// Override toggleVoiceRoom to require selected room

async function saveStatusNow() {
  if (!currentUser) return;
  const v = document.getElementById("myStatus")?.value || "auto";
  try {
    await db.collection("users").doc(currentUser.uid).set({ statusManual: v }, { merge: true });
    if (viewingUser && viewingUser.id === currentUser.uid) viewingUser.statusManual = v;
    loadFriends();
    loadMembers();
  } catch (e) { console.error(e); }
}


function toggleVoicePanel() {
  const panel = document.getElementById("voicePanel");
  const btn = document.getElementById("voiceOpenBtn");
  if (!panel) return;
  const open = panel.style.display !== "none";
  panel.style.display = open ? "none" : "block";
  if (btn) {
    btn.classList.toggle("open", !open);
    btn.textContent = open ? "🎙 Ouvrir le vocal" : "▼ Fermer le vocal";
  }
  if (!open) loadVoiceChannelsUI();
}

// ===== GALLERY LIKES / COMMENTS (profile) =====
function galKey(ownerId, idx) {
  return ownerId + "_" + idx;
}

async function toggleGalLike(ownerId, idx, type) {
  if (!currentUser) return openModal(false);
  const id = galKey(ownerId, idx);
  const ref = db.collection("galleryReactions").doc(id);
  try {
    const doc = await ref.get();
    const d = doc.exists ? doc.data() : { likes: [], dislikes: [], comments: [] };
    let likes = d.likes || [];
    let dislikes = d.dislikes || [];
    if (type === "like") {
      if (likes.includes(currentUser.uid)) likes = likes.filter(x => x !== currentUser.uid);
      else {
        likes.push(currentUser.uid);
        dislikes = dislikes.filter(x => x !== currentUser.uid);
      }
    } else {
      if (dislikes.includes(currentUser.uid)) dislikes = dislikes.filter(x => x !== currentUser.uid);
      else {
        dislikes.push(currentUser.uid);
        likes = likes.filter(x => x !== currentUser.uid);
      }
    }
    await ref.set({ likes, dislikes, comments: d.comments || [], ownerId, idx }, { merge: true });
    renderGalReactionsUI(ownerId, idx, { likes, dislikes, comments: d.comments || [] });
    if (type === "like" && likes.includes(currentUser.uid) && ownerId !== currentUser.uid) {
      pushNotif(ownerId, (currentUser.displayName || "Quelqu'un") + " a aimé ta photo", "");
    }
  } catch (e) {
    alert(e.message);
  }
}

async function addGalComment(ownerId, idx) {
  if (!currentUser) return openModal(false);
  const input = document.getElementById("galc-" + idx);
  if (!input) return;
  const text = input.value.trim().slice(0, 300);
  if (!text) return;
  const id = galKey(ownerId, idx);
  const ref = db.collection("galleryReactions").doc(id);
  const doc = await ref.get();
  const d = doc.exists ? doc.data() : { likes: [], dislikes: [], comments: [] };
  const comments = d.comments || [];
  comments.push({
    uid: currentUser.uid,
    author: currentUser.displayName || currentUser.email || "User",
    text,
    at: Date.now()
  });
  await ref.set({ likes: d.likes || [], dislikes: d.dislikes || [], comments, ownerId, idx }, { merge: true });
  input.value = "";
  renderGalReactionsUI(ownerId, idx, { likes: d.likes || [], dislikes: d.dislikes || [], comments });
  if (ownerId !== currentUser.uid) {
    pushNotif(ownerId, (currentUser.displayName || "Quelqu'un") + " a commenté ta photo", "");
  }
}

function renderGalReactionsUI(ownerId, idx, data) {
  const box = document.getElementById("galReact-" + idx);
  if (!box) return;
  const likes = data.likes || [];
  const dislikes = data.dislikes || [];
  const comments = data.comments || [];
  const liked = currentUser && likes.includes(currentUser.uid);
  const disliked = currentUser && dislikes.includes(currentUser.uid);
  box.innerHTML = `
    <div class="gal-reactions">
      <button type="button" class="gal-react-btn ${liked?"active-like":""}" onclick="toggleGalLike('${ownerId}',${idx},'like')">👍 ${likes.length}</button>
      <button type="button" class="gal-react-btn ${disliked?"active-dislike":""}" onclick="toggleGalLike('${ownerId}',${idx},'dislike')">👎 ${dislikes.length}</button>
    </div>
    <div class="gal-comments">
      ${comments.slice(-8).map(c => `<div class="gal-comment"><strong>${esc(c.author)}</strong> ${esc(c.text)}</div>`).join("")}
      ${currentUser ? `<form class="gal-cform" onsubmit="event.preventDefault();addGalComment('${ownerId}',${idx})">
        <input class="input" id="galc-${idx}" placeholder="Commenter…" maxlength="300">
        <button type="submit" class="btn">→</button>
      </form>` : '<p class="hint">Connecte-toi pour commenter</p>'}
    </div>`;
}

async function loadGalReactions(ownerId, idx) {
  const id = galKey(ownerId, idx);
  try {
    const doc = await db.collection("galleryReactions").doc(id).get();
    renderGalReactionsUI(ownerId, idx, doc.exists ? doc.data() : { likes: [], dislikes: [], comments: [] });
  } catch (e) {
    renderGalReactionsUI(ownerId, idx, { likes: [], dislikes: [], comments: [] });
  }
}

// ===== PASTEBIN-STYLE NOTES =====
let _openNoteId = null;
let _openNoteData = null;

async function simpleHash(str) {
  // non-crypto obfuscation for paste password (client-side gate)
  try {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
    }
  } catch (e) {}
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h) + str.charCodeAt(i) | 0;
  return "x" + Math.abs(h).toString(16);
}

async function loadProfileNotes(u) {
  const box = document.getElementById("pvNotes");
  const create = document.getElementById("pvNotesCreate");
  if (!box) return;
  const own = isOwnProfile();
  const canCreate = own && currentUser && hasPerm("notes");
  if (create) create.style.display = canCreate ? "block" : "none";
  try {
    let snap;
    if (own) {
      snap = await db.collection("notes").where("uid", "==", u.id).limit(40).get();
    } else {
      try {
        snap = await db.collection("notes").where("uid", "==", u.id).where("listed", "==", true).limit(20).get();
      } catch (e) {
        snap = await db.collection("notes").where("uid", "==", u.id).limit(20).get();
      }
    }
    if (snap.empty) {
      box.innerHTML = '<p class="hint">Aucune note publique</p>';
      return;
    }
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      .filter(n => own || n.listed !== false && n.exposure !== "private");
    items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!items.length) {
      box.innerHTML = '<p class="hint">Aucune note publique</p>';
      return;
    }
    // group by folder
    const folders = {};
    items.forEach(n => {
      const f = n.folder || "Général";
      if (!folders[f]) folders[f] = [];
      folders[f].push(n);
    });
    box.innerHTML = Object.keys(folders).map(folder => {
      const cards = folders[folder].map(n => {
        const badges = [];
        if (n.burnAfterRead) badges.push("🔥 burn");
        if (n.passwordHash) badges.push("🔒");
        if (n.expiresAt) badges.push("⏱ expire");
        if (n.exposure === "unlisted") badges.push("non listée");
        if (n.exposure === "private") badges.push("privée");
        if (n.syntax && n.syntax !== "none") badges.push(n.syntax);
        if (n.category && n.category !== "none") badges.push(n.category);
        const tags = (n.tags || []).slice(0, 4).map(t => `<span class="note-tag">#${esc(t)}</span>`).join("");
        return `<div class="note-card">
          <h4>${esc(n.title || "Sans titre")}</h4>
          <div class="note-card-meta">${badges.map(b => `<span class="note-badge">${esc(b)}</span>`).join("")} ${tags}</div>
          <p class="hint">${n.views || 0} vue(s)${n.createdAt ? " · " + new Date(n.createdAt).toLocaleDateString("fr-FR") : ""}</p>
          <div class="note-card-actions">
            <button type="button" class="btn btn-outline" onclick="openNoteById('${n.id}')">Ouvrir</button>
            <button type="button" class="btn btn-outline" onclick="copyNoteLink('${n.id}')">Lien</button>
            ${own ? `<button type="button" class="btn-danger" onclick="deleteNote('${n.id}')">Suppr</button>` : ""}
          </div>
        </div>`;
      }).join("");
      return `<div class="note-folder"><div class="note-folder-title">📁 ${esc(folder)}</div>${cards}</div>`;
    }).join("");
  } catch (e) {
    console.error(e);
    box.innerHTML = '<p class="hint">Notes indisponibles</p>';
  }
}

async function createProfileNote() {
  if (!currentUser) return openModal(false);
  if (!hasPerm("notes")) return alert("Permission refusée : notes");
  const title = document.getElementById("noteTitle")?.value.trim() || "Sans titre";
  const body = document.getElementById("noteBody")?.value || "";
  if (!body.trim()) return alert("Contenu vide");
  const burn = !!(document.getElementById("noteBurn")?.checked);
  const hours = parseFloat(document.getElementById("noteExpiry")?.value || "0");
  const exposure = document.getElementById("noteExposure")?.value || "public";
  const category = document.getElementById("noteCategory")?.value || "none";
  const syntax = document.getElementById("noteSyntax")?.value || "none";
  const folder = (document.getElementById("noteFolder")?.value || "").trim().slice(0, 40);
  const tagsRaw = (document.getElementById("noteTags")?.value || "").trim();
  const tags = tagsRaw ? tagsRaw.split(/[,#]+/).map(t => t.trim().toLowerCase()).filter(Boolean).slice(0, 12) : [];
  const pass = document.getElementById("notePassword")?.value || "";
  let passwordHash = null;
  if (pass) passwordHash = await simpleHash(pass);

  const payload = {
    uid: currentUser.uid,
    author: (window.userProfile && (window.userProfile.displayName || window.userProfile.username)) || currentUser.email || "User",
    title: stripDangerous(title, 120),
    body: body.slice(0, 20000),
    burnAfterRead: burn,
    exposure,
    listed: exposure === "public",
    category,
    syntax,
    folder: folder || "",
    tags,
    passwordHash,
    createdAt: Date.now(),
    expiresAt: hours ? Date.now() + hours * 3600 * 1000 : null,
    views: 0
  };
  try {
    const ref = await db.collection("notes").add(payload);
    ["noteBody", "noteTitle", "noteTags", "noteFolder", "notePassword"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = "";
    });
    const burnEl = document.getElementById("noteBurn");
    if (burnEl) burnEl.checked = false;
    const link = location.origin + location.pathname + "?note=" + ref.id;
    await navigator.clipboard.writeText(link).catch(() => {});
    const hint = document.getElementById("noteCreateHint");
    if (hint) hint.textContent = "Créée ✓ Lien copié : " + link;
    xNotify("Note créée — lien copié", { type: "ok", title: "Notes" });
    if (viewingUser) loadProfileNotes(viewingUser);
  } catch (e) {
    alert(e.message);
  }
}

function copyNoteLink(id) {
  const link = location.origin + location.pathname + "?note=" + id;
  navigator.clipboard.writeText(link).then(() => xNotify("Lien copié", { type: "ok" })).catch(() => prompt("Copie:", link));
}

async function deleteNote(id) {
  if (!confirm("Supprimer cette note ?")) return;
  await db.collection("notes").doc(id).delete();
  if (viewingUser) loadProfileNotes(viewingUser);
  xNotify("Note supprimée", { type: "ok" });
}

async function openNoteById(id) {
  try {
    const ref = db.collection("notes").doc(id);
    const doc = await ref.get();
    if (!doc.exists) return alert("Note introuvable ou détruite");
    const n = doc.data();
    if (n.exposure === "private" && currentUser?.uid !== n.uid && !isAdmin) {
      return alert("Note privée");
    }
    if (n.expiresAt && Date.now() > n.expiresAt) {
      await ref.delete().catch(() => {});
      return alert("Note expirée");
    }
    _openNoteId = id;
    _openNoteData = n;
    document.getElementById("noteViewTitle").textContent = n.title || "Note";
    const metaBits = [];
    if (n.burnAfterRead) metaBits.push("🔥 Burn after read");
    if (n.passwordHash) metaBits.push("🔒 Protégée");
    if (n.folder) metaBits.push("📁 " + n.folder);
    if (n.category && n.category !== "none") metaBits.push(n.category);
    if (n.tags && n.tags.length) metaBits.push(n.tags.map(t => "#" + t).join(" "));
    metaBits.push("par " + (n.author || "?"));
    metaBits.push((n.views || 0) + " vues");
    document.getElementById("noteViewMeta").textContent = metaBits.join(" · ");
    const syn = document.getElementById("noteViewSyntax");
    if (syn) {
      if (n.syntax && n.syntax !== "none") {
        syn.style.display = "inline-block";
        syn.textContent = n.syntax;
      } else syn.style.display = "none";
    }
    const bodyEl = document.getElementById("noteViewBody");
    const gate = document.getElementById("noteViewPassGate");
    const copyBtn = document.getElementById("noteViewCopyBtn");
    const linkBtn = document.getElementById("noteViewLinkBtn");
    if (n.passwordHash && currentUser?.uid !== n.uid) {
      if (bodyEl) bodyEl.style.display = "none";
      if (gate) gate.style.display = "block";
      if (copyBtn) copyBtn.style.display = "none";
      if (linkBtn) linkBtn.style.display = "none";
      const err = document.getElementById("noteViewPassErr");
      if (err) err.textContent = "";
      const inp = document.getElementById("noteViewPassInput");
      if (inp) inp.value = "";
    } else {
      if (gate) gate.style.display = "none";
      showNoteBody(n);
    }
    document.getElementById("noteViewModal").classList.add("open");
    if (!(n.passwordHash && currentUser?.uid !== n.uid)) {
      await ref.set({ views: (n.views || 0) + 1 }, { merge: true });
      if (n.burnAfterRead && currentUser?.uid !== n.uid) {
        setTimeout(() => ref.delete().catch(() => {}), 1200);
        document.getElementById("noteViewMeta").textContent += " · destruction imminente";
      }
    }
  } catch (e) {
    alert(e.message);
  }
}

function showNoteBody(n) {
  const bodyEl = document.getElementById("noteViewBody");
  if (!bodyEl) return;
  bodyEl.style.display = "block";
  bodyEl.textContent = n.body || "";
  bodyEl.className = "note-body syntax-" + (n.syntax || "none");
  const copyBtn = document.getElementById("noteViewCopyBtn");
  const linkBtn = document.getElementById("noteViewLinkBtn");
  if (copyBtn) copyBtn.style.display = "inline-flex";
  if (linkBtn) linkBtn.style.display = "inline-flex";
}

async function unlockNoteView() {
  if (!_openNoteData || !_openNoteId) return;
  const pass = document.getElementById("noteViewPassInput")?.value || "";
  const hash = await simpleHash(pass);
  if (hash !== _openNoteData.passwordHash) {
    const err = document.getElementById("noteViewPassErr");
    if (err) err.textContent = "Mot de passe incorrect";
    return;
  }
  document.getElementById("noteViewPassGate").style.display = "none";
  showNoteBody(_openNoteData);
  try {
    const ref = db.collection("notes").doc(_openNoteId);
    await ref.set({ views: (_openNoteData.views || 0) + 1 }, { merge: true });
    if (_openNoteData.burnAfterRead && currentUser?.uid !== _openNoteData.uid) {
      setTimeout(() => ref.delete().catch(() => {}), 1200);
      document.getElementById("noteViewMeta").textContent += " · destruction imminente";
    }
  } catch (e) {}
}

function copyOpenNote() {
  if (!_openNoteData) return;
  navigator.clipboard.writeText(_openNoteData.body || "").then(() => xNotify("Texte copié", { type: "ok" }));
}

function copyCurrentNoteLink() {
  if (!_openNoteId) return;
  copyNoteLink(_openNoteId);
}

function closeNoteView() {
  document.getElementById("noteViewModal")?.classList.remove("open");
  _openNoteId = null;
  _openNoteData = null;
}

// boot note from URL
(function checkNoteParam() {
  const p = new URLSearchParams(location.search);
  const note = p.get("note");
  if (note) {
    setTimeout(() => openNoteById(note), 800);
  }
})();


// ===== REALTIME NOTIFICATIONS =====
let _notifUnsub = null;
let _notifKnown = new Set();
let _notifFirst = true;

function startNotifWatch() {
  if (_notifUnsub) { try { _notifUnsub(); } catch(e){} _notifUnsub = null; }
  const fab = document.getElementById("notifFab");
  if (!currentUser) {
    if (fab) fab.style.display = "none";
    return;
  }
  if (fab) fab.style.display = "flex";
  _notifFirst = true;
  _notifKnown = new Set();
  _notifUnsub = db.collection("notifications")
    .where("to", "==", currentUser.uid)
    .orderBy("at", "desc")
    .limit(40)
    .onSnapshot(snap => {
      const items = [];
      snap.forEach(d => items.push({ id: d.id, ...d.data() }));
      // without orderBy fallback handled below
      renderNotifList(items);
      const unread = items.filter(n => !n.read).length;
      const badge = document.getElementById("notifBadge");
      if (badge) {
        if (unread > 0) { badge.style.display = "flex"; badge.textContent = String(unread); }
        else badge.style.display = "none";
      }
      if (!_notifFirst) {
        items.forEach(n => {
          if (!_notifKnown.has(n.id) && !n.read) {
            showNotifToast(n);
            playNotifSound();
          }
        });
      }
      items.forEach(n => _notifKnown.add(n.id));
      _notifFirst = false;
    }, async err => {
      console.warn("notif index", err);
      // fallback without orderBy
      _notifUnsub = db.collection("notifications")
        .where("to", "==", currentUser.uid)
        .limit(40)
        .onSnapshot(snap => {
          const items = [];
          snap.forEach(d => items.push({ id: d.id, ...d.data() }));
          items.sort((a,b) => (b.at||0) - (a.at||0));
          renderNotifList(items);
          const unread = items.filter(n => !n.read).length;
          const badge = document.getElementById("notifBadge");
          if (badge) {
            if (unread > 0) { badge.style.display = "flex"; badge.textContent = String(unread); }
            else badge.style.display = "none";
          }
        });
    });
}

function renderNotifList(items) {
  const box = document.getElementById("notifList");
  if (!box) return;
  if (!items.length) {
    box.innerHTML = '<div class="hint" style="padding:12px">Aucune notification</div>';
    return;
  }
  box.innerHTML = items.map(n => {
    const t = n.at ? new Date(n.at).toLocaleString("fr-FR", { day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" }) : "";
    return `<div class="notif-item ${n.read?"":"unread"}" onclick="clickNotif('${n.id}','${esc(n.link||"")}')">
      <div>${esc(n.text || "Notification")}</div>
      <div class="ni-time">${t}</div>
    </div>`;
  }).join("");
}

function showNotifToast(n) {
  const text = n.text || "Nouvelle notification";
  xNotify(text, {
    type: "info",
    title: "Notification",
    body: text,
    forceSound: true,
    duration: 5500,
    onClick: () => clickNotif(n.id, n.link || "")
  });
}

async function clickNotif(id, link) {
  try {
    await db.collection("notifications").doc(id).set({ read: true }, { merge: true });
  } catch (e) {}
  if (link) {
    if (link.startsWith("?u=")) showUserProfile(link.slice(3).replace(/[^a-z0-9_-]/gi, ""));
    else if (link.startsWith("dm:")) { openInbox(); }
    else if (link.startsWith("?note=")) openNoteById(link.slice(6).replace(/[^a-zA-Z0-9_-]/g, ""));
    // ignore external/javascript links in notifs
  }
}

async function markAllNotifsRead() {
  if (!currentUser) return;
  const snap = await db.collection("notifications").where("to", "==", currentUser.uid).limit(40).get();
  const batch = db.batch();
  snap.forEach(d => {
    if (!d.data().read) batch.set(d.ref, { read: true }, { merge: true });
  });
  await batch.commit().catch(() => {});
}

function toggleNotifPanel() {
  const p = document.getElementById("notifPanel");
  if (!p) return;
  p.style.display = p.style.display === "none" ? "flex" : "none";
}

async function pushNotif(toUid, text, link) {
  if (!toUid || !currentUser || toUid === currentUser.uid) return;
  if (!rateLimit("push-notif:" + currentUser.uid, 10, 60000)) return;
  try {
    const safeLink = (link && isSafeLinkUrl(link)) || (link && link.startsWith("?")) || (link && link.startsWith("dm:"))
      ? String(link).slice(0, 200) : "";
    await db.collection("notifications").add({
      to: toUid,
      from: currentUser.uid,
      text: stripDangerous(text, 200),
      link: safeLink,
      read: false,
      at: Date.now()
    });
  } catch (e) { console.warn("notif", e); }
}

// Hook notifs into existing actions


// Stronger WebRTC: restart connection helper
async function restartVoicePc(remoteUid) {
  try {
    if (_voicePcs[remoteUid]) {
      _voicePcs[remoteUid].close();
      delete _voicePcs[remoteUid];
    }
    await ensureVoicePc(remoteUid, true);
  } catch (e) { console.warn(e); }
}


// ===== HOME LAYOUT / BLOCK ORDER =====
const HOME_BLOCKS_DEFAULT = ["createPost", "videos", "feed", "chat", "gallery", "changelog"];

function renderHomeBlockOrderUI(order) {
  const box = document.getElementById("homeBlockOrder");
  if (!box) return;
  const labels = {
    createPost: "Créer un post",
    videos: "Vidéos",
    feed: "Fil d'actualité",
    chat: "Chat + Vocal",
    gallery: "Galerie",
    changelog: "Changelog"
  };
  const list = (order && order.length) ? order.slice() : HOME_BLOCKS_DEFAULT.slice();
  // ensure all default blocks present
  HOME_BLOCKS_DEFAULT.forEach(id => { if (!list.includes(id)) list.push(id); });
  window._homeBlockOrder = list;
  box.innerHTML = list.map((id, i) =>
    `<div class="hbo-row" data-id="${id}">
      <span>☰ ${labels[id] || id}</span>
      <button type="button" class="btn btn-outline" onclick="moveHomeBlock(${i},-1)">↑</button>
      <button type="button" class="btn btn-outline" onclick="moveHomeBlock(${i},1)">↓</button>
    </div>`
  ).join("");
}

function moveHomeBlock(i, dir) {
  const list = (window._homeBlockOrder || HOME_BLOCKS_DEFAULT).slice();
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  const tmp = list[i]; list[i] = list[j]; list[j] = tmp;
  window._homeBlockOrder = list;
  renderHomeBlockOrderUI(list);
}

function applyHomeBlockOrder(order) {
  const center = document.querySelector(".col-center");
  if (!center || !order || !order.length) return;
  order.forEach(id => {
    let el = document.querySelector('.home-block[data-block="' + id + '"]');
    if (!el && id === "videos") el = document.getElementById("homeVideosSection");
    if (!el && id === "changelog") el = document.getElementById("changelog");
    if (!el && id === "createPost") el = document.getElementById("createPost");
    if (!el && id === "feed") el = document.getElementById("block-feed");
    if (!el && id === "chat") el = document.getElementById("block-chat");
    if (!el && id === "gallery") el = document.getElementById("block-gallery");
    if (el) center.appendChild(el);
  });
}

function applyHomeLayoutPreset(preset) {
  const grid = document.getElementById("appGrid");
  if (!grid) return;
  // clear previous layout-* classes
  grid.className = (grid.className || "")
    .split(/\s+/)
    .filter(c => c && c !== "app-grid" && !c.startsWith("layout-"))
    .concat(["app-grid"])
    .join(" ");
  if (preset && preset !== "default") {
    grid.classList.add("layout-" + preset);
  }
}


let _meIsRegister = false;

function meSwitchAuth(isReg) {
  _meIsRegister = !!isReg;
  const tabL = document.getElementById("meTabLogin");
  const tabR = document.getElementById("meTabReg");
  if (tabL) tabL.classList.toggle("active", !isReg);
  if (tabR) tabR.classList.toggle("active", isReg);
  const u = document.getElementById("meAuthUser");
  if (u) u.style.display = isReg ? "block" : "none";
  const btn = document.getElementById("meAuthBtn");
  if (btn) btn.textContent = isReg ? "Créer un compte" : "Se connecter";
  const hint = document.getElementById("meAuthHint");
  if (hint) hint.textContent = "";
}

async function meHandleAuth() {
  const email = (document.getElementById("meAuthEmail")?.value || "").trim();
  const pass = document.getElementById("meAuthPass")?.value || "";
  const username = (document.getElementById("meAuthUser")?.value || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const hint = document.getElementById("meAuthHint");
  if (!email || !pass) {
    if (hint) hint.textContent = "Email et mot de passe requis";
    return;
  }
  if (_meIsRegister && (!username || username.length < 2)) {
    if (hint) hint.textContent = "Pseudo invalide (min 2)";
    return;
  }
  try {
    if (hint) hint.textContent = "…";
    if (_meIsRegister) {
      const base = String(username || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
      if (base.length < 2) {
        if (hint) hint.textContent = "Pseudo invalide";
        return;
      }
      const { alloc } = await registerWithAutoTag(email, pass, base);
      if (hint) hint.textContent = "Compte créé ✓  " + formatHandle(alloc);
      try { xNotify(formatHandle(alloc), { type: "ok", title: "Bienvenue" }); } catch (e) {}
      try { refreshMeCard(); } catch (e) {}
    } else {
      await auth.signInWithEmailAndPassword(email, pass);
      if (hint) hint.textContent = "Connecté ✓";
    }
  } catch (e) {
    if (hint) hint.textContent = e.message || "Erreur";
  }
}

async function refreshMeCard() {
  const card = document.getElementById("meCard");
  const guest = document.getElementById("meGuest");
  const logged = document.getElementById("meLogged");
  if (!card) return;
  card.style.display = "block";
  if (!currentUser) {
    if (guest) guest.style.display = "block";
    if (logged) logged.style.display = "none";
    return;
  }
  if (guest) guest.style.display = "none";
  if (logged) logged.style.display = "block";
  try {
    const doc = await db.collection("users").doc(currentUser.uid).get();
    const u = doc.exists ? doc.data() : {};
    const name = u.displayName || u.username || currentUser.email || "User";
    const handle = formatHandle(u);
    // auto-fix missing tag once
    if (!u.tag && !(u.username || "").includes("-")) {
      ensureUserUsernameTag(currentUser.uid).then(() => refreshMeCard()).catch(() => {});
    }
    const av = u.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=96&bold=true`;
    const img = document.getElementById("meAvatar");
    if (img) img.src = av;
    const n = document.getElementById("meName");
    if (n) n.textContent = name;
    const h = document.getElementById("meHandle");
    if (h) h.innerHTML = formatHandleHTML(u);
    const st = document.getElementById("meStatus");
    if (st) st.value = u.statusManual || "auto";
    const mood = document.getElementById("meMood");
    if (mood) mood.value = u.mood || "";
    const ab = document.getElementById("meAdminBtn");
    if (ab) ab.style.display = isAdmin ? "block" : "none";
  } catch (e) {
    console.warn("meCard", e);
  }
}

async function saveQuickStatus() {
  if (!currentUser) return;
  const v = document.getElementById("meStatus")?.value || "auto";
  try {
    await db.collection("users").doc(currentUser.uid).set({ statusManual: v }, { merge: true });
    const studio = document.getElementById("myStatus");
    if (studio) studio.value = v;
    loadFriends();
    loadMembers();
  } catch (e) { console.error(e); }
}

async function saveQuickMood() {
  if (!currentUser) return;
  const v = (document.getElementById("meMood")?.value || "").trim().slice(0, 40);
  try {
    await db.collection("users").doc(currentUser.uid).set({ mood: v }, { merge: true });
    loadFriends();
  } catch (e) { console.error(e); }
}


// ===== XULTRA SLITHER (slither.io-like) =====
const SLITHER_SKINS = {
  violet: ["#7c3aed", "#a78bfa", "#c4b5fd"],
  neon: ["#22d3ee", "#a3e635", "#e879f9"],
  gold: ["#f59e0b", "#fbbf24", "#fde68a"],
  mint: ["#10b981", "#34d399", "#6ee7b7"],
  fire: ["#ef4444", "#f97316", "#fbbf24"],
  ice: ["#38bdf8", "#818cf8", "#e0f2fe"],
  rainbow: ["#ef4444", "#f59e0b", "#22c55e", "#3b82f6", "#a855f7"],
  void: ["#111827", "#4c1d95", "#7c3aed"]
};

let _slither = {
  running: false,
  raf: null,
  unsub: null,
  me: null,
  others: {},
  foods: [],
  particles: [],
  mouse: { x: 0, y: 0 },
  keys: {},
  boost: false,
  control: "mouse",
  cam: { x: 0, y: 0 },
  zoom: 1,
  world: 4200, // diameter of circular map
  radius: 2100,
  skin: "violet",
  tick: 0,
  lastClick: 0
};

function openSlitherGame() {
  document.getElementById("homeView").style.display = "none";
  document.getElementById("profileView").style.display = "none";
  const vh = document.getElementById("voiceHubView");
  if (vh) vh.style.display = "none";
  const v = document.getElementById("slitherView");
  if (v) v.style.display = "flex";
  const ov = document.getElementById("slitherOverlay");
  if (ov) {
    ov.style.display = "flex";
    // restore default menu if KO screen
    if (!ov.querySelector(".slither-help")) {
      ov.innerHTML = `<div class="slither-title">XULTRA Slither</div>
        <div class="slither-sub">Carte ronde · bordure rouge · boost · minimap · multi</div>
        <div class="slither-help">
          <div><b>Diriger</b> — souris / doigt ou WASD</div>
          <div><b>Boost</b> — clic maintenu, Espace, ou double-clic</div>
          <div><b>Mort</b> — bordure rouge ou collision avec un autre serpent</div>
        </div>
        <button type="button" class="btn-primary" onclick="startSlither()">Entrer dans l'arène</button>
        <p class="hint" style="margin-top:12px">Astuce : le boost brûle de la masse mais te rend plus rapide</p>`;
    }
  }
  resizeSlither();
  window.addEventListener("resize", resizeSlither);
}

function closeSlitherGame() {
  stopSlither();
  const v = document.getElementById("slitherView");
  if (v) v.style.display = "none";
  showHome();
  window.removeEventListener("resize", resizeSlither);
}

function resizeSlither() {
  const c = document.getElementById("slitherCanvas");
  if (!c) return;
  c.width = window.innerWidth;
  c.height = Math.max(200, window.innerHeight - 52);
}

function setSlitherSkin(v) {
  _slither.skin = v || "violet";
  if (_slither.me) _slither.me.skin = _slither.skin;
}

function randomInCircle(pad) {
  const R = _slither.radius - (pad || 120);
  const a = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * R;
  return { x: _slither.radius + Math.cos(a) * r, y: _slither.radius + Math.sin(a) * r };
}

async function startSlither() {
  if (!currentUser) {
    alert("Connecte-toi pour jouer en multi");
    return;
  }
  if (!hasPerm("slither")) return alert("Permission refusée : mini-jeu");
  const ov = document.getElementById("slitherOverlay");
  if (ov) ov.style.display = "none";
  resizeSlither();
  const canvas = document.getElementById("slitherCanvas");
  const spawn = randomInCircle(200);
  let name = "Player";
  try {
    const doc = await db.collection("users").doc(currentUser.uid).get();
    if (doc.exists) name = doc.data().displayName || doc.data().username || name;
  } catch (e) {}
  _slither.skin = document.getElementById("slitherSkin")?.value || "violet";
  _slither.control = document.getElementById("slitherControls")?.value || "mouse";
  _slither.boost = false;
  _slither.particles = [];
  _slither.me = {
    uid: currentUser.uid,
    name,
    x: spawn.x,
    y: spawn.y,
    angle: Math.random() * Math.PI * 2,
    segs: Array.from({ length: 16 }, (_, i) => ({
      x: spawn.x - Math.cos(0) * i * 6,
      y: spawn.y - Math.sin(0) * i * 6
    })),
    score: 10,
    skin: _slither.skin,
    alive: true,
    boosting: false
  };
  _slither.running = true;
  _slither.tick = 0;
  _slither.cam = { x: spawn.x, y: spawn.y };
  bindSlitherInput(canvas);
  listenSlitherPlayers();
  ensureSlitherFood();
  loopSlither();
  pushSlitherState(true);
}

function stopSlither() {
  _slither.running = false;
  if (_slither.raf) cancelAnimationFrame(_slither.raf);
  _slither.raf = null;
  if (_slither.unsub) { try { _slither.unsub(); } catch (e) {} _slither.unsub = null; }
  if (currentUser) {
    db.collection("slitherPlayers").doc(currentUser.uid).delete().catch(() => {});
  }
  unbindSlitherInput();
  _slither.me = null;
  _slither.others = {};
  _slither.boost = false;
}

function unbindSlitherInput() {
  const canvas = document.getElementById("slitherCanvas");
  if (!canvas) return;
  canvas.onmousemove = null;
  canvas.ontouchmove = null;
  canvas.ontouchstart = null;
  canvas.onmousedown = null;
  canvas.onmouseup = null;
  canvas.ondblclick = null;
  window.onkeydown = null;
  window.onkeyup = null;
}

function bindSlitherInput(canvas) {
  unbindSlitherInput();
  const move = (clientX, clientY) => {
    const r = canvas.getBoundingClientRect();
    _slither.mouse.x = clientX - r.left;
    _slither.mouse.y = clientY - r.top;
  };
  canvas.onmousemove = e => move(e.clientX, e.clientY);
  canvas.ontouchmove = e => {
    e.preventDefault();
    if (e.touches[0]) {
      move(e.touches[0].clientX, e.touches[0].clientY);
      _slither.boost = e.touches.length > 1;
    }
  };
  canvas.ontouchstart = e => {
    if (e.touches[0]) move(e.touches[0].clientX, e.touches[0].clientY);
    if (e.touches.length > 1) _slither.boost = true;
  };
  canvas.ontouchend = () => { if (!_slither.keys[" "]) _slither.boost = false; };
  canvas.onmousedown = e => {
    if (e.button === 0) _slither.boost = true;
    const now = Date.now();
    if (now - _slither.lastClick < 280) _slither.boost = true; // double-click boost
    _slither.lastClick = now;
  };
  canvas.onmouseup = () => { if (!_slither.keys[" "]) _slither.boost = false; };
  canvas.onmouseleave = () => { if (!_slither.keys[" "]) _slither.boost = false; };
  canvas.ondblclick = e => {
    e.preventDefault();
    _slither.boost = true;
    setTimeout(() => { if (!_slither.keys[" "] && !_slither._mouseDown) _slither.boost = false; }, 400);
  };
  window.onkeydown = e => {
    const k = e.key.toLowerCase();
    _slither.keys[k] = true;
    _slither.keys[e.key] = true;
    if (k === " " || e.code === "Space") {
      e.preventDefault();
      _slither.boost = true;
    }
  };
  window.onkeyup = e => {
    const k = e.key.toLowerCase();
    _slither.keys[k] = false;
    _slither.keys[e.key] = false;
    if (k === " " || e.code === "Space") {
      _slither.boost = false;
    }
  };
}

function listenSlitherPlayers() {
  if (_slither.unsub) try { _slither.unsub(); } catch (e) {}
  _slither.unsub = db.collection("slitherPlayers").onSnapshot(snap => {
    const others = {};
    let n = 0;
    snap.forEach(d => {
      n++;
      if (currentUser && d.id === currentUser.uid) return;
      others[d.id] = d.data();
    });
    _slither.others = others;
    const el = document.getElementById("slitherOnline");
    if (el) el.textContent = String(n);
  }, err => console.warn("slither", err));
}

async function ensureSlitherFood() {
  const foods = [];
  for (let i = 0; i < 160; i++) {
    const p = randomInCircle(40);
    foods.push({ x: p.x, y: p.y, c: Math.floor(Math.random() * 7), r: 3 + Math.random() * 3 });
  }
  _slither.foods = foods;
}

function pushSlitherState(force) {
  if (!_slither.me || !currentUser) return;
  _slither.tick++;
  if (!force && _slither.tick % 3 !== 0) return;
  const m = _slither.me;
  db.collection("slitherPlayers").doc(currentUser.uid).set({
    name: m.name,
    x: m.x, y: m.y,
    angle: m.angle,
    score: m.score,
    skin: m.skin,
    boosting: !!m.boosting,
    segs: m.segs.slice(0, 50).map(s => ({ x: Math.round(s.x), y: Math.round(s.y) })),
    at: Date.now()
  }, { merge: true }).catch(() => {});
}

function loopSlither() {
  if (!_slither.running || !_slither.me) return;
  updateSlither();
  drawSlither();
  pushSlitherState(false);
  _slither.raf = requestAnimationFrame(loopSlither);
}

function slitherTargetAngle(canvas, m) {
  const mode = document.getElementById("slitherControls")?.value || _slither.control || "mouse";
  _slither.control = mode;
  if (mode === "keys") {
    let dx = 0, dy = 0;
    if (_slither.keys["w"] || _slither.keys["arrowup"]) dy -= 1;
    if (_slither.keys["s"] || _slither.keys["arrowdown"]) dy += 1;
    if (_slither.keys["a"] || _slither.keys["arrowleft"]) dx -= 1;
    if (_slither.keys["d"] || _slither.keys["arrowright"]) dx += 1;
    if (dx || dy) return Math.atan2(dy, dx);
    return m.angle;
  }
  // mouse / relative: point toward cursor in world
  const tx = (_slither.mouse.x - canvas.width / 2) / _slither.zoom + _slither.cam.x;
  const ty = (_slither.mouse.y - canvas.height / 2) / _slither.zoom + _slither.cam.y;
  if (mode === "relative") {
    // softer follow
    return Math.atan2(ty - m.y, tx - m.x);
  }
  return Math.atan2(ty - m.y, tx - m.x);
}

function updateSlither() {
  const m = _slither.me;
  const canvas = document.getElementById("slitherCanvas");
  if (!canvas || !m) return;

  const target = slitherTargetAngle(canvas, m);
  let diff = target - m.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const turn = m.boosting ? 0.09 : 0.14;
  m.angle += Math.max(-turn, Math.min(turn, diff));

  // boost costs mass (slither-style)
  const canBoost = m.score > 12 && m.segs.length > 14;
  m.boosting = !!( _slither.boost && canBoost );
  let speed = 2.35 + Math.min(1.1, m.score / 100);
  if (m.boosting) {
    speed *= 1.85;
    if (_slither.tick % 4 === 0) {
      m.score = Math.max(10, m.score - 1);
      // leave food particle behind
      const tail = m.segs[m.segs.length - 1];
      if (tail) {
        _slither.foods.push({
          x: tail.x + (Math.random() - 0.5) * 8,
          y: tail.y + (Math.random() - 0.5) * 8,
          c: Math.floor(Math.random() * 7),
          r: 3,
          local: true
        });
        _slither.particles.push({
          x: tail.x, y: tail.y, life: 18,
          c: (SLITHER_SKINS[m.skin] || SLITHER_SKINS.violet)[0]
        });
      }
    }
  }

  m.x += Math.cos(m.angle) * speed;
  m.y += Math.sin(m.angle) * speed;

  // circular boundary — die if outside red ring
  const cx = _slither.radius, cy = _slither.radius;
  const dist = Math.hypot(m.x - cx, m.y - cy);
  if (dist > _slither.radius - 8) {
    endSlitherRound("Bordure !");
    return;
  }

  m.segs.unshift({ x: m.x, y: m.y });
  const maxSegs = 14 + Math.floor(m.score / 2.5);
  while (m.segs.length > maxSegs) m.segs.pop();

  // eat food
  const eatR = 12 + Math.min(10, m.score / 20);
  for (let i = _slither.foods.length - 1; i >= 0; i--) {
    const f = _slither.foods[i];
    const dx = f.x - m.x, dy = f.y - m.y;
    if (dx * dx + dy * dy < eatR * eatR) {
      m.score += 1;
      const p = randomInCircle(50);
      f.x = p.x; f.y = p.y;
      f.r = 3 + Math.random() * 3;
    }
  }

  // particles decay
  _slither.particles = _slither.particles.filter(p => {
    p.life--;
    return p.life > 0;
  });

  // collide with others
  for (const uid of Object.keys(_slither.others)) {
    const o = _slither.others[uid];
    if (!o.segs) continue;
    for (let i = 3; i < o.segs.length; i += 1) {
      const s = o.segs[i];
      const dx = s.x - m.x, dy = s.y - m.y;
      if (dx * dx + dy * dy < 16 * 16) {
        endSlitherRound("Collision !");
        return;
      }
    }
  }

  // camera + zoom (zoom out as you grow)
  _slither.zoom = Math.max(0.55, Math.min(1.15, 1.05 - m.score / 400));
  _slither.cam.x += (m.x - _slither.cam.x) * 0.18;
  _slither.cam.y += (m.y - _slither.cam.y) * 0.18;
  const sc = document.getElementById("slitherScore");
  if (sc) sc.textContent = String(Math.floor(m.score));
}

function endSlitherRound(reason) {
  const score = _slither.me ? Math.floor(_slither.me.score) : 0;
  stopSlither();
  const ov = document.getElementById("slitherOverlay");
  if (ov) {
    ov.style.display = "flex";
    ov.innerHTML = `<div class="slither-title">KO</div>
      <div class="slither-sub">${esc(reason || "Éliminé")} · Score : ${score}</div>
      <button type="button" class="btn-primary" onclick="startSlither()">Rejouer</button>
      <button type="button" class="btn btn-outline" style="margin-top:8px" onclick="closeSlitherGame()">Retour</button>`;
  }
}

function drawSlither() {
  const canvas = document.getElementById("slitherCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const cam = _slither.cam;
  const z = _slither.zoom;
  const cx = _slither.radius, cy = _slither.radius;

  ctx.fillStyle = "#0a0a10";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.scale(z, z);
  ctx.translate(-cam.x, -cam.y);

  // outside void
  ctx.fillStyle = "#050508";
  ctx.fillRect(cam.x - w / z, cam.y - h / z, w * 2 / z, h * 2 / z);

  // playable disk
  ctx.beginPath();
  ctx.arc(cx, cy, _slither.radius, 0, Math.PI * 2);
  ctx.fillStyle = "#0d0d14";
  ctx.fill();

  // subtle grid inside circle
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, _slither.radius, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.035)";
  ctx.lineWidth = 1 / z;
  const gs = 70;
  const minX = Math.floor((cam.x - w / z) / gs) * gs;
  const maxX = cam.x + w / z;
  const minY = Math.floor((cam.y - h / z) / gs) * gs;
  const maxY = cam.y + h / z;
  for (let x = minX; x < maxX; x += gs) {
    ctx.beginPath(); ctx.moveTo(x, minY); ctx.lineTo(x, maxY); ctx.stroke();
  }
  for (let y = minY; y < maxY; y += gs) {
    ctx.beginPath(); ctx.moveTo(minX, y); ctx.lineTo(maxX, y); ctx.stroke();
  }
  ctx.restore();

  // RED boundary ring (slither-style)
  ctx.beginPath();
  ctx.arc(cx, cy, _slither.radius - 2, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(239,68,68,0.95)";
  ctx.lineWidth = 10;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, _slither.radius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(248,113,113,0.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  // outer glow
  ctx.beginPath();
  ctx.arc(cx, cy, _slither.radius + 6, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(185,28,28,0.35)";
  ctx.lineWidth = 16;
  ctx.stroke();

  // food
  const foodColors = ["#f472b6", "#a78bfa", "#22d3ee", "#fbbf24", "#4ade80", "#fb7185", "#e879f9"];
  _slither.foods.forEach(f => {
    if (Math.hypot(f.x - cam.x, f.y - cam.y) > Math.max(w, h) / z + 40) return;
    ctx.beginPath();
    ctx.fillStyle = foodColors[f.c % foodColors.length];
    ctx.arc(f.x, f.y, f.r || 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // boost particles
  _slither.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 18);
    ctx.beginPath();
    ctx.fillStyle = p.c || "#a78bfa";
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  });

  Object.values(_slither.others).forEach(o => drawSnake(ctx, o, false));
  if (_slither.me) drawSnake(ctx, _slither.me, true);

  ctx.restore();

  // minimap
  drawSlitherMinimap(ctx, w, h);

  // boost indicator
  if (_slither.me && _slither.me.boosting) {
    ctx.fillStyle = "rgba(251,191,36,.9)";
    ctx.font = "bold 13px Inter,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("BOOST", w / 2, 28);
  }
}

function drawSlitherMinimap(ctx, w, h) {
  const size = Math.min(130, Math.max(90, w * 0.14));
  const pad = 14;
  const mx = w - size - pad;
  const my = h - size - pad;
  const cx = _slither.radius;
  const scale = (size / 2 - 4) / _slither.radius;

  ctx.save();
  ctx.globalAlpha = 0.92;
  ctx.fillStyle = "rgba(8,8,14,.75)";
  ctx.strokeStyle = "rgba(255,255,255,.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(mx + size / 2, my + size / 2, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // red border on minimap
  ctx.beginPath();
  ctx.arc(mx + size / 2, my + size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(239,68,68,.85)";
  ctx.lineWidth = 2;
  ctx.stroke();

  const toM = (x, y) => ({
    x: mx + size / 2 + (x - cx) * scale,
    y: my + size / 2 + (y - cx) * scale
  });

  // others
  Object.values(_slither.others).forEach(o => {
    if (o.x == null) return;
    const p = toM(o.x, o.y);
    ctx.fillStyle = "#f472b6";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  // me
  if (_slither.me) {
    const p = toM(_slither.me.x, _slither.me.y);
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawSnake(ctx, snake, isMe) {
  const segs = snake.segs || [];
  if (!segs.length) return;
  const colors = SLITHER_SKINS[snake.skin] || SLITHER_SKINS.violet;
  const baseR = 6.5 + Math.min(8, (snake.score || 10) / 40);
  for (let i = segs.length - 1; i >= 0; i--) {
    const s = segs[i];
    const r = i === 0 ? baseR + 2 : baseR * (0.92 + 0.08 * (1 - i / segs.length));
    ctx.beginPath();
    ctx.fillStyle = colors[i % colors.length];
    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
    ctx.fill();
    if (snake.boosting && i % 3 === 0) {
      ctx.strokeStyle = "rgba(255,255,255,.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }
  // eyes oriented to angle
  const head = segs[0];
  const ang = snake.angle || 0;
  const eyeDist = baseR * 0.45;
  const eyeR = Math.max(2, baseR * 0.28);
  const ex1 = head.x + Math.cos(ang - 0.45) * eyeDist;
  const ey1 = head.y + Math.sin(ang - 0.45) * eyeDist;
  const ex2 = head.x + Math.cos(ang + 0.45) * eyeDist;
  const ey2 = head.y + Math.sin(ang + 0.45) * eyeDist;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(ex1, ey1, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2, ey2, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  const px = Math.cos(ang) * eyeR * 0.35;
  const py = Math.sin(ang) * eyeR * 0.35;
  ctx.beginPath(); ctx.arc(ex1 + px, ey1 + py, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ex2 + px, ey2 + py, eyeR * 0.45, 0, Math.PI * 2); ctx.fill();

  if (snake.name) {
    ctx.fillStyle = "rgba(255,255,255,.75)";
    ctx.font = "11px Inter,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(snake.name + (isMe ? " (toi)" : ""), head.x, head.y - baseR - 8);
  }
}


let _voiceCamOn = false;

function showRemoteVoiceVideo(uid, stream) {
  const grid = document.getElementById("voiceVideos");
  if (!grid) return;
  grid.style.display = "grid";
  let tile = document.getElementById("vvid-" + uid);
  if (!tile) {
    tile = document.createElement("div");
    tile.className = "voice-tile";
    tile.id = "vvid-" + uid;
    tile.dataset.uid = uid;
    tile.innerHTML = `<video autoplay playsinline muted></video><div class="vt-name"></div>`;
    tile.onclick = () => openVoiceFocus(uid);
    grid.appendChild(tile);
  }
  const vid = tile.querySelector("video");
  if (vid && stream) {
    // Always muted so autoplay works (audio is separate <audio>)
    vid.muted = true;
    vid.defaultMuted = true;
    vid.playsInline = true;
    vid.setAttribute("playsinline", "");
    vid.setAttribute("muted", "");
    vid.autoplay = true;
    // Use track-only stream
    const tracks = stream.getVideoTracks ? stream.getVideoTracks() : [];
    if (tracks.length) {
      tracks.forEach(t => { t.enabled = true; });
      vid.srcObject = new MediaStream(tracks);
    } else {
      vid.srcObject = stream;
    }
    // mirror local cam only
    if (currentUser && uid === currentUser.uid && !_voiceScreenOn) {
      vid.style.transform = "scaleX(-1)";
    } else {
      vid.style.transform = "";
    }
    const tryPlay = () => vid.play().catch(err => console.warn("video play", err));
    tryPlay();
    setTimeout(tryPlay, 200);
    setTimeout(tryPlay, 800);
    // when track ends, remove tile
    tracks.forEach(t => {
      t.onended = () => {
        const el = document.getElementById("vvid-" + uid);
        if (el) el.remove();
        updateVoiceVideoGrid();
      };
    });
  }
  const name = (currentUser && uid === currentUser.uid) ? "Toi"
    : ((_voiceMembers[uid] && _voiceMembers[uid].name) || uid.slice(0, 6));
  const lab = tile.querySelector(".vt-name");
  if (lab) lab.textContent = name;
  if (window._voiceFocusUid === uid) setVoiceFocusMain(uid);
}

function updateVoiceVideoGrid() {
  const grid = document.getElementById("voiceVideos");
  if (!grid) return;
  const has = grid.querySelectorAll(".voice-tile").length;
  grid.style.display = has ? "grid" : "none";
}

async function toggleVoiceCam() {
  if (!_voiceJoined || !currentUser) return;
  if (!_voiceCamOn && !hasVoicePerm("cam")) return alert("Permission refusée : caméra");
  const meta = window._currentVoiceRoomMeta;
  if (!_voiceCamOn && meta && meta.allowCam === false && !isAdmin)
    return alert("Caméra désactivée sur ce salon (paramètres vocaux).");
  if (!_voiceCamOn) {
    try {
      // stop screen share if active (same video slot)
      if (_voiceScreenOn) await stopScreenShare(true);
      let camStream = null;
      try {
        camStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 24, max: 30 },
            facingMode: "user"
          },
          audio: false
        });
      } catch (e1) {
        camStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      const vTrack = camStream.getVideoTracks()[0];
      if (!vTrack) throw new Error("Aucune piste vidéo");
      vTrack.enabled = true;
      console.log("cam track", vTrack.label, vTrack.readyState, vTrack.getSettings());
      await applyLocalVideoTrack(vTrack, "cam");
      _voiceCamOn = true;
      const btn = document.getElementById("voiceCamBtn");
      if (btn) { btn.classList.add("cam-on"); btn.title = "Couper la cam"; }
      if (VOICE_ROOM) {
        db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid)
          .set({ cam: true, screen: false }, { merge: true }).catch(() => {});
      }
      setVoiceDebug("Caméra ON — audio conservé");
    } catch (e) {
      alert("Caméra refusée ou indisponible.\n" + (e.name || e.message || ""));
    }
  } else {
    await clearLocalVideoTrack();
    _voiceCamOn = false;
    const btn = document.getElementById("voiceCamBtn");
    if (btn) { btn.classList.remove("cam-on"); btn.title = "Activer la cam"; }
    if (VOICE_ROOM) {
      db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid)
        .set({ cam: false }, { merge: true }).catch(() => {});
    }
    setVoiceDebug("Caméra OFF");
  }
}

let _voiceScreenOn = false;

async function applyLocalVideoTrack(vTrack, kind) {
  if (!vTrack) return;
  vTrack.enabled = true;
  try { vTrack.contentHint = kind === "screen" ? "detail" : "motion"; } catch (e) {}

  if (!_localStream) {
    // keep existing audio tracks if any were lost — recreate container
    _localStream = new MediaStream();
  }
  // Remove previous VIDEO only
  _localStream.getVideoTracks().forEach(t => {
    try { t.stop(); } catch (e) {}
    try { _localStream.removeTrack(t); } catch (e) {}
  });
  _localStream.addTrack(vTrack);

  // Push to every peer: prefer replaceTrack on video sender; else addTrack + renegotiate
  for (const uid of Object.keys(_voicePcs)) {
    const pc = _voicePcs[uid];
    if (!pc || pc.connectionState === "closed") continue;
    try {
      let videoSender = pc.getSenders().find(s => s.track && s.track.kind === "video");
      if (!videoSender) {
        // transceiver with video kind / mid even if track null
        const tr = pc.getTransceivers().find(t => {
          const k = (t.receiver && t.receiver.track && t.receiver.track.kind) ||
                    (t.sender && t.sender.track && t.sender.track.kind);
          return k === "video" || (t.mid && t.sender && !t.sender.track);
        });
        // Prefer any sender that has no track but belongs to video transceiver
        if (!videoSender) {
          videoSender = pc.getSenders().find(s => !s.track);
        }
        // Better: find transceiver with direction sendrecv and video
        const trs = pc.getTransceivers();
        for (const t of trs) {
          if (t.sender && (t.receiver?.track?.kind === "video" || t.mid !== null)) {
            // check if this is the video one by trying replace
            if (!t.sender.track || t.sender.track.kind === "video") {
              videoSender = t.sender;
              try { t.direction = "sendrecv"; } catch (e) {}
              break;
            }
          }
        }
      }
      // Final: any sender with video track or null track after audio sender
      if (!videoSender) {
        const senders = pc.getSenders();
        videoSender = senders.find(s => s.track && s.track.kind === "video")
          || senders.find(s => !s.track && s !== senders[0]);
      }

      if (videoSender) {
        await videoSender.replaceTrack(vTrack);
        console.log("video replaceTrack ok", uid);
      } else {
        pc.addTrack(vTrack, _localStream);
        console.log("video addTrack", uid);
        await renegotiateVoice(uid, pc);
      }
      // Some browsers need an explicit renegotiation even after replaceTrack
      // if the original m-line was recvonly
      const needRenego = pc.getTransceivers().some(t =>
        t.sender && t.sender.track === vTrack && (t.currentDirection === "recvonly" || t.direction === "recvonly")
      );
      if (needRenego) {
        try { if (typeof t !== "undefined") {} } catch (e) {}
        await renegotiateVoice(uid, pc);
      }
    } catch (e) {
      console.warn("apply video peer", uid, e);
      try {
        pc.addTrack(vTrack, _localStream);
        await renegotiateVoice(uid, pc);
      } catch (e2) {
        console.warn(e2);
      }
    }
  }

  // Local preview
  if (currentUser) {
    showRemoteVoiceVideo(currentUser.uid, new MediaStream([vTrack]));
    const tile = document.getElementById("vvid-" + currentUser.uid);
    if (tile) {
      const lab = tile.querySelector(".vt-name");
      if (lab) lab.textContent = kind === "screen" ? "Toi · Écran" : "Toi";
      const vid = tile.querySelector("video");
      if (vid) {
        vid.muted = true;
        vid.playsInline = true;
        vid.autoplay = true;
        vid.srcObject = new MediaStream([vTrack]);
        vid.play().catch(() => {});
      }
    }
  }
}

async function renegotiateVoice(uid, pc) {
  try {
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    await sendVoiceSignal(uid, { type: "offer", sdp: pc.localDescription.toJSON() });
  } catch (e) {
    console.warn("renego", e);
  }
}

async function clearLocalVideoTrack() {
  if (_localStream) {
    _localStream.getVideoTracks().forEach(t => {
      try { t.stop(); } catch (e) {}
      try { _localStream.removeTrack(t); } catch (e) {}
    });
  }
  for (const uid of Object.keys(_voicePcs)) {
    const pc = _voicePcs[uid];
    if (!pc) continue;
    for (const s of pc.getSenders()) {
      if (s.track && s.track.kind === "video") {
        try { await s.replaceTrack(null); } catch (e) {}
      }
    }
  }
  if (currentUser) {
    const tile = document.getElementById("vvid-" + currentUser.uid);
    if (tile) tile.remove();
    updateVoiceVideoGrid();
  }
}

async function toggleScreenShare() {
  if (!_voiceJoined || !currentUser) return;
  if (!_voiceScreenOn && !hasVoicePerm("screen") && !hasVoicePerm("cam"))
    return alert("Permission refusée : partage d'écran");
  const metaS = window._currentVoiceRoomMeta;
  if (!_voiceScreenOn && metaS && metaS.allowScreen === false && !isAdmin)
    return alert("Partage d'écran désactivé sur ce salon.");
  if (!_voiceScreenOn) {
    try {
      if (!navigator.mediaDevices.getDisplayMedia) {
        return alert("Partage d'écran non supporté par ce navigateur");
      }
      if (_voiceCamOn) {
        // turn off cam flag but clear via apply
        _voiceCamOn = false;
        const cb = document.getElementById("voiceCamBtn");
        if (cb) cb.classList.remove("cam-on");
      }
      const disp = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 15, width: { max: 1920 }, height: { max: 1080 } },
        audio: false
      });
      const vTrack = disp.getVideoTracks()[0];
      vTrack.contentHint = "detail";
      vTrack.onended = () => {
        // user clicked browser "Stop sharing"
        stopScreenShare(false);
      };
      await applyLocalVideoTrack(vTrack, "screen");
      _voiceScreenOn = true;
      const btn = document.getElementById("voiceScreenBtn");
      if (btn) { btn.classList.add("cam-on"); btn.title = "Arrêter le partage"; }
      if (VOICE_ROOM) {
        db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid)
          .set({ screen: true, cam: false }, { merge: true }).catch(() => {});
      }
      setVoiceDebug("Partage d'écran ON");
    } catch (e) {
      if (e.name !== "NotAllowedError") alert("Partage: " + (e.message || e.name));
    }
  } else {
    await stopScreenShare(false);
  }
}

async function stopScreenShare(silent) {
  _voiceScreenOn = false;
  await clearLocalVideoTrack();
  const btn = document.getElementById("voiceScreenBtn");
  if (btn) { btn.classList.remove("cam-on"); btn.title = "Partage d'écran"; }
  if (VOICE_ROOM && currentUser) {
    db.collection("voice").doc(VOICE_ROOM).collection("members").doc(currentUser.uid)
      .set({ screen: false }, { merge: true }).catch(() => {});
  }
  if (!silent) setVoiceDebug("Partage d'écran OFF");
}


function openVoiceFocus(uid) {
  window._voiceFocusUid = uid;
  const overlay = document.getElementById("voiceFocus");
  if (!overlay) return;
  overlay.style.display = "flex";
  rebuildVoiceFocusThumbs();
  setVoiceFocusMain(uid);
}

function closeVoiceFocus() {
  window._voiceFocusUid = null;
  const overlay = document.getElementById("voiceFocus");
  if (overlay) overlay.style.display = "none";
  const main = document.getElementById("voiceFocusVideo");
  if (main) main.srcObject = null;
}

function rebuildVoiceFocusThumbs() {
  const box = document.getElementById("voiceFocusThumbs");
  if (!box) return;
  const tiles = document.querySelectorAll("#voiceVideos .voice-tile");
  box.innerHTML = "";
  tiles.forEach(tile => {
    const uid = tile.dataset.uid || (tile.id || "").replace("vvid-", "");
    const srcVid = tile.querySelector("video");
    if (!srcVid || !srcVid.srcObject) return;
    const thumb = document.createElement("div");
    thumb.className = "vft" + (uid === window._voiceFocusUid ? " active" : "");
    thumb.onclick = (e) => {
      e.stopPropagation();
      window._voiceFocusUid = uid;
      setVoiceFocusMain(uid);
      rebuildVoiceFocusThumbs();
    };
    const v = document.createElement("video");
    v.autoplay = true;
    v.playsInline = true;
    v.muted = true;
    v.srcObject = srcVid.srcObject;
    v.play().catch(() => {});
    const name = tile.querySelector(".vt-name")?.textContent || uid.slice(0, 6);
    const sp = document.createElement("span");
    sp.textContent = name;
    thumb.appendChild(v);
    thumb.appendChild(sp);
    box.appendChild(thumb);
  });
}

function setVoiceFocusMain(uid) {
  window._voiceFocusUid = uid;
  const tile = document.getElementById("vvid-" + uid);
  const main = document.getElementById("voiceFocusVideo");
  const nameEl = document.getElementById("voiceFocusName");
  if (!tile || !main) return;
  const srcVid = tile.querySelector("video");
  if (!srcVid || !srcVid.srcObject) return;
  main.srcObject = srcVid.srcObject;
  main.muted = !!(currentUser && uid === currentUser.uid);
  main.play().catch(() => {});
  if (nameEl) {
    nameEl.textContent = tile.querySelector(".vt-name")?.textContent || uid.slice(0, 6);
  }
  // update active thumbs
  document.querySelectorAll("#voiceFocusThumbs .vft").forEach(t => t.classList.remove("active"));
  // rebuild is cleaner
  rebuildVoiceFocusThumbs();
}

// Escape closes focus
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && window._voiceFocusUid) closeVoiceFocus();
});


// ===== ROLES / GRADES (Discord-like) =====
const ROLE_PERMS = [
  { id: "post", label: "Publier dans le fil", zone: "site" },
  { id: "chat", label: "Écrire dans le chat public", zone: "site" },
  { id: "dm", label: "Messages privés", zone: "site" },
  { id: "gallery_upload", label: "Upload galerie profil", zone: "site" },
  { id: "notes", label: "Créer des notes", zone: "site" },
  { id: "slither", label: "Jouer au mini-jeu", zone: "site" },
  { id: "moderate_chat", label: "Modérer le chat public", zone: "site" },
  { id: "moderate_posts", label: "Supprimer posts d'autrui", zone: "site" },
  { id: "manage_gallery", label: "Gérer galerie publique", zone: "site" },
  { id: "manage_users", label: "Gérer / ban utilisateurs", zone: "site" },
  { id: "manage_roles", label: "Gérer les grades", zone: "site" },
  { id: "admin_panel", label: "Accès panel admin", zone: "site" },
  { id: "view_visits", label: "Voir les visites IP", zone: "site" },
  // Voice zone (independent)
  { id: "voice", label: "Rejoindre le vocal", zone: "voice" },
  { id: "speak", label: "Parler (micro)", zone: "voice" },
  { id: "cam", label: "Caméra / vidéo", zone: "voice" },
  { id: "screen", label: "Partage d'écran", zone: "voice" },
  { id: "voice_chat", label: "Écrire dans le chat du salon", zone: "voice" },
  { id: "voice_activity", label: "Détection de voix", zone: "voice" },
  { id: "priority_speaker", label: "Voix prioritaire", zone: "voice" },
  { id: "mute_members", label: "Mute membres (vocal)", zone: "voice" },
  { id: "manage_voice", label: "Gérer salons vocaux", zone: "voice" }
];

const DEFAULT_MEMBER_PERMS = {
  post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true
};

const DEFAULT_VOICE_PERMS = {
  voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true
};

let _myVoicePerms = { ...DEFAULT_VOICE_PERMS };

let _voiceGlobalCfg = {
  afkMin: 5,
  defaultLimit: 0,
  requireLogin: true,
  allowCamDefault: true,
  allowScreenDefault: true,
  hideEmpty: true,
  hint: ""
};

let _rolesCache = [];
let _myPerms = { ...DEFAULT_MEMBER_PERMS };

function renderRolePermsForm(selected, voiceSelected) {
  const box = document.getElementById("rolePerms");
  if (!box) return;
  const sel = selected || {};
  const vsel = voiceSelected || {};
  const site = ROLE_PERMS.filter(p => p.zone !== "voice");
  const voice = ROLE_PERMS.filter(p => p.zone === "voice");
  box.innerHTML =
    `<div class="role-zone-label">Permissions site</div>` +
    site.map(p =>
      `<label class="role-perm"><input type="checkbox" data-perm="${p.id}" data-zone="site" ${sel[p.id] ? "checked" : ""}> ${p.label}</label>`
    ).join("") +
    `<div class="role-zone-label">Permissions vocales (indépendantes)</div>` +
    voice.map(p =>
      `<label class="role-perm"><input type="checkbox" data-perm="${p.id}" data-zone="voice" ${(vsel[p.id] || sel[p.id]) ? "checked" : ""}> ${p.label}</label>`
    ).join("");
}

async function loadAdminRolesUI() {
  renderRolePermsForm({});
  const editId = document.getElementById("roleEditId");
  const roleName = document.getElementById("roleName");
  if (editId) editId.value = "";
  if (roleName) roleName.value = "";
  try {
    const snap = await db.collection("roles").get();
    _rolesCache = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    _rolesCache.sort((a, b) => (b.position || 0) - (a.position || 0));
    const list = document.getElementById("adminRolesList");
    const sel = document.getElementById("roleAssignSelect");
    if (list) {
      list.innerHTML = _rolesCache.map(r =>
        `<div class="role-card">
          <span class="role-dot" style="background:${esc(r.color||"#a78bfa")}"></span>
          <strong style="color:${esc(r.color||"#e9d5ff")}">${esc(r.name||"Grade")}</strong>
          <span class="hint">pos. ${r.position||0}</span>
          <button type="button" class="btn btn-outline" onclick="editRole('${r.id}')">Modifier</button>
          <button type="button" class="btn-danger" onclick="deleteRole('${r.id}')">×</button>
        </div>`
      ).join("") || '<p class="hint">Aucun grade — génère les grades par défaut ou crée-en un.</p>';
    }
    if (sel) {
      sel.innerHTML = '<option value="">— Membre (défaut) —</option>' +
        _rolesCache.map(r => `<option value="${r.id}">${esc(r.name)}</option>`).join("");
    }
  } catch (e) {
    console.error(e);
  }
}

/** Grades Discord-like préconfigurés */
const DEFAULT_ROLES_SEED = [
  {
    id: "membre",
    name: "Membre",
    color: "#94a3b8",
    position: 10,
    permissions: { post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true },
    voicePermissions: { voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true }
  },
  {
    id: "early",
    name: "Early User",
    color: "#fbbf24",
    position: 30,
    permissions: { post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true },
    voicePermissions: { voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true, priority_speaker: true }
  },
  {
    id: "vip",
    name: "VIP",
    color: "#e879f9",
    position: 50,
    permissions: { post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true },
    voicePermissions: { voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true, priority_speaker: true }
  },
  {
    id: "modo",
    name: "Modérateur",
    color: "#34d399",
    position: 80,
    permissions: {
      post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true,
      moderate_chat: true, moderate_posts: true, manage_gallery: true
    },
    voicePermissions: {
      voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true,
      priority_speaker: true, mute_members: true, manage_voice: true
    }
  },
  {
    id: "admin",
    name: "Administrateur",
    color: "#f87171",
    position: 100,
    permissions: {
      post: true, chat: true, dm: true, gallery_upload: true, notes: true, slither: true,
      moderate_chat: true, moderate_posts: true, manage_gallery: true,
      manage_users: true, manage_roles: true, admin_panel: true, view_visits: true
    },
    voicePermissions: {
      voice: true, speak: true, cam: true, screen: true, voice_chat: true, voice_activity: true,
      priority_speaker: true, mute_members: true, manage_voice: true
    }
  }
];

async function seedDefaultRoles() {
  if (!isAdmin && !hasPerm("manage_roles")) return alert("Permission refusée");
  if (!confirm("Créer / mettre à jour les grades par défaut ?\n(Membre, Early User, VIP, Modérateur, Administrateur)")) return;
  try {
    for (const r of DEFAULT_ROLES_SEED) {
      await db.collection("roles").doc(r.id).set({
        name: r.name,
        color: r.color,
        position: r.position,
        permissions: r.permissions,
        voicePermissions: r.voicePermissions,
        updatedAt: Date.now(),
        createdAt: Date.now()
      }, { merge: true });
    }
    _rolesCache._loaded = false;
    await loadAdminRolesUI();
    await ensureRolesCache();
    xNotify("5 grades générés", { type: "ok", title: "Rôles" });
  } catch (e) {
    alert("Erreur : " + (e.message || e));
  }
}

function editRole(id) {
  const r = _rolesCache.find(x => x.id === id);
  if (!r) return;
  document.getElementById("roleEditId").value = id;
  document.getElementById("roleName").value = r.name || "";
  document.getElementById("roleColor").value = r.color || "#a78bfa";
  document.getElementById("rolePos").value = r.position != null ? r.position : 10;
  renderRolePermsForm(r.permissions || {}, r.voicePermissions || {});
}

async function adminSaveRole() {
  if (!isAdmin && !hasPerm("manage_roles")) return alert("Permission refusée");
  const name = document.getElementById("roleName")?.value.trim();
  if (!name) return alert("Nom requis");
  const color = document.getElementById("roleColor")?.value || "#a78bfa";
  const position = parseInt(document.getElementById("rolePos")?.value || "10", 10);
  const permissions = {};
  const voicePermissions = {};
  document.querySelectorAll("#rolePerms input[data-perm]").forEach(inp => {
    if (inp.dataset.zone === "voice") voicePermissions[inp.dataset.perm] = !!inp.checked;
    else permissions[inp.dataset.perm] = !!inp.checked;
  });
  const editId = document.getElementById("roleEditId")?.value;
  const payload = { name, color, position, permissions, voicePermissions, updatedAt: Date.now() };
  try {
    if (editId) await db.collection("roles").doc(editId).set(payload, { merge: true });
    else await db.collection("roles").add({ ...payload, createdAt: Date.now() });
    document.getElementById("roleEditId").value = "";
    document.getElementById("roleName").value = "";
    _rolesCache._loaded = false;
    await loadAdminRolesUI();
    await ensureRolesCache();
    alert("Grade enregistré");
  } catch (e) {
    alert(e.message);
  }
}

async function deleteRole(id) {
  if (!confirm("Supprimer ce grade ?")) return;
  await db.collection("roles").doc(id).delete();
  loadAdminRolesUI();
}

async function adminAssignRole() {
  if (!isAdmin && !hasPerm("manage_roles")) return alert("Permission refusée");
  const uname = (document.getElementById("roleAssignUser")?.value || "").trim().toLowerCase().replace("@", "");
  const roleId = document.getElementById("roleAssignSelect")?.value || "";
  if (!uname) return alert("Username requis");
  const snap = await db.collection("users").where("username", "==", uname).limit(1).get();
  if (snap.empty) return alert("Utilisateur introuvable");
  await snap.docs[0].ref.set({ roleId: roleId || null }, { merge: true });
  alert("Grade assigné à @" + uname);
}

function hasPerm(key) {
  if (isAdmin) return true;
  // voice keys use separate map
  if (ROLE_PERMS.find(p => p.id === key && p.zone === "voice")) {
    return hasVoicePerm(key);
  }
  if (!_myPerms) return !!DEFAULT_MEMBER_PERMS[key];
  return !!_myPerms[key];
}

function hasVoicePerm(key) {
  if (isAdmin) return true;
  if (!_myVoicePerms) return !!DEFAULT_VOICE_PERMS[key];
  return !!_myVoicePerms[key];
}

async function loadMyPermissions() {
  _myPerms = { ...DEFAULT_MEMBER_PERMS };
  _myVoicePerms = { ...DEFAULT_VOICE_PERMS };
  if (!currentUser) return;
  if (isAdmin) {
    ROLE_PERMS.forEach(p => {
      if (p.zone === "voice") _myVoicePerms[p.id] = true;
      else _myPerms[p.id] = true;
    });
    return;
  }
  try {
    await ensureRolesCache();
    const udoc = await db.collection("users").doc(currentUser.uid).get();
    const roleId = udoc.exists ? udoc.data().roleId : null;
    if (!roleId) return;
    const r = _rolesCache.find(x => x.id === roleId);
    if (r) {
      if (r.permissions) _myPerms = { ...DEFAULT_MEMBER_PERMS, ...r.permissions };
      if (r.voicePermissions) _myVoicePerms = { ...DEFAULT_VOICE_PERMS, ...r.voicePermissions };
      else if (r.permissions) {
        // legacy: copy voice keys from permissions
        ROLE_PERMS.filter(p => p.zone === "voice").forEach(p => {
          if (r.permissions[p.id] != null) _myVoicePerms[p.id] = r.permissions[p.id];
        });
      }
    }
  } catch (e) {
    console.warn(e);
  }
}

// Gate key actions
const _origPublishPost = typeof publishPost === "function" ? publishPost : null;

function applyPermissionGates() {
  // soft UI gates
  const cp = document.getElementById("createPost");
  if (cp && currentUser && !hasPerm("post")) cp.style.display = "none";
  const gameBtn = document.querySelector(".header-game-btn");
  if (gameBtn) gameBtn.style.display = hasPerm("slither") || !currentUser ? "" : "none";
}

// Wrap some actions
async function gatedPublishPost() {
  if (!hasPerm("post")) return alert("Ton grade ne permet pas de publier");
  return publishPost();
}


// ===== SECURITY HARDENING =====
const _rate = {};
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  if (!_rate[key]) _rate[key] = [];
  _rate[key] = _rate[key].filter(t => now - t < windowMs);
  if (_rate[key].length >= max) return false;
  _rate[key].push(now);
  return true;
}

function sanitizeText(s, maxLen) {
  s = String(s == null ? "" : s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/https?:\/\/[^\s]+/gi, (u) => {
    try {
      const x = new URL(u);
      if (!["http:", "https:"].includes(x.protocol)) return "";
      return x.href.slice(0, 300);
    } catch (e) { return ""; }
  });
  return s.slice(0, maxLen || 2000);
}


// ===== HARDENED SECURITY =====
function isSafeMediaUrl(u) {
  if (!u || typeof u !== "string") return false;
  u = u.trim();
  if (/^(javascript|data|vbscript|file):/i.test(u)) return false;
  try {
    const x = new URL(u, location.origin);
    if (!["http:", "https:"].includes(x.protocol)) return false;
    // block obvious XSS vectors in path
    if (/[<>"']/.test(u)) return false;
    return true;
  } catch (e) {
    return false;
  }
}

function isSafeLinkUrl(u) {
  if (!u || typeof u !== "string") return false;
  u = u.trim();
  if (/^(javascript|data|vbscript):/i.test(u)) return false;
  if (u.startsWith("mailto:") || u.startsWith("discord:")) return true;
  try {
    const x = new URL(u, location.origin);
    return ["http:", "https:"].includes(x.protocol);
  } catch (e) {
    return false;
  }
}

function stripDangerous(s, max) {
  s = String(s == null ? "" : s);
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/on\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/<\/?[a-z][^>]*>/gi, "");
  return s.slice(0, max || 2000);
}


function isSafeUrl(u) {
  if (!u) return false;
  try {
    const x = new URL(u);
    return ["http:", "https:"].includes(x.protocol);
  } catch (e) { return false; }
}

function assertLoggedIn() {
  if (!currentUser || !auth.currentUser) throw new Error("Non connecté");
  if (auth.currentUser.uid !== currentUser.uid) throw new Error("Session invalide");
}


function onBgFieldChange() {
  const vid = (document.getElementById("myBgVideo")?.value || "").trim();
  const img = (document.getElementById("myBg")?.value || "").trim();
  const sel = document.getElementById("myBgType");
  if (sel) {
    if (vid) sel.value = "video";
    else if (img) sel.value = "image";
  }
  if (typeof refreshDsPreview === "function") refreshDsPreview();
}

async function uploadBgVideo(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (file.size > 20 * 1024 * 1024) return alert("Vidéo max 20 Mo");
  const status = document.getElementById("myBgVideo");
  try {
    if (status) status.placeholder = "Upload…";
    const fd = new FormData();
    fd.append("reqtype", "fileupload");
    fd.append("fileToUpload", file);
    let url = null;
    for (const ep of [
      "https://catbox.moe/user/api.php",
      "https://corsproxy.io/?" + encodeURIComponent("https://catbox.moe/user/api.php")
    ]) {
      try {
        const res = await fetch(ep, { method: "POST", body: fd });
        const text = (await res.text()).trim();
        if (text.startsWith("http")) { url = text; break; }
      } catch (e) {}
    }
    if (url) {
      document.getElementById("myBgVideo").value = url;
      // clear competing? keep both, priority is video
      onBgFieldChange();
      alert("Vidéo uploadée !");
    } else {
      alert("Upload échoué. Upload sur catbox.moe et colle le lien .mp4");
    }
  } catch (e) {
    alert("Erreur: " + e.message);
  }
  input.value = "";
}


// ===== HOMEMADE SCREAMER (jeff-style) =====
let _screamerAudioCtx = null;
let _screamerActive = false;

function triggerScreamer(e) {
  if (e) { e.preventDefault(); e.stopPropagation(); }
  if (_screamerActive) return;
  _screamerActive = true;
  const ov = document.getElementById("screamerOverlay");
  const img = document.getElementById("screamerImg");
  if (!ov || !img) return;
  // homemade jeff-like face via canvas data URL (no external host needed)
  img.src = buildScreamerFace();
  ov.style.display = "flex";
  document.body.style.overflow = "hidden";
  playScreamerSound();
  // keep going a bit then allow close
  setTimeout(() => {
    ov.style.cursor = "pointer";
  }, 1200);
}

function closeScreamer() {
  if (!_screamerActive) return;
  const ov = document.getElementById("screamerOverlay");
  if (ov) ov.style.display = "none";
  document.body.style.overflow = "";
  _screamerActive = false;
  try {
    if (_screamerAudioCtx) {
      _screamerAudioCtx.close();
      _screamerAudioCtx = null;
    }
  } catch (e) {}
}

function buildScreamerFace() {
  const c = document.createElement("canvas");
  c.width = 512; c.height = 512;
  const ctx = c.getContext("2d");
  // pale skin
  ctx.fillStyle = "#e8dcd0";
  ctx.fillRect(0, 0, 512, 512);
  // blood streaks
  ctx.strokeStyle = "#8b0000";
  ctx.lineWidth = 6;
  for (let i = 0; i < 12; i++) {
    ctx.beginPath();
    const x = 40 + Math.random() * 430;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 20, 120, x - 30, 280, x + 10, 512);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(120,0,0,0.35)";
  ctx.fillRect(0, 0, 512, 80);
  // eyes - black hollow
  ctx.fillStyle = "#0a0a0a";
  ctx.beginPath();
  ctx.ellipse(170, 200, 48, 38, 0, 0, Math.PI * 2);
  ctx.ellipse(342, 200, 48, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  // red around eyes
  ctx.strokeStyle = "#c00";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.ellipse(170, 200, 58, 48, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(342, 200, 58, 48, 0, 0, Math.PI * 2);
  ctx.stroke();
  // wide smile cut
  ctx.strokeStyle = "#1a0000";
  ctx.fillStyle = "#2a0505";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(90, 320);
  ctx.quadraticCurveTo(256, 480, 422, 320);
  ctx.quadraticCurveTo(256, 400, 90, 320);
  ctx.fill();
  ctx.stroke();
  // teeth
  ctx.fillStyle = "#f5f0e6";
  for (let i = 0; i < 11; i++) {
    const tx = 120 + i * 26;
    ctx.fillRect(tx, 340, 18, 28 + (i % 3) * 6);
  }
  // scars
  ctx.strokeStyle = "#5a1010";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(100, 100); ctx.lineTo(200, 160);
  ctx.moveTo(400, 90); ctx.lineTo(320, 170);
  ctx.stroke();
  // vignette
  const g = ctx.createRadialGradient(256, 256, 100, 256, 256, 360);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0,0.55)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return c.toDataURL("image/png");
}

function playScreamerSound() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    _screamerAudioCtx = new AC();
    const ctx = _screamerAudioCtx;
    const now = ctx.currentTime;
    // harsh noise scream
    const duration = 2.4;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const t = i / ctx.sampleRate;
      const env = Math.min(1, t * 8) * Math.exp(-t * 0.55);
      const scream = Math.sin(2 * Math.PI * (700 + t * 900) * t) * 0.4
        + Math.sin(2 * Math.PI * (1200 + Math.sin(t * 30) * 400) * t) * 0.35;
      const noise = (Math.random() * 2 - 1) * 0.5;
      data[i] = (scream + noise) * env * 0.95;
    }
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.9, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    // distortion-ish via waveshaper
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(256);
    for (let i = 0; i < 256; i++) {
      const x = i * 2 / 256 - 1;
      curve[i] = Math.tanh(x * 4);
    }
    shaper.curve = curve;
    src.connect(shaper);
    shaper.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
  } catch (e) {
    console.warn("screamer audio", e);
  }
}


function normalizeUrl(u) {
  u = String(u || "").trim();
  if (!u) return "";
  if (/^(javascript|data|vbscript):/i.test(u)) return "";
  if (u.startsWith("mailto:") || u.startsWith("discord:")) return u;
  if (/^https?:\/\//i.test(u)) return isSafeLinkUrl(u) ? u : "";
  const full = "https://" + u;
  return isSafeLinkUrl(full) ? full : "";
}

function renderSocialIconsRow(socials) {
  const iconOnly = (socials || []).filter(s => s.display === "icon" || (!s.display && ["instagram","tiktok","discord","youtube","spotify","x","twitter","whatsapp","email"].some(k => (s.label||"").toLowerCase().includes(k) || (s.url||"").toLowerCase().includes(k))));
  // Prefer explicit icon display; else auto-pick known socials for top row
  let list = (socials || []).filter(s => s.display === "icon");
  if (!list.length) {
    list = (socials || []).filter(s => {
      const u = (s.url || "").toLowerCase() + " " + (s.label || "").toLowerCase();
      return /instagram|tiktok|youtube|youtu\.be|spotify|discord|twitter|x\.com|whatsapp|wa\.me|mailto:/.test(u);
    }).slice(0, 8);
  }
  if (!list.length) return "";
  return `<div class="pv-social-icons">${list.map(s => {
    const url = normalizeUrl(s.url);
    return `<a class="pv-soc-icon" href="${esc(url)}" target="_blank" rel="noopener" title="${esc(s.label||"")}">${esc(s.icon||"🔗")}</a>`;
  }).join("")}</div>`;
}

function renderSocialLinksHTML(socials, withDelete) {
  const list = (socials || []).filter(s => (s.label || s.url) && s.display !== "icon");
  if (!list.length) return "";
  const icons = renderSocialIconsRow(socials);
  const buttons = list.map((s, i) => {
    const url = normalizeUrl(s.url);
    const label = s.label || s.url || "Lien";
    const fx = s.effect || (s.display === "featured" ? "featured" : "normal");
    const isFeatured = fx === "featured" || s.display === "featured";
    const thumb = s.thumb ? `<img class="link-thumb" src="${esc(s.thumb)}" alt="">` : "";
    const sub = s.sub ? `<span class="link-sub">${esc(s.sub)}</span>` : "";
    const del = withDelete
      ? `<button type="button" class="link-del" onclick="event.preventDefault();event.stopPropagation();inlineDelLink(${i})">✕</button>`
      : "";
    const colorStyle = isFeatured && s.color ? `style="--feat:${esc(s.color)};background:${esc(s.color)};border-color:transparent;color:#fff"` : "";

    if (s.type === "header") {
      return `<div class="pv-block-header">${esc(label)}</div>`;
    }
    if (fx === "spoiler") {
      return `<div class="link link-spoiler" data-href="${esc(url)}" onclick="revealSpoiler(this)">
        <span class="spoiler-fog"></span>
        <span class="spoiler-label">${esc(s.icon||"🔗")} ${esc(label)}</span>
        <span class="spoiler-hint">Appuie pour révéler</span>
        ${del}
      </div>`;
    }
    if (s.type === "map" && url) {
      const embed = mapsEmbedUrl(url, label);
      return `<div class="pv-map-wrap">
        <a href="${esc(url)}" class="link link-map ${isFeatured?"link-fx-featured":""}" target="_blank" rel="noopener" ${colorStyle}>
          <span class="link-text"><span>📍 ${esc(label)}</span>${sub || '<span class="link-sub">Voir sur la carte</span>'}</span>${del}
        </a>
        ${embed ? `<div class="pv-map"><iframe src="${esc(embed)}" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe></div>` : ""}
      </div>`;
    }
    if (s.type === "file" && url) {
      return `<a href="${esc(url)}" class="link link-file ${isFeatured?"link-fx-featured":""}" target="_blank" rel="noopener" download ${colorStyle}>
        ${thumb}<span class="link-text"><span>⬇️ ${esc(label)}</span>${sub || '<span class="link-sub">Télécharger</span>'}</span>${del}
      </a>`;
    }
    const inner = `${thumb}<span class="link-text"><span>${esc(s.icon||"🔗")} ${esc(label)}</span>${sub}</span>${del}`;
    if (!url) return `<div class="link ${isFeatured?"link-fx-featured":""}" ${colorStyle}>${inner}</div>`;
    return `<a href="${esc(url)}" class="link link-fx-${fx} ${s.thumb?"has-thumb":""} ${isFeatured?"is-featured":""}" target="_blank" rel="noopener noreferrer" ${colorStyle}>${inner}</a>`;
  }).join("");
  return icons + buttons;
}

function refreshProfileLinks() {
  const el = document.getElementById("pvSocials");
  if (!el || !viewingUser) return;
  const own = isOwnProfile();
  el.innerHTML = renderSocialLinksHTML(viewingUser.socials || [], own);
  el.style.display = "flex";
  // ensure inside links tab
  const panel = document.getElementById("pvTab-links");
  if (panel && el.parentElement !== panel) {
    panel.insertBefore(el, panel.firstChild);
  }
  applyProfileDesign(viewingUser);
}


function placeProfileBio(u) {
  const wrap = document.getElementById("pvBioWrap");
  const bioEl = document.getElementById("pvBio");
  if (!wrap) return;
  const show = u.bioShow !== false;
  const text = (u.bio && String(u.bio).trim()) || "";
  const own = typeof isOwnProfile === "function" && isOwnProfile();
  const pos = u.bioPos || "under-name";

  if (bioEl) bioEl.textContent = text;

  if (!show || (!text && !own)) {
    wrap.style.display = "none";
    return;
  }
  if (!text && own) {
    // hide empty bio on public layout; edit via studio or ✎ if present under name
    wrap.style.display = "none";
    return;
  }

  wrap.style.display = "inline-block";
  wrap.className = "status pv-editable bio-pos-" + pos;

  const name = document.getElementById("pvName");
  const handle = document.getElementById("pvHandle");
  const badges = document.getElementById("pvBadges");
  const share = document.getElementById("pvShareRow");
  const links = document.getElementById("pvSocials");
  const profile = document.getElementById("profileView");
  const footer = profile && profile.querySelector("footer.footer");

  try {
    if (pos === "under-name" && name && name.parentNode) {
      name.parentNode.insertBefore(wrap, name.nextSibling);
    } else if (pos === "under-handle" && handle && handle.parentNode) {
      handle.parentNode.insertBefore(wrap, handle.nextSibling);
    } else if (pos === "under-badges" && badges && badges.parentNode) {
      badges.parentNode.insertBefore(wrap, badges.nextSibling);
    } else if (pos === "under-share" && share && share.parentNode) {
      share.parentNode.insertBefore(wrap, share.nextSibling);
    } else if (pos === "above-links" && links && links.parentNode) {
      links.parentNode.insertBefore(wrap, links);
    } else if (pos === "below-links" && links && links.parentNode) {
      links.parentNode.insertBefore(wrap, links.nextSibling);
    } else if (pos === "footer" && profile) {
      if (footer) profile.insertBefore(wrap, footer);
      else profile.appendChild(wrap);
    } else if (name && name.parentNode) {
      name.parentNode.insertBefore(wrap, name.nextSibling);
    }
  } catch (e) {
    console.warn("placeBio", e);
  }
}


// ===== LINKED ACCOUNTS (Steam, Spotify, Battle.net, Google, Discord, Twitch) =====
window._linkedCache = window._linkedCache || {};

function getLinked(u) {
  return (u && u.linkedAccounts) || (window.userProfile && window.userProfile.linkedAccounts) || {};
}

async function saveLinkedAccounts(patch) {
  if (!currentUser) return openModal(false);
  const prev = getLinked(window.userProfile || {});
  const linkedAccounts = { ...prev, ...patch };
  // remove nulls
  Object.keys(linkedAccounts).forEach(k => {
    if (linkedAccounts[k] == null) delete linkedAccounts[k];
  });
  await db.collection("users").doc(currentUser.uid).set({ linkedAccounts }, { merge: true });
  if (window.userProfile) window.userProfile.linkedAccounts = linkedAccounts;
  if (viewingUser && viewingUser.id === currentUser.uid) {
    viewingUser.linkedAccounts = linkedAccounts;
    renderLinkedAccountsPanel(viewingUser);
  }
  refreshLinkedAccountsUI(linkedAccounts);
  return linkedAccounts;
}

function refreshLinkedAccountsUI(la) {
  la = la || {};
  const set = (id, text, connected) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    el.style.color = connected ? "#4ade80" : "";
  };
  if (la.steam) {
    set("steamStatus", "Connecté · " + (la.steam.displayName || la.steam.id || "Steam"), true);
    const inp = document.getElementById("linkSteamInput");
    if (inp && !inp.value) inp.value = la.steam.vanity || la.steam.id || "";
  } else set("steamStatus", "Non connecté", false);

  if (la.spotify) {
    set("spotifyStatus", "Connecté · " + (la.spotify.displayName || "Spotify"), true);
    const inp = document.getElementById("linkSpotifyInput");
    if (inp && !inp.value) inp.value = la.spotify.url || "";
  } else set("spotifyStatus", "Non connecté", false);

  if (la.battlenet) {
    set("battlenetStatus", "Connecté · " + (la.battlenet.battletag || ""), true);
    const inp = document.getElementById("linkBattlenetInput");
    if (inp && !inp.value) inp.value = la.battlenet.battletag || "";
  } else set("battlenetStatus", "Non connecté", false);

  if (la.discord) {
    set("discordStatus", "Connecté · " + (la.discord.displayName || "Discord"), true);
    const inp = document.getElementById("linkDiscordInput");
    if (inp && !inp.value) inp.value = la.discord.url || la.discord.displayName || "";
  } else set("discordStatus", "Non connecté", false);

  if (la.twitch) {
    set("twitchStatus", "Connecté · " + (la.twitch.login || ""), true);
    const inp = document.getElementById("linkTwitchInput");
    if (inp && !inp.value) inp.value = la.twitch.login || la.twitch.url || "";
  } else set("twitchStatus", "Non connecté", false);

  // Google via Firebase providers
  try {
    const providers = (currentUser && currentUser.providerData) || [];
    const hasG = providers.some(p => p.providerId === "google.com");
    set("googleStatus", hasG ? ("Lié · " + (providers.find(p => p.providerId === "google.com")?.email || "Google")) : "Non lié", hasG);
  } catch (e) {}
}

async function disconnectLinked(key) {
  if (!currentUser) return;
  const prev = { ...getLinked(window.userProfile || {}) };
  prev[key] = null;
  await saveLinkedAccounts(prev);
  const map = {
    steam: "linkSteamInput",
    spotify: "linkSpotifyInput",
    battlenet: "linkBattlenetInput",
    discord: "linkDiscordInput",
    twitch: "linkTwitchInput"
  };
  const inp = document.getElementById(map[key]);
  if (inp) inp.value = "";
  xNotify(key + " retiré", { type: "ok" });
}

/** Extract SteamID64 or vanity from input */
function parseSteamInput(raw) {
  const s = String(raw || "").trim();
  if (!s) return null;
  if (/^\d{17}$/.test(s)) return { id: s };
  const mId = s.match(/steamcommunity\.com\/(?:profiles)\/(\d{17})/i);
  if (mId) return { id: mId[1] };
  const mVanity = s.match(/steamcommunity\.com\/(?:id)\/([a-zA-Z0-9_-]+)/i);
  if (mVanity) return { vanity: mVanity[1] };
  if (/^[a-zA-Z0-9_-]{2,32}$/.test(s)) return { vanity: s };
  return { vanity: s.replace(/https?:\/\//, "").split("/")[0] };
}

async function resolveSteamId(parsed) {
  if (parsed.id) return parsed.id;
  if (!parsed.vanity) return null;
  // Try Steam API via CORS proxy if site has key
  const key = (window._siteConfig && window._siteConfig.steamApiKey) || "";
  if (key) {
    try {
      const api = `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?key=${encodeURIComponent(key)}&vanityurl=${encodeURIComponent(parsed.vanity)}`;
      const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(api));
      const data = await res.json();
      if (data?.response?.steamid) return data.response.steamid;
    } catch (e) {}
  }
  // fallback: try community page via allorigins XML
  try {
    const url = "https://steamcommunity.com/id/" + encodeURIComponent(parsed.vanity) + "/?xml=1";
    const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
    const text = await res.text();
    const m = text.match(/<steamID64>(\d{17})<\/steamID64>/);
    if (m) return m[1];
  } catch (e) {}
  return null;
}

async function connectSteam() {
  if (!currentUser) return openModal(false);
  const raw = document.getElementById("linkSteamInput")?.value.trim();
  const parsed = parseSteamInput(raw);
  if (!parsed) return alert("Indique ton ID Steam ou l’URL de profil");
  xNotify("Résolution Steam…", { type: "ok" });
  const id = await resolveSteamId(parsed);
  const displayName = parsed.vanity || id || "Steam";
  const profileUrl = id
    ? "https://steamcommunity.com/profiles/" + id
    : (parsed.vanity ? "https://steamcommunity.com/id/" + parsed.vanity : "");
  await saveLinkedAccounts({
    steam: {
      id: id || null,
      vanity: parsed.vanity || null,
      displayName,
      url: profileUrl,
      connectedAt: Date.now()
    }
  });
  xNotify("Steam connecté" + (id ? " · ID " + id : ""), { type: "ok", title: "Comptes" });
  if (id) loadSteamLibrary(id).then(games => {
    if (viewingUser && viewingUser.id === currentUser.uid) renderSteamLibrary(games);
  });
}

async function loadSteamLibrary(steamId) {
  if (!steamId) return [];
  if (window._linkedCache["steam_" + steamId]) return window._linkedCache["steam_" + steamId];
  const key = (window._siteConfig && window._siteConfig.steamApiKey) || "";
  let games = [];
  if (key) {
    try {
      const api = `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${encodeURIComponent(key)}&steamid=${steamId}&include_appinfo=1&include_played_free_games=1&format=json`;
      const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(api));
      const data = await res.json();
      games = (data?.response?.games || []).map(g => ({
        appid: g.appid,
        name: g.name || ("App " + g.appid),
        playtime: g.playtime_forever || 0,
        img: g.img_icon_url
          ? `https://media.steampowered.com/steamcommunity/public/images/apps/${g.appid}/${g.img_icon_url}.jpg`
          : `https://cdn.cloudflare.steamstatic.com/steam/apps/${g.appid}/capsule_231x87.jpg`
      }));
      games.sort((a, b) => b.playtime - a.playtime);
    } catch (e) {
      console.warn("Steam API", e);
    }
  }
  // public profile games XML fallback (limited)
  if (!games.length) {
    try {
      const url = `https://steamcommunity.com/profiles/${steamId}/games/?tab=all&xml=1`;
      const res = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
      const text = await res.text();
      const blocks = text.split("<game>").slice(1);
      games = blocks.slice(0, 60).map(b => {
        const appid = (b.match(/<appID>(\d+)<\/appID>/) || [])[1];
        const name = (b.match(/<name><!\[CDATA\[(.*?)\]\]><\/name>/) || b.match(/<name>(.*?)<\/name>/) || [])[1] || "Jeu";
        const hours = parseFloat((b.match(/<hoursOnRecord><!\[CDATA\[(.*?)\]\]><\/hoursOnRecord>/) || [])[1] || 0);
        return {
          appid,
          name,
          playtime: Math.round(hours * 60),
          img: appid ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appid}/capsule_231x87.jpg` : ""
        };
      }).filter(g => g.appid);
    } catch (e) {
      console.warn("Steam XML", e);
    }
  }
  window._linkedCache["steam_" + steamId] = games;
  return games;
}

function renderSteamLibrary(games) {
  const wrap = document.getElementById("pvSteamLibrary");
  const box = document.getElementById("pvSteamGames");
  const hint = document.getElementById("pvSteamHint");
  if (!wrap || !box) return;
  if (!games || !games.length) {
    wrap.style.display = "block";
    box.innerHTML = "";
    if (hint) hint.textContent = "Bibliothèque privée ou introuvable. Vérifie la visibilité du profil Steam, ou configure une Steam API Key (admin).";
    return;
  }
  wrap.style.display = "block";
  if (hint) hint.textContent = games.length + " jeux · triés par temps de jeu";
  box.innerHTML = games.slice(0, 48).map(g => {
    const h = g.playtime ? (g.playtime >= 60 ? Math.round(g.playtime / 60) + " h" : g.playtime + " min") : "";
    return `<a class="steam-game" href="https://store.steampowered.com/app/${g.appid}" target="_blank" rel="noopener" title="${esc(g.name)}">
      <img src="${esc(g.img)}" alt="" loading="lazy" onerror="this.style.opacity='.3'">
      <span class="sg-name">${esc(g.name)}</span>
      <span class="sg-time">${esc(h)}</span>
    </a>`;
  }).join("");
}

async function connectSpotify() {
  if (!currentUser) return openModal(false);
  let url = document.getElementById("linkSpotifyInput")?.value.trim() || "";
  if (!url) return alert("Colle un lien Spotify (profil ou playlist)");
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  if (!/spotify\.com/i.test(url)) return alert("Lien Spotify invalide");
  let displayName = "Spotify";
  try {
    const path = new URL(url).pathname.split("/").filter(Boolean);
    if (path[0] === "user" && path[1]) displayName = path[1];
    if (path[0] === "playlist" && path[1]) displayName = "Playlist";
  } catch (e) {}
  await saveLinkedAccounts({
    spotify: { url, displayName, connectedAt: Date.now() }
  });
  // also set mySpotify field for embed
  const sp = document.getElementById("mySpotify");
  if (sp) sp.value = url;
  xNotify("Spotify connecté", { type: "ok", title: "Comptes" });
}

async function connectBattlenet() {
  if (!currentUser) return openModal(false);
  const tag = document.getElementById("linkBattlenetInput")?.value.trim() || "";
  if (!tag || !tag.includes("#")) return alert("BattleTag invalide (ex: Pseudo#1234)");
  const encoded = tag.replace("#", "-");
  await saveLinkedAccounts({
    battlenet: {
      battletag: tag,
      url: "https://battlefieldtracker.com/bfv/profile/origin/" + encodeURIComponent(tag.split("#")[0]),
      wowUrl: "https://worldofwarcraft.blizzard.com/fr-fr/character/eu/" + encodeURIComponent(encoded.toLowerCase()),
      connectedAt: Date.now()
    }
  });
  xNotify("Battle.net connecté", { type: "ok", title: "Comptes" });
}

async function connectDiscordLinked() {
  if (!currentUser) return openModal(false);
  let v = document.getElementById("linkDiscordInput")?.value.trim() || "";
  if (!v) return alert("Pseudo ou lien Discord");
  let url = v, displayName = v;
  if (/discord\.gg\//i.test(v) || /discord\.com\//i.test(v)) {
    if (!/^https?:\/\//i.test(v)) url = "https://" + v;
    displayName = "Discord";
  } else {
    url = "";
    displayName = v.replace(/^@/, "");
  }
  await saveLinkedAccounts({
    discord: { displayName, url, connectedAt: Date.now() }
  });
  xNotify("Discord connecté", { type: "ok", title: "Comptes" });
}

async function connectTwitch() {
  if (!currentUser) return openModal(false);
  let v = document.getElementById("linkTwitchInput")?.value.trim() || "";
  if (!v) return alert("Pseudo Twitch");
  let login = v;
  const m = v.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
  if (m) login = m[1];
  login = login.replace(/^@/, "").toLowerCase();
  await saveLinkedAccounts({
    twitch: {
      login,
      url: "https://twitch.tv/" + login,
      connectedAt: Date.now()
    }
  });
  xNotify("Twitch connecté", { type: "ok", title: "Comptes" });
}

async function linkGoogleAccount() {
  if (!currentUser) return openModal(false);
  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    await currentUser.linkWithPopup(provider);
    xNotify("Google lié", { type: "ok", title: "Comptes" });
    refreshLinkedAccountsUI(getLinked(window.userProfile));
  } catch (e) {
    if (e.code === "auth/credential-already-in-use") {
      alert("Ce compte Google est déjà lié à un autre utilisateur.");
    } else {
      alert(e.message || "Impossible de lier Google");
    }
  }
}

async function unlinkGoogleAccount() {
  if (!currentUser) return;
  try {
    await currentUser.unlink("google.com");
    xNotify("Google retiré", { type: "ok" });
    refreshLinkedAccountsUI(getLinked(window.userProfile));
  } catch (e) {
    alert(e.message || "Erreur");
  }
}

function renderLinkedAccountsPanel(u) {
  const box = document.getElementById("pvLinkedAccounts");
  if (!box) return;
  const la = (u && u.linkedAccounts) || {};
  const cards = [];
  if (la.steam) {
    cards.push(`<a class="pv-acc-card steam" href="${esc(la.steam.url || "#")}" target="_blank" rel="noopener">
      <span class="pac-ico">🎮</span>
      <div><strong>Steam</strong><div class="hint">${esc(la.steam.displayName || la.steam.id || "")}</div></div>
    </a>`);
  }
  if (la.spotify) {
    cards.push(`<a class="pv-acc-card spotify" href="${esc(la.spotify.url || "#")}" target="_blank" rel="noopener">
      <span class="pac-ico">🎧</span>
      <div><strong>Spotify</strong><div class="hint">${esc(la.spotify.displayName || "")}</div></div>
    </a>`);
  }
  if (la.battlenet) {
    cards.push(`<div class="pv-acc-card bnet">
      <span class="pac-ico">⚔️</span>
      <div><strong>Battle.net</strong><div class="hint">${esc(la.battlenet.battletag || "")}</div></div>
    </div>`);
  }
  if (la.discord) {
    const href = la.discord.url || "#";
    cards.push(`<a class="pv-acc-card discord" href="${esc(href)}" target="_blank" rel="noopener">
      <span class="pac-ico">💬</span>
      <div><strong>Discord</strong><div class="hint">${esc(la.discord.displayName || "")}</div></div>
    </a>`);
  }
  if (la.twitch) {
    cards.push(`<a class="pv-acc-card twitch" href="${esc(la.twitch.url || "#")}" target="_blank" rel="noopener">
      <span class="pac-ico">🟣</span>
      <div><strong>Twitch</strong><div class="hint">${esc(la.twitch.login || "")}</div></div>
    </a>`);
  }
  if (!cards.length) {
    box.innerHTML = '<p class="hint">Aucun compte lié. Studio profil → Compte pour connecter Steam, Spotify…</p>';
  } else {
    box.innerHTML = `<div class="pv-acc-grid">${cards.join("")}</div>`;
  }

  // Spotify embed
  const spBox = document.getElementById("pvSpotifyEmbed");
  if (spBox) {
    const spUrl = la.spotify?.url || u.spotify || "";
    if (spUrl && /spotify\.com/i.test(spUrl)) {
      let embed = spUrl.replace("open.spotify.com/", "open.spotify.com/embed/");
      embed = embed.split("?")[0];
      spBox.innerHTML = `<iframe class="spotify-embed" src="${esc(embed)}" allow="encrypted-media" loading="lazy"></iframe>`;
    } else spBox.innerHTML = "";
  }

  // Steam library
  const steamId = la.steam && la.steam.id;
  const libWrap = document.getElementById("pvSteamLibrary");
  if (steamId) {
    loadSteamLibrary(steamId).then(renderSteamLibrary);
  } else if (libWrap) {
    libWrap.style.display = la.steam ? "block" : "none";
    const hint = document.getElementById("pvSteamHint");
    if (la.steam && hint) hint.textContent = "Profil Steam lié — ID non résolu (bibliothèque indisponible).";
    const g = document.getElementById("pvSteamGames");
    if (g) g.innerHTML = "";
  }
}

// load site config (optional steam api key)
(async function loadSiteConfigLinked() {
  try {
    const doc = await db.collection("config").doc("site").get();
    if (doc.exists) window._siteConfig = { ...(window._siteConfig || {}), ...doc.data() };
  } catch (e) {}
})();

// ===== PROFILE STREAM (Twitch / YouTube / Kick / HLS / iframe) =====
let _hlsPlayer = null;

function getStreamCfg(u) {
  return (u && u.stream) || {
    platform: "twitch",
    channel: "",
    title: "",
    category: "",
    rtmp: "",
    streamKey: "",
    isLive: false,
    updatedAt: 0
  };
}

function setStreamMode(mode) {
  const hls = document.getElementById("xsHlsPanel");
  const other = document.getElementById("xsOtherPanel");
  const bH = document.getElementById("xsModeHls");
  const bO = document.getElementById("xsModeOther");
  const plat = document.getElementById("xsPlatform");
  if (mode === "hls") {
    if (hls) hls.style.display = "block";
    if (other) other.style.display = "none";
    if (bH) bH.classList.add("active");
    if (bO) bO.classList.remove("active");
    if (plat) plat.value = "hls";
  } else {
    if (hls) hls.style.display = "none";
    if (other) other.style.display = "block";
    if (bH) bH.classList.remove("active");
    if (bO) bO.classList.add("active");
    const o = document.getElementById("xsPlatformOther");
    if (plat && o) plat.value = o.value || "twitch";
  }
}

function readStreamForm() {
  const platform = document.getElementById("xsPlatform")?.value || "twitch";
  if (platform === "hls") {
    return { platform: "hls", channel: "", title: "", category: "", rtmp: "", streamKey: "", _maintenance: true };
  }
  const channel = (document.getElementById("xsChannel")?.value || "").trim();
  return {
    platform,
    channel,
    title: (document.getElementById("xsTitle")?.value || "").trim().slice(0, 80),
    category: (document.getElementById("xsCategory")?.value || "").trim().slice(0, 40),
    rtmp: "",
    streamKey: ""
  };
}

function destroyHls() {
  try {
    if (_hlsPlayer) { _hlsPlayer.destroy(); _hlsPlayer = null; }
  } catch (e) {}
}

function twitchParentHosts() {
  const hosts = ["localhost", "xultra.space", "www.xultra.space"];
  try {
    const h = location.hostname;
    if (h && !hosts.includes(h)) hosts.push(h);
  } catch (e) {}
  return hosts.map(h => "parent=" + encodeURIComponent(h)).join("&");
}

function buildStreamEmbed(cfg) {
  const platform = (cfg.platform || "twitch").toLowerCase();
  let channel = String(cfg.channel || "").trim();
  if (!channel) return { html: "", error: "Aucune chaîne / URL configurée" };

  if (platform === "twitch") {
    // accept URL or login
    const m = channel.match(/twitch\.tv\/([a-zA-Z0-9_]+)/i);
    const login = (m ? m[1] : channel.replace(/^@/, "")).toLowerCase();
    const src = `https://player.twitch.tv/?channel=${encodeURIComponent(login)}&${twitchParentHosts()}&muted=false`;
    return { html: `<iframe src="${src}" allowfullscreen allow="autoplay;encrypted-media" class="xstream-iframe"></iframe>`, meta: login };
  }

  if (platform === "youtube") {
    let id = channel;
    const m = channel.match(/(?:youtu\.be\/|v=|\/live\/|\/embed\/)([\w-]{11})/);
    if (m) id = m[1];
    else if (/youtube\.com\/@/.test(channel)) {
      // channel handle live - use live embed via path not always works; instruct user to paste video id
      return { html: "", error: "Colle l’URL du live YouTube (watch?v=… ou /live/…)" };
    }
    const src = `https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1&rel=0`;
    return { html: `<iframe src="${src}" allowfullscreen allow="autoplay;encrypted-media;picture-in-picture" class="xstream-iframe"></iframe>`, meta: id };
  }

  if (platform === "kick") {
    let login = channel;
    const m = channel.match(/kick\.com\/([a-zA-Z0-9_]+)/i);
    if (m) login = m[1];
    login = login.replace(/^@/, "");
    const src = `https://player.kick.com/${encodeURIComponent(login)}`;
    return { html: `<iframe src="${src}" allowfullscreen allow="autoplay;encrypted-media" class="xstream-iframe"></iframe>`, meta: login };
  }

  if (platform === "iframe") {
    let url = channel;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return { html: `<iframe src="${esc(url)}" allowfullscreen allow="autoplay;encrypted-media" class="xstream-iframe"></iframe>` };
  }

  if (platform === "hls") {
    let url = channel;
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    return { html: `<video id="xstreamHlsVideo" class="xstream-video" controls autoplay playsinline></video>`, hlsUrl: url };
  }

  return { html: "", error: "Plateforme inconnue" };
}

function mountHls(url) {
  const video = document.getElementById("xstreamHlsVideo");
  if (!video || !url) return;
  destroyHls();
  if (window.Hls && Hls.isSupported()) {
    _hlsPlayer = new Hls({
      enableWorker: true,
      lowLatencyMode: true,
      backBufferLength: 30,
      liveSyncDurationCount: 3
    });
    _hlsPlayer.loadSource(url);
    _hlsPlayer.attachMedia(video);
    _hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().catch(() => {});
    });
    _hlsPlayer.on(Hls.Events.ERROR, (_, data) => {
      if (data.fatal) {
        const frame = document.getElementById("xstreamFrame");
        if (frame) {
          frame.innerHTML += '<p class="hint" style="padding:10px">Flux HLS inaccessible — vérifie que OBS diffuse et que l’URL .m3u8 est publique.</p>';
        }
      }
    });
  } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
    video.src = url;
    video.play().catch(() => {});
  } else {
    video.insertAdjacentHTML("afterend", '<p class="hint">HLS non supporté sur ce navigateur</p>');
  }
}

function renderProfileStream(u) {
  const offline = document.getElementById("xstreamOffline");
  const live = document.getElementById("xstreamLive");
  const frame = document.getElementById("xstreamFrame");
  const ownerTools = document.getElementById("xstreamOwnerTools");
  if (!offline || !live) return;

  const cfg = getStreamCfg(u);
  const own = isOwnProfile();

  if (ownerTools) ownerTools.style.display = own ? "block" : "none";
  if (own) {
    // Default to platform embeds; HLS native = maintenance tab only
    const isHls = cfg.platform === "hls";
    setStreamMode(isHls ? "hls" : "other");
    const p = document.getElementById("xsPlatform");
    if (p) p.value = isHls ? "hls" : (cfg.platform || "twitch");
    const po = document.getElementById("xsPlatformOther");
    if (po && !isHls) po.value = cfg.platform || "twitch";
    const c = document.getElementById("xsChannel");
    if (c) c.value = !isHls ? (cfg.channel || "") : "";
    const t = document.getElementById("xsTitle");
    const cat = document.getElementById("xsCategory");
    if (t) t.value = cfg.title || "";
    if (cat) cat.value = cfg.category || "";
    const go = document.querySelector(".xstream-golive");
    if (go) go.textContent = cfg.isLive ? "● En live — stop" : "Go Live";
  }

  const endBtn = document.getElementById("xstreamEndBtn");
  if (endBtn) endBtn.style.display = own && cfg.isLive ? "inline-flex" : "none";

  if (cfg.isLive && cfg.channel) {
    offline.style.display = "none";
    live.style.display = "block";
    document.getElementById("xstreamLiveTitle").textContent = cfg.title || "Live";
    document.getElementById("xstreamCat").textContent = cfg.category || (cfg.platform === "hls" ? "HLS" : "");
    const emb = buildStreamEmbed(cfg);
    if (emb.error) {
      frame.innerHTML = `<p class="hint">${esc(emb.error)}</p>`;
    } else {
      frame.innerHTML = emb.html;
      if (emb.hlsUrl) setTimeout(() => mountHls(emb.hlsUrl), 50);
    }
  } else {
    destroyHls();
    live.style.display = "none";
    offline.style.display = "flex";
    document.getElementById("xstreamOffTitle").textContent = cfg.title ? cfg.title : "Hors ligne";
    document.getElementById("xstreamOffDesc").textContent = own
      ? "Choisis Twitch, Kick ou YouTube puis Go Live."
      : "Ce créateur n’est pas en live pour le moment.";
    if (frame) frame.innerHTML = "";
  }
}

async function saveStreamSettings() {
  if (!currentUser) return openModal(false);
  const form = readStreamForm();
  if (form._maintenance || form.platform === "hls") {
    return alert("Le stream natif OBS/HLS est en maintenance.\nUtilise Twitch, Kick ou YouTube.");
  }
  if (!form.channel) return alert("Indique ton pseudo ou l’URL du live");
  const prev = getStreamCfg(viewingUser || window.userProfile || {});
  const stream = {
    platform: form.platform || "twitch",
    channel: form.channel,
    title: form.title,
    category: form.category,
    isLive: !!prev.isLive,
    updatedAt: Date.now()
  };
  await db.collection("users").doc(currentUser.uid).set({ stream }, { merge: true });
  if (window.userProfile) window.userProfile.stream = stream;
  if (viewingUser && viewingUser.id === currentUser.uid) {
    viewingUser.stream = stream;
    renderProfileStream(viewingUser);
  }
  xNotify("Paramètres stream enregistrés", { type: "ok", title: "Stream" });
}

async function toggleStreamLive() {
  if (!currentUser) return openModal(false);
  const form = readStreamForm();
  if (form._maintenance || form.platform === "hls") {
    return alert("Le stream natif OBS/HLS est en maintenance.\nPasse sur l’onglet Twitch / Kick / YT.");
  }
  const prev = getStreamCfg(viewingUser || window.userProfile || {});
  const channel = form.channel || prev.channel || "";
  if (!channel) return alert("Indique ton pseudo / URL puis Enregistrer");

  const goingLive = !prev.isLive;
  const stream = {
    platform: form.platform || prev.platform || "twitch",
    channel,
    title: form.title || prev.title || "Live XULTRA",
    category: form.category || prev.category || "",
    isLive: goingLive,
    liveSince: goingLive ? Date.now() : null,
    updatedAt: Date.now()
  };
  await db.collection("users").doc(currentUser.uid).set({ stream }, { merge: true });
  if (window.userProfile) window.userProfile.stream = stream;
  if (viewingUser && viewingUser.id === currentUser.uid) {
    viewingUser.stream = stream;
    renderProfileStream(viewingUser);
  }
  xNotify(goingLive ? "Tu es en LIVE 🔴" : "Live terminé", { type: "ok", title: "Stream" });
}


// ===== HUB PROFILE CARD =====
function hubSwitchAuth(reg) {
  const u = document.getElementById("hubAuthUser");
  const btn = document.getElementById("hubAuthBtn");
  const tL = document.getElementById("hubTabLogin");
  const tR = document.getElementById("hubTabReg");
  if (u) u.style.display = reg ? "block" : "none";
  if (btn) btn.textContent = reg ? "Créer un compte" : "Se connecter";
  if (tL) tL.classList.toggle("active", !reg);
  if (tR) tR.classList.toggle("active", reg);
  window._hubReg = !!reg;
}

async function hubHandleAuth() {
  // mirror me auth fields then call same handlers
  const email = document.getElementById("hubAuthEmail")?.value || "";
  const pass = document.getElementById("hubAuthPass")?.value || "";
  const user = document.getElementById("hubAuthUser")?.value || "";
  const e = document.getElementById("meAuthEmail");
  const p = document.getElementById("meAuthPass");
  const u = document.getElementById("meAuthUser");
  if (e) e.value = email;
  if (p) p.value = pass;
  if (u) u.value = user;
  if (window._hubReg) meSwitchAuth(true);
  else meSwitchAuth(false);
  try { await meHandleAuth(); } catch (err) {}
  setTimeout(syncHubProfileCard, 500);
}

function syncHubProfileCard() {
  const guest = document.getElementById("hubGuest");
  const logged = document.getElementById("hubLogged");
  if (!guest || !logged) return;
  if (!currentUser) {
    guest.style.display = "block";
    logged.style.display = "none";
    return;
  }
  guest.style.display = "none";
  logged.style.display = "block";
  const d = window.userProfile || {};
  const name = d.displayName || d.username || currentUser.email || "User";
  const av = d.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=7c3aed&color=fff&size=96`;
  const a = document.getElementById("hubAvatar");
  const n = document.getElementById("hubName");
  const h = document.getElementById("hubHandle");
  if (a) a.src = av;
  if (n) n.textContent = name;
  if (h) h.innerHTML = formatHandleHTML(d);
  const ab = document.getElementById("hubAdminBtn");
  if (ab) ab.style.display = (typeof isAdmin !== "undefined" && isAdmin) || hasPerm?.("admin") ? "inline-flex" : "none";
}

// hook auth state
const _prevOnAuth = window._xultraOnAuthExtra;
window._xultraOnAuthExtra = function() {
  try { if (typeof _prevOnAuth === "function") _prevOnAuth(); } catch (e) {}
  try { syncHubProfileCard(); } catch (e) {}
  try { refreshSecurityUI(); } catch (e) {}
};

// ===== CLIENT ENCRYPTION (chat / DM / voice text) =====
const XENC = {
  version: 1,
  async siteKey() {
    const salt = (window._siteConfig && window._siteConfig.chatSalt) || "xultra-chat-v1";
    const enc = new TextEncoder();
    const base = await crypto.subtle.digest("SHA-256", enc.encode(salt + "|xultra"));
    return crypto.subtle.importKey("raw", base, "AES-GCM", false, ["encrypt", "decrypt"]);
  },
  async dmKey(uidA, uidB) {
    const pair = [uidA, uidB].sort().join(":");
    const salt = (window._siteConfig && window._siteConfig.chatSalt) || "xultra-chat-v1";
    const enc = new TextEncoder();
    const base = await crypto.subtle.digest("SHA-256", enc.encode(salt + "|dm|" + pair));
    return crypto.subtle.importKey("raw", base, "AES-GCM", false, ["encrypt", "decrypt"]);
  },
  async encrypt(plain, key) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(String(plain)));
    const u8 = new Uint8Array(ct);
    const b64 = btoa(String.fromCharCode(...u8));
    const ivb64 = btoa(String.fromCharCode(...iv));
    return JSON.stringify({ v: XENC.version, iv: ivb64, ct: b64 });
  },
  async decrypt(payload, key) {
    try {
      const obj = typeof payload === "string" && payload.trim().startsWith("{") ? JSON.parse(payload) : null;
      if (!obj || !obj.ct || !obj.iv) return String(payload || "");
      const iv = Uint8Array.from(atob(obj.iv), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(obj.ct), c => c.charCodeAt(0));
      const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
      return new TextDecoder().decode(pt);
    } catch (e) {
      return "[message chiffré]";
    }
  },
  isEncrypted(t) {
    try { const o = JSON.parse(t); return o && o.v && o.ct && o.iv; } catch (e) { return false; }
  }
};

async function encryptPublicText(text) {
  const key = await XENC.siteKey();
  return XENC.encrypt(text, key);
}
async function decryptPublicText(text) {
  if (!XENC.isEncrypted(text)) return text;
  const key = await XENC.siteKey();
  return XENC.decrypt(text, key);
}
async function encryptDmText(text, otherUid) {
  if (!currentUser) return text;
  const key = await XENC.dmKey(currentUser.uid, otherUid);
  return XENC.encrypt(text, key);
}
async function decryptDmText(text, otherUid) {
  if (!XENC.isEncrypted(text)) return text;
  if (!currentUser) return "[Connecte-toi]";
  const key = await XENC.dmKey(currentUser.uid, otherUid);
  return XENC.decrypt(text, key);
}

// wrap sendChat if exists
(function wrapChatEncryption() {
  const _send = window.sendChat;
  if (typeof _send === "function") {
    window.sendChat = async function(e) {
      if (e && e.preventDefault) e.preventDefault();
      const input = document.getElementById("chatInput");
      if (!input || !currentUser) return _send(e);
      const raw = input.value.trim();
      if (!raw) return;
      try {
        const enc = await encryptPublicText(raw);
        input.value = enc;
        await _send(e);
        // restore empty
        input.value = "";
      } catch (err) {
        input.value = raw;
        await _send(e);
      }
    };
  }
})();

// ===== TOTP (Google Authenticator) =====
function base32Encode(buf) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bits = 0, value = 0, out = "";
  for (let i = 0; i < buf.length; i++) {
    value = (value << 8) | buf[i];
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += alphabet[(value << (5 - bits)) & 31];
  return out;
}
function base32Decode(str) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const clean = str.replace(/=+$/, "").toUpperCase().replace(/[^A-Z2-7]/g, "");
  let bits = 0, value = 0, out = [];
  for (const c of clean) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}
async function hotp(secretBytes, counter) {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(4, counter & 0xffffffff);
  const key = await crypto.subtle.importKey("raw", secretBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, buf));
  const offset = sig[sig.length - 1] & 0xf;
  const code = ((sig[offset] & 0x7f) << 24) | ((sig[offset + 1] & 0xff) << 16) | ((sig[offset + 2] & 0xff) << 8) | (sig[offset + 3] & 0xff);
  return String(code % 1000000).padStart(6, "0");
}
async function totpVerify(secretB32, code) {
  const secret = base32Decode(secretB32);
  const timestep = Math.floor(Date.now() / 1000 / 30);
  for (let w = -1; w <= 1; w++) {
    const c = await hotp(secret, timestep + w);
    if (c === String(code).padStart(6, "0")) return true;
  }
  return false;
}

window._totpPendingSecret = null;
async function startTotpSetup() {
  if (!currentUser) return;
  const bytes = crypto.getRandomValues(new Uint8Array(20));
  const secret = base32Encode(bytes);
  window._totpPendingSecret = secret;
  const label = encodeURIComponent("XULTRA:" + (currentUser.email || currentUser.uid));
  const uri = `otpauth://totp/${label}?secret=${secret}&issuer=XULTRA&digits=6&period=30`;
  document.getElementById("totpSecretCode").textContent = secret;
  document.getElementById("totpQrWrap").style.display = "block";
  document.getElementById("totpStatus").textContent = "Scanne le secret dans ton app Authenticator";
  console.log("TOTP URI", uri);
  xNotify("Secret TOTP généré — scanne-le dans ton app", { type: "ok" });
}
async function confirmTotpSetup() {
  if (!currentUser || !window._totpPendingSecret) return;
  const code = document.getElementById("totpVerifyCode")?.value.trim();
  if (!code) return alert("Entre le code à 6 chiffres");
  const ok = await totpVerify(window._totpPendingSecret, code);
  if (!ok) return alert("Code invalide, réessaie");
  await db.collection("users").doc(currentUser.uid).set({
    totpEnabled: true,
    totpSecret: window._totpPendingSecret,
    requireTotp: true
  }, { merge: true });
  if (window.userProfile) {
    window.userProfile.totpEnabled = true;
    window.userProfile.totpSecret = window._totpPendingSecret;
  }
  window._totpPendingSecret = null;
  document.getElementById("totpQrWrap").style.display = "none";
  refreshSecurityUI();
  xNotify("Google Authenticator activé", { type: "ok", title: "Sécu" });
}
async function disableTotp() {
  if (!currentUser) return;
  if (!confirm("Désactiver Authenticator ?")) return;
  await db.collection("users").doc(currentUser.uid).set({
    totpEnabled: false,
    totpSecret: null,
    requireTotp: false
  }, { merge: true });
  refreshSecurityUI();
  xNotify("Authenticator désactivé", { type: "ok" });
}

// ===== PASSKEYS (WebAuthn) =====
function bufferToBase64(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function base64ToBuffer(b64) {
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
}
async function registerPasskey() {
  if (!currentUser) return;
  if (!window.PublicKeyCredential) return alert("Passkeys non supportées sur ce navigateur");
  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = new TextEncoder().encode(currentUser.uid);
    const cred = await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: { name: "XULTRA", id: location.hostname === "localhost" ? "localhost" : location.hostname },
        user: { id: userId, name: currentUser.email || currentUser.uid, displayName: (window.userProfile && window.userProfile.displayName) || "User" },
        pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "preferred", residentKey: "preferred" },
        timeout: 60000
      }
    });
    const payload = {
      id: cred.id,
      rawId: bufferToBase64(cred.rawId),
      type: cred.type,
      createdAt: Date.now()
    };
    const prev = (window.userProfile && window.userProfile.passkeys) || [];
    prev.push(payload);
    await db.collection("users").doc(currentUser.uid).set({ passkeys: prev }, { merge: true });
    if (window.userProfile) window.userProfile.passkeys = prev;
    refreshSecurityUI();
    xNotify("Clé d’accès enregistrée (biométrie OK)", { type: "ok", title: "Passkey" });
  } catch (e) {
    alert(e.message || "Échec passkey");
  }
}
async function removePasskeys() {
  if (!currentUser) return;
  if (!confirm("Supprimer toutes les clés d’accès ?")) return;
  await db.collection("users").doc(currentUser.uid).set({ passkeys: [] }, { merge: true });
  if (window.userProfile) window.userProfile.passkeys = [];
  refreshSecurityUI();
  xNotify("Clés supprimées", { type: "ok" });
}

async function savePrivatePhone() {
  if (!currentUser) return;
  const phone = (document.getElementById("myPhonePrivate")?.value || "").trim().slice(0, 24);
  await db.collection("users").doc(currentUser.uid).set({ phonePrivate: phone }, { merge: true });
  if (window.userProfile) window.userProfile.phonePrivate = phone;
  xNotify("Numéro enregistré (privé)", { type: "ok" });
}

function refreshSecurityUI() {
  const d = window.userProfile || {};
  const st = document.getElementById("totpStatus");
  const dis = document.getElementById("totpDisableBtn");
  if (st) st.textContent = d.totpEnabled ? "Authenticator activé ✓" : "Non activé";
  if (dis) dis.style.display = d.totpEnabled ? "block" : "none";
  const pk = document.getElementById("passkeyStatus");
  if (pk) pk.textContent = (d.passkeys && d.passkeys.length) ? (d.passkeys.length + " clé(s) enregistrée(s)") : "Aucune clé enregistrée";
  const phone = document.getElementById("myPhonePrivate");
  if (phone && d.phonePrivate) phone.value = d.phonePrivate;
}

// boot hub as home
document.addEventListener("DOMContentLoaded", () => {
  try {
    if (!location.search.includes("u=")) showHome();
  } catch (e) {}
});

function openAccountSettings() {
  if (!currentUser) {
    try { openModal(false); } catch (e) {}
    return;
  }
  try {
    openProfile();
    setTimeout(() => {
      const tabBtn = document.querySelector('.ds-tab[onclick*="security"]');
      if (typeof showDsTab === "function") showDsTab("security", tabBtn || null);
      else if (tabBtn) tabBtn.click();
      try { refreshSecurityUI(); } catch (e) {}
      // scroll panel into view
      const panel = document.getElementById("ds-security");
      if (panel) panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  } catch (e) {
    console.warn("openAccountSettings", e);
  }
}


/* ===== PWA ===== */
function registerXultraSW() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").then((reg) => {
      console.log("[PWA] SW registered", reg.scope);
    }).catch((e) => console.warn("[PWA] SW fail", e));
  });
}

let _deferredPrompt = null;

function setupPwaInstall() {
  const bar = document.getElementById("pwaInstallBar");
  const btn = document.getElementById("pwaInstallBtn");
  const close = document.getElementById("pwaInstallClose");
  if (!bar) return;

  const dismissed = localStorage.getItem("xultra_pwa_dismiss") === "1";
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
    || window.navigator.standalone === true;
  if (isStandalone) {
    bar.style.display = "none";
    return;
  }

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    _deferredPrompt = e;
    if (!dismissed) bar.style.display = "block";
  });

  window.addEventListener("appinstalled", () => {
    _deferredPrompt = null;
    bar.style.display = "none";
    try { xNotify("XULTRA installé", { type: "ok", title: "App" }); } catch (e) {}
  });

  if (btn) {
    btn.addEventListener("click", async () => {
      if (_deferredPrompt) {
        _deferredPrompt.prompt();
        try {
          const choice = await _deferredPrompt.userChoice;
          if (choice.outcome === "accepted") bar.style.display = "none";
        } catch (e) {}
        _deferredPrompt = null;
      } else {
        // iOS / fallback instructions
        const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
        alert(isIOS
          ? "Sur iPhone : Partager → Sur l’écran d’accueil"
          : "Utilise le menu du navigateur → Installer l’application");
      }
    });
  }
  if (close) {
    close.addEventListener("click", () => {
      bar.style.display = "none";
      localStorage.setItem("xultra_pwa_dismiss", "1");
    });
  }

  // Show soft prompt on iOS after delay if not installed
  if (!dismissed && !isStandalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) {
    setTimeout(() => { bar.style.display = "block"; }, 4000);
  }
}

registerXultraSW();
setupPwaInstall();

// Deep links ?hub=voice|social
(function handleHubDeepLink() {
  try {
    const q = new URLSearchParams(location.search);
    const hub = q.get("hub");
    if (!hub) return;
    setTimeout(() => {
      if (hub === "voice" && typeof openVoiceHub === "function") openVoiceHub();
      else if (hub === "social" && typeof openSocialHub === "function") openSocialHub();
      else if (hub === "game" && typeof openGameHub === "function") openGameHub();
    }, 900);
  } catch (e) {}
})();


/* ===== Capacitor native bridge ===== */
(function CapacitorNativeBridge() {
  function ready(fn) {
    if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
      fn();
    } else {
      document.addEventListener("deviceready", fn, false);
      // Capacitor 3+ injects without cordova event
      setTimeout(() => {
        try {
          if (window.Capacitor && window.Capacitor.isNativePlatform()) fn();
        } catch (e) {}
      }, 300);
    }
  }
  ready(async () => {
    document.documentElement.classList.add("xultra-native");
    try {
      const { StatusBar, Style } = await import("https://cdn.jsdelivr.net/npm/@capacitor/status-bar@6/+esm").catch(() => ({}));
      // Prefer global plugin if available
    } catch (e) {}
    try {
      const Cap = window.Capacitor;
      if (Cap && Cap.Plugins) {
        if (Cap.Plugins.StatusBar) {
          Cap.Plugins.StatusBar.setStyle({ style: "DARK" });
          Cap.Plugins.StatusBar.setBackgroundColor({ color: "#0a0a0f" });
        }
        if (Cap.Plugins.SplashScreen) {
          Cap.Plugins.SplashScreen.hide();
        }
        if (Cap.Plugins.App) {
          Cap.Plugins.App.addListener("backButton", ({ canGoBack }) => {
            if (canGoBack) window.history.back();
            else Cap.Plugins.App.exitApp();
          });
        }
      }
    } catch (e) {
      console.warn("[native]", e);
    }
  });
})();
