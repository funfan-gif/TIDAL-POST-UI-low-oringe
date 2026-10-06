"use strict";

const screenMeta = {
  harbor: ["01 / 06", "港口"],
  mission: ["02 / 06", "委托详情"],
  mailbag: ["03 / 06", "邮袋"],
  map: ["04 / 06", "邮务航海图桌"],
  sailing: ["05 / 06", "航行 HUD"],
  result: ["06 / 06", "投递结果"]
};

const stepOrder = ["harbor", "mission", "mailbag", "map", "sailing", "result"];
const query = new URLSearchParams(window.location.search);
const capturePreset = query.get("capture");
const debugEnabled = query.get("debug") === "1";

const state = {
  screen: "harbor",
  stamps: 120,
  missionAccepted: false,
  selectedItem: null,
  mailbagSaved: false,
  selectedIsland: null,
  rewardClaimed: false,
  completed: false,
  missionReturnTarget: "harbor",
  activeCategory: "letters",
  routePlan: null,
  mapRevealSeen: false,
  mapPhase: "MAILBAG",
  missionRound: 1
};

const prototypeStorageKey = "tidalPost.prototype.v4";
if (!capturePreset) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(prototypeStorageKey));
    if (saved && screenMeta[saved.screen] && Number.isFinite(saved.stamps)) {
      for (const key of Object.keys(state)) if (Object.hasOwn(saved, key)) state[key] = saved[key];
      if (["map", "sailing"].includes(state.screen) && !state.mailbagSaved) state.screen = "mailbag";
    }
  } catch { /* Storage is optional for local-file use. */ }
}
function persistPrototype() {
  if (capturePreset) return;
  try { sessionStorage.setItem(prototypeStorageKey, JSON.stringify(state)); } catch { }
}

const categoryCopy = {
  letters: ["信件", "选择要装入本次邮袋的邮件"],
  parcels: ["包裹", "当前委托不需要包裹"],
  materials: ["材料", "本次投递不消耗材料"],
  keepsakes: ["纪念品", "纪念品不会装入任务邮袋"]
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));
let toastTimer;
let sailing;
let routeMap;
let mapReveal;

