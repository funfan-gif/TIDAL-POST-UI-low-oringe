"use strict";

// All geometry is in chart units. Projection and nautical distance share one scale.
window.TidalRouteMap = { create(root, options = {}) {
  const $ = (selector) => root.querySelector(selector);
  const svg = $("#chart");
  const stage = $(".game-stage");
  const ns = "http://www.w3.org/2000/svg";
  const query = new URLSearchParams(location.search);
  const debug = query.get("debug") === "1";
  const storageKey = "tidalPost.prototype.route.v1";
  const port = { x: 275, y: 720 };
  const destination = { x: 1115, y: 255 };
  const safeWaypoints = [{ x: 520, y: 355 }, { x: 940, y: 315 }];
  let waypoints = safeWaypoints.map(p => ({ ...p }));
  let confirmed = false;
  let lastMoved = 0;
  let drag = null;
  let result;
  let enabled = true;
  const obstacles = [...root.querySelectorAll(".obstacle")];
  const names = ["旧邮局港", "W1", "W2", "北侧码头"];

  function fitStage() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `scale(${scale})`;
    // Center a reference-resolution game viewport with letterboxing on other ratios.
    stage.style.position = "absolute";
    stage.style.left = `${(innerWidth - 1920) / 2}px`;
    stage.style.top = `${(innerHeight - 1080) / 2}px`;
  }
  addEventListener("resize", fitStage);
  fitStage();

  function coordinate(p) {
    return { latitude: 31 + (18.4 + (820 - p.y) / 400) / 60, longitude: 122 + (4 + (p.x - 120) / 400) / 60 };
  }
  function formatCoordinate(p) {
    const c = coordinate(p);
    return `31°${((c.latitude - 31) * 60).toFixed(1)}′ N   122°${((c.longitude - 122) * 60).toFixed(1)}′ E`;
  }
  function segmentData(a, b) {
    const ca = coordinate(a), cb = coordinate(b);
    const north = (cb.latitude - ca.latitude) * 60;
    const east = (cb.longitude - ca.longitude) * 60 * Math.cos((ca.latitude + cb.latitude) / 2 * Math.PI / 180);
    const bearing = (Math.atan2(east, north) * 180 / Math.PI + 360) % 360;
    return { bearing, distance: Math.hypot(north, east) };
  }
  const bearingText = degrees => `${String(Math.round(degrees) % 360).padStart(3, "0")}°`;

  function make(tag, attrs, text) {
    const el = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => el.setAttribute(key, value));
    if (text != null) el.textContent = text;
    return el;
  }
  function collision(a, b) {
    // Sample every <= 3 units along a segment against the SVG's rendered fill.
    // Art Pass 03 visual assets are separate from the preserved SVG collision proxies.
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    const hits = new Set();
    const transforms = obstacles.map(obstacle => obstacle.getCTM().inverse().multiply(svg.getCTM()));
    const point = svg.createSVGPoint();
    for (let n = 0; n <= steps; n++) {
      point.x = a.x + (b.x - a.x) * n / steps;
      point.y = a.y + (b.y - a.y) * n / steps;
      for (let i = 0; i < obstacles.length; i++) {
        const obstacle = obstacles[i];
        const local = point.matrixTransform(transforms[i]);
        if (obstacle.isPointInFill(local) || obstacle.isPointInStroke(local)) hits.add(obstacle.dataset.obstacle);
      }
    }
    return [...hits];
  }

  function persist() {
    // Preset captures are deterministic and never replace the player's saved route.
    if (query.has("state")) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ waypoints, confirmed })); } catch { /* file:// or restricted storage */ }
  }
  function recompute() {
    const points = [port, ...waypoints, destination];
    const segments = points.slice(0, -1).map((p, i) => {
      const data = segmentData(p, points[i + 1]);
      const hazards = collision(p, points[i + 1]);
      const tooShort = data.distance < .04;
      return { a: p, b: points[i + 1], ...data, hazards, blocked: hazards.length > 0 || tooShort, tooShort };
    });
    result = { valid: segments.every(s => !s.blocked), segments, total: segments.reduce((sum, s) => sum + s.distance, 0) };
    if (!result.valid) confirmed = false;
    return result;
  }
  function render() {
    recompute();
    $("#route-underlay").replaceChildren();
    $("#route-segments").replaceChildren();
    $("#route-direction-marks").replaceChildren();
    $("#segment-labels").replaceChildren();
    $("#route-ledger").replaceChildren();
    const activeHazards = new Set(result.segments.flatMap(s => s.hazards));
    root.querySelectorAll(".hazard-zone").forEach(el => el.classList.toggle("is-danger", activeHazards.has(el.id.replace("-zone", ""))));
    result.segments.forEach((s, i) => {
      const d = `M${s.a.x} ${s.a.y}L${s.b.x} ${s.b.y}`;
      $("#route-underlay").append(make("path", { d, class: "route-underlay" }));
      $("#route-segments").append(make("path", { d, class: `route-segment${s.blocked ? " is-blocked" : ""}`, "data-segment": i }));
      // Visual-only directional ink / crossed navigation mark. Segment geometry is unchanged.
      const mark = make("g", { class: s.blocked ? "route-cross" : "route-direction", transform: `translate(${s.a.x + (s.b.x - s.a.x) * .72} ${s.a.y + (s.b.y - s.a.y) * .72}) rotate(${s.blocked ? 0 : Math.atan2(s.b.y - s.a.y, s.b.x - s.a.x) * 180 / Math.PI})` });
      if (s.blocked) {
        mark.append(make("circle", { r: 12, class: "cross-paper" }));
        mark.append(make("path", { d: "M-5-5L5 5M5-5L-5 5" }));
      } else mark.append(make("path", { d: "M-10-7L6 0-10 7-6 0Z" }));
      $("#route-direction-marks").append(mark);
      // Place data beside each segment; full detail stays in the ledger.
      const label = make("g", { class: `segment-label${s.blocked ? " is-blocked" : ""}`, transform: `translate(${(s.a.x + s.b.x) / 2 + (i === 0 && result.valid ? 66 : 0)} ${(s.a.y + s.b.y) / 2 - 30})` });
      label.append(make("path", { d: "M-69-17L66-19 69 10-65 12Z", class: "bearing-paper" }));
      label.append(make("text", { x: 0, y: 2, "text-anchor": "middle" }, `${bearingText(s.bearing)} / ${s.distance.toFixed(1)} nm`));
      $("#segment-labels").append(label);
      const row = document.createElement("li");
      row.className = s.blocked ? "is-blocked" : "";
      const labelSpan = document.createElement("span");
      const indicator = document.createElement("em");
      indicator.setAttribute("aria-hidden", "true");
      labelSpan.append(indicator, `${names[i]} → ${names[i + 1]}`);
      const values = document.createElement("b");
      values.textContent = `${bearingText(s.bearing)} / ${s.distance.toFixed(1)}`;
      row.append(labelSpan, values);
      $("#route-ledger").append(row);
    });
    waypoints.forEach((p, i) => {
      const el = $(`#waypoint-${i + 1}`);
      el.setAttribute("transform", `translate(${p.x} ${p.y})`);
      el.setAttribute("aria-label", `W${i + 1} 航点，${formatCoordinate(p)}，拖动或用方向键调整`);
    });
    $("#port-coordinate").textContent = formatCoordinate(port);
    $("#target-coordinate").textContent = formatCoordinate(destination);
    $("#total-distance").textContent = result.total.toFixed(1);
    stage.dataset.state = result.valid ? "valid" : "blocked";
    stage.dataset.confirmed = String(confirmed);
    $("#route-status").classList.toggle("is-blocked", !result.valid);
    $("#confirm-route").disabled = !result.valid;
    $("#confirm-route span").textContent = result.valid ? confirmed ? "航线已确认" : "确认航线" : "确认航线 · 已锁定";
    // Purpose-drawn SVG marks replace font-dependent glyphs, keeping redundant state cues.
    const confirmIcon = make("svg", { viewBox: "0 0 32 32" });
    confirmIcon.append(make("path", { d: result.valid ? "M5 16L12 23 27 8" : "M9 13V9a7 7 0 0 1 14 0v4M6 13H26V28H6ZM16 19v4" }));
    $("#confirm-route b").replaceChildren(confirmIcon);
    const statusIcon = make("svg", { viewBox: "0 0 40 40" });
    statusIcon.append(make("path", { d: result.valid ? "M20 3a17 17 0 1 0 .1 0M10 20L17 27 30 12" : "M20 3L37 34H3ZM20 13V23" }));
    if (!result.valid) statusIcon.append(make("circle", { cx: 20, cy: 29, r: 1, fill: "currentColor" }));
    $("#status-icon").replaceChildren(statusIcon);
    $("#status-title").textContent = result.valid ? confirmed ? "航线已确认" : "航线安全" : "航线不可达";
    $("#map-warning").toggleAttribute("hidden", result.valid || !result.segments.some(s => s.hazards.includes("fog")));
    const blockedIndex = result.segments.findIndex(s => s.blocked);
    const blocked = result.segments[blockedIndex];
    let reason = "三个航段均避开低潮浅滩";
    let recovery = confirmed ? "已记入邮务，可出航或继续调整" : "航点可继续调整，确认后准备出航";
    if (blocked) {
      const prefix = `${names[blockedIndex]}—${names[blockedIndex + 1]}`;
      reason = blocked.tooShort ? `${prefix} 航段过短，请分开航点` : blocked.hazards.includes("coast") ? `${prefix} 穿越岛屿陆地` : blocked.hazards.includes("fog") ? `${prefix} 穿越 4m 以下浅滩` : `${prefix} 穿越旧沉船礁`;
      recovery = blocked.hazards.includes("coast") ? "将航点移回海面，绕开海岸" : blocked.tooShort ? "将重叠航点移开，留出航段距离" : `当前低潮，暗礁暴露；移动 W${lastMoved + 1} 至北航道`;
    }
    $("#status-reason").textContent = reason;
    $("#recovery-copy").textContent = recovery;
    $("#confirm-hint").textContent = result.valid ? confirmed ? "航点调整后需要重新确认" : "确认后将航线记入本次邮务" : `拖动 W${lastMoved + 1} 绕过北侧航道后可确认`;
    const fogBlocked = !result.valid && result.segments.some(s => s.hazards.includes("fog"));
    $("#recovery-ghost").toggleAttribute("hidden", !fogBlocked);
    if (fogBlocked) {
      const p = waypoints[lastMoved], safe = safeWaypoints[lastMoved];
      $("#recovery-ghost path").setAttribute("d", `M${p.x} ${p.y}Q${p.x - 30} ${(p.y + safe.y) / 2} ${safe.x} ${safe.y}`);
      $("#recovery-ghost circle").setAttribute("cx", safe.x);
      $("#recovery-ghost circle").setAttribute("cy", safe.y);
      const texts = $("#recovery-ghost").querySelectorAll("text");
      texts[0].setAttribute("x", safe.x); texts[0].setAttribute("y", safe.y + 7); texts[0].textContent = `W${lastMoved + 1}`;
      texts[1].setAttribute("x", safe.x - 50); texts[1].setAttribute("y", safe.y - 40);
    }
    if (debug) $("#debug-panel").textContent = JSON.stringify({ waypoints, valid: result.valid, total: result.total, hazards: result.segments.map(s => s.hazards) });
    persist();
    options.onChange?.(structuredClone({ start: port, destination, waypoints, confirmed, ...result }));
  }
  function moveWaypoint(index, p) {
    if (!Number.isFinite(p.x) || !Number.isFinite(p.y)) return;
    lastMoved = index;
    waypoints[index] = { x: Math.max(100, Math.min(1300, p.x)), y: Math.max(200, Math.min(840, p.y)) };
    confirmed = false;
    try { sessionStorage.removeItem("tidalPost.plannedRoute"); } catch { /* restricted storage */ }
    $("#confirmation").close();
    render();
  }
  function mapPoint(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  }
  root.querySelectorAll(".waypoint").forEach((node, i) => {
    node.addEventListener("pointerdown", event => {
      if (!enabled || event.button !== 0) return;
      event.preventDefault();
      const p = mapPoint(event);
      drag = { index: i, id: event.pointerId, offsetX: p.x - waypoints[i].x, offsetY: p.y - waypoints[i].y };
      node.classList.add("is-dragging");
      node.focus({ preventScroll: true });
      svg.setPointerCapture(event.pointerId);
    });
    node.addEventListener("keydown", event => {
      if (!enabled) return;
      const delta = event.shiftKey ? 24 : 8;
      const direction = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[event.key];
      if (direction) { event.preventDefault(); moveWaypoint(i, { x: waypoints[i].x + direction[0], y: waypoints[i].y + direction[1] }); }
    });
  });
  svg.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const p = mapPoint(event);
    moveWaypoint(drag.index, { x: p.x - drag.offsetX, y: p.y - drag.offsetY });
  });
  function stopDrag(event) {
    if (!drag || event.pointerId !== drag.id) return;
    $(`#waypoint-${drag.index + 1}`).classList.remove("is-dragging");
    if (svg.hasPointerCapture(drag.id)) svg.releasePointerCapture(drag.id);
    drag = null;
  }
  svg.addEventListener("pointerup", stopDrag);
  svg.addEventListener("pointercancel", stopDrag);
  svg.addEventListener("lostpointercapture", stopDrag);
  function resetRoute({ discardSaved = false } = {}) {
    waypoints = safeWaypoints.map(p => ({ ...p })); confirmed = false; lastMoved = 0;
    try { sessionStorage.removeItem("tidalPost.plannedRoute"); if (discardSaved) sessionStorage.removeItem(storageKey); } catch { }
    $("#confirmation").close();
    if (!root.hidden) render();
  }
  $("#reset-route").addEventListener("click", () => { if (enabled) resetRoute(); });
  $("#confirm-route").addEventListener("click", () => {
    if (!enabled || !recompute().valid) return;
    confirmed = true;
    const plannedRoute = { commission: "TP-042", destination: "blue-tide-north-pier", waypoints: waypoints.map(p => ({ ...p, ...coordinate(p) })), segments: result.segments.map(s => ({ bearing: s.bearing, distance: s.distance })), totalDistance: result.total, confirmed: true };
    try { sessionStorage.setItem("tidalPost.plannedRoute", JSON.stringify(plannedRoute)); } catch { /* restricted storage */ }
    document.dispatchEvent(new CustomEvent("tidalpost:route-confirmed", { detail: plannedRoute }));
    render();
    $("#confirmed-distance").textContent = `本次航程 ${result.total.toFixed(1)} nm · 潮汐窗口 06:40—07:20`;
    $("#confirmation").showModal();
  });

  // Grid: 0.5 fictional arc-minute per 200 chart units.
  for (let x = 120; x <= 1320; x += 200) {
    $("#grid").append(make("path", { d: `M${x} 168V850` }));
    $("#grid-labels").append(make("text", { x, y: 861, "text-anchor": "middle" }, `122°${(4 + (x - 120) / 400).toFixed(1)}′ E`));
  }
  for (let y = 220; y <= 820; y += 200) {
    $("#grid").append(make("path", { d: `M55 ${y}H1345` }));
    $("#grid-labels").append(make("text", { x: 26, y, transform: `rotate(-90 26 ${y})`, "text-anchor": "middle" }, `31°${(18.4 + (820 - y) / 400).toFixed(1)}′ N`));
  }
  if (query.get("state") === "blocked") waypoints[0] = { x: 485, y: 665 };
  else if (!query.has("state")) {
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey));
      if (saved?.waypoints?.length === 2 && saved.waypoints.every(p => Number.isFinite(p.x) && Number.isFinite(p.y) && p.x >= 100 && p.x <= 1300 && p.y >= 200 && p.y <= 840)) {
        waypoints = saved.waypoints; confirmed = saved.confirmed === true;
      }
    } catch { /* missing or incompatible saved route */ }
  }
  if (debug) {
    $("#debug-panel").hidden = false;
    $("#debug-geometry").removeAttribute("hidden");
    obstacles.forEach(obstacle => { const clone = obstacle.cloneNode(); clone.removeAttribute("id"); clone.removeAttribute("class"); const m = svg.getCTM().inverse().multiply(obstacle.getCTM()); clone.setAttribute("transform", `matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})`); $("#debug-geometry").append(clone); });
  }
  render();
  // Read-only QA surface; gameplay uses pointer/keyboard events, not this API.
  window.__tidalRoute = { getState: () => structuredClone({ waypoints, confirmed, ...result }), coordinate, formatCoordinate };
  return {
    getState: window.__tidalRoute.getState,
    refresh() { fitStage(); render(); },
    setEnabled(value) { enabled = Boolean(value); stage.inert = !enabled; },
    reset: resetRoute,
    invalidateConfirmation() { confirmed = false; try { sessionStorage.removeItem("tidalPost.plannedRoute"); } catch {} if (!root.hidden) render(); else persist(); },
    closeConfirmation() { $("#confirmation").close(); }
  };
} };
