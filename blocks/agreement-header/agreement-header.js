import { React, createRoot, flushSync, Button, Text } from "@kui/foundations-react";

const h = React.createElement;

// Kaizen block: NVIDIA agreement page header — dark breadcrumb bar (label +
// Download PDF button), gray centered title band (title + last-modified), and a
// centered notice. Same render pattern as the other KUI blocks (createRoot).
//
// Authoring ("agreement-header" table):
//   Row 1: breadcrumb label | Download PDF link
//   Row 2: page title
//   Row 3: last-modified line
//   Row 4: important-notice line
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (r, i = 0) => rows[r]?.children[i];
  const textOf = (el) => (el ? el.textContent.trim() : "");

  const crumb = textOf(cell(0, 0)) || "Agreements";
  const dl = cell(0, 1)?.querySelector("a[href]");
  const title = textOf(cell(1));
  const modified = textOf(cell(2));
  const notice = textOf(cell(3));

  block.classList.add("nv-theme-kui11");
  flushSync(() => {
    createRoot(block).render(
      h(
        React.Fragment,
        null,
        h(
          "div",
          { className: "agreement-topbar" },
          h(Text, { asChild: true, kind: "title/md" },
            h("span", { className: "agreement-crumb" }, crumb)),
          dl && h(Button, { asChild: true, color: "brand", kind: "primary" },
            h("a", {
              className: "agreement-download",
              href: dl.href,
              rel: dl.rel || undefined,
              target: dl.target || undefined,
            }, dl.textContent.trim() || "Download PDF")),
        ),
        h(
          "div",
          { className: "agreement-titleband" },
          title && h(Text, { asChild: true, kind: "display/sm" },
            h("h1", null, title)),
          modified && h(Text, { asChild: true, kind: "body/regular/sm" },
            h("p", { className: "agreement-modified" }, modified)),
        ),
        notice && h(Text, { asChild: true, kind: "body/bold/md" },
          h("p", { className: "agreement-notice" }, notice)),
      ),
    );
  });
}
