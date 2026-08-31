const SOCIAL_ICONS = {
  facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
  instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>`,
  linkedin: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  x: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  youtube: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
};

function getSocialIcon(text) {
  const t = text.toLowerCase().trim();
  if (t === 'x' || t.includes('twitter')) return SOCIAL_ICONS.x;
  return SOCIAL_ICONS[t] || null;
}

export default async function decorate(block) {
  const resp = await fetch('/footer.html');
  if (!resp.ok) return;

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = [...doc.body.children];

  // Section 0: nav columns (3 col divs)
  const colsSection = sections[0];
  // Section 1: social
  const socialSection = sections[1];
  // Section 2: global footer (logo + legal links + copyright)
  const globalSection = sections[2];

  // ── Main footer (black) ──────────────────────────────────────────────────
  const mainFooter = document.createElement('div');
  mainFooter.className = 'footer-main';

  const inner = document.createElement('div');
  inner.className = 'footer-inner';

  // 3-column nav grid
  const grid = document.createElement('div');
  grid.className = 'footer-grid';
  [...(colsSection?.children || [])].forEach((col) => {
    const colEl = document.createElement('div');
    colEl.className = 'footer-col';
    const heading = col.querySelector('h3');
    if (heading) {
      const h = document.createElement('h5');
      h.textContent = heading.textContent;
      colEl.appendChild(h);
      const hr = document.createElement('hr');
      colEl.appendChild(hr);
    }
    const ul = col.querySelector('ul');
    if (ul) colEl.appendChild(ul.cloneNode(true));
    grid.appendChild(colEl);
  });
  inner.appendChild(grid);

  // Social row
  const bottom = document.createElement('div');
  bottom.className = 'footer-bottom';

  if (socialSection) {
    const label = socialSection.querySelector('p')?.textContent || 'Follow NVIDIA';
    const links = [...(socialSection.querySelector('ul')?.querySelectorAll('a') || [])];
    const socialEl = document.createElement('div');
    socialEl.className = 'footer-social';
    const labelEl = document.createElement('span');
    labelEl.className = 'footer-social-label';
    labelEl.textContent = label;
    socialEl.appendChild(labelEl);
    links.forEach((a) => {
      const icon = getSocialIcon(a.textContent);
      if (icon) {
        const link = document.createElement('a');
        link.href = a.href;
        link.setAttribute('aria-label', a.textContent.trim());
        link.innerHTML = icon;
        socialEl.appendChild(link);
      }
    });
    bottom.appendChild(socialEl);
  }

  inner.appendChild(bottom);
  mainFooter.appendChild(inner);
  block.appendChild(mainFooter);

  // ── Global footer (light) ────────────────────────────────────────────────
  if (globalSection) {
    const globalFooter = document.createElement('div');
    globalFooter.className = 'footer-global';

    const globalInner = document.createElement('div');
    globalInner.className = 'footer-global-inner';

    // Logo
    const logoLink = globalSection.querySelector('a');
    const logoEl = document.createElement('a');
    logoEl.href = logoLink?.href || '/';
    logoEl.className = 'footer-global-logo';
    logoEl.setAttribute('aria-label', 'NVIDIA Home');
    logoEl.innerHTML = `<svg class="footer-nvidia-wordmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 407.8 1000 184.4" aria-hidden="true">
      <g>
        <path d="M987.1 555.7v-2.8h1.7c0.9 0 2.3 0.1 2.3 1.2 0 1.2-0.7 1.5-1.8 1.5H987.1M987.1 557.6h1.2l2.8 4.8h3l-3.1-5c1.5-0.1 2.9-0.8 2.9-3 0-2.7-1.8-3.5-4.9-3.5h-4.4v11.5h2.6L987.1 557.6M1000 556.7c0-6.8-5.2-10.7-11.1-10.7 -5.8 0-11.1 3.9-11.1 10.7 0 6.8 5.2 10.7 11.1 10.7S1000 563.5 1000 556.7M996.8 556.7c0 4.9-3.6 8.2-7.9 8.2l0 0c-4.4 0-7.9-3.3-7.9-8.2 0-4.9 3.6-8.2 7.9-8.2C993.2 548.6 996.8 551.9 996.8 556.7z"/>
        <path d="M593.2 442.7v121.1h34.2V442.7H593.2zM324.4 442.5v121.2h34.5v-94.1l26.9 0.1c8.8 0 15 2.2 19.2 6.7 5.4 5.7 7.6 15.1 7.6 32v55.3H446v-66.9c0-47.8-30.5-54.3-60.2-54.3C385.8 442.5 324.4 442.5 324.4 442.5zM648.3 442.7v121.1h55.4c29.5 0 39.2-4.9 49.6-15.9 7.4-7.7 12.1-24.7 12.1-43.3 0-17-4-32.2-11.1-41.7 -12.5-16.9-30.8-20.2-58.1-20.2H648.3zM682.2 469h14.7c21.3 0 35.1 9.5 35.1 34.4 0 24.8-13.7 34.4-35.1 34.4h-14.7V469zM544 442.7l-28.5 95.9 -27.3-95.9h-36.9l39 121.1h49.2l39.3-121.1H544zM781.4 563.7h34.2v-121h-34.2V563.7zM877.2 442.7l-47.7 121h33.7l7.6-21.3h56.5l7.2 21.3h36.6l-48.2-121H877.2zM899.4 464.8l20.7 56.6H878L899.4 464.8z"/>
        <path d="M103.9 462.8v-16.6c1.6-0.1 3.3-0.2 4.9-0.2 45.6-1.4 75.4 39.1 75.4 39.1s-32.2 44.8-66.8 44.8c-5 0-9.4-0.8-13.4-2.2v-50.5c17.7 2.2 21.3 10 32 27.7l23.7-20c0 0-17.3-22.7-46.5-22.7C110 462.3 106.9 462.5 103.9 462.8M103.9 407.8v24.8c1.6-0.1 3.3-0.2 4.9-0.3 63.3-2.2 104.6 51.9 104.6 51.9s-47.4 57.7-96.7 57.7c-4.5 0-8.7-0.4-12.7-1.1v15.4c3.4 0.4 7 0.7 10.6 0.7 46 0 79.2-23.5 111.4-51.2 5.3 4.3 27.2 14.7 31.7 19.2 -30.6 25.6-101.9 46.3-142.3 46.3 -3.9 0-7.6-0.2-11.3-0.6v21.6h174.7V407.8H103.9zM103.9 527.8v13.1c-42.5-7.6-54.3-51.8-54.3-51.8s20.4-22.6 54.3-26.3v14.4c0 0 0 0-0.1 0 -17.7-2.2-31.7 14.5-31.7 14.5S80 519.6 103.9 527.8M28.4 487.2c0 0 25.2-37.1 75.5-41v-13.5C48.2 437.2 0 484.4 0 484.4s27.3 79 103.9 86.3v-14.4C47.7 549.2 28.4 487.2 28.4 487.2z"/>
      </g>
    </svg>`;
    globalInner.appendChild(logoEl);

    // Legal links + copyright
    const legalEl = document.createElement('div');
    legalEl.className = 'footer-global-legal';

    const linkList = globalSection.querySelector('ul');
    if (linkList) {
      const legalLinks = document.createElement('p');
      legalLinks.className = 'footer-legal-links';
      [...linkList.querySelectorAll('a')].forEach((a, i) => {
        if (i > 0) {
          const sep = document.createTextNode(' | ');
          legalLinks.appendChild(sep);
        }
        const link = document.createElement('a');
        link.href = a.href;
        link.textContent = a.textContent;
        legalLinks.appendChild(link);
      });
      legalEl.appendChild(legalLinks);
    }

    const paras = [...globalSection.querySelectorAll('p')];
    const copyright = paras.find((p) => p.textContent.includes('Copyright'));
    if (copyright) {
      const copy = document.createElement('p');
      copy.className = 'footer-copyright';
      copy.textContent = copyright.textContent;
      legalEl.appendChild(copy);
    }

    globalInner.appendChild(legalEl);
    globalFooter.appendChild(globalInner);
    block.appendChild(globalFooter);
  }
}
