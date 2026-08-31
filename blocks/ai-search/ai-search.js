import { loadScript, readBlockConfig } from '../../scripts/aem.js';

const LIBRARIAN_SRC =
  'https://www.nvidia.com/content/dam/en-zz/Solutions/librarian/bundle-search-prod-pub-v3.1.js';

let librarianPromise;

function loadLibrarian() {
  librarianPromise ||= loadScript(LIBRARIAN_SRC, { defer: '' });
  return librarianPromise;
}

function bool(value, fallback) {
  if (value === undefined || value === '') return fallback;
  return `${value}`.toLowerCase() !== 'false';
}

function pills(value) {
  if (!value) return [];
  return Array.isArray(value)
    ? value
    : `${value}`.split('\n').map((item) => item.trim()).filter(Boolean);
}

export default async function decorate(block) {
  const config = readBlockConfig(block);
  const id = `librarian-search-${crypto.randomUUID()}`;

  block.textContent = '';
  block.id = id;

  await loadLibrarian();

  window.LIBRARIAN?.Home?.mount({
    elementId: id,
    overlayHeading: config.heading || 'What can I help you with?',
    placeholder: config.placeholder || 'Ask AI',
    site: config.site || 'https://www.nvidia.com',
    overlay: bool(config.overlay, false),
    expandPills: bool(config.expandpills, true),
    suggestedSearchPills: pills(config.pills),
  });
}
