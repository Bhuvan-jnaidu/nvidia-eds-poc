# Project Flow — NVIDIA Contact Page EDS POC

Maps every file to its role, inputs, and outputs across page load, block rendering,
content authoring, and Universal Editor/AEM Cloud deployment.

---

## 1. Browser Entry → Page Load

```
Browser requests index.html
        │
        ├── <link rel="stylesheet" href="/styles/styles.css">
        │       └── Applied immediately (LCP-critical: tokens, reset, body.appear, buttons)
        │
        └── <script nonce="aem" src="/scripts/scripts.js" type="module">
                │
                └── scripts/scripts.js  ──imports──▶  scripts/aem.js
                        │                               (EDS runtime: decorateSections,
                        │                                decorateBlocks, loadBlock,
                        │                                loadHeader, loadFooter, etc.)
                        │
                        └── loadPage()
                               ├── loadEager()   ← phase 1
                               ├── loadLazy()    ← phase 2
                               └── loadDelayed() ← phase 3 (after 3 s)
```

---

## 2. Three-Phase Loading Pipeline

### Phase 1 — loadEager (synchronous, before paint)

```
loadEager(document)
    │
    ├── decorateTemplateAndTheme()
    │       └── reads <meta name="template"> / <meta name="theme"> → adds class to <body>
    │
    ├── decorateMain(main)
    │       ├── decorateIcons(main)          → finds span.icon-* → injects SVG <img> from /icons/
    │       ├── buildAutoBlocks(main)
    │       │       ├── Auto-detects /fragments/ links → lazy-loads fragment.js
    │       │       └── buildHeroBlock(main) → if h1 + picture at top → wraps in hero block
    │       ├── decorateSections(main)       → wraps main > div children into .section divs
    │       │                                  non-block content → .default-content-wrapper
    │       ├── decorateBlocks(main)         → adds .block class, data-block-name, -container, -wrapper
    │       └── decorateButtons(main)        → <strong><a> → .button.primary
    │                                           <em><a>     → .button.secondary
    │
    ├── body.classList.add('appear')         → CSS: opacity 0 → 1 (FOUC prevention)
    │
    └── loadSection(firstSection, waitForFirstImage)
            └── loads first section + its LCP image eagerly
```

### Phase 2 — loadLazy (after first section paints)

```
loadLazy(document)
    │
    ├── loadHeader(header)
    │       └── ──▶ blocks/header/header.js  [see Section 4]
    │
    ├── loadSections(main)
    │       └── loads remaining .section blocks one by one
    │               each section → loadSection() → loads blocks inside it
    │                       each block → loadBlock()
    │                               ├── dynamic import('blocks/{name}/{name}.js')
    │                               ├── dynamic loadCSS('blocks/{name}/{name}.css')
    │                               └── calls mod.default(block) → decorate(block)
    │
    ├── loadFooter(footer)
    │       └── ──▶ blocks/footer/footer.js  [see Section 5]
    │
    └── loadCSS('/styles/lazy-styles.css')   → non-critical styles after LCP
        loadFonts()                          → loadCSS('/styles/fonts.css')
                                               → @font-face NVIDIA Sans, Font Awesome
```

### Phase 3 — loadDelayed (3 seconds after loadLazy)

```
loadDelayed()
    └── import('./delayed.js')
            └── scripts/delayed.js
                    └── dispatches CustomEvent('page:loaded')
                        (hook point for analytics, chat widgets, third-party scripts)
```

---

## 3. EDS Section & Block Decoration Pipeline

