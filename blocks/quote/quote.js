// APPROACH A — Adobe block-collection "quote" block, JS UNCHANGED (OOTB).
// Styling comes only from Kaizen tokens in quote.css. When Adobe updates this
// file we can drop the new version in without re-writing anything.
export default async function decorate(block) {
  const [quotation, attribution] = [...block.children].map((c) => c.firstElementChild);
  const blockquote = document.createElement('blockquote');
  quotation.className = 'quote-quotation';
  blockquote.append(quotation);
  if (attribution) {
    attribution.className = 'quote-attribution';
    blockquote.append(attribution);
    const ems = attribution.querySelectorAll('em');
    ems.forEach((em) => {
      const cite = document.createElement('cite');
      cite.innerHTML = em.innerHTML;
      em.replaceWith(cite);
    });
  }
  block.innerHTML = '';
  block.append(blockquote);
}
