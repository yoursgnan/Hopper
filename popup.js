/**
 * Hopper - Clean 2-Button Controller
 */

document.addEventListener('DOMContentLoaded', async () => {
  const btnFloatTab = document.getElementById('btn-float-tab');
  const btnSupport = document.getElementById('btn-support');
  const supportModal = document.getElementById('support-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');

  let currentTab = null;
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs && tabs[0]) {
      currentTab = tabs[0];
    }
  } catch (err) {
    console.warn('Error querying tab:', err);
  }

  // Button 1: Float Tab (Always-On-Top PiP)
  async function handleFloatTab() {
    if (!currentTab || !currentTab.id) return;
    try {
      try {
        await chrome.tabs.sendMessage(currentTab.id, { action: 'TRIGGER_PIP' });
      } catch (e) {
        // Fallback: inject content script
        await chrome.scripting.executeScript({
          target: { tabId: currentTab.id },
          files: ['content.js']
        });
        await chrome.tabs.sendMessage(currentTab.id, { action: 'TRIGGER_PIP' });
      }
    } catch (err) {
      console.error('Trigger PiP failed:', err);
      chrome.runtime.sendMessage({ action: 'TRIGGER_PIP', tabId: currentTab.id });
    } finally {
      window.close();
    }
  }

  if (btnFloatTab) {
    btnFloatTab.addEventListener('click', handleFloatTab);
  }

  // Button 2: Support
  function toggleSupport(show) {
    if (!supportModal) return;
    if (show) {
      supportModal.classList.add('open');
    } else {
      supportModal.classList.remove('open');
    }
  }

  if (btnSupport) {
    btnSupport.addEventListener('click', () => toggleSupport(true));
  }

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', () => toggleSupport(false));
  }

  if (supportModal) {
    supportModal.addEventListener('click', (e) => {
      if (e.target === supportModal) {
        toggleSupport(false);
      }
    });
  }
});
