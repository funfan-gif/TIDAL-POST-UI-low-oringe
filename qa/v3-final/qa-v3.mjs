import fs from "node:fs";
import path from "node:path";

const outputDir = "D:/游戏界面设计/TIDAL-POST-UI-low-oringe-deploy/qa/v3-final";
const screenshotDir = path.join(outputDir, "screenshots");
fs.mkdirSync(screenshotDir, { recursive: true });

class CdpClient {
  constructor(url) {
    this.url = url;
    this.sequence = 0;
    this.pending = new Map();
    this.events = [];
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const pending = this.pending.get(message.id);
        if (!pending) return;
        this.pending.delete(message.id);
        if (message.error) pending.reject(new Error(message.error.message));
        else pending.resolve(message.result);
        return;
      }
      this.events.push(message);
    };
  }

  send(method, params = {}) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    this.socket.close();
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const assertions = [];
const failures = [];

function assert(name, condition, detail = "") {
  assertions.push({ name, passed: Boolean(condition), detail });
  if (!condition) failures.push({ name, detail });
}

const target = await fetch(
  "http://127.0.0.1:9222/json/new?" + encodeURIComponent("about:blank"),
  { method: "PUT" },
).then((response) => response.json());

const client = new CdpClient(target.webSocketDebuggerUrl);
await client.connect();
await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
  client.send("Log.enable"),
  client.send("Network.enable"),
  client.send("Network.setCacheDisabled", { cacheDisabled: true }),
  client.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  }),
]);

async function evaluate(expression) {
  const result = await client.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    const description = result.exceptionDetails.exception?.description;
    throw new Error(description || result.exceptionDetails.text || "Runtime evaluation failed");
  }
  return result.result.value;
}

async function load(url) {
  await client.send("Page.navigate", { url });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    await wait(100);
    const ready = await evaluate(
      `location.href === ${JSON.stringify(url)} && document.readyState === 'complete' && Boolean(window.__tidalPost)`,
    );
    if (ready) break;
  }
  await evaluate("document.fonts.ready.then(() => true)");
  await wait(120);
}

async function click(selector) {
  const clicked = await evaluate(`(() => { const node = document.querySelector(${JSON.stringify(selector)}); if (!node) return false; node.click(); return true; })()`);
  assert("click " + selector, clicked, clicked ? "" : "selector not found");
  await wait(180);
}

async function key(type, key) {
  await evaluate(`document.dispatchEvent(new KeyboardEvent(${JSON.stringify(type)}, { key: ${JSON.stringify(key)}, bubbles: true }))`);
  await wait(80);
}

async function visibleScreen() {
  return evaluate("document.querySelector('.screen:not([hidden])')?.dataset.screen");
}

async function state() {
  return evaluate("window.__tidalPost.getState()");
}

async function screenshot(filename) {
  const shot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  fs.writeFileSync(path.join(screenshotDir, filename), Buffer.from(shot.data, "base64"));
}

const presets = [
  ["01-harbor", "harbor"],
  ["02-mission", "mission"],
  ["03-mailbag", "mailbag"],
  ["04-map", "map"],
  ["05-sailing", "sailing"],
  ["06-result", "result"],
];

for (const [preset, expected] of presets) {
  await load(`http://127.0.0.1:4173/?capture=${preset}`);
  assert("capture preset " + preset, await visibleScreen() === expected, "expected " + expected);
  await screenshot(preset + ".png");
}

// Main Flow
await load("http://127.0.0.1:4173/?debug=1");
assert("Main starts at Harbor", await visibleScreen() === "harbor");
await click("[data-action='open-mission']");
assert("Main opens Mission", await visibleScreen() === "mission");
await click("[data-action='mission-primary']");
assert("Main opens Mailbag", await visibleScreen() === "mailbag");
await click("[data-item='blue-envelope']");
await click("[data-action='save-mailbag']");
assert("Main saves correct item", (await state()).mailbagSaved === true);
await click("[data-action='go-map']");
assert("Main opens Map", await visibleScreen() === "map");
await click("[data-island='blue']");
assert("Main selects reachable island", (await state()).selectedIsland === "blue");
await click("[data-action='start-sailing']");
assert("Main opens Sailing", await visibleScreen() === "sailing");

await key("keydown", "m");
assert("Sailing map opens", await evaluate("!document.querySelector('#sailingMapOverlay').hidden"));
await key("keydown", "m");
assert("Sailing map closes", await evaluate("document.querySelector('#sailingMapOverlay').hidden"));
await key("keydown", "Escape");
assert("Sailing pauses", (await state()).sailing.paused === true);
await key("keydown", "Escape");
assert("Sailing resumes", (await state()).sailing.paused === false);

