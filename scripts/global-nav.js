// TRIAL: Mark Yam's reworked global header/footer plugin (Confluence: DEDT
// "(Version 2) Embed reworked header footer plugin").
//
// Instead of the EDS nav.html / footer.html blocks, this loads the shared
// NVIDIA navigation script and mounts the header + footer into the page's
// <header>/<footer> elements. Used on the `global-nav-plugin` branch only so we
// can Lighthouse-compare it against our own EDS header/footer on `main`.
//
// Trade-off being measured: this adds a third-party script (images.nvidia.com)
// + a runtime nav-content API call + post-load DOM injection (possible CLS),
// in exchange for zero maintenance and guaranteed brand consistency.

const SCRIPT_URL = 'https://images.nvidia.com/aem-dam/en-us/navigation-v3.2.1.js';
const API_ENDPOINT = 'https://www.nvidia.com/services/com.nvidia.services/nvgdcNavFooterSrvc'; // prod

export function loadGlobalNav(doc = document) {
  const header = doc.querySelector('header');
  const footer = doc.querySelector('footer');
  if (header) header.id = 'global-nav-header';
  if (footer) footer.id = 'global-nav-footer';

  const script = document.createElement('script');
  script.src = SCRIPT_URL;
  script.defer = true;
  script.addEventListener('load', () => {
    if (!window.NVIDIAHeaderFooterPlugin) return;
    window.NVIDIAHeaderFooterPlugin.mount({
      headerElemID: 'global-nav-header',
      footerElemID: 'global-nav-footer',
      showHeader: true,
      showFooter: true,
      version: '3', // new design
      injectAEMfont: true, // page is outside AEM; let the plugin bring its fonts
      APIEndpoint: API_ENDPOINT,
    });
  });
  document.body.append(script);
}
