import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Badge, Button, Card, Flex, Text } from "@kui/foundations-react";

const h = React.createElement;
const { useState, useRef, useLayoutEffect } = React;

const BADGE_COLORS = ["green", "red", "yellow", "purple", "teal", "gray", "blue"];
const BADGE_KINDS = ["solid", "outline"];

const parts = (v) => (v || "").split("|").map((s) => s.trim()).filter(Boolean);

// "Label" | "Label (color)" | "Label (color, outline)" -> Kaizen Badge props.
function parseTag(raw, defaultKind) {
  const m = raw.match(/\(([^)]*)\)/);
  const opts = m ? m[1].split(/[\s,]+/).map((o) => o.trim().toLowerCase()).filter(Boolean) : [];
  return {
    label: raw.replace(/\([^)]*\)/, "").trim(),
    color: opts.find((o) => BADGE_COLORS.includes(o)) || "gray",
    kind: opts.find((o) => BADGE_KINDS.includes(o)) || defaultKind,
  };
}
function parseTags(str, defaultKind = "solid") {
  if (!str) return [];
  return str.split(/,(?![^(]*\))/).map((s) => s.trim()).filter(Boolean)
    .map((t) => parseTag(t, defaultKind)).filter((t) => t.label);
}

// "Field: value" lines in a row -> config object.
function readKeyValues(scope) {
  const cfg = {};
  [...scope.querySelectorAll("p, li")].forEach((p) => {
    const t = p.textContent.trim();
    const m = t.match(/^([A-Za-z][A-Za-z0-9 _-]{0,24}):\s*(.*)$/);
    if (m) cfg[m[1].trim().toLowerCase()] = m[2].trim();
  });
  const img = scope.querySelector("img");
  if (img) cfg._img = { alt: img.alt || "", src: img.currentSrc || img.src };
  return cfg;
}

const CARD_KEYS = ["badges", "time", "provider", "logo", "title", "description", "body", "tags"];

function readCard(cfg) {
  return {
    badges: parseTags(cfg.badges, "solid"),
    time: cfg.time,
    provider: cfg.provider,
    logo: cfg.logo ? { src: cfg.logo, alt: cfg.provider || "" } : cfg._img,
    title: cfg.title,
    desc: cfg.description || cfg.body,
    tags: parseTags(cfg.tags, "outline"),
  };
}

const clockIcon = () =>
  h("svg", { className: "nim-clock", width: 14, height: 14, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", "strokeWidth": 2, "aria-hidden": "true" },
    h("circle", { cx: 12, cy: 12, r: 9 }),
    h("path", { d: "M12 7v5l3 2" }));

// Bottom tag row that collapses to a single line + "+N" overflow badge.
function TagRow({ tags }) {
  const ref = useRef(null);
  const [count, setCount] = useState(tags.length);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pills = [...el.querySelectorAll("[data-tag]")];
    if (!pills.length) return;
    const top = pills[0].offsetTop;
    let fit = pills.length;
    for (let i = 1; i < pills.length; i += 1) {
      if (pills[i].offsetTop > top + 2) { fit = i; break; }
    }
    if (fit !== count) setCount(fit);
  });

  const shown = tags.slice(0, count);
  const hidden = tags.length - count;
  return h(
    "div",
    { className: "nim-card-tags", ref },
    shown.map((t, i) =>
      h("span", { className: "nim-tag", "data-tag": "1", key: i },
        h(Badge, { color: t.color, kind: t.kind }, t.label))),
    hidden > 0 && h("span", { className: "nim-tag nim-tag-more", key: "more" },
      h(Badge, { color: "gray", kind: "solid" }, `+${hidden}`)),
  );
}

function NimCard(c) {
  return h(
    Card,
    { kind: "float", className: "nim-card" },
    // header: status badges (left) + time (right)
    h("div", { className: "nim-card-header" },
      h("div", { className: "nim-card-badges" },
        c.badges.map((b, i) => h(Badge, { color: b.color, kind: b.kind, key: i }, b.label))),
      c.time && h("span", { className: "nim-card-time" }, clockIcon(), c.time)),
    h("hr", { className: "nim-card-divider" }),
    // provider (logo + name)
    (c.provider || c.logo) && h("div", { className: "nim-card-provider" },
      c.logo && h("img", { className: "nim-card-logo", src: c.logo.src, alt: c.logo.alt, loading: "lazy" }),
      c.provider && h(Text, { asChild: true, kind: "label/regular/md" },
        h("span", null, c.provider))),
    c.title && h(Text, { asChild: true, kind: "title/md" },
      h("h3", { className: "nim-card-title" }, c.title)),
    c.desc && h(Text, { asChild: true, kind: "body/regular/md" },
      h("p", { className: "nim-card-desc" }, c.desc)),
    c.tags.length > 0 && h(TagRow, { tags: c.tags }),
  );
}

function NimCardsView({ heading, intro, cta, cards }) {
  return h(
    "div",
    { className: "nim-inner" },
    h("div", { className: "nim-aside" },
      heading && h(Text, { asChild: true, kind: "display/sm" }, h("h2", null, heading)),
      intro && h(Text, { asChild: true, kind: "body/regular/lg" },
        h("p", { className: "nim-intro" }, intro)),
      cta && h(Button, { asChild: true, color: "brand", kind: "secondary" },
        h("a", { href: cta.href }, cta.text))),
    cards.length > 0 && h("div", { className: "nim-grid" },
      cards.map((c, i) => h(NimCard, { ...c, key: i }))),
  );
}

export default function decorate(block) {
  const rows = [...block.children].map(readKeyValues);
  const cfg = Object.assign({}, ...rows.filter((r) => r.heading || r.intro || r.cta));
  const ctaParts = parts(cfg.cta);
  const cards = rows.filter((r) => CARD_KEYS.some((k) => k in r) && (r.title || r.badges || r.tags))
    .map(readCard);

  block.classList.add("nv-theme-kui11");
  block.textContent = "";
  flushSync(() => {
    createRoot(block).render(h(NimCardsView, {
      heading: cfg.heading,
      intro: cfg.intro,
      cta: ctaParts.length ? { text: ctaParts[0], href: ctaParts[1] || "#" } : null,
      cards,
    }));
  });
}
