(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealTargets = Array.from(document.querySelectorAll('main > .hero, main > .page-hero, main > .section'));
  const visualTargets = Array.from(document.querySelectorAll(
    '.page-hero-art, .suite-preview, .maestro-workspace-preview, .parallax-intelligence-preview'
  ));
  const staggerGroups = Array.from(document.querySelectorAll(
    '.capability-list, .suite-list, .recording-list, .contact-list, .parallax-surface-list'
  ));

  const setupNavigation = () => {
    const dropdowns = Array.from(document.querySelectorAll('.nav-dropdown'));

    if (dropdowns.length === 0) {
      return;
    }

    const closeDropdown = (dropdown, returnFocus = false) => {
      const toggle = dropdown.querySelector('.nav-menu-toggle');

      dropdown.classList.remove('is-open');
      toggle?.setAttribute('aria-expanded', 'false');
      if (toggle) {
        const label = toggle.dataset.menuLabel || 'submenu';
        toggle.setAttribute('aria-label', `Open ${label}`);
      }

      if (returnFocus) {
        toggle?.focus();
      }
    };

    const closeOtherDropdowns = (activeDropdown) => {
      dropdowns.forEach((dropdown) => {
        if (dropdown !== activeDropdown) {
          closeDropdown(dropdown);
        }
      });
    };

    dropdowns.forEach((dropdown, index) => {
      const link = dropdown.querySelector('.nav-dropdown-link');
      const menu = dropdown.querySelector('.nav-menu');

      if (!link || !menu || dropdown.querySelector('.nav-menu-toggle')) {
        return;
      }

      const label = `${link.textContent.trim()} menu`;
      const menuId = `nav-menu-${dropdown.dataset.menu || index + 1}`;
      const toggle = document.createElement('button');

      menu.id = menuId;
      toggle.className = 'nav-menu-toggle';
      toggle.type = 'button';
      toggle.dataset.menuLabel = label;
      toggle.setAttribute('aria-label', `Open ${label}`);
      toggle.setAttribute('aria-controls', menuId);
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-haspopup', 'true');
      dropdown.classList.add('has-menu-toggle');
      link.insertAdjacentElement('afterend', toggle);

      toggle.addEventListener('click', () => {
        const isOpening = !dropdown.classList.contains('is-open');
        closeOtherDropdowns(dropdown);
        dropdown.classList.toggle('is-open', isOpening);
        toggle.setAttribute('aria-expanded', String(isOpening));
        toggle.setAttribute('aria-label', `${isOpening ? 'Close' : 'Open'} ${label}`);
      });

      dropdown.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && dropdown.classList.contains('is-open')) {
          event.preventDefault();
          closeDropdown(dropdown, true);
        }
      });

      dropdown.addEventListener('focusout', (event) => {
        if (!dropdown.contains(event.relatedTarget)) {
          closeDropdown(dropdown);
        }
      });
    });

    document.addEventListener('pointerdown', (event) => {
      dropdowns.forEach((dropdown) => {
        if (!dropdown.contains(event.target)) {
          closeDropdown(dropdown);
        }
      });
    });
  };

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

  const setupCountUpStats = () => {
    const groups = Array.from(document.querySelectorAll('[data-count-up]'));

    if (groups.length === 0) {
      return;
    }

    const formatValue = (element, value) => {
      const decimals = Number(element.dataset.countDecimals || 0);
      const suffix = element.dataset.countSuffix || '';
      const formatted = value.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
        useGrouping: element.dataset.countGrouping !== 'false'
      });

      element.textContent = `${formatted}${suffix}`;
    };

    const showFinalValues = (group) => {
      group.querySelectorAll('[data-count-to]').forEach((element) => {
        formatValue(element, Number(element.dataset.countTo || 0));
      });
    };

    if (prefersReducedMotion || !('IntersectionObserver' in window) || !('requestAnimationFrame' in window)) {
      groups.forEach(showFinalValues);
      return;
    }

    const animateGroup = (group) => {
      if (group.dataset.countUpComplete === 'true') {
        return;
      }

      group.dataset.countUpComplete = 'true';
      const values = Array.from(group.querySelectorAll('[data-count-to]'));

      values.forEach((element) => formatValue(element, 0));

      const duration = 1050;
      const start = performance.now();

      const tick = (timestamp) => {
        const progress = Math.min((timestamp - start) / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);

        values.forEach((element) => {
          const target = Number(element.dataset.countTo || 0);
          formatValue(element, progress === 1 ? target : target * easedProgress);
        });

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          showFinalValues(group);
        }
      };

      requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          observer.unobserve(entry.target);
          animateGroup(entry.target);
        }
      });
    }, { threshold: 0.35 });

    groups.forEach((group) => observer.observe(group));
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

  setupNavigation();
  setupCountUpStats();

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
