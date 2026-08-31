# TODO — AEM Cloud & Universal Editor Deployment

Complete these steps after the local POC build is validated.

---

## 1. fstab.yaml — Connect to AEM Author

Update the `mountpoints` URL in `fstab.yaml` with the actual AEM Author environment:

```yaml
mountpoints:
  /: "https://<author-url>/bin/franklin.delivery/<github-org>/<github-repo>/main"
```

**Example:**
```yaml
mountpoints:
  /: "https://author-pXXXXX-eXXXXX.adobeaemcloud.com/bin/franklin.delivery/nvidia/nvidia-contact/main"
```

- [ ] Replace `<author-url>` with the AEM Cloud Author URL from Cloud Manager
- [ ] Replace `<github-org>` with the GitHub organization name
- [ ] Replace `<github-repo>` with the GitHub repository name

---

## 2. paths.json — Match AEM Site Name

Update `paths.json` to match the site name used when creating the AEM site:

```json
{
  "mappings": [
    "/content/<your-site-name>/:/",
    "/content/<your-site-name>/configuration:/.helix/config.json",
    "/content/<your-site-name>/metadata:/metadata.json"
  ],
  "includes": [
    "/content/<your-site-name>/"
  ]
}
```

- [ ] Replace `nvidia-contact` with the actual AEM site name (must match the Site Name set during site creation)

---

## 3. Install AEM Code Sync GitHub App

Enables automatic code sync from GitHub to EDS CDN.

- [ ] Go to [https://github.com/apps/aem-code-sync](https://github.com/apps/aem-code-sync)
- [ ] Click **Configure**
- [ ] Select the GitHub org where the repo lives
- [ ] Under **Repository access** → select the specific repository
- [ ] Click **Save**

---

## 4. AEM Cloud Manager — Edge Delivery Services Configuration

Links the AEM site to the GitHub code repository.

- [ ] Log into [Cloud Manager](https://experience.adobe.com/#/cloud-manager/landing.html)
- [ ] Navigate to **Tools → Cloud Services → Edge Delivery Services Configuration**
- [ ] Open the project configuration and click **Properties**
- [ ] Set **Organization** to the GitHub org name
- [ ] Set **Site Name** to the GitHub repository name
- [ ] Click **Save & Close**

---

## 5. Publish Content to Edge

After AEM and GitHub are connected, publish the site content to make it available on EDS URLs.

- [ ] In AEM Sites, select the site root and click **Manage Publications**
- [ ] Choose **Publish** → **Now** → **Next**
- [ ] Enable **Include Children** and click **OK**
- [ ] Click **Publish**

Once published, the site will be live at:
- **Preview:** `https://main--<repo>--<org>.aem.page/`
- **Live:** `https://main--<repo>--<org>.aem.live/`

---

## 6. Verify Universal Editor Integration

- [ ] Open a page in AEM Sites and click **Edit** to launch Universal Editor
- [ ] Confirm all blocks (Hero, Cards, Contact Info, Fragment, Columns) appear in the **Add** panel
- [ ] Test adding and editing each block via Universal Editor
- [ ] To test a feature branch: append `?ref=<branch-name>` to the Universal Editor URL

---

## 7. Install AEM Sidekick Browser Extension

Useful for previewing and publishing individual pages directly from the browser.

- [ ] Install the [AEM Sidekick extension](https://chromewebstore.google.com/detail/aem-sidekick/ccfggkjabjahcjoljmgmklhpaccedipo) in Chrome
- [ ] Configure it with the GitHub org and repo
- [ ] Use it to Preview / Publish individual pages from the browser

---

## 8. Run Build & Lint Before First Push

- [ ] Run `npm run build:json` to regenerate component JSON files
- [ ] Run `npm run lint` to confirm no JS/CSS errors
- [ ] Commit and push to `main` branch
- [ ] Verify AEM Code Sync runs successfully (check GitHub → Actions)

---

## Notes

- The `component-definition.json`, `component-models.json`, and `component-filters.json` files are **auto-generated** — never edit them manually. Edit the `_*.json` files inside each block folder instead.
- The Husky pre-commit hook (`.husky/pre-commit`) runs `build:json` automatically on every commit once the repo is initialized with `git init`.
- After adding a new block, add its `id` to the `components` array in `models/_section.json` so authors can insert it into page sections via Universal Editor.
