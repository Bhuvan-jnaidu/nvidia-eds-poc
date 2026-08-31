function buildMegaMenu(section) {
  const categories = [...section.querySelectorAll(':scope > div')];
  const label = section.querySelector(':scope > p')?.textContent?.trim() || '';

  const menu = document.createElement('div');
  menu.className = 'mega-menu';
  menu.setAttribute('hidden', '');
  menu.setAttribute('aria-label', `${label} menu`);

  const inner = document.createElement('div');
  inner.className = 'mega-menu-inner';

  const catList = document.createElement('ul');
  catList.className = 'mega-menu-cats';

  const contentArea = document.createElement('div');
  contentArea.className = 'mega-menu-content';

  categories.forEach((cat, idx) => {
    const heading = cat.querySelector('h4')?.textContent?.trim() || '';
    const items = [...cat.querySelectorAll('li')];

    // Left: category tab
    const li = document.createElement('li');
    if (idx === 0) li.classList.add('active');
    const btn = document.createElement('button');
    btn.textContent = heading;
    btn.dataset.idx = idx;
    btn.setAttribute('aria-selected', idx === 0 ? 'true' : 'false');
    li.appendChild(btn);
    catList.appendChild(li);

    // Right: content pane
    const pane = document.createElement('div');
    pane.className = 'mega-menu-pane';
    pane.dataset.idx = idx;
    if (idx !== 0) pane.hidden = true;

    const h3 = document.createElement('h3');
    h3.textContent = heading;
    pane.appendChild(h3);

    const grid = document.createElement('ul');
    grid.className = 'mega-menu-items';

    items.forEach((item) => {
      const a = item.querySelector('a');
      if (!a) return;
      const desc = item.textContent.replace(a.textContent, '').trim();

      const liEl = document.createElement('li');
      const link = document.createElement('a');
      link.href = a.href;
      const strong = document.createElement('strong');
      strong.textContent = a.textContent;
      const arrow = document.createElement('span');
      arrow.className = 'mega-menu-arrow';
      arrow.setAttribute('aria-hidden', 'true');
      arrow.textContent = ' ›';
      strong.appendChild(arrow);
      link.appendChild(strong);
      liEl.appendChild(link);

      if (desc) {
        const p = document.createElement('p');
        p.textContent = desc;
        liEl.appendChild(p);
      }
      grid.appendChild(liEl);
    });

    pane.appendChild(grid);
    contentArea.appendChild(pane);
  });

  // Category switch on click
  catList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-idx]');
    if (!btn) return;
    const { idx } = btn.dataset;
    catList.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('active', String(i) === idx);
    });
    catList.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-selected', b.dataset.idx === idx ? 'true' : 'false');
    });
    contentArea.querySelectorAll('.mega-menu-pane').forEach((pane) => {
      pane.hidden = pane.dataset.idx !== idx;
    });
  });

  inner.appendChild(catList);
  inner.appendChild(contentArea);
  menu.appendChild(inner);
  return menu;
}

function closeAllMenus(nav) {
  nav.querySelectorAll('.mega-menu').forEach((m) => { m.hidden = true; });
  nav.querySelectorAll('.nav-primary-item').forEach((li) => li.classList.remove('open'));
  nav.querySelectorAll('.cs-dropdown').forEach((d) => { d.hidden = true; });
  nav.querySelectorAll('.nav-cs-link').forEach((a) => a.setAttribute('aria-expanded', 'false'));
  nav.querySelectorAll('.signin-dropdown').forEach((d) => { d.hidden = true; });
  nav.querySelectorAll('.nav-action-signin').forEach((b) => b.setAttribute('aria-expanded', 'false'));
  document.getElementById('nav-overlay')?.classList.remove('visible');
}