```
index.html (raw authored HTML)
    │
    │  main > div  ←── each top-level div = one section
    │
    ▼
decorateSections(main)          [aem.js]
    │
    ├── Each main > div → adds class="section", data-section-status="initialized"
    │                     sets style.display = "none"  (hidden until loaded)
    │
    ├── Direct children that are NOT a div  →  wrapped in .default-content-wrapper
    │       (e.g. h2, p directly in section → gets .default-content-wrapper)
    │
    └── Direct children that ARE a div with class="blockname"
            → stays as-is, gets {blockname}-container on section
    │
    ▼
decorateBlocks(main)            [aem.js]
    │
    └── For each div.section > div > div
            └── decorateBlock(block)
                    ├── block.classList.add('block', blockName)
                    ├── block.dataset.blockName = blockName
                    ├── block.dataset.blockStatus = 'initialized'
                    ├── block.parentElement.classList.add(`${blockName}-wrapper`)
                    └── section.classList.add(`${blockName}-container`)
    │
    ▼
loadSection(section)            [aem.js]
    │
    └── For each .block inside section
            └── loadBlock(block)
                    ├── fetch blocks/{name}/{name}.css  → inject <link>
                    ├── import('blocks/{name}/{name}.js')
                    │       └── calls mod.default(block) = decorate(block)
                    └── block.dataset.blockStatus = 'loaded'
                    section.style.display = null  (reveal)
```

---

## 4. Header Block Flow

```
loadHeader(<header>)            [aem.js]
    │
    └── buildBlock('header', '') → creates empty .header block
        loadBlock(headerBlock)
            │
            └── blocks/header/header.js  ←── blocks/header/header.css (loaded in parallel)
                    │
                    └── decorate(header)
                            │
                            ├── fetch('/nav.html')              ← authored nav content
                            │       └── nav.html
                            │               ├── div 1: brand   (<p><a>NVIDIA</a></p>)
                            │               ├── div 2: Products (p + 11 category divs)
                            │               ├── div 3: Solutions (p + 6 category divs)
                            │               ├── div 4: Industries (p + 5 category divs)
                            │               └── div 5: utility  (<ul> Shop/Drivers/Support)
                            │
                            ├── builds <nav class="nav">
                            │       └── <div class="nav-inner">
                            │               ├── <a class="nav-logo">  ← NVIDIA SVG wordmark
                            │               ├── <ul class="nav-links"> ← Products/Solutions/Industries
                            │               │       └── each item → buildMegaMenu(section)
                            │               │               ├── .mega-menu-cats  (left panel: category list)
                            │               │               └── .mega-menu-content (right panel: item grid)
                            │               ├── <ul class="nav-utility"> ← Shop/Drivers/Support
                            │               └── <button class="nav-hamburger"> ← mobile toggle
                            │
                            └── builds #nav-overlay  ← click-outside dim layer
```

**Mega Menu open/close flow:**
```
User clicks .nav-primary-btn
    │
    ├── closeAllMenus(nav)        → hides all .mega-menu, removes .open from items
    └── if not already open:
            megaMenu.hidden = false
            li.classList.add('open')
            #nav-overlay.classList.add('visible')

User clicks category button inside .mega-menu-cats
    └── toggles .active on li
        hides/shows corresponding .mega-menu-pane by data-idx

Close triggers: ESC key / click outside header / overlay click
    └── closeAllMenus(nav)
```

---

## 5. Footer Block Flow

```
loadFooter(<footer>)            [aem.js]
    │
    └── buildBlock('footer', '') → creates empty .footer block
        loadBlock(footerBlock)
            │
            └── blocks/footer/footer.js  ←── blocks/footer/footer.css (loaded in parallel)
                    │
                    └── decorate(block)
                            │
                            ├── fetch('/footer.html')           ← authored footer content
                            │       └── footer.html
                            │               ├── section 0: nav columns
                            │               │       (3 divs: Company Info / News / Popular Links)
                            │               ├── section 1: social
                            │               │       (p "Follow NVIDIA" + ul of social links)
                            │               └── section 2: global footer
                            │                       (NVIDIA link + legal ul + copyright p)
                            │
                            ├── builds .footer-main (black)
                            │       ├── .footer-grid  ← 3-column nav links
                            │       └── .footer-bottom
                            │               └── .footer-social ← SVG icons mapped by link text
                            │                       getSocialIcon('facebook') → SOCIAL_ICONS.facebook
                            │                       getSocialIcon('x')        → SOCIAL_ICONS.x
                            │
                            └── builds .footer-global (white)
                                    ├── .footer-global-logo  ← official NVIDIA wordmark SVG
                                    ├── .footer-legal-links  ← Privacy Policy | Terms | etc.
                                    └── .footer-copyright    ← © 2026 NVIDIA Corporation
```

