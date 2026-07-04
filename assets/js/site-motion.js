(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = Array.from(document.querySelectorAll('main > .hero, main > .page-hero, main > .section'));
  const visualTargets = Array.from(document.querySelectorAll(
    '.page-hero-art, .suite-preview, .maestro-workspace-preview, .parallax-intelligence-preview'
  ));
  const staggerGroups = Array.from(document.querySelectorAll(
    '.capability-list, .suite-list, .recording-list, .contact-list, .parallax-surface-list'
  ));

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
