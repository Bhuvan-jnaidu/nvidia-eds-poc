import {
  Badge,
  Button,
  Carousel,
  ChevronLeft,
  ChevronRight,
  Flex,
  Pause,
  Play,
  ProgressBar,
  React,
  Text,
  createRoot,
  flushSync,
  useCarouselContext,
} from "@kui/foundations-react";
import { loadCSS } from "../../scripts/aem.js";
import { readButtonLink, readButtonMeta, renderButton } from "../button/button.js";

const h = React.createElement;

loadCSS(`${window.hlx.codeBasePath}/blocks/carousel/carousel.css`);

const OPTION_KEYS = {
  "aria-label": "ariaLabel",
  arialabel: "ariaLabel",
  controls: "controls",
  "item-width": "itemWidth",
  itemwidth: "itemWidth",
  "items-per-view": "itemsPerView",
  itemsperview: "itemsPerView",
  card: "cardStyle",
  style: "cardStyle",
  layout: "layout",
  limit: "limit",
  max: "limit",
  "max-items": "limit",
  maxitems: "limit",
  loop: "loop",
  type: "type",
};
const TRUE_VALUES = new Set(["1", "true", "yes", "loop"]);
const CAROUSEL_TYPES = new Set(["home-banner", "success-stories", "showcase"]);
const HEADING_SELECTOR = "h1, h2, h3, h4, h5, h6";
const AUTO_ROTATE_MS = 6000;

const keyName = (value) => value.trim().toLowerCase().replace(/\s+/g, "-");
const text = (element) => element?.textContent.trim() || "";

function inlineScroller(element) {
  let scroller = element?.parentElement;

  while (
    scroller &&
    scroller !== document.body &&
    scroller.scrollWidth <= scroller.clientWidth
  ) {
    scroller = scroller.parentElement;
  }

  return scroller === document.body ? null : scroller;
}

export function scrollInlineIntoView(element) {
  const scroller = inlineScroller(element);
  if (!element || !scroller) return;

  const elementRect = element.getBoundingClientRect();
  const scrollerRect = scroller.getBoundingClientRect();
  const offset =
    elementRect.left -
    scrollerRect.left -
    (scrollerRect.width - elementRect.width) / 2;

  scroller.scrollTo({ left: scroller.scrollLeft + offset, behavior: "smooth" });
}

function optionFromRow(row) {
  const cells = [...row.children];
  const raw =
    cells.length === 1
      ? text(cells[0])
      : `${text(cells[0])}: ${text(cells[1])}`;
  const match = raw.match(/^([^:]+):\s*(.+)$/);
  if (!match) return null;

  const key = OPTION_KEYS[keyName(match[1])];
  return key ? [key, match[2].trim()] : null;
}

function readOptions(options) {
  const itemsPerView = Number.parseInt(options.itemsPerView, 10);
  const limit = Number.parseInt(options.limit, 10);
  const authoredType = keyName(options.type || "home-banner");
  const type = authoredType === "default" ? "home-banner" : authoredType;

  return {
    ariaLabel: options.ariaLabel || "Carousel",
    controls: keyName(options.controls || "footer"),
    itemWidth: options.itemWidth || undefined,
    itemsPerView: Number.isFinite(itemsPerView) ? itemsPerView : undefined,
    cardStyle: keyName(options.cardStyle || "") === "product" ? "product" : "video",
    layout: keyName(options.layout || "") === "grid" ? "grid" : "hero",
    limit: Number.isFinite(limit) && limit > 0 ? limit : undefined,
    loop: TRUE_VALUES.has((options.loop || "").toLowerCase()),
    type: CAROUSEL_TYPES.has(type) ? type : "home-banner",
  };
}

// Cap a list to an authored "Limit: N" (undefined = show all).
const applyLimit = (items, limit) => (limit ? items.slice(0, limit) : items);

function rowHtml(row) {
  if (row.children.length === 1) return row.firstElementChild.innerHTML;
  return [...row.children]
    .map((cell) => `<div>${cell.innerHTML}</div>`)
    .join("");
}