function applyCapturePreset() {
  const target = {
    "01-harbor": "harbor",
    "02-mission": "mission",
    "03-mailbag": "mailbag",
    "04-map": "map",
    "05-sailing": "sailing",
    "06-result": "result"
  }[capturePreset];

  if (!target) return null;

  if (["mailbag", "map", "sailing", "result"].includes(target)) {
    state.missionAccepted = true;
    state.selectedItem = "blue-envelope";
    state.missionReturnTarget = "mailbag";
  }
  if (["map", "sailing", "result"].includes(target)) {
    state.mailbagSaved = true;
    state.selectedIsland = "blue";
  }
  if (target === "result") state.completed = true;
  if (["sailing", "result"].includes(target)) state.routePlan = { valid: true, confirmed: true, distance: 2.4, destination: "blue-tide-north-pier" };
  return target;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function shake(node) {
  if (!node) return;
  node.classList.remove("is-shaking");
  void node.offsetWidth;
  node.classList.add("is-shaking");
  window.setTimeout(() => node.classList.remove("is-shaking"), 380);
}

function flashSuccess() {
  const flash = $("#screenFlash");
  flash.classList.remove("is-active");
  void flash.offsetWidth;
  flash.classList.add("is-active");
  window.setTimeout(() => flash.classList.remove("is-active"), 500);
}

function navigate(screen, options = {}) {
  if (!screenMeta[screen]) return;
  if (screen === "sailing" && !(state.mailbagSaved && state.routePlan?.valid && state.routePlan?.confirmed)) return;
  if (state.screen === "map" && screen !== "map") {
    mapReveal?.finish({ focus: false });
    routeMap?.closeConfirmation();
  }
  if (state.screen === "sailing" && screen !== "sailing") sailing?.stop();
  state.screen = screen;
  $(".prototype-frame").classList.toggle("map-mode", screen === "map");

  $$(".screen").forEach((node) => {
    const active = node.dataset.screen === screen;
    node.hidden = !active;
    node.classList.toggle("is-active", active);
  });

  const [number, name] = screenMeta[screen];
  $("#screenNumber").textContent = number;
  $("#screenName").textContent = name;
  updateFlowTracker();
  render();

  if (screen === "map") {
    const root = $('[data-screen="map"]');
    if (!routeMap) {
      routeMap = window.TidalRouteMap.create(root, { onChange: syncRoutePlan });
      mapReveal = window.TidalMapReveal.create(root, routeMap, phase => {
        state.mapPhase = phase === "MAP_READY" && state.routePlan?.confirmed ? "MAP_CONFIRMED" : phase;
        persistPrototype(); updateDebug();
      });
    } else routeMap.refresh();
    const full = options.reveal === true && !state.mapRevealSeen;
    if (options.reveal) state.mapRevealSeen = true;
    mapReveal.start({ full, continuity: options.continuity, immediate: options.immediate === true });
  }

  if (screen === "sailing") {
    window.requestAnimationFrame(() => sailing?.start({ fresh: !state.completed }));
  }

  const heading = $("[data-screen=\"" + screen + "\"] h1");
  if (heading && !capturePreset && screen !== "map") {
    window.requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
  persistPrototype();
}

function syncRoutePlan(route) {
  state.routePlan = {
    commission: "TP-042", destination: "blue-tide-north-pier", start: route.start,
    w1: route.waypoints[0], w2: route.waypoints[1], waypoints: route.waypoints,
    distance: route.total, bearings: route.segments.map(s => s.bearing), segments: route.segments,
    valid: route.valid, confirmed: route.confirmed
  };
  state.selectedIsland = "blue";
  if (state.mapPhase !== "MAP_REVEALING") state.mapPhase = route.confirmed ? "MAP_CONFIRMED" : "MAP_READY";
  renderHarbor(); persistPrototype(); updateDebug();
}

function updateFlowTracker() {
  const currentIndex = stepOrder.indexOf(state.screen);
  $$("[data-step]").forEach((node) => {
    const stepIndex = stepOrder.indexOf(node.dataset.step);
    node.classList.toggle("is-current", stepIndex === currentIndex);
    node.classList.toggle("is-complete", stepIndex < currentIndex);
  });
}

function renderHarbor() {
  const completedCount = [state.missionAccepted, state.mailbagSaved, state.routePlan?.confirmed].filter(Boolean).length;
  $("#harborMissionStatus").textContent = state.completed ? "本轮投递已完成" : "主线进度 " + completedCount + " / 3";
  const progress = {
    mission: state.missionAccepted,
    mailbag: state.mailbagSaved,
    route: state.routePlan?.confirmed
  };
  $$("[data-progress]").forEach((node) => node.classList.toggle("is-complete", Boolean(progress[node.dataset.progress])));
}

function renderMission() {
  const chip = $("#missionStateChip");
  chip.textContent = state.missionAccepted ? "已接取" : "尚未接取";
  chip.classList.toggle("is-ok", state.missionAccepted);
  chip.classList.toggle("is-warning", !state.missionAccepted);
  const primary = $("[data-action='mission-primary']");
  primary.textContent = state.missionAccepted ? "继续整理邮袋" : "接取并整理邮袋";
  $("[data-action='mission-back']").textContent = state.missionReturnTarget === "mailbag" ? "返回邮袋" : "返回港口";
}

function renderMailbag() {
  const [label, help] = categoryCopy[state.activeCategory];
  $("#inventoryCategoryLabel").textContent = label;
  $("#inventoryHelp").textContent = help;
  $$("[data-category]").forEach((node) => node.classList.toggle("is-current", node.dataset.category === state.activeCategory));

  const showLetters = state.activeCategory === "letters";
  $("#inventoryList").hidden = !showLetters;
  const selectedBlue = state.selectedItem === "blue-envelope";
  const selectedWrong = state.selectedItem === "shell-postcard";

  $$("[data-item]").forEach((node) => {
    const selected = node.dataset.item === state.selectedItem;
    node.classList.toggle("is-selected", selected);
    node.classList.toggle("is-invalid", selected && selectedWrong);
    node.setAttribute("aria-pressed", String(selected));
  });

  const feedback = $("#selectionFeedback");
  feedback.classList.toggle("is-failure", selectedWrong);
  if (!showLetters) {
    feedback.innerHTML = "<strong>" + label + "不参与本次任务</strong><span>" + help + "。</span>";
  } else if (selectedBlue) {
    feedback.innerHTML = "<strong>已选择：蓝色信封 ×1</strong><span>" + (state.mailbagSaved ? "已保存至邮袋，可以前往地图。" : "当前只是草稿，点击保存后才会锁定。") + "</span>";
  } else if (selectedWrong) {
    feedback.innerHTML = "<strong>任务不匹配：海盐账单</strong><span>可以尝试保存查看 Failure 反馈，或改选蓝色信封。</span>";
  } else {
    feedback.innerHTML = "<strong>先选择一件邮件</strong><span>当前没有编辑中的选择。</span>";
  }

  $("#mailbagStatusChip").textContent = state.mailbagSaved ? "已保存" : state.selectedItem ? "草稿 · 尚未保存" : "尚未选择";
  $("#mailbagStatusChip").classList.toggle("is-ok", state.mailbagSaved);
  $("#mailbagStatusChip").classList.toggle("is-warning", !state.mailbagSaved);
  $("#bagMatchLabel").textContent = selectedBlue ? "任务所需 1 / 1" : "任务所需 0 / 1";
  $("#bagWeight").textContent = state.selectedItem ? "0.2 kg" : "0.0 kg";

  const saveState = $("#saveStateText");
  saveState.textContent = state.mailbagSaved ? "已保存" : state.selectedItem ? "待保存" : "待选择";
  saveState.classList.toggle("warning-text", !state.mailbagSaved);
  saveState.classList.toggle("sea-text", state.mailbagSaved);

  const preview = $("#bagItemPreview");
  if (state.selectedItem) {
    const valid = selectedBlue;
    preview.innerHTML = '<img src="assets/icons/' + (valid ? "03_mailbag.png" : "02_commission.png") + '" alt=""><span><strong>' + (valid ? "蓝色信封" : "海盐账单") + "</strong><small>" + (state.mailbagSaved ? "已保存至邮袋" : valid ? "任务匹配 · 草稿" : "非任务所需") + "</small></span>";
  } else {
    preview.innerHTML = '<span class="muted">等待选择邮件</span>';
  }

  $("#saveMailbagButton").disabled = !state.selectedItem || state.mailbagSaved;
  $("#saveMailbagButton").textContent = state.mailbagSaved ? "邮袋已保存" : "保存邮袋";
  $("#goMapButton").disabled = !state.mailbagSaved;
  $("#mailbagNextReason").textContent = state.mailbagSaved ? "邮袋已保存，可以查看航海图。" : selectedWrong ? "当前邮件不匹配任务，请改选蓝色信封。" : "选择并保存“蓝色信封”后可以查看航海图。";
}

function renderMap() {
  // The reusable route controller owns the final Week4 screen's DOM.
}

function renderResult() {
  $("#resultRouteDistance").textContent = (state.routePlan?.distance || 2.4).toFixed(1) + " 海里";
  $("#resultBalance").textContent = state.stamps;
  $("#pendingBalance").textContent = state.rewardClaimed ? state.stamps : state.stamps + 40;
  $("#claimRewardButton").disabled = state.rewardClaimed;
  $("#claimRewardButton").textContent = state.rewardClaimed ? "奖励已领取" : "领取奖励";
  $("#continueButton").disabled = !state.rewardClaimed;
  $("#returnHarborButton").disabled = !state.rewardClaimed;
  $("#rewardReason").textContent = state.rewardClaimed ? "邮票已到账，新的港口路径已解锁。" : "奖励显示中，尚未到账。";
  $("#resultStatusChip").textContent = state.rewardClaimed ? "奖励已到账" : "奖励待领取";
  $("#resultStatusChip").classList.toggle("is-ok", state.rewardClaimed);
  $("#resultStatusChip").classList.toggle("is-reward", !state.rewardClaimed);
}

function updateDebug() {
  const panel = $("#debugPanel");
  if (!debugEnabled) {
    panel.hidden = true;
    return;
  }
  panel.hidden = false;
  const sailingState = sailing?.getState();
  $("#debugState").textContent = JSON.stringify({ ...state, sailing: sailingState });
}

function render() {
  $("#stampBalance").textContent = state.stamps;
  renderHarbor();
  renderMission();
  renderMailbag();
  renderMap();
  renderResult();
  updateDebug();
  persistPrototype();
}

function openMission() {
  state.missionReturnTarget = "harbor";
  navigate("mission");
}

function missionPrimary() {
  state.missionAccepted = true;
  state.missionReturnTarget = "mailbag";
  showToast("委托已接取：下一步整理并保存蓝色信封。");
  navigate("mailbag");
}

function missionBack() {
  navigate(state.missionReturnTarget === "mailbag" ? "mailbag" : "harbor");
}

function viewMissionFromBag() {
  state.missionReturnTarget = "mailbag";
  navigate("mission");
}

function selectInventoryItem(item) {
  state.selectedItem = item;
  state.mailbagSaved = false;
  if (state.routePlan) state.routePlan.confirmed = false;
  routeMap?.invalidateConfirmation();
  render();
  showToast(item === "blue-envelope" ? "蓝色信封已加入草稿，尚未保存。" : "海盐账单不是任务所需邮件。");
}

function saveMailbag() {
  if (!state.selectedItem) return;
  if (state.selectedItem !== "blue-envelope") {
    state.mailbagSaved = false;
    render();
    shake($("#selectionFeedback"));
    shake($(".bag-summary"));
    showToast("保存失败：当前邮件与“蓝潮岛的回信”不匹配。");
    return;
  }
  state.mailbagSaved = true;
  state.mapPhase = "MAILBAG_SAVED";
  render();
  showToast("邮袋已保存。现在可以查看航海图。");
}

function goMap() {
  if (!state.mailbagSaved) return;
  const continuity = !state.mapRevealSeen ? window.TidalMapReveal.captureMailbag() : null;
  $("#toast").hidden = true;
  navigate("map", { reveal: true, continuity });
}

function startSailing() {
  if (state.mapPhase === "MAP_REVEALING" || !state.mailbagSaved || !state.routePlan?.valid || !state.routePlan?.confirmed) return;
  routeMap?.closeConfirmation();
  state.completed = false;
  navigate("sailing");
}

function handleArrival() {
  state.completed = true;
  flashSuccess();
  window.setTimeout(() => {
    navigate("result");
    showToast("投递成功：奖励等待领取。");
  }, 420);
}

function claimReward() {
  if (state.rewardClaimed) return;
  state.rewardClaimed = true;
  state.stamps += 40;
  render();
  $(".reward-block")?.classList.add("is-claimed");
  $(".account-block")?.classList.add("is-rewarded");
  showToast("奖励已到账：邮票 +40。");
}

function returnHarbor() {
  if (!state.rewardClaimed) return;
  navigate("harbor");
  showToast("已返回旧邮局港，本轮投递记录已保留。");
}

function continueTask() {
  if (!state.rewardClaimed) return;
  state.missionAccepted = false;
  state.selectedItem = null;
  state.mailbagSaved = false;
  state.selectedIsland = null;
  state.rewardClaimed = false;
  state.completed = false;
  state.missionReturnTarget = "harbor";
  state.activeCategory = "letters";
  state.routePlan = null;
  state.mapRevealSeen = false;
  state.mapPhase = "MAILBAG";
  state.missionRound += 1;
  routeMap?.reset({ discardSaved: true });
  sailing?.reset();
  navigate("mission");
  showToast("新的委托流程已准备。");
}

const actions = {
  "open-mission": openMission,
  "mission-primary": missionPrimary,
  "mission-back": missionBack,
  "view-mission-from-bag": viewMissionFromBag,
  "save-mailbag": saveMailbag,
  "go-map": goMap,
  "map-back": () => navigate("mailbag"),
  "start-sailing": startSailing,
  "claim-reward": claimReward,
  "return-harbor": returnHarbor,
  "continue-task": continueTask
};

document.addEventListener("click", (event) => {
  const actionNode = event.target.closest("[data-action]");
  if (actionNode && !actionNode.disabled) {
    event.preventDefault();
    actions[actionNode.dataset.action]?.();
    return;
  }

  const itemNode = event.target.closest("[data-item]");
  if (itemNode && !itemNode.disabled) {
    selectInventoryItem(itemNode.dataset.item);
    return;
  }

  const categoryNode = event.target.closest("[data-category]");
  if (categoryNode) {
    state.activeCategory = categoryNode.dataset.category;
    render();
    return;
  }

});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.screen === "mission" && state.missionReturnTarget === "mailbag") {
    missionBack();
  }
});

sailing = window.TidalSailing?.create({
  canvas: "#sailingCanvas",
  onArrive: handleArrival
});

const initialScreen = applyCapturePreset();
navigate(initialScreen || state.screen, { immediate: true });

if (debugEnabled) window.setInterval(updateDebug, 120);

window.__tidalPost = {
  getState: () => ({ ...state, sailing: sailing?.getState() }),
  navigate,
  actions,
  selectInventoryItem,
  sailing,
  routeMap: () => routeMap,
  reveal: () => mapReveal?.getState()
};
