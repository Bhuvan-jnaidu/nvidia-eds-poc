import { loadScript } from '../../scripts/aem.js';

// Header via the official NVIDIA global-navigation widget: load the hosted
// bundle and mount it. The plugin renders the header into <header> and portals
// the footer into <footer>, so this one block provides BOTH header and footer.
export default async function decorate(block) {
  block.innerHTML = '';

  const headerEl = block.closest('header') || block;
  headerEl.id = 'nvidia-global-nav';

  // Local fallback nav data (used if the plugin can't fetch its own).
  let fallbackJSON;
  try {
    const resp = await fetch('/scripts/global-nav/fallback-nav.json');
    if (resp.ok) fallbackJSON = JSON.stringify(await resp.json());
  } catch { /* no fallback available */ }

  await loadScript('https://www.nvidia.com/assets/raw-html-components/global-navigation-react2/bundle.js');

  // The nav is position:fixed and reserves no layout space, so page content
  // hides beneath it — measure the fixed bar and pad the body by its height.
  const reserveNavSpace = () => {
    let h = 0;
    document.querySelectorAll('body *').forEach((el) => {
      if (getComputedStyle(el).position !== 'fixed') return;
      const r = el.getBoundingClientRect();
      if (r.top <= 2 && r.height > h && r.height < 200) h = r.height;
    });
    document.body.style.paddingTop = h ? `${h}px` : '';
    // Publish the fixed nav height so sticky elements (e.g. the agreement
    // topbar) can offset themselves to sit just below the nav instead of under it.
    document.documentElement.style.setProperty('--nav-height', h ? `${h}px` : '0px');
  };

  // On non-nvidia.com origins the plugin can render its mobile (flex) layout at
  // desktop width; force any element that carries a real grid template back to
  // grid so the mega-menu columns don't collapse.
  const fixMegaMenuGrid = () => {
    document.querySelectorAll('[class*="global-nav-react-emotion-cache"]').forEach((el) => {
      const cs = getComputedStyle(el);
      if (cs.display === 'flex' && cs.gridTemplateColumns
          && cs.gridTemplateColumns !== 'none' && /px|repeat/.test(cs.gridTemplateColumns)) {
        el.style.display = 'grid';
      }
    });
  };

  const doMount = () => {
    // Re-query the footer here — by the time the bundle is ready, the lazily
    // loaded <footer> exists, so the plugin can portal the footer into it.
    const footerEl = document.querySelector('footer');
    if (footerEl) footerEl.id = 'nvidia-global-footer';

    window.NVIDIAHeaderFooterPlugin.mount({
      headerElemID: 'nvidia-global-nav',
      footerElemID: 'nvidia-global-footer',
      showHeader: true,
      showFooter: !!footerEl,
      ...(fallbackJSON && { fallbackJSON }),
    });

    [50, 200, 500, 1000].forEach((d) => setTimeout(reserveNavSpace, d));
    [200, 600, 1200].forEach((d) => setTimeout(fixMegaMenuGrid, d));
    window.addEventListener('resize', reserveNavSpace);
    let raf;
    new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(fixMegaMenuGrid);
    }).observe(document.body, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['class'],
    });
  };

  if (window.NVIDIAHeaderFooterPlugin) doMount();
  else document.addEventListener('global-navigation:ready', doMount, { once: true });
}