export default async function decorate(header) {
  const resp = await fetch('/nav.html');
  if (!resp.ok) return;

  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const sections = [...doc.body.children];

  // Identify sections by content
  const brandSection = sections.find((s) => s.querySelector(':scope > p > a') && !s.querySelector(':scope > div'));
  const navSections = sections.filter((s) => s.querySelector(':scope > p') && s.querySelector(':scope > div'));
  const utilitySection = sections.find((s) => s.querySelector(':scope > ul'));

  const nav = document.createElement('nav');
  nav.className = 'nav';
  nav.setAttribute('aria-label', 'Main navigation');

  // ── Nav inner bar ────────────────────────────────────────────────
  const inner = document.createElement('div');
  inner.className = 'nav-inner';

  // Logo
  const logoLink = brandSection?.querySelector('a');
  const logoEl = document.createElement('a');
  logoEl.className = 'nav-logo';
  logoEl.href = logoLink?.href || '/';
  logoEl.setAttribute('aria-label', 'NVIDIA Home');
  logoEl.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="117" height="35" viewBox="0 0 117 35" fill="none" aria-hidden="true">
    <title>Artificial Intelligence Computing Leadership from NVIDIA</title>
    <path d="M66.4201 15.476V29.238H70.2437V15.476H66.4201ZM36.3477 15.4573V29.238H40.2045V18.5408L43.2134 18.5513C44.2026 18.5513 44.8877 18.7928 45.3639 19.3097C45.9686 19.9653 46.2154 21.0212 46.2154 22.9532V29.238H49.9518V21.6243C49.9518 16.19 46.5447 15.4573 43.2122 15.4573H36.3477ZM72.5755 15.476V29.2368H78.7757C82.0795 29.2368 83.157 28.678 84.3241 27.4262C85.148 26.5465 85.6804 24.6168 85.6804 22.5075C85.6804 20.5732 85.2295 18.8477 84.4434 17.7732C83.0273 15.8517 80.987 15.476 77.9403 15.476H72.5755ZM76.367 18.472H78.0103C80.3949 18.472 81.9372 19.5605 81.9372 22.385C81.9372 25.2095 80.3949 26.2992 78.0103 26.2992H76.367V18.472ZM60.9085 15.476L57.7183 26.382L54.6613 15.476H50.5347L54.9011 29.2368H60.4104L64.8113 15.476H60.9096H60.9085ZM87.4591 29.2368H91.2827V15.476H87.458V29.2368H87.4591ZM98.176 15.4807L92.8377 29.2322H96.6073L97.4519 26.802H103.769L104.569 29.2322H108.661L103.283 15.4795H98.176V15.4807ZM100.657 17.9902L102.973 24.4325H98.2678L100.657 17.9902Z" fill="black"/>
    <path d="M11.6925 17.7697V15.8762C11.8738 15.8633 12.0563 15.8528 12.2422 15.847C17.3372 15.6837 20.68 20.2978 20.68 20.2978C20.68 20.2978 17.0699 25.3962 13.1992 25.3962C12.6415 25.3962 12.1423 25.3052 11.6925 25.1511V19.4077C13.6766 19.6515 14.0748 20.5417 15.2671 22.5623L17.919 20.2885C17.919 20.2885 15.9831 17.7067 12.7195 17.7067C12.3649 17.7067 12.0253 17.7323 11.6913 17.7685L11.6925 17.7697ZM11.6913 11.5128V14.342C11.8738 14.3268 12.0574 14.3152 12.241 14.3082C19.3259 14.0655 23.9425 20.2162 23.9425 20.2162C23.9425 20.2162 18.6408 26.7705 13.1166 26.7705C12.6105 26.7705 12.1366 26.7227 11.6913 26.6433V28.3922C12.0723 28.4412 12.4671 28.4703 12.8779 28.4703C18.0177 28.4703 21.7358 25.8021 25.3356 22.6428C25.9323 23.1281 28.3754 24.31 28.8781 24.828C25.4549 27.7412 17.4795 30.0885 12.9571 30.0885C12.521 30.0885 12.1022 30.0617 11.6913 30.022V32.479H31.2282V11.514H11.6925L11.6913 11.5128ZM11.6913 25.15V26.6433C6.93708 25.7812 5.6174 20.7575 5.6174 20.7575C5.6174 20.7575 7.89986 18.1862 11.6913 17.7697V19.4077C11.6913 19.4077 11.6867 19.4077 11.6845 19.4077C9.69462 19.165 8.14085 21.055 8.14085 21.055C8.14085 21.055 9.01183 24.2365 11.6925 25.1523L11.6913 25.15ZM3.24888 20.5417C3.24888 20.5417 6.06609 16.3148 11.6925 15.8773V14.3443C5.46134 14.853 0.0644531 20.2185 0.0644531 20.2185C0.0644531 20.2185 3.12036 29.2018 11.6925 30.0243V28.3945C5.40167 27.5895 3.24888 20.5417 3.24888 20.5417Z" fill="#76B900"/>
  </svg>`;
  inner.appendChild(logoEl);

  // Primary nav list
  const primaryUl = document.createElement('ul');
  primaryUl.className = 'nav-links';
  primaryUl.id = 'nav-links';

  navSections.forEach((section) => {
    const label = section.querySelector(':scope > p')?.textContent?.trim() || '';
    const li = document.createElement('li');
    li.className = 'nav-primary-item';

    const btn = document.createElement('button');
    btn.className = 'nav-primary-btn';
    btn.textContent = label;
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-haspopup', 'true');

    const megaMenu = buildMegaMenu(section);

    btn.addEventListener('click', () => {
      const isOpen = !megaMenu.hidden;
      closeAllMenus(nav);
      if (!isOpen) {
        megaMenu.hidden = false;
        li.classList.add('open');
        btn.setAttribute('aria-expanded', 'true');
        document.getElementById('nav-overlay')?.classList.add('visible');
      }
    });

    li.appendChild(btn);
    primaryUl.appendChild(li);
    // Append mega menu to nav (full-width, outside nav-inner)
    nav.appendChild(megaMenu);
  });

  inner.appendChild(primaryUl);

  // Utility links
  const utilityUl = document.createElement('ul');
  utilityUl.className = 'nav-utility';
  utilitySection?.querySelectorAll('li').forEach((li) => {
    utilityUl.appendChild(li.cloneNode(true));
  });
  inner.appendChild(utilityUl);

  // Icon actions: Search, Region, Sign In
  const navActions = document.createElement('div');
  navActions.className = 'nav-actions';

  navActions.innerHTML = `
    <button class="nav-action-btn" aria-label="Search">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path fill-rule="evenodd" clip-rule="evenodd"
          d="M10.5 3a7.5 7.5 0 1 0 4.55 13.561l3.695 3.696a1 1 0 0 0 1.414-1.414l-3.696-3.696A7.5 7.5 0 0 0 10.5 3ZM5 10.5a5.5 5.5 0 1 1 11 0 5.5 5.5 0 0 1-11 0Z"
          fill="#5E5E5E"/>
      </svg>
    </button>
    <li class="nav-header-item cs-item" id="nv-cs-item" role="none">
      <a aria-expanded="false" aria-haspopup="true" aria-label="Country Selector" class="nav-cs-link menu-level-1" href="#">
        <span class="cs-globe-wrap">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M4.65003 10.5C4.55165 10.9847 4.5 11.4863 4.5 12C4.5 12.5137 4.55165 13.0153 4.65003 13.5H7.55935C7.52023 13.0113 7.5 12.51 7.5 12C7.5 11.49 7.52023 10.9887 7.55935 10.5H4.65003ZM5.12407 9H7.74448C7.94369 7.82124 8.25841 6.75177 8.66557 5.85602C8.78395 5.5956 8.9143 5.34175 9.05649 5.09966C7.3001 5.84986 5.88822 7.25105 5.12407 9ZM12 3C7.02944 3 3 7.02944 3 12C3 16.9706 7.02944 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3ZM12 4.5C11.4394 4.5 10.6869 5.03412 10.0311 6.47672C9.7109 7.18121 9.44812 8.03723 9.26799 9H14.732C14.5519 8.03723 14.2891 7.18121 13.9689 6.47672C13.3131 5.03412 12.5606 4.5 12 4.5ZM16.2555 9C16.0563 7.82124 15.7416 6.75177 15.3344 5.85602C15.2161 5.5956 15.0857 5.34175 14.9435 5.09966C16.6999 5.84986 18.1118 7.25105 18.8759 9H16.2555ZM14.9355 10.5H9.06454C9.02232 10.9837 9 11.4851 9 12C9 12.5149 9.02232 13.0163 9.06454 13.5H14.9355C14.9777 13.0163 15 12.5149 15 12C15 11.4851 14.9777 10.9837 14.9355 10.5ZM16.4407 13.5C16.4798 13.0113 16.5 12.51 16.5 12C16.5 11.49 16.4798 10.9887 16.4407 10.5H19.35C19.4484 10.9847 19.5 11.4863 19.5 12C19.5 12.5137 19.4484 13.0153 19.35 13.5H16.4407ZM14.732 15H9.26799C9.44812 15.9628 9.7109 16.8188 10.0311 17.5233C10.6869 18.9659 11.4394 19.5 12 19.5C12.5606 19.5 13.3131 18.9659 13.9689 17.5233C14.2891 16.8188 14.5519 15.9628 14.732 15ZM14.9435 18.9003C15.0857 18.6583 15.2161 18.4044 15.3344 18.144C15.7416 17.2482 16.0563 16.1788 16.2555 15H18.8759C18.1118 16.749 16.6999 18.1501 14.9435 18.9003ZM9.05648 18.9003C8.9143 18.6583 8.78395 18.4044 8.66557 18.144C8.25841 17.2482 7.94369 16.1788 7.74448 15H5.12407C5.88822 16.749 7.3001 18.1501 9.05648 18.9003Z"
              fill="#5E5E5E" stroke="white" stroke-width="0.2"/>
          </svg>
          <span class="cs-loc-txt">US</span>
        </span>
      </a>
    </li>
    <button class="nav-action-btn nav-action-signin" aria-label="Sign in" aria-expanded="false" aria-haspopup="true">
      <div class="account-icon-anonuser">
        <i class="fa-sharp fa-light fa-circle-user" aria-hidden="true"></i>
        Sign In
      </div>
    </button>
  `;
  inner.appendChild(navActions);

  // ── Sign In dropdown ─────────────────────────────────────────────
  const signinDropdown = document.createElement('div');
  signinDropdown.className = 'signin-dropdown';
  signinDropdown.hidden = true;
  signinDropdown.innerHTML = `
    <ul class="signin-dropdown-list">
      <li>
        <a href="https://www.nvidia.com/en-us/account/" class="signin-dropdown-link">
          <i class="fa-sharp fa-light fa-circle-user" aria-hidden="true"></i>
          NVIDIA Account
        </a>
      </li>
      <li>
        <a href="https://marketplace.nvidia.com/" class="signin-dropdown-link">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path fill-rule="evenodd" clip-rule="evenodd"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h13M9 19.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Zm10 0a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
              stroke="#5E5E5E" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          NVIDIA Marketplace
        </a>
      </li>
    </ul>
  `;
  navActions.appendChild(signinDropdown);

  const signinBtn = navActions.querySelector('.nav-action-signin');
  signinBtn.addEventListener('click', () => {
    const isOpen = !signinDropdown.hidden;
    closeAllMenus(nav);
    signinDropdown.hidden = isOpen;
    signinBtn.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) document.getElementById('nav-overlay')?.classList.add('visible');
  });

  // ── Country Selector dropdown ────────────────────────────────────
  const csDropdown = document.createElement('div');
  csDropdown.className = 'cs-dropdown';
  csDropdown.hidden = true;
  csDropdown.innerHTML = `
    <div class="cs-dropdown-inner">
      <h2 class="cs-heading">Select Location</h2>
      <div class="cs-region">
        <h3 class="cs-region-heading">The Americas</h3>
        <ul class="cs-country-grid">
          <li><a href="#">Argentina</a></li>
          <li><a href="#">Brasil (Brazil)</a></li>
          <li><a href="#">Canada</a></li>
          <li><a href="#">Chile</a></li>
          <li><a href="#">Colombia</a></li>
          <li><a href="#">México (Mexico)</a></li>
          <li><a href="#">Peru</a></li>
          <li><a href="#">United States</a></li>
        </ul>
      </div>
      <div class="cs-region">
        <h3 class="cs-region-heading">Europe</h3>
        <ul class="cs-country-grid">
          <li><a href="#">België (Belgium)</a></li>
          <li><a href="#">Belgique (Belgium)</a></li>
          <li><a href="#">Česká Republika (Czech Republic)</a></li>
          <li><a href="#">Danmark (Denmark)</a></li>
          <li><a href="#">Deutschland (Germany)</a></li>
          <li><a href="#">España (Spain)</a></li>
          <li><a href="#">France</a></li>
          <li><a href="#">Italia (Italy)</a></li>
          <li><a href="#">Nederland (Netherlands)</a></li>
          <li><a href="#">Norge (Norway)</a></li>
          <li><a href="#">Österreich (Austria)</a></li>
          <li><a href="#">Polska (Poland)</a></li>
          <li><a href="#">România (Romania)</a></li>
          <li><a href="#">Suomi (Finland)</a></li>
          <li><a href="#">Sverige (Sweden)</a></li>
          <li><a href="#">Türkiye (Turkey)</a></li>
          <li><a href="#">United Kingdom</a></li>
          <li><a href="#">Rest of Europe</a></li>
        </ul>
      </div>
      <div class="cs-region">
        <h3 class="cs-region-heading">Asia Pacific</h3>
        <ul class="cs-country-grid">
          <li><a href="#">Australia</a></li>
          <li><a href="#">China</a></li>
          <li><a href="#">India</a></li>
          <li><a href="#">Japan</a></li>
          <li><a href="#">Korea</a></li>
          <li><a href="#">Singapore</a></li>
          <li><a href="#">Taiwan</a></li>
        </ul>
      </div>
    </div>
  `;
  nav.appendChild(csDropdown);

  // Toggle country selector on click
  const csLink = navActions.querySelector('.nav-cs-link');
  csLink.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = !csDropdown.hidden;
    closeAllMenus(nav);
    csDropdown.hidden = isOpen;
    csLink.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) document.getElementById('nav-overlay')?.classList.add('visible');
  });

  // Hamburger
  const hamburger = document.createElement('button');
  hamburger.className = 'nav-hamburger';
  hamburger.setAttribute('aria-controls', 'nav-links');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.setAttribute('aria-label', 'Toggle menu');
  hamburger.innerHTML = '<span></span><span></span><span></span>';
  hamburger.addEventListener('click', () => {
    const expanded = hamburger.getAttribute('aria-expanded') === 'true';
    hamburger.setAttribute('aria-expanded', String(!expanded));
    primaryUl.classList.toggle('open');
  });
  inner.appendChild(hamburger);

  nav.prepend(inner); // inner bar first, mega menus appended after

  // ── Overlay ──────────────────────────────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'nav-overlay';
  overlay.className = 'nav-overlay';
  overlay.addEventListener('click', () => closeAllMenus(nav));

  header.appendChild(nav);
  header.appendChild(overlay);

  // Close on ESC
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMenus(nav);
  });

  // Close on outside click
  document.addEventListener('click', (e) => {
    if (!header.contains(e.target)) closeAllMenus(nav);
  });
}
