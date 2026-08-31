# CLAUDE.md — NVIDIA EDS PoC

Context for AI assistants (and humans) working on this repo. Read this first.

## What this is

A proof-of-concept **Adobe Edge Delivery Services (EDS / Helix / Franklin)** site for
NVIDIA, where EDS blocks are rendered with **NVIDIA Kaizen UI (KUI)** React components.
Pages are **authored in Google Docs**; Adobe's pipeline converts them to HTML; block
code + styles come from **GitHub**; preview/publish is done with the **AEM Sidekick**.

## Live URLs

- Preview: `https://main--nvidia-eds-poc--bhuvan-jnaidu.aem.page/`
- Live:    `https://main--nvidia-eds-poc--bhuvan-jnaidu.aem.live/`

## How content + code connect

```
Google Drive folder (Docs)            GitHub repo (code)
        |                                     |
   shared with helix@adobe.com          AEM Code Sync GitHub App
        |                                     |
        +------------> EDS pipeline <---------+
                          |
              Sidekick: Preview / Publish
```

- **Content source:** Google Drive folder, shared with `helix@adobe.com`.
  Mount is set in `fstab.yaml` -> folder ID `1I_2-1fccRGhVOnAMKgRN3azw5dHXeFWE`.
- **Code source:** GitHub `Bhuvan-jnaidu/nvidia-eds-poc`, branch `main`, via the
  **AEM Code Sync** GitHub App. Push to `main` -> deploys in ~1 min.

## Git remotes (IMPORTANT)

```
github  https://github.com/Bhuvan-jnaidu/nvidia-eds-poc.git   <-- THIS is the deploy remote
origin  https://gitlab-master.nvidia.com/dmo/nvidia-web/nvidia-eds-poc.git
```

Deploy pushes go to **`git push github main`**, NOT `origin`. `origin` is the internal
GitLab mirror and won't trigger Code Sync.

## Repo layout

- `blocks/<name>/<name>.js` + `.css` — one folder per block. `decorate(block)` is the
  entry point EDS calls.
- `scripts/aem.js`, `scripts/scripts.js` — EDS runtime (block loader, decoration).
- `scripts/kui/` — Kaizen bundle. `foundations-react.entry.js` is the source;
  `foundations-react.bundle.js` / `.bundle.css` are the built artifacts (committed).
- `styles/`, `head.html`, `index.html` (local dev copy) — global styling / head.
- `models/_section.json` — registers which blocks are allowed in a section.
- `fstab.yaml` — content mount.
- `SETUP-EDS.md` — full go-live setup guide.

## Blocks (current)

accordion, button, cards, columns, contact-info, footer, fragment, header, hero,
input-shell, text.

### Block rendering pattern (all KUI blocks follow this)

```js
import React from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { SomeComponent } from "@kui/foundations-react";
const h = React.createElement;

export default function decorate(block) {
  // read authored cells from block DOM
  block.classList.add("nv-theme-kui11");   // REQUIRED: applies KUI theme
  flushSync(() => {
    createRoot(block).render(h(SomeComponent, props, children));
  });
}
```

- React is loaded as an **external** via importmap (esm.sh) in `head.html` /
  `index.html`; `@kui/foundations-react` maps to the local bundle.
- `asChild` (Radix Slot) renders the component AS its child element (e.g. a Button as
  an `<a>`). **`asChild` cannot be combined with `dangerouslySetInnerHTML`** — pass
  plain text/children instead (this caused an early crash in `text.js`).

## KUI bundle — build step

The bundle is NOT built on the server. After editing `foundations-react.entry.js`
(e.g. exporting a new component), you MUST rebuild and commit the artifacts:

```bash
npm run build:kui    # -> scripts/kui/foundations-react.bundle.js + .css
```

Note: `build:kui` (esbuild) needs the platform-native binary and **fails in the Linux
sandbox** — run it on the Windows machine. A stale bundle silently breaks KUI blocks.

## Document authoring rules (the gotchas that keep biting us)

A block only renders if authored correctly in the Google Doc:

