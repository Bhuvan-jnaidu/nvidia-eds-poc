/*
 * EDS Core Framework — aligned with adobe/aem-boilerplate (latest main)
 * https://github.com/adobe/aem-boilerplate
 */

/* eslint-env browser */
export function sampleRUM(checkpoint, data) {
  // eslint-disable-next-line max-len
  const timeShift = () => (window.performance ? window.performance.now() : Date.now() - window.hlx.rum.firstReadTime);
  try {
    window.hlx = window.hlx || {};
    if (!window.hlx.rum || !window.hlx.rum.collector) {
      sampleRUM.enhance = () => {};
      const params = new URLSearchParams(window.location.search);
      const { currentScript } = document;
      const rate = params.get('rum')
        || window.SAMPLE_PAGEVIEWS_AT_RATE
        || params.get('optel')
        || (currentScript && currentScript.dataset.rate);
      const rateValue = { on: 1, off: 0, high: 10, low: 1000 }[rate];
      const weight = rateValue !== undefined ? rateValue : 100;
      const id = (window.hlx.rum && window.hlx.rum.id) || crypto.randomUUID().slice(-9);
      const isSelected = (window.hlx.rum && window.hlx.rum.isSelected)
        || (weight > 0 && Math.random() * weight < 1);
      window.hlx.rum = {
        weight, id, isSelected,
        firstReadTime: window.performance ? window.performance.timeOrigin : Date.now(),
        sampleRUM, queue: [],
        collector: (...args) => window.hlx.rum.queue.push(args),
      };
      if (isSelected) {
        const dataFromErrorObj = (error) => {
          const errData = { source: 'undefined error' };
          try {
            errData.target = error.toString();
            if (error.stack) {
              errData.source = error.stack
                .split('\n')
                .filter((line) => line.match(/https?:\/\//))
                .shift()
                .replace(/at ([^ ]+) \((.+)\)/, '$1@$2')
                .replace(/ at /, '@')
                .trim();
            }
          } catch (err) { /* error structure was not as expected */ }
          return errData;
        };

        window.addEventListener('error', ({ error }) => sampleRUM('error', dataFromErrorObj(error)));
        window.addEventListener('unhandledrejection', ({ reason }) => {
          let errData = { source: 'Unhandled Rejection', target: reason || 'Unknown' };
          if (reason instanceof Error) errData = dataFromErrorObj(reason);
          sampleRUM('error', errData);
        });
        window.addEventListener('securitypolicyviolation', (e) => {
          if (e.blockedURI.includes('helix-rum-enhancer') && e.disposition === 'enforce') {
            sampleRUM.sendPing('error', timeShift(), { source: 'csp', target: e.blockedURI });
          }
        });

        sampleRUM.baseURL = sampleRUM.baseURL || new URL(window.RUM_BASE || '/', new URL('https://ot.aem.live'));
        sampleRUM.collectBaseURL = sampleRUM.collectBaseURL || sampleRUM.baseURL;
        sampleRUM.sendPing = (ck, time, pingData = {}) => {
          const uaExtra = navigator.webdriver && !navigator.userAgent.includes('+http')
            ? { ua: `${navigator.userAgent} +http://navigator.webdriver` }
            : {};
          const rumData = JSON.stringify({
            weight, id,
            referer: window.location.origin + window.location.pathname,
            checkpoint: ck, t: time, ...pingData, ...uaExtra,
          });
          const urlParams = window.RUM_PARAMS
            ? new URLSearchParams(window.RUM_PARAMS).toString() || '' : '';
          const { href: url, origin } = new URL(
            `.rum/${weight}${urlParams ? `?${urlParams}` : ''}`,
            sampleRUM.collectBaseURL,
          );
          const body = origin === window.location.origin
            ? new Blob([rumData], { type: 'application/json' }) : rumData;
          navigator.sendBeacon(url, body);
          // eslint-disable-next-line no-console
          console.debug(`ping:${ck}`, pingData);
        };
        sampleRUM.sendPing('top', timeShift());

        sampleRUM.enhance = () => {
          if (document.querySelector('script[src*="rum-enhancer"]')) return;
          const { enhancerVersion, enhancerHash } = sampleRUM.enhancerContext || {};
          const script = document.createElement('script');
          if (enhancerHash) {
            script.integrity = enhancerHash;
            script.setAttribute('crossorigin', 'anonymous');
          }
          script.src = new URL(
            `.rum/@adobe/helix-rum-enhancer@${enhancerVersion || '^2'}/src/index.js`,
            sampleRUM.baseURL,
          ).href;
          document.head.appendChild(script);
        };
        if (!window.hlx.RUM_MANUAL_ENHANCE) sampleRUM.enhance();
      }
    }
    if (window.hlx.rum && window.hlx.rum.isSelected && checkpoint) {
      window.hlx.rum.collector(checkpoint, data, timeShift());
    }
    document.dispatchEvent(new CustomEvent('rum', { detail: { checkpoint, data } }));
  } catch (error) { /* something went awry */ }
}

export function setup() {
  window.hlx = window.hlx || {};
  window.hlx.RUM_MASK_URL = 'full';
  window.hlx.RUM_MANUAL_ENHANCE = true;
  window.hlx.codeBasePath = '';
  window.hlx.lighthouse = new URLSearchParams(window.location.search).get('lighthouse') === 'on';

  const scriptEl = document.querySelector('script[src$="/scripts/scripts.js"]');
  if (scriptEl) {
    try {
      [window.hlx.codeBasePath] = new URL(scriptEl.src).pathname.split('/scripts/scripts.js');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error);
    }
  }
}

function init() {
  setup();
  sampleRUM.collectBaseURL = window.origin;
  sampleRUM();
}

export function toClassName(name) {
  return typeof name === 'string'
    ? name.toLowerCase().replace(/[^0-9a-z]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    : '';
}

export function toCamelCase(name) {
  return toClassName(name).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
}

export function getMetadata(name, doc = document) {
  const attr = name && name.includes(':') ? 'property' : 'name';
  const meta = [...doc.head.querySelectorAll(`meta[${attr}="${name}"]`)]
    .map((m) => m.content).join(', ');
  return meta || '';
}

export function loadCSS(href) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.onload = resolve;
      link.onerror = reject;
      document.head.append(link);
    } else {
      resolve();
    }
  });
}

