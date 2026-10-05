/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import searchDemoParser from './parsers/search-demo.js';
import tabsParser from './parsers/tabs.js';

// TRANSFORMER IMPORTS
import wkndCleanupTransformer from './transformers/wknd-cleanup.js';
import wkndSectionsTransformer from './transformers/wknd-sections.js';

// PARSER REGISTRY
const parsers = {
  'search-demo': searchDemoParser,
  tabs: tabsParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
// rc1/rc2/rc3 form EDS section 1; rc4 (tabs) is EDS section 2.
const PAGE_TEMPLATE = {
  name: 'ai-search-page',
  description: 'WKND AI-powered search landing page',
  urls: [
    'https://publish-p133255-e1921317.adobeaemcloud.com/content/wknd/us/en/ai-powered-search.html',
  ],
  blocks: [
    {
      name: 'search-demo',
      instances: ['main .contentaisearch'],
    },
    {
      name: 'tabs',
      instances: ['main .tabs.panelcontainer'],
    },
  ],
  sections: [
    {
      id: 'rc1',
      name: 'ai-search-panel',
      selector: ['main .contentaisearch'],
      style: null,
      blocks: ['search-demo'],
      defaultContent: [],
    },
    {
      id: 'rc2',
      name: 'page-title',
      selector: ['main > .cmp-container > .aem-Grid > .title', 'main .title'],
      style: null,
      blocks: [],
      defaultContent: ['main .title h1.cmp-title__text'],
    },
    {
      id: 'rc3',
      name: 'page-image',
      selector: ['main > .cmp-container > .aem-Grid > .image', 'main .image'],
      style: null,
      blocks: [],
      defaultContent: ['main .image img.cmp-image__image'],
    },
    {
      id: 'rc4',
      name: 'tabs-gallery',
      selector: ['main .tabs.panelcontainer'],
      style: null,
      blocks: ['tabs'],
      defaultContent: [],
    },
  ],
};

// TARGET PATH OVERRIDES - source path (without /content/wknd) -> EDS document path.
// The UE pilot page is created alongside the existing ContentAI page (see README).
const PATH_OVERRIDES = {
  '/us/en/ai-powered-search': '/us/en/ai-powered-search-ue',
};

// TRANSFORMER REGISTRY
const transformers = [
  wkndCleanupTransformer,
  wkndSectionsTransformer,
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      if (elements.length === 0) {
        console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
      }
      elements.forEach((element) => {
        pageBlocks.push({
          name: blockDef.name,
          selector,
          element,
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

export default {
  transform: (payload) => {
    const { document, url, params } = payload;

    const main = document.body;

    // 1. Initial cleanup
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup
    executeTransformers('afterTransform', main, payload);

    // 5. Built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path (root URL maps to /index)
    // Drop the AEM site root (/content/wknd) so paths match the EDS URLs (/us/en/...)
    const sourcePath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '')
      .replace(/^\/content\/wknd/, '');
    const rawPath = PATH_OVERRIDES[sourcePath] || sourcePath;
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
