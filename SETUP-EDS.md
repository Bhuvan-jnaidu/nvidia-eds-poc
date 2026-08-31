# Going Live with Edge Delivery Services (Google Drive authoring)

Author pages in Google Docs → Adobe's pipeline converts them to HTML → your
code (blocks, styles) comes from GitHub → preview & publish with the AEM
Sidekick. No local converter, no build step on the server.

---

## What connects to what

```
Google Drive folder (Docs)          GitHub repo (code)
        │                                   │
   shared with                         AEM Code Sync
   helix@adobe.com                      GitHub App
        │                                   │
        └──────────────► EDS pipeline ◄─────┘
                              │
              Sidekick: Preview / Publish
                              │
        https://main--<repo>--<owner>.aem.page   (preview)
        https://main--<repo>--<owner>.aem.live   (production)
```

Content comes from Drive; code (`blocks/`, `scripts/`, `styles/`, the KUI
bundle) comes from GitHub `main`.

---

## One-time setup

### 1. Push this repo to GitHub
- Create a repo under your org/account; **public** is recommended.
- Push `main`. (Repo must contain `scripts/aem.js`, `fstab.yaml`, etc. — it does.)

### 2. Install the AEM Code Sync GitHub App
- Go to https://github.com/apps/aem-code-sync/installations/new
- Choose **Only select repositories** → pick this repo → **Save**.
- This deploys your code to `https://main--<repo>--<owner>.aem.page/`.
- (GitHub Enterprise w/ IP filtering: allow `3.227.118.73`.)

### 3. Create the content in Google Drive
- Create a folder in Google Drive (this is your site content root).
- **Share it with `helix@adobe.com`** (Viewer is enough; Editor if you want the
  service to write back). This is what authorizes the pipeline to read it.
- Add your pages as **Google Docs** (start with `index`, `nav`, `footer`).
  Author them in the same conventions our blocks expect (tables = blocks,
  `Component:` control cells, etc.).
- Tip: if you import a `.docx`, convert it back to a **native Google Doc** in Drive.

### 4. Connect the Drive folder to the repo
Two equivalent options:

- **Classic — `fstab.yaml`** (already wired in this repo): set the mountpoint to
  your folder URL:
  ```yaml
  mountpoints:
    /: https://drive.google.com/drive/folders/<FOLDER_ID>
  ```
- **Current — Site Config service**: use https://labs.aem.live/tools/site-admin/
  to create/update the site's content-source reference (Admin API `SiteConfig`).

### 5. Install the AEM Sidekick (Chrome)
- Install: https://chromewebstore.google.com/detail/aem-sidekick/igkmdomcgoebiipaifhmpfjhbjccggml
  (this is the **current** extension — note the old TODO link is stale), then pin it.
- Open your shared Drive folder, click the Sidekick icon → **Add this project**.

### 6. Preview & Publish
- Open a Doc (e.g. `index`) → click Sidekick → **Preview**
  (opens `https://main--<repo>--<owner>.aem.page/...`).
- When ready → **Publish** (promotes to `https://main--<repo>--<owner>.aem.live/...`).
- `index`, `nav`, `footer` are separate docs — preview/publish each.

---

## Project gotchas (important for us)

- **Commit built artifacts.** EDS serves repo files as-is with no build step, so
  before pushing run and commit the generated files:
  ```bash
  npm run build:kui     # scripts/kui/foundations-react.bundle.js + .css (InputShell etc.)
  npm run build:json    # component-*.json (only needed for Universal Editor)
  ```
  If `foundations-react.bundle.js` is stale, KUI blocks (e.g. input-shell) break in prod.
- **paths.json** with `/content/...` mappings is only relevant for the **AEM**
  content source, not Google Drive — leave `fstab.yaml` as the Drive mountpoint.
- **Local dev** mirrors prod via the AEM CLI:
  ```bash
  npm install -g @adobe/aem-cli
  aem up        # serves at http://localhost:3000 with content proxied from Drive
  ```

---

## What I need to finalize this repo
1. **GitHub owner + repo name** (e.g. `nvidia/nvidia-eds-poc`) — to fill in the
   live/preview URLs and confirm Code Sync target.
2. **Google Drive folder URL** (after you create it and share with
   `helix@adobe.com`) — to set the `fstab.yaml` mountpoint.

Sources: official AEM docs — see links in the chat.
