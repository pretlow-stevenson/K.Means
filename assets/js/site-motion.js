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
