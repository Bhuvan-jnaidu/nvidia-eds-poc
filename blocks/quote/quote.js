import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Card, Flex, Text } from "@kui/foundations-react";

const h = React.createElement;

const CARD_KINDS = ["solid", "float", "gradient"];

// Adobe block-collection "quote" block, rendered with Kaizen (KUI) components.
// Authoring: row 1 = quotation, row 2 = attribution.
// Customization: name the block "quote (float)" or "quote (gradient)" to change
// the Kaizen Card kind — a quick way to confirm Kaizen styling is applied.
export default function decorate(block) {
  const [quotationEl, attributionEl] = [...block.children].map((c) => c.firstElementChild);
  const quotation = quotationEl?.textContent.trim() || "";
  const author = attributionEl?.querySelector("em")?.textContent.trim();
  const attribution = attributionEl?.textContent.trim() || "";
  const rest = author ? attribution.slice(author.length) : attribution;
  const kind = CARD_KINDS.find((k) => block.classList.contains(k)) || "solid";

  block.classList.add("nv-theme-kui11");
  block.textContent = "";
  flushSync(() => {
    createRoot(block).render(
      h(
        Card,
        { kind },
        h(
          Flex,
          { direction: "col", gap: "4" },
          h(Text, { asChild: true, kind: "title/lg" },
            h("blockquote", { className: "quote-quotation" }, `“${quotation}”`)),
          attribution && h(Text, { asChild: true, kind: "label/regular/md" },
            h("p", { className: "quote-attribution" },
              author ? [h("cite", { key: "a" }, author), rest] : attribution)),
        ),
      ),
    );
  });
}