export function readCarousel(block) {
  const options = {};
  const rows = [];

  [...block.children].forEach((row) => {
    const option = optionFromRow(row);
    if (option) {
      const [key, value] = option;
      options[key] = value;
      return;
    }
    if (row.textContent.trim()) rows.push(row);
  });

  const parsedOptions = readOptions(options);
  if (parsedOptions.type === "success-stories") {
    return readSuccessStories(parsedOptions, rows);
  }
  if (parsedOptions.type === "showcase") {
    return readShowcase(parsedOptions, rows);
  }

  return {
    options: parsedOptions,
    slides: applyLimit(rows.map(rowHtml), parsedOptions.limit),
  };
}

// ── Showcase variant ──────────────────────────────────────────────────
// Generic "poster tile" slider: each tile = image + an overlay badge
// (duration / date / category) + an overlaid title. Reusable for videos,
// events, sessions, articles — anything visual. All styling is scoped to
// `.carousel-showcase`, so the other carousel types are never affected.

const clockIcon = () =>
  h(
    "svg",
    {
      className: "carousel-showcase-clock", width: 13, height: 13,
      viewBox: "0 0 24 24", fill: "none", stroke: "currentColor",
      strokeWidth: 2, "aria-hidden": "true",
    },
    h("circle", { cx: 12, cy: 12, r: 9 }),
    h("path", { d: "M12 7v5l3 2" }),
  );

// Tag pills: "Label" | "Label (color)" | "Label (color, outline)".
const SHOWCASE_BADGE_COLORS = ["green", "red", "yellow", "purple", "teal", "gray", "blue"];
const SHOWCASE_BADGE_KINDS = ["solid", "outline"];

function parseTag(raw) {
  const m = raw.match(/\(([^)]*)\)/);
  const opts = m ? m[1].split(/[\s,]+/).map((o) => o.trim().toLowerCase()).filter(Boolean) : [];
  return {
    label: raw.replace(/\([^)]*\)/, "").trim(),
    color: opts.find((o) => SHOWCASE_BADGE_COLORS.includes(o)) || "gray",
    kind: opts.find((o) => SHOWCASE_BADGE_KINDS.includes(o)) || "solid",
  };
}

function parseTags(str) {
  if (!str) return [];
  return str.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean)
    .map(parseTag).filter((t) => t.label);
}

function isShowcaseHeaderRow(row) {
  if (!row || row.querySelector("img")) return false;
  const meta = readMeta(row);
  return Boolean(
    row.querySelector(HEADING_SELECTOR)
      || meta.title || meta.heading || meta.intro || meta.description
      || meta.cta || meta.button,
  );
}

function readShowcaseHeader(row) {
  const meta = row ? readMeta(row) : {};
  const link = row?.querySelector("a[href]");
  const body = row && readPlainParagraphs(row);
  const ctaDefaults = { color: "brand", kind: "secondary", size: "large" };
  return {
    cta: link
      ? readButtonLink(link, ctaDefaults)
      : readButtonMeta(meta.button || meta.cta, ctaDefaults),
    intro: meta.intro || meta.description || text(body?.[0]),
    title: meta.title || meta.heading
      || text(row?.querySelector(HEADING_SELECTOR)) || "",
  };
}

function readShowcaseSlide(row) {
  const meta = readMeta(row);
  const link = row.querySelector("a[href]");
  const title = meta.title
    || text(row.querySelector("h1, h2, h3, h4, h5")) || text(link);
  // CTA can be authored as a "Button: Label | /url | kind" line OR as a plain
  // hyperlink in the card (e.g. a blue "Learn More" link in the doc).
  const ctaDefaults = { color: "brand", kind: "primary", size: "large" };
  const linkCta = link && readButtonLink(link, ctaDefaults);
  const cta = readButtonMeta(meta.button || meta.cta, ctaDefaults) || linkCta;
  return {
    image: readImage(row) || readImageMeta(meta.image),
    badge: meta.duration || meta.badge || meta.time || meta.date || meta.length,
    tags: parseTags(meta.tags || meta.category),
    title,
    desc: meta.description || meta.desc,
    speaker: meta.speaker || meta.author || meta.presenter,
    cta,
    // if the hyperlink is used as the CTA, don't also wrap the whole card in it
    href: meta.link || (linkCta ? undefined : link?.getAttribute("href")),
  };
}

function readShowcase(options, rows) {
  const headerRow = isShowcaseHeaderRow(rows[0]) ? rows[0] : null;
  const slideRows = headerRow ? rows.slice(1) : rows;
  return {
    header: readShowcaseHeader(headerRow),
    options,
    slides: applyLimit(readShowcaseSlides(slideRows), options.limit),
  };
}

