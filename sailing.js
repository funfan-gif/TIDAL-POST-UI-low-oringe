"use strict";

(function exposeSailing() {
  const TAU = Math.PI * 2;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const wrapAngle = (angle) => {
    let next = angle % TAU;
    if (next > Math.PI) next -= TAU;
    if (next < -Math.PI) next += TAU;
    return next;
  };

  function createSailingController(options = {}) {
    const canvas = document.querySelector(options.canvas || "#sailingCanvas");
    if (!canvas) return null;

    const context = canvas.getContext("2d");
    const target = { x: 830, y: 150 };
    const start = { x: 122, y: 392 };
    const startHeading = Math.atan2(target.y - start.y, target.x - start.x);
    const initialDistance = Math.hypot(target.x - start.x, target.y - start.y);
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const boatImage = new Image();
    boatImage.src = "assets/icons/05_sail_selected.png";
    const deliveryImage = new Image();
    deliveryImage.src = "assets/icons/06_deliver.png";

    const state = {
      x: start.x,
      y: start.y,
      heading: startHeading,
      speed: 0,
      throttle: 0.72,
      rudder: 0,
      distance: initialDistance,
      active: false,
      paused: false,
      mapOpen: false,
      readyToDeliver: false,
      delivered: false,
      elapsed: 0,
      lastTimestamp: 0,
      wake: [],
      keys: new Set(),
      dragging: false
    };

    const ui = {
      speed: document.querySelector("#speedReadout"),
      heading: document.querySelector("#headingReadout"),
      distance: document.querySelector("#distanceReadout"),
      progress: document.querySelector("#voyageProgressBar"),
      status: document.querySelector("#voyageStatus"),
      danger: document.querySelector("#dangerReadout"),
      deliver: document.querySelector("#deliverButton"),
      map: document.querySelector("#sailingMapOverlay"),
      pause: document.querySelector("#pauseOverlay")
    };

    function compassLabel(degrees) {
      const labels = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      return labels[Math.round(degrees / 45) % 8];
    }

    function normalizedDegrees(angle) {
      return (angle * 180 / Math.PI + 90 + 360) % 360;
    }

    function setStatus(message) {
      if (ui.status) ui.status.textContent = message;
    }

    function updateUI() {
      const degrees = normalizedDegrees(state.heading);
      const progress = clamp(1 - state.distance / initialDistance, 0, 1);
      const idealHeading = Math.atan2(target.y - state.y, target.x - state.x);
      const headingError = Math.abs(wrapAngle(idealHeading - state.heading));
      const offCourse = headingError > 0.72 && state.distance > 90;

      if (ui.speed) ui.speed.textContent = `${(state.speed * 0.18).toFixed(1)} kn`;
      if (ui.heading) ui.heading.textContent = `${String(Math.round(degrees)).padStart(3, "0")}° ${compassLabel(degrees)}`;
      if (ui.distance) ui.distance.textContent = Math.max(0, state.distance / initialDistance * 2.4).toFixed(1);
      if (ui.progress) ui.progress.style.width = `${Math.round(progress * 100)}%`;

      if (ui.danger) {
        ui.danger.classList.toggle("is-danger", offCourse);
        const strong = ui.danger.querySelector("strong");
        if (strong) strong.textContent = offCourse ? "偏航 · 修正舵向" : "保持航向";
      }

      state.readyToDeliver = state.distance <= 72;
      if (ui.deliver) {
        ui.deliver.classList.toggle("is-ready", state.readyToDeliver && !state.delivered);
        ui.deliver.disabled = state.delivered;
      }

      if (state.readyToDeliver && !state.delivered) {
        setStatus("已进入灯塔投递圈：按 E 或点击“投递”。");
      } else if (!state.paused && !state.mapOpen && !offCourse && !state.delivered) {
        setStatus("W 加速，A/D 调整舵向；进入灯塔圈后按 E 投递。");
      }
    }

    function reset() {
      Object.assign(state, {
        x: start.x,
        y: start.y,
        heading: startHeading,
        speed: 0,
        throttle: 0.72,
        rudder: 0,
        distance: initialDistance,
        paused: false,
        mapOpen: false,
        readyToDeliver: false,
        delivered: false,
        elapsed: 0,
        lastTimestamp: 0,
        wake: []
      });
      state.keys.clear();
      if (ui.map) ui.map.hidden = true;
      if (ui.pause) ui.pause.hidden = true;
      updateUI();
      draw();
    }

    function startGame({ fresh = false } = {}) {
      if (fresh || state.delivered) reset();
      state.active = true;
      state.lastTimestamp = 0;
      requestAnimationFrame(loop);
    }

    function stopGame() {
      state.active = false;
      state.keys.clear();
    }

    function togglePause() {
      if (!state.active || state.delivered) return;
      state.paused = !state.paused;
      if (ui.pause) ui.pause.hidden = !state.paused;
      setStatus(state.paused ? "航行已暂停。" : "继续航行。");
    }

    function toggleMap() {
      if (!state.active || state.delivered) return;
      state.mapOpen = !state.mapOpen;
      if (ui.map) ui.map.hidden = !state.mapOpen;
      setStatus(state.mapOpen ? "航行地图已展开。" : "航行地图已收起。");
    }

    function tryDeliver() {
      if (!state.active || state.delivered) return;
      if (!state.readyToDeliver) {
        setStatus("还未进入灯塔投递圈；继续朝右上方蓝潮岛航行。");
        if (ui.deliver) {
          ui.deliver.classList.remove("is-shaking");
          void ui.deliver.offsetWidth;
          ui.deliver.classList.add("is-shaking");
        }
        return;
      }
      state.delivered = true;
      state.speed = 0;
      state.active = false;
      setStatus("邮件已投递，正在写入航海日志。");
      if (typeof options.onArrive === "function") options.onArrive({ ...getPublicState() });
    }

    function activateControl(control, pressed) {
      const keyMap = {
        "throttle-up": "w",
        left: "a",
        "throttle-down": "s",
        right: "d"
      };
      if (keyMap[control]) {
        if (pressed) state.keys.add(keyMap[control]);
        else state.keys.delete(keyMap[control]);
      }
      if (pressed && control === "deliver") tryDeliver();
      if (pressed && control === "map") toggleMap();
      if (pressed && control === "pause") togglePause();
    }

    function update(dt) {
      if (state.paused || state.mapOpen || state.delivered) return;

      if (state.keys.has("w")) state.throttle = clamp(state.throttle + dt * 0.36, 0, 1);
      if (state.keys.has("s")) state.throttle = clamp(state.throttle - dt * 0.48, 0, 1);

      const rudderTarget = (state.keys.has("d") ? 1 : 0) - (state.keys.has("a") ? 1 : 0);
      state.rudder += (rudderTarget - state.rudder) * Math.min(1, dt * 5.5);
      if (!rudderTarget) state.rudder *= Math.max(0, 1 - dt * 2.8);

      const targetSpeed = 32 * state.throttle;
      state.speed += (targetSpeed - state.speed) * Math.min(1, dt * 1.6);
      state.heading += state.rudder * (0.42 + state.speed / 32) * dt;
      state.heading = wrapAngle(state.heading);

      state.x += Math.cos(state.heading) * state.speed * dt;
      state.y += Math.sin(state.heading) * state.speed * dt;
      state.x = clamp(state.x, 35, 925);
      state.y = clamp(state.y, 48, 500);
      state.distance = Math.hypot(target.x - state.x, target.y - state.y);
      state.elapsed += dt;

      if (!prefersReducedMotion && state.speed > 6) {
        state.wake.push({ x: state.x - Math.cos(state.heading) * 48, y: state.y - Math.sin(state.heading) * 48, life: 1 });
        if (state.wake.length > 58) state.wake.shift();
      }
      state.wake.forEach((wake) => { wake.life -= dt * 0.75; });
      state.wake = state.wake.filter((wake) => wake.life > 0);
    }

    function drawWater() {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#dceae5");
      gradient.addColorStop(1, "#bcd9d4");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.strokeStyle = "rgba(59,116,116,.13)";
      context.lineWidth = 1.5;
      for (let y = 74; y < 520; y += 42) {
        context.beginPath();
        for (let x = -30; x < 990; x += 24) {
          const wave = Math.sin((x + state.elapsed * 14 + y) * 0.035) * 3;
          if (x === -30) context.moveTo(x, y + wave);
          else context.lineTo(x, y + wave);
        }
        context.stroke();
      }
    }

    function drawRoute() {
      context.save();
      context.strokeStyle = "rgba(59,116,116,.62)";
      context.lineWidth = 3;
      context.setLineDash([12, 10]);
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(target.x, target.y);
      context.stroke();
      context.restore();
    }

    function drawTarget() {
      context.save();
      context.strokeStyle = "#d6a64c";
      context.lineWidth = 4;
      context.setLineDash([8, 8]);
      context.beginPath();
      context.arc(target.x, target.y, 62, 0, TAU);
      context.stroke();
      context.restore();
      if (deliveryImage.complete) {
        context.drawImage(deliveryImage, target.x - 68, target.y - 68, 136, 136);
      }
    }

    function drawWake() {
      context.save();
      context.fillStyle = "#ffffff";
      state.wake.forEach((wake, index) => {
        context.globalAlpha = clamp(wake.life * 0.28, 0, .28);
        const size = 2 + (index % 4);
        context.beginPath();
        context.arc(wake.x, wake.y, size, 0, TAU);
        context.fill();
      });
      context.restore();
    }

    function drawBoat() {
      context.save();
      context.translate(state.x, state.y);
      context.rotate(state.heading + Math.PI / 2);
      if (boatImage.complete) {
        context.drawImage(boatImage, -72, -72, 144, 144);
      } else {
        context.fillStyle = "#d97a66";
        context.beginPath();
        context.moveTo(0, -28);
        context.lineTo(18, 25);
        context.lineTo(-18, 25);
        context.closePath();
        context.fill();
      }
      context.restore();
    }

    function draw() {
      drawWater();
      drawRoute();
      drawWake();
      drawTarget();
      drawBoat();
    }

    function loop(timestamp) {
      if (!state.active) {
        draw();
        updateUI();
        return;
      }
      if (!state.lastTimestamp) state.lastTimestamp = timestamp;
      const dt = clamp((timestamp - state.lastTimestamp) / 1000, 0, 0.033);
      state.lastTimestamp = timestamp;
      update(dt);
      draw();
      updateUI();
      requestAnimationFrame(loop);
    }

    function getPublicState() {
      return {
        x: Number(state.x.toFixed(2)),
        y: Number(state.y.toFixed(2)),
        heading: Number(normalizedDegrees(state.heading).toFixed(2)),
        speed: Number(state.speed.toFixed(2)),
        rudder: Number(state.rudder.toFixed(3)),
        throttle: Number(state.throttle.toFixed(3)),
        distance: Number(state.distance.toFixed(2)),
        elapsed: Number(state.elapsed.toFixed(2)),
        readyToDeliver: state.readyToDeliver,
        paused: state.paused,
        mapOpen: state.mapOpen,
        delivered: state.delivered
      };
    }

    document.addEventListener("keydown", (event) => {
      if (!state.active) return;
      const key = event.key.toLowerCase();
      if (["w", "a", "s", "d", "e", "m", "escape"].includes(key)) event.preventDefault();
      if (["w", "a", "s", "d"].includes(key)) state.keys.add(key);
      if (key === "e" && !event.repeat) tryDeliver();
      if (key === "m" && !event.repeat) toggleMap();
      if (key === "escape" && !event.repeat) togglePause();
    });

    document.addEventListener("keyup", (event) => {
      state.keys.delete(event.key.toLowerCase());
    });

    document.querySelectorAll("[data-sail-control]").forEach((button) => {
      const control = button.dataset.sailControl;
      const press = (event) => {
        event.preventDefault();
        button.classList.add("is-active");
        activateControl(control, true);
      };
      const release = () => {
        button.classList.remove("is-active");
        activateControl(control, false);
      };
      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
    });

    canvas.addEventListener("pointerdown", (event) => {
      if (!state.active || state.paused || state.mapOpen) return;
      state.dragging = true;
      canvas.setPointerCapture(event.pointerId);
    });

    canvas.addEventListener("pointermove", (event) => {
      if (!state.dragging || !state.active) return;
      const bounds = canvas.getBoundingClientRect();
      const pointerX = (event.clientX - bounds.left) / bounds.width * canvas.width;
      const pointerY = (event.clientY - bounds.top) / bounds.height * canvas.height;
      const desired = Math.atan2(pointerY - state.y, pointerX - state.x);
      const difference = wrapAngle(desired - state.heading);
      state.rudder = clamp(difference * 1.4, -1, 1);
    });

    canvas.addEventListener("pointerup", (event) => {
      state.dragging = false;
      state.rudder = 0;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    });

    boatImage.addEventListener("load", draw);
    deliveryImage.addEventListener("load", draw);
    reset();

    return {
      start: startGame,
      stop: stopGame,
      reset,
      control: activateControl,
      getState: getPublicState,
      tryDeliver,
      toggleMap,
      togglePause
    };
  }

  window.TidalSailing = { create: createSailingController };
})();