export function loadScript(src, attrs) {
  return new Promise((resolve, reject) => {
    if (!document.querySelector(`head > script[src="${src}"]`)) {
      const script = document.createElement('script');
      script.src = src;
      if (attrs) {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in
        for (const attr in attrs) script.setAttribute(attr, attrs[attr]);
      }
      script.onload = resolve;
      script.onerror = reject;
      document.head.append(script);
    } else {
      resolve();
    }
  });
}

export function readBlockConfig(block) {
  const config = {};
  block.querySelectorAll(':scope > div').forEach((row) => {
    if (row.children) {
      const cols = [...row.children];
      if (cols[1]) {
        const col = cols[1];
        const name = toClassName(cols[0].textContent);
        let value = '';
        if (col.querySelector('a')) {
          const as = [...col.querySelectorAll('a')];
          value = as.length === 1 ? as[0].href : as.map((a) => a.href);
        } else if (col.querySelector('img')) {
          const imgs = [...col.querySelectorAll('img')];
          value = imgs.length === 1 ? imgs[0].src : imgs.map((img) => img.src);
        } else if (col.querySelector('p')) {
          const ps = [...col.querySelectorAll('p')];
          value = ps.length === 1 ? ps[0].textContent : ps.map((p) => p.textContent);
        } else value = row.children[1].textContent;
        config[name] = value;
      }
    }
  });
  return config;
}

export function buildBlock(blockName, content) {
  const table = Array.isArray(content) ? content : [[content]];
  const blockEl = document.createElement('div');
  blockEl.classList.add(blockName);
  table.forEach((row) => {
    const rowEl = document.createElement('div');
    row.forEach((col) => {
      const colEl = document.createElement('div');
      const vals = col.elems ? col.elems : [col];
      vals.forEach((val) => {
        if (val) {
          if (typeof val === 'string') colEl.innerHTML += val;
          else colEl.appendChild(val);
        }
      });
      rowEl.appendChild(colEl);
    });
    blockEl.appendChild(rowEl);
  });
  return blockEl;
}

