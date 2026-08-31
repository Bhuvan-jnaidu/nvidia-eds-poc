import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Button } from "@kui/foundations-react";

const h = React.createElement;

export const BUTTON_KINDS = ["primary", "secondary", "tertiary"];
export const BUTTON_COLORS = ["brand", "neutral", "danger"];
export const BUTTON_SIZES = ["tiny", "small", "medium", "large"];

const DEFAULTS = { color: "brand", kind: "primary", label: "Button", size: "medium" };

const choose = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback;

// Label authored with optional variant options in parentheses, e.g.
// "Join Inception (large, secondary)". Same convention as the input-shell submit.
export function parseButton(text, defaults = {}) {
  const fallback = { ...DEFAULTS, ...defaults };
  const trimmed = (text || "").trim();
  const optsMatch = trimmed.match(/\(([^)]*)\)/);
  const label = trimmed.replace(/\([^)]*\)/, "").trim() || fallback.label;
  const opts = optsMatch ? optsMatch[1].split(",").map((o) => o.trim().toLowerCase()) : [];
  return {
    label,
    kind: opts.find((o) => BUTTON_KINDS.includes(o)) || fallback.kind,
    color: opts.find((o) => BUTTON_COLORS.includes(o)) || fallback.color,
    size: opts.find((o) => BUTTON_SIZES.includes(o)) || fallback.size,
  };
}

function kindFromLink(link) {
  const authored = choose(link.dataset.buttonKind, BUTTON_KINDS);
  if (authored) return authored;
  if (link.classList.contains("secondary")) return "secondary";
  if (link.classList.contains("accent")) return "tertiary";
  return undefined;
}

export function readButtonLink(link, defaults = {}) {
  if (!link) return null;
  const parsed = parseButton(link.textContent.trim(), {
    color: choose(link.dataset.buttonColor, BUTTON_COLORS, defaults.color || DEFAULTS.color),
    kind: kindFromLink(link) || defaults.kind || DEFAULTS.kind,
    size: choose(link.dataset.buttonSize, BUTTON_SIZES, defaults.size || DEFAULTS.size),
  });

  return {
    ...parsed,
    href: link.href,
    rel: link.rel || undefined,
    target: link.target || undefined,
    text: parsed.label,
  };
}

export function readButtonMeta(value, defaults = {}) {
  if (!value) return null;
  const [label, href, kind, color, size] = value.split("|").map((part) => part.trim());
  if (!href) return null;

  const parsed = parseButton(label, {
    color: choose(color, BUTTON_COLORS, defaults.color || DEFAULTS.color),
    kind: choose(kind, BUTTON_KINDS, defaults.kind || DEFAULTS.kind),
    size: choose(size, BUTTON_SIZES, defaults.size || DEFAULTS.size),
  });

  return { ...parsed, href, text: parsed.label };
}

export function renderButton({
  color = DEFAULTS.color,
  href,
  kind = DEFAULTS.kind,
  label,
  onClick,
  rel,
  size = DEFAULTS.size,
  target,
  text: buttonText,
  type = "button",
}) {
  const children = buttonText || label || "Button";
  const props = { color, kind, onClick, size };

  if (href) {
    return h(
      Button,
      { ...props, asChild: true },
      h("a", { href, rel, target }, children),
    );
  }

  return h(Button, { ...props, type }, children);
}

// Authored anywhere as a "Button" block:
//   one cell with a hyperlinked label "Join Inception (large)", or
//   two cells: "Join Inception (large)" | https://destination
export default function decorate(block) {
  const link = block.querySelector("a[href]");
  const cells = [...(block.firstElementChild?.children || [])];
  const rawText = (link?.textContent || cells[0]?.textContent || "").trim();
  const href = link?.getAttribute("href") || cells[1]?.textContent.trim() || "#";
  const target = link?.getAttribute("target") || undefined;
  const rel = link?.getAttribute("rel") || undefined;
  const authoredOptions = cells.slice(2).map((cell) => cell.textContent.trim()).filter(Boolean);
  const opts = parseButton(
    authoredOptions.length ? `${rawText} (${authoredOptions.join(",")})` : rawText,
  );

  block.textContent = "";
  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(renderButton({ ...opts, href, rel, target }));
  });
}
