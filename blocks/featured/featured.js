import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Badge, Button, Card, Flex, Grid, Text } from "@kui/foundations-react";

const h = React.createElement;

const BADGE_COLORS = ["green", "red", "yellow", "purple", "teal", "gray", "blue"];
const BADGE_KINDS = ["solid", "outline"];
const BTN_KINDS = ["primary", "secondary", "tertiary"];
const BTN_COLORS = ["brand", "neutral", "danger"];
const BTN_SIZES = ["tiny", "small", "medium", "large"];

const LIST_RESET = { listStyle: "none", margin: 0, padding: 0 };

const text = (el) => el?.textContent.trim() || undefined;
const parts = (v) => (v || "").split("|").map((s) => s.trim()).filter(Boolean);

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
    kind: rest.find((x) => BTN_KINDS.includes(x)) || "secondary",
  };
}
function parseImgText(v) {
  const p = parts(v);
  return p.length ? { alt: p[1] || "", src: p[0] } : null;
}

// ---- labeled key/value authoring ("Field: value" lines) ----
const FEAT_KEYS = ["heading", "view more", "more", "intro", "date", "tags",
  "eyebrow", "title", "description", "body", "image", "cta"];

function readKeyValues(scope) {
  const cfg = {};
  [...scope.querySelectorAll("p, li")].forEach((p) => {
    const t = p.textContent.trim();
    const m = t.match(/^([A-Za-z][A-Za-z0-9 _-]{0,24}):\s*(.*)$/);
    if (m) cfg[m[1].trim().toLowerCase()] = m[2].trim();
  });
  return cfg;
}

function fromConfig(block, cfg) {
  const img = block.querySelector("img");
  const moreCta = parseCTAtext(cfg["view more"] || cfg.more);
  return {
    heading: cfg.heading,
    more: moreCta && { href: moreCta.href, text: moreCta.text },
    intro: cfg.intro,
    hero: {
      image: img ? { alt: img.alt || "", src: img.currentSrc || img.src } : parseImgText(cfg.image),
      tags: parseTags(cfg.tags || cfg.eyebrow),
      date: cfg.date,
      title: cfg.title,
      desc: cfg.description || cfg.body,
    },
    items: [],
  };
}

// ---- heading-style authoring (still supported) ----
function parseArticle(row) {
  const image = row.querySelector("img");
  const details = [...row.children][1] || row;
  const tagsEl = details.querySelector("h6");
  return {
    image: image && { alt: image.alt || "", src: image.currentSrc || image.src },
    tags: parseTags(tagsEl?.textContent),
    date: text(details.querySelector("h5")),
    title: text(details.querySelector("h3, h2, h4")),
    desc: text([...details.querySelectorAll("p")]
      .find((p) => !p.querySelector("a[href]") && p.textContent.trim())),
  };
}

function fromHeadings(block) {
  const rows = [...block.children];
  const [headRow, introRow] = rows;
  const moreLink = headRow?.querySelector("a[href]");
  return {
    heading: text(headRow?.querySelector("h1, h2, h3")) || text(headRow?.firstElementChild),
    more: moreLink && {
      href: moreLink.href,
      text: moreLink.textContent.replace(/\([^)]*\)/, "").trim() || "View More",
    },
    intro: text(introRow?.firstElementChild) || text(introRow),
    hero: rows[2] ? parseArticle(rows[2]) : null,
    items: rows.slice(3).map(parseArticle),
  };
}

function readFeatured(block) {
  const cfg = readKeyValues(block);
  return FEAT_KEYS.some((k) => k in cfg) ? fromConfig(block, cfg) : fromHeadings(block);
}

const tagPills = (tags) =>
  tags.length > 0
  && h("div", { className: "featured-tags" },
    tags.map((tag, i) => h(Badge, { color: tag.color, key: i, kind: tag.kind }, tag.label)));

const mediaImg = (image) =>
  image && h("img", { alt: image.alt, className: "featured-img", loading: "lazy", src: image.src });

function articleBody(a, titleKind) {
  return h(
    Flex,
    { direction: "col", gap: "3" },
    tagPills(a.tags),
    a.date && h(Text, { asChild: true, kind: "label/regular/md" },
      h("p", { className: "featured-date" }, a.date)),
    a.title && h(Text, { asChild: true, kind: titleKind }, h("h3", null, a.title)),
    a.desc && h(Text, { asChild: true, kind: "body/regular/md" }, h("p", null, a.desc)),
  );
}

function gridCard(a) {
  return h(Card, { kind: "solid", slotHeader: mediaImg(a.image) }, articleBody(a, "title/md"));
}

function FeaturedView({ heading, hero, intro, items, more }) {
  return h(
    "div",
    { className: "featured-inner" },
    h(
      "div",
      { className: "featured-head" },
      heading && h(Text, { asChild: true, kind: "display/sm" }, h("h2", null, heading)),
      more && h(
        Button,
        { asChild: true, color: "brand", kind: "secondary" },
        h("a", { href: more.href }, more.text),
      ),
    ),
    intro && h(Text, { asChild: true, kind: "body/regular/lg" },
      h("p", { className: "featured-intro" }, intro)),
    hero && h(
      "div",
      { className: "featured-hero" },
      hero.image && h("div", { className: "featured-hero-media" }, mediaImg(hero.image)),
      h("div", { className: "featured-hero-body" }, articleBody(hero, "title/xl")),
    ),
    items.length > 0 && h(
      "div",
      { className: "featured-grid-wrap" },
      h(
        Grid,
        { asChild: true, colMinWidth: 300, gap: "6" },
        h("ul", { style: LIST_RESET },
          items.map((item, i) => h("li", { key: i, style: { display: "grid" } }, gridCard(item)))),
      ),
    ),
  );
}

export default function decorate(block) {
  const data = readFeatured(block);

  block.classList.add("nv-theme-kui11");
  flushSync(() => {
    createRoot(block).render(h(FeaturedView, data));
  });
}
