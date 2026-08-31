import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Text } from "@kui/foundations-react";

const h = React.createElement;

const TAGS = ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span"];
const KIND_RE = /^(display|title|body|label|mono)\/[a-z0-9/]+$/;
const FONT_SIZES = ["10", "12", "14", "16", "18", "20", "22", "24", "28", "32",
  "36", "40", "44", "48", "50", "56", "60", "64", "72", "80"];
const FONT_WEIGHTS = ["light", "regular", "semibold", "bold"];
const FONT_FAMILIES = ["sans", "mono"];
const LINE_HEIGHTS = ["100", "125", "150", "175"];

// The style cell accepts space/comma-separated tokens (any order), e.g.:
//   "title/lg h1"                 -> Kaizen kind + <h1>
//   "48 bold italic underline"    -> fontSize/weight/style/underline
//   "size:32 weight:semibold sans line:150 h2"
export function parseTextStyle(styleText) {
  const tokens = (styleText || "")
    .split(/[\s,]+/).map((t) => t.trim().toLowerCase()).filter(Boolean);
  let tag = "p";
  const props = {};
  tokens.forEach((t) => {
    if (TAGS.includes(t)) tag = t;
    else if (KIND_RE.test(t)) props.kind = t;
    else if (t === "italic") props.fontStyle = "italic";
    else if (t === "underline") props.underline = true;
    else if (FONT_WEIGHTS.includes(t)) props.fontWeight = t;
    else if (FONT_FAMILIES.includes(t)) props.fontFamily = t;
    else if (t.startsWith("line:") && LINE_HEIGHTS.includes(t.slice(5))) props.lineHeight = t.slice(5);
    else if (t.startsWith("size:") && FONT_SIZES.includes(t.slice(5))) props.fontSize = t.slice(5);
    else if (FONT_SIZES.includes(t)) props.fontSize = t;
  });
  if (!props.kind && Object.keys(props).length === 0) props.kind = "body/regular/md";
  return { tag, props };
}

export function renderText(value, options = {}) {
  if (!value) return null;
  const {
    className,
    key,
    style,
    tag: authoredTag,
    ...textProps
  } = options;
  const { tag: styleTag, props } = parseTextStyle(style);
  const tag = authoredTag || styleTag;

  return h(
    Text,
    { asChild: true, key, ...props, ...textProps },
    h(tag, className ? { className } : null, value),
  );
}

// Authored as a "text" block: content in cell 1, style options in cell 2.
export default function decorate(block) {
  const row = block.firstElementChild;
  const cells = row ? [...row.children] : [];
  const content = (cells[0]?.textContent || "").trim();
  const style = cells[1]?.textContent || block.dataset.style;

  block.textContent = "";
  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(renderText(content, { style }));
  });
}
