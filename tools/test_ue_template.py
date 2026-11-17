"""Regression checks for EDS page creation and editor selection."""

import json
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CONTENT = Path("src/main/content/jcr_root")
TEMPLATE = (
    ROOT / "aem-template-package" / CONTENT
    / "conf/skipton-ue-eds/settings/wcm/templates/ue-eds-page"
)
TYPE = TEMPLATE.parents[1] / "template-types/ue-eds-page/.content.xml"
NS = {
    "jcr": "http://www.jcp.org/jcr/1.0",
    "sling": "http://sling.apache.org/jcr/sling/1.0",
    "cq": "http://www.day.com/jcr/cq/1.0",
}
RESOURCE_TYPE = f"{{{NS['sling']}}}resourceType"
PAGE_TYPE = "core/franklin/components/page/v1/page"


class UETemplateTest(unittest.TestCase):
    def test_creation_and_structure_use_eds_nodes(self):
        definitions = ET.parse(TYPE).getroot()
        for variant in ("initial", "structure"):
            roots = (
                ET.parse(TEMPLATE / variant / ".content.xml").getroot(),
                definitions.find(variant),
            )
            for root in roots:
                with self.subTest(variant=variant, root=root.tag):
                    page = root.find("jcr:content", NS)
                    self.assertEqual(page.get(RESOURCE_TYPE), PAGE_TYPE)
                    container = page.find("root")
                    self.assertEqual(
                        container.get(RESOURCE_TYPE),
                        "core/franklin/components/root/v1/root",
                    )
                    if variant == "initial":
                        section = container.find("section")
                        self.assertEqual(
                            section.get(RESOURCE_TYPE),
                            "core/franklin/components/section/v1/section",
                        )
                        self.assertEqual(section.get("model"), "section")
                        self.assertIsNone(page.get(f"{{{NS['jcr']}}}title"))

    def test_no_classic_policies_are_attached_to_eds_template(self):
        for path in (TEMPLATE / "policies").rglob(".content.xml"):
            for node in ET.parse(path).iter():
                self.assertIsNone(node.get(f"{{{NS['cq']}}}policy"), str(path))

    def test_only_eds_pages_are_explicitly_opened_in_ue(self):
        config = (
            ROOT / "aem-config-package" / CONTENT
            / "apps/skipton-ue-eds-config/config.author"
            / "com.day.cq.wcm.core.impl.UniversalEditorURLServiceImpl.cfg.json"
        )
        self.assertEqual(json.loads(config.read_text())["resourcetypes"], [PAGE_TYPE])
        self.assertNotIn("mappings", json.loads(config.read_text()))
        fixture = (
            ROOT / "aem-content-package" / CONTENT
            / "content/wknd/us/en/ai-powered-search-ue/.content.xml"
        )
        migrated = ET.parse(fixture).getroot().find("jcr:content", NS)
        self.assertEqual(migrated.get(RESOURCE_TYPE), PAGE_TYPE)

    def test_package_filters_separate_apps_and_conf_without_authored_pages(self):
        for module, expected in (
            ("aem-package", "/apps/skipton-ue-eds"),
            ("aem-config-package", "/apps/skipton-ue-eds-config"),
            ("aem-template-package", "/conf/skipton-ue-eds"),
        ):
            filter_file = ROOT / module / "src/main/content/META-INF/vault/filter.xml"
            filters = ET.parse(filter_file).getroot().findall("filter")
            self.assertEqual([item.get("root") for item in filters], [expected])


if __name__ == "__main__":
    unittest.main()
