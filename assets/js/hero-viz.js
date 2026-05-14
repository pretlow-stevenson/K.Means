const BAR_COUNT = 92;
const NODE_COUNT = 38;

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function colorFor(progress, alpha = 1) {
  const stops = [
    [0, 126, 221],
    [25, 180, 210],
    [74, 76, 183],
    [216, 34, 130]
  ];
  const scaled = progress * (stops.length - 1);
  const index = Math.min(stops.length - 2, Math.floor(scaled));
  const amount = scaled - index;
  const start = stops[index];
  const end = stops[index + 1];
  const red = Math.round(lerp(start[0], end[0], amount));
  const green = Math.round(lerp(start[1], end[1], amount));
  const blue = Math.round(lerp(start[2], end[2], amount));
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function createNodes() {
  return Array.from({ length: NODE_COUNT }, (_, index) => {
    const progress = index / NODE_COUNT;
    return {
      angle: progress * Math.PI * 2 + Math.sin(index * 1.7) * 0.08,
      drift: 0.014 + (index % 5) * 0.002,
      phase: index * 0.71,
      radius: 0.43 + ((index * 13) % 6) / 100,
      size: 0.008 + ((index * 7) % 8) / 1000
    };
  });
}

export function startHeroViz() {
  const canvas = document.getElementById("radialViz");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const mouse = { x: 0, y: 0, active: false };
  const bars = Array.from({ length: BAR_COUNT }, (_, index) => ({
    phase: index * 0.35 + Math.random() * Math.PI
  }));
  const nodes = createNodes();
  let animationFrameId = null;
  let lastTime = performance.now();
  let drawableSize = 0;

  function handleInput(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    mouse.x = clientX - (rect.left + rect.width / 2);
    mouse.y = clientY - (rect.top + rect.height / 2);
    mouse.active = true;
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.round(Math.min(rect.width, rect.height));

    if (!size) {
      drawableSize = 0;
      return;
    }

    drawableSize = size;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (event) => handleInput(event.clientX, event.clientY));
  window.addEventListener("mouseleave", () => {
    mouse.active = false;
  });
  window.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length > 0) handleInput(event.touches[0].clientX, event.touches[0].clientY);
    },
    { passive: true }
  );
  window.addEventListener(
    "touchmove",
    (event) => {
      if (event.touches.length > 0) handleInput(event.touches[0].clientX, event.touches[0].clientY);
    },
    { passive: true }
  );
  window.addEventListener("touchend", () => {
    mouse.active = false;
  });
  window.addEventListener("touchcancel", () => {
    mouse.active = false;
  });

  function canAnimate() {
    return !document.hidden;
  }

  function scheduleDraw() {
    if (animationFrameId || !canAnimate()) return;
    animationFrameId = requestAnimationFrame(draw);
  }

  function drawNetwork(size, elapsed) {
    const positions = nodes.map((node, index) => {
      const angle = node.angle + elapsed * node.drift;
      const pulse = Math.sin(elapsed * 0.65 + node.phase) * 0.012;
      const radius = size * (node.radius + pulse);
      return {
        angle,
        color: colorFor(index / (NODE_COUNT - 1), 0.72),
        size: size * node.size * (1 + Math.sin(elapsed + node.phase) * 0.18),
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius
      };
    });

    ctx.lineWidth = Math.max(0.55, size * 0.0015);

    positions.forEach((point, index) => {
      [1, 2].forEach((offset) => {
        const next = positions[(index + offset) % positions.length];
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        if (distance > size * 0.2) return;

        const gradient = ctx.createLinearGradient(point.x, point.y, next.x, next.y);
        gradient.addColorStop(0, colorFor(index / (NODE_COUNT - 1), 0.22));
        gradient.addColorStop(1, colorFor(((index + offset) % NODE_COUNT) / (NODE_COUNT - 1), 0.12));
        ctx.strokeStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      });
    });

    positions.forEach((point) => {
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function drawBars(size, elapsed, dt) {
    const inner = size * 0.318;
    const outer = size * 0.455;

    ctx.lineCap = "butt";

    for (let index = 0; index < BAR_COUNT; index += 1) {
      const bar = bars[index];
      const progress = index / BAR_COUNT;
      const angle = progress * Math.PI * 2 - Math.PI / 2;
      bar.phase += dt * (0.85 + progress * 0.18);

      const wave =
        Math.sin(bar.phase + angle * 3) * 0.09 +
        Math.sin(elapsed * 0.42 - angle * 4) * 0.045;
      let interaction = 0;

      if (mouse.active) {
        const targetX = Math.cos(angle) * outer;
        const targetY = Math.sin(angle) * outer;
        const distance = Math.hypot(targetX - mouse.x, targetY - mouse.y);
        interaction = Math.max(0, 1 - distance / (size * 0.34)) * 0.18;
      }

      const height = Math.max(0.38, Math.min(1, 0.72 + wave + interaction));
      const startX = Math.cos(angle) * inner;
      const startY = Math.sin(angle) * inner;
      const endX = Math.cos(angle) * lerp(inner, outer, height);
      const endY = Math.sin(angle) * lerp(inner, outer, height);

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, colorFor(progress, 0.34));
      gradient.addColorStop(1, colorFor(progress, 0.96));

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(3.2, size * 0.013);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }
  }

  function drawCore(size) {
    const coreRadius = size * 0.282;
    const ringRadius = size * 0.305;

    ctx.fillStyle = "rgba(255, 255, 255, 0.94)";
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(20, 30, 55, 0.64)";
    ctx.lineWidth = Math.max(2.2, size * 0.009);
    ctx.beginPath();
    ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "rgba(20, 30, 55, 0.48)";
    ctx.lineWidth = Math.max(1.2, size * 0.0038);
    ctx.beginPath();
    ctx.arc(0, 0, coreRadius * 0.96, 0, Math.PI * 2);
    ctx.stroke();
  }

  function draw(timestamp) {
    animationFrameId = null;
    const dt = Math.min(0.04, (timestamp - lastTime) / 1000);
    const elapsed = timestamp / 1000;
    lastTime = timestamp;

    if (!drawableSize) {
      scheduleDraw();
      return;
    }

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const size = Math.min(width, height);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);

    drawNetwork(size, elapsed);
    drawBars(size, elapsed, dt);
    drawCore(size);

    ctx.restore();
    scheduleDraw();
  }

  document.addEventListener("visibilitychange", () => {
    if (canAnimate()) {
      lastTime = performance.now();
      resize();
      scheduleDraw();
    }
  });

  resize();
  scheduleDraw();
}
