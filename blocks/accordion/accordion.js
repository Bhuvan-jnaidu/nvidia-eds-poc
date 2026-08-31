import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Accordion } from "@kui/foundations-react";

const h = React.createElement;

const CHEVRON_POSITIONS = ["start", "end"];

function dataOption(value, allowed, fallback) {
  return allowed.includes(value) ? value : fallback;
}

// Each authored row becomes one accordion item:
//   row > cell[0] = trigger/label (plain text)
//   row > cell[1] = panel content (rich text — paragraphs, links, lists)
function readItem(row, index) {
  const cells = [...row.children];
  const triggerCell = cells[0];
  const contentCell = cells[1] || cells[0];

  return {
    chevronPosition: dataOption(row.dataset.chevronPosition, CHEVRON_POSITIONS, "end"),
    content: (contentCell?.innerHTML || "").trim(),
    disabled: row.dataset.disabled === "true",
    trigger: triggerCell?.textContent.trim() || "",
    value: row.dataset.value || String(index + 1),
  };
}

function accordionItems(items) {
  return items.map((item) => ({
    chevronPosition: item.chevronPosition,
    disabled: item.disabled,
    slotContent: h("div", { dangerouslySetInnerHTML: { __html: item.content } }),
    slotTrigger: item.trigger,
    value: item.value,
  }));
}

export default function decorate(block) {
  const rows = [...block.children];
  const items = accordionItems(rows.map(readItem));
  const multiple = block.dataset.accordionMultiple === "true";

  // Initial open section(s): comma-separated values in data-accordion-default.
  const defaults = (block.dataset.accordionDefault || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const props = { items, multiple };
  if (multiple) {
    if (defaults.length) props.defaultValue = defaults;
  } else if (defaults.length) {
    [props.defaultValue] = defaults;
  }

  block.classList.add("nv-theme-kui11");

  flushSync(() => {
    createRoot(block).render(h(Accordion, props));
  });
}
