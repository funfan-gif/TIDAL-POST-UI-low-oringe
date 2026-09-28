import fs from "node:fs";
import path from "node:path";

const outputDir = "D:/游戏界面设计/TIDAL-POST-UI-low-oringe-deploy/qa/v3-before";
fs.mkdirSync(outputDir, { recursive: true });

class CdpClient {
  constructor(url) {
    this.url = url;
    this.sequence = 0;
    this.pending = new Map();
  }

  async connect() {
    this.socket = new WebSocket(this.url);
    await new Promise((resolve, reject) => {
      this.socket.onopen = resolve;
      this.socket.onerror = reject;
    });
    this.socket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
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

const presets = [
  ["01-harbor", "harbor"],
  ["02-mission", "mission"],
  ["03-mailbag", "mailbag"],
  ["04-map", "map"],
  ["05-sailing", "sailing"],
  ["06-result", "result"],
];

const target = await fetch(
  "http://127.0.0.1:9222/json/new?" + encodeURIComponent("about:blank"),
  { method: "PUT" },
).then((response) => response.json());

const client = new CdpClient(target.webSocketDebuggerUrl);
await client.connect();
await Promise.all([
  client.send("Page.enable"),
  client.send("Runtime.enable"),
  client.send("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false,
  }),
]);

const saved = [];
for (const [preset, expectedScreen] of presets) {
  const loaded = new Promise((resolve) => {
    const listener = (event) => {
      const message = JSON.parse(event.data);
      if (message.method === "Page.loadEventFired") {
        client.socket.removeEventListener("message", listener);
        resolve();
      }
    };
    client.socket.addEventListener("message", listener);
  });
  await client.send("Page.navigate", {
    url: `http://127.0.0.1:4173/?capture=${preset}`,
  });
  await loaded;
  await client.send("Runtime.evaluate", {
    expression: "document.fonts.ready.then(() => true)",
    awaitPromise: true,
  });
  const visible = await client.send("Runtime.evaluate", {
    expression: "document.querySelector('.screen:not([hidden])')?.dataset.screen",
    returnByValue: true,
  });
  if (visible.result.value !== expectedScreen) {
    throw new Error(`Expected ${expectedScreen}, got ${visible.result.value}`);
  }
  const shot = await client.send("Page.captureScreenshot", {
    format: "png",
    fromSurface: true,
    captureBeyondViewport: false,
  });
  const filename = `${preset}.png`;
  fs.writeFileSync(path.join(outputDir, filename), Buffer.from(shot.data, "base64"));
  saved.push(filename);
}

client.close();
console.log(JSON.stringify({ saved }, null, 2));
