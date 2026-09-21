/**
 * Hopper - Manifest V3 Background Service Worker
 * 1-Click Mobile Companion Window (420x760) & Always-On-Top PiP
 */

/**
 * 1-Click Mobile Companion Window (420x760 borderless popup)
 * Gives 100% true native mobile responsiveness (identical to DevTools mobile)
 */
async function openMobileCompanionWindow(tab) {
  if (!tab || !tab.url) return;

  if (tab.url.startsWith('chrome://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
    chrome.action.setBadgeText({ tabId: tab.id, text: '!' });
    chrome.action.setBadgeBackgroundColor({ tabId: tab.id, color: '#EF4444' });
    setTimeout(() => chrome.action.setBadgeText({ tabId: tab.id, text: '' }), 2500);
    return;
  }

  await chrome.windows.create({
    url: tab.url,
    type: 'popup',
    width: 420,
    height: 760,
    focused: true
  });
}

/**
 * Always-On-Top Document PiP Trigger
 */
async function triggerPiPOnTab(tab) {
  if (!tab || !tab.id || !tab.url) return;

  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_PIP' });
  } catch (err) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      await chrome.tabs.sendMessage(tab.id, { action: 'TRIGGER_PIP' });
    } catch (e) {
      console.error('Could not trigger PiP:', e);
    }
  }
}

// Strip X-Frame-Options for subframes
async function setupDNRRules() {
  try {
    const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
    const ruleIds = existingRules.map(r => r.id);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: ruleIds,
      addRules: [
        {
          id: 101,
          priority: 10,
          action: {
            type: 'modifyHeaders',
            responseHeaders: [
              { header: 'X-Frame-Options', operation: 'remove' },
              { header: 'x-frame-options', operation: 'remove' },
              { header: 'Frame-Options', operation: 'remove' },
              { header: 'frame-options', operation: 'remove' },
              { header: 'Content-Security-Policy', operation: 'remove' },
              { header: 'content-security-policy', operation: 'remove' },
              { header: 'X-Content-Security-Policy', operation: 'remove' }
            ]
          },
          condition: {
            urlFilter: '*',
            resourceTypes: ['sub_frame']
          }
        }
      ]
    });
  } catch (e) {}
}

// 1-Click Action on toolbar icon: Triggers Always-On-Top Document PiP Mini Window
chrome.action.onClicked.addListener(async (tab) => {
  await triggerPiPOnTab(tab);
});

// Context Menus
chrome.runtime.onInstalled.addListener(async () => {
  await setupDNRRules();
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'hopper_float_pip',
      title: 'Float in Always-On-Top PiP',
      contexts: ['page', 'video', 'audio', 'link']
    });
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await setupDNRRules();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab) return;
  if (info.menuItemId === 'hopper_float_pip') {
    await triggerPiPOnTab(tab);
  }
});

// Handle popup actions
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'TRIGGER_PIP') {
    if (message.tabId) {
      chrome.tabs.get(message.tabId).then(tab => {
        triggerPiPOnTab(tab);
        sendResponse({ success: true });
      }).catch(() => {
        chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) triggerPiPOnTab(tabs[0]);
          sendResponse({ success: true });
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0]) triggerPiPOnTab(tabs[0]);
        sendResponse({ success: true });
      });
    }
    return true;
  }

  if (message.action === 'OPEN_POPUP_WINDOW') {
    if (message.tabId) {
      chrome.tabs.get(message.tabId).then(tab => {
        openMobileCompanionWindow(tab);
        sendResponse({ success: true });
      }).catch(() => {
        chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
          if (tabs[0]) openMobileCompanionWindow(tabs[0]);
          sendResponse({ success: true });
        });
      });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => {
        if (tabs[0]) openMobileCompanionWindow(tabs[0]);
        sendResponse({ success: true });
      });
    }
    return true;
  }
});