function readShowcaseSlides(slideRows) {
  return slideRows.map(readShowcaseSlide).filter((s) => s.image || s.title);
}

export function renderCarousel(props, children) {
  return h(Carousel, props, children);
}

export function CarouselButtons({
  onNextClick,
  onPauseClick,
  onPreviousClick,
  paused = false,
}) {
  return h(
    Flex,
    {
      className: "carousel-buttons",
      gap: "3",
      justify: "center",
      style: { flex: "0 0 auto" },
      wrap: "nowrap",
    },
    h(CarouselControlButton, {
      direction: "previous",
      icon: ChevronLeft,
      onClick: onPreviousClick,
    }),
    onPauseClick &&
      h(IconButton, {
        icon: paused ? Play : Pause,
        label: paused ? "Resume carousel" : "Pause carousel",
        onClick: onPauseClick,
      }),
    h(CarouselControlButton, {
      direction: "next",
      icon: ChevronRight,
      onClick: onNextClick,
    }),
  );
}

function CarouselControlButton({ direction, icon, onClick }) {
  if (onClick) {
    return h(IconButton, {
      icon,
      label: direction === "previous" ? "Previous slide" : "Next slide",
      onClick,
    });
  }

  return h(CarouselContextIconButton, { direction, icon });
}

function CarouselContextIconButton({ direction, icon }) {
  const carousel = useCarouselContext();
  const isPrevious = direction === "previous";
  const disabled = isPrevious
    ? !carousel.canScrollPrevious
    : !carousel.canScrollNext;

  return h(IconButton, {
    disabled,
    icon,
    label: isPrevious ? "Previous slide" : "Next slide",
    onClick: () => {
      if (isPrevious) carousel.scrollPrevious();
      else carousel.scrollNext();
    },
  });
}

function IconButton({ disabled = false, icon, label, onClick }) {
  const Icon = icon;
  return h(
    Button,
    {
      "aria-disabled": disabled || undefined,
      "aria-label": label,
      color: "neutral",
      kind: "tertiary",
      onClick: disabled ? undefined : onClick,
      type: "button",
    },
    h(Icon, {
      "aria-hidden": "true",
      className: "carousel-control-icon",
      color: "#000000",
      height: "28px",
      variant: "line",
      width: "28px",
    }),
  );
}

function readMeta(row) {
  const meta = {};
  [...row.querySelectorAll("p, li")].forEach((item) => {
    const match = text(item).match(/^([^:]+):\s*(.+)$/);
    if (match) meta[keyName(match[1])] = match[2].trim();
  });
  return meta;
}

function readPlainParagraphs(row) {
  return [...row.querySelectorAll("p")].filter((p) => {
    const value = text(p);
    return value && !p.querySelector("a[href]") && !value.match(/^([^:]+):\s*(.+)$/);
  });
}

function readImage(row) {
  const img = row.querySelector("img");
  return img && {
    alt: img.alt || "",
    src: img.currentSrc || img.src,
  };
}

function readImageMeta(value = "") {
  const [src, alt = ""] = value.split("|").map((part) => part.trim());
  return src ? { alt, src } : null;
}

function readSuccessHeader(row) {
  const meta = row ? readMeta(row) : {};
  const link = row?.querySelector("a[href]");
  const body = row && readPlainParagraphs(row);
  const ctaDefaults = {
    color: "brand",
    kind: "secondary",
    size: "large",
  };

  return {
    cta: link ? readButtonLink(link, ctaDefaults) : readButtonMeta(meta.cta, ctaDefaults),
    intro: meta.intro || meta.description || text(body?.[0]),
    title: meta.title || meta.heading || text(row?.querySelector(HEADING_SELECTOR)) || "Success Stories",
  };
}

function readSuccessSlide(row) {
  const meta = readMeta(row);
  const link = row.querySelector("a[href]");
  const body = readPlainParagraphs(row);
  const title = meta.title || text(row.querySelector("h1, h2, h3, h4, h5"));
  const ctaDefaults = {
    color: "brand",
    kind: "tertiary",
    size: "large",
  };

  return {
    cta: link ? readButtonLink(link, ctaDefaults) : readButtonMeta(meta.cta, ctaDefaults),
    description: meta.description || text(body[0]),
    image: readImage(row) || readImageMeta(meta.image),
    logo: meta.logo || meta.brand,
    logoImage: meta["logo-image"] || meta.logoimage || meta["logo-url"],
    tag: meta.tag || meta.category || text(row.querySelector("h6")),
    title: title || text(link),
  };
}

