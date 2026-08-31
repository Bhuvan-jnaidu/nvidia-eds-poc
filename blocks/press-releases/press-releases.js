import {
  Button,
  Card,
  ChevronLeft,
  ChevronRight,
  Flex,
  React,
  Text,
  createRoot,
  flushSync,
} from '@kui/foundations-react';

const {
  useState, useEffect, useRef, useCallback,
} = React;
const h = React.createElement;

/**
 * Reads the block's key/value config rows into an object.
 * Each row is `<div><div>key</div><div>value</div></div>`.
 * If the value cell contains a link, its href is used (so authored URLs work).
 * @param {Element} block
 * @returns {Object} config map, e.g. { endpoint, cards, max, heading, ... }
 */
function readBlockConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return;
    const key = cells[0].textContent.trim().toLowerCase().replace(/\s+/g, '-');
    const link = cells[1].querySelector('a');
    const value = link ? link.href : cells[1].textContent.trim();
    if (key) config[key] = value;
  });
  return config;
}

/**
 * Formats an RSS pubDate ("Tue, 23 Jun 2026 13:00:00 GMT") to "June 23, 2026".
 * @param {string} raw
 * @returns {string}
 */
function formatDate(raw) {
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

/**
 * Fetches and parses the RSS/XML feed into an array of card items.
 * @param {string} endpoint
 * @param {number} max
 * @returns {Promise<Array<{title,date,image,href}>>}
 */
async function fetchItems(endpoint, max) {
  const res = await fetch(endpoint);
  if (!res.ok) throw new Error(`Feed request failed: ${res.status}`);
  const text = await res.text();
  const xml = new DOMParser().parseFromString(text, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('Feed XML parse error');

  return [...xml.querySelectorAll('item')].slice(0, max).map((node) => {
    const media = node.getElementsByTagName('media:content')[0];
    return {
      title: node.querySelector('title')?.textContent.trim() || '',
      date: formatDate(node.querySelector('pubDate')?.textContent),
      image: media?.getAttribute('url') || '',
      href: node.querySelector('link')?.textContent.trim() || '',
    };
  });
}

/** A single press-release card (KUI Card + Text). */
function CardView({ item }) {
  return h(
    'a',
    { className: 'press-releases__card-link', href: item.href },
    h(
      Card,
      {
        kind: 'solid',
        slotMedia: item.image
          ? h('img', {
            className: 'press-releases__card-img',
            src: item.image,
            alt: '',
            loading: 'lazy',
          })
          : null,
      },
      h(
        Flex,
        { direction: 'col', gap: '2' },
        item.date && h(Text, { asChild: true, kind: 'label/regular/sm' }, h('span', { className: 'press-releases__card-date' }, item.date)),
        item.title && h(Text, { asChild: true, kind: 'body/bold/lg' }, h('h3', null, item.title)),
      ),
    ),
  );
}

const ALLOWED_TAGS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span'];

/** Returns a safe tag name from config, falling back to a default. */
function safeTag(value, fallback) {
  const tag = (value || '').trim().toLowerCase();
  return ALLOWED_TAGS.includes(tag) ? tag : fallback;
}

/** The header zone: heading + description + "View More" button. */
function Header({ config }) {
  // Tag = semantics (h2/h3/...), kind = KUI visual size — both authorable from the doc.
  const headingTag = safeTag(config['heading-tag'], 'h2');
  const headingKind = config['heading-kind'] || 'display/sm';
  const descTag = safeTag(config['description-tag'], 'h3');
  const descKind = config['description-kind'] || 'body/regular/md';

  return h(
    'div',
    { className: 'press-releases__header' },
    h(
      'div',
      { className: 'press-releases__header-text' },
      config.heading && h(Text, { asChild: true, kind: headingKind }, h(headingTag, null, config.heading)),
      config.description && h(Text, { asChild: true, kind: descKind }, h(descTag, { className: 'press-releases__description' }, config.description)),
    ),
    config.cta && config['cta-link'] && h(
      Button,
      { asChild: true, kind: 'secondary', color: 'brand' },
      h('a', { className: 'press-releases__cta', href: config['cta-link'] }, config.cta),
    ),
  );
}

/** Pagination dots + prev/next arrows. */
function Controls({
  pages, page, onGo, onPrev, onNext,
}) {
  if (pages <= 1) return null;
  return h(
    'div',
    { className: 'press-releases__controls' },
    h(
      'div',
      { className: 'press-releases__dots', role: 'tablist', 'aria-label': 'Choose a slide' },
      Array.from({ length: pages }).map((_, i) => h('button', {
        key: i,
        type: 'button',
        className: `press-releases__dot${i === page ? ' is-active' : ''}`,
        role: 'tab',
        'aria-label': `Go to slide ${i + 1}`,
        'aria-selected': i === page,
        onClick: () => onGo(i),
      })),
    ),
    h(
      'div',
      { className: 'press-releases__arrows' },
      h('button', {
        type: 'button',
        className: 'press-releases__arrow',
        'aria-label': 'Previous',
        disabled: page <= 0,
        onClick: onPrev,
      }, h(ChevronLeft, { 'aria-hidden': true })),
      h('button', {
        type: 'button',
        className: 'press-releases__arrow',
        'aria-label': 'Next',
        disabled: page >= pages - 1,
        onClick: onNext,
      }, h(ChevronRight, { 'aria-hidden': true })),
    ),
  );
}

/** The carousel: scroll viewport of cards + page dots + arrows. */
function Carousel({ items }) {
  const viewportRef = useRef(null);
  const [perView, setPerView] = useState(1);
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(items.length / perView));

  // Read cards-per-view from the CSS variable so responsiveness lives in CSS.
  useEffect(() => {
    const readPerView = () => {
      const el = viewportRef.current;
      if (!el) return;
      const value = parseInt(getComputedStyle(el).getPropertyValue('--pr-cards-per-view'), 10);
      setPerView(Number.isNaN(value) ? 1 : value);
    };
    readPerView();
    window.addEventListener('resize', readPerView);
    return () => window.removeEventListener('resize', readPerView);
  }, []);

  // Keep the active page valid if the number of pages changes (e.g. on resize).
  useEffect(() => {
    setPage((p) => Math.min(p, pages - 1));
  }, [pages]);

  const goTo = useCallback((target) => {
    const el = viewportRef.current;
    if (!el) return;
    const clamped = Math.max(0, Math.min(target, pages - 1));
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' });
    setPage(clamped);
  }, [pages]);

  const onScroll = useCallback(() => {
    const el = viewportRef.current;
    if (!el || !el.clientWidth) return;
    setPage(Math.round(el.scrollLeft / el.clientWidth));
  }, []);

  const onKeyDown = useCallback((e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(page - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); goTo(page + 1); }
  }, [goTo, page]);

  return h(
    'div',
    { className: 'press-releases__carousel' },
    h(
      'div',
      {
        className: 'press-releases__viewport',
        ref: viewportRef,
        onScroll,
        onKeyDown,
        tabIndex: 0,
        role: 'group',
        'aria-roledescription': 'carousel',
      },
      h(
        'div',
        { className: 'press-releases__track' },
        items.map((item, i) => h(
          'div',
          { className: 'press-releases__slide', key: i },
          h(CardView, { item }),
        )),
      ),
    ),
    h(Controls, {
      pages,
      page,
      onGo: goTo,
      onPrev: () => goTo(page - 1),
      onNext: () => goTo(page + 1),
    }),
  );
}

/** The whole block: header + carousel. */
function PressReleases({ config }) {
  const max = Number(config.max) || 9;
  const [items, setItems] = useState(null); // null = loading
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchItems(config.endpoint, max)
      .then((data) => { if (alive) setItems(data); })
      .catch(() => { if (alive) setError(true); });
    return () => { alive = false; };
  }, [config.endpoint, max]);

  return h(
    'div',
    { className: 'press-releases__inner' },
    h(Header, { config }),
    error && h('p', { className: 'press-releases__status' }, 'Unable to load press releases.'),
    !error && items === null && h('p', { className: 'press-releases__status' }, 'Loading…'),
    !error && items && items.length > 0 && h(Carousel, { items }),
  );
}

/**
 * loads and decorates the block
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const config = readBlockConfig(block);
  block.textContent = '';
  block.classList.add('nv-theme-kui11');
  flushSync(() => {
    createRoot(block).render(h(PressReleases, { config }));
  });
}
