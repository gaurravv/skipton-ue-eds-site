# Skipton UE + EDS Demo

This repository is the presentation layer for the AI-Powered Search coexistence
demo. Content is authored in AEM through Universal Editor and delivered through
Edge Delivery Services (EDS).

The interactive search experience intentionally uses static, authored sample
results. It does not call AEM ContentAI, a search index, an LLM, or any other
external service.

## Environments
- Preview: `https://main--skipton-ue-eds-site--gaurravv.aem.page/`
- Live: `https://main--skipton-ue-eds-site--gaurravv.aem.live/`

The repository is connected to AEM Author as an AEM Authoring EDS site. Do
not point the Document Authoring site at this repository.

## Included AEM configuration packages

The page-creation setup uses separate FileVault package types:

- `aem-package/` (`application`): `/apps/skipton-ue-eds`. Legacy custom
  components remain available for existing content; new EDS pages do not use them.
- `aem-config-package/` (`container`): `/apps/skipton-ue-eds-config`, with
  author-only Universal Editor URL Service configuration for
  `core/franklin/components/page/v1/page`.
- `aem-template-package/` (`content`): `/conf/skipton-ue-eds`, including the
  **WKND UE EDS Page** template. Its initial content uses the Franklin page,
  root, and section components, matching the migrated EDS page rather than
  extending the classic Core Components page. Legacy policies are retained,
  but are no longer attached to this EDS template.

Build and check from the repository root:

```sh
python3 tools/test_ue_template.py
mvn -f aem-package/pom.xml clean verify
mvn -f aem-config-package/pom.xml clean verify
mvn -f aem-template-package/pom.xml clean verify
```

Deploy `/apps` through the existing application's immutable package and `/conf`
through its mutable content package. Do not mix the two into `ui.apps`.
See [DEPLOYMENT.md](DEPLOYMENT.md) for editor-service configuration merging,
installation, and verification.

None of these packages includes authored `/content` pages. After
deployment, use **Create → Page → WKND UE EDS Page** under
`/content/wknd/us/en`, choose a new page name, and click **Edit**. The intended
result is Universal Editor with an empty EDS section ready for content.

Existing pages created with the former classic-based template are not migrated
by this update. For a disposable page such as `another`, create a fresh page
after deployment, validate it, and remove the old one only after preserving
any needed content. Do not change only its resource type or reinstall the
migrated content snapshot to repair it.

## Migrated content package

`aem-content-package/` is a FileVault content package with the migrated
Edge Delivery pages and the header/footer images:

- `/content/wknd/us/en/ai-powered-search-ue`: the AI-Powered Search page
  (Search Panel, title, image, Tabs);
- `/content/wknd/nav` and `/content/wknd/footer`: header and footer content;
- `/content/dam/skipton-ue-eds`: logos and social icons used by the nav and footer.

Page images reference existing assets under `/content/dam/wknd-shared`. The
filter only covers the paths above, so other WKND content is not touched.
Build it with `mvn clean package` in `aem-content-package/` and upload the ZIP
in Package Manager.

## Connecting the repository to AEM author

- `fstab.yaml` mounts the AEM author instance
  `author-p133255-e1921317` as the content source.
- `paths.json` maps `/content/wknd/` to `/`, so
  `/content/wknd/us/en/ai-powered-search-ue` is served as
  `/us/en/ai-powered-search-ue` and the nav/footer pages as `/nav` and `/footer`.

The WKND site configuration (`/conf/wknd`) also needs an Edge Delivery Services
configuration pointing at `gaurravv/skipton-ue-eds-site`, so that Universal
Editor loads the component configuration from this repository.

## Shared publish domain

The site runs behind `publish-p133255-e1921317.adobeaemcloud.com` together with
classic WKND pages (AEM Publish) and the Document Authoring site
`skipton-eds-demo`. To keep the two Edge Delivery origins from colliding, this
site owns two URL prefixes:

