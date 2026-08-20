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

  // The global nav renders as a position:fixed bar overlaying the top of the
  // page, but it does NOT reserve layout space — so page content (e.g. the
  // agreement dark bar) hides underneath it. Measure the fixed nav's height and
  // pad the body by it. Re-run as the async nav settles and on resize.
  const reserveNavSpace = () => {
    let h = 0;
    document.querySelectorAll('body *').forEach((el) => {
      if (getComputedStyle(el).position !== 'fixed') return;
      const r = el.getBoundingClientRect();
      if (r.top <= 2 && r.height > h && r.height < 200) h = r.height;
    });
    document.body.style.paddingTop = h ? `${h}px` : '';
  };

  const doMount = () => {
    window.NVIDIAHeaderFooterPlugin.mount({
      headerElemID: 'nvidia-global-nav',
      footerElemID: 'nvidia-global-footer',
      showHeader: true,
      showFooter: !!footerEl,
      ...(fallbackJSON && { fallbackJSON }),
    });
    [50, 200, 500, 1000].forEach((d) => setTimeout(reserveNavSpace, d));
    window.addEventListener('resize', reserveNavSpace);
  };

  // The bundle dispatches 'global-navigation:ready' after it loads.
  // If it already fired (e.g. cached and synchronous), mount immediately.
  if (window.NVIDIAHeaderFooterPlugin) {
    doMount();
  } else {
    document.addEventListener('global-navigation:ready', doMount, { once: true });
  }
}
