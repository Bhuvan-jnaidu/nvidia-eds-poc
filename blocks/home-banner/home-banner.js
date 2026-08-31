import {
  Flex,
  Hero,
  ProgressBar,
  React,
  SegmentedControl,
  createRoot,
  flushSync,
  useCarouselContext,
} from "@kui/foundations-react";
import { toClassName } from "../../scripts/aem.js";
import { readButtonLink, readButtonMeta, renderButton } from "../button/button.js";
import {
  CarouselButtons,
  renderCarousel,
  scrollInlineIntoView,
} from "../carousel/carousel.js";
import { renderText } from "../text/text.js";

const h = React.createElement;
const { useEffect, useMemo, useRef, useState } = React;

const AUTO_ROTATE_MS = 6000;
const SEGMENT_BREAKPOINTS = {
  mobile: 600,
  tablet: 960,
};
const HEADINGS = "h1, h2, h3, h4, h5, h6";
const LINK_PARAGRAPH = "a[href]";
const TEXT_ALIGNS = ["default", "left", "center", "right"];
const MEDIA_THEMES = ["dark", "light"];
const SOURCE_PROPS = { class: "className", srcset: "srcSet" };
const ALIGN_CLASSES = {
  center: "text-center",
  left: "text-left",
  right: "text-right",
};

const HERO_ATTRIBUTES = {
  HeroMedia: { className: "home-banner-hero-media" },
};

const choose = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;
const option = (value = "") => value.trim().toLowerCase().replace(/\s+/g, "-");
const scrollFocusedItem = (event, selector) =>
  scrollInlineIntoView(event.target.closest?.(selector));
function segmentSize() {
  if (window.innerWidth <= SEGMENT_BREAKPOINTS.mobile) return "tiny";
  if (window.innerWidth <= SEGMENT_BREAKPOINTS.tablet) return "small";
  return "large";
}

function nodeText(node) {
  if (node.nodeName === "BR") return "\n";
  if (node.nodeType === 3) return node.textContent || "";
  return [...node.childNodes].map(nodeText).join("");
}

const text = (element) =>
  (element ? nodeText(element) || element.textContent || "" : "").trim();
const textLines = (element) =>
  text(element)
    .split(/\n+/)
    .map((value) => value.trim())
    .filter(Boolean);

function elementProps(element) {
  return [...element.attributes].reduce((props, { name, value }) => {
    props[SOURCE_PROPS[name] || name] = value;
    return props;
  }, {});
}

function metaKey(value) {
  return option(value.match(/^([^:]+)\s*:/)?.[1] || "");
}

function readText(row, selector = "p", skipLinks = true) {
  return [...row.querySelectorAll(selector)].reduce(
    (data, element) => {
      const hasLink = skipLinks && element.querySelector(LINK_PARAGRAPH);

      textLines(element).forEach((value) => {
        const key = metaKey(value);

        if (key) data.meta[key] = value.replace(/^([^:]+)\s*:/, "").trim();
        else if (!hasLink) data.body.push(value);
      });

      return data;
    },
    { body: [], meta: {} },
  );
}

function readCategories(row) {
  const { meta } = readText(row, "p, li", false);
  const selected = meta.selected?.toLowerCase();
  const items = [...row.querySelectorAll("p, li")]
    .flatMap((element, index) =>
      textLines(element).map((label, lineIndex) => {
        if (metaKey(label)) return null;

        return {
          label,
          selected: selected
            ? label.toLowerCase() === selected
            : !!element.querySelector("strong, b"),
          value: toClassName(label) || `category-${index}-${lineIndex}`,
        };
      }),
    )
    .filter(Boolean);

  if (items.length > 1) return items;

  return text(row)
    .split(/\n|,/)
    .map((label) => label.trim())
    .filter((label) => label && !metaKey(label))
    .map((label, index) => ({
      label,
      selected: selected && label.toLowerCase() === selected,
      value: toClassName(label) || `category-${index}`,
    }));
}

function isCategoryRow(row) {
  return (
    readCategories(row).length > 1 &&
    !row.querySelector(`${HEADINGS}, ${LINK_PARAGRAPH}, img, picture`)
  );
}

function linkCta(row, metaCta) {
  const link = row.querySelector(LINK_PARAGRAPH);
  if (link) return readButtonLink(link, { size: "large" });

  return readButtonMeta(metaCta, { size: "large" });
}

function imageFromElement(img, key) {
  return h("img", {
    ...elementProps(img),
    alt: img.alt || "",
    key,
    loading: img.loading || "lazy",
  });
}

function pictureFromElement(picture) {
  return h(
    "picture",
    elementProps(picture),
    [...picture.children].map((child, key) => {
      if (child.tagName === "SOURCE")
        return h("source", { ...elementProps(child), key });
      if (child.tagName === "IMG") return imageFromElement(child, key);
      return null;
    }),
  );
}

