import {
  buildBlock,
  loadHeader,
  loadFooter,
  decorateIcons,
  decorateSections,
  decorateBlocks,
  decorateTemplateAndTheme,
  waitForFirstImage,
  loadSection,
  loadSections,
  loadCSS,
} from './aem.js';

function buildHeroBlock(main) {
  const h1 = main.querySelector('h1');
  const picture = main.querySelector('picture');
  // eslint-disable-next-line no-bitwise
  if (h1 && picture && (h1.compareDocumentPosition(picture) & Node.DOCUMENT_POSITION_PRECEDING)) {
    if (h1.closest('.hero') || picture.closest('.hero')) return;
    const section = document.createElement('div');
    section.append(buildBlock('hero', { elems: [picture, h1] }));
    main.prepend(section);
  }
}

async function loadFonts() {
  await loadCSS(`${window.hlx.codeBasePath}/styles/fonts.css`);
  try {
    if (!window.location.hostname.includes('localhost')) sessionStorage.setItem('fonts-loaded', 'true');
  } catch (e) {
    // do nothing
  }
}

function buildAutoBlocks(main) {
  try {
    // auto-load /fragments/ references not already inside a fragment block
    const fragments = [...main.querySelectorAll('a[href*="/fragments/"]')]
      .filter((f) => !f.closest('.fragment'));
    if (fragments.length > 0) {
      // eslint-disable-next-line import/no-cycle
      import('../blocks/fragment/fragment.js').then(({ loadFragment }) => {
        fragments.forEach(async (fragment) => {
          try {
            const { pathname } = new URL(fragment.href);
            const frag = await loadFragment(pathname);
            fragment.parentElement.replaceWith(...frag.children);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Fragment loading failed', error);
          }
        });
      });
    }
    buildHeroBlock(main);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Auto Blocking failed', error);
  }
}

function decorateButtons(main) {
  main.querySelectorAll('p a[href]').forEach((a) => {
    a.title = a.title || a.textContent;
    const p = a.closest('p');
    const text = a.textContent.trim();

    if (a.querySelector('img') || p.textContent.trim() !== text) return;

    try {
      if (new URL(a.href).href === new URL(text, window.location).href) return;
    } catch { /* continue */ }

    const strong = a.closest('strong');
    const em = a.closest('em');
    if (!strong && !em) return;

    p.className = 'button-wrapper';
    a.className = 'button';
    if (strong && em) {
      a.classList.add('accent');
      const outer = strong.contains(em) ? strong : em;
      outer.replaceWith(a);
    } else if (strong) {
      a.classList.add('primary');
      strong.replaceWith(a);
    } else {
      a.classList.add('secondary');
      em.replaceWith(a);
    }
  });
}

// eslint-disable-next-line import/prefer-default-export
export function decorateMain(main) {
  decorateIcons(main);
  buildAutoBlocks(main);
  decorateSections(main);
  decorateBlocks(main);
  decorateButtons(main);
}

async function loadEager(doc) {
  document.documentElement.lang = 'en';
  // KUI component styles: load non-blocking (not a blocking <head> stylesheet).
  // loadCSS is idempotent; requested early here to minimize any unstyled flash.
  loadCSS(`${window.hlx.codeBasePath}/scripts/kui/foundations-react.bundle.css`);
  decorateTemplateAndTheme();
  const main = doc.querySelector('main');
  if (main) {
    decorateMain(main);
    document.body.classList.add('appear');
    await loadSection(main.querySelector('.section'), waitForFirstImage);
  }

  try {
    if (window.innerWidth >= 900 || sessionStorage.getItem('fonts-loaded')) {
      loadFonts();
    }
  } catch (e) {
    // do nothing
  }
}

// Indent legal sub-clauses by their number depth (7.1 < 7.1.1 < 7.1.1.1), so a
// long agreement nests like the real page. Vanilla DOM only; runs on legal pages.
function decorateLegalClauses(doc) {
  const legal = doc.querySelector('.section.legal');
  if (!legal) return;
  legal.querySelectorAll('.default-content-wrapper > p, li').forEach((el) => {
    const t = el.textContent;
    const sub = t.match(/^(\d+(?:\.\d+)+)\s/); // 1.1, 7.1.1
    if (sub) {
      const depth = sub[1].split('.').length - 1; // 7.1 -> 1, 7.1.1 -> 2
      // Indent the whole box (margin) so it matches the original's list items;
      // hanging text-indent keeps "1.1" in a left column. 1.x ~6em, 7.1.1 ~10em.
      el.style.marginLeft = `${2 + depth * 4}em`;
      el.style.textIndent = '-2em';
    } else if (/^\d+\.\s/.test(t)) {
      // Inline section paragraph ("5. SLA ...") — align with section headings.
      el.style.marginLeft = '2.8em';
    }
  });
}

// Auto-link bare emails/URLs in the legal body (robust against doc/EDS dropping a
// link), trimming trailing punctuation. Skips text already inside an <a>.
function linkifyLegal(doc) {
  const root = doc.querySelector('.section.legal .default-content-wrapper');
  if (!root) return;
  const RE = /(https?:\/\/[^\s<)]+|[\w.+-]+@[\w-]+\.[\w.-]+)/g;
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
  const targets = [];
  let node;
  // eslint-disable-next-line no-cond-assign
  while ((node = walker.nextNode())) {
    if (node.parentElement && node.parentElement.closest('a')) continue;
    if ([...node.nodeValue.matchAll(RE)].length) targets.push(node);
  }
  targets.forEach((n) => {
    const text = n.nodeValue;
    const frag = doc.createDocumentFragment();
    let last = 0;
    [...text.matchAll(RE)].forEach((m) => {
      if (m.index > last) frag.appendChild(doc.createTextNode(text.slice(last, m.index)));
      let tok = m[0];
      const trail = (tok.match(/[.,;:)]+$/) || [''])[0];
      if (trail) tok = tok.slice(0, tok.length - trail.length);
      const a = doc.createElement('a');
      a.href = tok.startsWith('http') ? tok : `mailto:${tok}`;
      a.textContent = tok;
      frag.appendChild(a);
      if (trail) frag.appendChild(doc.createTextNode(trail));
      last = m.index + m[0].length;
    });
    if (last < text.length) frag.appendChild(doc.createTextNode(text.slice(last)));
    n.parentNode.replaceChild(frag, n);
  });
}

async function loadLazy(doc) {
  loadHeader(doc.querySelector('header'));

  const main = doc.querySelector('main');
  await loadSections(main);
  decorateLegalClauses(doc);
  linkifyLegal(doc);

  const { hash } = window.location;
  const element = hash ? doc.getElementById(hash.substring(1)) : false;
  if (hash && element) element.scrollIntoView();

  loadFooter(doc.querySelector('footer'));

  loadCSS(`${window.hlx.codeBasePath}/styles/lazy-styles.css`);
  loadFonts();
}

function loadDelayed() {
  // eslint-disable-next-line import/no-cycle
  window.setTimeout(() => import('./delayed.js'), 3000);
}

async function loadPage() {
  await loadEager(document);
  await loadLazy(document);
  loadDelayed();
}

loadPage();
