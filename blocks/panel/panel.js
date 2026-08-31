import { React, createRoot, flushSync } from "@kui/foundations-react";
import { Card, Grid, Text } from "@kui/foundations-react";

const h = React.createElement;
const LIST_RESET = { listStyle: "none", margin: 0, padding: 0 };

// One bordered panel = a section heading + inner columns of link lists.
// Authoring ("panel" table):
//   Row 1: section heading (Heading 2)
//   Row 2: one cell per column, each = Heading 3 sub-heading + a list of links.
function readColumn(cell) {
  return {
    title: cell.querySelector("h1, h2, h3, h4, h5, h6")?.textContent.trim(),
    links: [...cell.querySelectorAll("a[href]")].map((a) => ({
      href: a.href, text: a.textContent.trim(), rel: a.rel || undefined, target: a.target || undefined,
    })),
  };
}

export default function decorate(block) {
  const rows = [...block.children];
  const heading = rows[0]?.textContent.trim();
  const columns = rows[1] ? [...rows[1].children].map(readColumn) : [];

  block.classList.add("nv-theme-kui11");
  block.textContent = "";
  flushSync(() => {
    createRoot(block).render(
      h(
        Card,
        { kind: "solid" },
        heading && h(Text, { asChild: true, kind: "title/xl" },
          h("h2", { className: "panel-heading" }, heading)),
        h(
          Grid,
          { asChild: true, colMinWidth: 240, gap: "6" },
          h("ul", { style: LIST_RESET },
            columns.map((col, i) => h("li", { key: i, style: { display: "grid" } },
              h(
                "div",
                { className: "panel-col" },
                col.title && h(Text, { asChild: true, kind: "title/md" },
                  h("h3", null, col.title)),
                col.links.length > 0 && h("ul", { className: "panel-links", style: LIST_RESET },
                  col.links.map((l, j) => h("li", { key: j },
                    h(Text, { asChild: true, kind: "body/regular/md" },
                      h("a", { href: l.href, rel: l.rel, target: l.target }, l.text))))),
              )))),
        ),
      ),
    );
  });
}
