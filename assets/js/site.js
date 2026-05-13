const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

let lastFocusedElement = null;

export function openDialog(dialog) {
  if (!dialog) return;
  lastFocusedElement = document.activeElement;
  dialog.classList.add('active');
  document.body.classList.add('modal-open');
  window.dispatchEvent(new CustomEvent('site:dialog-opened', { detail: { dialog } }));
  const firstFocusable = dialog.querySelector(focusableSelector);
  if (firstFocusable) firstFocusable.focus();
}

export function closeDialog(dialog, { restoreFocus = true } = {}) {
  if (!dialog) return;
  dialog.classList.remove('active');
  if (!document.querySelector('[role="dialog"].active')) {
    document.body.classList.remove('modal-open');
  }
  window.dispatchEvent(new CustomEvent('site:dialog-closed', { detail: { dialog } }));
  if (restoreFocus && lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
    lastFocusedElement.focus();
  }
}

export function bindFocusTrap(dialog) {
  if (!dialog) return;
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(dialog.querySelectorAll(focusableSelector));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}

export function getYoutubeId(url) {
  if (!url) return '';
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?#]/)[0];
  if (url.includes('v=')) return url.split('v=')[1].split(/[&#]/)[0];
  return '';
}

export function youtubeEmbed(videoId) {
  const origin = window.location.origin && window.location.origin !== 'null' ? window.location.origin : window.location.href;
  const src = 'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0&enablejsapi=1&origin=' + encodeURIComponent(origin) + '&playsinline=1';
  return '<iframe src="' + src + '" frameborder="0" allow="autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowfullscreen></iframe>';
}