export function createOptimizedPicture(
  src,
  alt = '',
  eager = false,
  breakpoints = [{ media: '(min-width: 600px)', width: '2000' }, { width: '750' }],
) {
  const url = !src.startsWith('http') ? new URL(src, window.location.href) : new URL(src);
  const picture = document.createElement('picture');
  const { origin, pathname } = url;
  const ext = pathname.split('.').pop();

  breakpoints.forEach((br) => {
    const source = document.createElement('source');
    if (br.media) source.setAttribute('media', br.media);
    source.setAttribute('type', 'image/webp');
    source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=webply&optimize=medium`);
    picture.appendChild(source);
  });

  breakpoints.forEach((br, i) => {
    if (i < breakpoints.length - 1) {
      const source = document.createElement('source');
      if (br.media) source.setAttribute('media', br.media);
      source.setAttribute('srcset', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
      picture.appendChild(source);
    } else {
      const img = document.createElement('img');
      img.setAttribute('loading', eager ? 'eager' : 'lazy');
      img.setAttribute('alt', alt);
      picture.appendChild(img);
      img.setAttribute('src', `${origin}${pathname}?width=${br.width}&format=${ext}&optimize=medium`);
    }
  });

  return picture;
}

export function decorateTemplateAndTheme() {
  const addClasses = (element, classes) => {
    classes.split(',').forEach((c) => element.classList.add(toClassName(c.trim())));
  };
  const template = getMetadata('template');
  if (template) addClasses(document.body, template);
  const theme = getMetadata('theme');
  if (theme) addClasses(document.body, theme);
}

export function moveInstrumentation(from, to, { includeClass = false } = {}) {
  if (!from || !to) return;

  [...from.attributes]
    .filter(({ name }) => (
      name.startsWith('data-aue')
      || name.startsWith('data-richtext')
      || (includeClass && name === 'class')
    ))
    .forEach(({ name, value }) => {
      to.setAttribute(name, value);
      from.removeAttribute(name);
    });
}

export function wrapTextNodes(block) {
  const validWrappers = ['P', 'PRE', 'UL', 'OL', 'PICTURE', 'TABLE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'];
  const wrap = (el) => {
    const wrapper = document.createElement('p');
    wrapper.append(...el.childNodes);
    moveInstrumentation(el, wrapper, { includeClass: true });
    el.append(wrapper);
  };
  block.querySelectorAll(':scope > div > div').forEach((blockColumn) => {
    if (blockColumn.hasChildNodes()) {
      const hasWrapper = !!blockColumn.firstElementChild
        && validWrappers.some((tag) => blockColumn.firstElementChild.tagName === tag);
      if (!hasWrapper) {
        wrap(blockColumn);
      } else if (
        blockColumn.firstElementChild.tagName === 'PICTURE'
        && (blockColumn.children.length > 1 || !!blockColumn.textContent.trim())
      ) {
        wrap(blockColumn);
      }
    }
  });
}

function decorateIcon(span, prefix = '', alt = '') {
  if (span.hasChildNodes()) return; // already decorated
  const iconName = [...span.classList].find((c) => c.startsWith('icon-'))?.substring(5);
  if (!iconName) return;
  const img = document.createElement('img');
  img.dataset.iconName = iconName;
  img.src = `${window.hlx.codeBasePath}${prefix}/icons/${iconName}.svg`;
  img.alt = alt;
  img.loading = 'lazy';
  img.width = 16;
  img.height = 16;
  span.append(img);
}

function addSectionClasses(section, classes) {
  `${classes}`.split(',').forEach((c) => {
    const className = toClassName(c.trim());
    if (className) section.classList.add(className);
  });
}

function applySectionConfig(section, config) {
  const backgroundColor = config.backgroundColor || config['background-color'];
  const theme = toClassName(config.theme);

  if (backgroundColor && CSS.supports('color', backgroundColor)) {
    section.style.backgroundColor = backgroundColor;
  }
  if (['dark', 'light'].includes(theme)) section.classList.add(`nv-${theme}`);
  if (config.style) addSectionClasses(section, config.style);
}

function readSectionConfigParagraphs(section) {
  const config = {};
  section.querySelectorAll('p').forEach((p) => {
    const match = p.textContent.trim().match(/^\[([^\]]+)\]$/);
    let hasConfig = false;
    if (!match) return;

    match[1].split(',').forEach((entry) => {
      const [key, ...rest] = entry.split(':');
      const name = toClassName(key);
      const value = rest.join(':').trim();
      if (!value) return;
      if (name === 'background') {
        config['background-color'] = value;
        hasConfig = true;
      } else if (['background-color', 'theme', 'style'].includes(name)) {
        config[name] = value;
        hasConfig = true;
      }
    });

    if (hasConfig) p.remove();
  });
  return config;
}

function decorateSectionMetadata(section) {
  [...section.children].forEach((child) => {
    const firstCell = child.querySelector(':scope > div:first-child > div:first-child');
    if (
      !child.classList.contains('section-metadata')
      && toClassName(firstCell?.textContent) !== 'section-metadata'
    ) return;

    applySectionConfig(section, readBlockConfig(child));
    child.remove();
  });
}

export function decorateIcons(element, prefix = '') {
  element.querySelectorAll('span.icon').forEach((span) => decorateIcon(span, prefix));
}

export function decorateBlock(block) {
  const shortBlockName = block.classList[0];
  if (shortBlockName) {
    block.classList.add('block');
    block.dataset.blockName = shortBlockName;
    block.dataset.blockStatus = 'initialized';
    wrapTextNodes(block);
    const blockWrapper = block.parentElement;
    blockWrapper.classList.add(`${shortBlockName}-wrapper`);
    const section = block.closest('.section');
    if (section) section.classList.add(`${shortBlockName}-container`);
  }
}

export function decorateSections(main) {
  main.querySelectorAll(':scope > div').forEach((section) => {
    applySectionConfig(section, section.dataset);
    applySectionConfig(section, readSectionConfigParagraphs(section));
    decorateSectionMetadata(section);
    const wrappers = [];
    let defaultContent = false;
    [...section.children].forEach((e) => {
      if (e.tagName === 'DIV' || !defaultContent) {
        const wrapper = document.createElement('div');
        wrappers.push(wrapper);
        defaultContent = e.tagName !== 'DIV';
        if (defaultContent) wrapper.classList.add('default-content-wrapper');
      }
      wrappers[wrappers.length - 1].append(e);
    });
    wrappers.forEach((wrapper) => section.append(wrapper));
    // Second pass: catch config paragraphs that landed inside wrappers.
    applySectionConfig(section, readSectionConfigParagraphs(section));
    section.classList.add('section');
    section.dataset.sectionStatus = 'initialized';
    section.style.display = 'none';
  });
}

export function decorateBlocks(main) {
  main.querySelectorAll('div.section > div > div').forEach(decorateBlock);
}

export async function loadBlock(block) {
  const status = block.dataset.blockStatus;
  if (status !== 'loading' && status !== 'loaded') {
    block.dataset.blockStatus = 'loading';
    const { blockName } = block.dataset;
    try {
      const cssLoaded = loadCSS(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.css`);
      const decorationComplete = new Promise((resolve) => {
        (async () => {
          try {
            const mod = await import(`${window.hlx.codeBasePath}/blocks/${blockName}/${blockName}.js`);
            if (mod.default) await mod.default(block);
          } catch (error) {
            // eslint-disable-next-line no-console
            console.error(`failed to load module for ${blockName}`, error);
          }
          resolve();
        })();
      });
      await Promise.all([cssLoaded, decorationComplete]);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`failed to load block ${blockName}`, error);
    }
    block.dataset.blockStatus = 'loaded';
  }
  return block;
}