function isSuccessHeaderRow(row) {
  if (!row || row.querySelector("img")) return false;

  const meta = readMeta(row);
  return Boolean(
    row.querySelector(HEADING_SELECTOR) ||
      meta.title ||
      meta.heading ||
      meta.intro ||
      meta.description ||
      meta.cta,
  );
}

function readSuccessStories(options, rows) {
  const headerRow = isSuccessHeaderRow(rows[0]) ? rows[0] : null;
  const slideRows = headerRow ? rows.slice(1) : rows;

  return {
    header: readSuccessHeader(headerRow),
    options,
    slides: slideRows.map(readSuccessSlide).filter((slide) => slide.title || slide.image),
  };
}

function SuccessStorySlide({ id, slide }) {
  return h(
    "article",
    { className: "carousel-success-slide", id, role: "tabpanel" },
    slide.image &&
      h("img", {
        alt: slide.image.alt,
        className: "carousel-success-image",
        loading: "lazy",
        src: slide.image.src,
      }),
    h(
      Flex,
      {
        className: "carousel-success-content",
        direction: "col",
        gap: "5",
      },
      slide.tag && h("span", { className: "carousel-success-tag" }, slide.tag),
      slide.title &&
        h(
          Text,
          { asChild: true, kind: "display/xs" },
          h("h3", null, slide.title),
        ),
      slide.description &&
        h(
          Text,
          { asChild: true, kind: "body/regular/xl" },
          h("p", null, slide.description),
        ),
      slide.cta && h("div", null, renderButton(slide.cta)),
    ),
  );
}

function SuccessStoryRail({ active, onSelect, progress, slides }) {
  const railRef = React.useRef(null);

  React.useEffect(() => {
    scrollInlineIntoView(
      railRef.current?.querySelector('[aria-selected="true"]'),
    );
  }, [active]);

  return h(
    "div",
    {
      "aria-label": "Success story slides",
      className: "carousel-success-rail",
      onFocusCapture: (event) =>
        scrollInlineIntoView(event.target.closest?.(".carousel-success-tab")),
      ref: railRef,
      role: "tablist",
    },
    slides.map((slide, index) => {
      const label = slide.logo || slide.title;

      return h(
        "button",
        {
          "aria-controls": `carousel-success-slide-${index}`,
          "aria-label": `Show ${label} story`,
          "aria-selected": index === active,
          className: "carousel-success-tab",
          key: index,
          onClick: () => onSelect(index),
          role: "tab",
          type: "button",
        },
        h(
          "span",
          { className: "carousel-success-logo" },
          slide.logoImage
            ? h("img", {
                alt: "",
                loading: "lazy",
                src: slide.logoImage,
              })
            : label,
        ),
        h(ProgressBar, {
          "aria-label": `${label} progress`,
          className: "carousel-success-progress",
          size: "small",
          value: index === active ? progress : 0,
        }),
      );
    }),
  );
}

