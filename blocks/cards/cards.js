import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Badge, Card, Flex, Grid } from "@kui/foundations-react";
import { readButtonLink, renderButton } from "../button/button.js";
import { renderText } from "../text/text.js";

const h = React.createElement;
const { useEffect, useState } = React;

const CARD_DENSITIES = ["compact", "standard", "spacious"];
const CARD_KINDS = ["solid", "float", "gradient"];
const CARD_LAYOUTS = ["horizontal", "vertical"];
const CARD_MEDIA_THEMES = ["dark", "light"];
const CARD_MEDIA_POSITIONS = ["start", "end"];
const MOBILE_CARD_QUERY = "(max-width: 899px)";
const CARD_TOKENS = new Set([
  ...CARD_KINDS,
  ...CARD_LAYOUTS,
  ...CARD_DENSITIES,
  ...CARD_MEDIA_POSITIONS,
  "selected",
]);

// Kaizen Badge's own props (used stock).
const BADGE_COLORS = [
  "green",
  "red",
  "yellow",
  "purple",
  "teal",
  "gray",
  "blue",
];
const BADGE_KINDS = ["solid", "outline"];

const LIST_RESET = { listStyle: "none", margin: 0, padding: 0 };

function dataOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}
function cardDataOption(row, key, allowed, fallback) {
  return dataOption(
    row.dataset[key] || row.firstElementChild?.dataset[key],
    allowed,
    fallback,
  );
}
function text(el) {
  return el?.textContent.trim() || undefined;
}

// Per-card options like "[gradient, selected]" (anywhere in the card text).
function parseCardOptions(str) {
  const match = (str || "").match(/[[(]\s*([^\])]+?)\s*[\])]/);
  if (!match) return null;
  const tokens = match[1]
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (tokens.length && tokens.every((t) => CARD_TOKENS.has(t)))
    return { match: match[0], tokens };
  return null;
}

function collectText(scope, imageMeta) {
  const paras = [...scope.querySelectorAll("p")].filter(
    (p) =>
      p !== imageMeta &&
      !p.querySelector("a[href], img, picture") &&
      p.textContent.trim(),
  );
  let opt = [];
  const body = [];
  paras.forEach((p) => {
    let t = p.textContent.trim();
    const found = parseCardOptions(t);
    if (found) {
      opt = opt.concat(found.tokens);
      t = t.replace(found.match, "").trim();
    }
    if (t) body.push(t);
  });
  return { opt, body };
}

function readImage(row) {
  const icon = row.querySelector("img");
  const meta = [...row.querySelectorAll("p")].find((p) =>
    /^Image:\s*/i.test(p.textContent.trim()),
  );
  if (icon)
    return {
      element: meta,
      image: { alt: icon.alt || "", src: icon.currentSrc || icon.src },
    };
  if (!meta) return {};

  const [url, ...alt] = meta.textContent
    .trim()
    .replace(/^Image:\s*/i, "")
    .split("|");
  const src = meta.querySelector("a[href]")?.href || url.trim();
  return {
    element: meta,
    image: src && { alt: alt.join("|").trim(), src },
  };
}

// One tag: "Label" or "Label (color)" or "Label (color, outline)".
// color/kind map straight to the Kaizen Badge props; defaults gray + solid.
function parseTag(raw) {
  const m = raw.match(/\(([^)]*)\)/);
  const opts = m
    ? m[1]
        .split(/[\s,]+/)
        .map((o) => o.trim().toLowerCase())
        .filter(Boolean)
    : [];
  return {
    label: raw.replace(/\([^)]*\)/, "").trim(),
    color: opts.find((o) => BADGE_COLORS.includes(o)) || "gray",
    kind: opts.find((o) => BADGE_KINDS.includes(o)) || "solid",
  };
}

// Split the Heading 5 line on top-level commas (commas inside "(...)" stay put).
function parseTags(str) {
  if (!str) return [];
  return str
    .split(/,(?![^(]*\))/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseTag)
    .filter((t) => t.label);
}

// Tags -> stock Kaizen Badge pills (color/kind authored per tag).
const tagList = (tags) =>
  tags.length > 0 &&
  h(
    "div",
    { className: "cards-tags" },
    tags.map((tag, i) =>
      h(Badge, { color: tag.color, key: i, kind: tag.kind }, tag.label),
    ),
  );

