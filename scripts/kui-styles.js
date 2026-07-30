// On-demand loader for the shared KUI stylesheet.
//
// This module is imported ONLY by KUI (Kaizen React) blocks. ES modules are
// evaluated once, so the loadCSS call below runs a single time — and only when
// a page actually contains a KUI block. Pages built entirely from vanilla /
// OOTB blocks never import this module, so they never fetch the KUI CSS.
//
// loadCSS is idempotent (it no-ops if the <link> already exists), so importing
// this from many blocks on one page still results in exactly one request.
import { loadCSS } from './aem.js';

loadCSS(`${window.hlx.codeBasePath}/scripts/kui/foundations-react.bundle.css`);
