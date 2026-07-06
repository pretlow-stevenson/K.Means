(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = Array.from(document.querySelectorAll('main > .hero, main > .page-hero, main > .section'));
  const visualTargets = Array.from(document.querySelectorAll(
    '.page-hero-art, .suite-preview, .maestro-workspace-preview, .parallax-intelligence-preview'
  ));
  const staggerGroups = Array.from(document.querySelectorAll(
    '.capability-list, .suite-list, .recording-list, .contact-list, .parallax-surface-list'
  ));

  const setupHomeHeroHeadline = () => {
    const title = document.querySelector('.hero #hero-title');

    if (!title || title.dataset.wordAssemble === 'ready') {
      return null;
    }

    const text = title.textContent.trim().replace(/\s+/g, ' ');
    const words = text.split(' ');

    if (words.length < 2) {
      return null;
    }

    title.dataset.wordAssemble = 'ready';
    title.setAttribute('aria-label', text);
    title.classList.add('word-assemble');
    title.textContent = '';

    words.forEach((word, index) => {
      const wordElement = document.createElement('span');
      wordElement.className = 'word-assemble-word';
      wordElement.setAttribute('aria-hidden', 'true');
      wordElement.style.setProperty('--word-order', index);
      wordElement.style.setProperty('--word-shift', index % 2 === 0 ? '-18px' : '18px');
      wordElement.textContent = word;
      title.appendChild(wordElement);

      if (index < words.length - 1) {
        title.appendChild(document.createTextNode(' '));
      }
    });

    return {
      element: title,
      assemble: () => title.classList.add('is-assembled')
    };
  };

  const setupHomeSoccerFlourish = () => {
    const hero = document.querySelector('main > .hero');
    const heroLogo = document.querySelector('.hero .hero-logo');
    const storageKey = 'kmeans-home-soccer-matter';

    if (
      !hero
      || !heroLogo
      || !window.Matter
      || !Element.prototype.animate
      || document.body.dataset.soccerFlourish === 'ready'
    ) {
      return;
    }

    try {
      if (window.sessionStorage.getItem(storageKey) === 'seen') {
        return;
      }
    } catch {
      // If storage is unavailable, keep the flourish page-local only.
    }

    document.body.dataset.soccerFlourish = 'ready';

    const markSeen = () => {
      try {
        window.sessionStorage.setItem(storageKey, 'seen');
      } catch {
        // Storage can be unavailable in private or locked-down contexts.
      }
    };

    const renderBall = () => {
      return `
        <div class="world-cup-shadow"></div>
        <div class="world-cup-ball">
          <div class="world-cup-ball-texture">
            <img src="assets/images/world-cup-soccer-ball.png?v=soccer-matter" alt="" />
          </div>
        </div>
      `;
    };

    const play = () => {
      if (document.visibilityState === 'hidden') {
        return;
      }

      const logoRect = heroLogo.getBoundingClientRect();
      const heroRect = hero.getBoundingClientRect();

      if (logoRect.width < 36 || logoRect.height < 36) {
        return;
      }

      markSeen();

      const width = window.innerWidth;
      const height = window.innerHeight;
      const ballSize = Math.round(Math.min(82, Math.max(54, width * 0.055)));
      const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
      const mix = (from, to, amount) => from + ((to - from) * amount);
      const restX = clamp(logoRect.left + (logoRect.width * 0.36) - (ballSize / 2), 16, width - ballSize - 18);
      const restY = clamp(
        Math.max(heroRect.top + (heroRect.height * 0.66), logoRect.bottom - (ballSize * 0.22)),
        120,
        height - ballSize - 30
      );
      const radius = ballSize / 2;
      const startX = -ballSize * 1.24;
      const startY = clamp(restY - (ballSize * 2.35), 88, height - ballSize - 42);
      const floorY = restY + ballSize;
      const finalX = (width * 0.5) - (ballSize / 2);
      const finalY = (height * 0.52) - (ballSize / 2);

      const layer = document.createElement('div');
      const stage = document.createElement('div');
      const ring = document.createElement('div');

      layer.className = 'world-cup-flourish';
      layer.setAttribute('aria-hidden', 'true');
      stage.className = 'world-cup-ball-stage';
      stage.style.setProperty('--soccer-size', `${ballSize}px`);
      stage.innerHTML = renderBall();
      stage.style.opacity = '1';
      stage.style.transform = `translate3d(${startX}px, ${startY}px, 0) scale(1)`;
      ring.className = 'world-cup-impact-ring';
      ring.style.left = `${restX + (ballSize * 0.52)}px`;
      ring.style.top = `${restY + (ballSize * 0.5)}px`;
      layer.append(stage, ring);
      document.body.appendChild(layer);

      const shadowElement = stage.querySelector('.world-cup-shadow');
      const textureElement = stage.querySelector('.world-cup-ball-texture');
      const { Bodies, Body, Composite, Engine } = window.Matter;
      const engine = Engine.create();
      let frameId = 0;
      let lastTime = performance.now();
      let isSettling = false;

      engine.gravity.y = 1.12;

      const ballBody = Bodies.circle(startX + radius, startY + radius, radius * 0.92, {
        density: 0.00125,
        friction: 0.06,
        frictionAir: 0.008,
        restitution: 0.72
      });
      const floor = Bodies.rectangle(width / 2, floorY + 30, width * 2.4, 60, {
        isStatic: true,
        friction: 0.88,
        restitution: 0.56
      });
      const runoutWall = Bodies.rectangle(restX + (ballSize * 0.98), floorY - (ballSize * 0.24), 10, ballSize * 1.3, {
        isStatic: true,
        friction: 0.92,
        restitution: 0.16,
        render: { visible: false }
      });
      const initialVelocityX = clamp((restX - startX) / 74, 7.2, 11.4);

      Composite.add(engine.world, [ballBody, floor, runoutWall]);
      Body.setVelocity(ballBody, { x: initialVelocityX, y: -0.35 });
      Body.setAngularVelocity(ballBody, initialVelocityX / radius);

      const cleanupEngine = () => {
        if (frameId) {
          cancelAnimationFrame(frameId);
          frameId = 0;
        }

        Composite.clear(engine.world, false);
        Engine.clear(engine);
      };

      const move = (x, y, scale, opacity = 1, easing = undefined) => ({
        opacity,
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        ...(easing ? { easing } : {})
      });

      const settleShadow = (heightAboveFloor) => {
        if (!shadowElement) {
          return;
        }

        const proximity = 1 - clamp(heightAboveFloor / (radius * 2.35), 0, 1);
        const opacity = 0.08 + (proximity * 0.42);
        const scale = 0.42 + (proximity * 0.72);

        shadowElement.style.opacity = opacity.toFixed(3);
        shadowElement.style.transform = `scaleX(${scale.toFixed(3)})`;
      };

      const launchBall = (settledAngle, settledY) => {
        const launchDuration = 940;
        const launchAnimation = stage.animate([
          { ...move(restX, settledY, 1, 1), offset: 0 },
          { ...move(restX + (ballSize * 0.58), settledY - (ballSize * 0.42), 1.08, 1, 'cubic-bezier(0.14, 0.68, 0.2, 1)'), offset: 0.22 },
          { ...move(mix(restX, finalX, 0.6), mix(settledY, finalY, 0.52), 2.45, 0.88, 'cubic-bezier(0.18, 0.8, 0.18, 1)'), offset: 0.68 },
          { ...move(finalX, finalY, 7.1, 0), offset: 1 }
        ], {
          duration: launchDuration,
          easing: 'cubic-bezier(0.17, 0.83, 0.2, 1)',
          fill: 'forwards'
        });

        if (textureElement) {
          textureElement.animate([
            { transform: `rotate(${settledAngle}rad)`, offset: 0 },
            { transform: `rotate(${settledAngle + 8.1}rad)`, offset: 0.68 },
            { transform: `rotate(${settledAngle + 12.4}rad)`, offset: 1 }
          ], {
            duration: launchDuration,
            easing: 'linear',
            fill: 'forwards'
          });
        }

        if (shadowElement) {
          shadowElement.animate([
            { opacity: 0.22, transform: 'scaleX(0.66)', offset: 0 },
            { opacity: 0.08, transform: 'scaleX(0.46)', offset: 0.24 },
            { opacity: 0.05, transform: 'scaleX(1.28)', offset: 0.72 },
            { opacity: 0, transform: 'scaleX(2.4)', offset: 1 }
          ], {
            duration: launchDuration,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards'
          });
        }

        launchAnimation.finished
          .then(() => layer.remove())
          .catch(() => layer.remove());
      };

      const beginKick = (settledAngle, settledY) => {
        window.setTimeout(() => {
          heroLogo.classList.add('is-soccer-kicking');
        }, 120);

        window.setTimeout(() => {
          ring.classList.add('is-visible');
          launchBall(settledAngle, settledY);
        }, 520);

        window.setTimeout(() => {
          heroLogo.classList.remove('is-soccer-kicking');
        }, 1040);
      };

      const rollToRest = (currentX, currentY, currentAngle) => {
        if (isSettling) {
          return;
        }

        isSettling = true;
        cleanupEngine();

        const rollDistance = Math.max(0, restX - currentX);
        const finalAngle = currentAngle + (rollDistance / Math.max(radius, 1));
        const groundedRestY = Math.max(currentY, restY);
        const settleDuration = clamp(560 + (rollDistance * 4.2), 620, 940);
        const rollAnimation = stage.animate([
          { ...move(currentX, currentY, 1, 1), offset: 0 },
          { ...move(mix(currentX, restX, 0.72), groundedRestY, 1, 1, 'cubic-bezier(0.16, 0.72, 0.22, 1)'), offset: 0.72 },
          { ...move(restX, groundedRestY, 1, 1), offset: 1 }
        ], {
          duration: settleDuration,
          easing: 'cubic-bezier(0.18, 0.78, 0.22, 1)',
          fill: 'forwards'
        });

        if (textureElement) {
          textureElement.animate([
            { transform: `rotate(${currentAngle}rad)`, offset: 0 },
            { transform: `rotate(${finalAngle}rad)`, offset: 1 }
          ], {
            duration: settleDuration,
            easing: 'cubic-bezier(0.16, 0.76, 0.22, 1)',
            fill: 'forwards'
          });
        }

        if (shadowElement) {
          shadowElement.animate([
            { opacity: shadowElement.style.opacity || 0.28, transform: shadowElement.style.transform || 'scaleX(0.72)', offset: 0 },
            { opacity: 0.24, transform: 'scaleX(0.66)', offset: 1 }
          ], {
            duration: settleDuration,
            easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
            fill: 'forwards'
          });
        }

        rollAnimation.finished
          .then(() => {
            stage.style.transform = `translate3d(${restX}px, ${groundedRestY}px, 0) scale(1)`;

            if (textureElement) {
              textureElement.style.transform = `rotate(${finalAngle}rad)`;
            }

            beginKick(finalAngle, groundedRestY);
          })
          .catch(() => layer.remove());
      };

      const tick = (time) => {
        const elapsed = time - lastTime;
        const delta = clamp(elapsed, 1000 / 90, 1000 / 30);

        lastTime = time;
        Engine.update(engine, delta);

        const totalElapsed = engine.timing.timestamp;
        const currentX = ballBody.position.x - radius;
        const currentY = ballBody.position.y - radius;
        const heightAboveFloor = Math.max(0, floorY - (ballBody.position.y + radius));

        if (ballBody.position.x > restX + (ballSize * 0.78)) {
          Body.setVelocity(ballBody, {
            x: Math.min(ballBody.velocity.x, 0.18),
            y: ballBody.velocity.y
          });
        }

        if (ballBody.position.x > restX - (ballSize * 0.9) && Math.abs(ballBody.velocity.y) < 2.8) {
          Body.setVelocity(ballBody, {
            x: ballBody.velocity.x * 0.985,
            y: ballBody.velocity.y
          });
          Body.setAngularVelocity(ballBody, ballBody.angularVelocity * 0.986);
        }

        stage.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) scale(1)`;

        if (textureElement) {
          textureElement.style.transform = `rotate(${ballBody.angle}rad)`;
        }

        settleShadow(heightAboveFloor);

        const nearRestX = Math.abs(ballBody.position.x - (restX + radius)) < ballSize * 1.15;
        const slowEnough = Math.abs(ballBody.velocity.x) < 1.05 && Math.abs(ballBody.velocity.y) < 2.2;

        if ((totalElapsed > 2700 && nearRestX && slowEnough) || totalElapsed > 3950) {
          rollToRest(currentX, currentY, ballBody.angle);
          return;
        }

        frameId = requestAnimationFrame(tick);
      };

      frameId = requestAnimationFrame(tick);
    };

    const schedule = () => window.setTimeout(play, 900);

    if (document.readyState === 'complete') {
      schedule();
    } else {
      window.addEventListener('load', schedule, { once: true });
    }
  };

  const revealImmediately = (elements) => {
    elements.forEach((element) => {
      element.classList.add('is-visible');
    });
  };

  revealTargets.forEach((element) => {
    element.classList.add('motion-reveal');
  });

  visualTargets.forEach((element) => {
    element.classList.add('motion-visual');
  });

  const staggerItems = staggerGroups.flatMap((group) => {
    return Array.from(group.children).map((item, index) => {
      item.classList.add('motion-stagger-item');
      item.style.setProperty('--motion-order', index);
      return item;
    });
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealImmediately([...revealTargets, ...visualTargets, ...staggerItems]);
    return;
  }

  const homeHeroHeadline = setupHomeHeroHeadline();
  setupHomeSoccerFlourish();

  if (homeHeroHeadline) {
    const headlineObserver = new IntersectionObserver((entries, observer) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        requestAnimationFrame(homeHeroHeadline.assemble);
        observer.unobserve(homeHeroHeadline.element);
      }
    }, {
      threshold: 0.6
    });

    headlineObserver.observe(homeHeroHeadline.element);
  }

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -12% 0px',
    threshold: 0.12
  });

  revealTargets.forEach((element) => {
    revealObserver.observe(element);
  });

  visualTargets.forEach((element) => {
    revealObserver.observe(element);
  });

  const staggerObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        Array.from(entry.target.children).forEach((item) => {
          item.classList.add('is-visible');
        });
        observer.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: '0px 0px -10% 0px',
    threshold: 0.18
  });

  staggerGroups.forEach((group) => {
    staggerObserver.observe(group);
  });
})();
