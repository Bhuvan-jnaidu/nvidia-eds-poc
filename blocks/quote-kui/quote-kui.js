// APPROACH B — same Adobe "quote" authoring, rendered with the Kaizen (KUI)
// React library (Card/Flex/Text). Full Kaizen components, at the cost of
// loading React + the KUI bundle.
import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Card, Flex, Text } from "@kui/foundations-react";

const h = React.createElement;
const CARD_KINDS = ["solid", "float", "gradient"];

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
            h("blockquote", { className: "quote-kui-quotation" }, `“${quotation}”`)),
          attribution && h(Text, { asChild: true, kind: "label/regular/md" },
            h("p", { className: "quote-kui-attribution" },
              author ? [h("cite", { key: "a" }, author), rest] : attribution)),
        ),
      ),
    );
  });
}
