// Deferred non-critical enhancements (analytics, chat widgets, etc.)
export default function delayed() {
  document.dispatchEvent(new CustomEvent('page:loaded'));
}