function imageMeta(value = "") {
  const [src, alt = ""] = value.split("|").map((part) => part.trim());
  return { alt, src };
}

function imageFromMetadata(meta) {
  const images = {
    default: imageMeta(meta.image),
    desktop: imageMeta(meta["image-desktop"]),
    mobile: imageMeta(meta["image-mobile"]),
    tablet: imageMeta(meta["image-tablet"]),
  };
  const fallback = [
    images.desktop,
    images.default,
    images.tablet,
    images.mobile,
  ].find((image) => image.src);

  if (!fallback) return null;

  const hasSources =
    images.mobile.src || images.tablet.src || images.desktop.src;
  const alt =
    fallback.alt ||
    images.default.alt ||
    images.tablet.alt ||
    images.mobile.alt ||
    "";

  if (!hasSources) {
    return h("img", { alt, loading: "lazy", src: fallback.src });
  }

  return h(
    "picture",
    null,
    images.mobile.src &&
      h("source", {
        key: "mobile",
        media: "(max-width: 600px)",
        srcSet: images.mobile.src,
      }),
    images.tablet.src &&
      h("source", {
        key: "tablet",
        media: "(max-width: 960px)",
        srcSet: images.tablet.src,
      }),
    h("img", {
      alt,
      key: "fallback",
      loading: "lazy",
      src: fallback.src,
    }),
  );
}

function readMedia(row, meta) {
  const picture = row.querySelector("picture");
  if (picture) return pictureFromElement(picture);

  const img = row.querySelector("img");
  if (img) return imageFromElement(img);

  return imageFromMetadata(meta);
}

function readSlide(row, index) {
  const heading = text(row.querySelector(HEADINGS));
  const { body, meta } = readText(row);
  const authoredEyebrow = meta.eyebrow || meta.subheading;
  let eyebrowIndex = -1;

  if (!authoredEyebrow) {
    eyebrowIndex = body.findIndex((value) => value.includes("|"));
    if (heading && eyebrowIndex < 0 && body.length > 1) eyebrowIndex = 0;
  }

  const eyebrow = authoredEyebrow || body[eyebrowIndex] || "";
  const copy = body.filter((_, bodyIndex) => bodyIndex !== eyebrowIndex);
  const category =
    row.dataset.category ||
    row.querySelector("[data-category]")?.dataset.category ||
    meta.category ||
    eyebrow.split("|")[0]?.trim() ||
    "";
  const textAlign =
    row.dataset.textAlign ||
    row.querySelector("[data-text-align]")?.dataset.textAlign ||
    meta["text-align"] ||
    "default";
  const mediaTheme =
    row.dataset.mediaTheme ||
    row.querySelector("[data-media-theme]")?.dataset.mediaTheme ||
    meta["media-theme"] ||
    meta.theme ||
    "dark";

  return {
    categoryLabel: category,
    categoryValue: toClassName(category),
    cta: linkCta(row, meta.cta),
    description: meta.description || copy[heading || meta.title ? 0 : 1] || "",
    eyebrow,
    media: readMedia(row, meta),
    mediaTheme: choose(option(mediaTheme), MEDIA_THEMES, "dark"),
    textAlign: choose(option(textAlign), TEXT_ALIGNS, "default"),
    title: meta.title || heading || copy[0] || `Slide ${index + 1}`,
    value: `slide-${index}`,
  };
}

function slideMatchesCategory(slide, category) {
  if (!slide || !category) return false;
  if (slide.categoryValue === category.value) return true;

  const slideCategory = slide.categoryLabel.toLowerCase();
  const categoryLabel = category.label.toLowerCase();
  return (
    !!slideCategory &&
    (slideCategory.includes(categoryLabel) ||
      categoryLabel.includes(slideCategory))
  );
}

function slidesForCategory(categoryValue, categories, slides) {
  const category = categories.find((item) => item.value === categoryValue);
  const matches = slides.filter((slide) =>
    slideMatchesCategory(slide, category),
  );
  return matches.length ? matches : slides;
}

function readHomeBanner(block) {
  const rows = [...block.children];
  const categoryRow = rows[0] && isCategoryRow(rows[0]) ? rows.shift() : null;
  const categories = categoryRow ? readCategories(categoryRow) : [];

  return {
    activeCategory:
      categories.find((category) => category.selected)?.value ||
      categories[0]?.value,
    categories,
    slides: rows.map(readSlide).filter((slide) => slide.title || slide.media),
  };
}

function CarouselSync({ activeIndex }) {
  const { hydrated, scrollToPage } = useCarouselContext();

  useEffect(() => {
    if (hydrated) scrollToPage(activeIndex);
  }, [activeIndex, hydrated, scrollToPage]);

  return null;
}

