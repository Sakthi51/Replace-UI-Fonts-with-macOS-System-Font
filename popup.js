document.addEventListener('DOMContentLoaded', async () => {
  const siteToggle = document.getElementById('site-toggle');
  const globalToggle = document.getElementById('global-toggle');
  const siteName = document.getElementById('site-name');
  const siteFavicon = document.getElementById('site-favicon');
  const statusPill = document.getElementById('status-pill');
  const statusText = document.getElementById('status-text');
  const optionsLink = document.getElementById('options-link');
  const themeBtn = document.getElementById('theme-btn');

  // Theme handling
  const themes = ['system', 'light', 'dark'];
  const themeIcons = {
    light: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
    system: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    dark: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>'
  };
  let currentTheme = (await chrome.storage.sync.get({ theme: 'system' })).theme;
  applyTheme(currentTheme);

  function applyTheme(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    themeBtn.innerHTML = themeIcons[theme];
    themeBtn.title = `Theme: ${theme}`;
  }

  themeBtn.addEventListener('click', async () => {
    const idx = (themes.indexOf(currentTheme) + 1) % themes.length;
    currentTheme = themes[idx];
    applyTheme(currentTheme);
    await chrome.storage.sync.set({ theme: currentTheme });
  });

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  let hostname = '';
  try {
    hostname = new URL(tab.url).hostname;
  } catch (e) {
    siteName.textContent = 'Unavailable';
    siteToggle.disabled = true;
    return;
  }

  siteName.textContent = hostname;

  // Show favicon
  const globeSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
  if (tab.favIconUrl) {
    siteFavicon.innerHTML = `<img src="${tab.favIconUrl}" width="16" height="16" style="border-radius:3px;" onerror="this.innerHTML='${globeSvg}'">`;
  }

  // Get state
  const data = await chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false });
  siteToggle.checked = !!data.enabledSites[hostname];
  globalToggle.checked = data.globalEnabled;
  updateStatus();

  function updateStatus() {
    const active = siteToggle.checked || globalToggle.checked;
    statusPill.className = 'status-pill ' + (active ? 'active' : 'inactive');
    statusText.textContent = active ? 'Active on this page' : 'Inactive';
  }

  siteToggle.addEventListener('change', async () => {
    const enabled = siteToggle.checked;
    const sites = (await chrome.storage.sync.get({ enabledSites: {} })).enabledSites;
    if (enabled) {
      sites[hostname] = { enabled: true, favicon: tab.favIconUrl || '' };
    } else {
      delete sites[hostname];
    }
    await chrome.storage.sync.set({ enabledSites: sites });
    updateStatus();
    chrome.tabs.reload(tab.id);
  });

  globalToggle.addEventListener('change', async () => {
    await chrome.storage.sync.set({ globalEnabled: globalToggle.checked });
    updateStatus();
    chrome.tabs.reload(tab.id);
  });

  optionsLink.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});
