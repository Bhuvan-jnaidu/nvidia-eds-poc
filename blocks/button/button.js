import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Button } from "@kui/foundations-react";

const h = React.createElement;

const KINDS = ["primary", "secondary", "tertiary"];
const COLORS = ["brand", "neutral", "danger"];
const SIZES = ["tiny", "small", "medium", "large"];

// Label authored with optional variant options in parentheses, e.g.
// "Join Inception (large, secondary)". Same convention as the input-shell submit.
function parseButton(text) {
  const trimmed = (text || "").trim();
  const optsMatch = trimmed.match(/\(([^)]*)\)/);
  const label = trimmed.replace(/\([^)]*\)/, "").trim() || "Button";
  const opts = optsMatch ? optsMatch[1].split(",").map((o) => o.trim().toLowerCase()) : [];
  return {
    label,
    kind: opts.find((o) => KINDS.includes(o)) || "primary",
    color: opts.find((o) => COLORS.includes(o)) || "brand",
    size: opts.find((o) => SIZES.includes(o)) || "medium",
  };
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
  const opts = parseButton(rawText);

  block.textContent = "";
  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(
      h(
        Button,
        { asChild: true, color: opts.color, kind: opts.kind, size: opts.size },
        h("a", { href, rel, target }, opts.label),
      ),
    );
  });
}
