(function () {
  "use strict";

  const SECTIONS = window.GARDEN_SECTIONS || [];
  const PHOTO_DIR = "images/plants/";
  const SVG_NS = "http://www.w3.org/2000/svg";

  const $ = (id) => document.getElementById(id);
  const sectionById = Object.fromEntries(SECTIONS.map((s) => [s.id, s]));

  let plants = [];
  let pinned = null; // section chosen by click/tap
  const canHover = window.matchMedia("(hover: hover)").matches;

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

  // ---------- Map ----------
  function centroid(points) {
    const pts = points.trim().split(/\s+/).map((p) => p.split(",").map(Number));
    const x = pts.reduce((a, p) => a + p[0], 0) / pts.length;
    const y = pts.reduce((a, p) => a + p[1], 0) / pts.length;
    return [x, y];
  }

  function drawSections() {
    const g = $("sections");
    const legend = $("legend");
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
      const label = document.createElementNS(SVG_NS, "text");
      label.setAttribute("x", cx);
      label.setAttribute("y", cy);
      label.setAttribute("text-anchor", "middle");
      label.setAttribute("dominant-baseline", "middle");
      label.setAttribute("class", "section-label");
      label.textContent = s.name;
      g.appendChild(label);

      poly.addEventListener("click", () => pin(s.id));
      poly.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pin(s.id); }
      });
      if (canHover) {
        poly.addEventListener("mouseenter", () => show(s.id));
        poly.addEventListener("mouseleave", () => show(pinned));
      }

      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = s.name;
      btn.dataset.id = s.id;
      btn.addEventListener("click", () => pin(s.id));
      li.appendChild(btn);
      legend.appendChild(li);
    });
  }

  function pin(id) {
    pinned = id;
    show(id);
    if (!canHover && window.innerWidth <= 820) {
      $("panel").scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  // ---------- Panel ----------
  function show(id) {
    document.querySelectorAll(".section-shape, .legend button").forEach((el) => {
      el.classList.toggle("active", el.dataset.id === id);
    });
    const s = id && sectionById[id];
    $("panel-empty").hidden = !!s;
    $("panel-body").hidden = !s;
    if (!s) return;

    $("panel-title").textContent = s.name;
    $("panel-blurb").textContent = s.blurb || "";
    const list = $("plant-list");
    list.innerHTML = "";
    const inSection = plants.filter((p) => p.section === id);
    if (!inSection.length) {
      const li = document.createElement("li");
      li.className = "panel-blurb";
      li.textContent = "No plants listed here yet.";
      list.appendChild(li);
      return;
    }
    inSection.forEach((p) => list.appendChild(plantRow(p)));
  }

  function plantRow(p) {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "plant-btn";
    btn.innerHTML =
      thumbHTML(p) +
      '<span><span class="plant-name"></span><span class="plant-botanical"></span></span>' +
      '<span class="plant-count"></span>';
    btn.querySelector(".plant-name").textContent = p.name;
    btn.querySelector(".plant-botanical").textContent = p.botanical;
    btn.querySelector(".plant-count").textContent =
      p.photos.length ? `${p.photos.length} photo${p.photos.length > 1 ? "s" : ""}` : "photo soon";
    btn.addEventListener("click", () => openViewer(p));
    li.appendChild(btn);
    return li;
  }

  const LEAF_SVG =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">' +
    '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14z"/><path d="M5 19l8-8"/></svg>';

  function thumbHTML(p) {
    if (p.photos.length) {
      return `<img class="thumb" loading="lazy" alt="" src="${encodeURI(PHOTO_DIR + "thumbs/" + p.photos[0])}" onerror="this.onerror=null;this.src='${encodeURI(PHOTO_DIR + p.photos[0])}'">`;
    }
    return `<span class="thumb placeholder">${LEAF_SVG}</span>`;
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
    if (!n) {
      stage.innerHTML = `<div class="placeholder">${LEAF_SVG}<p>Photo coming soon</p></div>`;
    } else {
      const img = document.createElement("img");
      img.src = PHOTO_DIR + current.photos[index];
      img.alt = `${current.name}, photo ${index + 1} of ${n}`;
      stage.innerHTML = "";
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
  fetch("data/plants.csv", { cache: "no-cache" })
    .then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); })
    .then((text) => {
      plants = parseCSV(text).map(toPlant);
      drawAZ();
      show(pinned);
    })
    .catch(() => {
      $("panel-empty").innerHTML =
        "<h2>Plant list not found</h2><p>Check that data/plants.csv is uploaded with the site.</p>";
    });
})();
