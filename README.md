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

## Included AEM package

`aem-package/` is a standalone FileVault content package that provides:

- the **WKND UE EDS Page** editable template;
- a UE page component;
- Search Hero, Search Panel, Sample Result, and AI Disclaimer components;
- template policies which allow those components in the page container.

Build it with:

```sh
cd aem-package
mvn clean package
```

Install the produced ZIP in the target AEM Cloud Service environment as part of
the existing AEM application's `ui.apps` package, or upload it to the Package
Manager in a non-production environment. The target project must provide the
Core Components dependency used by the editable template policies.

The package creates no customer content and does not overwrite the existing
`/content/wknd/us/en/ai-powered-search` ContentAI page. After deployment, use
**Create → Page → WKND UE EDS Page** under `/content/wknd/us/en` and create the
pilot page as `ai-powered-search-ue`.

Note: the WKND UE EDS Page template extends the classic Core Components page
(`core/wcm/components/page/v3/page`), which Edge Delivery cannot render. Pages
for this site should use the Edge Delivery page component
(`core/franklin/components/page/v1/page`), as the content package below does.

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
own group for the WKND UE EDS Page template.

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

1. Create the `gaurravv/skipton-ue-eds-demo` repository from this project
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)
