const BAR_COUNT = 64;

function getRadii(width) {
  return {
    inner: width * 0.13,
    outer: width * 0.42,
    center: width * 0.024
  };
}

export function startHeroViz() {
  const canvas = document.getElementById("radialViz");
  if (!canvas || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const ctx = canvas.getContext("2d");
  const mouse = { x: 0, y: 0, active: false };
  let animationFrameId = null;
  let lastTime = performance.now();

  const bars = Array.from({ length: BAR_COUNT }, () => ({
    phase: Math.random() * Math.PI * 2
  }));

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

    if (!size) return;

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
      if (event.touches.length > 0) {
        handleInput(event.touches[0].clientX, event.touches[0].clientY);
      }
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

  function draw(timestamp) {
    animationFrameId = null;
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const size = Math.min(width, height);
    const radii = getRadii(size);

    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);

    ctx.rotate(-Math.PI / 2);

    for (let i = 0; i < BAR_COUNT; i += 1) {
      const bar = bars[i];
      bar.phase += 0.9 * dt;

      const angle = (i / BAR_COUNT) * Math.PI * 2;
      const wave =
        Math.sin(bar.phase + angle * 3) * 0.12 +
        Math.sin(bar.phase * 0.72 - angle * 5) * 0.06;
      let interaction = 0;

      if (mouse.active) {
        const targetX = (radii.inner + size * 0.15) * Math.cos(angle);
        const targetY = (radii.inner + size * 0.15) * Math.sin(angle);
        const distance = Math.hypot(targetX - mouse.x, targetY - mouse.y);
        interaction = Math.max(0, 1 - distance / (size * 0.3)) * 0.25;
      }

      const intensity = Math.min(0.92, Math.max(0.52, 0.68 + wave + interaction));
      const startX = radii.inner * Math.cos(angle);
      const startY = radii.inner * Math.sin(angle);
      const endX = (radii.inner + (radii.outer - radii.inner) * intensity) * Math.cos(angle);
      const endY = (radii.inner + (radii.outer - radii.inner) * intensity) * Math.sin(angle);
      const hueShift = i / BAR_COUNT;
      const red = Math.floor(236 * hueShift);
      const green = Math.floor(174 * (1 - hueShift));
      const blue = Math.floor(239 - 99 * hueShift);
      const baseColor = `rgb(${red}, ${green}, ${blue})`;

      const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
      gradient.addColorStop(0, "rgba(255, 255, 255, 0)");
      gradient.addColorStop(0.3, baseColor.replace("rgb", "rgba").replace(")", ", 0.5)"));
      gradient.addColorStop(
        1,
        baseColor.replace("rgb", "rgba").replace(")", `, ${Math.min(1, 0.98 + interaction)})`)
      );

      ctx.strokeStyle = gradient;
      ctx.lineWidth = Math.max(2.25, size * 0.006);
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    }

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(0, 0, radii.center, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    scheduleDraw();
  }

  document.addEventListener("visibilitychange", () => {
    if (canAnimate()) {
      lastTime = performance.now();
      scheduleDraw();
    }
  });
  window.addEventListener("site:dialog-closed", () => {
    if (canAnimate()) {
      lastTime = performance.now();
      resize();
      scheduleDraw();
    }
  });

  resize();
  scheduleDraw();
}