---

## 6. Individual Block Flows

### Hero Block
```
index.html
    <div class="hero">
        <div><div><h1>Contact NVIDIA</h1><p>Get Your Questions Answered.</p></div></div>
    </div>
         │
         ▼
blocks/hero/hero.js → decorate(block)
    └── block.closest('.section').classList.add('hero-section')
         │
         ▼
blocks/hero/hero.css
    └── .hero-section { background: var(--color-page-bg) }  ← gray background
        .hero.block   { text-align: center }
```

### Cards Block
```
index.html
    <div class="cards">
        <div><div>icon img</div><div>Support ... GET SUPPORT link</div></div>
        <div><div>icon img</div><div>Enterprise Sales ... link</div></div>
        <div><div>icon img</div><div>Find a Partner ... link</div></div>
    </div>
         │
         ▼
blocks/cards/cards.js → decorate(block)
    ├── Each row div → <li> with .cards-card-image (picture-only) / .cards-card-body
    ├── img → createOptimizedPicture(src, alt, false, [{width:'750'}])
    │           └── builds <picture> with WebP source + lazy loading
    └── block replaced with <ul>
         │
         ▼
blocks/cards/cards.css
    └── 3-column grid, vertical dividers (border-right on li), centered content
```

### Contact Info Block
```
index.html
    <div class="contact-info"><div><div></div></div></div>
         │
         ▼
blocks/contact-info/contact-info.js → decorate(block)
    ├── REGIONS = ['Americas', 'Asia', 'Europe']  (hardcoded data)
    ├── OFFICES = { Americas: [...], Asia: [...], Europe: [...] }
    ├── builds <nav class="contact-info-tabs">
    │       └── <ul role="tablist"> with 3 tab buttons
    └── builds .contact-info-panels
            └── 3 .contact-info-panel divs (hidden/visible by tab click)
                    each panel → .offices-grid → .office-card (h4 city + p address)
         │
         ▼
blocks/contact-info/contact-info.css
    └── white background, centered tabs, office card grid
```

### Fragment Block
```
index.html or authored content
    <div class="fragment"><div><div><a href="/fragments/some-page"></a></div></div></div>
         │
         ▼
blocks/fragment/fragment.js → decorate(block)
    ├── reads href from <a>
    └── loadFragment(path)
            ├── fetch(`${path}.plain.html`)        ← EDS plain HTML endpoint
            ├── resetAttributeBase (fixes relative ./media_ image paths)
            ├── decorateMain(fragmentDoc)          ← full decoration pipeline
            └── loadSections(fragmentDoc)
            │
            └── fragment section replaces the .fragment block in the DOM
```

### Columns Block
```
index.html
    <div class="columns"><div><div>col 1</div><div>col 2</div></div></div>
         │
         ▼
blocks/columns/columns.js → decorate(block)
    └── adds class="col" to each cell div
         │
         ▼
blocks/columns/columns.css
    └── equal-width column grid
```

---

## 7. CSS Loading Cascade

