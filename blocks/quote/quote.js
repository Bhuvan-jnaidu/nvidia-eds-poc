import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { Card, Flex, Text } from "@kui/foundations-react";

const h = React.createElement;

const CARD_KINDS = ["solid", "float", "gradient"];

// Adobe block-collection "quote" block, rendered with Kaizen (KUI) components.
// Authoring: row 1 = quotation, row 2 = attribution.
// Variants (in the block name): "quote (float|gradient)" -> Kaizen Card kind
// (only visible when the card has media); "quote (display)" -> larger Kaizen
// Text size for the quotation; "quote (selected)" -> Kaizen selected ring.
export default function decorate(block) {
  const [quotationEl, attributionEl] = [...block.children].map((c) => c.firstElementChild);
  const quotation = quotationEl?.textContent.trim() || "";
  const author = attributionEl?.querySelector("em")?.textContent.trim();
  const attribution = attributionEl?.textContent.trim() || "";
  const rest = author ? attribution.slice(author.length) : attribution;

  const kind = CARD_KINDS.find((k) => block.classList.contains(k)) || "solid";
  const selected = block.classList.contains("selected");
  const quoteKind = block.classList.contains("display") ? "display/sm" : "title/lg";

  block.classList.add("nv-theme-kui11");
  block.textContent = "";
  flushSync(() => {
    createRoot(block).render(
      h(
        Card,
        { kind, selected },
        h(
          Flex,
          { direction: "col", gap: "4" },
          h(Text, { asChild: true, kind: quoteKind },
            h("blockquote", { className: "quote-quotation" }, `“${quotation}”`)),
          attribution && h(Text, { asChild: true, kind: "label/regular/md" },
            h("p", { className: "quote-attribution" },
              author ? [h("cite", { key: "a" }, author), rest] : attribution)),
        ),
      ),
    );
  });
}