function SuccessStoriesCarousel({ header, options, slides }) {
  const [active, setActive] = React.useState(0);
  const [progress, setProgress] = React.useState(0);
  const rootRef = React.useRef(null);
  const progressRef = React.useRef(0);
  const [isVisible, setIsVisible] = React.useState(false);
  const resetProgress = () => {
    progressRef.current = 0;
    setProgress(0);
  };
  const select = (index) => {
    resetProgress();
    setActive((index + slides.length) % slides.length);
  };
  const go = (step) => select(active + step);

  React.useEffect(() => {
    const element = rootRef.current;
    if (!element || !("IntersectionObserver" in window)) {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.25 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!isVisible || slides.length <= 1) return undefined;

    let frame;
    const startedAt =
      window.performance.now() - (progressRef.current / 100) * AUTO_ROTATE_MS;
    const update = () => {
      const nextProgress = Math.min(
        ((window.performance.now() - startedAt) / AUTO_ROTATE_MS) * 100,
        100,
      );

      progressRef.current = nextProgress;
      setProgress(nextProgress);

      if (nextProgress >= 100) {
        resetProgress();
        setActive((index) => (index + 1) % slides.length);
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frame);
  }, [active, isVisible, slides.length]);

  const slotHeader = h(
    Flex,
    {
      align: "center",
      className: "carousel-success-header",
      gap: "6",
      justify: "between",
      wrap: "wrap",
    },
    h(
      Flex,
      { direction: "col", gap: "4" },
      h(
        Text,
        { asChild: true, kind: "display/sm" },
        h("h2", null, header.title),
      ),
      header.intro &&
        h(
          Text,
          { asChild: true, kind: "body/regular/xl" },
          h("p", null, header.intro),
        ),
    ),
    header.cta && renderButton(header.cta),
  );

  return h(
    Flex,
    { className: "carousel-success", direction: "col", gap: "8", ref: rootRef },
    renderCarousel(
      {
        "aria-label": options.ariaLabel,
        itemsPerView: 1,
        slotHeader,
        style: { "--nv-carousel-item-gap": "0px" },
      },
      h(SuccessStorySlide, {
        id: `carousel-success-slide-${active}`,
        key: active,
        slide: slides[active],
      }),
    ),
    h(
      Flex,
      {
        align: "end",
        className: "carousel-success-nav",
        gap: "6",
        justify: "between",
        wrap: "wrap",
      },
      h(SuccessStoryRail, {
        active,
        onSelect: select,
        progress,
        slides,
      }),
      options.controls !== "none" &&
        h(CarouselButtons, {
          onNextClick: () => go(1),
          onPreviousClick: () => go(-1),
        }),
    ),
  );
}

function ShowcaseProductTile({ slide }) {
  // dark card: centered title + description + CTA button, product image bleeding
  // off the bottom (NVIDIA "Featured Products" style)
  const body = h(
    "div",
    { className: "carousel-showcase-product-body" },
    slide.title && h(Text, { asChild: true, kind: "title/lg" },
      h("h3", { className: "carousel-showcase-product-title" }, slide.title)),
    slide.desc && h(Text, { asChild: true, kind: "body/regular/md" },
      h("p", { className: "carousel-showcase-product-desc" }, slide.desc)),
    slide.cta && h("div", { className: "carousel-showcase-product-cta" }, renderButton(slide.cta)),
  );
  const media = slide.image && h(
    "div",
    { className: "carousel-showcase-product-media" },
    h("img", {
      className: "carousel-showcase-product-img",
      src: slide.image.src, alt: slide.image.alt, loading: "lazy",
    }),
  );
  const card = h("div", { className: "carousel-showcase-card carousel-showcase-product" }, body, media);
  return h(
    "article",
    { className: "carousel-showcase-slide" },
    slide.href
      ? h("a", { className: "carousel-showcase-link", href: slide.href }, card)
      : card,
  );
}

function ShowcaseTile({ slide, cardStyle }) {
  if (cardStyle === "product") return h(ShowcaseProductTile, { slide });
  // media (top): image + duration badge overlaid top-left
  const media = h(
    "div",
    { className: "carousel-showcase-media" },
    slide.image
      && h("img", {
        alt: slide.image.alt,
        className: "carousel-showcase-image",
        loading: "lazy",
        src: slide.image.src,
      }),
    slide.badge
      && h("span", { className: "carousel-showcase-badge" },
        clockIcon(), slide.badge),
  );

  // body (below, white): tags -> title -> description -> speaker
  const body = h(
    "div",
    { className: "carousel-showcase-body" },
    slide.tags.length > 0
      && h("div", { className: "carousel-showcase-tags" },
        slide.tags.map((t, i) => h(Badge, { color: t.color, kind: t.kind, key: i }, t.label))),
    slide.title
      && h(Text, { asChild: true, kind: "title/lg" },
        h("h3", { className: "carousel-showcase-title" }, slide.title)),
    slide.desc
      && h(Text, { asChild: true, kind: "body/regular/md" },
        h("p", { className: "carousel-showcase-desc" }, slide.desc)),
    slide.speaker
      && h("p", { className: "carousel-showcase-speaker" }, slide.speaker),
  );

  const card = h("div", { className: "carousel-showcase-card" }, media, body);

  return h(
    "article",
    { className: "carousel-showcase-slide" },
    slide.href
      ? h("a", { className: "carousel-showcase-link", href: slide.href }, card)
      : card,
  );
}

// Big circular side arrows + custom round dots. Fully custom (no KUI controls),
// so there's no "Page X of Y" text and we control the dot shape/placement.
// Reads scroll state from the carousel context (firstVisibleIndex / itemCount).
// Side arrows + round dots, driven by OUR OWN scroll tracking (not KUI's), so
// the active card is the one nearest the track centre, arrows disable at the
// true first/last card, and clicking never falls through to the card link.
function ShowcaseControls({ centerMode, perView }) {
  const ref = React.useRef(null);            // ref on the prev button, to find the DOM
  const [state, setState] = React.useState({ active: 0, count: 0, atStart: true, atEnd: false });

  const els = () => {
    const scope = ref.current && ref.current.closest(".carousel-showcase");
    const track = scope && scope.querySelector(".nv-carousel-items");
    // The element that actually scrolls horizontally may be the track OR an
    // ancestor — find it by measurement so this works for every layout.
    let scroller = track;
    while (scroller && scroller !== document.body
      && scroller.scrollWidth <= scroller.clientWidth + 1) {
      scroller = scroller.parentElement;
    }
    if (!scroller || scroller === document.body) scroller = track;
    // arrows center on the top image (video card) or the whole card (product)
    const media = scope && (scope.querySelector(".carousel-showcase-media")
      || scope.querySelector(".carousel-showcase-card"));
    const items = track ? [...track.querySelectorAll(".nv-carousel-item")] : [];
    return { scope, track, scroller, media, items };
  };

  React.useLayoutEffect(() => {
    const { scope, track, scroller, media } = els();
    if (!scope || !track || !scroller) return undefined;
    const compute = () => {
      const items = [...track.querySelectorAll(".nv-carousel-item")];
      if (!items.length) return;
      const sLeft = scroller.getBoundingClientRect().left;
      const mid = sLeft + scroller.clientWidth / 2;
      let active = 0;      // nearest to centre (hero highlight)
      let best = Infinity;
      let activeLeft = 0;  // nearest to the left edge (multi-up highlight)
      let bestL = Infinity;
      items.forEach((el, i) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - mid);
        if (d < best) { best = d; active = i; }
        const dl = Math.abs(r.left - sLeft);
        if (dl < bestL) { bestL = dl; activeLeft = i; }
      });
      const cardStep = items.length > 1
        ? items[1].getBoundingClientRect().left - items[0].getBoundingClientRect().left
        : items[0].getBoundingClientRect().width;
      // page = the authored Items Per View (fallback to a measured estimate)
      const perPage = perView || Math.max(1, Math.round(scroller.clientWidth / cardStep));
      const pages = Math.max(1, Math.ceil(items.length / perPage));
      const page = Math.min(pages - 1, Math.round(scroller.scrollLeft / (perPage * cardStep)));
      const atStart = scroller.scrollLeft <= 2;
      const atEnd = scroller.scrollLeft >= scroller.scrollWidth - scroller.clientWidth - 2;
      setState({ active, activeLeft, count: items.length, atStart, atEnd, page, pages, perPage });
    };
    const place = () => {
      if (!media) return;
      const top = media.getBoundingClientRect().top
        - scope.getBoundingClientRect().top + media.offsetHeight / 2;
      scope.style.setProperty("--showcase-arrow-top", `${Math.round(top)}px`);
    };
    compute();
    place();
    let raf;
    const onScroll = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(compute); };
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => { compute(); place(); });
    ro.observe(track);
    if (media) ro.observe(media);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  const go = (i) => {
    const { scroller, items } = els();
    if (!scroller || !items.length) return;
    const el = items[Math.max(0, Math.min(items.length - 1, i))];
    if (!el) return;
    const sRect = scroller.getBoundingClientRect();
    const eRect = el.getBoundingClientRect();
    // hero: center the card; multi-up (product/grid): align it to the left
    const delta = centerMode
      ? (eRect.left + eRect.width / 2) - (sRect.left + sRect.width / 2)
      : eRect.left - sRect.left;
    scroller.scrollBy({ left: delta, behavior: "smooth" });
  };

  // Arrow step: hero moves one card centred; multi-up moves a full page
  // (Items Per View cards) aligned to the left — so two-up moves two at a time.
  const step = (dir) => {
    if (centerMode) { go(state.active + dir); return; }
    go(state.activeLeft + dir * (perView || 1));
  };

  const { active, activeLeft, count, atStart, atEnd } = state;
  const prevDisabled = centerMode ? active <= 0 : atStart;
  const nextDisabled = centerMode ? (count === 0 || active >= count - 1) : atEnd;

  const arrow = (dir, Icon, disabled, onClick, r) =>
    h("button", {
      ref: r,
      className: `carousel-showcase-arrow carousel-showcase-arrow--${dir}`,
      type: "button",
      "aria-label": dir === "prev" ? "Previous" : "Next",
      disabled,
      onClick,
    }, h(Icon, { width: 22, height: 22, "aria-hidden": "true" }));

  // One dot per CARD (so all cards are represented); active follows the
  // centred card (hero) or the left-most visible card (multi-up).
  const dotActive = centerMode ? active : activeLeft;
  const dots = count > 1 && h(
    "div",
    { className: "carousel-showcase-dots" },
    Array.from({ length: count }, (unused, i) => h("button", {
      key: i,
      type: "button",
      className: `carousel-showcase-dot${i === dotActive ? " is-active" : ""}`,
      "aria-label": `Go to slide ${i + 1}`,
      onClick: () => go(i),
    })),
  );

  return h(
    React.Fragment,
    null,
    arrow("prev", ChevronLeft, prevDisabled, () => step(-1), ref),
    arrow("next", ChevronRight, nextDisabled, () => step(1)),
    dots,
  );
}

