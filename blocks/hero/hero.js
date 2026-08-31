import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Button, Hero } from "@kui/foundations-react";

const h = React.createElement;

const BUTTON_COLORS = ["brand", "neutral", "danger"];
const BUTTON_KINDS = ["primary", "secondary", "tertiary"];
const BUTTON_SIZES = ["tiny", "small", "medium", "large"];
const HERO_MEDIA_THEMES = ["dark", "light"];

const ATTRIBUTE_ALIASES = {
  class: "className",
  srcset: "srcSet",
};

function dataOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

function reactProps(element) {
  return [...element.attributes].reduce((props, { name, value }) => {
    props[ATTRIBUTE_ALIASES[name] || name] = value;
    return props;
  }, {});
}

function buttonKind(link) {
  const authoredKind = dataOption(link.dataset.buttonKind, BUTTON_KINDS);
  if (authoredKind) return authoredKind;
  if (link.classList.contains("secondary")) return "secondary";
  if (link.classList.contains("accent")) return "tertiary";
  return "primary";
}

function buttonColor(link) {
  return dataOption(link.dataset.buttonColor, BUTTON_COLORS, "brand");
}

function buttonSize(link) {
  return dataOption(link.dataset.buttonSize, BUTTON_SIZES, "medium");
}

function mediaTheme(block) {
  const themeElement = block.querySelector("[data-hero-media-theme]");
  return dataOption(
    block.dataset.heroMediaTheme || themeElement?.dataset.heroMediaTheme,
    HERO_MEDIA_THEMES,
    "dark",
  );
}

function imageElement(img, key) {
  const props = reactProps(img);
  props.alt = props.alt || "";
  props.loading = props.loading || "eager";
  if (key !== undefined) props.key = key;
  return h("img", props);
}

function heroMedia(block) {
  const picture = block.querySelector("picture");
  if (picture) {
    return h(
      "picture",
      reactProps(picture),
      [...picture.children].map((child, index) => {
        if (child.tagName === "SOURCE") {
          return h("source", { ...reactProps(child), key: index });
        }
        if (child.tagName === "IMG") return imageElement(child, index);
        return null;
      }),
    );
  }

  const img = block.querySelector("img");
  return img && imageElement(img);
}

function readHero(block) {
  const heading = block.querySelector("h1, h2, h3, h4, h5, h6");
  const links = [...block.querySelectorAll("a[href]")];
  const paragraphs = [...block.querySelectorAll("p")]
    .filter((paragraph) => !paragraph.querySelector("a[href]"));

  return {
    actions: links.map((link) => ({
      color: buttonColor(link),
      href: link.href,
      kind: buttonKind(link),
      rel: link.rel || undefined,
      size: buttonSize(link),
      target: link.target || undefined,
      text: link.textContent.trim(),
    })),
    body: paragraphs.map((paragraph) => paragraph.textContent.trim()).filter(Boolean).join(" "),
    heading: heading?.textContent.trim() || "",
    media: heroMedia(block),
    mediaTheme: mediaTheme(block),
  };
}

function HeroActions({ actions }) {
  if (!actions.length) return null;

  return actions.map((action) =>
    h(
      Button,
      {
        asChild: true,
        color: action.color,
        key: action.href,
        kind: action.kind,
        size: action.size,
      },
      h("a", { href: action.href, rel: action.rel, target: action.target }, action.text),
    ),
  );
}

function HeroView({ actions, body, heading, media, mediaTheme: theme }) {
  return h(Hero, {
    mediaTheme: theme,
    slotActions: h(HeroActions, { actions }),
    slotBody: body,
    slotHeading: heading,
    slotMedia: media,
  });
}

export default function decorate(block) {
  const hero = readHero(block);

  block.closest(".section")?.classList.add("hero-section");
  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(h(HeroView, hero));
  });
}
