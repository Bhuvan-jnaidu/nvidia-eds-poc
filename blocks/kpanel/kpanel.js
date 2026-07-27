// OOTB vanilla twin of the Kaizen `panel` block. No React: decorates the DOM
// in place so it works in document authoring and the Universal Editor. Same
// look as `panel`, achieved through kpanel.css (Kaizen tokens) only.
// Authoring ("kpanel" table):
//   Row 1: section heading (Heading 2)
//   Row 2: one cell per column, each = Heading 3 sub-heading + a list of links.
export default function decorate(block) {
  const rows = [...block.children];
  const heading = rows[0]?.textContent.trim();
  const columnCells = rows[1] ? [...rows[1].children] : [];

  const card = document.createElement('div');
  card.className = 'kpanel-card';

  if (heading) {
    const h2 = document.createElement('h2');
    h2.className = 'kpanel-heading';
    h2.textContent = heading;
    card.append(h2);
  }

  const grid = document.createElement('ul');
  grid.className = 'kpanel-grid';
  columnCells.forEach((cell) => {
    const li = document.createElement('li');
    const col = document.createElement('div');
    col.className = 'kpanel-col';

    const title = cell.querySelector('h1, h2, h3, h4, h5, h6');
    if (title) {
      const h3 = document.createElement('h3');
      h3.textContent = title.textContent.trim();
      col.append(h3);
    }

    const anchors = [...cell.querySelectorAll('a[href]')];
    if (anchors.length) {
      const list = document.createElement('ul');
      list.className = 'kpanel-links';
      anchors.forEach((a) => {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = a.href;
        link.textContent = a.textContent.trim();
        if (a.rel) link.rel = a.rel;
        if (a.target) link.target = a.target;
        item.append(link);
        list.append(item);
      });
      col.append(list);
    }

    li.append(col);
    grid.append(li);
  });

  card.append(grid);
  block.replaceChildren(card);
}
