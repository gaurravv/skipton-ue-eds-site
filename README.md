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

The URLs above become available only after the repository is created in GitHub
and connected as an AEM Authoring EDS site. Do not point the current DA site at
this repository.

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

The component palette configuration is in:

```text
component-definition.json
component-models.json
component-filters.json
```

They define the Edge Delivery page, section, default content (text, title,
image, button), and the Tabs and Search Demo blocks, along with the repository's
cards, columns, fragment and hero blocks. The classic Search Hero, Search Panel,
Sample Result and AI Disclaimer components from `aem-package` are kept in their
own legacy group; they are not the new Franklin template's block implementation.

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