const line = (kind, tag, value, className, key) =>
  renderText(value, { className, kind, key, tag });

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const media = window.matchMedia(query);
    const onChange = () => setMatches(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

// UNIVERSAL card. Every field is optional; author only what you need:
//   Image or "Image: URL | alt text" -> card image (Kaizen Card media)
//   Heading 5    -> tag(s): comma-separated -> Kaizen Badge pills.
//                   Per tag: "Label (color)" / "Label (color, outline)".
//                   color = green|red|yellow|purple|teal|gray|blue (default gray)
//   Heading 6    -> eyebrow (publisher / date / category)
//   Heading 3    -> title
//   Heading 4    -> sub-header
//   Normal text  -> body
//   Bold link    -> CTA button, options in parens e.g. "Read More (secondary, neutral)"
//   "[...]" line -> card options: kind, layout, density, selected
function readCard(row) {
  const { element: imageMeta, image } = readImage(row);
  const link = [...row.querySelectorAll("a[href]")].find(
    (candidate) => !imageMeta?.contains(candidate) && !candidate.querySelector("img, picture"),
  );
  const tagsEl = row.querySelector("h5");
  const { opt, body } = collectText(row, imageMeta);
  return {
    tags: parseTags(tagsEl?.textContent),
    eyebrow: text(row.querySelector("h6")),
    title: text(row.querySelector("h1, h2, h3")),
    subheader: text(row.querySelector("h4")),
    body,
    image,
    link: link && readButtonLink(link, { color: "brand", kind: "tertiary" }),
    density:
      opt.find((t) => CARD_DENSITIES.includes(t)) ||
      cardDataOption(row, "cardDensity", CARD_DENSITIES),
    kind:
      opt.find((t) => CARD_KINDS.includes(t)) ||
      cardDataOption(row, "cardKind", CARD_KINDS, "solid"),
    layout:
      opt.find((t) => CARD_LAYOUTS.includes(t)) ||
      cardDataOption(row, "cardLayout", CARD_LAYOUTS),
    mediaPosition:
      opt.find((t) => CARD_MEDIA_POSITIONS.includes(t)) ||
      cardDataOption(row, "cardMediaPosition", CARD_MEDIA_POSITIONS, "start"),
    mediaTheme: cardDataOption(row, "cardMediaTheme", CARD_MEDIA_THEMES),
    selected:
      opt.includes("selected") ||
      (row.dataset.cardSelected ||
        row.firstElementChild?.dataset.cardSelected) === "true",
  };
}

function renderCardAction(link) {
  if (!link) return null;
  return renderButton({
    ...link,
    color: link.color || "brand",
    kind: link.kind || "tertiary",
    onClick: (e) => e.stopPropagation(),
  });
}

function CardView(card) {
  const {
    body,
    density,
    eyebrow,
    image,
    kind,
    layout,
    link,
    mediaPosition,
    mediaTheme,
    onSelect,
    selected,
    subheader,
    tags,
    title,
  } = card;
  const handleKey = onSelect
    ? (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }
    : undefined;
  return h(
    Card,
    {
      density,
      kind,
      className: mediaPosition === "end" ? "cards-media-end" : undefined,
      layout,
      mediaTheme,
      onClick: onSelect,
      onKeyDown: handleKey,
      role: onSelect ? "button" : undefined,
      selected,
      slotHeader: tagList(tags),
      slotMedia:
        image &&
        h("img", {
          alt: image.alt,
          className: "cards-img",
          loading: "lazy",
          src: image.src,
        }),
      tabIndex: onSelect ? 0 : undefined,
    },
    h(
      Flex,
      {
        direction: "col",
        gap: "3",
      },
      line("label/regular/md", "p", eyebrow, "cards-eyebrow"),
      line("title/lg", "h3", title),
      line("body/bold/md", "h4", subheader),
      ...(body || []).map((para, i) =>
        line("body/regular/sm", "p", para, undefined, i),
      ),
      link && h("div", { className: "cards-cta" }, renderCardAction(link)),
    ),
  );
}

function CardsApp({ cards }) {
  const [selected, setSelected] = useState(cards.findIndex((c) => c.selected));
  const mobile = useMediaQuery(MOBILE_CARD_QUERY);
  return h(
    Grid,
    { asChild: true, colMinWidth: 280, gap: "10" },
    h(
      "ul",
      { style: LIST_RESET },
      cards.map((card, i) =>
        h(
          "li",
          {
            key: i,
            style: {
              display: "grid",
              gridColumn:
                !mobile && card.layout === "horizontal" ? "1 / -1" : undefined,
            },
          },
          h(CardView, {
            ...card,
            layout:
              mobile && card.layout === "horizontal" ? "vertical" : card.layout,
            onSelect: () => setSelected(i === selected ? -1 : i),
            selected: i === selected,
          }),
        ),
      ),
    ),
  );
}

export default function decorate(block) {
  const cards = [...block.children].map(readCard);

  block.classList.add("nv-theme-kui11");
  flushSync(() => {
    createRoot(block).render(h(CardsApp, { cards }));
  });
}
