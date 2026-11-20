(function () {
  "use strict";

  const SECTIONS = window.GARDEN_SECTIONS || [];
  const PHOTO_DIR = "images/plants/";
  const SVG_NS = "http://www.w3.org/2000/svg";
  const PEEK_MAX = 8;

  const $ = (id) => document.getElementById(id);
  const sectionById = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));
  const canHover = window.matchMedia("(hover: hover)").matches;

  let plants = [];
  let pinned = null;

  const LEAF_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/></svg>';

  // ---------- CSV ----------
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else field += c;
      } else if (c === '"') quoted = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
    }
    if (field || row.length) { row.push(field); rows.push(row); }
    const header = rows.shift().map((h) => h.trim());
    return rows
      .filter((r) => r.some((v) => v.trim()))
      .map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] || "").trim()])));
  }

  function toPlant(row) {
    return {
      section: row.section,
      name: row.common_name || "Unnamed plant",
      botanical: row.botanical_name || "",
      notes: row.notes || "",
      photos: (row.photos || "").split(";").map((p) => p.trim()).filter(Boolean)
    };
  }

  const plantsIn = (id) => plants.filter((p) => p.section === id);

  // ---------- Map ----------
  function centroid(points) {
    const pts = points.trim().split(/\s+/).map((p) => p.split(",").map(Number));
    return [
      pts.reduce((a, p) => a + p[0], 0) / pts.length,
      pts.reduce((a, p) => a + p[1], 0) / pts.length
    ];
  }

  function drawSections() {
    const g = $("sections");
    SECTIONS.forEach((s) => {
      const poly = document.createElementNS(SVG_NS, "polygon");
      poly.setAttribute("points", s.points);
      poly.setAttribute("class", "section-shape");
      poly.setAttribute("tabindex", "0");
      poly.setAttribute("role", "button");
      poly.setAttribute("aria-label", s.name);
      poly.dataset.id = s.id;
      g.appendChild(poly);

      const [cx, cy] = centroid(s.points);
      s.cx = cx;
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", cx);
      label.setAttribute("y", cy);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("class", "section-label");
      label.textContent = s.name;
      g.appendChild(label);

      poly.addEventListener("click", () => pin(s.id, true));
      poly.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(s.id, true); }
      });
      if (canHover) {
        poly.addEventListener("mouseenter", () => { highlight(s.id); peek(s.id); });
        poly.addEventListener("mouseleave", () => { highlight(pinned); peek(null); });
      }
    });
  }

  function drawPills() {
    const nav = $("pills");
    nav.innerHTML = "";
    SECTIONS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "pill";
      btn.dataset.id = s.id;
      btn.textContent = s.name;
      const n = plantsIn(s.id).length;
      if (n) {
        const c = document.createElement("span");
        c.className = "count";
        c.textContent = n;
        btn.appendChild(c);
      }
      btn.addEventListener("click", () => pin(s.id, false));
      nav.appendChild(btn);
    });
    highlight(pinned);
  }

  function highlight(id) {
    document.querySelectorAll(".section-shape, .pill").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });
  }

  // Hover preview: quick list of plant names on the map itself
  function peek(id) {
    const box = $("peek");
    const s = id && sectionById[id];
    if (!s) { box.hidden = true; return; }
    const list = plantsIn(id);
    $("peek-title").textContent = s.name;
    const ul = $("peek-list");
    ul.innerHTML = "";
    list.slice(0, PEEK_MAX).forEach((p) => {
      const li = document.createElement("li");
      li.textContent = p.name;
      ul.appendChild(li);
    });
    if (!list.length) {
      const li = document.createElement("li");
      li.textContent = "No plants listed yet";
      ul.appendChild(li);
    }
    $("peek-more").textContent =
      list.length > PEEK_MAX ? `+ ${list.length - PEEK_MAX} more · click to see all` : "Click to see photos";
    box.classList.toggle("left", s.cx >= 320);
    box.classList.toggle("right", s.cx < 320);
    box.hidden = false;
  }

  function pin(id, fromMap) {
    pinned = id;
    highlight(id);
    peek(null);
    showArea(id);
    if (fromMap || window.innerWidth <= 860) {
      $("area").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- Selected area ----------
  function showArea(id) {
    const s = id && sectionById[id];
    $("area-empty").hidden = !!s;
    $("area-body").hidden = !s;
    if (!s) return;
    $("area-title").textContent = s.name;
    $("area-blurb").textContent = s.blurb || "";
    const cards = $("cards");
    cards.innerHTML = "";
    const list = plantsIn(id);
    if (!list.length) {
      const li = document.createElement("li");
      li.className = "empty-note";
      li.textContent = "No plants listed here yet.";
      cards.appendChild(li);
      return;
    }
    list.forEach((p) => cards.appendChild(card(p)));
  }

  function card(p) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "card";
    const photo = document.createElement("span");
    photo.className = "card-photo";
    if (p.photos.length) {
      const img = document.createElement("img");
      img.loading = "lazy";
      img.alt = "";
      img.src = PHOTO_DIR + "thumbs/" + p.photos[0];
      img.onerror = () => { img.onerror = null; img.src = PHOTO_DIR + p.photos[0]; };
      photo.appendChild(img);
    } else {
      photo.innerHTML = LEAF_SVG;
    }
    const name = document.createElement("span");
    name.className = "card-name";
    name.textContent = p.name;
    const bot = document.createElement("span");
    bot.className = "card-botanical";
    bot.textContent = p.botanical;
    const text = document.createElement("span");
    text.append(name, bot);
    btn.append(photo, text);
    btn.addEventListener("click", () => openViewer(p));
    li.appendChild(btn);
    return li;
  }

  // ---------- A to Z ----------
  function drawAZ() {
    const az = $("az");
    az.innerHTML = "";
    [...plants]
      .sort((a, b) => a.name.localeCompare(b.name))
      .forEach((p) => {
        const li = document.createElement("li");
        const btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = p.name;
        btn.addEventListener("click", () => openViewer(p));
        const where = document.createElement("span");
        where.className = "where";
        const s = sectionById[p.section];
        where.textContent = s ? ` · ${s.name}` : "";
        li.append(btn, where);
        az.appendChild(li);
      });
  }

  // ---------- Photo viewer ----------
  const viewer = $("viewer");
  let current = null, index = 0;

  function openViewer(p) {
    current = p; index = 0;
    $("viewer-title").textContent = p.name;
    $("viewer-botanical").textContent = p.botanical;
    $("viewer-notes").textContent = p.notes;
    renderPhoto();
    if (typeof viewer.showModal === "function") viewer.showModal();
    else viewer.setAttribute("open", "");
  }

  function renderPhoto() {
    const stage = $("viewer-stage");
    const n = current.photos.length;
    stage.innerHTML = "";
    if (!n) {
      stage.innerHTML = `<div class="placeholder">${LEAF_SVG}<p>Photo coming soon</p></div>`;
    } else {
      const img = document.createElement("img");
      img.src = PHOTO_DIR + current.photos[index];
      img.alt = `${current.name}, photo ${index + 1} of ${n}`;
      stage.appendChild(img);
    }
    document.querySelector(".viewer-nav").hidden = n < 2;
    $("viewer-count").textContent = n ? `${index + 1} / ${n}` : "";
    $("viewer-prev").disabled = index <= 0;
    $("viewer-next").disabled = index >= n - 1;
  }

  function step(d) {
    if (!current) return;
    const next = index + d;
    if (next < 0 || next >= current.photos.length) return;
    index = next;
    renderPhoto();
  }

  $("viewer-prev").addEventListener("click", () => step(-1));
  $("viewer-next").addEventListener("click", () => step(1));
  $("viewer-close").addEventListener("click", () => viewer.close());
  viewer.addEventListener("click", (e) => { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });
  let touchX = null;
  $("viewer-stage").addEventListener("touchstart", (e) => { touchX = e.touches[0].clientX; }, { passive: true });
  $("viewer-stage").addEventListener("touchend", (e) => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchX = null;
  });

  // ---------- Start ----------
  drawSections();
  drawPills();
  fetch("data/plants.csv", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((text) => {
      plants = parseCSV(text).map(toPlant);
      drawPills();
      drawAZ();
      showArea(pinned);
    })
    .catch(() => {
      $("area-empty").innerHTML =
        "<h2>Plant list not found</h2><p>Check that data/plants.csv is uploaded with the site.</p>";
    });
})();