```
Page load (synchronous)
    └── /styles/styles.css          ← LCP-critical
            ├── :root tokens        (colors, typography, spacing, transitions)
            ├── @font-face          (NVIDIA Sans Fallback — size-adjust CLS prevention)
            ├── body { opacity:0 }  (FOUC prevention)
            ├── body.appear         (opacity:1 — added by loadEager)
            ├── header/footer       visibility gating (hidden until data-block-status="loaded")
            ├── base element styles (h1–h6, p, a, img)
            └── .button variants    (primary/secondary/accent)

loadLazy (after first section)
    └── /styles/lazy-styles.css     ← non-critical overrides

loadFonts (after first section, fast connections only)
    └── /styles/fonts.css           ← @font-face declarations
            ├── NVIDIA Sans VF      (/fonts/NVIDIASansVF_NALA_W_Wght.woff2)  font-display:swap
            ├── Font Awesome Solid  (/fonts/fa-solid-900.woff2)
            ├── Font Awesome Regular(/fonts/fa-regular-400.woff2)
            └── Font Awesome Sharp  (/fonts/fa-sharp-light-300.woff2)

loadBlock (per block, on demand)
    ├── blocks/header/header.css
    ├── blocks/footer/footer.css
    ├── blocks/hero/hero.css
    ├── blocks/cards/cards.css
    ├── blocks/contact-info/contact-info.css
    ├── blocks/columns/columns.css
    └── blocks/fragment/fragment.css
```

---

## 8. Universal Editor — Component JSON Build Flow

```
Developer adds/edits a block
    │
    ├── blocks/{name}/_block.json   ← per-block source of truth
    │       ├── definitions[]       (title, id, resourceType, template defaults)
    │       ├── models[]            (authoring fields: component, name, label, valueType)
    │       └── filters[]           (if block is a container: lists allowed child block IDs)
    │
    └── models/_section.json
            └── filters[].components[]  ← lists all block IDs that can go in a section

         │
         ▼  npm run build:json  (also runs via .husky/pre-commit on every git commit)
         │
    scripts/build-json.js
         ├── scans blocks/**/_*.json
         ├── scans models/_*.json
         └── merges arrays into 3 global files:
                 │
                 ├── component-definition.json  ← consumed by Universal Editor Add panel
                 │       { groups: [{ title:'Blocks', components: [...all definitions] }] }
                 │
                 ├── component-models.json       ← field definitions shown in UE Properties panel
                 │       [ ...all models ]
                 │
                 └── component-filters.json      ← controls which blocks can nest inside containers
                         [ ...all filters ]
```

**Universal Editor authoring flow (once deployed to AEM Cloud):**
```
Author opens page in Universal Editor
    │
    ├── UE reads component-definition.json  → populates Add panel block list
    ├── Author adds a block (e.g. Hero)
    │       └── UE uses models[id='hero'].fields → renders authoring fields in Properties panel
    │
    └── Author publishes → AEM writes semantic HTML → EDS CDN serves it
                │
                └── EDS HTML structure maps 1:1 to what decorate(block) receives
```

---

## 9. AEM Cloud Deployment Flow

```
GitHub Repository (code)                AEM Author (content)
        │                                       │
        │  fstab.yaml                           │
        │  └── url: author-url/bin/franklin...  │
        │                                       │
        │  paths.json                           │
        │  └── /content/nvidia-contact/ → /     │
        │                                       │
        ▼                                       ▼
    AEM Code Sync App               Universal Editor writes content
    (GitHub App)                    to AEM JCR repository
        │                                       │
        │  watches main branch                  │  Author clicks Publish
        │  pushes code to EDS code bus          │
        ▼                                       ▼
    EDS CDN (aem.live / aem.page)
        │
        ├── https://main--<repo>--<org>.aem.live/     ← Live (production)
        └── https://main--<repo>--<org>.aem.page/     ← Preview (staging)
                │
                └── Serves:
                        ├── Content from AEM Author (published pages)
                        └── Code from GitHub main branch
                                (scripts/, styles/, blocks/)
```

**Branch-based development flow:**
```
Developer creates feature branch
    └── git checkout -b feature/my-block
            │
            ├── Edits blocks/my-block/  →  commits
            ├── npm run build:json      →  component-*.json updated
            └── git push origin feature/my-block
                    │
                    └── UE: add ?ref=feature/my-block to URL
                            └── UE uses feature branch code to test new block
                                while content still comes from AEM Author
```

