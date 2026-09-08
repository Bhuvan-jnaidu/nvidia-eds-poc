// Footer is rendered by the NVIDIA global-navigation widget (see header.js),
// which portals the real footer into the <footer> element. This block is an
// intentional no-op so it leaves the <footer> empty for the plugin to fill.
export default function decorate(block) {
  block.innerHTML = '';
}
