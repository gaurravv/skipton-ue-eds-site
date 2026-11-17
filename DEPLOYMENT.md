# Deployment handoff

## What this fix changes

The **WKND UE EDS Page** template previously created the custom
`skipton-ue-eds/components/page` and container, backed by the classic Core
Components page. A UE label did not make those pages Franklin/EDS content.

The template now creates:

```text
jcr:content    core/franklin/components/page/v1/page
  root         core/franklin/components/root/v1/root
    section    core/franklin/components/section/v1/section
```

The author-only Universal Editor URL Service configuration selects the
Franklin page resource type for UE. It does not add a blanket `/content/wknd`
path mapping, so classic WKND pages are not redirected to UE by this change.
Existing path mappings take precedence over resource-type selection and must
be reviewed in the target environment.

This repository does not grant IMS permissions, connect the AEM EDS site,
deploy to Cloud Manager, or modify public CDN routes automatically.

## 1. Review the existing author configuration

Before deploying, inspect **Universal Editor URL Service** on the target
Author environment using the permitted administration tooling. Its PID is:

```text
com.day.cq.wcm.core.impl.UniversalEditorURLServiceImpl
```

The shipped `config.author` file supplies:

```json
{
  "resourcetypes": ["core/franklin/components/page/v1/page"]
}
```

OSGi configuration files for this singleton PID are not additive. If the
existing WKND application already manages it, merge this resource type into
that application's single configuration, preserving its other resource types,
`mappings`, domain, and release settings. Do not deploy two competing
configurations for the same PID. Do not replace an existing configuration
with this minimal file without that review.

Keep `/conf/wknd` connected to the existing AEM Authoring EDS site
`gaurravv/skipton-ue-eds-site` and its component definitions/models/filters.
Do not repoint the DA site or change its content connection.

## 2. Build the packages

From the repository root:

```sh
python3 tools/test_ue_template.py
mvn -f aem-package/pom.xml clean verify
mvn -f aem-config-package/pom.xml clean verify
mvn -f aem-template-package/pom.xml clean verify
```

Outputs:

```text
aem-package/target/skipton-ue-eds.ui.apps-1.0.0-SNAPSHOT.zip
aem-config-package/target/skipton-ue-eds.ui.config-1.0.0-SNAPSHOT.zip
aem-template-package/target/skipton-ue-eds.ui.content-1.0.0-SNAPSHOT.zip
```

The split is intentional: application packages contain components, container
packages carry OSGi configuration, and content packages hold mutable `/conf`.
No validation is disabled to build these packages.

## 3. Deploy through the existing AEM application

For AEM as a Cloud Service, integrate:

- `aem-package/src/main/content/jcr_root/apps/skipton-ue-eds` into the
  application's immutable application packaging.
- `aem-config-package/src/main/content/jcr_root/apps/skipton-ue-eds-config`
  into its OSGi configuration packaging, or place the merged configuration in
  the application's established author-only config location.
- `aem-template-package/src/main/content/jcr_root/conf/skipton-ue-eds` into
  its mutable content package with the corresponding filter.

Deploy using the normal full-stack pipeline. The standalone modules retain
`cloudManagerTarget: none`; pushing frontend code through Code Sync does
not install these AEM packages.

If permitted in the DEV environment, install the standalone ZIPs using
Package Manager, application/configuration first and templates afterwards,
after the singleton configuration review above. Review changes under `/conf/skipton-ue-eds`
before installation because the template package owns that configuration.

Do **not** reinstall `aem-content-package` for this fix: it is a separate
migration snapshot that can overwrite authored content. The repair packages
contain no authored `/content` pages.

## 4. Create and validate a fresh page

1. In Sites, open `/content/wknd/us/en`.
2. Select **Create -> Page -> WKND UE EDS Page** and choose a new unused name.
   Keep the existing `ai-powered-search-ue` page untouched.
3. If the template is not listed, confirm deployment, author permissions,
   the site's allowed-template settings, and template enabled status.
   Preserve existing allowed templates; do not replace the list wholesale.
4. Click the Sites **Edit** action. It should open UE, not `/editor.html`.
5. Confirm the new page's `jcr:content` resource type is
   `core/franklin/components/page/v1/page`, its root is Franklin, and its
   section allows the configured content types.
6. Add a Title and Tabs, then add/configure two Tab items. Save, reopen, and
   verify values and permitted movement/Copy/Paste.
7. Verify an existing classic WKND page still opens the classic Page Editor.

If the page is already EDS-compatible but Edit still opens Page Editor,
inspect the *effective* URL Service resource types and higher-priority
path mappings. If UE opens but has no editable controls, investigate the
site connection, permissions, and instrumentation separately.

Pages created using the old template, such as a disposable `another`, are
not automatically migrated. Create and validate a fresh replacement; preserve
any authored values and references before an approved manual content migration
or deletion. Do not fix them by changing just two page properties: their child
nodes may still be classic components.

## 5. Verify EDS delivery separately

Use the configured preview/publication workflow and check the new page first
on its direct EDS Preview URL:

```text
https://main--skipton-ue-eds-site--gaurravv.aem.page/us/en/<new-page-name>
```

After an approved publication, verify the corresponding `.aem.live` URL.
New pages are not automatically allowed by the existing narrow public CDN
route. The existing public migrated page is:

```text
https://publish-p133255-e1921317.adobeaemcloud.com/us/en/ue/ai-powered-search-ue.html
```

No public routing change is part of this fix. Neither a successful package
build nor UE opening proves that Sidekick source discovery, preview,
publication, or arbitrary new public URLs work. Record those checks separately.

The Search Demo block is a static UI example, not a ContentAI/LLM integration.
