const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, ".qa");
fs.mkdirSync(outDir, { recursive: true });

const url = process.argv[2] || "http://127.0.0.1:4179";
const errors = [];

async function bootPage(page) {
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForSelector("canvas", { timeout: 10000 });
}

async function main() {
  const chromePath =
    process.env.PLAYWRIGHT_CHROME ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const launchOptions = fs.existsSync(chromePath)
    ? { headless: true, executablePath: chromePath }
    : { headless: true };
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 }, deviceScaleFactor: 1 });
  await bootPage(page);
  await page.screenshot({ path: path.join(outDir, "menu-desktop.png"), fullPage: true });
  await page.click("#start-button");
  await page.waitForTimeout(800);
  await page.keyboard.down("d");
  await page.keyboard.down("s");
  await page.waitForTimeout(420);
  await page.keyboard.up("d");
  await page.keyboard.up("s");
  await page.keyboard.press("Space");
  await page.keyboard.press("e");
  await page.waitForTimeout(500);
  const desktop = await page.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const scene = window.__emberScene;
    const box = canvas.getBoundingClientRect();
    return {
      canvas: { width: box.width, height: box.height },
      hudHidden: document.querySelector("#hud").hidden,
      menuHidden: document.querySelector("#menu").hidden,
      activePlay: scene?.activePlay ?? false,
      player: scene?.player ? { x: Math.round(scene.player.x), y: Math.round(scene.player.y) } : null,
      objective: document.querySelector("#objective")?.textContent,
    };
  });
  await page.screenshot({ path: path.join(outDir, "gameplay-desktop.png"), fullPage: true });
  await page.close();

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await bootPage(mobile);
  await mobile.tap("#start-button");
  await mobile.waitForTimeout(700);
  const mobileState = await mobile.evaluate(() => {
    const canvas = document.querySelector("canvas");
    const box = canvas.getBoundingClientRect();
    return {
      canvas: { width: box.width, height: box.height },
      mobileControlsVisible: getComputedStyle(document.querySelector("#mobile-controls")).display !== "none",
      hudHidden: document.querySelector("#hud").hidden,
    };
  });
  await mobile.screenshot({ path: path.join(outDir, "gameplay-mobile.png"), fullPage: true });
  await mobile.close();
  await browser.close();

  const failed = [];
  if (errors.length) failed.push(`Console/page errors: ${errors.join(" | ")}`);
  if (desktop.canvas.width < 300 || desktop.canvas.height < 240) failed.push("Desktop canvas is too small.");
  if (desktop.hudHidden || !desktop.menuHidden || !desktop.activePlay) failed.push("Desktop start state did not activate correctly.");
  if (!desktop.player || desktop.player.x < 200) failed.push("Player did not move during keyboard smoke.");
  if (mobileState.canvas.width < 300 || mobileState.canvas.height < 500) failed.push("Mobile canvas is too small.");
  if (mobileState.hudHidden || !mobileState.mobileControlsVisible) failed.push("Mobile HUD or touch controls are not visible.");

  if (failed.length) {
    console.error(failed.join("\n"));
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        url,
        desktop,
        mobile: mobileState,
        screenshots: {
          menu: path.join(outDir, "menu-desktop.png"),
          gameplay: path.join(outDir, "gameplay-desktop.png"),
          mobile: path.join(outDir, "gameplay-mobile.png"),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