1. **Blocks are TABLES.** Use **Insert -> Table**. The **first cell = block name**
   (`text`, `cards`, `input-shell`, ...). Typed text with tab spaces is NOT a block —
   it renders as raw text (you'll literally see the word "text").
2. **Separate every block with a blank line.** Two tables touching merge into ONE
   block (e.g. a text table merged into cards became a "4th card").
3. **Links = Insert -> Link**, not Markdown `[label](url)` (that renders literally).
4. **No literal `|` pipes** to fake tables — use a real table.

## Block authoring cheatsheet

### text  (Kaizen Text)

2-column table. Row 1 = `text`. Row 2 = [content] | [style tokens].
Style cell accepts any combination (any order):

- **kind:** `title/lg`, `display/md`, `body/regular/md`, `body/bold/xl`,
  `label/semibold/sm`, `mono/md`, ... (full KUI kind list)
- **tag:** `h1`..`h6`, `p`, `span`
- **size:** `10 12 14 16 18 20 22 24 28 32 36 40 44 48 50 56 60 64 72 80`
- **weight:** `light regular semibold bold`
- **family:** `sans mono`
- `italic`, `underline`
- **line height:** `line:100|125|150|175`

Examples: `title/lg h1` · `48 bold italic h1` · `body/regular/md p` · `mono/md`
One heading/paragraph per table — the block styles only the first content row, so use a
separate `text` table (blank line between) for each piece.

### button  (standalone Kaizen Button)

Link text carries options in parens: `Join Inception (secondary, large)`.
Options parsed: kind `primary|secondary|tertiary`, color `brand|neutral|danger`,
size `tiny|small|medium|large`. Hyperlink the label with Insert -> Link.

### cards

Each card is a row in the cards table. Fields are set via the Google Docs
**paragraph-style menu** (Format -> Paragraph styles):

- **Image** -> media (the Badge overlays it)
- **Heading 5** -> Badge (pill on the image)
- **Heading 6** -> Publisher (small gray eyebrow above the title)
- **Heading 3** -> Title
- **Heading 4** -> Sub-Header
- **Normal text** -> Body
- **Bold link** -> CTA button; options in parens, e.g. `Get Support (primary, small)`

Card kind/layout via data attrs: `data-card-kind` (solid|float|gradient),
`data-card-layout` (horizontal|vertical), `data-card-density`
(compact|standard|spacious), `data-card-selected`.

### input-shell  (Kaizen InputShell + optional Submit)

Row cells: [label] | [placeholder] | [optional submit]. Submit cell:
`Submit (large, secondary)` — same option tokens as button.
Block-level data attrs: `data-input-type`, `data-name`, `data-dismissible`,
`data-input-kind` (flat|floating), `data-input-size`, `data-input-layout`.

## Publish workflow

1. Edit the Google Doc (follow authoring rules above).
2. Open Doc -> AEM Sidekick -> **Preview** -> check the `.aem.page` URL.
3. **Publish** -> promotes to `.aem.live`. Hard-refresh (Ctrl+Shift+R).
4. Code changes: `git push github main` -> Code Sync deploys in ~1 min.

## Local dev / checks

- `npm test` — Playwright suite.
- `npm run lint` — eslint + stylelint (eslint config is finicky under Node 22 in the
  sandbox; treat sandbox lint failures as environment issues, not real errors).
- `node --check blocks/<name>/<name>.js` — quick syntax check (works in sandbox).
- `npm start` — serve locally on :3001. `aem up` (AEM CLI) mirrors prod with content
  proxied from Drive.
- A husky **pre-commit** hook runs `build:json`; if it's missing/failing in an
  environment, commit with `--no-verify`.

## Editing files from a Linux sandbox (mount caveats)

The repo is CRLF; through the sandbox mount, git may report EVERY file as modified —
that's line-ending noise, not real changes (verify with `git diff --ignore-all-space`).
The mount can also fail to sync a freshly written file to the Windows disk, and the git
index can corrupt (`bad signature`). Safest workflow: write/verify files, then **commit
and push from the Windows machine**, which handles line endings correctly. If the index
corrupts, `rm .git/index && git reset` rebuilds it without touching the working tree.
