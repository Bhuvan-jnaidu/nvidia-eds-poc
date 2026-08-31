// Builds the self-hosted KUI bundle (JS + CSS) with React bundled IN.
// Uses esbuild's JS API so the production define + minify work identically on
// Windows and Linux (CLI --define quoting differs across shells).
//
// Production mode is essential: it dead-code-eliminates React's development
// warnings and shrinks the bundle from ~200KB gz (dev) to ~65KB gz (prod).
import { build } from 'esbuild';

await build({
  entryPoints: ['scripts/kui/foundations-react.entry.js'],
  bundle: true,
  format: 'esm',
  outfile: 'scripts/kui/foundations-react.bundle.js',
  minify: true,
  define: { 'process.env.NODE_ENV': '"production"' },
  alias: { 'react-compiler-runtime': './scripts/kui/react-compiler-runtime.shim.js' },
  logLevel: 'info',
});