const startPosition = (await state()).sailing;
await key("keydown", "w");
await wait(23000);
await key("keyup", "w");
let sailingState = (await state()).sailing;
assert("Sailing updates real position", sailingState.x > startPosition.x + 300, JSON.stringify({ startPosition, sailingState }));
for (let attempt = 0; attempt < 12 && !sailingState.readyToDeliver; attempt += 1) {
  await wait(1000);
  sailingState = (await state()).sailing;
}
assert("Sailing reaches delivery radius", sailingState.readyToDeliver, JSON.stringify(sailingState));
await key("keydown", "e");
await wait(800);
assert("Main reaches Result", await visibleScreen() === "result");
await click("[data-action='claim-reward']");
const claimed = await state();
assert("Reward claim is explicit", claimed.rewardClaimed === true && claimed.stamps === 160, JSON.stringify(claimed));
await screenshot("flow-main-result-claimed.png");

// Return Flow
await click("[data-action='return-harbor']");
assert("Result returns to Harbor", await visibleScreen() === "harbor");
await click("[data-action='open-mission']");
await click("[data-action='mission-back']");
assert("Mission returns to Harbor", await visibleScreen() === "harbor");
await click("[data-action='open-mission']");
await click("[data-action='mission-primary']");
await click("[data-action='view-mission-from-bag']");
await click("[data-action='mission-back']");
assert("Mission remembers Mailbag return target", await visibleScreen() === "mailbag");
await click("[data-item='blue-envelope']");
await click("[data-action='save-mailbag']");
await click("[data-action='go-map']");
await click("[data-action='map-back']");
assert("Map returns to Mailbag with saved state", await visibleScreen() === "mailbag" && (await state()).mailbagSaved === true);
await screenshot("flow-return-mailbag.png");

// Failure Flow
await load("http://127.0.0.1:4173/");
await click("[data-action='open-mission']");
await click("[data-action='mission-primary']");
await click("[data-item='shell-postcard']");
await click("[data-action='save-mailbag']");
const wrongItem = await state();
assert("Wrong item cannot be saved", wrongItem.mailbagSaved === false && wrongItem.selectedItem === "shell-postcard", JSON.stringify(wrongItem));
assert("Wrong item exposes recovery copy", await evaluate("document.querySelector('#selectionFeedback').textContent.includes('任务不匹配')"));
await screenshot("flow-failure-mailbag.png");
await click("[data-item='blue-envelope']");
await click("[data-action='save-mailbag']");
await click("[data-action='go-map']");
await click("[data-island='fog']");
assert("Locked island blocks sailing", await evaluate("document.querySelector('#startSailingButton').disabled && !document.querySelector('#routeFogState').hidden"));
await screenshot("flow-failure-route.png");
await click("[data-action='recover-blue']");
assert("Failure recovery selects Blue Island", (await state()).selectedIsland === "blue" && !(await evaluate("document.querySelector('#startSailingButton').disabled")));

// Reduced motion and responsive checks
await client.send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await load("http://127.0.0.1:4173/?capture=01-harbor");
const motionDuration = await evaluate("getComputedStyle(document.querySelector('.screen.is-active')).animationDuration");
assert("Reduced motion override", motionDuration === "1e-05s" || motionDuration === "0.00001s" || motionDuration === "0.01ms", motionDuration);

for (const [width, height, name] of [[1366, 768, "1366x768"], [1440, 900, "1440x900"], [390, 844, "390x844"]]) {
  await client.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600,
  });
  await load("http://127.0.0.1:4173/?capture=01-harbor");
  const geometry = await evaluate("({ doc: document.documentElement.scrollWidth, viewport: innerWidth, bodyHeight: document.body.scrollHeight })");
  assert("Responsive width " + name, geometry.doc <= geometry.viewport + 1, JSON.stringify(geometry));
  await screenshot("responsive-" + name + ".png");
}

const consoleErrors = client.events.filter((event) =>
  event.method === "Runtime.exceptionThrown" ||
  (event.method === "Log.entryAdded" && ["error", "warning"].includes(event.params?.entry?.level))
);
const networkFailures = client.events.filter((event) =>
  event.method === "Network.loadingFailed" && !event.params?.canceled
);

assert("No console errors", consoleErrors.length === 0, JSON.stringify(consoleErrors));
assert("No network failures", networkFailures.length === 0, JSON.stringify(networkFailures));

const report = {
  generatedAt: new Date().toISOString(),
  passed: failures.length === 0,
  assertions,
  failures,
  consoleErrors,
  networkFailures,
  screenshots: fs.readdirSync(screenshotDir).sort(),
};

fs.writeFileSync(path.join(outputDir, "qa-report.json"), JSON.stringify(report, null, 2));
client.close();

console.log(JSON.stringify({
  passed: report.passed,
  assertionCount: assertions.length,
  failureCount: failures.length,
  failures,
  screenshots: report.screenshots,
}, null, 2));

if (!report.passed) process.exitCode = 1;
