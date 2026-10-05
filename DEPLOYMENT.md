# Deployment handoff

## What this repository provides

- An EDS front end with the `search-demo` block.
- Universal Editor palette definitions in `component-definition.json`,
  `component-models.json`, and `component-filters.json`.
- A standalone AEM FileVault package at `aem-package/`.

It does not create an Adobe Cloud Manager EDS site, grant Adobe IMS permissions,
or change the Managed CDN. Those are environment-owned operations.

## 1. Create and connect the GitHub repository

1. Create `gaurravv/skipton-ue-eds-site`.
2. Push this project as its initial content.
3. Install the AEM Code Sync GitHub App for the repository.
4. In Cloud Manager, create an AEM Authoring EDS site that uses this repository
   and the intended branch.
5. Record the generated `.aem.page` and `.aem.live` URLs.

Do not replace the existing `skipton-eds-demo` DA site or change its `fstab.yaml`.

## 2. Build and deploy the AEM package

```sh
cd aem-package
mvn clean package
```

The output is:

```text
target/skipton-ue-eds.ui.apps-1.0.0-SNAPSHOT.zip
```

For Cloud Manager, add `aem-package/src/main/content/jcr_root` to the existing
WKND application's `ui.apps` module under the same paths, then deploy its
normal full-stack pipeline. For a DEV-only proof of concept, install the ZIP in
AEM Package Manager.

After deployment, verify that this template appears in AEM Sites:

```text
Create -> Page -> WKND UE EDS Page
```

## 3. Configure Universal Editor

Configure the AEM Authoring EDS site to load the three component configuration
files from this repository. Grant demo authors permission to:

- create pages below `/content/wknd/us/en`;
- read the `/conf/skipton-ue-eds` configuration;
- edit the new UE page; and
- open the page in Universal Editor.

The exact EDS-site registration UI and IMS policy names vary by Adobe
organization, so they are intentionally not hard-coded in this project.

## 4. Create the pilot page

1. In AEM Sites, open `/content/wknd/us/en`.
2. Select **Create -> Page -> WKND UE EDS Page**.
3. Set the name to `ai-powered-search-ue`.
4. Open **Edit in Universal Editor**.
5. Add one Search Hero, one Search Panel, two Sample Result components, and
   one AI Disclaimer.
6. Publish the page.

The sample-result components supply the static cards revealed by the search
panel. No component calls a search or AI service.

## 5. Verify EDS before changing the public domain

Confirm that the new page is visible on the AEM Authoring EDS Preview URL, then
publish it and confirm the same page on EDS Live. Validate:

- title, introduction, panel labels, and disclaimer are editable in UE;
- reordering Sample Result components changes the published result order;
- submitting the form only reveals the authored static cards; and
- no request is sent to ContentAI or an external service.

## 6. Add the narrow CDN route

Only when EDS Live is correct, add a DEV CDN selector that maps:

```text
/us/en/ai-powered-search.html
```

to the new UE EDS origin. Keep FAQ and About Us on the current DA EDS origin.
Removing only this selector is the rollback: the existing AEM Publish
AI-Powered Search page remains untouched.
