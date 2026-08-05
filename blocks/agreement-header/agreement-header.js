// OOTB vanilla block: NVIDIA agreement page header. Renders a dark breadcrumb
// bar (label + Download PDF button), a gray centered title band (title +
// last-modified), and a centered notice. No React; Kaizen-token styling lives
// in agreement-header.css. Works in document authoring and the Universal Editor.
//
// Authoring ("agreement-header" table):
//   Row 1: breadcrumb label | Download PDF link
//   Row 2: page title
//   Row 3: last-modified line
//   Row 4: important-notice line
export default function decorate(block) {
  const rows = [...block.children];
  const cell = (r, i = 0) => rows[r]?.children[i];
  const textOf = (el) => (el ? el.textContent.trim() : '');

  const crumb = textOf(cell(0, 0)) || 'Agreements';
  const dl = cell(0, 1)?.querySelector('a[href]');
  const title = textOf(cell(1));
  const modified = textOf(cell(2));
  const notice = textOf(cell(3));

  const topbar = document.createElement('div');
  topbar.className = 'agreement-topbar';
  const label = document.createElement('span');
  label.className = 'agreement-crumb';
  label.textContent = crumb;
  topbar.append(label);
  if (dl) {
    const btn = document.createElement('a');
    btn.className = 'button agreement-download';
    btn.href = dl.href;
    btn.textContent = dl.textContent.trim() || 'Download PDF';
    if (dl.target) btn.target = dl.target;
    if (dl.rel) btn.rel = dl.rel;
    topbar.append(btn);
  }

  const band = document.createElement('div');
  band.className = 'agreement-titleband';
  if (title) {
    const h1 = document.createElement('h1');
    h1.textContent = title;
    band.append(h1);
  }
  if (modified) {
    const p = document.createElement('p');
    p.className = 'agreement-modified';
    p.textContent = modified;
    band.append(p);
  }

  const frag = document.createDocumentFragment();
  frag.append(topbar, band);
  if (notice) {
    const np = document.createElement('p');
    np.className = 'agreement-notice';
    np.textContent = notice;
    frag.append(np);
  }
  block.replaceChildren(frag);
}
