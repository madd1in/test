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
        particles: []
      };
      drawBackground(fake);
      drawTerrain(fake);
      drawDecor(fake);
      drawBike(fake, time);
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
      drawBackground(state);
      drawTerrain(state);
      drawDecor(state);
      drawPickups(state, time);
      drawHazards(state);
      drawParticles(state, time);
      drawBike(state, time);
      drawTrackHighlights(state, time);
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
        const size = 72 * particle.scale * (1 + progress * 0.35);
        ctx.save();
        ctx.globalAlpha = 1 - progress * 0.6;
        drawFrame(assets.images.fx, frame, particle.x - state.camera.x - size / 2, particle.y - state.camera.y - size / 2, size, size);
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
      const x = bike.x - state.camera.x;
      const y = bike.y - state.camera.y;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(bike.angle || 0);
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
