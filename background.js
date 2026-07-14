// Manages per-site enable/disable and injects content script on demand

// Inject content script when user enables a site
async function injectScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: ['content.js']
    });
  } catch (e) {
    // Tab might not be injectable (chrome://, etc.)
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleSite') {
    handleToggle(msg.hostname, msg.enabled, msg.tabId).then(sendResponse);
    return true;
  }
  if (msg.action === 'getState') {
    getState(msg.hostname).then(sendResponse);
    return true;
  }
  if (msg.action === 'reloadTab') {
    chrome.tabs.reload(msg.tabId);
    sendResponse({ ok: true });
  }
});

async function handleToggle(hostname, enabled, tabId) {
  const data = await chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false });
  if (enabled) {
    data.enabledSites[hostname] = true;
  } else {
    delete data.enabledSites[hostname];
  }
  await chrome.storage.sync.set({ enabledSites: data.enabledSites });

  // Reload the tab so changes take effect cleanly
  if (tabId) chrome.tabs.reload(tabId);
  return { ok: true };
}

async function getState(hostname) {
  const data = await chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false });
  return {
    siteEnabled: !!data.enabledSites[hostname],
    globalEnabled: data.globalEnabled,
    enabledSites: data.enabledSites
  };
}

// On navigation, inject if site is enabled
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  try {
    const url = new URL(tab.url);
    const hostname = url.hostname;
    const data = await chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false });

    if (data.globalEnabled || data.enabledSites[hostname]) {
      injectScript(tabId);
    }
  } catch (e) {
    // Invalid URL, skip
  }
});
