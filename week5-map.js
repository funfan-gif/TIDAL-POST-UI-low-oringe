"use strict";

// Week 5 replaces the fixed-destination Week 4 controller while preserving its coordinate,
// waypoint, collision, persistence, reveal and confirmation contracts.
window.TidalRouteMap = { create(root, options = {}) {
  const $ = selector => root.querySelector(selector);
  const svg = $("#chart");
  const stage = $(".game-stage");
  const ns = "http://www.w3.org/2000/svg";
  const query = new URLSearchParams(location.search);
  const debug = query.get("debug") === "1";
  const storageKey = "tidalPost.prototype.route.v3";
  const port = { x: 275, y: 720 };
  const ports = {
    "blue-tide-north-pier": { id: "blue-tide-north-pier", x: 1115, y: 255, name: "蓝潮岛 · 北侧码头", ledger: "北侧码头", type: "邮务港", matches: true },
    "white-lantern-supply": { id: "white-lantern-supply", x: 385, y: 505, name: "白塔补给站", ledger: "白塔补给站", type: "灯塔补给港", matches: false },
    "east-tide-fishery": { id: "east-tide-fishery", x: 1363, y: 520, name: "东汐渔港", ledger: "东汐渔港", type: "近岸渔港", matches: false }
  };
  const safeWaypoints = [{ x: 520, y: 355 }, { x: 940, y: 315 }];
  let selectedPortId = ports[query.get("destination")] ? query.get("destination") : "blue-tide-north-pier";
  let waypoints = safeWaypoints.map(point => ({ ...point }));
  let confirmed = false;
  let lastMoved = 0;
  let drag = null;
  let result;
  let enabled = true;
  const obstacles = [...root.querySelectorAll(".obstacle")];

  const destination = () => ports[selectedPortId];
  const destinationMatches = () => destination().matches;

  function fitStage() {
    const scale = Math.min(innerWidth / 1920, innerHeight / 1080);
    stage.style.transform = `scale(${scale})`;
    stage.style.position = "absolute";
    stage.style.left = `${(innerWidth - 1920) / 2}px`;
    stage.style.top = `${(innerHeight - 1080) / 2}px`;
  }
  addEventListener("resize", fitStage);
  fitStage();

  function coordinate(point) {
    return {
      latitude: 31 + (18.4 + (820 - point.y) / 400) / 60,
      longitude: 122 + (4 + (point.x - 120) / 400) / 60
    };
  }
  function formatCoordinate(point) {
    const value = coordinate(point);
    return `31°${((value.latitude - 31) * 60).toFixed(1)}′ N   122°${((value.longitude - 122) * 60).toFixed(1)}′ E`;
  }
  function segmentData(a, b) {
    const ca = coordinate(a), cb = coordinate(b);
    const north = (cb.latitude - ca.latitude) * 60;
    const east = (cb.longitude - ca.longitude) * 60 * Math.cos((ca.latitude + cb.latitude) / 2 * Math.PI / 180);
    const bearing = (Math.atan2(east, north) * 180 / Math.PI + 360) % 360;
    return { bearing, distance: Math.hypot(north, east) };
  }
  const bearingText = degrees => `${String(Math.round(degrees) % 360).padStart(3, "0")}°`;

  function make(tag, attrs = {}, text) {
    const element = document.createElementNS(ns, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
    if (text != null) element.textContent = text;
    return element;
  }
  function collision(a, b) {
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 3));
    const hits = new Set();
    const transforms = obstacles.map(obstacle => obstacle.getCTM().inverse().multiply(svg.getCTM()));
    const point = svg.createSVGPoint();
    for (let n = 0; n <= steps; n += 1) {
      point.x = a.x + (b.x - a.x) * n / steps;
      point.y = a.y + (b.y - a.y) * n / steps;
      obstacles.forEach((obstacle, index) => {
        const local = point.matrixTransform(transforms[index]);
        if (obstacle.isPointInFill(local) || obstacle.isPointInStroke(local)) hits.add(obstacle.dataset.obstacle);
      });
    }
    return [...hits];
  }

  function persist() {
    if (query.has("state")) return;
    try { sessionStorage.setItem(storageKey, JSON.stringify({ waypoints, confirmed, selectedPortId })); } catch { }
  }
  function recompute() {
    const target = destination();
    const points = [port, ...waypoints, { x: target.x, y: target.y }];
    const segments = points.slice(0, -1).map((point, index) => {
      const data = segmentData(point, points[index + 1]);
      const hazards = collision(point, points[index + 1]);
      const tooShort = data.distance < .04;
      return { a: point, b: points[index + 1], ...data, hazards, blocked: hazards.length > 0 || tooShort, tooShort };
    });
    result = {
      valid: segments.every(segment => !segment.blocked),
      destinationMatches: destinationMatches(),
      confirmable: segments.every(segment => !segment.blocked) && destinationMatches(),
      segments,
      total: segments.reduce((sum, segment) => sum + segment.distance, 0)
    };
    if (!result.confirmable) confirmed = false;
    return result;
  }

  function renderPortStates() {
    root.querySelectorAll(".map-port").forEach(node => {
      const selected = node.dataset.portId === selectedPortId;
      const wrong = selected && !ports[node.dataset.portId].matches;
      node.classList.toggle("is-selected", selected);
      node.classList.toggle("is-wrong", wrong);
      node.setAttribute("aria-pressed", String(selected));
    });
    const target = destination();
    const coordinateNode = $("#target-coordinate");
    coordinateNode.textContent = formatCoordinate(target);
    coordinateNode.setAttribute("x", target.x > 1210 ? target.x - 224 : target.x + 28);
    coordinateNode.setAttribute("y", target.y + 51);
    coordinateNode.toggleAttribute("hidden", !result.destinationMatches);
    $("#ledger-destination").textContent = target.name;
    const check = $("#destination-check");
    check.classList.toggle("is-matched", result.destinationMatches);
    check.classList.toggle("is-mismatch", !result.destinationMatches);
    $("#destination-check-title").textContent = result.destinationMatches ? "邮址已匹配" : "邮址未匹配";
    $("#destination-check-copy").textContent = result.destinationMatches ? "当前信封与收件港一致" : "当前邮件与所选港口的邮址不同";
  }

  function render() {
    recompute();
    ["#route-underlay", "#route-segments", "#route-direction-marks", "#segment-labels", "#route-ledger"].forEach(selector => $(selector).replaceChildren());
    const activeHazards = new Set(result.segments.flatMap(segment => segment.hazards));
    root.querySelectorAll(".hazard-zone").forEach(element => element.classList.toggle("is-danger", activeHazards.has(element.id.replace("-zone", ""))));
    const names = ["旧邮局港", "W1", "W2", destination().ledger];

    result.segments.forEach((segment, index) => {
      const d = `M${segment.a.x} ${segment.a.y}L${segment.b.x} ${segment.b.y}`;
      $("#route-underlay").append(make("path", { d, class: "route-underlay" }));
      $("#route-segments").append(make("path", { d, class: `route-segment${segment.blocked ? " is-blocked" : ""}`, "data-segment": index }));
      const mark = make("g", {
        class: segment.blocked ? "route-cross" : "route-direction",
        transform: `translate(${segment.a.x + (segment.b.x - segment.a.x) * .72} ${segment.a.y + (segment.b.y - segment.a.y) * .72}) rotate(${segment.blocked ? 0 : Math.atan2(segment.b.y - segment.a.y, segment.b.x - segment.a.x) * 180 / Math.PI})`
      });
      if (segment.blocked) {
        mark.append(make("circle", { r: 12, class: "cross-paper" }));
        mark.append(make("path", { d: "M-5-5L5 5M5-5L-5 5" }));
      } else {
        mark.append(make("path", { d: "M-10-7L6 0-10 7-6 0Z" }));
      }
      $("#route-direction-marks").append(mark);

      const label = make("g", {
        class: `segment-label${segment.blocked ? " is-blocked" : ""}`,
        transform: `translate(${(segment.a.x + segment.b.x) / 2 + (index === 0 && result.valid ? 66 : 0)} ${(segment.a.y + segment.b.y) / 2 - 30})`
      });
      label.append(make("path", { d: "M-69-17L66-19 69 10-65 12Z", class: "bearing-paper" }));
      label.append(make("text", { x: 0, y: 2, "text-anchor": "middle" }, `${bearingText(segment.bearing)} / ${segment.distance.toFixed(1)} nm`));
      $("#segment-labels").append(label);

      const row = document.createElement("li");
      row.className = segment.blocked ? "is-blocked" : "";
      const labelSpan = document.createElement("span");
      const indicator = document.createElement("em");
      indicator.setAttribute("aria-hidden", "true");
      labelSpan.append(indicator, `${names[index]} → ${names[index + 1]}`);
      const values = document.createElement("b");
      values.textContent = `${bearingText(segment.bearing)} / ${segment.distance.toFixed(1)}`;
      row.append(labelSpan, values);
      $("#route-ledger").append(row);
    });

    waypoints.forEach((point, index) => {
      const element = $(`#waypoint-${index + 1}`);
      element.setAttribute("transform", `translate(${point.x} ${point.y})`);
      element.setAttribute("aria-label", `W${index + 1} 航点，${formatCoordinate(point)}，拖动或用方向键调整`);
    });
    $("#port-coordinate").textContent = formatCoordinate(port);
    $("#total-distance").textContent = result.total.toFixed(1);
    renderPortStates();

    stage.dataset.state = result.valid ? "valid" : "blocked";
    stage.dataset.confirmed = String(confirmed);
    stage.dataset.destination = selectedPortId;
    stage.dataset.destinationMatch = String(result.destinationMatches);
    $("#route-status").classList.toggle("is-blocked", !result.valid);
    $("#confirm-route").disabled = !result.confirmable;
    const buttonLabel = !result.destinationMatches ? "地址不符 · 已锁定" : !result.valid ? "航线危险 · 已锁定" : confirmed ? "航线已确认" : "确认航线";
    $("#confirm-route span").textContent = buttonLabel;

    const confirmIcon = make("svg", { viewBox: "0 0 32 32" });
    confirmIcon.append(make("path", { d: result.confirmable ? "M5 16L12 23 27 8" : "M9 13V9a7 7 0 0 1 14 0v4M6 13H26V28H6ZM16 19v4" }));
    $("#confirm-route b").replaceChildren(confirmIcon);
    const statusIcon = make("svg", { viewBox: "0 0 40 40" });
    statusIcon.append(make("path", { d: result.valid ? "M20 3a17 17 0 1 0 .1 0M10 20L17 27 30 12" : "M20 3L37 34H3ZM20 13V23" }));
    if (!result.valid) statusIcon.append(make("circle", { cx: 20, cy: 29, r: 1, fill: "currentColor" }));
    $("#status-icon").replaceChildren(statusIcon);
    $("#status-title").textContent = result.valid ? confirmed ? "航线已确认" : "航线安全" : "航线不可达";
    $("#map-warning").toggleAttribute("hidden", result.valid || !result.segments.some(segment => segment.hazards.includes("fog")));

    const blockedIndex = result.segments.findIndex(segment => segment.blocked);
    const blocked = result.segments[blockedIndex];
    let reason = "三个航段均避开低潮浅滩";
    let recovery = confirmed ? "已记入邮务，可出航或继续调整" : "航点可继续调整，确认后准备出航";
    if (blocked) {
      const prefix = `${names[blockedIndex]}—${names[blockedIndex + 1]}`;
      reason = blocked.tooShort ? `${prefix} 航段过短` : blocked.hazards.includes("coast") ? `${prefix} 穿越岛屿陆地` : blocked.hazards.includes("fog") ? `${prefix} 穿越 4m 以下浅滩` : `${prefix} 穿越旧沉船水域`;
      recovery = blocked.hazards.includes("coast") ? "将航点移回海面，绕开海岸" : blocked.tooShort ? "将重叠航点移开，留出航段距离" : `当前低潮，暗礁暴露；调整 W${lastMoved + 1} 绕行`;
    }
    $("#status-reason").textContent = reason;
    $("#recovery-copy").textContent = recovery;
    $("#confirm-hint").textContent = !result.destinationMatches ? "邮址未匹配，当前航线不可登记" : result.valid ? confirmed ? "航点或目的地改变后需要重新确认" : "确认后将航线记入本次邮务" : `拖动 W${lastMoved + 1} 绕开危险水域后可确认`;

    const fogBlocked = !result.valid && result.segments.some(segment => segment.hazards.includes("fog"));
    $("#recovery-ghost").toggleAttribute("hidden", !fogBlocked);
    if (fogBlocked) {
      const point = waypoints[lastMoved], safe = safeWaypoints[lastMoved];
      $("#recovery-ghost path").setAttribute("d", `M${point.x} ${point.y}Q${point.x - 30} ${(point.y + safe.y) / 2} ${safe.x} ${safe.y}`);
      $("#recovery-ghost circle").setAttribute("cx", safe.x);
      $("#recovery-ghost circle").setAttribute("cy", safe.y);
      const texts = $("#recovery-ghost").querySelectorAll("text");
      texts[0].setAttribute("x", safe.x); texts[0].setAttribute("y", safe.y + 7); texts[0].textContent = `W${lastMoved + 1}`;
      texts[1].setAttribute("x", safe.x - 50); texts[1].setAttribute("y", safe.y - 40); texts[1].textContent = "绕回安全水域";
    }
    if (debug) $("#debug-panel").textContent = JSON.stringify({ selectedPortId, destinationMatches: result.destinationMatches, waypoints, valid: result.valid, confirmable: result.confirmable, total: result.total, hazards: result.segments.map(segment => segment.hazards) });
    persist();
    options.onChange?.(structuredClone({ start: port, destination: { ...destination() }, waypoints, confirmed, ...result }));
  }

  function invalidateConfirmation() {
    confirmed = false;
    try { sessionStorage.removeItem("tidalPost.plannedRoute"); } catch { }
  }
  function moveWaypoint(index, point) {
    if (!Number.isFinite(point.x) || !Number.isFinite(point.y)) return;
    lastMoved = index;
    waypoints[index] = { x: Math.max(100, Math.min(1380, point.x)), y: Math.max(180, Math.min(850, point.y)) };
    invalidateConfirmation();
    $("#confirmation").close();
    render();
  }
  function mapPoint(event) {
    return new DOMPoint(event.clientX, event.clientY).matrixTransform(svg.getScreenCTM().inverse());
  }
  root.querySelectorAll(".waypoint").forEach((node, index) => {
    node.addEventListener("pointerdown", event => {
      if (!enabled || event.button !== 0) return;
      event.preventDefault();
      const point = mapPoint(event);
      drag = { index, id: event.pointerId, offsetX: point.x - waypoints[index].x, offsetY: point.y - waypoints[index].y };
      node.classList.add("is-dragging");
      node.focus({ preventScroll: true });
      svg.setPointerCapture(event.pointerId);
    });
    node.addEventListener("keydown", event => {
      if (!enabled) return;
      const delta = event.shiftKey ? 24 : 8;
      const direction = { ArrowLeft: [-delta, 0], ArrowRight: [delta, 0], ArrowUp: [0, -delta], ArrowDown: [0, delta] }[event.key];
      if (direction) {
        event.preventDefault();
        moveWaypoint(index, { x: waypoints[index].x + direction[0], y: waypoints[index].y + direction[1] });
      }
    });
  });
  svg.addEventListener("pointermove", event => {
    if (!drag || drag.id !== event.pointerId) return;
    const point = mapPoint(event);
    moveWaypoint(drag.index, { x: point.x - drag.offsetX, y: point.y - drag.offsetY });
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

  function selectDestination(id, { animate = true } = {}) {
    if (!enabled || !ports[id] || id === selectedPortId) return;
    selectedPortId = id;
    invalidateConfirmation();
    $("#confirmation").close();
    render();
    const node = root.querySelector(`[data-port-id="${CSS.escape(id)}"]`);
    if (animate && node && !ports[id].matches) {
      node.classList.remove("is-wrong-pulse");
      void node.getBoundingClientRect();
      node.classList.add("is-wrong-pulse");
      setTimeout(() => node.classList.remove("is-wrong-pulse"), 430);
    }
  }
  root.querySelectorAll(".map-port").forEach(node => {
    node.addEventListener("click", () => selectDestination(node.dataset.portId));
    node.addEventListener("keydown", event => {
      if (!["Enter", " "].includes(event.key)) return;
      event.preventDefault();
      selectDestination(node.dataset.portId);
    });
  });

  function resetRoute({ discardSaved = false } = {}) {
    waypoints = safeWaypoints.map(point => ({ ...point }));
    selectedPortId = "blue-tide-north-pier";
    confirmed = false;
    lastMoved = 0;
    try {
      sessionStorage.removeItem("tidalPost.plannedRoute");
      if (discardSaved) sessionStorage.removeItem(storageKey);
    } catch { }
    $("#confirmation").close();
    if (!root.hidden) render();
  }
  $("#reset-route").addEventListener("click", () => { if (enabled) resetRoute(); });
  $("#confirm-route").addEventListener("click", () => {
    if (!enabled || !recompute().confirmable) return;
    confirmed = true;
    const target = destination();
    const plannedRoute = {
      commission: "TP-042",
      destination: target.id,
      destinationName: target.name,
      destinationMatches: true,
      waypoints: waypoints.map(point => ({ ...point, ...coordinate(point) })),
      segments: result.segments.map(segment => ({ bearing: segment.bearing, distance: segment.distance })),
      totalDistance: result.total,
      confirmed: true
    };
    try { sessionStorage.setItem("tidalPost.plannedRoute", JSON.stringify(plannedRoute)); } catch { }
    document.dispatchEvent(new CustomEvent("tidalpost:route-confirmed", { detail: plannedRoute }));
    render();
    $("#confirmed-distance").textContent = `本次航程 ${result.total.toFixed(1)} nm · 潮汐窗口 06:40—07:20`;
    $("#confirmation").showModal();
  });

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
      if (saved?.waypoints?.length === 2 && saved.waypoints.every(point => Number.isFinite(point.x) && Number.isFinite(point.y))) waypoints = saved.waypoints;
      if (ports[saved?.selectedPortId]) selectedPortId = saved.selectedPortId;
      confirmed = saved?.confirmed === true;
    } catch { }
  }
  if (debug) {
    $("#debug-panel").hidden = false;
    $("#debug-geometry").removeAttribute("hidden");
    obstacles.forEach(obstacle => {
      const clone = obstacle.cloneNode();
      clone.removeAttribute("id"); clone.removeAttribute("class");
      const matrix = svg.getCTM().inverse().multiply(obstacle.getCTM());
      clone.setAttribute("transform", `matrix(${matrix.a} ${matrix.b} ${matrix.c} ${matrix.d} ${matrix.e} ${matrix.f})`);
      $("#debug-geometry").append(clone);
    });
  }
  render();

  window.__tidalRoute = {
    getState: () => structuredClone({ selectedPortId, destination: destination(), destinationMatches: result.destinationMatches, waypoints, confirmed, ...result }),
    coordinate,
    formatCoordinate,
    selectDestination
  };
  return {
    getState: window.__tidalRoute.getState,
    refresh() { fitStage(); render(); },
    setEnabled(value) { enabled = Boolean(value); stage.inert = !enabled; },
    reset: resetRoute,
    invalidateConfirmation() { invalidateConfirmation(); if (!root.hidden) render(); else persist(); },
    closeConfirmation() { $("#confirmation").close(); },
    selectDestination
  };
} };
