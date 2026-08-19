import { loadScript } from '../../scripts/aem.js';

export default async function decorate(block) {
  // Clear any content EDS may have placed in the block
  block.innerHTML = '';

  // Use the semantic <header> element as the nav mount point
  const headerEl = block.closest('header') || block;
  headerEl.id = 'nvidia-global-nav';

  // Give the <footer> element an ID so global-nav can portal the footer into it.
  const footerEl = document.querySelector('footer');
  if (footerEl) footerEl.id = 'nvidia-global-footer';

  // Pre-fetch local fallback nav data
  let fallbackJSON;
  try {
    const fallbackResp = await fetch('/scripts/global-nav/fallback-nav.json');
    if (fallbackResp.ok) {
      const fallbackData = await fallbackResp.json();
      fallbackJSON = JSON.stringify(fallbackData);
    }
  } catch {
  }

  await loadScript('https://www.nvidia.com/assets/raw-html-components/global-navigation-react2/bundle.js');

  const doMount = () => {
    window.NVIDIAHeaderFooterPlugin.mount({
      headerElemID: 'nvidia-global-nav',
      footerElemID: 'nvidia-global-footer',
      showHeader: true,
      showFooter: !!footerEl,
      ...(fallbackJSON && { fallbackJSON }),
    });
  };

  // The bundle dispatches 'global-navigation:ready' after it loads.
  // If it already fired (e.g. cached and synchronous), mount immediately.
  if (window.NVIDIAHeaderFooterPlugin) {
    doMount();
  } else {
    document.addEventListener('global-navigation:ready', doMount, { once: true });
  }
}
