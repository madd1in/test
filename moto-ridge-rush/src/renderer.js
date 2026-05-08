(function () {
  const MotoRidge = (window.MotoRidge = window.MotoRidge || {});
  const { sampleTrack, zoneAt, clamp } = MotoRidge.Simulation;

  function createRenderer(canvas, assets) {
    const ctx = canvas.getContext("2d", { alpha: false });
    let dpr = 1;
    let width = canvas.width;
    let height = canvas.height;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(320, Math.round(rect.width));
      height = Math.max(240, Math.round(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawSplash(time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      drawSky("canyon");
      const fake = {
        level: assets.levels[0],
        bike: { x: 420 + Math.sin(time * 0.001) * 24, y: 478, angle: Math.sin(time * 0.002) * 0.04, grounded: true, vx: 280, invincible: 0, heat: 0.25, turboActive: false, brakeActive: false },
        camera: { x: 0, y: 0, shake: 0 },
        particles: [],
        race: { pickups: new Set(), hazardsHit: new Set() }
      };
      if (fake.level.perspective && assets.images.mode7Tiles) {
        drawHdBackdrop(fake);
        drawMode7Ground(fake, time);
        drawProjectedWorld(fake, time);
        drawBike(fake, time);
      } else {
        drawBackground(fake);
        drawTerrain(fake);
        drawDecor(fake);
        drawBike(fake, time);
      }
    }

    function draw(state, time) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      const shake = state.camera.shake || 0;
      const sx = shake ? Math.sin(time * 0.07) * shake : 0;
      const sy = shake ? Math.cos(time * 0.09) * shake * 0.5 : 0;
      ctx.save();
      ctx.translate(sx, sy);
      drawSky(state.level.theme);
      if (state.level.perspective && assets.images.mode7Tiles) {
        drawHdBackdrop(state);
        drawMode7Ground(state, time);
        drawProjectedWorld(state, time);
        drawParticles(state, time);
        drawBike(state, time);
      } else {
        drawBackground(state);
        drawTerrain(state);
        drawDecor(state);
        drawPickups(state, time);
        drawHazards(state);
        drawParticles(state, time);
        drawBike(state, time);
        drawTrackHighlights(state, time);
      }
      ctx.restore();
    }

    function drawSky(theme) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      if (theme === "storm") {
        gradient.addColorStop(0, "#232d45");
        gradient.addColorStop(0.55, "#54616e");
        gradient.addColorStop(1, "#b77b4a");
      } else if (theme === "pine") {
        gradient.addColorStop(0, "#83cdd8");
        gradient.addColorStop(0.58, "#c7dcb4");
        gradient.addColorStop(1, "#f0c184");
      } else {
        gradient.addColorStop(0, "#8fd3df");
        gradient.addColorStop(0.6, "#f2c078");
        gradient.addColorStop(1, "#b87956");
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }

    function drawHdBackdrop(state) {
      const image = assets.images.hdBackgrounds;
      const meta = assets.manifest.images.hdBackgrounds;
      if (!image || !meta) {
        drawBackground(state);
        return;
      }
      const frame = meta.frames[state.level.theme] || meta.frames.canyon;
      const horizon = getHorizon();
      const bgH = Math.max(horizon + 84, height * 0.56);
      const scroll = -((state.camera.x * 0.035) % width);
      drawFrame(image, frame, scroll, 0, width, bgH);
      drawFrame(image, frame, scroll + width, 0, width, bgH);
      ctx.save();
      const haze = ctx.createLinearGradient(0, horizon - 70, 0, horizon + 80);
      haze.addColorStop(0, "rgba(247,244,232,0)");
      haze.addColorStop(0.5, "rgba(247,244,232,0.24)");
      haze.addColorStop(1, "rgba(247,244,232,0)");
      ctx.fillStyle = haze;
      ctx.fillRect(0, horizon - 80, width, 180);
      ctx.restore();
    }

    function drawMode7Ground(state, time) {
      const image = assets.images.mode7Tiles;
      const frames = assets.manifest.images.mode7Tiles.frames;
      const horizon = getHorizon();
      const bottom = height + 36;
      const stripH = Math.max(6, Math.floor(height / 92));
      ctx.save();
      const groundFill = ctx.createLinearGradient(0, horizon, 0, bottom);
      groundFill.addColorStop(0, state.level.theme === "storm" ? "#252b36" : "#9a7449");
      groundFill.addColorStop(1, state.level.theme === "pine" ? "#3f4d36" : "#2b2528");
      ctx.fillStyle = groundFill;
      ctx.fillRect(0, horizon - 8, width, bottom - horizon + 8);
      for (let y = horizon; y < bottom; y += stripH) {
        const t = clamp((y - horizon) / (bottom - horizon), 0, 1);
        const near = Math.pow(t, 1.08);
        const depth = Math.pow(1 - t, 1.9);
        const sampleX = state.bike.x + 120 + depth * 3100;
        const zone = zoneAt(state.level, sampleX);
        const roadTile = pickMode7Tile(state.level.theme, zone, sampleTrack(state.level, sampleX));
        const shoulderTile = state.level.theme === "pine" ? "pine_edge" : state.level.theme === "storm" ? "storm_asphalt" : "ocher_dust";
        const roadW = width * (0.18 + near * 1.12);
        const shoulderW = width * (0.46 + near * 0.84);
        const curve = Math.sin((state.bike.x + depth * 2600) / 920) * width * 0.18 * depth;
        const center = width / 2 + curve;
        const roadX = center - roadW / 2;
        const shoulderX = center - shoulderW / 2;
        const alpha = 0.42 + near * 0.58;
        ctx.globalAlpha = 0.72;
        drawFrame(image, frames[shoulderTile] || frames.worn_dirt, shoulderX, y, shoulderW, stripH + 1);
        ctx.globalAlpha = alpha;
        drawFrame(image, frames[roadTile] || frames.packed_dirt, roadX, y, roadW, stripH + 1);
        if (zone && zone.type === "boost") {
          ctx.globalAlpha = 0.45 + Math.sin(time * 0.011 + y) * 0.18;
          drawFrame(image, frames.teal_boost, roadX + roadW * 0.16, y, roadW * 0.68, stripH + 2);
        }
      }
      ctx.globalAlpha = 1;
      drawLaneLines(state, horizon, bottom, time);
      drawRoadVignette(horizon, bottom);
      ctx.restore();
    }

    function pickMode7Tile(theme, zone, ground) {
      if (zone && zone.type === "boost") return "teal_boost";
      if (zone && zone.type === "mud") return "wet_mud";
      if (zone && zone.type === "draft") return "teal_lane";
      if (ground.type === "ramp") return "jump_marker";
      if (ground.type === "checkpoint") return "checkpoint";
      if (theme === "storm") return "storm_asphalt";
      if (theme === "pine") return "tire_grooves";
      return "packed_dirt";
    }

    function drawLaneLines(state, horizon, bottom, time) {
      ctx.save();
      ctx.lineWidth = 2;
      ctx.strokeStyle = "rgba(247,244,232,0.48)";
      for (const lane of [-0.26, 0.26]) {
        ctx.beginPath();
        for (let i = 0; i <= 32; i += 1) {
          const t = i / 32;
          const y = horizon + Math.pow(t, 1.05) * (bottom - horizon);
          const roadW = width * (0.18 + t * 1.12);
          const depth = Math.pow(1 - t, 1.9);
          const curve = Math.sin((state.bike.x + depth * 2600) / 920) * width * 0.18 * depth;
          const x = width / 2 + curve + roadW * lane;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 0.26;
      ctx.strokeStyle = "#000";
      for (let y = horizon + ((state.bike.x * 0.04 + time * 0.02) % 48); y < bottom; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawRoadVignette(horizon, bottom) {
      const shade = ctx.createLinearGradient(0, horizon, 0, bottom);
      shade.addColorStop(0, "rgba(0,0,0,0)");
      shade.addColorStop(0.7, "rgba(0,0,0,0.08)");
      shade.addColorStop(1, "rgba(0,0,0,0.38)");
      ctx.fillStyle = shade;
      ctx.fillRect(0, horizon, width, bottom - horizon);
      const sideFade = ctx.createRadialGradient(width / 2, bottom * 0.96, width * 0.18, width / 2, bottom * 0.96, width * 0.74);
      sideFade.addColorStop(0, "rgba(0,0,0,0)");
      sideFade.addColorStop(1, "rgba(0,0,0,0.32)");
      ctx.fillStyle = sideFade;
      ctx.fillRect(0, horizon, width, bottom - horizon);
    }

    function drawBackground(state) {
      const sheet = assets.images.backgrounds;
      const meta = assets.manifest.images.backgrounds;
      for (const layer of state.level.tileLayers) {
        const scroll = state.camera.x * layer.parallax;
        const yShift = -state.camera.y * layer.parallax * 0.25;
        const tileW = layer.tileWidth;
        const tileH = layer.tileHeight;
        const start = Math.floor(scroll / tileW) - 1;
        const end = Math.ceil((scroll + width) / tileW) + 1;
        for (let row = 0; row < layer.rows; row += 1) {
          const rowData = layer.data[row % layer.data.length];
          for (let col = start; col <= end; col += 1) {
            const name = rowData[((col % rowData.length) + rowData.length) % rowData.length];
            const frame = meta.frames[name];
            if (!frame) continue;
            const dx = Math.round(col * tileW - scroll);
            const dy = Math.round(layer.offsetY + row * tileH + yShift);
            drawFrame(sheet, frame, dx, dy, tileW, tileH);
          }
        }
      }
    }

    function drawTerrain(state) {
      const camera = state.camera;
      const left = Math.floor(camera.x / 64) * 64 - 128;
      const right = camera.x + width + 160;
      const bottom = height + 160;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(-140, bottom);
      for (let x = left; x <= right; x += 24) {
        const ground = sampleTrack(state.level, x);
        ctx.lineTo(x - camera.x, ground.y - camera.y);
      }
      ctx.lineTo(width + 160, bottom);
      ctx.closePath();
      const fill = ctx.createLinearGradient(0, 300 - camera.y, 0, bottom);
      fill.addColorStop(0, "#8d5530");
      fill.addColorStop(0.42, "#5f3826");
      fill.addColorStop(1, "#2a211e");
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.restore();

      const terrain = assets.images.terrain;
      const frames = assets.manifest.images.terrain.frames;
      for (let x = left; x <= right; x += 64) {
        const ground = sampleTrack(state.level, x + 32);
        const zone = zoneAt(state.level, x + 32);
        let tile = "dirt_flat";
        if (zone && zone.type === "mud") tile = "mud";
        else if (zone && zone.type === "boost") tile = "boost";
        else if (ground.angle > 0.16) tile = "slope_down";
        else if (ground.angle < -0.16) tile = "slope_up";
        else if (ground.type === "ramp") tile = ground.angle < 0 ? "ramp_up" : "ramp_down";
        const dx = Math.round(x - camera.x);
        const dy = Math.round(ground.y - camera.y - 24);
        drawFrame(terrain, frames[tile], dx, dy, 64, 64);

        for (let yy = dy + 64; yy < height + 64; yy += 64) {
          const fillTile = yy > height - 96 ? "dark_fill" : "dirt_fill";
          drawFrame(terrain, frames[fillTile], dx, yy, 64, 64);
        }
      }

      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.strokeStyle = "#fff4bf";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let x = left; x <= right; x += 18) {
        const ground = sampleTrack(state.level, x);
        const sx = x - camera.x;
        const sy = ground.y - camera.y - 4;
        if (x === left) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.stroke();
      ctx.restore();
    }

    function drawDecor(state) {
      for (const item of state.level.decorations) {
        const ground = sampleTrack(state.level, item.x);
        drawDecorItem(item.kind, item.x - state.camera.x, ground.y - state.camera.y, item.kind.includes("finish") ? 1.2 : 1);
      }
    }

    function drawHazards(state) {
      for (const hazard of state.level.hazards) {
        if (state.race.hazardsHit.has(hazard.x)) continue;
        const ground = sampleTrack(state.level, hazard.x);
        drawDecorItem(hazard.kind, hazard.x - state.camera.x, ground.y - state.camera.y, hazard.kind === "barrel" ? 0.85 : 0.9);
      }
    }

    function drawProjectedWorld(state, time) {
      const horizon = getHorizon();
      const bottom = height + 36;
      const upcoming = [];
      for (const item of state.level.decorations) upcoming.push({ ...item, type: "decor" });
      for (const hazard of state.level.hazards) {
        if (!state.race.hazardsHit.has(hazard.x)) upcoming.push({ ...hazard, type: "hazard" });
      }
      for (const pickup of state.level.pickups) {
        const key = `${pickup.kind}-${pickup.x}`;
        if (!state.race.pickups.has(key)) upcoming.push({ ...pickup, type: "pickup", bob: Math.sin(time * 0.006 + pickup.x) * 4 });
      }
      upcoming.sort((a, b) => b.x - a.x);
      for (const item of upcoming) {
        const projection = projectWorld(state, item.x, horizon, bottom, laneForItem(item));
        if (!projection) continue;
        const kind = item.kind;
        const sizeBoost = item.type === "pickup" ? 0.74 : item.type === "hazard" ? 0.78 : kind.includes("finish") ? 1.24 : 0.92;
        drawProjectedDecorItem(kind, projection.x, projection.y + (item.bob || 0) * projection.scale, projection.scale * sizeBoost, item.type);
      }
    }

    function laneForItem(item) {
      if (item.kind === "finish_left") return -0.84;
      if (item.kind === "finish_right") return 0.84;
      if (item.kind === "checkpoint") return Math.sin(item.x * 0.01) > 0 ? -0.72 : 0.72;
      if (item.type === "pickup") return 0;
      if (item.type === "hazard") return Math.sin(item.x * 0.018) > 0 ? -0.5 : 0.5;
      return Math.sin(item.x * 0.007) > 0 ? -0.78 : 0.78;
    }

    function projectWorld(state, worldX, horizon, bottom, lane = 0) {
      const rel = worldX - state.bike.x;
      if (rel < -280 || rel > 3300) return null;
      const t = clamp(1 - rel / 3300, 0, 1);
      const roadW = width * (0.18 + t * 1.12);
      const depth = Math.pow(1 - t, 1.9);
      const curve = Math.sin((state.bike.x + depth * 2600) / 920) * width * 0.18 * depth;
      return {
        x: width / 2 + curve + lane * roadW * 0.38,
        y: horizon + Math.pow(t, 1.45) * (bottom - horizon) - 18,
        scale: 0.18 + t * 1.34,
        depth: t
      };
    }

    function drawProjectedDecorItem(kind, x, y, scale, type) {
      const frame = assets.manifest.images.decor.frames[kind] || assets.manifest.images.decor.frames.flag;
      const size = 88 * scale;
      ctx.save();
      ctx.globalAlpha = clamp(0.35 + scale * 0.52, 0.35, 1);
      ctx.fillStyle = "rgba(0,0,0,0.24)";
      ctx.beginPath();
      ctx.ellipse(x, y - size * 0.06, size * (type === "pickup" ? 0.24 : 0.42), size * 0.11, 0, 0, Math.PI * 2);
      ctx.fill();
      drawFrame(assets.images.decor, frame, x - size / 2, y - size, size, size);
      ctx.restore();
    }

    function drawPickups(state, time) {
      for (const pickup of state.level.pickups) {
        const key = `${pickup.kind}-${pickup.x}`;
        if (state.race.pickups.has(key)) continue;
        const ground = sampleTrack(state.level, pickup.x);
        const y = ground.y - 84 + Math.sin(time * 0.006 + pickup.x) * 5;
        ctx.save();
        ctx.translate(pickup.x - state.camera.x, y - state.camera.y);
        ctx.rotate(Math.sin(time * 0.004) * 0.12);
        drawDecorItem(pickup.kind, 0, 0, 0.72, true);
        ctx.restore();
      }
    }

    function drawDecorItem(kind, x, y, scale, centered) {
      const frame = assets.manifest.images.decor.frames[kind] || assets.manifest.images.decor.frames.flag;
      const size = 96 * scale;
      const dx = centered ? -size / 2 : x - size / 2;
      const dy = centered ? -size / 2 : y - size + 5;
      drawFrame(assets.images.decor, frame, dx, dy, size, size);
    }

    function drawParticles(state) {
      const fxMeta = assets.manifest.images.fx;
      for (const particle of state.particles) {
        const progress = clamp(particle.age / particle.life, 0, 0.999);
        const frames = fxMeta.animations[particle.kind] || fxMeta.animations.dust;
        const key = frames[Math.floor(progress * frames.length)];
        const frame = fxMeta.frames[key];
        let x = particle.x - state.camera.x;
        let y = particle.y - state.camera.y;
        let size = 72 * particle.scale * (1 + progress * 0.35);
        if (state.level.perspective && assets.images.mode7Tiles) {
          const projected = projectWorld(state, particle.x, getHorizon(), height + 36);
          if (!projected) continue;
          x = projected.x;
          y = projected.y;
          size *= projected.scale;
        }
        ctx.save();
        ctx.globalAlpha = 1 - progress * 0.6;
        drawFrame(assets.images.fx, frame, x - size / 2, y - size / 2, size, size);
        ctx.restore();
      }
    }

    function drawBike(state, time) {
      const bike = state.bike;
      const meta = assets.manifest.images.bike;
      const image = assets.images.bike;
      let anim = "idle";
      const speed = Math.abs(bike.vx || 0);
      if (bike.crashTimer > 0) anim = "crash";
      else if (!bike.grounded) anim = "air";
      else if (bike.turboActive) anim = "turbo";
      else if (bike.brakeActive && speed > 60) anim = "brake";
      else if (speed > 35) anim = "ride";
      const fps = anim === "idle" ? 7 : anim === "crash" ? 10 : 15;
      const keys = meta.animations[anim];
      const key = keys[Math.floor((time / 1000) * fps) % keys.length];
      const frame = meta.frames[key];
      const projected = state.level.perspective && assets.images.mode7Tiles;
      const x = projected ? width / 2 : bike.x - state.camera.x;
      const ground = projected ? sampleTrack(state.level, bike.x) : null;
      const airLift = projected && ground ? clamp((ground.y - 35 - bike.y) * 0.32, -8, 72) : 0;
      const y = projected ? height * 0.7 + Math.sin(bike.x * 0.015) * 5 - airLift : bike.y - state.camera.y;
      const scale = projected ? clamp(width / 900 + 0.03, 0.86, 1.44) : 1;
      ctx.save();
      ctx.translate(x, y);
      if (projected) {
        const shadowScale = scale / 1.44;
        ctx.fillStyle = "rgba(0,0,0,0.22)";
        ctx.beginPath();
        ctx.ellipse(0, 8 + airLift * 0.22, (76 - airLift * 0.24) * shadowScale, (18 - airLift * 0.05) * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.rotate((bike.angle || 0) * (projected ? 0.65 : 1));
      ctx.scale(scale, scale);
      if (bike.invincible > 0 && Math.floor(time / 90) % 2 === 0) ctx.globalAlpha = 0.55;
      drawFrame(image, frame, -76, -90, 152, 114);
      ctx.restore();
    }

    function drawTrackHighlights(state, time) {
      const terrain = assets.images.terrain;
      const frames = assets.manifest.images.terrain.frames;
      for (const zone of state.level.zones) {
        if (zone.x + zone.w < state.camera.x || zone.x > state.camera.x + width) continue;
        const name = zone.type === "boost" ? "boost" : "mud";
        const tile = frames[name];
        for (let x = zone.x; x < zone.x + zone.w; x += 64) {
          const ground = sampleTrack(state.level, x + 32);
          const pulse = zone.type === "boost" ? 0.78 + Math.sin(time * 0.008 + x) * 0.16 : 0.72;
          ctx.save();
          ctx.globalAlpha = pulse;
          drawFrame(terrain, tile, x - state.camera.x, ground.y - state.camera.y - 19, 64, 42);
          ctx.restore();
        }
      }
    }

    function drawFrame(image, frame, dx, dy, dw, dh) {
      if (!image || !frame) return;
      ctx.drawImage(image, frame.x, frame.y, frame.w, frame.h, dx, dy, dw, dh);
    }

    function getHorizon() {
      return Math.round(height * 0.42);
    }

    resize();
    window.addEventListener("resize", resize);

    return {
      resize,
      draw,
      drawSplash,
      get size() {
        return { width, height };
      }
    };
  }

  MotoRidge.createRenderer = createRenderer;
})();