- `/skipton-ue/`: all code (`blocks`, `scripts`, `styles`, `icons`, `fonts`,
  following Adobe's "Change Site Root" pattern) plus the nav and footer
  documents (`/content/wknd/skipton-ue/nav` and `/footer` in AEM);
- `/us/en/ue/`: the public URL of the AI-Powered Search page, so its
  page-relative media (`/us/en/ue/media_*`) does not collide with the DA pages.

`tools/cdn/cdn.yaml` is the CDN configuration for the WKND Cloud Manager config
pipeline that routes these prefixes.

## Universal Editor configuration

The component palette configuration is in three files at the repository root:

- `component-definition.json`: the component palette. Each entry names the AEM
  resource type and the block name it renders as.
- `component-models.json`: the fields shown in the properties panel.
- `component-filters.json`: which components may be placed inside which
  container (main, section, or a block such as Cards or Tabs).

The palette groups are:

- **Default content:** Text, Title, Image, Button.
- **Sections:** Section.
- **Blocks:** Cards (Card), Columns, Fragment, Hero, Tabs (Tab) and
  Search Demo. These use `core/franklin/components/block/v1/block`.
- **WKND - Universal Editor (classic template):** Search Hero, Search Panel,
  Sample Result and AI Disclaimer. These are classic HTL components from
  `aem-package` (`skipton-ue-eds/components/...`), kept for content created with
  the former classic template. They are not part of the Franklin EDS template.

Do not edit these three files by hand; they are generated. Each block keeps its
definition, model and filters in `skipton-ue/blocks/<name>/_<name>.json`, and
default content, section, page metadata and the legacy group live in
`models/_*.json`. `models/_component-*.json` stitch the partials together.
Run `npm run build:json` to regenerate the root files, and commit them.

After changing them, push to `main`; AEM Author reads them from
`main--skipton-ue-eds-site--gaurravv.aem.live`. Reload Universal Editor (clear
its cache if needed) to see palette changes.

## How the code flows

1. **Authoring:** authors edit pages under `/content/wknd` in Universal Editor
   on AEM Author. AEM renders the page with `data-aue-*` attributes so the
   editor can select and edit blocks and fields.
2. **Publishing:** Publish in Universal Editor sends the page to EDS, using the
   AEM environment's technical account (it must have the publish role in the
   site configuration). `fstab.yaml` and `paths.json` tell EDS where to fetch the
   content and how to map `/content/wknd/...` to public URLs.
3. **Browser:** EDS serves semantic HTML plus `head.html`, which loads
   `/skipton-ue/scripts/aem.js`, `/skipton-ue/scripts/scripts.js` and
   `/skipton-ue/styles/styles.css`. `aem.js` derives
   `window.hlx.codeBasePath = /skipton-ue` from the `scripts.js` URL, so every
   block, icon and font loads from `/skipton-ue/...`. `loadPage()` runs:
   - **`loadEager`:** `decorateMain` (icons, fragment auto-blocks, sections,
     blocks, buttons), then loads only the first section for a fast Largest
     Contentful Paint.
   - **`loadLazy`:** header, remaining sections, footer, `lazy-styles.css`, fonts.
   - **`loadDelayed`:** imports `delayed.js` after 3 seconds.
4. **Blocks:** for each block, `aem.js` loads
   `/skipton-ue/blocks/<name>/<name>.css` and `<name>.js` and calls
   `decorate(block)`.
5. **Live editing (Universal Editor only):** `scripts/editor-support.js`
   listens for `aue:content-patch`, `-update`, `-add`, `-move`, `-remove` and
   `-copy` events. It sanitises the updated HTML with DOMPurify, replaces only
   the changed block, section or default content, re-runs the decoration and
   `loadBlock`, and reloads the page if it cannot apply the change in place.
   `scripts/editor-support-rte.js` makes rich-text fields
   editable inline.

The block code and runtime are the same as in the Document Authoring site
(`skipton-eds-demo`); only the authoring source and the editor glue differ.

## Documentation

See `DEPLOYMENT.md` for the exact handoff sequence: deploy the AEM package,
register the AEM Authoring EDS site, configure UE access, author the pilot
page, publish to EDS, then add the narrowly scoped CDN route.

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create the `gaurravv/skipton-ue-eds-site` repository from this project
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
