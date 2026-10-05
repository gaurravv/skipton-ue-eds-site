/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND sections (template ai-search-page).
 *
 * Desired EDS output = exactly TWO sections:
 *   Section 1 = rc1 (search-demo block) + rc2 (H1 title) + rc3 (image)  -> no breaks between them
 *   Section 2 = rc4 (tabs block)
 * All sections have style null -> no Section Metadata blocks are created.
 *
 * Source structure (migration-work/source-latest.html, lines 534-652):
 *   main > div.cmp-container > div.aem-Grid >
 *     div.contentaisearch (rc1) | div.title (rc2) | div.image (rc3) |
 *     div.separator > div.cmp-separator > hr.cmp-separator__horizontal-rule |
 *     div.tabs.panelcontainer (rc4)
 *
 * Behaviour:
 *  - Removes the Core Components separator (`main .separator`) so its nested <hr>
 *    cannot produce a stray/duplicate break.
 *  - beforeTransform: inserts a marker <hr> before rc4 while the source element
 *    still exists (the tabs parser replaces `main .tabs.panelcontainer` with a
 *    block table before afterTransform runs).
 *  - afterTransform: if the marker is missing, re-locates rc4 via the template
 *    selector OR the generated tabs block (table whose header cell is "Tabs", or
 *    div.tabs) and inserts the <hr>. Then unwraps the layout wrappers
 *    (div.aem-Grid, div.cmp-container) between <main> and the <hr>, so the break
 *    is a direct child of <main>, a sibling of the other top-level content - the
 *    level at which helix-importer turns <hr> into a section break ("---").
 */

const BREAK_ATTR = 'data-wknd-section-break';
const SECTION_BREAK_BEFORE = 'rc4';

function querySection(root, selectors) {
  for (const sel of selectors || []) {
    try {
      const el = root.querySelector(sel);
      if (el) return el;
    } catch (e) {
      // invalid selector - ignore and try next
    }
  }
  return null;
}

function getMain(element) {
  if (element.tagName && element.tagName.toLowerCase() === 'main') return element;
  return element.querySelector('main') || element;
}

// Locate the generated tabs block after the tabs parser ran.
function findTabsBlock(root) {
  const tables = root.querySelectorAll('table');
  for (const table of tables) {
    const firstCell = table.querySelector('tr > th, tr > td');
    if (firstCell && /^\s*tabs\b/i.test(firstCell.textContent || '')) return table;
  }
  // xwalk/div-style block output
  return root.querySelector('div.tabs:not(.panelcontainer)');
}

function removeSeparators(main) {
  // Core Components separator in <main> (source-latest.html line 568-571)
  WebImporter.DOMUtils.remove(main, ['.separator', '.cmp-separator']);
}

export default function transform(hookName, element, payload) {
  const sections = (payload && payload.template && payload.template.sections) || [];
  const target = sections.find((s) => s.id === SECTION_BREAK_BEFORE);

  if (hookName === 'beforeTransform') {
    const main = getMain(element);
    removeSeparators(main);
    if (!target) return;
    if (main.querySelector(`hr[${BREAK_ATTR}]`)) return;
    const rc4 = querySection(main, target.selector);
    if (!rc4) return;
    const hr = element.ownerDocument.createElement('hr');
    hr.setAttribute(BREAK_ATTR, SECTION_BREAK_BEFORE);
    rc4.before(hr);
  }

  if (hookName === 'afterTransform') {
    const main = getMain(element);
    removeSeparators(main);
    if (!target) return;

    let hr = main.querySelector(`hr[${BREAK_ATTR}]`);
    if (!hr) {
      const rc4 = querySection(main, target.selector) || findTabsBlock(main);
      if (!rc4) return; // rc4 not on this page - single section, no break
      hr = element.ownerDocument.createElement('hr');
      hr.setAttribute(BREAK_ATTR, SECTION_BREAK_BEFORE);
      rc4.before(hr);
    }

    // Hoist: unwrap layout wrapper divs between <main> and the <hr> so the break
    // sits at the same level as the other top-level content.
    while (hr.parentElement && hr.parentElement !== main && main.contains(hr.parentElement)) {
      const wrapper = hr.parentElement;
      if (wrapper.tagName.toLowerCase() !== 'div') break;
      wrapper.replaceWith(...wrapper.childNodes);
    }

    // Guarantee a single break: drop any other <hr> left inside <main>
    // (only when a real <main> exists, never across the whole body).
    if (main !== element || main.tagName.toLowerCase() === 'main') {
      main.querySelectorAll('hr').forEach((other) => {
        if (other !== hr) other.remove();
      });
    }

    hr.removeAttribute(BREAK_ATTR);
  }
}
