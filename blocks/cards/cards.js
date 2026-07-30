import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Badge, Button, Card, Flex, Grid, Text } from "@kui/foundations-react";

const h = React.createElement;
const { useState } = React;

const BUTTON_COLORS = ["brand", "neutral", "danger"];
const BUTTON_KINDS = ["primary", "secondary", "tertiary"];
const BUTTON_SIZES = ["tiny", "small", "medium", "large"];
const CARD_DENSITIES = ["compact", "standard", "spacious"];
const CARD_KINDS = ["solid", "float", "gradient"];
const CARD_LAYOUTS = ["horizontal", "vertical"];
const CARD_TOKENS = new Set([...CARD_KINDS, ...CARD_LAYOUTS, ...CARD_DENSITIES, "selected"]);

const BADGE_COLORS = ["green", "red", "yellow", "purple", "teal", "gray", "blue"];
const BADGE_KINDS = ["solid", "outline"];

const LIST_RESET = { listStyle: "none", margin: 0, padding: 0 };

const pick = (v, allowed, fallback) => (allowed.includes(v) ? v : fallback);
const text = (el) => el?.textContent.trim() || undefined;
const parts = (v) => (v || "").split("|").map((s) => s.trim()).filter(Boolean);
const anchorData = (a) => ({
  href: a.href, text: a.textContent.trim(), rel: a.rel || undefined, target: a.target || undefined,
});

function parseTag(raw) {
  const m = raw.match(/\(([^)]*)\)/);
  const opts = m ? m[1].split(/[\s,]+/).map((o) => o.trim().toLowerCase()).filter(Boolean) : [];
  return {
    label: raw.replace(/\([^)]*\)/, "").trim(),
    color: opts.find((o) => BADGE_COLORS.includes(o)) || "gray",
    kind: opts.find((o) => BADGE_KINDS.includes(o)) || "solid",
  };
}
function parseTags(str) {
  if (!str) return [];
  return str.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean).map(parseTag)
    .filter((t) => t.label);
}

function parseCTAtext(v) {
  const p = parts(v);
  if (!p.length) return null;
  const rest = p.slice(2).map((s) => s.toLowerCase());
  return {
    text: p[0],
    href: p[1] || "#",
    kind: rest.find((x) => BUTTON_KINDS.includes(x)) || "primary",
    color: rest.find((x) => BUTTON_COLORS.includes(x)) || "brand",
    size: rest.find((x) => BUTTON_SIZES.includes(x)) || "medium",
  };
}
function parseImgText(v) {
  const p = parts(v);
  return p.length ? { alt: p[1] || "", src: p[0] } : null;
}

const KNOWN_KEYS = ["title", "tags", "eyebrow", "date", "description", "body", "cta",
  "image", "kind", "sub-header", "subheader", "selected", "layout", "density"];

function readKeyValues(scope) {
  const cfg = {};
  [...scope.querySelectorAll("p, li")].forEach((p) => {
    const t = p.textContent.trim();
    const m = t.match(/^([A-Za-z][A-Za-z0-9 _-]{0,24}):\s*(.*)$/);
    if (m) cfg[m[1].trim().toLowerCase()] = m[2].trim();
  });
  return cfg;
}

function fromConfig(row, cfg) {
  const img = row.querySelector("img");
  const cta = cfg.cta ? parseCTAtext(cfg.cta) : null;
  return {
    tags: parseTags(cfg.tags),
    eyebrow: cfg.eyebrow || cfg.date,
    title: cfg.title,
    subheader: cfg.subheader || cfg["sub-header"],
    body: cfg.description || cfg.body,
    image: img ? { alt: img.alt || "", src: img.currentSrc || img.src } : parseImgText(cfg.image),
    link: cta && { ...cta, rel: undefined, target: undefined },
    links: undefined,
    kind: pick((cfg.kind || "").toLowerCase(), CARD_KINDS, "solid"),
    layout: pick((cfg.layout || "").toLowerCase(), CARD_LAYOUTS, undefined),
    density: pick((cfg.density || "").toLowerCase(), CARD_DENSITIES, undefined),
    selected: /^(true|yes|selected)$/i.test(cfg.selected || ""),
  };
}

function parseCardOptions(str) {
  const match = (str || "").match(/[[(]\s*([^\])]+?)\s*[\])]/);
  if (!match) return null;
  const tokens = match[1].split(",").map((t) => t.trim().toLowerCase()).filter(Boolean);
  if (tokens.length && tokens.every((t) => CARD_TOKENS.has(t))) return { match: match[0], tokens };
  return null;
}
function collectText(scope) {
  const paras = [...scope.querySelectorAll("p")]
    .filter((p) => !p.querySelector("a[href], img, picture") && p.textContent.trim());
  let opt = [];
  let body;
  paras.forEach((p) => {
    let t = p.textContent.trim();
    const found = parseCardOptions(t);
    if (found) { opt = opt.concat(found.tokens); t = t.replace(found.match, "").trim(); }
    if (!body && t) body = t;
  });
  return { opt, body };
}
function parseButtonOptions(t) {
  const om = t.match(/\(([^)]*)\)/);
  const opts = om ? om[1].split(",").map((o) => o.trim().toLowerCase()) : [];
  return {
    label: t.replace(/\([^)]*\)/, "").trim(),
    kind: opts.find((o) => BUTTON_KINDS.includes(o)),
    color: opts.find((o) => BUTTON_COLORS.includes(o)),
    size: opts.find((o) => BUTTON_SIZES.includes(o)),
  };
}
// A link is a CTA button only if it's bold/italic (EDS convention) or carries
// button options like "(primary, small)". Everything else is a plain link.
function linkIsButton(a) {
  if (a.closest("strong, em")) return true;
  const m = a.textContent.match(/\(([^)]*)\)/);
  if (m) {
    const toks = m[1].split(",").map((t) => t.trim().toLowerCase());
    if (toks.some((t) => BUTTON_KINDS.includes(t) || BUTTON_COLORS.includes(t) || BUTTON_SIZES.includes(t))) {
      return true;
    }
  }
  return false;
}