export async function waitForFirstImage(section) {
  const lcpCandidate = section.querySelector('img');
  await new Promise((resolve) => {
    if (lcpCandidate && !lcpCandidate.complete) {
      lcpCandidate.setAttribute('loading', 'eager');
      lcpCandidate.addEventListener('load', resolve);
      lcpCandidate.addEventListener('error', resolve);
    } else {
      resolve();
    }
  });
}

export async function loadSection(section, loadCallback) {
  const status = section.dataset.sectionStatus;
  if (!status || status === 'initialized') {
    section.dataset.sectionStatus = 'loading';
    const blocks = [...section.querySelectorAll('div.block')];
    for (let i = 0; i < blocks.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await loadBlock(blocks[i]);
    }
    if (loadCallback) await loadCallback(section);
    section.dataset.sectionStatus = 'loaded';
    section.style.display = null;
  }
}

export async function loadSections(element) {
  const sections = [...element.querySelectorAll('div.section')];
  for (let i = 0; i < sections.length; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await loadSection(sections[i]);
    if (i === 0 && sampleRUM.enhance) sampleRUM.enhance();
  }
}

export async function loadHeader(header) {
  const headerBlock = buildBlock('header', '');
  header.append(headerBlock);
  decorateBlock(headerBlock);
  return loadBlock(headerBlock);
}

export async function loadFooter(footer) {
  const footerBlock = buildBlock('footer', '');
  footer.append(footerBlock);
  decorateBlock(footerBlock);
  return loadBlock(footerBlock);
}

init();
