const fs = require("fs");
const http = require("http");
const path = require("path");

const root = path.resolve(__dirname, "..");
const bundledNodeModules = "C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function mime(file) {
  if (file.endsWith(".html")) return "text/html; charset=utf-8";
  if (file.endsWith(".css")) return "text/css; charset=utf-8";
  if (file.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (file.endsWith(".png")) return "image/png";
  if (file.endsWith(".jpg") || file.endsWith(".jpeg")) return "image/jpeg";
  if (file.endsWith(".webp")) return "image/webp";
  if (file.endsWith(".mp3")) return "audio/mpeg";
  if (file.endsWith(".wav")) return "audio/wav";
  return "application/octet-stream";
}

function staticServer() {
  const server = http.createServer((req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://127.0.0.1").pathname);
    const rel = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
    if (rel === "favicon.ico") {
      res.writeHead(204);
      res.end();
      return;
    }
    const target = path.resolve(root, rel);
    if (!target.startsWith(root) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404);
      res.end("not found");
      return;
    }
    res.writeHead(200, { "content-type": mime(target) });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

function resolvePlaywright() {
  const candidates = [
    () => require("playwright"),
    () => require(path.join(bundledNodeModules, "playwright")),
    ...(
      fs.existsSync(path.join(bundledNodeModules, ".pnpm"))
        ? fs.readdirSync(path.join(bundledNodeModules, ".pnpm"))
          .filter((entry) => /^playwright@\d/.test(entry))
          .sort()
          .reverse()
          .map((entry) => () => require(path.join(bundledNodeModules, ".pnpm", entry, "node_modules", "playwright")))
        : []
    ),
  ];
  let lastError = null;
  for (const load of candidates) {
    try {
      return load();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function closeServer(server) {
  if (typeof server.closeIdleConnections === "function") server.closeIdleConnections();
  if (typeof server.closeAllConnections === "function") server.closeAllConnections();
  await Promise.race([
    new Promise((resolve) => server.close(() => resolve())),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
}

async function run() {
  [
    "index.html",
    "style.css",
    "game.js",
    "assets/backgrounds/topdown_beach_repeatable_clean_hd.jpg",
    "assets/backgrounds/map_moonlit_lagoon_hd.jpg",
    "assets/backgrounds/map_gothic_cove_hd.jpg",
    "assets/backgrounds/map_treasure_atoll_hd.jpg",
    "assets/sprites/characters_imagen_hd_sheet.webp",
    "assets/sprites/player_skins_imagen_hd.webp",
    "assets/sprites/player_skins_imagen_hd_clean_v2.webp",
    "assets/sprites/player_skin_walkcycles_imagen_hd.webp",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean.webp",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v2.png",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v3.png",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v4.png",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v5.png",
    "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png",
    "assets/sprites/player_skin_select_imagen_hd.webp",
    "assets/sprites/player_skin_select_imagen_hd_clean_v2.webp",
    "assets/sprites/player_skin_select_imagen_hd_clean_v3.webp",
    "assets/sprites/player_skin_select_imagen_hd_clean_v4.webp",
    "assets/sprites/fighters_walkcycles_imagen_hd_source.png",
    "assets/sprites/fighters_walkcycles_imagen_hd_clean.png",
    "assets/sprites/fighters_walkcycles_imagen_hd_clean_v2.png",
    "assets/sprites/fighters_select_imagen_hd.png",
    "assets/sprites/fighter_select_actions_hd.png",
    "assets/sprites/ryu_action_sheet_imagen_hd.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v2.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v3.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v4.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_5row_source_v1.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v8.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v10.png",
    "assets/sprites/ryu_action_sheet_imagen_hd_v12.png",
    "assets/sprites/ryu_hadoken_cast_strip_imagen_hd_source_v1.png",
    "assets/sprites/ryu_hadoken_fx_imagen_hd.png",
    "assets/sprites/ryu_hadoken_fx_imagen_hd_v2.png",
    "assets/sprites/ryu_hadoken_fx_imagen_hd_v3.png",
    "assets/sprites/ryu_hadoken_fx_imagen_hd_v7.png",
    "assets/sprites/ken_action_sheet_imagen_hd_5row_source_v1.png",
    "assets/sprites/ken_action_sheet_imagen_hd_v4.png",
    "assets/sprites/ken_action_sheet_imagen_hd_v6.png",
    "assets/sprites/ken_dragon_rush_cast_strip_imagen_hd_source_v1.png",
    "assets/sprites/ken_dragon_fx_imagen_hd_v4.png",
    "assets/sprites/tatsumaki_senpukyaku_imagen_hd_source_v2.png",
    "assets/sprites/tatsumaki_senpukyaku_preview_v2.png",
    "assets/sprites/ryu_tatsumaki_spin_imagen_hd_source_v4.png",
    "assets/sprites/ryu_tatsumaki_frame9_imagen_hd_source_v1.png",
    "assets/sprites/ryu_tatsumaki_spin_preview_v4.png",
    "assets/sprites/guile_action_sheet_imagen_hd_source.png",
    "assets/sprites/guile_action_sheet_imagen_hd.png",
    "assets/sprites/guile_action_sheet_imagen_hd_clean_v2.png",
    "assets/sprites/chun_li_action_sheet_imagen_hd.png",
    "assets/sprites/chun_li_action_sheet_imagen_hd_v2.png",
    "assets/sprites/chun_li_action_sheet_imagen_hd_5row_source_v1.png",
    "assets/sprites/chun_li_action_sheet_imagen_hd_v6.png",
    "assets/sprites/chun_li_kikouken_cast_strip_imagen_hd_source_v1.png",
    "assets/sprites/chun_li_projectile_fx_imagen_hd.png",
    "assets/sprites/chun_li_projectile_fx_imagen_hd_v2.png",
    "assets/sprites/chun_li_projectile_fx_imagen_hd_v6.png",
    "assets/sprites/sam_max_duo_fixed_hd.png",
    "assets/sprites/sam_max_duo_walk_imagen_hd.webp",
    "assets/sprites/scene_items_imagen_hd_sheet.webp",
    "assets/sprites/new_sprites_imagen_hd.webp",
    "assets/sprites/enemy_anim_imagen_hd_sheet.webp",
    "assets/sprites/enemy_anim_imagen_hd_sheet_clean.png",
    "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v2.png",
    "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v3.png",
    "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v4.png",
    "assets/sprites/gothic_enemies_hd_sheet.webp",
    "assets/sprites/gothic_enemies_hd_sheet_clean.png",
    "assets/sprites/gothic_enemies_hd_sheet_clean_v2.png",
    "assets/sprites/gothic_enemy_anim_imagen_hd_source.png",
    "assets/sprites/gothic_enemy_anim_imagen_hd_clean.png",
    "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v2.png",
    "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v3.png",
    "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v4.png",
    "assets/sprites/gothic_items_hd_sheet.webp",
    "assets/sprites/gothic_props_hd_sheet.webp",
    "assets/sprites/spectral_captain_hd_sheet.webp",
    "assets/sprites/bosses/three_headed_monkey_imagen_hd.webp",
    "assets/sprites/bosses/blackbeard_imagen_hd.webp",
    "assets/sprites/bosses/three_headed_monkey_anim_imagen_hd.webp",
    "assets/sprites/bosses/blackbeard_anim_imagen_hd.webp",
    "assets/sprites/bosses/time_tentacle_anim_imagen_hd.webp",
    "assets/sprites/new_enemy_trio_imagen_hd_sheet_clean.png",
    "assets/sprites/new_enemy_trio_imagen_hd_sheet_clean_v2.png",
    "assets/sprites/platformer_enemy_anim_imagen_hd.png",
    "assets/sprites/beach-props-v2/clear_puddle.webp",
    "assets/sprites/beach-props-v2/tide_puddle.webp",
    "assets/sprites/beach-props-v2/hedge_cluster.webp",
    "assets/sprites/beach-props-v2/palm_hedge.webp",
    "assets/sprites/beach-props-v2/buried_treasure.webp",
    "assets/sprites/beach-props-v2/open_treasure_chest_imagen_hd.webp",
    "assets/sprites/beach-props-v2/conch_shrine.webp",
    "assets/sprites/beach-props-v2/beach_hut.webp",
    "assets/sprites/beach-props-v2/boat_wreck.webp",
    "assets/sprites/projectile_fx_imagen_hd.webp",
    "assets/sprites/player_effects_imagen_hd.webp",
    "assets/sprites/weapon_evolution_fx_imagen_hd.png",
    "assets/sprites/fusion_relics_imagen_hd_source.png",
    "assets/sprites/fusion_relics_imagen_hd_clean.png",
    "assets/sprites/signature_weapons_imagen_hd_source.png",
    "assets/sprites/signature_weapons_imagen_hd.png",
    "assets/sprites/sonic_boom_fx_imagen_hd.png",
    "assets/sprites/xp_crystal_anim_imagen_source.png",
    "assets/sprites/xp_crystal_anim_imagen_hd.png",
    "assets/sprites/xp_crystal_green_anim_imagen_hd.png",
    "assets/sprites/xp_crystal_red_anim_imagen_hd.png",
    "assets/sprites/extra_enemies_imagen_hd.webp",
    "assets/sprites/extra_enemies_imagen_hd_clean.png",
    "assets/sprites/extra_items_imagen_hd.webp",
    "assets/ui/parchment_panel_imagen_hd.webp",
    "assets/ui/parchment_button_imagen_hd.webp",
    "assets/ui/parchment_card_imagen_hd.webp",
    "assets/ui/parchment_scrap_imagen_hd.webp",
    "assets/audio/bgm/tidebarrel-dockside-drive.mp3",
    "assets/audio/bgm/black-chapel-gate-drive.mp3",
    "assets/audio/bgm/turbo-banana-cup-drive.mp3",
    "assets/audio/bgm/treasure-tide-route-drive.mp3",
    "assets/audio/bgm/voodoo-hut-shuffle-drive.mp3",
    "assets/audio/bgm/cathedral-hunt-overture-drive.mp3",
    "assets/audio/bgm/curse-monkey-frenzy-drive.mp3",
    "assets/audio/bgm/gargoyle-chapel-run.mp3",
    "assets/audio/bgm/crimson-galleon.mp3",
    "assets/audio/bgm/coconut-caper-loop.mp3",
    "assets/audio/bgm/shoreline-rum-riddle.mp3",
    "assets/audio/bgm/sf-ryu-dojo-crash-duel.mp3",
    "assets/audio/bgm/sf-ken-steel-punch-parade.mp3",
    "assets/audio/bgm/sf-guile-jet-fuel-glory.mp3",
    "assets/audio/bgm/sf-chun-li-bamboo-arcade.mp3",
    "assets/audio/bgm/sf-rush-gasket-thunder.mp3",
    "assets/audio/sfx/from-downloads/pickup-gem.mp3",
    "assets/audio/sfx/from-downloads/soft-chime.mp3",
    "assets/audio/sfx/from-downloads/curse-gate.mp3",
    "assets/audio/sfx/from-downloads/ui-confirm.mp3",
    "assets/audio/sfx/from-downloads/coin-pickup.mp3",
    "assets/audio/sfx/from-downloads/dash-swish.mp3",
    "assets/audio/sfx/from-downloads/cursed-hit.mp3",
    "assets/audio/sfx/from-downloads/upgrade-card.mp3",
    "assets/audio/sfx/from-downloads/boss-warning.mp3",
    "assets/audio/sfx/from-downloads/boss-down.mp3",
    "assets/audio/sfx/from-downloads/quick-cutlass.mp3",
    "assets/audio/sfx/from-downloads/cutlass-hit-goofy.mp3",
    "assets/audio/sfx/from-downloads/cartoon-cannon-fire.mp3",
    "assets/audio/sfx/from-downloads/voodoo-magic-pop.mp3",
    "assets/audio/sfx/from-downloads/bright-gem-pickup.mp3",
    "assets/audio/sfx/from-downloads/doubloon-ping.mp3",
    "assets/audio/sfx/from-downloads/healing-sparkle.mp3",
    "assets/audio/sfx/from-downloads/treasure-clink.mp3",
    "assets/audio/sfx/from-downloads/parchment-map-unroll.mp3",
    "assets/audio/sfx/from-downloads/cursed-boss-drop.mp3",
    "assets/audio/sfx/from-downloads/ghost-anchor-hit.mp3",
    "assets/audio/sfx/from-downloads/sea-monster-pop.mp3",
    "assets/audio/sfx/from-downloads/dash-whoosh-fast.mp3",
    "assets/audio/sfx/from-downloads/pirate-ui-click.mp3",
    "assets/audio/sfx/from-downloads/treasure-map-magic.mp3",
    "assets/audio/sfx/downloaded/haunted-pirate-swish.mp3",
    "assets/audio/sfx/downloaded/cartoon-pirate-pop.mp3",
    "assets/audio/sfx/downloaded/heavy-cursed-hit.mp3",
    "assets/audio/sfx/downloaded/magical-upgrade-card.mp3",
    "assets/audio/sfx/downloaded/cursed-boss-warning.mp3",
    "assets/audio/sfx/downloaded/undead-pirate-down.mp3",
    "assets/audio/sfx/curse-monkey/bone-swipe.mp3",
    "assets/audio/sfx/curse-monkey/fast-dash-whoosh.mp3",
    "assets/audio/sfx/curse-monkey/purple-curse-hit.mp3",
    "assets/audio/sfx/curse-monkey/tropical-chatter.mp3",
    "assets/audio/sfx/curse-monkey/pirate-powerup.mp3",
    "assets/audio/sfx/curse-monkey/spooky-warning.mp3",
    "assets/audio/sfx/curse-monkey/boss-drop.mp3",
    "tools/prepare_fusion_relic_assets.py",
    "tools/prepare_signature_weapon_assets.py",
    "tools/prepare_guile_action_assets.py",
    "tools/prepare_ryu_action_assets.py",
    "tools/prepare_complex_fighter_action_assets.py",
    "tools/prepare_sonic_boom_assets.py",
    "tools/prepare_chun_li_action_assets.py",
    "tools/prepare_ryu_tatsumaki_spin_assets.py",
    "tools/build_xp_crystal_variants.py",
    "tools/repair_fighter_gargoyle_slicing.py",
    "tools/repair_enemy_slicing.py",
    "tools/repair_remaining_enemy_slicing.py",
  ].forEach((rel) => {
    const target = path.join(root, rel);
    assert(fs.existsSync(target), `Missing ${rel}`);
    assert(fs.statSync(target).size > 500, `${rel} looks empty`);
  });

  const css = fs.readFileSync(path.join(root, "style.css"), "utf8");
  assert(css.includes("parchment_panel_imagen_hd.webp") && css.includes("parchment_button_imagen_hd.webp"), "Parchment UI assets are not wired into CSS");

  const { chromium } = resolvePlaywright();
  const server = await staticServer();
  const port = server.address().port;
  const url = `http://127.0.0.1:${port}/index.html`;
  const chromeCandidates = [
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
    "C:/Users/User/AppData/Local/Google/Chrome/Application/chrome.exe",
  ];
  const executablePath = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  const browser = await chromium.launch({
    headless: true,
    executablePath,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const page = await browser.newPage({ viewport: { width: 1366, height: 768 } });
  const consoleErrors = [];
  const pageErrors = [];
  const badResponses = [];
  page.on("console", (msg) => {
    const text = msg.text();
    if (msg.type() === "error" && !text.includes("WebAudio renderer")) consoleErrors.push(text);
  });
  page.on("pageerror", (err) => pageErrors.push(err.message));
  page.on("response", (res) => {
    if (res.status() >= 400) badResponses.push(`${res.status()} ${res.url()}`);
  });

  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForFunction(() => window.__MONKEY_TIDE_READY === true, null, { timeout: 90000 });
  const hedgeAlphaProbe = await page.evaluate(async () => {
    const results = [];
    for (const src of [
      "assets/sprites/beach-props-v2/hedge_cluster.webp?alpha-clean",
      "assets/sprites/beach-props-v2/palm_hedge.webp?alpha-clean",
    ]) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let edgeAlpha = 0;
      let visible = 0;
      let minX = canvas.width;
      let minY = canvas.height;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 8) {
            visible += 1;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) edgeAlpha += 1;
          }
        }
      }
      results.push({ src, size: [canvas.width, canvas.height], edgeAlpha, visible, bbox: [minX, minY, maxX, maxY] });
    }
    return results;
  });
  assert(hedgeAlphaProbe.every((asset) => asset.edgeAlpha === 0 && asset.visible > 10000 && asset.bbox[0] > 0 && asset.bbox[1] > 0 && asset.bbox[2] < asset.size[0] - 1 && asset.bbox[3] < asset.size[1] - 1), `Hedge assets still look sliced at the alpha edge: ${JSON.stringify(hedgeAlphaProbe)}`);
  const readMenuFit = () => {
    const panel = document.querySelector("#startOverlay .start-panel");
    const start = document.getElementById("startButton");
    const panelRect = panel.getBoundingClientRect();
    const startRect = start.getBoundingClientRect();
    const style = getComputedStyle(panel);
    return {
      viewport: { w: innerWidth, h: innerHeight },
      panel: { top: panelRect.top, bottom: panelRect.bottom, height: panelRect.height, scrollHeight: panel.scrollHeight, overflowY: style.overflowY },
      startVisible: startRect.bottom <= panelRect.bottom + 1 && startRect.top >= panelRect.top - 1,
    };
  };
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(100);
  const portraitMenu = await page.evaluate(readMenuFit);
  assert(portraitMenu.panel.top >= -1 && portraitMenu.panel.bottom <= portraitMenu.viewport.h + 1 && portraitMenu.panel.overflowY !== "visible", `Portrait mobile menu is clipped: ${JSON.stringify(portraitMenu)}`);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(100);
  const landscapeMenu = await page.evaluate(readMenuFit);
  assert(landscapeMenu.panel.top >= -1 && landscapeMenu.panel.bottom <= landscapeMenu.viewport.h + 1 && landscapeMenu.startVisible, `Landscape mobile menu is clipped: ${JSON.stringify(landscapeMenu)}`);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(100);
  const skinUi = await page.evaluate(() => Array.from(document.querySelectorAll("#skinPicker [data-skin]")).map((button) => ({
    id: button.dataset.skin,
    checked: button.getAttribute("aria-checked") === "true",
    label: button.textContent.trim(),
  })));
  assert(skinUi.length >= 7, `Player skin picker is missing options: ${JSON.stringify(skinUi)}`);
  assert(skinUi.some((skin) => skin.id === "curseMonkey") && skinUi.some((skin) => skin.id === "freelanceDuo"), `Requested alternate skins missing: ${JSON.stringify(skinUi)}`);
  assert(JSON.stringify(skinUi.slice(0, 5).map((skin) => skin.id)) === JSON.stringify(["default", "ryu", "ken", "guile", "chunLi"]), `Fighter skins should be immediately visible near the top of the picker: ${JSON.stringify(skinUi)}`);
  const fighterUi = await page.evaluate(() => {
    return ["ryu", "ken", "guile", "chunLi"].map((id) => {
    const button = document.querySelector(`[data-skin="${id}"]`);
    const icon = button?.querySelector(".skin-icon");
    const rect = button?.getBoundingClientRect();
    const style = icon ? getComputedStyle(icon) : null;
    return {
      id,
      exists: !!button,
      archetype: button?.dataset.archetype,
      label: button?.textContent.trim(),
      actionSelectSheet: style ? style.backgroundImage.includes("fighter_select_actions_hd.png") : false,
      oldSelectSheet: style ? style.backgroundImage.includes("fighters_select_imagen_hd.png") : false,
      backgroundSize: style?.backgroundSize || "",
      visible: rect ? rect.width > 30 && rect.height > 30 && rect.bottom > 0 && rect.top < innerHeight : false,
    };
    });
  });
  assert(fighterUi.every((skin) => skin.exists && skin.archetype === "Fighter" && skin.actionSelectSheet && !skin.oldSelectSheet && skin.backgroundSize.includes("400%") && skin.visible), `Fighter picker cards should use the new action-frame select atlas: ${JSON.stringify(fighterUi)}`);
  const pickerUsesSelectSheet = await page.evaluate(() => getComputedStyle(document.querySelector("#skinPicker .skin-icon")).backgroundImage.includes("player_skin_select_imagen_hd_clean_v4.webp"));
  assert(pickerUsesSelectSheet, "Character picker is not using the cleaned first-sheet selection atlas");
  const freelanceDuoUsesFixedCrop = await page.evaluate(() => getComputedStyle(document.querySelector('[data-skin="freelanceDuo"] .skin-icon')).backgroundImage.includes("sam_max_duo_fixed_hd.png"));
  assert(freelanceDuoUsesFixedCrop, "Sam and Max/Freelance Duo picker is still using the bad sliced atlas cell");
  const signatureProbe = await page.evaluate(() => window.__MONKEY_TIDE_DEBUG().playerSkinTypes.map((id) => window.__MONKEY_TIDE_SIGNATURE_PROBE(id)));
  assert(
    signatureProbe.length >= 11
      && signatureProbe.every((probe) => probe.signature && probe.assetLoaded && probe.frames.rows >= 11 && Number.isFinite(probe.visualRow) && probe.casts >= 1 && (probe.signatureProjectiles > 0 || probe.zones > 0 || probe.enemiesDamaged > 0)),
    `Every character should fire a distinct signature weapon from the HD sheet: ${JSON.stringify(signatureProbe)}`,
  );
  const ryuActionProbe = await page.evaluate(() => window.__MONKEY_TIDE_RYU_ACTION_PROBE());
  assert(
    ryuActionProbe.assetLoaded
      && ryuActionProbe.source.includes("ryu_action_sheet_imagen_hd_v12.png")
      && ryuActionProbe.frames.rows === 5
      && ryuActionProbe.frames.frames === 12
      && ryuActionProbe.hadokenFxLoaded
      && ryuActionProbe.hadokenFxSource.includes("ryu_hadoken_fx_imagen_hd_v7.png")
      && ryuActionProbe.hadokenFxFrames.rows === 4
      && ryuActionProbe.hadokenFxFrames.frames === 12
      && ryuActionProbe.rows.walk === 0
      && ryuActionProbe.rows.hadoken === 1
      && ryuActionProbe.rows.shoryuken === 2
      && ryuActionProbe.rows.whirlwindKick === 3
      && ryuActionProbe.rows.focusStance === 4
      && ryuActionProbe.weaponDisplay.name === "Hadoken"
      && ryuActionProbe.upgradeDisplay.name === "Hadoken Loop"
      && ryuActionProbe.arsenal.weaponHadokens >= 8
      && ryuActionProbe.arsenal.hadokens >= 13
      && ryuActionProbe.arsenal.shoryukens >= 1
      && ryuActionProbe.arsenal.whirlwindKicks >= 1
      && ryuActionProbe.hadokenProjectiles.length >= 1
      && ryuActionProbe.hadokenProjectiles.some((projectile) => projectile.stage === 3 && projectile.size >= 130 && projectile.radius >= 35 && projectile.speed >= 1050)
      && ryuActionProbe.hadokenProjectiles.every((projectile) => projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed)
      && ryuActionProbe.hadokenBursts >= 1
      && ryuActionProbe.slashZones === 0
      && ryuActionProbe.ryuZones.some((zone) => zone.type === "ryuStrike" && zone.move === "shoryuken")
      && ryuActionProbe.ryuZones.some((zone) => zone.type === "ryuWhirlwind" && zone.move === "whirlwindKick" && zone.spinKick)
      && ryuActionProbe.currentAction?.type === "whirlwindKick"
      && ryuActionProbe.currentAction?.forceWhileMoving === true
      && ryuActionProbe.currentAction?.lockAction === true
      && ryuActionProbe.iconStyleUsesHadokenSheet,
    `Ryu should visibly hold the Whirlwind Kick action even while moving: ${JSON.stringify(ryuActionProbe)}`,
  );
  const kenActionProbe = await page.evaluate(() => window.__MONKEY_TIDE_KEN_ACTION_PROBE());
  assert(
    kenActionProbe.assetLoaded
      && kenActionProbe.source.includes("ken_action_sheet_imagen_hd_v6.png")
      && kenActionProbe.frames.rows === 5
      && kenActionProbe.frames.frames === 12
      && kenActionProbe.dragonFxLoaded
      && kenActionProbe.dragonFxSource.includes("ken_dragon_fx_imagen_hd_v4.png")
      && kenActionProbe.dragonFxFrames.rows === 3
      && kenActionProbe.dragonFxFrames.frames === 12
      && kenActionProbe.rows.walk === 0
      && kenActionProbe.rows.stepKick === 1
      && kenActionProbe.rows.hadoken === 1
      && kenActionProbe.rows.shoryuken === 2
      && kenActionProbe.rows.dragonPunch === 2
      && kenActionProbe.rows.tatsuKick === 3
      && kenActionProbe.rows.whirlwindKick === 3
      && kenActionProbe.rows.dragonKick === 4
      && kenActionProbe.fxRows.stepKick === 0
      && kenActionProbe.fxRows.shoryuken === 1
      && kenActionProbe.fxRows.dragonPunch === 1
      && kenActionProbe.fxRows.tatsuKick === 2
      && kenActionProbe.fxRows.whirlwindKick === 2
      && kenActionProbe.fxRows.dragonKick === 2
      && kenActionProbe.weaponDisplay.name === "Dragon Rush"
      && kenActionProbe.upgradeDisplay.name === "Dragon Rush Mix"
      && kenActionProbe.arsenal.stepKicks >= 1
      && kenActionProbe.arsenal.hadokens >= 8
      && kenActionProbe.arsenal.shoryukens >= 4
      && kenActionProbe.arsenal.dragonPunches >= 3
      && kenActionProbe.arsenal.tatsuKicks >= 2
      && kenActionProbe.arsenal.whirlwindKicks >= 1
      && kenActionProbe.arsenal.dragonKicks >= 1
      && kenActionProbe.kenHadokens.length >= 8
      && kenActionProbe.kenHadokens.every((projectile) => projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed)
      && kenActionProbe.kenZones.some((zone) => zone.type === "kenStrike" && zone.move === "dragonPunch")
      && kenActionProbe.kenZones.some((zone) => zone.type === "kenStrike" && zone.move === "stepKick")
      && kenActionProbe.kenZones.some((zone) => zone.type === "kenWhirlwind" && zone.move === "whirlwindKick" && zone.spinKick)
      && kenActionProbe.kenZones.some((zone) => zone.type === "kenStrike" && zone.move === "dragonKick")
      && kenActionProbe.kenZones.some((zone) => zone.signature === "shoryuken")
      && kenActionProbe.slashZones === 0
      && kenActionProbe.iconStyleUsesDragonSheet,
    `Ken should throw more Hadokens, land Shoryukens, and show the Whirlwind Kick animation in the Dragon Rush kit: ${JSON.stringify(kenActionProbe)}`,
  );
  const guileActionProbe = await page.evaluate(() => window.__MONKEY_TIDE_GUILE_ACTION_PROBE());
  assert(
    guileActionProbe.assetLoaded
      && guileActionProbe.source.includes("guile_action_sheet_imagen_hd_clean_v2.png")
      && guileActionProbe.frames.rows === 5
      && guileActionProbe.frames.frames === 8
      && guileActionProbe.sonicBoomFxLoaded
      && guileActionProbe.sonicBoomFxSource.includes("sonic_boom_fx_imagen_hd.png")
      && guileActionProbe.sonicBoomFrames.rows === 4
      && guileActionProbe.sonicBoomFrames.frames === 8
      && guileActionProbe.rows.walk === 0
      && guileActionProbe.rows.sonicBoom === 1
      && guileActionProbe.rows.kneeBazooka === 2
      && guileActionProbe.rows.reversePunch === 3
      && guileActionProbe.rows.flashKick === 4
      && guileActionProbe.weaponDisplay.name === "Sonic Boom"
      && guileActionProbe.upgradeDisplay.name === "Sonic Boom Drill"
      && guileActionProbe.signatureProjectiles >= 7
      && guileActionProbe.sonicProjectiles.every((projectile) => projectile.stage === 3 && projectile.size >= 150 && projectile.radius >= 32 && projectile.speed >= 980)
      && guileActionProbe.sonicProjectiles.every((projectile) => projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed)
      && guileActionProbe.sonicBursts >= 1
      && guileActionProbe.slashZones === 0
      && guileActionProbe.guileZones >= 4
      && guileActionProbe.arsenal.kneeBazookas >= 2
      && guileActionProbe.arsenal.reversePunches >= 1
      && guileActionProbe.arsenal.flashKicks >= 1,
    `Guile should use the new exact-frame action sheet and Sonic Boom base kit: ${JSON.stringify(guileActionProbe)}`,
  );
  const chunLiActionProbe = await page.evaluate(() => window.__MONKEY_TIDE_CHUN_LI_ACTION_PROBE());
  assert(
    chunLiActionProbe.assetLoaded
      && chunLiActionProbe.source.includes("chun_li_action_sheet_imagen_hd_v6.png")
      && chunLiActionProbe.frames.rows === 5
      && chunLiActionProbe.frames.frames === 12
      && chunLiActionProbe.projectileAssetLoaded
      && chunLiActionProbe.projectileSource.includes("chun_li_projectile_fx_imagen_hd_v6.png")
      && chunLiActionProbe.projectileFrames.rows === 3
      && chunLiActionProbe.projectileFrames.frames === 12
      && chunLiActionProbe.rows.walk === 0
      && chunLiActionProbe.rows.thousandKick === 1
      && chunLiActionProbe.rows.kiKouKen === 2
      && chunLiActionProbe.rows.whirlwindKick === 3
      && chunLiActionProbe.rows.lightningKick === 4
      && chunLiActionProbe.projectileRows.kiKouKen === 0
      && chunLiActionProbe.projectileRows.thousandKickArc === 1
      && chunLiActionProbe.projectileRows.whirlwindKickArc === 2
      && chunLiActionProbe.weaponDisplay.name === "Thousand Kick"
      && chunLiActionProbe.upgradeDisplay.name === "Thousand Kick Loop"
      && chunLiActionProbe.arsenal.thousandKicks >= 4
      && chunLiActionProbe.arsenal.kiKouKens >= 5
      && chunLiActionProbe.arsenal.whirlwindKicks >= 1
      && chunLiActionProbe.arsenal.lightningKicks >= 1
      && chunLiActionProbe.kiKouKenProjectiles.length >= 1
      && chunLiActionProbe.kiKouKenProjectiles.every((projectile) => projectile.size >= 108 && projectile.radius >= 24 && projectile.speed >= 760)
      && chunLiActionProbe.kiKouKenProjectiles.every((projectile) => projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed)
      && chunLiActionProbe.chunLiZones.some((zone) => zone.type === "chunLiKick" && zone.move === "thousandKick")
      && chunLiActionProbe.chunLiZones.some((zone) => zone.type === "chunLiWhirlwind" && zone.move === "whirlwindKick" && zone.spinKick)
      && chunLiActionProbe.chunLiZones.some((zone) => zone.type === "chunLiProjectileBurst" && zone.fx === "kiKouKen")
      && chunLiActionProbe.slashZones === 0
      && chunLiActionProbe.iconStyleUsesProjectileSheet,
    `Chun Li should use Ki Kou Ken, Thousand Kick, Whirlwind Kick, and dedicated projectile frames: ${JSON.stringify(chunLiActionProbe)}`,
  );
  const streetFighterIdleProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREET_FIGHTER_IDLE_PROBE());
  assert(
    streetFighterIdleProbe.ryu?.currentAction?.type === "shoryuken"
      && streetFighterIdleProbe.ken?.currentAction?.type === "hadoken"
      && streetFighterIdleProbe.guile?.currentAction?.type === "kneeBazooka"
      && streetFighterIdleProbe.chunLi?.currentAction?.type === "thousandKick"
      && Object.entries(streetFighterIdleProbe).every(([skinId, probe]) => probe.contactCounters?.[skinId] === 1 && probe.idleShare >= 0.18 && probe.idleShare <= 0.26 && probe.ambientActions.length >= 3 && (probe.zones.length + (probe.projectiles?.length || 0)) >= 1 && probe.contactHit === true && probe.playerDamaged === false && probe.invuln > 0),
    `Street Fighter skins should idle actively and counter on standing contact: ${JSON.stringify(streetFighterIdleProbe)}`,
  );
  const kenContactFlowProbe = await page.evaluate(() => window.__MONKEY_TIDE_KEN_CONTACT_FLOW_PROBE());
  const kenContactMoves = kenContactFlowProbe.steps.map((step) => step.action?.type);
  assert(
    JSON.stringify(kenContactMoves) === JSON.stringify(["hadoken", "shoryuken", "whirlwindKick"])
      && kenContactFlowProbe.rows.whirlwindKick === 3
      && kenContactFlowProbe.fxRows.whirlwindKick === 2
      && kenContactFlowProbe.steps.every((step, index) => step.triggered && step.count === index + 1 && step.contactDamage === true)
      && kenContactFlowProbe.steps[0].projectiles.some((projectile) => projectile.id === "hadoken" && projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed && projectile.retarget === false)
      && kenContactFlowProbe.steps[1].zones.some((zone) => zone.type === "kenStrike" && zone.move === "shoryuken")
      && kenContactFlowProbe.steps[2].zones.some((zone) => zone.type === "kenWhirlwind" && zone.move === "whirlwindKick" && zone.fx === "whirlwindKick" && zone.spinKick)
      && kenContactFlowProbe.arsenal.hadokens >= 1
      && kenContactFlowProbe.arsenal.shoryukens >= 1
      && kenContactFlowProbe.arsenal.whirlwindKicks >= 1,
    `Ken contact counter should flow Hadoken -> Shoryuken -> Whirlwind Kick: ${JSON.stringify(kenContactFlowProbe)}`,
  );
  const streetFighterPeacefulIdleProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREET_FIGHTER_PEACEFUL_IDLE_PROBE());
  assert(
    Object.entries(streetFighterPeacefulIdleProbe).every(([skinId, probe]) => (
      probe.peaceful === true
        && probe.bounceOnly === true
        && probe.weaponSkipped === true
        && probe.fireballs?.[skinId] === 1
        && probe.projectile
        && probe.projectile.vy === 0
        && Math.abs(probe.projectile.vx) === probe.projectile.speed
        && probe.projectile.retarget === false
    )),
    `Peaceful Street Fighter idle should only foot-bounce and occasionally throw a horizontal fireball: ${JSON.stringify(streetFighterPeacefulIdleProbe)}`,
  );
  const streetFighterStarterProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREET_FIGHTER_STARTER_KIT_PROBE());
  assert(
    Object.values(streetFighterStarterProbe).every((probe) => probe.moves.length === 1 && probe.moves[0] === probe.starter && probe.startupActions.length === 1 && probe.startupActions[0] === probe.starter && probe.allAmbientActions.length >= 3),
    `Street Fighter starters should expose exactly one move before upgrades: ${JSON.stringify(streetFighterStarterProbe)}`,
  );
  const fireballStageProbe = await page.evaluate(() => window.__MONKEY_TIDE_FIREBALL_STAGE_PROBE());
  const keepsHorizontal = (shots) => shots.every((projectile) => projectile && projectile.vy === 0 && Math.abs(projectile.vx) === projectile.speed);
  const hasSteppedSizes = (shots) => {
    const sizes = shots.map((projectile) => projectile.size);
    return sizes.every((size, index) => index === 0 || size >= sizes[index - 1])
      && sizes[0] === sizes[1]
      && sizes[2] === sizes[3]
      && sizes[4] === sizes[5]
      && sizes[6] > sizes[4]
      && new Set(sizes).size >= 3;
  };
  const hasThreeStepSizes = (shots) => {
    const sizes = shots.map((projectile) => projectile.size);
    return sizes.every((size, index) => index === 0 || size >= sizes[index - 1])
      && sizes[0] === sizes[1]
      && sizes[1] === sizes[2]
      && sizes[3] === sizes[4]
      && sizes[4] === sizes[5]
      && sizes[6] > sizes[5]
      && new Set(sizes).size === 3;
  };
  assert(
    keepsHorizontal(fireballStageProbe.ryu)
      && keepsHorizontal(fireballStageProbe.guile)
      && keepsHorizontal(fireballStageProbe.chunLi)
      && hasSteppedSizes(fireballStageProbe.ryu)
      && hasSteppedSizes(fireballStageProbe.guile)
      && hasThreeStepSizes(fireballStageProbe.chunLi)
      && fireballStageProbe.ryu.at(-1).size >= 140
      && fireballStageProbe.guile.at(-1).size >= 150
      && fireballStageProbe.chunLi.at(-1).size >= 126,
    `Fighter fireballs should stay horizontal and grow only by upgrade stage into EX-sized variants: ${JSON.stringify(fireballStageProbe)}`,
  );
  const streetFighterExFlowProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREET_FIGHTER_EX_FLOW_PROBE());
  assert(
    Object.values(streetFighterExFlowProbe).every((probe) => (
      probe.projectile
        && probe.projectile.ex === true
        && probe.projectile.vy === 0
        && Math.abs(probe.projectile.vx) === probe.projectile.speed
        && probe.projectile.size > probe.base.size
        && probe.projectile.radius > probe.base.radius
        && probe.projectile.pierce >= 1
        && probe.exFlash >= 1
        && probe.totalEx >= 1
        && probe.chain === 0
        && probe.charges === 0
    )),
    `Street Fighter combo flow should charge and spend a visible EX projectile: ${JSON.stringify(streetFighterExFlowProbe)}`,
  );
  const guileSonicAssetProbe = await page.evaluate(async () => {
    async function scanSheet(src, frameW, frameH, cols, rows) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = frameW;
      canvas.height = frameH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const frames = [];
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          ctx.clearRect(0, 0, frameW, frameH);
          ctx.drawImage(img, col * frameW, row * frameH, frameW, frameH, 0, 0, frameW, frameH);
          const data = ctx.getImageData(0, 0, frameW, frameH).data;
          let visible = 0;
          let edgeAlpha = 0;
          let lowAlpha = 0;
          for (let y = 0; y < frameH; y += 1) {
            for (let x = 0; x < frameW; x += 1) {
              const index = (y * frameW + x) * 4;
              const alpha = data[index + 3];
              if (alpha > 8) {
                visible += 1;
                if (x === 0 || y === 0 || x === frameW - 1 || y === frameH - 1) edgeAlpha += 1;
              }
              if (alpha > 0 && alpha <= 28) lowAlpha += 1;
            }
          }
          frames.push({ row, col, visible, edgeAlpha, lowAlpha });
        }
      }
      return { size: [img.naturalWidth, img.naturalHeight], frames };
    }
    return {
      ryu: await scanSheet("assets/sprites/ryu_action_sheet_imagen_hd_v12.png?ryu-tatsumaki-v4-probe", 256, 256, 12, 5),
      ryuHadoken: await scanSheet("assets/sprites/ryu_hadoken_fx_imagen_hd_v7.png?ryu-hadoken-v7-probe", 256, 256, 12, 4),
      ken: await scanSheet("assets/sprites/ken_action_sheet_imagen_hd_v6.png?ken-tatsumaki-v2-probe", 256, 256, 12, 5),
      kenDragon: await scanSheet("assets/sprites/ken_dragon_fx_imagen_hd_v4.png?ken-dragon-v4-probe", 256, 256, 12, 3),
      guile: await scanSheet("assets/sprites/guile_action_sheet_imagen_hd_clean_v2.png?guile-clean-v2-probe", 256, 256, 8, 5),
      sonic: await scanSheet("assets/sprites/sonic_boom_fx_imagen_hd.png?sonic-boom-probe", 256, 256, 8, 4),
      chunLi: await scanSheet("assets/sprites/chun_li_action_sheet_imagen_hd_v6.png?chun-li-action-v6-probe", 256, 256, 12, 5),
      chunLiProjectiles: await scanSheet("assets/sprites/chun_li_projectile_fx_imagen_hd_v6.png?chun-li-projectile-v6-probe", 256, 256, 12, 3),
    };
  });
  assert(
    guileSonicAssetProbe.ryu.size[0] === 3072
      && guileSonicAssetProbe.ryu.size[1] === 1280
      && guileSonicAssetProbe.ryu.frames.every((frame) => frame.visible > 7500 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Ryu action frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.ryu)}`,
  );
  assert(
    guileSonicAssetProbe.ryuHadoken.size[0] === 3072
      && guileSonicAssetProbe.ryuHadoken.size[1] === 1024
      && guileSonicAssetProbe.ryuHadoken.frames.every((frame) => frame.visible > 900 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Ryu Hadoken frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.ryuHadoken)}`,
  );
  assert(
    guileSonicAssetProbe.ken.size[0] === 3072
      && guileSonicAssetProbe.ken.size[1] === 1280
      && guileSonicAssetProbe.ken.frames.every((frame) => frame.visible > 7500 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Ken action frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.ken)}`,
  );
  assert(
    guileSonicAssetProbe.kenDragon.size[0] === 3072
      && guileSonicAssetProbe.kenDragon.size[1] === 768
      && guileSonicAssetProbe.kenDragon.frames.every((frame) => frame.visible > 2500 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Ken Dragon FX frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.kenDragon)}`,
  );
  assert(
    guileSonicAssetProbe.guile.size[0] === 2048
      && guileSonicAssetProbe.guile.size[1] === 1280
      && guileSonicAssetProbe.guile.frames.every((frame) => frame.visible > 9000 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Clean Guile action frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.guile)}`,
  );
  const sonicRows = [0, 1, 2, 3].map((row) => guileSonicAssetProbe.sonic.frames.filter((frame) => frame.row === row));
  assert(
    guileSonicAssetProbe.sonic.size[0] === 2048
      && guileSonicAssetProbe.sonic.size[1] === 1024
      && guileSonicAssetProbe.sonic.frames.every((frame) => frame.visible > 12000 && frame.edgeAlpha === 0)
      && Math.min(...sonicRows[3].map((frame) => frame.visible)) > Math.max(...sonicRows[0].map((frame) => frame.visible)),
    `Sonic Boom upgrade frames are not clean or staged: ${JSON.stringify(guileSonicAssetProbe.sonic)}`,
  );
  assert(
    guileSonicAssetProbe.chunLi.size[0] === 3072
      && guileSonicAssetProbe.chunLi.size[1] === 1280
      && guileSonicAssetProbe.chunLi.frames.every((frame) => frame.visible > 9000 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Chun Li action frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.chunLi)}`,
  );
  assert(
    guileSonicAssetProbe.chunLiProjectiles.size[0] === 3072
      && guileSonicAssetProbe.chunLiProjectiles.size[1] === 768
      && guileSonicAssetProbe.chunLiProjectiles.frames.every((frame) => frame.visible > 1200 && frame.edgeAlpha === 0 && frame.lowAlpha === 0),
    `Chun Li projectile frames still have slicing artifacts: ${JSON.stringify(guileSonicAssetProbe.chunLiProjectiles)}`,
  );
  await page.click('[data-skin="freelanceDuo"]');
  const pickedDuoSkin = await page.evaluate(() => window.__MONKEY_TIDE_DEBUG());
  assert(pickedDuoSkin.playerSkin === "freelanceDuo" && pickedDuoSkin.playerSkinAnimated === true && pickedDuoSkin.playerSkinDuoWalkAsset === true, `Sam and Max/Freelance Duo runtime is not using the walk animation sheet: ${JSON.stringify(pickedDuoSkin)}`);
  assert(pickedDuoSkin.playerSkinDuoWalkFrames.frames === 8 && pickedDuoSkin.playerSkinDuoWalkFrames.w === 384 && pickedDuoSkin.playerSkinDuoWalkFrames.h === 512, `Sam and Max/Freelance Duo walk frames are misconfigured: ${JSON.stringify(pickedDuoSkin.playerSkinDuoWalkFrames)}`);
  const duoWalkProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/sam_max_duo_walk_imagen_hd.webp?alpha-clean";
    await img.decode();
    const frameW = 384;
    const frameH = 512;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const frames = [];
    for (let frame = 0; frame < 8; frame += 1) {
      const data = ctx.getImageData(frame % 4 * frameW, Math.floor(frame / 4) * frameH, frameW, frameH).data;
      let edgeAlpha = 0;
      let visible = 0;
      let sampleHash = 0;
      for (let y = 0; y < frameH; y += 1) {
        for (let x = 0; x < frameW; x += 1) {
          const index = (y * frameW + x) * 4;
          const alpha = data[index + 3];
          if (alpha > 8) {
            visible += 1;
            if (x === 0 || y === 0 || x === frameW - 1 || y === frameH - 1) edgeAlpha += 1;
          }
          if (x % 17 === 0 && y % 19 === 0) sampleHash = (sampleHash + data[index] * 3 + data[index + 1] * 5 + data[index + 2] * 7 + alpha * 11) % 1000003;
        }
      }
      frames.push({ frame, edgeAlpha, visible, sampleHash });
    }
    return { size: [canvas.width, canvas.height], frames };
  });
  assert(duoWalkProbe.size[0] === 1536 && duoWalkProbe.size[1] === 1024, `Sam and Max/Freelance Duo walk sheet has the wrong dimensions: ${JSON.stringify(duoWalkProbe)}`);
  assert(duoWalkProbe.frames.every((frame) => frame.edgeAlpha === 0 && frame.visible > 40000), `Sam and Max/Freelance Duo walk frames are still sliced: ${JSON.stringify(duoWalkProbe)}`);
  assert(new Set(duoWalkProbe.frames.map((frame) => frame.sampleHash)).size >= 4, `Sam and Max/Freelance Duo walk frames do not vary enough: ${JSON.stringify(duoWalkProbe)}`);
  await page.click('[data-skin="curseMonkey"]');
  const pickedSkin = await page.evaluate(() => document.querySelector('[data-skin="curseMonkey"]')?.getAttribute("aria-checked"));
  assert(pickedSkin === "true", `Skin picker did not select curseMonkey: ${pickedSkin}`);
  const mapUi = await page.evaluate(() => Array.from(document.querySelectorAll("#mapPicker [data-map]")).map((button) => ({
    id: button.dataset.map,
    checked: button.getAttribute("aria-checked") === "true",
    locked: button.disabled,
    label: button.textContent.trim(),
  })));
  assert(mapUi.length >= 4 && mapUi.filter((map) => !map.locked).length >= 2, `Map picker is missing variants or default unlocks: ${JSON.stringify(mapUi)}`);
  await page.click('[data-map="moonlitLagoon"]');
  const pickedMap = await page.evaluate(() => document.querySelector('[data-map="moonlitLagoon"]')?.getAttribute("aria-checked"));
  assert(pickedMap === "true", `Map picker did not select moonlitLagoon: ${pickedMap}`);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.evaluate(() => {
    window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED = false;
    window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS = [];
    document.documentElement.requestFullscreen = () => {
      window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED = true;
      return Promise.resolve();
    };
    try {
      Object.defineProperty(document, "fullscreenEnabled", { configurable: true, get: () => true });
    } catch {}
    const lock = async (mode) => window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS.push(mode);
    if (!screen.orientation) {
      Object.defineProperty(screen, "orientation", {
        configurable: true,
        value: { type: "portrait-primary", lock },
      });
    } else {
      try {
        Object.defineProperty(screen.orientation, "lock", { configurable: true, value: lock });
      } catch {
        screen.orientation.lock = lock;
      }
    }
  });
  await page.click("#quickButton");
  await page.waitForTimeout(500);
  const mobileStartDisplay = await page.evaluate(() => ({
    debug: window.__MONKEY_TIDE_DEBUG(),
    fullscreenRequested: window.__MONKEY_TIDE_TEST_FULLSCREEN_REQUESTED,
    orientationLocks: window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS,
  }));
  assert(mobileStartDisplay.debug.phase === "playing", `Mobile quick start did not enter gameplay: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.fullscreenRequested === true, `Mobile start did not request fullscreen: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.debug.mobileDisplay.requested === true && mobileStartDisplay.debug.mobileDisplay.orientationPreference === "portrait-primary", `Mobile start should prefer portrait fullscreen: ${JSON.stringify(mobileStartDisplay.debug.mobileDisplay)}`);
  assert(mobileStartDisplay.orientationLocks.some((mode) => String(mode).startsWith("portrait")) && !mobileStartDisplay.orientationLocks.includes("landscape"), `Mobile start requested the wrong orientation: ${JSON.stringify(mobileStartDisplay)}`);
  assert(mobileStartDisplay.debug.performance.mobile === true && mobileStartDisplay.debug.performance.dpr <= 1.01, `Mobile DPR guardrail is too high: ${JSON.stringify(mobileStartDisplay.debug.performance)}`);
  assert(
    mobileStartDisplay.debug.performance.enemyCap <= 62
      && mobileStartDisplay.debug.performance.enemyRenderBudget <= 34
      && mobileStartDisplay.debug.performance.textCap <= 8
      && mobileStartDisplay.debug.performance.projectileCap <= 72
      && mobileStartDisplay.debug.performance.renderFpsCap <= 36
      && mobileStartDisplay.debug.performance.updateFpsCap <= 40
      && mobileStartDisplay.debug.performance.lowFx === true,
    `Mobile performance caps missing: ${JSON.stringify(mobileStartDisplay.debug.performance)}`,
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.evaluate(() => {
    window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS = [];
    try {
      Object.defineProperty(screen.orientation, "type", { configurable: true, get: () => "landscape-primary" });
    } catch {}
  });
  await page.click("#fullscreenButton");
  await page.waitForTimeout(100);
  const mobileLandscapeDisplay = await page.evaluate(() => ({
    debug: window.__MONKEY_TIDE_DEBUG(),
    orientationLocks: window.__MONKEY_TIDE_TEST_ORIENTATION_LOCKS,
  }));
  assert(mobileLandscapeDisplay.debug.mobileDisplay.orientationPreference === "landscape-primary", `Landscape mobile should prefer landscape fullscreen: ${JSON.stringify(mobileLandscapeDisplay.debug.mobileDisplay)}`);
  assert(mobileLandscapeDisplay.orientationLocks.some((mode) => String(mode).startsWith("landscape")) && !mobileLandscapeDisplay.orientationLocks.some((mode) => String(mode).startsWith("portrait")), `Landscape mobile requested the wrong orientation: ${JSON.stringify(mobileLandscapeDisplay)}`);
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.waitForTimeout(100);
  const debug = await page.evaluate(() => window.__MONKEY_TIDE_STEP(8));
  assert(debug.phase === "playing" || debug.phase === "levelup", `Unexpected phase ${debug.phase}`);
  assert(debug.enemies > 0, `No enemies spawned: ${JSON.stringify(debug)}`);
  assert(debug.scene.zoom <= 0.52, `Desktop camera is not zoomed out enough: ${JSON.stringify(debug.scene)}`);
  assert(debug.world.repeatable === true && debug.world.width >= 1000000 && debug.world.activePropChunks > 0, `World is still behaving like a bounded arena: ${JSON.stringify(debug.world)}`);
  assert(debug.world.backgroundSeamBleed >= 48 && debug.world.backgroundSourceInset >= 32, `Map background tiles do not hide seams aggressively enough: ${JSON.stringify(debug.world)}`);
  assert(debug.world.immersivePropSpawning === true && debug.world.recentVisiblePropSpawns === 0, `Runtime props can still pop into view: ${JSON.stringify(debug.world)}`);
  assert(
    debug.performance.enemyCap <= 126
      && debug.performance.enemyRenderBudget <= 76
      && debug.performance.projectileCap <= 130
      && debug.performance.renderFpsCap <= 50
      && debug.performance.updateFpsCap <= 50
      && debug.performance.dpr <= 1.75,
    `Desktop performance guardrails missing: ${JSON.stringify(debug.performance)}`,
  );
  assert(debug.performance.stablePropScale && debug.performance.stablePlayerScale, `Sprite scale pulse guards missing: ${JSON.stringify(debug.performance)}`);
  assert(debug.playerSkin === "curseMonkey" && debug.player.skin === "curseMonkey", `Selected player skin did not reach runtime: ${JSON.stringify(debug)}`);
  assert(debug.hudPlayerLabel === "Fluchaffe", `HUD player label did not follow selected skin: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAsset === true && debug.preloadedAssetKeys.includes("playerSkins"), `Player skin atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAnimationAsset === true && debug.preloadedAssetKeys.includes("playerSkinWalks"), `Player walkcycle atlas is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAnimationSource.includes("player_skin_walkcycles_imagen_hd_clean_v6.png"), `Runtime should use the normalized Alucard-foot-safe walksheet: ${JSON.stringify(debug.playerSkinAnimationSource)}`);
  assert(debug.playerSkinSourceRects.rumCorsair.x === 34 && debug.playerSkinSourceRects.rumCorsair.y === 512 && debug.playerSkinSourceRects.rumCorsair.w === 461 && debug.playerSkinSourceRects.rumCorsair.h === 512 && debug.playerSkinSourceRects.rumCorsair.animDrawYOffset === 33, `Rum corsair/Jack Sparrow crop should keep foot padding: ${JSON.stringify(debug.playerSkinSourceRects.rumCorsair)}`);
  assert(debug.playerSkinSourceRects.curseMonkey.x === 589 && debug.playerSkinSourceRects.curseMonkey.y === 88 && debug.playerSkinSourceRects.curseMonkey.w === 315 && debug.playerSkinSourceRects.curseMonkey.h === 411, `Fluchaffe static crop should use the padded clean rect: ${JSON.stringify(debug.playerSkinSourceRects.curseMonkey)}`);
  assert(debug.playerSkinSourceRects.dhampirHunter.x === 960 && debug.playerSkinSourceRects.dhampirHunter.y === 0 && debug.playerSkinSourceRects.dhampirHunter.w === 380 && debug.playerSkinSourceRects.dhampirHunter.h === 500, `Alucard/dhampir static crop should use the padded clean rect: ${JSON.stringify(debug.playerSkinSourceRects.dhampirHunter)}`);
  assert(debug.playerSkinSourceRects.starFarmboy.x === 500 && debug.playerSkinSourceRects.starFarmboy.y === 492 && debug.playerSkinSourceRects.starFarmboy.w === 460 && debug.playerSkinSourceRects.starFarmboy.h === 532, `Skywalker/starFarmboy static crop should use the padded clean rect: ${JSON.stringify(debug.playerSkinSourceRects.starFarmboy)}`);
  const rumCorsairSlice = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?rum-corsair-safe";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 3;
    const cell = 256;
    const frames = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell, cell, cell).data;
      let visible = 0;
      let edgeAlpha = 0;
      let bottomPixels = 0;
      let minY = cell;
      let maxY = -1;
      for (let y = 0; y < cell; y += 1) {
        for (let x = 0; x < cell; x += 1) {
          const alpha = data[(y * cell + x) * 4 + 3];
          if (alpha <= 8) continue;
          visible += 1;
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          if (x === 0 || y === 0 || x === cell - 1 || y === cell - 1) edgeAlpha += 1;
          if (y >= 220) bottomPixels += 1;
        }
      }
      frames.push({ col, visible, edgeAlpha, bottomPixels, minY, maxY });
    }
    return frames;
  });
  assert(
    rumCorsairSlice.every((frame) => frame.edgeAlpha === 0 && frame.bottomPixels === 0 && frame.visible >= 16000 && frame.minY >= 18 && frame.maxY <= 212),
    `Rum-Korsar walk row still contains sliced lower artifacts: ${JSON.stringify(rumCorsairSlice)}`,
  );
  assert(debug.playerSkinSelectAsset === true && debug.preloadedAssetKeys.includes("playerSkinSelect"), `Player selection atlas is not preloaded: ${JSON.stringify(debug)}`);
  const curseMonkeyStaticAndSelect = await page.evaluate(async () => {
    const measure = async (src, sx, sy, sw, sh) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;
      const seen = new Uint8Array(sw * sh);
      const components = [];
      let edgeAlpha = 0;
      for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
          const index = y * sw + x;
          const alpha = data[index * 4 + 3];
          if (alpha > 8 && (x === 0 || y === 0 || x === sw - 1 || y === sh - 1)) edgeAlpha += 1;
          if (seen[index] || alpha <= 8) continue;
          const queue = [index];
          seen[index] = 1;
          let qi = 0;
          let count = 0;
          let minX = x;
          let minY = y;
          let maxX = x;
          let maxY = y;
          while (qi < queue.length) {
            const point = queue[qi++];
            const px = point % sw;
            const py = Math.floor(point / sw);
            count += 1;
            minX = Math.min(minX, px);
            minY = Math.min(minY, py);
            maxX = Math.max(maxX, px);
            maxY = Math.max(maxY, py);
            const neighbors = [point - 1, point + 1, point - sw, point + sw];
            for (const next of neighbors) {
              if (next < 0 || next >= sw * sh || seen[next]) continue;
              const nx = next % sw;
              const ny = Math.floor(next / sw);
              if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
              if (data[next * 4 + 3] > 8) {
                seen[next] = 1;
                queue.push(next);
              }
            }
          }
          components.push({ count, minX, minY, maxX, maxY });
        }
      }
      components.sort((a, b) => b.count - a.count);
      return { edgeAlpha, components };
    };
    return {
      staticCrop: await measure("assets/sprites/player_skins_imagen_hd_clean_v2.webp?curse-static-clean", 589, 88, 315, 411),
      selectCell: await measure("assets/sprites/player_skin_select_imagen_hd_clean_v4.webp?curse-select-clean", 512, 0, 256, 256),
    };
  });
  assert(
    curseMonkeyStaticAndSelect.staticCrop.edgeAlpha === 0
      && curseMonkeyStaticAndSelect.staticCrop.components.length === 1
      && curseMonkeyStaticAndSelect.staticCrop.components[0].minX >= 20
      && curseMonkeyStaticAndSelect.staticCrop.components[0].maxX <= 292
      && curseMonkeyStaticAndSelect.selectCell.edgeAlpha === 0
      && curseMonkeyStaticAndSelect.selectCell.components.length === 1
      && curseMonkeyStaticAndSelect.selectCell.components[0].maxX <= 170,
    `Fluchaffe static/select atlases still contain sliced neighbor artifacts: ${JSON.stringify(curseMonkeyStaticAndSelect)}`,
  );
  assert(debug.fighterSkinAsset === true && debug.fighterSkinSelectAsset === true && debug.preloadedAssetKeys.includes("fighterWalks") && debug.preloadedAssetKeys.includes("fighterSelect"), `Fighter sprite sheets are not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.fighterSkinAnimationSource.includes("fighters_walkcycles_imagen_hd_clean_v2.png"), `Runtime should use the repaired fighter walksheet: ${JSON.stringify(debug.fighterSkinAnimationSource)}`);
  assert(["ryu", "ken", "guile", "chunLi"].every((id) => debug.playerSkinTypes.includes(id)), `Fighter character skins missing: ${JSON.stringify(debug.playerSkinTypes)}`);
  assert(debug.playerSkinSourceRects.ryu.fighterRow === 0 && debug.playerSkinSourceRects.ryu.animSheet === "ryuActions" && debug.playerSkinSourceRects.ken.fighterRow === 1 && debug.playerSkinSourceRects.ken.animSheet === "kenActions" && debug.playerSkinSourceRects.chunLi.fighterRow === 3 && debug.playerSkinSourceRects.chunLi.animSheet === "chunLiActions" && debug.fighterSkinAnimationFrames.frames === 8, `Fighter walk frames are misconfigured: ${JSON.stringify(debug.playerSkinSourceRects)}`);
  const fighterSliceProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/fighters_walkcycles_imagen_hd_clean_v2.png?fighter-slice-probe";
    await img.decode();
    const frame = 256;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const rows = [];
    for (const row of [1, 2]) {
      const rowFrames = [];
      for (let col = 0; col < 8; col += 1) {
        ctx.clearRect(0, 0, frame, frame);
        ctx.drawImage(img, col * frame, row * frame, frame, frame, 0, 0, frame, frame);
        const data = ctx.getImageData(0, 0, frame, frame).data;
        let visible = 0;
        let edgeAlpha = 0;
        let minX = frame;
        let minY = frame;
        let maxX = 0;
        let maxY = 0;
        for (let y = 0; y < frame; y += 1) {
          for (let x = 0; x < frame; x += 1) {
            const alpha = data[(y * frame + x) * 4 + 3];
            if (alpha <= 8) continue;
            visible += 1;
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            if (x === 0 || y === 0 || x === frame - 1 || y === frame - 1) edgeAlpha += 1;
          }
        }
        rowFrames.push({ row, col, visible, edgeAlpha, bbox: [minX, minY, maxX + 1, maxY + 1] });
      }
      rows.push(rowFrames);
    }
    return rows;
  });
  assert(fighterSliceProbe.every((row) => row.every((frame) => frame.edgeAlpha === 0 && frame.visible > 10000 && frame.bbox[1] >= 14 && frame.bbox[3] <= 244)), `Ken/Guile fighter frames still look sliced: ${JSON.stringify(fighterSliceProbe)}`);
  assert(debug.playerSkinFixedDuoAsset === true && debug.preloadedAssetKeys.includes("samMaxDuo"), `Fixed Sam and Max duo asset is not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinAnimated === true && debug.playerSkinAnimationFrames.cols === 8 && debug.playerSkinAnimationFrames.rows === 6, `Selected player skin is not using the animation frameset: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinTypes.length >= 7 && debug.playerSkinTypes.includes("dhampirHunter") && debug.playerSkinTypes.includes("starFarmboy"), `Player skin archetypes missing: ${JSON.stringify(debug)}`);
  assert(debug.playerSkinTrait?.id && Object.keys(debug.playerSkinTraits).length === debug.playerSkinTypes.length, `Character traits are not wired per skin: ${JSON.stringify(debug.playerSkinTraits)}`);
  const starFarmboySlice = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?skywalker-bottom-guard";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 4;
    const cell = 256;
    const counts = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell + 246, cell, 10).data;
      let pixels = 0;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 48) pixels += 1;
      }
      counts.push(pixels);
    }
    return counts;
  });
  assert(starFarmboySlice.every((count) => count <= 8), `Skywalker/starFarmboy walk row has lower stray pixels: ${JSON.stringify(starFarmboySlice)}`);
  const starFarmboyHeadSafe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?skywalker-head-safe";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 4;
    const cell = 256;
    const boxes = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell, cell, cell).data;
      let minX = cell;
      let minY = cell;
      let maxX = -1;
      let maxY = -1;
      let edgeAlpha = 0;
      const seen = new Uint8Array(cell * cell);
      const components = [];
      for (let y = 0; y < cell; y += 1) {
        for (let x = 0; x < cell; x += 1) {
          const index = y * cell + x;
          const alpha = data[(y * cell + x) * 4 + 3];
          if (!seen[index] && alpha > 8) {
            const queue = [index];
            seen[index] = 1;
            let qi = 0;
            let count = 0;
            while (qi < queue.length) {
              const point = queue[qi++];
              const px = point % cell;
              const py = Math.floor(point / cell);
              count += 1;
              const neighbors = [point - 1, point + 1, point - cell, point + cell];
              for (const next of neighbors) {
                if (next < 0 || next >= cell * cell || seen[next]) continue;
                const nx = next % cell;
                const ny = Math.floor(next / cell);
                if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
                if (data[next * 4 + 3] > 8) {
                  seen[next] = 1;
                  queue.push(next);
                }
              }
            }
            components.push(count);
          }
          if (alpha <= 8) continue;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          if (x === 0 || y === 0 || x === cell - 1 || y === cell - 1) edgeAlpha += 1;
        }
      }
      boxes.push({ col, minX, minY, maxX, maxY, edgeAlpha, components: components.sort((a, b) => b - a) });
    }
    return boxes;
  });
  assert(
    starFarmboyHeadSafe.every((box) => box.edgeAlpha === 0 && box.minY >= 50 && box.maxY <= 244 && box.components.length === 1),
    `Skywalker/starFarmboy row still lacks clean top headroom: ${JSON.stringify(starFarmboyHeadSafe)}`,
  );
  const starFarmboyStaticAndSelect = await page.evaluate(async () => {
    const measure = async (src, sx, sy, sw, sh) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;
      const seen = new Uint8Array(sw * sh);
      const components = [];
      let minY = sh;
      let maxY = -1;
      let edgeAlpha = 0;
      for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
          const index = y * sw + x;
          const alpha = data[index * 4 + 3];
          if (alpha > 8) {
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) edgeAlpha += 1;
          }
          if (seen[index] || alpha <= 8) continue;
          const queue = [index];
          seen[index] = 1;
          let qi = 0;
          let count = 0;
          while (qi < queue.length) {
            const point = queue[qi++];
            const px = point % sw;
            const py = Math.floor(point / sw);
            count += 1;
            const neighbors = [point - 1, point + 1, point - sw, point + sw];
            for (const next of neighbors) {
              if (next < 0 || next >= sw * sh || seen[next]) continue;
              const nx = next % sw;
              const ny = Math.floor(next / sw);
              if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
              if (data[next * 4 + 3] > 8) {
                seen[next] = 1;
                queue.push(next);
              }
            }
          }
          components.push(count);
        }
      }
      return { minY, maxY, edgeAlpha, components: components.sort((a, b) => b - a) };
    };
    return {
      staticCrop: await measure("assets/sprites/player_skins_imagen_hd_clean_v2.webp?skywalker-static-headroom", 500, 492, 460, 532),
      selectCell: await measure("assets/sprites/player_skin_select_imagen_hd_clean_v4.webp?skywalker-select-clean", 1280, 0, 256, 256),
    };
  });
  assert(
    starFarmboyStaticAndSelect.staticCrop.edgeAlpha === 0
      && starFarmboyStaticAndSelect.staticCrop.minY >= 20
      && starFarmboyStaticAndSelect.staticCrop.components.length === 1
      && starFarmboyStaticAndSelect.selectCell.edgeAlpha === 0
      && starFarmboyStaticAndSelect.selectCell.components.length === 1,
    `Skywalker/starFarmboy static or picker crop still touches the head edge: ${JSON.stringify(starFarmboyStaticAndSelect)}`,
  );
  const dhampirFootSafe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?dhampir-foot-safe";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 2;
    const cell = 256;
    const frames = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell, cell, cell).data;
      const seen = new Uint8Array(cell * cell);
      const components = [];
      let edgeAlpha = 0;
      for (let y = 0; y < cell; y += 1) {
        for (let x = 0; x < cell; x += 1) {
          const index = y * cell + x;
          const alpha = data[index * 4 + 3];
          if (alpha > 8 && (x === 0 || y === 0 || x === cell - 1 || y === cell - 1)) edgeAlpha += 1;
          if (seen[index] || alpha <= 8) continue;
          const queue = [index];
          seen[index] = 1;
          let qi = 0;
          let count = 0;
          let minX = x;
          let minY = y;
          let maxX = x;
          let maxY = y;
          while (qi < queue.length) {
            const point = queue[qi++];
            const px = point % cell;
            const py = Math.floor(point / cell);
            count += 1;
            minX = Math.min(minX, px);
            minY = Math.min(minY, py);
            maxX = Math.max(maxX, px);
            maxY = Math.max(maxY, py);
            const neighbors = [point - 1, point + 1, point - cell, point + cell];
            for (const next of neighbors) {
              if (next < 0 || next >= cell * cell || seen[next]) continue;
              const nx = next % cell;
              const ny = Math.floor(next / cell);
              if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
              if (data[next * 4 + 3] > 8) {
                seen[next] = 1;
                queue.push(next);
              }
            }
          }
          components.push({ count, minX, minY, maxX, maxY });
        }
      }
      components.sort((a, b) => b.count - a.count);
      const main = components[0];
      frames.push({
        col,
        edgeAlpha,
        mainHeight: main.maxY - main.minY + 1,
        mainMaxY: main.maxY,
        secondaryPixels: components.slice(1).reduce((sum, component) => sum + component.count, 0),
      });
    }
    return frames;
  });
  const dhampirHeights = dhampirFootSafe.map((frame) => frame.mainHeight);
  assert(
    dhampirFootSafe.every((frame) => frame.edgeAlpha === 0 && frame.secondaryPixels === 0 && frame.mainHeight >= 202 && frame.mainHeight <= 205 && frame.mainMaxY === 232)
      && Math.max(...dhampirHeights) - Math.min(...dhampirHeights) <= 2,
    `Alucard/dhampir walk row still has scale pulse or foot slice artifacts: ${JSON.stringify(dhampirFootSafe)}`,
  );
  const dhampirStaticAndSelect = await page.evaluate(async () => {
    const measure = async (src, sx, sy, sw, sh) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      const data = ctx.getImageData(0, 0, sw, sh).data;
      const seen = new Uint8Array(sw * sh);
      const components = [];
      let edgeAlpha = 0;
      let minX = sw;
      let minY = sh;
      let maxX = -1;
      let maxY = -1;
      for (let y = 0; y < sh; y += 1) {
        for (let x = 0; x < sw; x += 1) {
          const index = y * sw + x;
          const alpha = data[index * 4 + 3];
          if (alpha > 8) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            if (x === 0 || y === 0 || x === sw - 1 || y === sh - 1) edgeAlpha += 1;
          }
          if (seen[index] || alpha <= 8) continue;
          const queue = [index];
          seen[index] = 1;
          let qi = 0;
          let count = 0;
          while (qi < queue.length) {
            const point = queue[qi++];
            const px = point % sw;
            const py = Math.floor(point / sw);
            count += 1;
            const neighbors = [point - 1, point + 1, point - sw, point + sw];
            for (const next of neighbors) {
              if (next < 0 || next >= sw * sh || seen[next]) continue;
              const nx = next % sw;
              const ny = Math.floor(next / sw);
              if (Math.abs(nx - px) + Math.abs(ny - py) !== 1) continue;
              if (data[next * 4 + 3] > 8) {
                seen[next] = 1;
                queue.push(next);
              }
            }
          }
          components.push(count);
        }
      }
      return { minX, minY, maxX, maxY, edgeAlpha, components: components.sort((a, b) => b - a) };
    };
    return {
      staticCrop: await measure("assets/sprites/player_skins_imagen_hd_clean_v2.webp?dhampir-static-foot-safe", 960, 0, 380, 500),
      selectCell: await measure("assets/sprites/player_skin_select_imagen_hd_clean_v4.webp?dhampir-select-foot-safe", 768, 0, 256, 256),
    };
  });
  assert(
    dhampirStaticAndSelect.staticCrop.edgeAlpha === 0
      && dhampirStaticAndSelect.staticCrop.components.length === 1
      && dhampirStaticAndSelect.staticCrop.maxY <= 490
      && dhampirStaticAndSelect.selectCell.edgeAlpha === 0
      && dhampirStaticAndSelect.selectCell.components.length === 1
      && dhampirStaticAndSelect.selectCell.maxY <= 233,
    `Alucard/dhampir static or picker crop still has foot/split artifacts: ${JSON.stringify(dhampirStaticAndSelect)}`,
  );
  const curseMonkeyStable = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/player_skin_walkcycles_imagen_hd_clean_v6.png?curse-monkey-stable";
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);
    const row = 1;
    const cell = 256;
    const frames = [];
    for (let col = 0; col < 8; col += 1) {
      const data = ctx.getImageData(col * cell, row * cell, cell, cell).data;
      let minY = cell;
      let maxY = -1;
      let edgeAlpha = 0;
      let bottomPixels = 0;
      for (let y = 0; y < cell; y += 1) {
        for (let x = 0; x < cell; x += 1) {
          const alpha = data[(y * cell + x) * 4 + 3];
          if (alpha <= 8) continue;
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          if (x === 0 || y === 0 || x === cell - 1 || y === cell - 1) edgeAlpha += 1;
          if (y >= 240) bottomPixels += 1;
        }
      }
      frames.push({ col, height: maxY - minY + 1, minY, maxY, edgeAlpha, bottomPixels });
    }
    return frames;
  });
  const curseMonkeyHeights = curseMonkeyStable.map((frame) => frame.height);
  assert(
    curseMonkeyStable.every((frame) => frame.edgeAlpha === 0 && frame.bottomPixels === 0 && frame.maxY <= 238 && frame.height >= 204 && frame.height <= 207)
      && Math.max(...curseMonkeyHeights) - Math.min(...curseMonkeyHeights) <= 2,
    `Fluchaffe/curseMonkey walk row still has pulse or bottom slice artifacts: ${JSON.stringify(curseMonkeyStable)}`,
  );
  assert(debug.weapons.cutlass >= 1, "Cutlass weapon missing");
  assert(typeof debug.speech.supported === "boolean", `Speech debug missing: ${JSON.stringify(debug)}`);
  assert(debug.speech.muted === false, `Speech should follow audio mute state: ${JSON.stringify(debug)}`);
  assert(debug.map.selected === "moonlitLagoon" && debug.map.variants.length >= 4, `Selected map did not reach runtime: ${JSON.stringify(debug.map)}`);
  assert(debug.map.cleanSandBackground === true, `Default sand background still points at the old puddle texture: ${JSON.stringify(debug.map)}`);
  assert(debug.map.selectedBackground === "mapMoonlitLagoon", `Selected map did not get its unique background: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.backgrounds).filter(Boolean).length >= 4 && new Set(Object.values(debug.map.backgrounds)).size >= 4, `Map backgrounds are not varied: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.backgrounds).every((key) => debug.preloadedAssetKeys.includes(key)), `Map backgrounds are not preloaded: ${JSON.stringify(debug.map)}`);
  assert(Object.values(debug.map.musicProfiles).some((profile) => profile.mainKey === "bgmCaper") && Object.values(debug.map.musicProfiles).some((profile) => profile.mainKey === "bgmShoreline"), `Map BGM profiles are not varied: ${JSON.stringify(debug.map.musicProfiles)}`);
  assert(debug.audio.music.main >= 0.49, `Main music config should sit above the quieter SFX bed: ${JSON.stringify(debug)}`);
  assert(debug.audio.music.rush >= 0.46 && debug.audio.music.rushStart <= 125, `Rush music should enter early and carry the mix: ${JSON.stringify(debug)}`);
  assert(debug.audio.activeTrack === "rush" && debug.audio.armedTrack === "rush" && debug.audio.rushVolume >= 0.47 && debug.audio.rushVolume <= 0.49, `Quick wave should hand off to a music-forward capped rush BGM: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.gestureUnlocked && debug.audio.soundPoolsPrimed && debug.audio.instantStartMode && debug.audio.lowLatencyNoSeek && debug.audio.lastStartLatencyMs <= 350, `BGM/SFX should be unlocked by the first user gesture: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.overlapSafe === true && !(debug.audio.tracksPlaying.main && debug.audio.tracksPlaying.rush), `BGM tracks are overlapping: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.startReady.main && debug.audio.startReady.rush, `BGM should be pre-seeked before play to avoid delayed starts: ${JSON.stringify(debug.audio)}`);
  assert(debug.audio.music.trackKeys.rush === "bgmCaper" && debug.audio.sources.bgmCaper.includes("turbo-banana-cup-drive.mp3"), `Selected map did not switch to its driving BGM profile: ${JSON.stringify(debug.audio)}`);
  assert(new Set(Object.values(debug.audio.music.characterThemes).map((profile) => `${profile.theme}:${profile.mainKey}:${profile.rushKey}:${profile.mainStartAt}:${profile.rushStartAt}`)).size === debug.playerSkinTypes.length, `Every character should have a distinct BGM identity: ${JSON.stringify(debug.audio.music.characterThemes)}`);
  assert(new Set(Object.values(debug.audio.music.characterThemes).map((profile) => profile.mainKey)).size === debug.playerSkinTypes.length, `Every character should have its own main BGM track: ${JSON.stringify(debug.audio.music.characterThemes)}`);
  assert(debug.audio.music.characterThemes.curseMonkey.mainKey === "bgmCurseMonkey" && debug.audio.music.characterThemes.curseMonkey.rushStart <= 45 && debug.audio.music.characterThemes.curseMonkey.mainRate >= 1.08 && debug.audio.music.characterThemes.curseMonkey.rushRate >= 1.08, `Curse monkey BGM should be a faster local frenzy profile: ${JSON.stringify(debug.audio.music.characterThemes.curseMonkey)}`);
  assert(debug.audio.music.characterThemes.dhampirHunter.mainKey === "bgmGargoyle" && debug.audio.music.characterThemes.dhampirHunter.mainStartAt === 0 && debug.audio.music.characterThemes.dhampirHunter.rushStart <= 58, `Alucard/Dhampir BGM should start immediately: ${JSON.stringify(debug.audio.music.characterThemes.dhampirHunter)}`);
  assert(debug.audio.music.characterThemes.rumCorsair.mainKey === "bgmRumRiddle" && debug.audio.music.characterThemes.rumCorsair.rushKey === "bgmShoreline", `Rum-Korsar should have a unique rum-riddle BGM: ${JSON.stringify(debug.audio.music.characterThemes.rumCorsair)}`);
  assert(debug.audio.music.characterThemes.starFarmboy.mainKey === "bgmCrimson" && debug.audio.music.characterThemes.starFarmboy.rushKey === "bgmRush", `Skywalker/starFarmboy should have a unique crimson BGM: ${JSON.stringify(debug.audio.music.characterThemes.starFarmboy)}`);
  assert(debug.audio.music.characterThemes.freelanceDuo.mainKey === "bgmCoconut" && debug.audio.music.characterThemes.freelanceDuo.rushKey === "bgmVoodoo", `Freelance Duo should have a unique coconut casefile BGM: ${JSON.stringify(debug.audio.music.characterThemes.freelanceDuo)}`);
  assert(
    debug.audio.music.characterThemes.ryu.mainKey === "bgmRyuSignature"
      && debug.audio.music.characterThemes.ken.mainKey === "bgmKenSignature"
      && debug.audio.music.characterThemes.guile.mainKey === "bgmGuileSignature"
      && debug.audio.music.characterThemes.chunLi.mainKey === "bgmChunLiSignature"
      && ["ryu", "ken", "guile", "chunLi"].every((id) => debug.audio.music.characterThemes[id].rushKey === "bgmStreetRush" && debug.audio.music.characterThemes[id].mainStartAt === 0 && debug.audio.music.characterThemes[id].rushStartAt === 0),
    `Fighter BGM profiles should use the signature Downloads tracks without delayed start offsets: ${JSON.stringify(debug.audio.music.characterThemes)}`,
  );
  assert(
    debug.audio.sources.bgmMain.includes("tidebarrel-dockside-drive.mp3")
      && debug.audio.sources.bgmRush.includes("black-chapel-gate-drive.mp3")
      && debug.audio.sources.bgmCaper.includes("turbo-banana-cup-drive.mp3")
      && debug.audio.sources.bgmShoreline.includes("treasure-tide-route-drive.mp3")
      && debug.audio.sources.bgmVoodoo.includes("voodoo-hut-shuffle-drive.mp3")
      && debug.audio.sources.bgmCathedral.includes("cathedral-hunt-overture-drive.mp3")
      && debug.audio.sources.bgmCurseMonkey.includes("curse-monkey-frenzy-drive.mp3")
      && debug.audio.sources.bgmGargoyle.includes("gargoyle-chapel-run.mp3")
      && debug.audio.sources.bgmCrimson.includes("crimson-galleon.mp3")
      && debug.audio.sources.bgmCoconut.includes("coconut-caper-loop.mp3")
      && debug.audio.sources.bgmRumRiddle.includes("shoreline-rum-riddle.mp3")
      && debug.audio.sources.bgmRyuSignature.includes("sf-ryu-dojo-crash-duel.mp3")
      && debug.audio.sources.bgmKenSignature.includes("sf-ken-steel-punch-parade.mp3")
      && debug.audio.sources.bgmGuileSignature.includes("sf-guile-jet-fuel-glory.mp3")
      && debug.audio.sources.bgmChunLiSignature.includes("sf-chun-li-bamboo-arcade.mp3")
      && debug.audio.sources.bgmStreetRush.includes("sf-rush-gasket-thunder.mp3"),
    `Driving Download BGM tracks are not selected: ${JSON.stringify(debug.audio)}`,
  );
  assert(debug.audio.musicPreload.ready && debug.audio.musicPreload.loaded === debug.audio.musicPreload.total && debug.audio.musicPreload.decoded === debug.audio.musicPreload.total && debug.audio.musicPreload.failed.length === 0, `BGM was not fully preloaded before start: ${JSON.stringify(debug.audio.musicPreload)}`);
  assert(debug.audio.sfxMasterGain === 0.54 && debug.audio.sfx.pickup >= 0.1 && debug.audio.sfx.gate >= 0.11 && debug.audio.sfx.pickup <= 0.11, `SFX should be lower while still audible: ${JSON.stringify(debug)}`);
  const sfxStartedOrArmed = debug.audio.sfxDebug.started >= 1
    || (
      debug.audio.sfxEngine.webAudio === true
      && debug.audio.sfxEngine.state === "running"
      && debug.audio.sfxDebug.blocked <= 1
      && debug.audio.sfxDebug.lastVolume >= 0.1
    );
  assert(
    debug.audio.sfx.downloadBossWarning >= 0.18
      && debug.audio.sfx.quickCutlass >= 0.16
      && debug.audio.sfx.cannonFire >= 0.18
      && debug.audio.sfx.curseMonkeyWarning >= 0.18
      && debug.audio.sfxToMusicRatio >= 0.38
      && debug.audio.sfxToMusicRatio <= 0.41
      && debug.audio.sfxDebug.attempts >= 1
      && sfxStartedOrArmed
      && debug.audio.sfxDebug.lastVolume >= 0.1,
    `Downloaded SFX should stay present but below the music bed: ${JSON.stringify(debug)}`,
  );
  assert(debug.audio.sfxLocalDownloads && debug.audio.sources.pickup.includes("/from-downloads/") && debug.audio.sources.confirm.includes("/from-downloads/"), `Base SFX are not using Downloads assets: ${JSON.stringify(debug)}`);
  assert(debug.audio.sources.quickCutlass.includes("/from-downloads/quick-cutlass.mp3") && debug.audio.sources.cannonFire.includes("/from-downloads/cartoon-cannon-fire.mp3") && debug.audio.sources.doubloonPing.includes("/from-downloads/doubloon-ping.mp3") && debug.audio.sources.treasureClink.includes("/from-downloads/treasure-clink.mp3"), `Expanded Downloads SFX set missing: ${JSON.stringify(debug.audio.sources)}`);
  assert(debug.audio.characterSfxProfiles.default.slash === "quickCutlass" && debug.audio.characterSfxProfiles.default.pickup === "brightGem" && debug.audio.characterSfxProfiles.dhampirHunter.hit === "ghostAnchorHit", `Characters are not using the expanded Downloads SFX: ${JSON.stringify(debug.audio.characterSfxProfiles)}`);
  assert(debug.audio.sources.slashSwish.includes("/downloaded/") && debug.audio.sources.bossDownUndead.includes("/downloaded/"), `Character SFX should use the local downloaded MP3 set: ${JSON.stringify(debug.audio.sources)}`);
  assert(Object.values(debug.audio.characterSfxProfiles).every((profile) => profile.slash && profile.warning), `Every character should have a SFX profile: ${JSON.stringify(debug.audio.characterSfxProfiles)}`);
  assert(debug.audio.characterSfxProfiles.curseMonkey.slash === "curseMonkeySwipe" && debug.audio.characterSfxProfiles.curseMonkey.dash === "curseMonkeyDash" && debug.audio.characterSfxProfiles.curseMonkey.warning === "curseMonkeyWarning", `Curse monkey should use its own local SFX pack: ${JSON.stringify(debug.audio.characterSfxProfiles.curseMonkey)}`);
  assert(debug.stats.speed >= 344 && debug.stats.magnet >= 260, `Flow balance is too sluggish: ${JSON.stringify(debug)}`);
  const movementProbe = await page.evaluate(() => window.__MONKEY_TIDE_MOVEMENT_PROBE());
  assert(
    movementProbe.baseSpeed >= 344
      && movementProbe.dashCooldown <= 0.4
      && movementProbe.dashDuration >= 0.29
      && movementProbe.dashBoost >= 3.7
      && movementProbe.dashBurstDistance >= 380
      && movementProbe.halfStickMagnitude >= 0.96
      && movementProbe.halfStickSpeed >= 330
      && movementProbe.cameraCatchup >= 16,
    `Movement tuning still feels heavy: ${JSON.stringify(movementProbe)}`,
  );
  assert(debug.balance.bossHpMult >= 2.85 && debug.balance.normalSpawnIntensity >= 1.34, `Difficulty did not get sharper: ${JSON.stringify(debug)}`);
  assert(debug.balance.bossHpMult <= 3.0 && debug.balance.normalSpawnIntensity <= 1.42, `Difficulty balance is too punishing: ${JSON.stringify(debug)}`);
  assert(debug.balance.firstBossAt <= 130 && debug.balance.rangedPressureAt <= 52 && debug.balance.pressureWaveFirstAt <= 22, `Pressure events arrive too late: ${JSON.stringify(debug)}`);
  assert(debug.enemyTuning.visualScale >= 1.16 && debug.enemyTuning.hitboxScale >= 1.06 && debug.enemyTuning.animatedVisualBoost >= 1.1 && debug.enemyTuning.minAnimatedVisualHeight >= 82 && debug.enemyTuning.secondEliteFromWave <= 3, `Enemy readability/pressure tuning missing: ${JSON.stringify(debug.enemyTuning)}`);
  assert(Object.values(debug.enemyVisualReadability.animatedProjectedHeights).every((height) => height >= 82), `Animated enemy sprites are still too small: ${JSON.stringify(debug.enemyVisualReadability)}`);
  assert(debug.engagement.pressureWaves >= 1 && debug.engagement.pressureWave >= 1, `Pressure waves did not fire: ${JSON.stringify(debug.engagement)}`);
  assert(debug.engagement.eliteEnemies + debug.engagement.elitesDefeated >= 1, `Pressure waves should mark an elite omen target: ${JSON.stringify(debug.engagement)}`);
  assert(debug.enemyRoster.liveRosterIsMonsterOnly === true, `Live enemy roster still includes human NPCs: ${JSON.stringify(debug.enemyRoster)}`);
  assert(debug.enemyRoster.activeBossCycle.every((id) => !debug.enemyRoster.humanNpcTypes.includes(id)), `Live boss cycle still includes human NPCs: ${JSON.stringify(debug.enemyRoster)}`);
  assert(debug.preloadedAssetKeys.includes("enemyAnimSheet"), `Enemy animation sheet is not preloaded: ${JSON.stringify(debug.preloadedAssetKeys)}`);
  assert(debug.crossoverAssets.enemyAnimSheet && debug.crossoverAssets.enemyAnimationFrames.frames === 8 && debug.crossoverAssets.enemyAnimationFrames.rows === 7, `Imagen enemy animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.enemyAnimSource.includes("_clean_v4.png") && debug.crossoverAssets.gothicEnemyAnimSource.includes("_clean_v4.png") && debug.crossoverAssets.newEnemyTrioSource.includes("_clean_v2.png") && debug.crossoverAssets.platformerEnemySource.includes("platformer_enemy_anim_imagen_hd.png") && debug.crossoverAssets.gothicEnemiesSource.includes("_clean_v2.png") && debug.extraAssets.extraEnemiesSource.includes("_clean.png"), `Runtime should use clean sliced enemy sheets: ${JSON.stringify({ crossover: debug.crossoverAssets, extra: debug.extraAssets })}`);
  assert(["crab", "hand", "powderImp", "lanternWraith", "barrelMaw", "coralBrute", "idol"].every((id) => debug.crossoverAssets.enemyAnimTypes.includes(id)), `Single-frame live enemies were not migrated to the multiframe sheet: ${JSON.stringify(debug.crossoverAssets.enemyAnimTypes)}`);
  assert(debug.crossoverAssets.gothicEnemyAnimSheet === true && ["boneCorsair", "gargoyle"].every((id) => debug.crossoverAssets.gothicEnemyAnimTypes.includes(id)), `Skeleton/gargoyle multiframe sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.liveSingleFrameFallbackTypes.length === 0, `Live enemies still fall back to single-frame art: ${JSON.stringify(debug.crossoverAssets.liveSingleFrameFallbackTypes)}`);
  const cleanEnemyMatteProbe = await page.evaluate(async () => {
    const assets = [
      "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v4.png?matte-probe",
      "assets/sprites/new_enemy_trio_imagen_hd_sheet_clean_v2.png?matte-probe",
      "assets/sprites/gothic_enemies_hd_sheet_clean_v2.png?matte-probe",
      "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v4.png?matte-probe",
      "assets/sprites/extra_enemies_imagen_hd_clean.png?matte-probe",
    ];
    const results = [];
    for (const src of assets) {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let lowAlphaMatte = 0;
      let neonGreenMatte = 0;
      for (let index = 0; index < data.length; index += 4) {
        const r = data[index];
        const g = data[index + 1];
        const b = data[index + 2];
        const alpha = data[index + 3];
        if (alpha > 0 && alpha <= 28) lowAlphaMatte += 1;
        if (alpha > 0 && g > 150 && r < 110 && b < 145 && g - Math.max(r, b) > 45) neonGreenMatte += 1;
      }
      results.push({ src, lowAlphaMatte, neonGreenMatte });
    }
    return results;
  });
  assert(cleanEnemyMatteProbe.every((asset) => asset.lowAlphaMatte === 0 && asset.neonGreenMatte <= 2), `Clean enemy sheets still have matte/slice color leftovers: ${JSON.stringify(cleanEnemyMatteProbe)}`);
  const repairedEnemySliceProbe = await page.evaluate(async () => {
    const assets = [
      { src: "assets/sprites/new_enemy_trio_imagen_hd_sheet_clean_v2.png?slice-probe", frameW: 256, frameH: 256, cols: 8, rows: 3, minVisible: 12000 },
      { src: "assets/sprites/platformer_enemy_anim_imagen_hd.png?slice-probe", frameW: 256, frameH: 256, cols: 11, rows: 2, minVisible: 11000 },
      { src: "assets/sprites/gothic_enemies_hd_sheet_clean_v2.png?slice-probe", frameW: 128, frameH: 176, cols: 4, rows: 8, minVisible: 2600 },
      { src: "assets/sprites/extra_enemies_imagen_hd_clean.png?slice-probe", frameW: 512, frameH: 512, cols: 4, rows: 2, minVisible: 60000 },
    ];
    const results = [];
    for (const asset of assets) {
      const img = new Image();
      img.src = asset.src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = asset.frameW;
      canvas.height = asset.frameH;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      const frames = [];
      for (let row = 0; row < asset.rows; row += 1) {
        for (let col = 0; col < asset.cols; col += 1) {
          ctx.clearRect(0, 0, asset.frameW, asset.frameH);
          ctx.drawImage(img, col * asset.frameW, row * asset.frameH, asset.frameW, asset.frameH, 0, 0, asset.frameW, asset.frameH);
          const data = ctx.getImageData(0, 0, asset.frameW, asset.frameH).data;
          let edgeAlpha = 0;
          let visible = 0;
          for (let y = 0; y < asset.frameH; y += 1) {
            for (let x = 0; x < asset.frameW; x += 1) {
              const alpha = data[(y * asset.frameW + x) * 4 + 3];
              if (alpha <= 8) continue;
              visible += 1;
              if (x <= 1 || y <= 1 || x >= asset.frameW - 2 || y >= asset.frameH - 2) edgeAlpha += 1;
            }
          }
          frames.push({ row, col, edgeAlpha, visible });
        }
      }
      results.push({ ...asset, frames });
    }
    return results;
  });
  assert(repairedEnemySliceProbe.every((asset) => asset.frames.every((frame) => frame.edgeAlpha === 0 && frame.visible >= asset.minVisible)), `Repaired enemy sheets still have sliced/empty cells: ${JSON.stringify(repairedEnemySliceProbe)}`);
  const enemyAnimAlphaProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v4.png?edge-probe";
    await img.decode();
    const frame = 256;
    const rows = 7;
    const cols = 8;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const results = [];
    for (let row = 0; row < rows; row += 1) {
      const rowResult = [];
      for (let col = 0; col < cols; col += 1) {
        ctx.clearRect(0, 0, frame, frame);
        ctx.drawImage(img, col * frame, row * frame, frame, frame, 0, 0, frame, frame);
        const data = ctx.getImageData(0, 0, frame, frame).data;
        let edgeAlpha = 0;
        let visible = 0;
        for (let y = 0; y < frame; y += 1) {
          for (let x = 0; x < frame; x += 1) {
            const alpha = data[(y * frame + x) * 4 + 3];
            if (alpha <= 8) continue;
            visible += 1;
            if (x === 0 || y === 0 || x === frame - 1 || y === frame - 1) edgeAlpha += 1;
          }
        }
        rowResult.push({ edgeAlpha, visible });
      }
      results.push(rowResult);
    }
    return results;
  });
  assert(enemyAnimAlphaProbe.every((row) => row.every((frame) => frame.edgeAlpha === 0 && frame.visible > 8000)), `Imagen enemy multiframe sheet has sliced or empty frames: ${JSON.stringify(enemyAnimAlphaProbe)}`);
  const enemyAnimVerticalSplitProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/enemy_anim_imagen_hd_sheet_clean_v4.png?split-probe";
    await img.decode();
    const frame = 256;
    const rows = [4, 5];
    const cols = 8;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const results = [];
    for (const row of rows) {
      for (let col = 0; col < cols; col += 1) {
        ctx.clearRect(0, 0, frame, frame);
        ctx.drawImage(img, col * frame, row * frame, frame, frame, 0, 0, frame, frame);
        const data = ctx.getImageData(0, 0, frame, frame).data;
        const occupancy = [];
        for (let y = 0; y < frame; y += 1) {
          let visible = 0;
          for (let x = 0; x < frame; x += 1) {
            if (data[(y * frame + x) * 4 + 3] > 24) visible += 1;
          }
          occupancy.push(visible);
        }
        const first = occupancy.findIndex((count) => count > 10);
        const last = occupancy.length - 1 - [...occupancy].reverse().findIndex((count) => count > 10);
        let maxVoid = 0;
        let currentVoid = 0;
        for (let y = first; y <= last; y += 1) {
          if (occupancy[y] <= 2) currentVoid += 1;
          else {
            maxVoid = Math.max(maxVoid, currentVoid);
            currentVoid = 0;
          }
        }
        maxVoid = Math.max(maxVoid, currentVoid);
        results.push({ row, col, first, last, maxVoid });
      }
    }
    return results;
  });
  assert(enemyAnimVerticalSplitProbe.every((frame) => frame.maxVoid <= 18), `Enemy animation frames still have large horizontal slice gaps: ${JSON.stringify(enemyAnimVerticalSplitProbe)}`);
  const gothicEnemyAnimAlphaProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/gothic_enemy_anim_imagen_hd_clean_v4.png?edge-probe";
    await img.decode();
    const frame = 256;
    const rows = 2;
    const cols = 8;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const results = [];
    for (let row = 0; row < rows; row += 1) {
      const rowResult = [];
      for (let col = 0; col < cols; col += 1) {
        ctx.clearRect(0, 0, frame, frame);
        ctx.drawImage(img, col * frame, row * frame, frame, frame, 0, 0, frame, frame);
        const data = ctx.getImageData(0, 0, frame, frame).data;
        let edgeAlpha = 0;
        let visible = 0;
        for (let y = 0; y < frame; y += 1) {
          for (let x = 0; x < frame; x += 1) {
            const alpha = data[(y * frame + x) * 4 + 3];
            if (alpha <= 8) continue;
            visible += 1;
            if (x === 0 || y === 0 || x === frame - 1 || y === frame - 1) edgeAlpha += 1;
          }
        }
        rowResult.push({ edgeAlpha, visible });
      }
      results.push(rowResult);
    }
    return results;
  });
  assert(gothicEnemyAnimAlphaProbe.every((row) => row.every((frame) => frame.edgeAlpha === 0 && frame.visible > 8000)), `Gothic enemy multiframe sheet still has sliced or empty frames: ${JSON.stringify(gothicEnemyAnimAlphaProbe)}`);
  assert(!debug.crossoverAssets.gothicEnemyAnimFrameUse.boneCorsair.loopFrames.includes(6) && !debug.crossoverAssets.gothicEnemyAnimFrameUse.gargoyle.loopFrames.some((frame) => frame === 5 || frame === 6), `Gothic enemy loops should avoid sliced frames: ${JSON.stringify(debug.crossoverAssets.gothicEnemyAnimFrameUse)}`);
  const rotationProbe = await page.evaluate(() => window.__MONKEY_TIDE_ROTATION_PROBE());
  assert(rotationProbe.openingPool.includes("powderImp") && rotationProbe.openingPool.includes("reefSquid") && rotationProbe.openingUnique >= 4, `Opening enemy rotation is still too repetitive: ${JSON.stringify(rotationProbe)}`);
  assert(["hand", "tideTentacle"].every((id) => rotationProbe.midPool.includes(id)), `Mid-run enemy rotation is missing variety: ${JSON.stringify(rotationProbe)}`);
  assert(debug.loading.loaded === debug.loading.total && debug.loading.total === debug.preloadedAssetKeys.length + debug.audio.musicPreload.total, `Loading progress is inaccurate: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemies && debug.crossoverAssets.gothicItems && debug.crossoverAssets.gothicProps, `Gothic crossover sheets missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicEnemyTypes.length >= 3, `Gothic enemy types missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.gothicItemTypes.includes("bloodRose"), `Blood rose upgrade icon missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.spectralCaptain, `Spectral captain sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.threeHeadedMonkey && debug.preloadedAssetKeys.includes("threeHeadedMonkey"), `Three-headed monkey boss asset missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.blackbeard && debug.preloadedAssetKeys.includes("blackbeard"), `Blackbeard boss asset missing: ${JSON.stringify(debug)}`);
  assert(debug.crossoverAssets.threeHeadedMonkeyAnim && debug.preloadedAssetKeys.includes("threeHeadedMonkeyAnim"), `Three-headed monkey animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.blackbeardAnim && debug.preloadedAssetKeys.includes("blackbeardAnim"), `Blackbeard animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.timeTentacleAnim && debug.preloadedAssetKeys.includes("timeTentacleAnim"), `Time tentacle animation sheet missing: ${JSON.stringify(debug.crossoverAssets)}`);
  assert(debug.crossoverAssets.bossAnimationFrames.threeHeadedMonkey.frames === 8 && debug.crossoverAssets.bossAnimationFrames.blackbeard.frames === 8 && debug.crossoverAssets.bossAnimationFrames.timeTentacle.frames === 12, `Boss animation framesets should expose expected frame counts: ${JSON.stringify(debug.crossoverAssets.bossAnimationFrames)}`);
  const bossAnimAlphaProbe = await page.evaluate(async () => {
    const assets = [
      { src: "assets/sprites/bosses/three_headed_monkey_anim_imagen_hd.webp?alpha-clean", w: 706, h: 720, frames: 8, cols: 4 },
      { src: "assets/sprites/bosses/blackbeard_anim_imagen_hd.webp?alpha-clean", w: 758, h: 900, frames: 8, cols: 4 },
      { src: "assets/sprites/bosses/time_tentacle_anim_imagen_hd.webp?alpha-clean", w: 256, h: 512, frames: 12, cols: 6 },
    ];
    const results = [];
    for (const asset of assets) {
      const img = new Image();
      img.src = asset.src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const frameResults = [];
      for (let frame = 0; frame < asset.frames; frame += 1) {
        const x0 = frame % asset.cols * asset.w;
        const y0 = Math.floor(frame / asset.cols) * asset.h;
        const data = ctx.getImageData(x0, y0, asset.w, asset.h).data;
        let edgeAlpha = 0;
        let visible = 0;
        for (let y = 0; y < asset.h; y += 1) {
          for (let x = 0; x < asset.w; x += 1) {
            const alpha = data[(y * asset.w + x) * 4 + 3];
            if (alpha > 8) {
              visible += 1;
              if (x === 0 || y === 0 || x === asset.w - 1 || y === asset.h - 1) edgeAlpha += 1;
            }
          }
        }
        frameResults.push({ frame, edgeAlpha, visible });
      }
      results.push({ src: asset.src, size: [canvas.width, canvas.height], frameResults });
    }
    return results;
  });
  assert(bossAnimAlphaProbe.every((asset) => asset.frameResults.every((frame) => frame.edgeAlpha === 0 && frame.visible > 30000)), `Boss animation sheets still look sliced: ${JSON.stringify(bossAnimAlphaProbe)}`);
  assert(debug.crossoverAssets.bossTypes.includes("spectralCaptain") && debug.crossoverAssets.bossTypes.includes("coralBrute") && debug.crossoverAssets.bossTypes.includes("threeHeadedMonkey") && debug.crossoverAssets.bossTypes.includes("blackbeard") && debug.crossoverAssets.bossTypes.includes("tideTentacle"), `Boss roster missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraEnemies && debug.extraAssets.extraItems, `Extra Imagen sheets missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraEnemyTypes.length >= 8 && debug.extraAssets.extraEnemyTypes.includes("tideWitch") && debug.extraAssets.extraEnemyTypes.includes("stormDuelist"), `Extra enemies missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraItemTypes.length >= 8 && debug.extraAssets.extraItemTypes.includes("cursedPearl") && debug.extraAssets.extraItemTypes.includes("grogLantern"), `Extra item icons missing: ${JSON.stringify(debug)}`);
  assert(debug.extraAssets.extraUpgradeTypes.length >= 8 && debug.extraAssets.extraUpgradeTypes.includes("powderPouch"), `Extra item upgrades missing: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("extraEnemies") && debug.preloadedAssetKeys.includes("extraItems"), `Extra sheets are not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachProps, `Beach exploration prop sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("beachHut") && debug.explorationAssets.beachPropTypes.includes("boatWreck"), `Explorable landmarks missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("clearPuddle") && debug.explorationAssets.beachPropTypes.includes("hedgeCluster"), `HD puddles or hedges missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.visiblePuddles >= 8, `HD puddle decals are not visible enough in the generated chunks: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.beachPropTypes.includes("conchShrine") && debug.explorationAssets.beachPropTypes.includes("buriedTreasure"), `New exploration ideas missing: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.openTreasureUsesDedicatedAsset === true, `Opened chests should use the Imagen open-chest asset: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.discoveredPropsStayPainted === true, `Discovered huts/bushes/chests should not be greyed out: ${JSON.stringify(debug.explorationAssets)}`);
  assert(debug.explorationAssets.interactiveProps >= 3, `Not enough explorable props: ${JSON.stringify(debug)}`);
  assert(debug.explorationAssets.beachPropAssetKeys.every((key) => debug.preloadedAssetKeys.includes(key)), `Clean beach props are not preloaded: ${JSON.stringify(debug)}`);
  assert(!debug.preloadedAssetKeys.includes("beachProps"), `Old sliced beach atlas is still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("projectileFx"), `Projectile FX not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("playerEffects"), `Player raster effect FX not preloaded: ${JSON.stringify(debug)}`);
  assert(debug.preloadedAssetKeys.includes("fusionRelics"), `Fusion relic animation sheet is not preloaded: ${JSON.stringify(debug.preloadedAssetKeys)}`);
  assert(debug.preloadedAssetKeys.includes("signatureWeapons"), `Signature weapon animation sheet is not preloaded: ${JSON.stringify(debug.preloadedAssetKeys)}`);
  assert(["xpCrystalAnim", "xpCrystalGreenAnim", "xpCrystalRedAnim"].every((key) => debug.preloadedAssetKeys.includes(key)), `Imagen XP crystal variants are not preloaded: ${JSON.stringify(debug.preloadedAssetKeys)}`);
  assert(!debug.preloadedAssetKeys.includes("beach") && !debug.preloadedAssetKeys.includes("jungle") && !debug.preloadedAssetKeys.includes("topdownBeach"), `Unused heavy backgrounds are still preloaded: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFx, `Projectile FX sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.projectileFxTypes.includes("coconutBoomerang") && debug.combatAssets.projectileFxTypes.includes("monkeyCurseOrb"), `Projectile FX types missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.playerEffects, `Player raster effect sheet missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.playerEffectTypes.includes("ropeAura") && debug.combatAssets.playerEffectTypes.includes("compassBeam"), `Raster player effect types missing: ${JSON.stringify(debug)}`);
  assert(debug.combatAssets.weaponEvolutionFx && debug.combatAssets.weaponEvolutionFxTypes.includes("fusion3"), `Weapon evolution FX frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.fusionRelics && debug.combatAssets.fusionRelicTypes.includes("stormConch") && debug.combatAssets.fusionRelicTypes.includes("rumCometLantern"), `Fusion relic frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.signatureWeapons && debug.combatAssets.signatureWeaponFrames.rows >= 11 && debug.combatAssets.signatureWeaponTypes.includes("captainCutlass") && debug.combatAssets.signatureWeaponTypes.includes("lightningFan"), `Signature weapon frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.ryuActions && debug.combatAssets.ryuHadokenFx && debug.combatAssets.ryuActionFrames.rows === 5 && debug.combatAssets.ryuActionFrames.frames === 12, `Ryu HD action frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.kenActions && debug.combatAssets.kenDragonFx && debug.combatAssets.kenActionFrames.rows === 5 && debug.combatAssets.kenActionFrames.frames === 12 && debug.combatAssets.kenDragonFxFrames.rows === 3 && debug.combatAssets.kenDragonFxFrames.frames === 12, `Ken HD action frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.guileActions && debug.combatAssets.guileActionFrames.rows === 5 && debug.combatAssets.guileActionFrames.frames === 8, `Guile HD action frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.sonicBoomFx && debug.combatAssets.sonicBoomFrames.rows === 4 && debug.combatAssets.sonicBoomFrames.frames === 8, `Sonic Boom upgrade frameset missing: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.xpCrystalAnim && debug.combatAssets.xpCrystalAnimationFrames.frames === 8, `Imagen XP crystals should use an 8-frame HD animation sheet: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.xpCrystalVariants?.green && debug.combatAssets.xpCrystalVariants?.blue && debug.combatAssets.xpCrystalVariants?.red, `XP crystal color variants are not wired: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.xpCrystalTierSamples?.small === "green" && debug.combatAssets.xpCrystalTierSamples?.medium === "blue" && debug.combatAssets.xpCrystalTierSamples?.large === "red", `XP crystal tier thresholds are wrong: ${JSON.stringify(debug.combatAssets.xpCrystalTierSamples)}`);
  const xpCrystalProbe = await page.evaluate(async () => {
    const img = new Image();
    img.src = "assets/sprites/xp_crystal_anim_imagen_hd.png?xp-probe";
    await img.decode();
    const frame = 256;
    const canvas = document.createElement("canvas");
    canvas.width = frame;
    canvas.height = frame;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const frames = [];
    for (let col = 0; col < 8; col += 1) {
      ctx.clearRect(0, 0, frame, frame);
      ctx.drawImage(img, col * frame, 0, frame, frame, 0, 0, frame, frame);
      const data = ctx.getImageData(0, 0, frame, frame).data;
      let visible = 0;
      let edgeAlpha = 0;
      for (let y = 0; y < frame; y += 1) {
        for (let x = 0; x < frame; x += 1) {
          const index = (y * frame + x) * 4;
          const alpha = data[index + 3];
          if (alpha <= 8) continue;
          visible += 1;
          if (x === 0 || y === 0 || x === frame - 1 || y === frame - 1) edgeAlpha += 1;
        }
      }
      frames.push({ col, visible, edgeAlpha });
    }
    return { size: [img.naturalWidth, img.naturalHeight], frames };
  });
  assert(xpCrystalProbe.size[0] === 2048 && xpCrystalProbe.size[1] === 256 && xpCrystalProbe.frames.every((frame) => frame.visible > 9000 && frame.edgeAlpha === 0), `XP crystal frames should be clean and non-empty: ${JSON.stringify(xpCrystalProbe)}`);
  const xpCrystalColorProbe = await page.evaluate(async () => {
    const assets = [
      { tier: "green", src: "assets/sprites/xp_crystal_green_anim_imagen_hd.png?xp-color-probe" },
      { tier: "red", src: "assets/sprites/xp_crystal_red_anim_imagen_hd.png?xp-color-probe" },
    ];
    const results = [];
    for (const asset of assets) {
      const img = new Image();
      img.src = asset.src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      let edgeAlpha = 0;
      for (let y = 0; y < canvas.height; y += 1) {
        for (let x = 0; x < canvas.width; x += 1) {
          const index = (y * canvas.width + x) * 4;
          const alpha = data[index + 3];
          if (alpha <= 24) continue;
          r += data[index];
          g += data[index + 1];
          b += data[index + 2];
          count += 1;
          if (x === 0 || y === 0 || x === canvas.width - 1 || y === canvas.height - 1) edgeAlpha += 1;
        }
      }
      results.push({
        tier: asset.tier,
        size: [img.naturalWidth, img.naturalHeight],
        avg: count > 0 ? { r: r / count, g: g / count, b: b / count } : { r: 0, g: 0, b: 0 },
        count,
        edgeAlpha,
      });
    }
    return results;
  });
  const greenCrystalProbe = xpCrystalColorProbe.find((probe) => probe.tier === "green");
  const redCrystalProbe = xpCrystalColorProbe.find((probe) => probe.tier === "red");
  assert(
    greenCrystalProbe?.size[0] === 2048 &&
      greenCrystalProbe?.size[1] === 256 &&
      greenCrystalProbe.count > 50000 &&
      greenCrystalProbe.edgeAlpha === 0 &&
      greenCrystalProbe.avg.g > greenCrystalProbe.avg.r * 2 &&
      greenCrystalProbe.avg.g > greenCrystalProbe.avg.b * 1.3,
    `Green XP crystal sheet is not cleanly green: ${JSON.stringify(xpCrystalColorProbe)}`,
  );
  assert(
    redCrystalProbe?.size[0] === 2048 &&
      redCrystalProbe?.size[1] === 256 &&
      redCrystalProbe.count > 50000 &&
      redCrystalProbe.edgeAlpha === 0 &&
      redCrystalProbe.avg.r > redCrystalProbe.avg.g * 2 &&
      redCrystalProbe.avg.r > redCrystalProbe.avg.b * 1.3,
    `Red XP crystal sheet is not cleanly red: ${JSON.stringify(xpCrystalColorProbe)}`,
  );
  assert(debug.weaponEvolution?.frames?.cols === 4 && debug.weaponEvolution?.frames?.rows === 4, `Weapon evolution sheet should expose 4x4 frames: ${JSON.stringify(debug.weaponEvolution)}`);
  assert(debug.weaponEvolution?.fusionRelics?.asset && debug.weaponEvolution.fusionRelics.frames.frames === 4 && debug.weaponEvolution.fusionRelics.types.length === 4, `Fusion relic animation metadata missing: ${JSON.stringify(debug.weaponEvolution?.fusionRelics)}`);
  assert(debug.combatAssets.ryuActions && debug.combatAssets.ryuHadokenFx && debug.combatAssets.ryuActionFrames.rows === 5 && debug.combatAssets.ryuActionFrames.frames === 12 && debug.combatAssets.ryuHadokenFxFrames.rows === 4 && debug.combatAssets.ryuHadokenFxFrames.frames === 12, `Ryu complex action/projectile combat assets are not wired: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.kenActions && debug.combatAssets.kenDragonFx && debug.combatAssets.kenActionFrames.rows === 5 && debug.combatAssets.kenActionFrames.frames === 12 && debug.combatAssets.kenActionFrames.rowsByAction.whirlwindKick === 3 && debug.combatAssets.kenDragonFxFrames.rows === 3 && debug.combatAssets.kenDragonFxFrames.frames === 12 && debug.combatAssets.kenDragonFxFrames.rowsByFx.whirlwindKick === 2 && debug.combatAssets.kenDragonFxTypes.includes("shoryuken") && debug.combatAssets.kenDragonFxTypes.includes("dragonKick") && debug.combatAssets.kenDragonFxTypes.includes("whirlwindKick"), `Ken complex action/dragon combat assets are not wired: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.chunLiActions && debug.combatAssets.chunLiProjectiles && debug.combatAssets.chunLiActionFrames.rows === 5 && debug.combatAssets.chunLiActionFrames.frames === 12 && debug.combatAssets.chunLiProjectileFrames.rows === 3 && debug.combatAssets.chunLiProjectileFrames.frames === 12, `Chun Li action/projectile combat assets are not wired: ${JSON.stringify(debug.combatAssets)}`);
  assert(
    debug.combatAssets.streetFighterWalkFirstCombatFlow === true
      &&
    debug.combatAssets.streetFighterIdleContactCounters === true
      &&
    debug.combatAssets.streetFighterPeacefulIdleOnly === true
      &&
    debug.combatAssets.streetFighterExFlow === true
      &&
    debug.combatAssets.streetFighterExThreshold === 3
      &&
    Object.values(debug.combatAssets.streetFighterBasicMovement).every((movement) => movement.baseAction === "walk" && movement.rows === 1 && movement.totalFrames === movement.framesPerRow && movement.startupActions.length === 1 && movement.ambientActions.length >= 1 && movement.allAmbientActions.length >= 3 && movement.sparseActionShare >= 0.18 && movement.sparseActionShare <= 0.26),
    `Street Fighter basic movement should stay walk-first with one starter and later idle flourishes plus EX flow: ${JSON.stringify(debug.combatAssets.streetFighterBasicMovement)}`,
  );
  assert(debug.combatAssets.streetFighterBasicMovement.ryu.totalFrames === 12 && debug.combatAssets.streetFighterBasicMovement.ken.totalFrames === 12 && debug.combatAssets.streetFighterBasicMovement.guile.totalFrames === 8 && debug.combatAssets.streetFighterBasicMovement.chunLi.totalFrames === 12, `Street Fighter walking frame counts are wrong: ${JSON.stringify(debug.combatAssets.streetFighterBasicMovement)}`);
  assert(debug.combatAssets.threeHeadedMonkeyVolley === true, `Three-headed monkey should fire a three-shot curse volley: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.timeTentacleVolley === true, `Time tentacle boss should fire a three-shot curse volley: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.combatAssets.blackbeardBroadside === true, `Blackbeard should fire a three-shot cannon broadside: ${JSON.stringify(debug.combatAssets)}`);
  assert(debug.upgradeIcons.coconut === "coconutBoomerang" && debug.weaponLoadoutIcons.coconut === "coconutBoomerang", `Coconut boomerang preview still uses the wrong icon: ${JSON.stringify(debug)}`);
  assert(debug.upgradeIcons.rope === "ropeRing" && debug.weaponLoadoutIcons.rope === "ropeRing", `Rope ring preview still uses the old rope icon: ${JSON.stringify(debug)}`);
  assert(debug.upgradeIcons.rubyRing === "rubyRing" && debug.upgradeIcons.moonSigil === "moonSigil" && debug.upgradeIcons.blueVial === "blueVial", `New item upgrades are missing: ${JSON.stringify(debug.upgradeIcons)}`);
  assert(debug.upgradeIcons.stormConch === "stormConch" && debug.upgradeIcons.bloodMoonAnchor === "bloodMoonAnchor" && debug.upgradeIcons.krakenCompass === "krakenCompass" && debug.upgradeIcons.rumCometLantern === "rumCometLantern", `Fusion relic upgrades are missing: ${JSON.stringify(debug.upgradeIcons)}`);
  assert(debug.uiIconSources.projectileFxIcons === true && debug.uiIconSources.ryuHadokenIcons === true && debug.uiIconSources.kenDragonIcons === true && debug.uiIconSources.chunLiProjectileIcons === true, `Projectile FX icons are not available to the UI: ${JSON.stringify(debug)}`);
  assert(debug.ropeVisual.renderMode === "ropeWardSprites" && debug.ropeVisual.sprite === "ropeRing", `Rope ring still uses the old rotating aura mode: ${JSON.stringify(debug)}`);
  assert(debug.engagement?.streak?.nextCache >= 18 && debug.engagement?.streak?.caches >= 0, `Streak treasure loop missing: ${JSON.stringify(debug)}`);
  assert(debug.engagement?.momentumHud?.text && debug.engagement?.momentumHud?.detail && debug.engagement?.momentumMultiplier?.speed === 1, `Momentum HUD/debug state missing: ${JSON.stringify(debug.engagement)}`);
  assert(debug.obstacles.blockingProps >= 20, `Massive blocking obstacles are missing: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.blockingPropTypes.includes("beachHut") && debug.obstacles.blockingPropTypes.includes("boatWreck"), `Huts and wrecks are not blocking: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.blockingPropTypes.includes("hedgeCluster") || debug.obstacles.blockingPropTypes.includes("palmHedge"), `Hedge blockers are missing: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.passThroughEnemyTypes.includes("cryptBat") && debug.obstacles.passThroughEnemyTypes.includes("gargoyle"), `Flying enemies should ignore obstacles: ${JSON.stringify(debug.obstacles)}`);
  assert(debug.obstacles.passThroughEnemyTypes.includes("lanternWraith") && debug.obstacles.passThroughEnemyTypes.includes("spectralCaptain"), `Ghost enemies should phase through obstacles: ${JSON.stringify(debug.obstacles)}`);

  const obstacleProbe = await page.evaluate(() => window.__MONKEY_TIDE_OBSTACLE_PROBE());
  assert(obstacleProbe.playerBlocked && obstacleProbe.playerStayedOnApproachSide, `Player did not route around blocker: ${JSON.stringify(obstacleProbe)}`);
  assert(obstacleProbe.groundPushed, `Ground enemy was not pushed out of blocker: ${JSON.stringify(obstacleProbe)}`);
  assert(obstacleProbe.ghostCanPass, `Ghost/flying pass-through rule failed: ${JSON.stringify(obstacleProbe)}`);

  const propProbe = await page.evaluate(() => window.__MONKEY_TIDE_PROP_VISUAL_PROBE());
  assert(propProbe.props.some((prop) => prop.icon === "openTreasureChest" && prop.image === "beachOpenTreasure"), `Open chest probe did not use the Imagen asset: ${JSON.stringify(propProbe)}`);
  assert(propProbe.props.filter((prop) => prop.discovered).every((prop) => prop.alpha >= 0.7), `Discovered props are still being greyed out: ${JSON.stringify(propProbe)}`);

  const streakProbe = await page.evaluate(() => window.__MONKEY_TIDE_STREAK_CACHE_PROBE());
  assert(streakProbe.cache?.hasFade && !streakProbe.cache.inSightline && streakProbe.cache.distance >= 900, `Streak cache spawned inside the visible playfield: ${JSON.stringify(streakProbe)}`);
  const momentumProbe = await page.evaluate(() => window.__MONKEY_TIDE_MOMENTUM_PROBE());
  assert(
    momentumProbe.hud.text
      && momentumProbe.hud.detail.includes("Testtempo")
      && momentumProbe.hud.hot
      && momentumProbe.hud.surging
      && momentumProbe.speed > 1
      && momentumProbe.damage > 1
      && momentumProbe.cooldown < 1
      && momentumProbe.debug.engagement.momentumHud.surgeActive,
    `Momentum surge HUD/buff loop did not activate: ${JSON.stringify(momentumProbe)}`,
  );

  const monkeyProbe = await page.evaluate(() => window.__MONKEY_TIDE_THREE_MONKEY_PROBE());
  assert(monkeyProbe.assetLoaded && monkeyProbe.boss?.id === "threeHeadedMonkey", `Three-headed monkey boss did not spawn: ${JSON.stringify(monkeyProbe)}`);
  assert(monkeyProbe.animationLoaded && monkeyProbe.animationFrames.frames === 8, `Three-headed monkey animation probe missing: ${JSON.stringify(monkeyProbe)}`);
  assert(monkeyProbe.profile?.count === 3 && monkeyProbe.monkeyProjectiles >= 3, `Three-headed monkey volley did not fire: ${JSON.stringify(monkeyProbe)}`);

  const blackbeardProbe = await page.evaluate(() => window.__MONKEY_TIDE_BLACKBEARD_PROBE());
  assert(blackbeardProbe.assetLoaded && blackbeardProbe.boss?.id === "blackbeard", `Blackbeard boss did not spawn: ${JSON.stringify(blackbeardProbe)}`);
  assert(blackbeardProbe.animationLoaded && blackbeardProbe.animationFrames.frames === 8, `Blackbeard animation probe missing: ${JSON.stringify(blackbeardProbe)}`);
  assert(blackbeardProbe.profile?.count === 3 && blackbeardProbe.cannonballs >= 3, `Blackbeard broadside did not fire: ${JSON.stringify(blackbeardProbe)}`);

  const timeTentacleProbe = await page.evaluate(() => window.__MONKEY_TIDE_TIME_TENTACLE_PROBE());
  assert(timeTentacleProbe.assetLoaded && timeTentacleProbe.boss?.id === "tideTentacle", `Time tentacle boss did not spawn: ${JSON.stringify(timeTentacleProbe)}`);
  assert(timeTentacleProbe.animationLoaded && timeTentacleProbe.animationFrames.frames === 12 && timeTentacleProbe.animationFrames.cols === 6, `Time tentacle animation probe missing frames: ${JSON.stringify(timeTentacleProbe)}`);
  assert(timeTentacleProbe.profile?.count === 3 && timeTentacleProbe.curseOrbs >= 3, `Time tentacle curse volley did not fire: ${JSON.stringify(timeTentacleProbe)}`);

  const newEnemyProbe = await page.evaluate(() => window.__MONKEY_TIDE_NEW_ENEMY_PROBE());
  assert(newEnemyProbe.assetLoaded && newEnemyProbe.animationFrames.frames === 8, `New enemy animation sheet missing: ${JSON.stringify(newEnemyProbe)}`);
  assert(newEnemyProbe.platformerAnimationFrames.frames === 11 && ["reefSquid", "cactusStack"].every((id) => newEnemyProbe.platformerTypes.includes(id)), `Platformer squid/cactus HD animation sheet missing: ${JSON.stringify(newEnemyProbe)}`);
  assert(["tideTentacle", "reefSquid", "cactusStack"].every((id) => newEnemyProbe.spawned.includes(id)), `New enemy trio did not spawn: ${JSON.stringify(newEnemyProbe)}`);
  const omenProbe = await page.evaluate(() => window.__MONKEY_TIDE_OMEN_SHARD_PROBE());
  assert(omenProbe.omen.count === 3 && omenProbe.omen.boons >= 1 && omenProbe.omen.nextReward === 6 && omenProbe.powerupDrops >= 1 && omenProbe.omenZones >= 1, `Omen shard elite reward loop did not trigger: ${JSON.stringify(omenProbe)}`);

  const weaponEvolutionProbe = await page.evaluate(() => window.__MONKEY_TIDE_WEAPON_EVOLUTION_PROBE());
  assert(weaponEvolutionProbe.assetLoaded && weaponEvolutionProbe.slash?.blades === 5, `Fivefold cutlass animation did not activate: ${JSON.stringify(weaponEvolutionProbe)}`);
  assert(weaponEvolutionProbe.tornado?.fused === true && weaponEvolutionProbe.debug.weaponEvolution.saberTornadoFusionReady, `Saber tornado fusion did not activate: ${JSON.stringify(weaponEvolutionProbe)}`);
  assert(weaponEvolutionProbe.debug.weaponEvolution.fusionTypes.starCoconut && weaponEvolutionProbe.debug.weaponEvolution.fusionTypes.grogMaelstrom && weaponEvolutionProbe.debug.weaponEvolution.fusionTypes.moonNet, `New weapon fusions did not become ready: ${JSON.stringify(weaponEvolutionProbe.debug.weaponEvolution)}`);
  assert(weaponEvolutionProbe.debug.weaponEvolution.fusionMoments.count >= 4, `Fusion achievement moments did not record: ${JSON.stringify(weaponEvolutionProbe.debug.weaponEvolution)}`);
  const slashDirectionProbe = await page.evaluate(() => window.__MONKEY_TIDE_SLASH_DIRECTION_PROBE());
  assert(slashDirectionProbe.frontHit && !slashDirectionProbe.backHit && slashDirectionProbe.zone?.forward >= 110 && slashDirectionProbe.zone?.visualStartForward >= 45, `Cutlass slash should project forward from the player: ${JSON.stringify(slashDirectionProbe)}`);
  const fusionRelicProbe = await page.evaluate(() => window.__MONKEY_TIDE_FUSION_RELIC_PROBE());
  assert(fusionRelicProbe.assetLoaded && fusionRelicProbe.frames.frames === 4 && fusionRelicProbe.relicTypes.length === 4, `Fusion relic sheet probe failed: ${JSON.stringify(fusionRelicProbe)}`);
  assert(Object.values(fusionRelicProbe.amplifiers).every((value) => value >= 2), `Fusion relic amplifiers did not apply: ${JSON.stringify(fusionRelicProbe)}`);
  assert(fusionRelicProbe.relicZones.length >= 4 && fusionRelicProbe.boostedCoconuts >= 1 && fusionRelicProbe.boostedBottles >= 1, `Fusion relic boosts did not show in combat: ${JSON.stringify(fusionRelicProbe)}`);

  const progressProbe = await page.evaluate(() => window.__MONKEY_TIDE_PROGRESS_PROBE());
  assert(progressProbe.powerups.types.length >= 10 && progressProbe.powerups.active.length >= 10, `Power-up system did not activate all item types: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.powerups.types.includes("fusionSpark") && progressProbe.powerups.types.includes("saberFever") && progressProbe.powerups.types.includes("stormRhythm") && progressProbe.powerups.types.includes("omenBounty"), `New power-up types missing: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.powerups.randomDropChance <= 0.004 && progressProbe.powerups.streakDropEvery >= 40, `Power-up drops are too frequent: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.powerups.combatCooldown >= 40 && progressProbe.powerups.magnetRange <= 90, `Power-up pickups are too intrusive: ${JSON.stringify(progressProbe.powerups)}`);
  assert(progressProbe.levelFlow.reducedInterruptions && progressProbe.levelFlow.choiceLevels[0] === 3 && progressProbe.levelFlow.choiceLevels[1] === 7 && progressProbe.levelFlow.choiceLevels[2] === 11 && progressProbe.levelFlow.rewardTypes >= 6, `Level-up flow rewards are incomplete: ${JSON.stringify(progressProbe.levelFlow)}`);
  assert(progressProbe.levelFlow.xpTuning.initialNextXp >= 44 && progressProbe.levelFlow.xpTuning.firstChoiceLevel >= 3 && progressProbe.levelFlow.xpTuning.choiceInterval >= 4 && progressProbe.levelFlow.firstChoiceNextXp >= 75, `Early upgrades still arrive too quickly: ${JSON.stringify(progressProbe.levelFlow)}`);
  assert(progressProbe.progression.achievements.powerCollector && progressProbe.progression.achievements.wreckDiver && progressProbe.progression.achievements.nightRaid && progressProbe.progression.achievements.fusionSmith && progressProbe.progression.achievements.flowRunner, `Progress achievements did not unlock: ${JSON.stringify(progressProbe.progression)}`);
  assert(progressProbe.map.unlocked.includes("gothicCove") && progressProbe.map.unlocked.includes("treasureAtoll"), `Unlockable maps did not unlock: ${JSON.stringify(progressProbe.map)}`);
  assert(progressProbe.progression.unlockedRelics.includes("Grog-Stiefel") && progressProbe.progression.unlockedRelics.includes("Flutkompass") && progressProbe.progression.unlockedRelics.includes("Fusionskern") && progressProbe.progression.unlockedRelics.includes("Flow-Anker"), `Unlockable relics missing: ${JSON.stringify(progressProbe.progression)}`);
  const metaSkillProbe = await page.evaluate(() => window.__MONKEY_TIDE_META_SKILL_PROBE());
  assert(
    metaSkillProbe.boughtSignature
      && metaSkillProbe.boughtFlow
      && metaSkillProbe.boughtHeart
      && metaSkillProbe.skills.signatureMastery >= 1
      && metaSkillProbe.skills.flowMemory >= 1
      && metaSkillProbe.skills.tideHeart >= 1
      && metaSkillProbe.stateStats.signatureDamage > 1
      && metaSkillProbe.stateStats.powerupDuration > 1
      && metaSkillProbe.playerMaxHp > 150
      && metaSkillProbe.signatureTimer < 1.2
      && metaSkillProbe.cardCount >= 6,
    `Between-run rogue-lite skill system did not apply: ${JSON.stringify(metaSkillProbe)}`,
  );

  const upgradeProbe = await page.evaluate(() => {
    if (window.__MONKEY_TIDE_DEBUG().phase !== "levelup") window.__MONKEY_TIDE_FORCE_LEVELUP();
    const before = window.__MONKEY_TIDE_DEBUG();
    const menuCards = [...document.querySelectorAll(".upgrade-card")].map((card) => {
      const style = getComputedStyle(card);
      return {
        kind: card.dataset.upgradeKind,
        hasAura: !!card.querySelector(".upgrade-aura"),
        hasHotkey: !!card.querySelector(".upgrade-hotkey"),
        hasIconWrap: !!card.querySelector(".upgrade-icon-wrap .upgrade-icon"),
        hasTag: !!card.querySelector(".upgrade-tag")?.textContent.trim(),
        animationName: style.animationName,
        auraAnimationName: getComputedStyle(card.querySelector(".upgrade-aura")).animationName,
        transitionDuration: style.transitionDuration,
      };
    });
    const panelStyle = getComputedStyle(document.querySelector(".upgrade-panel"));
    const panelFoilStyle = getComputedStyle(document.querySelector(".upgrade-panel"), "::before");
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }));
    const selected = document.querySelector(".upgrade-card.selected")?.dataset.upgradeIndex;
    const selectedStyle = getComputedStyle(document.querySelector(".upgrade-card.selected"));
    const selectedHotkeyStyle = getComputedStyle(document.querySelector(".upgrade-card.selected .upgrade-hotkey"));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }));
    return { before, selected, menuCards, panelAnimation: panelStyle.animationName, panelFoilAnimation: panelFoilStyle.animationName, selectedAnimation: selectedStyle.animationName, selectedHotkeyAnimation: selectedHotkeyStyle.animationName, selectedTransform: selectedStyle.transform, after: window.__MONKEY_TIDE_DEBUG() };
  });
  assert(upgradeProbe.before.phase === "levelup", `Forced level-up did not open upgrades: ${JSON.stringify(upgradeProbe)}`);
  assert(upgradeProbe.before.audio.activeTrack && Math.max(upgradeProbe.before.audio.mainVolume, upgradeProbe.before.audio.rushVolume) > 0, `BGM should keep playing while choosing an upgrade: ${JSON.stringify(upgradeProbe.before.audio)}`);
  assert(
    upgradeProbe.menuCards.length >= 3
      && upgradeProbe.menuCards.every((card) => card.kind && card.hasAura && card.hasHotkey && card.hasIconWrap && card.hasTag && card.animationName.includes("upgradeCardIn") && card.auraAnimationName.includes("auraDrift") && card.transitionDuration !== "0s")
      && upgradeProbe.panelAnimation.includes("upgradePanelIn")
      && upgradeProbe.panelFoilAnimation.includes("panelFoil")
      && upgradeProbe.selectedAnimation.includes("selectedCardBreath")
      && upgradeProbe.selectedHotkeyAnimation.includes("hotkeyGleam"),
    `Upgrade selection menu should use the animated relic-card treatment: ${JSON.stringify(upgradeProbe)}`,
  );
  assert(upgradeProbe.selected === "1", `Keyboard did not move upgrade focus: ${JSON.stringify(upgradeProbe)}`);
  assert(upgradeProbe.after.phase === "playing", `Enter did not choose upgrade: ${JSON.stringify(upgradeProbe)}`);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(150);
  const touchProbe = await page.evaluate(() => {
    if (window.__MONKEY_TIDE_DEBUG().phase === "levelup") document.querySelector(".upgrade-card")?.click();
    window.__MONKEY_TIDE_CLEAR_PLAYTEST_AREA?.();
    const before = window.__MONKEY_TIDE_DEBUG();
    const target = document.elementFromPoint(82, 570) || document.getElementById("gameCanvas");
    target.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 570,
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 650,
    }));
    const active = window.__MONKEY_TIDE_DEBUG();
    window.__MONKEY_TIDE_STEP(0.35);
    const moved = window.__MONKEY_TIDE_DEBUG();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      pointerId: 77,
      pointerType: "touch",
      clientX: 82,
      clientY: 650,
    }));
    const after = window.__MONKEY_TIDE_DEBUG();
    if (after.phase === "levelup") document.querySelector(".upgrade-card")?.click();
    const rightTarget = document.elementFromPoint(330, 420) || document.getElementById("gameCanvas");
    rightTarget.dispatchEvent(new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 330,
      clientY: 420,
    }));
    window.dispatchEvent(new PointerEvent("pointermove", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 260,
      clientY: 420,
    }));
    const rightActive = window.__MONKEY_TIDE_DEBUG();
    window.dispatchEvent(new PointerEvent("pointerup", {
      bubbles: true,
      cancelable: true,
      pointerId: 78,
      pointerType: "touch",
      clientX: 260,
      clientY: 420,
    }));
    return { before, active, moved, after, rightActive, rightAfter: window.__MONKEY_TIDE_DEBUG() };
  });
  assert(touchProbe.active.pointer.active === true, `Mobile thumbstick did not activate: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.active.pointer.dy > 0.6, `Mobile thumbstick did not point down: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.moved.player.y > touchProbe.before.player.y + 24, `Mobile thumbstick did not move player quickly enough: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.moved.scene.zoom <= 0.39, `Mobile camera is not zoomed out: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.after.pointer.active === false, `Mobile thumbstick did not reset: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightActive.pointer.active === true, `Right-side thumbstick did not activate: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightActive.pointer.dx < -0.6, `Right-side thumbstick did not point left: ${JSON.stringify(touchProbe)}`);
  assert(touchProbe.rightAfter.pointer.active === false, `Right-side thumbstick did not reset: ${JSON.stringify(touchProbe)}`);

  await page.setViewportSize({ width: 844, height: 390 });
  await page.waitForTimeout(200);
  const landscapeUi = await page.evaluate(() => {
    const box = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    return {
      debug: window.__MONKEY_TIDE_DEBUG(),
      hud: box("#hud"),
      controls: box("#cornerControls"),
      loadout: box("#loadout"),
      dash: box("#dashButton"),
      fullscreenText: document.getElementById("fullscreenButton").textContent,
    };
  });
  assert(landscapeUi.debug.scene.zoom <= 0.36, `Landscape camera is not zoomed out: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.hud.width <= 360 && landscapeUi.hud.bottom <= 58, `Landscape HUD covers too much playfield: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.loadout.height <= 54, `Landscape loadout is too tall: ${JSON.stringify(landscapeUi)}`);
  assert(landscapeUi.dash.width <= 72 && landscapeUi.dash.height <= 72, `Landscape dash button is too large: ${JSON.stringify(landscapeUi)}`);
  assert(["FS", "MIN"].includes(landscapeUi.fullscreenText), `Fullscreen toggle missing: ${JSON.stringify(landscapeUi)}`);

  const probe = await page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let lit = 0;
    let alpha = 0;
    let checksum = 0;
    for (let i = 0; i < data.length; i += 128) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const a = data[i + 3];
      if (a > 0) alpha += 1;
      if (r + g + b > 60) lit += 1;
      checksum = (checksum + r * 3 + g * 5 + b * 7 + a * 11 + i) % 1000000007;
    }
    return { lit, alpha, checksum };
  });
  assert(probe.alpha > 1000 && probe.lit > 1000, `Canvas appears blank: ${JSON.stringify(probe)}`);
  assert(consoleErrors.length === 0, `Console errors:\n${consoleErrors.join("\n")}`);
  assert(pageErrors.length === 0, `Page errors:\n${pageErrors.join("\n")}`);
  assert(badResponses.length === 0, `Bad responses:\n${badResponses.join("\n")}`);

  await Promise.race([browser.close(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  await closeServer(server);
  console.log(`smoke ok ${url}`);
  process.exit(0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