function fromHeadings(row) {
  const icon = row.querySelector("img");
  const anchors = [...row.querySelectorAll("a[href]")];
  const listAnchors = anchors.filter((a) => !linkIsButton(a));
  const link = anchors.find(linkIsButton) || null; // only bold/CTA links become buttons
  const tagsEl = row.querySelector("h5");
  const { opt, body } = collectText(row);
  const btn = link && parseButtonOptions(link.textContent.trim());
  return {
    tags: parseTags(tagsEl?.textContent),
    eyebrow: text(row.querySelector("h6")),
    title: text(row.querySelector("h1, h2, h3")),
    subheader: text(row.querySelector("h4")),
    body,
    image: icon && { alt: icon.alt || "", src: icon.currentSrc || icon.src },
    links: listAnchors.length ? listAnchors.map(anchorData) : undefined,
    link: link && {
      color: btn.color || pick(link.dataset.buttonColor, BUTTON_COLORS, "brand"),
      href: link.href,
      kind: btn.kind || "primary",
      rel: link.rel || undefined,
      size: btn.size || "medium",
      target: link.target || undefined,
      text: btn.label || link.textContent.trim(),
    },
    kind: opt.find((t) => CARD_KINDS.includes(t)) || "solid",
    layout: opt.find((t) => CARD_LAYOUTS.includes(t)),
    density: opt.find((t) => CARD_DENSITIES.includes(t)),
    selected: opt.includes("selected"),
  };
}

function readCard(row) {
  const cfg = readKeyValues(row);
  return KNOWN_KEYS.some((k) => k in cfg) ? fromConfig(row, cfg) : fromHeadings(row);
}

const tagList = (tags) =>
  tags.length > 0
  && h("div", { className: "cards-tags" },
    tags.map((tag, i) => h(Badge, { color: tag.color, key: i, kind: tag.kind }, tag.label)));

const linkList = (links) =>
  links && links.length > 0
  && h("ul", { className: "cards-links", style: LIST_RESET },
    links.map((l, i) => h("li", { key: i },
      h(Text, { asChild: true, kind: "body/regular/md" },
        h("a", { href: l.href, rel: l.rel, target: l.target }, l.text)))));

const line = (kind, tag, value, className) =>
  value && h(Text, { asChild: true, kind }, h(tag, className ? { className } : null, value));

function CardView(card) {
  const {
    body, density, eyebrow, image, kind, layout, link, links, onSelect, selected, subheader, tags, title,
  } = card;
  const handleKey = onSelect
    ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); } }
    : undefined;
  return h(
    Card,
    {
      density,
      kind,
      layout,
      onClick: onSelect,
      onKeyDown: handleKey,
      role: onSelect ? "button" : undefined,
      selected,
      slotHeader: image && h("img", {
        alt: image.alt, className: "cards-img", loading: "lazy", src: image.src,
      }),
      tabIndex: onSelect ? 0 : undefined,
    },
    h(
      Flex,
      { direction: "col", gap: "3" },
      tagList(tags),
      line("label/regular/md", "p", eyebrow, "cards-eyebrow"),
      line("title/lg", "h3", title),
      line("body/bold/md", "h4", subheader),
      line("body/regular/sm", "p", body),
      linkList(links),
      link && h("div", { className: "cards-cta" },
        h(Button, {
          asChild: true,
          color: link.color,
          kind: link.kind,
          onClick: (e) => e.stopPropagation(),
          size: link.size,
        }, h("a", { href: link.href, rel: link.rel, target: link.target }, link.text))),
    ),
  );
}

function CardsApp({ cards }) {
  const [selected, setSelected] = useState(cards.findIndex((c) => c.selected));
  return h(Grid, { asChild: true, colMinWidth: 280, gap: "6" },
    h("ul", { style: LIST_RESET },
      cards.map((card, i) => h("li", { key: i, style: { display: "grid" } },
        h(CardView, {
          ...card,
          onSelect: card.links ? undefined : (() => setSelected(i === selected ? -1 : i)),
          selected: i === selected,
        })))));
}

export default function decorate(block) {
  const cards = [...block.children].map(readCard);

  block.classList.add("nv-theme-kui11");
  flushSync(() => {
    createRoot(block).render(h(CardsApp, { cards }));
  });
}
