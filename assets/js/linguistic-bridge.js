import { bindFocusTrap, closeDialog, getYoutubeId, openDialog, youtubeEmbed } from './site.js';

const videoModal = document.getElementById('videoModal');
const playerFrame = document.getElementById('playerFrame');
const closeVideo = document.getElementById('closeVideo');

function openVideo(url) {
  const videoId = getYoutubeId(url);
  if (!videoId) return;
  playerFrame.innerHTML = youtubeEmbed(videoId);
  openDialog(videoModal);
}

async function openTranscript(src) {
  try {
    const response = await fetch(src);
    if (!response.ok) throw new Error('Transcript request failed: ' + response.status);
    const html = await response.text();
    playerFrame.innerHTML = '<div class="transcript-wrapper">' + html + '</div>';
    openDialog(videoModal);
  } catch (error) {
    console.error(error);
    window.location.href = src;
  }
}

document.querySelectorAll('.demo-link').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openVideo(link.getAttribute('data-video'));
  });
});

document.querySelectorAll('[data-transcript]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    openTranscript(link.getAttribute('data-transcript'));
  });
});

closeVideo.addEventListener('click', () => {
  closeDialog(videoModal);
  playerFrame.innerHTML = '';
});

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeDialog(videoModal, { restoreFocus: false });
    playerFrame.innerHTML = '';
  }
});

bindFocusTrap(videoModal);
