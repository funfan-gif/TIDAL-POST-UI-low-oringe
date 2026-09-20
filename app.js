"use strict";

const screenMeta = {
  harbor: ["01 / 06", "港口"],
  mission: ["02 / 06", "委托详情"],
  mailbag: ["03 / 06", "邮袋"],
  map: ["04 / 06", "群岛地图"],
  sailing: ["05 / 06", "航行 HUD"],
  result: ["06 / 06", "投递结果"]
};

const stepOrder = ["harbor", "mission", "mailbag", "map", "sailing", "result"];

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
  activeCategory: "letters"
};

function applyCapturePreset() {
  const preset = new URLSearchParams(window.location.search).get("capture");
  const screen = {
    "01-harbor": "harbor",
    "02-mission": "mission",
    "03-mailbag": "mailbag",
    "04-map": "map",
    "05-sailing": "sailing",
    "06-result": "result"
  }[preset];

  if (!screen) return null;

  if (["mailbag", "map", "sailing", "result"].includes(screen)) {
    state.missionAccepted = true;
  }
  if (["mailbag", "map", "sailing", "result"].includes(screen)) {
    state.selectedItem = "blue-envelope";
    state.missionReturnTarget = "mailbag";
  }
  if (["map", "sailing", "result"].includes(screen)) {
    state.mailbagSaved = true;
    state.selectedIsland = "blue";
  }

  return screen;
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

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.hidden = true;
  }, 2200);
}

function navigate(screen) {
  state.screen = screen;
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

  const heading = $(`[data-screen="${screen}"] h1`);
  if (heading) {
    window.requestAnimationFrame(() => heading.focus({ preventScroll: true }));
  }
}

function updateFlowTracker() {
  const currentIndex = stepOrder.indexOf(state.screen);
  $$("[data-step]").forEach((node) => {
    const stepIndex = stepOrder.indexOf(node.dataset.step);
    node.classList.toggle("is-current", stepIndex === currentIndex);
    node.classList.toggle("is-complete", stepIndex < currentIndex);
  });
}

function renderHeader() {
  $("#stampBalance").textContent = String(state.stamps);
  $("#resultBalance").textContent = String(state.stamps);
}

function renderHarbor() {
  const status = $("#harborMissionStatus");
  const note = $("#harborCompletionNote");
  if (state.completed) {
    status.textContent = "本次投递已完成";
    status.classList.add("is-ok");
    note.textContent = "奖励已到账：120 → 160。可重新查看委托以复核流程。";
  } else if (state.missionAccepted) {
    status.textContent = "已接取，进度已保留";
    status.classList.add("is-ok");
    note.textContent = "离开页面不会自动放弃委托。";
  } else {
    status.textContent = "等待查看";
    status.classList.remove("is-ok");
    note.textContent = `本次邮票：${state.stamps}`;
  }
}

function renderMission() {
  const chip = $("#missionStateChip");
  const context = $("#missionContextNote");
  const primary = $("[data-action='mission-primary']");
  const back = $("[data-action='mission-back']");

  if (state.missionAccepted) {
    chip.textContent = "已接取";
    chip.classList.add("is-ok");
  } else {
    chip.textContent = "尚未接取";
    chip.classList.remove("is-ok");
  }

  if (state.missionReturnTarget === "mailbag") {
    primary.textContent = "返回邮袋继续整理";
    back.textContent = "返回邮袋";
    context.textContent = state.selectedItem
      ? "返回后会保留“信件”分类、蓝色信封选择与当前草稿。"
      : "返回后会恢复进入详情前的邮袋编辑上下文。";
  } else if (state.missionAccepted) {
    primary.textContent = "继续整理邮袋";
    back.textContent = "返回港口";
    context.textContent = "委托已接取；返回港口不会自动放弃。";
  } else {
    primary.textContent = "接取并整理邮袋";
    back.textContent = "返回港口";
    context.textContent = "接取后进入邮袋，选择并保存所需邮件。";
  }
}

function renderMailbag() {
  const selected = state.selectedItem === "blue-envelope";
  const selectedButton = $("[data-item='blue-envelope']");
  const saveButton = $("#saveMailbagButton");
  const goMapButton = $("#goMapButton");

  selectedButton.classList.toggle("is-selected", selected);
  selectedButton.setAttribute("aria-pressed", String(selected));
  $("#emptyItemState").hidden = selected;
  $("#selectedItemState").hidden = !selected;

  if (!selected) {
    $("#mailbagSummary").textContent = "尚未选择";
    $("#selectionMemory").textContent = "当前没有编辑中的选择。";
    $("#mailbagNextReason").textContent = "选择并保存“蓝色信封”后可以前往地图。";
  } else if (!state.mailbagSaved) {
    $("#mailbagSummary").textContent = "草稿 · 尚未保存";
    $("#saveStateText").textContent = "草稿，尚未保存";
    $("#selectionMemory").textContent = "已试选：蓝色信封。查看委托再返回时，此草稿仍会保留。";
    $("#mailbagNextReason").textContent = "草稿不等于已保存。请先保存邮袋。";
  } else {
    $("#mailbagSummary").textContent = "已保存 · 1 / 1";
    $("#saveStateText").textContent = "已保存到本次邮袋";
    $("#selectionMemory").textContent = "已保存：蓝色信封 ×1。";
    $("#mailbagNextReason").textContent = "邮袋条件已满足，可以前往地图。";
  }

  saveButton.disabled = !selected || state.mailbagSaved;
  saveButton.textContent = state.mailbagSaved ? "邮袋已保存" : "保存邮袋";
  goMapButton.disabled = !state.mailbagSaved;

  $$("[data-category]").forEach((node) => {
    node.classList.toggle("is-current", node.dataset.category === state.activeCategory);
  });
  const [label, help] = categoryCopy[state.activeCategory];
  $("#inventoryCategoryLabel").textContent = label;
  $("#inventoryHelp").textContent = help;
  $("#inventoryList").hidden = state.activeCategory !== "letters";
}

