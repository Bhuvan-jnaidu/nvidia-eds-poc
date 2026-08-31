import {
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
  loop: "loop",
  type: "type",
};
const TRUE_VALUES = new Set(["1", "true", "yes", "loop"]);
const CAROUSEL_TYPES = new Set(["home-banner", "success-stories"]);
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
  const authoredType = keyName(options.type || "home-banner");
  const type = authoredType === "default" ? "home-banner" : authoredType;

  return {
    ariaLabel: options.ariaLabel || "Carousel",
    controls: keyName(options.controls || "footer"),
    itemWidth: options.itemWidth || undefined,
    itemsPerView: Number.isFinite(itemsPerView) ? itemsPerView : undefined,
    loop: TRUE_VALUES.has((options.loop || "").toLowerCase()),
    type: CAROUSEL_TYPES.has(type) ? type : "home-banner",
  };
}

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

  return { options: parsedOptions, slides: rows.map(rowHtml) };
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

function CarouselBlock({ header, options, slides }) {
  if (!slides.length) return null;

  if (options.type === "success-stories") {
    return h(SuccessStoriesCarousel, { header, options, slides });
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
