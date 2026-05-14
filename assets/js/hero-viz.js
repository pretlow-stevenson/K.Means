const NODE_COUNT = 38;
const PALETTE = [
  [93, 169, 239],
  [216, 45, 155],
  [34, 172, 206],
  [120, 104, 210],
  [24, 35, 60]
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function colorFor(index, alpha) {
  const color = PALETTE[index % PALETTE.length];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function createNodes() {
  return Array.from({ length: NODE_COUNT }, (_, index) => {
    const lane = index % 6;
    const row = Math.floor(index / 6);
    return {
      baseX: -0.46 + lane * 0.18 + Math.sin(index * 1.83) * 0.05,
      baseY: -0.36 + row * 0.13 + Math.cos(index * 1.31) * 0.06,
      depth: 0.55 + ((index * 17) % 37) / 100,
      phase: index * 0.63,
      radius: 0.007 + ((index * 7) % 8) / 1000,
      speed: 0.82 + (index % 5) * 0.1
    };
  });
}

export function startHeroViz() {
  const canvas = document.getElementById("radialViz");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const mouse = { x: 0, y: 0, active: false };
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

  function getNodePositions(size, elapsed) {
    const maxX = size * 0.48;
    const maxY = size * 0.42;

    return nodes.map((node) => {
      const x =
        node.baseX * size +
        Math.sin(elapsed * node.speed + node.phase) * size * 0.035 +
        Math.sin(elapsed * node.speed * 0.47 + node.phase * 1.8) * size * 0.015 +
        (mouse.active ? mouse.x * 0.012 * node.depth : 0);
      const y =
        node.baseY * size +
        Math.cos(elapsed * node.speed * 1.18 + node.phase) * size * 0.036 +
        Math.sin(elapsed * node.speed * 0.62 + node.phase * 1.4) * size * 0.014 +
        (mouse.active ? mouse.y * 0.01 * node.depth : 0);
      return {
        ...node,
        x: clamp(x, -maxX, maxX),
        y: clamp(y, -maxY, maxY),
        alpha: 0.26 + node.depth * 0.28,
        size: size * node.radius * (0.86 + node.depth * 0.42)
      };
    });
  }

  function drawNetworkLayer(size, elapsed, mode) {
    const positions = getNodePositions(size, elapsed);
    const behind = mode === "behind";
    const lineAlpha = behind ? 0.28 : 0.18;
    const nodeAlpha = behind ? 0.78 : 0.5;

    ctx.lineWidth = Math.max(0.8, size * 0.002);
    ctx.lineCap = "round";

    positions.forEach((point, index) => {
      for (let offset = 1; offset <= 3; offset += 1) {
        const next = positions[(index + offset) % positions.length];
        const distance = Math.hypot(point.x - next.x, point.y - next.y);
        if (distance > size * 0.28) continue;

        const opacity = Math.max(0, 1 - distance / (size * 0.28)) * lineAlpha;
        ctx.strokeStyle = colorFor(index + offset, opacity);
        ctx.beginPath();
        ctx.moveTo(point.x, point.y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }
    });

    positions.forEach((point, index) => {
      const isAnchor = index % 7 === 0;
      ctx.fillStyle = colorFor(index, point.alpha * nodeAlpha * (isAnchor ? 1.8 : 1));
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size * (isAnchor ? 1.65 : 1), 0, Math.PI * 2);
      ctx.fill();
    });
  }

  function draw(timestamp) {
    animationFrameId = null;
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

    drawNetworkLayer(size, elapsed, "behind");
    drawNetworkLayer(size, elapsed + 3.2, "front");

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