function StoryRail({ activeIndex, onSelect, progress, slides }) {
  const railRef = useRef(null);

  useEffect(() => {
    scrollInlineIntoView(railRef.current?.querySelector('[aria-current="true"]'));
  }, [activeIndex]);

  return h(
    Flex,
    {
      "aria-label": "Home banner story navigation",
      className: "home-banner-story-rail",
      gap: "7",
      onFocusCapture: (event) => scrollFocusedItem(event, ".home-banner-story"),
      ref: railRef,
      role: "group",
      wrap: "nowrap",
    },
    slides.map((slide, index) =>
      h(
        "button",
        {
          "aria-label": `Show story: ${slide.title}`,
          "aria-current": activeIndex === index ? "true" : undefined,
          "aria-pressed": activeIndex === index,
          className: "home-banner-story",
          key: slide.value,
          onClick: () => onSelect(index),
          type: "button",
        },
        h(ProgressBar, {
          "aria-hidden": "true",
          className: "home-banner-story-progress",
          size: "small",
          value: activeIndex === index ? progress : 0,
        }),
        renderText(slide.title, {
          kind: activeIndex === index ? "body/bold/md" : "body/regular/md",
          tag: "span",
        }),
      ),
    ),
  );
}

function HomeBanner({ activeCategory, categories, slides }) {
  const [category, setCategory] = useState(activeCategory);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlSize, setControlSize] = useState(segmentSize);
  const progressRef = useRef(0);
  const segmentsRef = useRef(null);
  const activeSlides = useMemo(
    () => slidesForCategory(category, categories, slides),
    [categories, category, slides],
  );
  const segmentItems = useMemo(
    () =>
      categories.map((item) => ({
        children: item.label,
        value: item.value,
      })),
    [categories],
  );

  useEffect(() => {
    const onResize = () => setControlSize(segmentSize());

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (paused || activeSlides.length <= 1) return undefined;

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
        progressRef.current = 0;
        setProgress(0);
        setActiveIndex((index) => (index + 1) % activeSlides.length);
        return;
      }

      frame = window.requestAnimationFrame(update);
    };

    frame = window.requestAnimationFrame(update);

    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, activeSlides.length, category, paused]);

  useEffect(() => {
    const activeTab = segmentsRef.current
      ?.querySelector(".nv-segmented-control-input:checked")
      ?.closest(".nv-segmented-control-item");

    scrollInlineIntoView(activeTab);
  }, [category]);

  if (!activeSlides.length) return null;

  const resetProgress = () => {
    progressRef.current = 0;
    setProgress(0);
  };
  const selectSlide = (index) => {
    resetProgress();
    setActiveIndex((index + activeSlides.length) % activeSlides.length);
  };
  const selectCategory = (value) => {
    resetProgress();
    setCategory(value);
    setActiveIndex(0);
  };

  return h(
    Flex,
    {
      className: "nv-theme-kui11",
      direction: "col",
      gap: "5",
    },
    !!segmentItems.length &&
      h(
        "div",
        {
          "aria-label": "Home banner categories",
          className: "home-banner-segments-scroll",
          onFocusCapture: (event) =>
            scrollFocusedItem(event, ".nv-segmented-control-item"),
          ref: segmentsRef,
          role: "region",
          tabIndex: 0,
        },
        h(SegmentedControl, {
          "aria-label": "Choose home banner category",
          className: "home-banner-segments",
          items: segmentItems,
          name: "home-banner-category",
          onValueChange: selectCategory,
          size: controlSize,
          value: category,
        }),
      ),
    renderCarousel(
      {
        "aria-label": "Home banner slides",
        itemsPerView: 1,
        loop: true,
        onPageChange: (page) => {
          if (page !== activeIndex) selectSlide(page);
        },
        slotFooter: h(
          React.Fragment,
          null,
          h(CarouselSync, { activeIndex }),
          h(
            Flex,
            {
              align: "start",
              className: "home-banner-footer",
              gap: "7",
              wrap: "wrap",
            },
            h(StoryRail, {
              activeIndex,
              onSelect: selectSlide,
              progress,
              slides: activeSlides,
            }),
            h(CarouselButtons, {
              onPauseClick: () => setPaused(!paused),
              paused,
            }),
          ),
        ),
        style: { "--nv-carousel-item-gap": "0px" },
      },
      activeSlides.map((item) =>
        h(Hero, {
          attributes: HERO_ATTRIBUTES,
          className: `home-banner-hero${ALIGN_CLASSES[item.textAlign] ? ` ${ALIGN_CLASSES[item.textAlign]}` : ""}`,
          key: item.value,
          mediaTheme: item.mediaTheme,
          slotActions: item.cta && renderButton(item.cta),
          slotBody: item.description,
          slotHeading: item.title,
          slotMedia: item.media,
          slotSubheading: item.eyebrow,
        }),
      ),
    ),
  );
}

export default function decorate(block) {
  block.classList.add("nv-theme-kui11");
  flushSync(() =>
    createRoot(block).render(h(HomeBanner, readHomeBanner(block))),
  );
}
