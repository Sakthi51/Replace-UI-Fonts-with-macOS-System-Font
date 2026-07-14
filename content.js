// Glyph — Content Script
// Reads each element's computed font. If not monospace/icon, overrides to system font.
// Guaranteed correct: reads FIRST, writes SECOND.

(function() {
  'use strict';

  // Prevent running twice on the same page
  if (document.documentElement.hasAttribute('data-sysfont-applied')) return;

  // Check if this site is enabled
  const hostname = location.hostname;
  chrome.storage.sync.get({ enabledSites: {}, globalEnabled: false }, (data) => {
    if (!data.globalEnabled && !data.enabledSites[hostname]) return;
    // Handle both old format (true) and new format ({enabled, favicon})
    const siteData = data.enabledSites[hostname];
    if (siteData && typeof siteData === 'object' && !siteData.enabled) return;
    document.documentElement.setAttribute('data-sysfont-applied', '');
    run();
  });

  function run() {

  const SYSTEM_FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Helvetica Neue", sans-serif';

  const MONO_RE = /monospace|monaco|menlo|consolas|courier|sf mono|sfmono|fira code|fira mono|jetbrains|source code|inconsolata|dejavu sans mono|liberation mono|ubuntu mono|droid sans mono|andale mono|lucida console/i;

  const ICON_FONT_RE = /fontawesome|fa\d|material|glyphicon|icomoon|feather|ionicon|weathericons|typicons|lineicons/i;

  function shouldSkip(el) {
    // Skip non-elements
    if (el.nodeType !== 1) return true;
    // Skip SVGs
    const tag = el.tagName.toLowerCase();
    if (tag === 'svg' || tag === 'path' || tag === 'circle' || tag === 'line' ||
        tag === 'polyline' || tag === 'polygon' || tag === 'rect' || tag === 'g' ||
        tag === 'defs' || tag === 'use' || tag === 'symbol' || tag === 'clippath' ||
        tag === 'mask' || tag === 'image' || tag === 'text' || tag === 'tspan') return true;
    if (el.closest('svg')) return true;
    // Skip if already processed
    if (el.hasAttribute('data-sysfont')) return true;
    return false;
  }

  function overrideElement(el) {
    if (shouldSkip(el)) return;

    const computed = getComputedStyle(el).fontFamily;

    // Skip monospace fonts
    if (MONO_RE.test(computed)) return;
    // Skip icon fonts
    if (ICON_FONT_RE.test(computed)) return;

    el.style.setProperty('font-family', SYSTEM_FONT, 'important');
    el.setAttribute('data-sysfont', '');
  }

  function overrideAll() {
    const all = document.querySelectorAll('*');
    for (let i = 0; i < all.length; i++) {
      overrideElement(all[i]);
    }
  }

  // Run immediately
  overrideAll();

  // Run again after full load
  window.addEventListener('load', () => setTimeout(overrideAll, 300));

  // MutationObserver for dynamic content (SPAs, lazy loading)
  let rafPending = false;
  const observer = new MutationObserver((mutations) => {
    if (rafPending) return;
    rafPending = true;
    requestAnimationFrame(() => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          overrideElement(node);
          const children = node.querySelectorAll('*');
          for (let i = 0; i < children.length; i++) {
            overrideElement(children[i]);
          }
        }
      }
      rafPending = false;
    });
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
  } // end run()
})();