---

## 10. File Reference Map

| File | Role | Reads from | Output |
|------|------|-----------|--------|
| `index.html` | Page HTML (authored content) | — | DOM served to browser |
| `head.html` | Injected `<head>` (EDS pipeline) | — | CSP, scripts, stylesheet link |
| `scripts/aem.js` | EDS runtime | — | `decorateSections`, `loadBlock`, etc. |
| `scripts/scripts.js` | Project entry, three-phase load | `aem.js` | `loadPage()` orchestration |
| `scripts/delayed.js` | Non-critical third-party hook | — | `CustomEvent('page:loaded')` |
| `scripts/build-json.js` | Component JSON builder | `blocks/**/_*.json`, `models/_*.json` | 3 global component files |
| `styles/styles.css` | LCP-critical base styles | — | CSS tokens, body reveal, buttons |
| `styles/lazy-styles.css` | Non-critical overrides | — | Loaded after LCP |
| `styles/fonts.css` | Web font declarations | `/fonts/*.woff2` | @font-face rules |
| `nav.html` | Authored nav content | — | Fetched by `header.js` via XHR |
| `footer.html` | Authored footer content | — | Fetched by `footer.js` via XHR |
| `blocks/header/header.js` | Nav + mega menu builder | `nav.html` | `<nav>` injected into `<header>` |
| `blocks/header/header.css` | Header styles | — | Mega menu, utility bar, mobile |
| `blocks/footer/footer.js` | Footer builder | `footer.html` | `.footer-main` + `.footer-global` |
| `blocks/footer/footer.css` | Footer styles | — | Black main + white global footer |
| `blocks/hero/hero.js` | Hero decorator | — | Adds `hero-section` class |
| `blocks/hero/hero.css` | Hero styles | — | Gray background, centered text |
| `blocks/cards/cards.js` | Cards transformer | `aem.js` (createOptimizedPicture) | `<ul><li>` card structure |
| `blocks/cards/cards.css` | Cards styles | — | 3-col grid, vertical dividers |
| `blocks/contact-info/contact-info.js` | Location tabs builder | hardcoded OFFICES data | Tab UI + offices grid |
| `blocks/contact-info/contact-info.css` | Contact info styles | — | White bg, centered tabs |
| `blocks/columns/columns.js` | Columns decorator | — | Adds `.col` class to cells |
| `blocks/columns/columns.css` | Columns styles | — | Equal-width column layout |
| `blocks/fragment/fragment.js` | Fragment loader | `{path}.plain.html` via fetch | Decorated fragment DOM |
| `blocks/*/_{name}.json` | UE block definition source | — | Input to `build-json.js` |
| `models/_section.json` | Section container filter | — | Lists allowed block IDs |
| `component-definition.json` | Global block registry | Built from `_*.json` files | Universal Editor Add panel |
| `component-models.json` | Global field definitions | Built from `_*.json` files | UE Properties panel fields |
| `component-filters.json` | Global container rules | Built from `_*.json` files | UE nesting constraints |
| `fstab.yaml` | Content mount config | — | Points EDS to AEM Author |
| `paths.json` | AEM ↔ EDS path mappings | — | Maps `/content/...` → `/` |
| `.eslintrc.cjs` | JS lint rules | — | ESLint (airbnb-base) |
| `.stylelintrc.json` | CSS lint rules | — | Stylelint (standard) |
| `.editorconfig` | Editor formatting | — | Indent/charset/EOL rules |
| `.github/workflows/main.yaml` | CI pipeline | — | Runs `npm run lint` on push |
| `.husky/pre-commit` | Pre-commit hook | — | Runs `build:json` before commit |
| `TODO.md` | Deployment checklist | — | Steps to complete for AEM Cloud |
