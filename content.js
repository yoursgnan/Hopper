/**
 * Hopper - Native Document Picture-in-Picture Engine
 * High-performance Always-On-Top floating mini window with smart video & app modes
 */

(function () {
  // Focus Video styling helper that transforms any video element into full-bleed overlay
  function applyFocusVideoStyle(doc, enabled) {
    if (!doc) return false;
    try {
      let styleEl = doc.getElementById('hopper-focus-video-style');
      if (!styleEl) {
        styleEl = doc.createElement('style');
        styleEl.id = 'hopper-focus-video-style';
        styleEl.textContent = `
          html.hopper-video-focus, html.hopper-video-focus body {
            overflow: hidden !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #000000 !important;
          }
          html.hopper-video-focus #movie_player,
          html.hopper-video-focus .html5-video-player,
          html.hopper-video-focus ytd-player,
          html.hopper-video-focus #player-container,
          html.hopper-video-focus #player,
          html.hopper-video-focus [class*="video-player"],
          html.hopper-video-focus [class*="player-container"],
          html.hopper-video-focus [id*="player-container"] {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            z-index: 2147483630 !important;
            background: #000000 !important;
          }
          html.hopper-video-focus video {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            max-width: 100vw !important;
            max-height: 100vh !important;
            object-fit: contain !important;
            z-index: 2147483635 !important;
            background: #000000 !important;
          }
          html.hopper-video-focus .ytp-chrome-bottom,
          html.hopper-video-focus .ytp-gradient-bottom,
          html.hopper-video-focus .ytp-chrome-top,
          html.hopper-video-focus .ytp-cued-thumbnail-overlay {
            z-index: 2147483640 !important;
          }
        `;
        (doc.head || doc.documentElement).appendChild(styleEl);
      }
      if (enabled) {
        doc.documentElement.classList.add('hopper-video-focus');
        if (doc.body) doc.body.classList.add('hopper-video-focus');
        const vid = doc.querySelector('video');
        if (vid && vid.paused) {
          vid.play().catch(() => {});
        }
      } else {
        doc.documentElement.classList.remove('hopper-video-focus');
        if (doc.body) doc.body.classList.remove('hopper-video-focus');
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  // Listen for focus mode toggle messages across frames
  window.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'HOPPER_SET_FOCUS_VIDEO') {
      applyFocusVideoStyle(document, event.data.enabled);
    }
  });

  if (window.__hopperInitialized) return;
  window.__hopperInitialized = true;

  /**
   * Main function to trigger Always-On-Top Document Picture-in-Picture
   */
  async function triggerDocumentPiP() {
    // 1. Fallback to standard video PiP if Document PiP API is unavailable
    if (!('documentPictureInPicture' in window)) {
      const video = document.querySelector('video');
      if (video && document.pictureInPictureEnabled) {
        try {
          await video.requestPictureInPicture();
          return;
        } catch (e) {
          console.warn('Video PiP fallback error:', e);
        }
      }
      alert('Document Picture-in-Picture is not supported in this Chrome version.');
      return;
    }

    // Close existing PiP window if already open
    if (window.__hopperPiPWindow && !window.__hopperPiPWindow.closed) {
      try { window.__hopperPiPWindow.close(); } catch {}
    }

    try {
      // Create Document PiP Window with ideal floating dimensions
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 440,
        height: 640
      });

      window.__hopperPiPWindow = pipWindow;
      const pipDoc = pipWindow.document;

      // Setup PiP Document styles
      const shellStyle = pipDoc.createElement('style');
      shellStyle.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap');
        
        * {
          box-sizing: border-box;
        }
        html, body {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #0c1812;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          user-select: none;
        }
        #hopper-pip-frame {
          display: block;
          width: 100%;
          height: 100%;
          border: 0;
          background: #0c1812;
        }
        /* Android 17 Quick Settings Floating Control Pill */
        #hopper-pip-header {
          position: fixed;
          top: 10px;
          right: 10px;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 6px;
          background: rgba(20, 37, 29, 0.92);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          border: 1px solid rgba(158, 228, 184, 0.22);
          border-radius: 9999px;
          box-shadow: 
            0 8px 28px rgba(0, 0, 0, 0.45),
            0 2px 6px rgba(0, 0, 0, 0.25),
            inset 0 1px 1px 0 rgba(255, 255, 255, 0.15);
          opacity: 1;
          transition: opacity 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform: translateY(0);
        }
        #hopper-pip-header.autohide {
          opacity: 0;
          transform: translateY(-8px) scale(0.94);
          pointer-events: none;
        }
        #hopper-pip-header:hover, #hopper-pip-header.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }
        .hopper-header-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          background: rgba(158, 228, 184, 0.12);
          color: #f0faf4;
          border: 1px solid rgba(158, 228, 184, 0.18);
          padding: 5px 12px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          white-space: nowrap;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
        }
        .hopper-header-btn:hover {
          background: #9ee4b8;
          color: #092215;
          border-color: #9ee4b8;
          box-shadow: 0 3px 14px rgba(158, 228, 184, 0.45);
          transform: translateY(-1px) scale(1.04);
        }
        .hopper-header-btn:active {
          transform: scale(0.96);
        }
        .hopper-header-btn.active {
          background: #9ee4b8;
          color: #092215;
          border-color: #9ee4b8;
          box-shadow: 0 3px 14px rgba(158, 228, 184, 0.5);
        }
        .hopper-header-btn svg {
          width: 13px;
          height: 13px;
          fill: currentColor;
        }
        .hopper-glass-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9ee4b8;
          box-shadow: 0 0 8px #9ee4b8;
          display: inline-block;
        }
        /* Android 17 Floating Snackbar */
        #hopper-toast {
          position: fixed;
          bottom: 14px;
          left: 50%;
          transform: translateX(-50%) translateY(20px) scale(0.9);
          background: rgba(20, 37, 29, 0.95);
          backdrop-filter: blur(24px) saturate(180%);
          -webkit-backdrop-filter: blur(24px) saturate(180%);
          color: #f0faf4;
          border: 1px solid rgba(158, 228, 184, 0.3);
          padding: 6px 14px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.1px;
          z-index: 2147483647;
          opacity: 0;
          pointer-events: none;
          transition: all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-shadow: 0 8px 28px rgba(0, 0, 0, 0.5);
        }
        #hopper-toast.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0) scale(1);
        }
        /* Android 17 Dynamic Media Bubble Widget (Ultra Compact Pill) */
        #hopper-bubble-view {
          position: fixed;
          inset: 0;
          z-index: 2147483640;
          background: #0c1812;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 3px 5px;
          cursor: pointer;
          user-select: none;
          box-sizing: border-box;
          width: 100%;
          height: 100%;
        }
        .hopper-bubble-card {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2px 8px 2px 6px;
          background: rgba(24, 45, 34, 0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(158, 228, 184, 0.35);
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          box-sizing: border-box;
          gap: 6px;
        }
        .hopper-bubble-card:hover {
          border-color: #9ee4b8;
          background: rgba(30, 56, 42, 0.98);
          box-shadow: 0 4px 18px rgba(158, 228, 184, 0.35);
        }
        .hopper-bubble-avatar-box {
          position: relative;
          width: 24px;
          height: 24px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #9ee4b8;
          color: #092215;
          flex-shrink: 0;
        }
        .hopper-bubble-avatar-box img {
          width: 14px;
          height: 14px;
          border-radius: 4px;
          object-fit: cover;
        }
        .hopper-bubble-info {
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          flex: 1;
        }
        .hopper-bubble-title {
          color: #f0faf4;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hopper-bubble-actions {
          display: flex;
          align-items: center;
          flex-shrink: 0;
        }
        .hopper-bubble-action-btn {
          background: rgba(158, 228, 184, 0.15);
          border: 1px solid rgba(158, 228, 184, 0.25);
          color: #f0faf4;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .hopper-bubble-action-btn:hover {
          background: #9ee4b8;
          color: #092215;
          transform: scale(1.1);
        }
        .hopper-bubble-action-btn svg {
          width: 10px;
          height: 10px;
          fill: currentColor;
        }
      `;
      pipDoc.head.appendChild(shellStyle);

      // Favicon & Page metadata helper
      const pageFavicon = document.querySelector('link[rel*="icon"]')?.href || `${window.location.origin}/favicon.ico`;
      const pageTitle = document.title || window.location.hostname;

      // 1. Create Android 17 / Dynamic Island Bubble View (Collapsed state)
      const bubbleView = pipDoc.createElement('div');
      bubbleView.id = 'hopper-bubble-view';
      bubbleView.innerHTML = `
        <div class="hopper-bubble-card" title="Click to expand to full window">
          <div class="hopper-bubble-avatar-box">
            <img src="${pageFavicon}" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%23092215%22><circle cx=%2212%22 cy=%2212%22 r=%2210%22/></svg>'">
          </div>
          <div class="hopper-bubble-info">
            <span class="hopper-bubble-title">${pageTitle}</span>
          </div>
          <div class="hopper-bubble-actions">
            <button id="hopper-bubble-expand-btn" class="hopper-bubble-action-btn" title="Expand to Full View">
              <svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></svg>
            </button>
          </div>
        </div>
      `;
      pipDoc.body.appendChild(bubbleView);

      // Detect DRM / Protected Streaming sites where opening a 2nd iframe session triggers
      // "Looks like you're viewing Netflix from more than one browser or tab"
      const isDRMSite = /netflix\.com|primevideo\.com|disneyplus\.com|hulu\.com|hbomax\.com|max\.com|hotstar\.com|peacocktv\.com/i.test(window.location.hostname);

      let isRestored = false;
      let isBubbleMode = false;
      let lastWidth = 440;
      let lastHeight = 640;
      const pausedMedia = [];

      // Window Sizing & Bubble Toggle Handler
      function setBubbleMode(enable) {
        isBubbleMode = enable;
        if (enable) {
          lastWidth = pipWindow.innerWidth || 440;
          lastHeight = pipWindow.innerHeight || 640;
          
          if (header) header.style.display = 'none';
          if (iframe) iframe.style.display = 'none';
          if (isDRMSite) {
            activeNodes.forEach(n => { n.style.display = 'none'; });
          }
          bubbleView.style.display = 'flex';
          
          try {
            pipWindow.resizeTo(170, 48);
          } catch (e) {}
          showToast('🫧 Minimized');
        } else {
          bubbleView.style.display = 'none';
          if (header) header.style.display = 'flex';
          if (iframe) iframe.style.display = 'block';
          if (isDRMSite) {
            activeNodes.forEach(n => { n.style.display = ''; });
          }
          
          try {
            pipWindow.resizeTo(lastWidth, lastHeight);
          } catch (e) {}
          showToast('🌐 Expanded to Full View');
        }
      }

      // Expand on clicking anywhere in bubble card
      bubbleView.addEventListener('click', () => {
        if (isBubbleMode) setBubbleMode(false);
      });

      let activeNodes = [];
      if (isDRMSite) {
        // === DRM / NETFLIX MODE ===
        // Transplant existing live authenticated player into Document PiP (keeps Widevine DRM session alive with 0 duplicate streams)
        
        // 1. Copy styles
        document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
          try {
            pipDoc.head.appendChild(el.cloneNode(true));
          } catch (e) {}
        });

        const drmStyle = pipDoc.createElement('style');
        drmStyle.textContent = `
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
            background: #000000 !important;
          }
          #appMountPoint, .watch-video, .nf-player-container, .sizing-wrapper, video {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
          }
        `;
        pipDoc.head.appendChild(drmStyle);

        // 2. Collect and move active body nodes
        activeNodes = Array.from(document.body.childNodes).filter(node => node.id !== 'hopper-tab-placeholder');
        activeNodes.forEach(node => {
          pipDoc.body.appendChild(node);
        });

        // 3. Floating header with Bubble minimize button for DRM mode
        const drmHeader = pipDoc.createElement('div');
        drmHeader.id = 'hopper-pip-header';
        drmHeader.innerHTML = `
          <button id="hopper-bubble-btn" class="hopper-header-btn" title="Minimize to Android/iOS Bubble">
            <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
            <span>Bubble</span>
          </button>
        `;
        pipDoc.body.appendChild(drmHeader);

        drmHeader.querySelector('#hopper-bubble-btn').addEventListener('click', (e) => {
          e.stopPropagation();
          setBubbleMode(true);
        });

        // 4. Tab placeholder
        const placeholder = document.createElement('div');
        placeholder.id = 'hopper-tab-placeholder';
        placeholder.style.cssText = `
          position: fixed;
          inset: 0;
          z-index: 2147483647;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: #0F172A;
          color: #F8FAFC;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          text-align: center;
          padding: 24px;
          box-sizing: border-box;
        `;
        placeholder.innerHTML = `
          <div style="
            width: 64px; 
            height: 64px; 
            border-radius: 20px; 
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            display: flex; 
            align-items: center; 
            justify-content: center; 
            margin-bottom: 20px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
          ">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"/></svg>
          </div>
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px;
            border-radius: 9999px;
            background: rgba(255, 255, 255, 0.12);
            color: #F8FAFC;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.3px;
            margin-bottom: 12px;
          ">
            STREAM IS FLOATING
          </div>
          <h2 style="
            margin: 0 0 10px 0; 
            color: #FFFFFF; 
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 22px; 
            font-weight: 800;
            letter-spacing: -0.3px;
          ">Playing in Always-On-Top PiP</h2>
          <p style="
            color: #94A3B8; 
            font-size: 13.5px; 
            max-width: 420px; 
            line-height: 1.55; 
            margin-bottom: 28px;
          ">
            Your live stream is floating in the Stay-On-Top mini-window. Close the mini-window or click below to return.
          </p>
          <button id="hopper-return-tab-btn" style="
            background: #FFFFFF;
            color: #0F172A;
            border: none;
            padding: 12px 28px;
            border-radius: 9999px;
            font-family: 'Plus Jakarta Sans', sans-serif;
            font-size: 13.5px;
            font-weight: 800;
            letter-spacing: 0.1px;
            cursor: pointer;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
            transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          ">↩ Return Video to Tab</button>
        `;
        document.body.appendChild(placeholder);

        function restoreDRMPage() {
          if (isRestored) return;
          isRestored = true;
          if (placeholder.parentNode) placeholder.remove();
          activeNodes.forEach(node => {
            document.body.appendChild(node);
          });
          window.__hopperPiPWindow = null;
        }

        placeholder.querySelector('#hopper-return-tab-btn').addEventListener('click', () => {
          pipWindow.close();
        });

        pipWindow.addEventListener('pagehide', restoreDRMPage);
        return;
      }

      // === STANDARD RESPONSIVE WEB MODE (YouTube, Apps, Tools) ===
      // 1. Responsive Website Frame
      const iframe = pipDoc.createElement('iframe');
      iframe.id = 'hopper-pip-frame';
      iframe.src = window.location.href;
      iframe.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen; clipboard-write';
      pipDoc.body.appendChild(iframe);

      // 2. Sleek Floating Header Controls (Focus Video + Bubble Minimize)
      const header = pipDoc.createElement('div');
      header.id = 'hopper-pip-header';
      header.innerHTML = `
        <button id="hopper-focus-toggle-btn" class="hopper-header-btn" title="Toggle Focus Video Mode">
          <span class="hopper-glass-dot"></span>
          <svg viewBox="0 0 24 24"><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></svg>
          <span id="hopper-focus-btn-label">Focus</span>
        </button>
        <button id="hopper-bubble-btn" class="hopper-header-btn" title="Minimize to Android/iOS Bubble">
          <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
          <span>Bubble</span>
        </button>
      `;
      pipDoc.body.appendChild(header);

      header.querySelector('#hopper-bubble-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        setBubbleMode(true);
      });

      // 3. Toast notification container
      const toast = pipDoc.createElement('div');
      toast.id = 'hopper-toast';
      pipDoc.body.appendChild(toast);

      function showToast(msg) {
        toast.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2200);
      }

      // Auto-hide header after inactivity
      let hideTimeout = null;
      function resetAutoHide() {
        header.classList.remove('autohide');
        header.classList.add('visible');
        if (hideTimeout) clearTimeout(hideTimeout);
        hideTimeout = setTimeout(() => {
          header.classList.add('autohide');
          header.classList.remove('visible');
        }, 2800);
      }

      pipDoc.addEventListener('mousemove', resetAutoHide);
      pipDoc.addEventListener('mouseenter', resetAutoHide);
      resetAutoHide();

      // State tracking for Focus Video Mode
      let isVideoFocusMode = false;

      function updateIframeFocusMode(enabled) {
        // Attempt direct DOM style injection if same-origin
        try {
          if (iframe.contentDocument) {
            applyFocusVideoStyle(iframe.contentDocument, enabled);
          }
        } catch (e) {}

        // Post message to iframe for all-frames receiver
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'HOPPER_SET_FOCUS_VIDEO', enabled: enabled }, '*');
          }
        } catch (e) {}
      }

      // Maintain focus mode across page navigation inside iframe
      iframe.addEventListener('load', () => {
        if (isVideoFocusMode) {
          updateIframeFocusMode(true);
        }
      });

      // Check if video elements or streaming player exist
      function detectVideoPresent() {
        if (document.querySelector('video')) return true;
        try {
          if (iframe && iframe.contentDocument && iframe.contentDocument.querySelector('video')) return true;
        } catch (e) {}
        if (/youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|tiktok\.com|netflix\.com|primevideo\.com|disneyplus\.com|hulu\.com|hotstar\.com|dailymotion\.com|bilibili\.com/i.test(window.location.href)) {
          return true;
        }
        return false;
      }

      // Toggle Focus Video vs Responsive Full Website
      const focusToggleBtn = header.querySelector('#hopper-focus-toggle-btn');
      const focusBtnLabel = header.querySelector('#hopper-focus-btn-label');

      focusToggleBtn.addEventListener('click', () => {
        if (!isVideoFocusMode) {
          // Verify if a video exists before activating video focus
          if (!detectVideoPresent()) {
            showToast('⚠️ No video detected on this page');
            resetAutoHide();
            return;
          }

          // Switch to Focus Video Mode
          isVideoFocusMode = true;
          updateIframeFocusMode(true);
          focusToggleBtn.classList.add('active');
          focusBtnLabel.textContent = 'Web';
          showToast('🎥 Focused Video Mode');
        } else {
          // Switch back to Full Website Mode
          isVideoFocusMode = false;
          updateIframeFocusMode(false);
          focusToggleBtn.classList.remove('active');
          focusBtnLabel.textContent = 'Focus';
          showToast('🌐 Full Website View');
        }
        resetAutoHide();
      });

      // Pause original tab media to avoid audio overlap
      document.querySelectorAll('video, audio').forEach((el) => {
        if (!el.paused) {
          pausedMedia.push(el);
          el.pause();
        }
      });

      // Tab Placeholder indicator
      const placeholder = document.createElement('div');
      placeholder.id = 'hopper-tab-placeholder';
      placeholder.style.cssText = `
        position: fixed;
        inset: 0;
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #0F172A;
        color: #F8FAFC;
        font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        text-align: center;
        padding: 24px;
        box-sizing: border-box;
      `;
      placeholder.innerHTML = `
        <div style="
          width: 64px; 
          height: 64px; 
          border-radius: 20px; 
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin-bottom: 20px;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        ">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16.01H3V4.99h18v14.02z"/></svg>
        </div>
        <div style="
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.12);
          color: #F8FAFC;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
          margin-bottom: 12px;
        ">
          TAB IS FLOATING
        </div>
        <h2 style="
          margin: 0 0 10px 0; 
          color: #FFFFFF; 
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 22px; 
          font-weight: 800;
          letter-spacing: -0.3px;
        ">Page Floating in Always-On-Top PiP</h2>
        <p style="
          color: #94A3B8; 
          font-size: 13.5px; 
          max-width: 420px; 
          line-height: 1.55; 
          margin-bottom: 28px;
        ">
          Your active website and video are floating in the Always-On-Top mini-window. Close the mini-window or click below to return.
        </p>
        <button id="hopper-return-tab-btn" style="
          background: #FFFFFF;
          color: #0F172A;
          border: none;
          padding: 12px 28px;
          border-radius: 9999px;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 13.5px;
          font-weight: 800;
          letter-spacing: 0.1px;
          cursor: pointer;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        ">↩ Return Page to Tab</button>
      `;
      document.body.appendChild(placeholder);

      function restorePage() {
        if (isRestored) return;
        isRestored = true;
        if (placeholder.parentNode) placeholder.remove();
        pausedMedia.forEach((el) => {
          el.play().catch(() => {});
        });
        window.__hopperPiPWindow = null;
      }

      placeholder.querySelector('#hopper-return-tab-btn').addEventListener('click', () => {
        pipWindow.close();
      });

      pipWindow.addEventListener('pagehide', restorePage);

    } catch (err) {
      console.warn('Hopper PiP notice:', err);
    }
  }

  // Clean up any legacy injected elements
  const existingBtn = document.getElementById('hopper-inpage-float-btn');
  if (existingBtn) existingBtn.remove();
  const existingStyle = document.getElementById('hopper-inpage-styles');
  if (existingStyle) existingStyle.remove();

  // Expose function for direct script injection
  window.__hopperTriggerPiP = triggerDocumentPiP;

  // Listen for toolbar button click and context menu actions from background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.action === 'TRIGGER_PIP') {
      triggerDocumentPiP();
      sendResponse({ success: true });
    }
  });
})();
