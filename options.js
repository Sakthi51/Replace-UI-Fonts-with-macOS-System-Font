document.addEventListener('DOMContentLoaded', async () => {
  const globalToggle = document.getElementById('global-toggle');
  const siteList = document.getElementById('site-list');
  const addInput = document.getElementById('add-input');
  const addBtn = document.getElementById('add-btn');
  const toast = document.getElementById('toast');
  const themeButtons = document.querySelectorAll('.theme-switcher button');
  const searchInput = document.getElementById('search-input');
  const siteCount = document.getElementById('site-count');

  // Theme
  let currentTheme = (await chrome.storage.sync.get({ theme: 'system' })).theme;
  applyTheme(currentTheme);

  function applyTheme(theme) {
    if (theme === 'system') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', theme);
    }
    themeButtons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === theme);
    });
  }

  themeButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      currentTheme = btn.dataset.theme;
      applyTheme(currentTheme);
      await chrome.storage.sync.set({ theme: currentTheme });
      showToast();
    });
  });

  function showToast() {
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  async function render() {
    const data = await chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false });
    globalToggle.checked = data.globalEnabled;

    const sites = Object.keys(data.enabledSites).sort();
    if (sites.length === 0) {
      siteList.innerHTML = '<div class="empty-state">No sites added yet. Toggle the extension on any site to add it here.</div>';
      return;
    }

    const globeSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';

    siteList.innerHTML = '';
    sites.forEach(site => {
      const siteData = data.enabledSites[site];
      const row = document.createElement('div');
      row.className = 'site-item';

      const left = document.createElement('div');
      left.className = 'site-item-left';

      const faviconDiv = document.createElement('div');
      faviconDiv.className = 'site-favicon';
      if (typeof siteData === 'object' && siteData.favicon) {
        const img = document.createElement('img');
        img.src = siteData.favicon;
        img.onerror = () => { faviconDiv.innerHTML = globeSvg; };
        faviconDiv.appendChild(img);
      } else {
        faviconDiv.innerHTML = globeSvg;
      }

      const hostnameSpan = document.createElement('span');
      hostnameSpan.className = 'site-hostname';
      hostnameSpan.textContent = site;

      left.appendChild(faviconDiv);
      left.appendChild(hostnameSpan);

      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-btn';
      removeBtn.title = 'Remove';
      removeBtn.dataset.site = site;
      removeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';

      row.appendChild(left);
      row.appendChild(removeBtn);
      siteList.appendChild(row);
    });

    siteList.querySelectorAll('.remove-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const site = e.currentTarget.dataset.site;
        const d = await chrome.storage.sync.get({ enabledSites: {} });
        delete d.enabledSites[site];
        await chrome.storage.sync.set({ enabledSites: d.enabledSites });
        showToast();
        render();
      });
    });

    // Update count
    siteCount.textContent = `${sites.length} site${sites.length !== 1 ? 's' : ''}`;

    // Apply current search filter
    filterSites(searchInput.value);
  }

  function filterSites(query) {
    const items = siteList.querySelectorAll('.site-item');
    const q = query.toLowerCase().trim();
    let visible = 0;

    items.forEach(item => {
      const hostname = item.querySelector('.site-hostname').textContent.toLowerCase();
      const match = !q || hostname.includes(q);
      item.classList.toggle('hidden', !match);
      if (match) visible++;
    });

    // Show no results message
    const existing = siteList.querySelector('.no-results');
    if (existing) existing.remove();

    if (visible === 0 && q && items.length > 0) {
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = `No sites matching "${query}"`;
      siteList.appendChild(noResults);
    }
  }

  searchInput.addEventListener('input', () => {
    filterSites(searchInput.value);
  });

  globalToggle.addEventListener('change', async () => {
    await chrome.storage.sync.set({ globalEnabled: globalToggle.checked });
    showToast();
  });

  addBtn.addEventListener('click', async () => {
    let hostname = addInput.value.trim().toLowerCase();
    if (!hostname) return;
    try {
      if (hostname.includes('://')) hostname = new URL(hostname).hostname;
    } catch (e) {}
    hostname = hostname.replace(/^www\./, '');

    const data = await chrome.storage.sync.get({ enabledSites: {} });
    data.enabledSites[hostname] = { enabled: true, favicon: `https://www.google.com/s2/favicons?domain=${hostname}&sz=32` };
    await chrome.storage.sync.set({ enabledSites: data.enabledSites });
    addInput.value = '';
    showToast();
    render();
  });

  addInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addBtn.click();
  });

  render();
});
