// Hopper Landing Page - Seamless Background Transition with Pinned PiP Window

function showToast(message, duration = 2200) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  container.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('show'));

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  }, duration);
}

function copyText(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    if (btnElement) {
      const orig = btnElement.innerText;
      btnElement.innerText = 'Copied';
      setTimeout(() => { btnElement.innerText = orig; }, 2000);
    }
    showToast(`Copied "${text}" to clipboard`);
  }).catch(() => {
    showToast('Failed to copy to clipboard');
  });
}

// Background Slide Metadata
const stageSlidesData = [
  {
    title: 'Over your Code Editor • Code along with video tutorials line-by-line without dual monitors',
    tag: 'VS Code Editor'
  },
  {
    title: 'Over your macOS Home Screen • Take your stream anywhere on your desktop, even outside apps',
    tag: 'macOS Desktop'
  },
  {
    title: 'Over your Documents & Notes • Research, take meeting minutes, and write without alt-tabbing',
    tag: 'Notion Workspace'
  },
  {
    title: 'Over your Financial Spreadsheets • Keep live market ticks and charts pinned while calculating models',
    tag: 'Excel Spreadsheet'
  }
];

let currentSlideIdx = 0;

function initSeamlessStage() {
  const slides = document.querySelectorAll('.stage-slide');
  const pills = document.querySelectorAll('.showcase-pill');
  const captionEl = document.getElementById('stageCaptionText');
  const prevBtn = document.getElementById('stagePrevBtn');
  const nextBtn = document.getElementById('stageNextBtn');

  if (!slides.length) return;

  function setSlide(index) {
    // Wrap around index
    if (index < 0) index = slides.length - 1;
    if (index >= slides.length) index = 0;
    currentSlideIdx = index;

    slides.forEach((slide, i) => {
      if (i === index) slide.classList.add('active');
      else slide.classList.remove('active');
    });

    pills.forEach((pill, i) => {
      if (i === index) pill.classList.add('active');
      else pill.classList.remove('active');
    });

    if (captionEl && stageSlidesData[index]) {
      captionEl.textContent = stageSlidesData[index].title;
    }
  }

  pills.forEach((pill, i) => {
    pill.addEventListener('click', () => setSlide(i));
  });

  if (prevBtn) {
    prevBtn.addEventListener('click', () => setSlide(currentSlideIdx - 1));
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => setSlide(currentSlideIdx + 1));
  }

  // Pinned Floating Window Controls
  const pipWindow = document.getElementById('permanentPipWindow');
  const minBtn = document.getElementById('permanentMinBtn');
  const restoreBtn = document.getElementById('permanentRestoreBtn');
  const focusBtn = document.getElementById('permanentFocusBtn');
  const closeBtn = document.getElementById('permanentCloseBtn');
  const pipBody = document.getElementById('permanentPipBody');

  if (pipWindow) {
    if (minBtn) {
      minBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pipWindow.classList.add('capsule-mode');
        showToast('Hopper: Shrunk to 170x48 Capsule Mode');
      });
    }

    if (restoreBtn) {
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pipWindow.classList.remove('capsule-mode');
        showToast('Hopper: Restored Full Window');
      });
    }

    if (focusBtn) {
      let isFocus = false;
      focusBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        isFocus = !isFocus;
        if (pipBody) {
          pipBody.style.filter = isFocus ? 'contrast(1.15) brightness(1.05)' : 'none';
        }
        showToast(isFocus ? '🎯 Focus Mode Active' : 'Focus Mode Off');
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pipWindow.style.opacity = '0';
        setTimeout(() => {
          pipWindow.style.display = 'none';
        }, 200);
        showToast('Closed floating window (Click "Float Tab" to reopen)');
      });
    }

    // Draggable logic for the pinned window inside the stage
    const stage = document.getElementById('seamlessStage');
    let isDragging = false;
    let startX, startY, initLeft, initTop;

    pipWindow.addEventListener('mousedown', (e) => {
      if (e.target.closest('button') || e.target.tagName === 'IFRAME') return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;

      const rect = pipWindow.getBoundingClientRect();
      const stageRect = stage.getBoundingClientRect();

      initLeft = rect.left - stageRect.left;
      initTop = rect.top - stageRect.top;

      pipWindow.style.right = 'auto';
      pipWindow.style.bottom = 'auto';
      pipWindow.style.left = `${initLeft}px`;
      pipWindow.style.top = `${initTop}px`;

      function onMouseMove(me) {
        if (!isDragging) return;
        const dx = me.clientX - startX;
        const dy = me.clientY - startY;

        let newLeft = initLeft + dx;
        let newTop = initTop + dy;

        const maxLeft = stageRect.width - pipWindow.offsetWidth;
        const maxTop = stageRect.height - pipWindow.offsetHeight;

        newLeft = Math.max(0, Math.min(newLeft, maxLeft));
        newTop = Math.max(0, Math.min(newTop, maxTop));

        pipWindow.style.left = `${newLeft}px`;
        pipWindow.style.top = `${newTop}px`;
      }

      function onMouseUp() {
        isDragging = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }
}

// In-Browser Extension ZIP Generator
async function downloadHopperZip() {
  const btns = document.querySelectorAll('.btn-download-zip');
  try {
    btns.forEach(b => {
      b.dataset.orig = b.innerHTML;
      b.innerHTML = 'Packaging...';
      b.style.pointerEvents = 'none';
    });

    if (typeof JSZip === 'undefined') {
      throw new Error('JSZip is loading or unavailable.');
    }

    const zip = new JSZip();
    const folder = zip.folder('Hopper');

    const textFiles = [
      'manifest.json',
      'background.js',
      'content.js',
      'popup.html',
      'popup.js',
      'rules.json',
      'README.md'
    ];

    const binaryFiles = [
      'icons/icon16.png',
      'icons/icon32.png',
      'icons/icon48.png',
      'icons/icon128.png'
    ];

    for (const f of textFiles) {
      try {
        const res = await fetch(f);
        if (res.ok) {
          const txt = await res.text();
          folder.file(f, txt);
        }
      } catch (err) {
        console.warn(`Could not fetch ${f}`, err);
      }
    }

    const iconsFolder = folder.folder('icons');
    for (const f of binaryFiles) {
      try {
        const res = await fetch(f);
        if (res.ok) {
          const blob = await res.blob();
          iconsFolder.file(f.replace('icons/', ''), blob);
        }
      } catch (err) {
        console.warn(`Could not fetch ${f}`, err);
      }
    }

    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });

    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Hopper-v1.0.0.zip';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Hopper-v1.0.0.zip downloaded');
  } catch (err) {
    console.error(err);
    showToast('Download started (fallback)');
  } finally {
    btns.forEach(b => {
      if (b.dataset.orig) b.innerHTML = b.dataset.orig;
      b.style.pointerEvents = 'auto';
    });
  }
}

// FAQ Accordion
function initFaq() {
  const rows = document.querySelectorAll('.faq-row');
  rows.forEach(r => {
    const btn = r.querySelector('.faq-btn');
    btn.addEventListener('click', () => {
      const isOpen = r.classList.contains('open');
      rows.forEach(other => other.classList.remove('open'));
      if (!isOpen) r.classList.add('open');
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initSeamlessStage();
  initFaq();

  document.querySelectorAll('.btn-download-zip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      downloadHopperZip();
    });
  });
});