function ShowcaseCarousel({ header, options, slides }) {
  const slotHeader = (header.title || header.intro || header.cta) && h(
    Flex,
    {
      align: "start", className: "carousel-showcase-header",
      gap: "6", justify: "between", wrap: "wrap",
    },
    h(
      Flex,
      { direction: "col", gap: "4", className: "carousel-showcase-heading" },
      header.title && h(Text, { asChild: true, kind: "display/sm" },
        h("h2", null, header.title)),
      header.intro && h(Text, { asChild: true, kind: "body/regular/lg" },
        h("p", null, header.intro)),
    ),
    header.cta && renderButton(header.cta),
  );

  // product = "Featured Products" style: 2-up scrolling portrait cards (never
  // the 1-up hero). Otherwise hero (1 big + peeks) or grid (3-up).
  const product = options.cardStyle === "product";
  const hero = !product && options.layout === "hero";
  const layoutClass = product ? "product" : options.layout;
  const perView = options.itemsPerView || (product ? 2 : 3);

  // Footer: side arrows (positioned by CSS) + centered custom round dots.
  // centerMode = hero (1 card centered); multi-up (grid/product) pages sideways.
  const slotFooter = options.controls === "none"
    ? undefined
    : h(ShowcaseControls, { centerMode: hero, perView: hero ? 1 : perView });

  return h(
    "div",
    { className: `carousel-showcase carousel-showcase--${layoutClass}` },
    renderCarousel(
      {
        "aria-label": options.ariaLabel,
        // hero uses itemWidth (1 big card + peeks); grid/product use itemsPerView
        itemWidth: hero ? (options.itemWidth || "68%") : options.itemWidth,
        itemsPerView: hero ? undefined : perView,
        // No looping: so arrows disable at the ends and "prev" on the first
        // card doesn't wrap around to the last.
        loop: false,
        slotHeader,
        slotFooter,
        style: { "--nv-carousel-item-gap": "24px" },
      },
      slides.map((slide, index) =>
        h(ShowcaseTile, { key: index, slide, cardStyle: options.cardStyle })),
    ),
  );
}

function CarouselBlock({ header, options, slides }) {
  if (!slides.length) return null;

  if (options.type === "success-stories") {
    return h(SuccessStoriesCarousel, { header, options, slides });
  }

  if (options.type === "showcase") {
    return h(ShowcaseCarousel, { header, options, slides });
  }

  const slotFooter =
    options.controls === "none"
      ? undefined
      : h(
          Flex,
          { justify: "center" },
          h(CarouselButtons),
        );

  return renderCarousel(
    {
      "aria-label": options.ariaLabel,
      itemWidth: options.itemWidth,
      itemsPerView: options.itemsPerView,
      loop: options.loop,
      slotFooter,
    },
    slides.map((slide, index) =>
      h("div", {
        "aria-label": `Slide ${index + 1} of ${slides.length}`,
        dangerouslySetInnerHTML: { __html: slide },
        key: index,
        role: "group",
      }),
    ),
  );
}

export default function decorate(block) {
  const data = readCarousel(block);

  block.textContent = "";
  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(h(CarouselBlock, data));
  });
}
