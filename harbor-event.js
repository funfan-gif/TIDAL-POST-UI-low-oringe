"use strict";

(function harborEventModule() {
  const NORMAL_DURATION = 6600;
  const REDUCED_DURATION = 260;

  function create(root, callbacks = {}) {
    if (!root) return null;

    const status = root.querySelector("#harborArrivalStatus");
    const waitButton = root.querySelector("[data-action='wait-letter']");
    const timers = [];
    let phase = root.dataset.phase || "waiting";
    let startedAt = 0;
    let revealedAt = 0;

    const clearTimers = () => {
      while (timers.length) window.clearTimeout(timers.pop());
    };

    const setStatus = (copy) => {
      if (status) status.textContent = copy;
      const live = root.querySelector("#harborEventLive");
      if (live) live.textContent = copy;
    };

    const setPhase = (next) => {
      phase = next;
      root.dataset.phase = next;
      root.setAttribute("aria-busy", String(next === "arriving"));
      if (waitButton) waitButton.disabled = next !== "waiting";
      const accept = root.querySelector(".letter-accept");
      if (accept) {
        accept.disabled = next !== "revealed";
        accept.tabIndex = next === "revealed" ? 0 : -1;
      }
      callbacks.onPhaseChange?.(next);
    };

    const reveal = ({ skipped = false, notify = true } = {}) => {
      clearTimers();
      revealedAt = window.performance.now();
      setPhase("revealed");
      setStatus(skipped ? "委托信已展开。" : "跨界邮路已接通，委托信已抵达。 ");
      if (notify) callbacks.onReveal?.({ skipped });
      window.requestAnimationFrame(() => root.querySelector(".letter-accept")?.focus({ preventScroll: true }));
    };

    const start = () => {
      if (phase !== "waiting") return;
      clearTimers();
      startedAt = window.performance.now();
      revealedAt = 0;
      setPhase("arriving");
      setStatus("远处传来翅声……");

      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const duration = reduced ? REDUCED_DURATION : NORMAL_DURATION;
      if (!reduced) {
        timers.push(window.setTimeout(() => setStatus("异界海鸥正穿过潮雾。"), 1200));
        timers.push(window.setTimeout(() => setStatus("一封带着潮光的信被交到你面前。"), 2700));
        timers.push(window.setTimeout(() => setStatus("双潮邮戳正在确认收件人。"), 4050));
        timers.push(window.setTimeout(() => setStatus("信纸展开，未竟的愿望重新有了去处。"), 5250));
      }
      timers.push(window.setTimeout(() => reveal({ notify: true }), duration));
    };

    const render = (snapshot = {}) => {
      const next = snapshot.phase || phase;
      if (next !== phase) {
        clearTimers();
        setPhase(next);
      }
      const accept = root.querySelector(".letter-accept");
      if (accept) {
        accept.innerHTML = snapshot.missionAccepted ? "≈<br>继续委托" : "≈<br>收下委托";
        accept.setAttribute("aria-label", snapshot.missionAccepted ? "继续查看蓝潮岛委托" : "收下蓝潮岛的回信委托");
      }
      const objective = root.querySelector(".harbor-objective small");
      if (objective) objective.textContent = snapshot.missionAccepted ? "信件已归入邮袋记录，继续查看委托。" : "阅读信件后，收下委托并开始准备。";
    };

    root.dataset.phase = phase;
    root.setAttribute("aria-busy", "false");

    return {
      start,
      skip: () => phase === "arriving" && reveal({ skipped: true, notify: true }),
      revealImmediately: () => reveal({ notify: false }),
      reset: () => {
        clearTimers();
        setPhase("waiting");
        setStatus("港口很安静。等待一封来自潮雾之外的信。 ");
      },
      render,
      getState: () => ({
        phase,
        duration: NORMAL_DURATION,
        elapsedMs: startedAt && revealedAt ? Math.round(revealedAt - startedAt) : null
      })
    };
  }

  window.TidalHarborEvent = { create };
})();