function renderMap() {
  const blue = state.selectedIsland === "blue";
  const fog = state.selectedIsland === "fog";
  const blueButton = $("[data-island='blue']");
  const fogButton = $("[data-island='fog']");

  blueButton.classList.toggle("is-selected", blue);
  blueButton.setAttribute("aria-pressed", String(blue));
  fogButton.classList.toggle("is-failed", fog);
  fogButton.setAttribute("aria-pressed", String(fog));
  $("#blueRoute").classList.toggle("is-visible", blue);
  $("#fogRoute").classList.toggle("is-visible", fog);
  $("#routeEmptyState").hidden = blue || fog;
  $("#routeBlueState").hidden = !blue;
  $("#routeFogState").hidden = !fog;

  const startButton = $("#startSailingButton");
  startButton.disabled = !blue;
  if (blue) {
    $("#routeReason").textContent = "蓝潮岛当前可达，出航条件已满足。";
  } else if (fog) {
    $("#routeReason").textContent = "雾礁岛不可达；请按提示重新选择。";
  } else {
    $("#routeReason").textContent = "选择一个当前可达的目的岛。";
  }
}

function renderResult() {
  const claimButton = $("#claimRewardButton");
  const pending = $("#pendingBalance");
  const continueButton = $("#continueButton");
  const returnButton = $("#returnHarborButton");

  claimButton.disabled = state.rewardClaimed;
  claimButton.textContent = state.rewardClaimed ? "奖励已到账" : "领取奖励";
  pending.classList.toggle("is-received", state.rewardClaimed);
  continueButton.disabled = !state.rewardClaimed;
  returnButton.disabled = !state.rewardClaimed;
  $("#rewardReason").textContent = state.rewardClaimed
    ? "邮票已到账：120 → 160。"
    : "奖励显示中，尚未到账。";
}

function render() {
  renderHeader();
  renderHarbor();
  renderMission();
  renderMailbag();
  renderMap();
  renderResult();
}

function openMission() {
  state.missionReturnTarget = "harbor";
  navigate("mission");
}

function missionPrimary() {
  if (!state.missionAccepted) {
    state.missionAccepted = true;
    showToast("委托已接取：请整理并保存蓝色信封。")
  }
  state.missionReturnTarget = "mailbag";
  navigate("mailbag");
}

function missionBack() {
  if (state.missionReturnTarget === "mailbag") {
    navigate("mailbag");
    showToast("已恢复邮袋编辑上下文，草稿与选择未丢失。")
  } else {
    navigate("harbor");
  }
}

function selectInventoryItem(item) {
  if (state.activeCategory !== "letters") return;
  state.selectedItem = item;
  state.mailbagSaved = false;
  render();
  showToast("已加入草稿；尚未保存到本次邮袋。")
}

function saveMailbag() {
  if (state.selectedItem !== "blue-envelope") return;
  state.mailbagSaved = true;
  render();
  showToast("邮袋已保存：蓝色信封 ×1。")
}

function viewMissionFromBag() {
  state.missionReturnTarget = "mailbag";
  navigate("mission");
}

function goMap() {
  if (!state.mailbagSaved) {
    showToast("草稿尚未保存，不能前往地图。")
    return;
  }
  navigate("map");
}

function selectIsland(island) {
  state.selectedIsland = island;
  render();
  if (island === "fog") {
    showToast("雾礁岛当前不可达：潮位过低。")
  } else {
    showToast("已选择可达航线：旧邮局港至蓝潮岛。")
  }
}

function recoverBlue() {
  state.selectedIsland = "blue";
  render();
  showToast("已改选蓝潮岛，航线可达。")
}

function startSailing() {
  if (!state.missionAccepted || !state.mailbagSaved || state.selectedIsland !== "blue") {
    showToast("出航条件未满足，请检查委托、邮袋与航线。")
    return;
  }
  navigate("sailing");
}

function arrive() {
  navigate("result");
  showToast("投递完成；请确认领取奖励。")
}

function claimReward() {
  if (state.rewardClaimed) return;
  state.rewardClaimed = true;
  state.stamps = 160;
  state.completed = true;
  render();
  showToast("奖励已到账：邮票 120 → 160。")
}

function returnHarbor() {
  if (!state.rewardClaimed) return;
  navigate("harbor");
  showToast("已返回港口；奖励保留，本次临时航线结束。")
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
  navigate("harbor");
  showToast("本次奖励已保留，新的委托流程已准备。")
}

const actions = {
  "open-mission": openMission,
  "mission-primary": missionPrimary,
  "mission-back": missionBack,
  "view-mission-from-bag": viewMissionFromBag,
  "save-mailbag": saveMailbag,
  "go-map": goMap,
  "recover-blue": recoverBlue,
  "map-back": () => navigate("mailbag"),
  "start-sailing": startSailing,
  arrive,
  "claim-reward": claimReward,
  "return-harbor": returnHarbor,
  "continue-task": continueTask
};

document.addEventListener("click", (event) => {
  const actionNode = event.target.closest("[data-action]");
  if (actionNode && !actionNode.disabled) {
    const action = actions[actionNode.dataset.action];
    if (action) action();
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

  const islandNode = event.target.closest("[data-island]");
  if (islandNode && !islandNode.disabled) {
    selectIsland(islandNode.dataset.island);
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.screen === "mission" && state.missionReturnTarget === "mailbag") {
    missionBack();
  }
});

const captureScreen = applyCapturePreset();
if (captureScreen) {
  navigate(captureScreen);
} else {
  render();
}
