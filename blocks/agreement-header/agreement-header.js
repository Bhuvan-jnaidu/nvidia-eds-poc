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
  // Download link: prefer an authored <a>, but fall back to the cell text so the
  // button still renders if EDS strips the anchor (relative-path links get
  // stripped in the docx -> EDS conversion).
  const dlCell = cell(0, 1);
  const dlAnchor = dlCell?.querySelector("a[href]");
  const dlLabel = (dlAnchor ? dlAnchor.textContent : (dlCell ? dlCell.textContent : "")).trim();
  const dlHref = dlAnchor ? dlAnchor.href : "/nvidia-cloud-agreement.pdf";
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
          dlLabel && h(Button, { asChild: true, color: "brand", kind: "primary", size: "large" },
            h("a", {
              className: "agreement-download",
              href: dlHref,
              rel: dlAnchor?.rel || undefined,
              target: dlAnchor?.target || undefined,
            }, dlLabel)),
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

  // Pin the dark bar to the top on scroll. position:sticky proved unreliable in
  // this EDS/KUI layout, so drive it with JS + position:fixed (a spacer keeps
  // the layout from jumping when the bar leaves the flow).
  const topbar = block.querySelector(".agreement-topbar");
  const main = block.closest("main");
  if (topbar && main) {
    main.prepend(topbar);
    // A 1px sentinel where the bar sits; a spacer keeps layout from jumping when
    // the bar goes fixed. IntersectionObserver detects the sentinel leaving the
    // top of the viewport regardless of which element actually scrolls (this page
    // scrolls inside a container, so window scroll / sticky don't work).
    const sentinel = document.createElement("div");
    sentinel.setAttribute("aria-hidden", "true");
    sentinel.style.height = "1px";
    topbar.before(sentinel);
    const spacer = document.createElement("div");
    spacer.setAttribute("aria-hidden", "true");
    topbar.after(spacer);
    const io = new IntersectionObserver(([e]) => {
      const pin = e.boundingClientRect.top < 0;
      spacer.style.height = pin ? `${topbar.offsetHeight}px` : "0px";
      topbar.classList.toggle("agreement-topbar--fixed", pin);
    }, { threshold: [0] });
    io.observe(sentinel);
  }
}
