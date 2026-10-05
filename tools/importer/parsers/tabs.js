/* eslint-disable */
/* global WebImporter */
/**
 * Parser for tabs. Base: tabs.
 * Source: https://publish-p133255-e1921317.adobeaemcloud.com/content/wknd/us/en/ai-powered-search.html
 * Instance selector: main .tabs.panelcontainer (AEM Core Components Tabs: div.cmp-tabs)
 * Generated: 2026-10-04
 *
 * Block contract (blocks/tabs/_tabs.json, item model "tab"):
 *   Row 1: Tabs (block name)
 *   Row N: [ title | content_image + content_richtext ]
 *   - cell 1: label text from li.cmp-tabs__tab        <!-- field:title -->
 *   - cell 2: panel image (.cmp-image img)             <!-- field:content_image -->
 *             any rich text in the panel               <!-- field:content_richtext -->
 *
 * Tab <-> panel matching: li[aria-controls] == panel[id], or panel[aria-labelledby] == li[id],
 * falling back to position. Iterates the tabpanel divs (block-level, iterationSafe).
 */
export default function parse(element, { document }) {
  const root = element.querySelector('.cmp-tabs') || element;

  const tabs = [...root.querySelectorAll('.cmp-tabs__tablist > .cmp-tabs__tab, [role="tablist"] > [role="tab"]')]
    .filter((t, i, arr) => arr.indexOf(t) === i);
  let panels = [...root.querySelectorAll(':scope > .cmp-tabs__tabpanel')];
  if (!panels.length) panels = [...root.querySelectorAll('.cmp-tabs__tabpanel, [role="tabpanel"]')]
    .filter((p) => !p.parentElement.closest('.cmp-tabs__tabpanel, [role="tabpanel"]'));

  const clean = (s) => (s || '').replace(/\s+/g, ' ').trim();

  const findTab = (panel, idx) => {
    const id = panel.getAttribute('id');
    const labelledBy = panel.getAttribute('aria-labelledby');
    return (id && tabs.find((t) => t.getAttribute('aria-controls') === id))
      || (labelledBy && tabs.find((t) => t.getAttribute('id') === labelledBy))
      || tabs[idx]
      || null;
  };

  const cells = [];

  panels.forEach((panel, idx) => {
    const tab = findTab(panel, idx);
    const label = clean(tab && tab.textContent) || clean(panel.getAttribute('data-panel-title')) || `Tab ${idx + 1}`;

    // Cell 1: title
    const titleCell = document.createDocumentFragment();
    titleCell.appendChild(document.createComment(' field:title '));
    titleCell.appendChild(document.createTextNode(label));

    // Cell 2: content_image + content_richtext
    const contentCell = document.createDocumentFragment();

    const srcImg = panel.querySelector('.cmp-image img, img');
    if (srcImg) {
      const img = document.createElement('img');
      img.src = srcImg.src || srcImg.getAttribute('src') || srcImg.getAttribute('data-src') || '';
      const alt = srcImg.getAttribute('alt');
      if (alt) img.alt = alt;
      contentCell.appendChild(document.createComment(' field:content_image '));
      contentCell.appendChild(img);
    }

    // Rich text: Core text/title components, or loose headings/paragraphs/lists outside image components.
    const textNodes = [...panel.querySelectorAll('.cmp-text, .cmp-title, h1, h2, h3, h4, h5, h6, p, ul, ol')]
      .filter((el) => !el.closest('.cmp-image'))
      .filter((el) => !el.parentElement.closest('.cmp-text, .cmp-title, p, ul, ol'))
      .filter((el) => clean(el.textContent));
    if (textNodes.length) {
      contentCell.appendChild(document.createComment(' field:content_richtext '));
      textNodes.forEach((el) => {
        if (el.matches('.cmp-text')) {
          [...el.childNodes].forEach((n) => contentCell.appendChild(n));
        } else if (el.matches('.cmp-title')) {
          const h = el.querySelector('h1, h2, h3, h4, h5, h6');
          contentCell.appendChild(h || el);
        } else {
          contentCell.appendChild(el);
        }
      });
    }

    cells.push([titleCell, contentCell.childNodes.length ? contentCell : '']);
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const block = WebImporter.Blocks.createBlock(document, { name: 'tabs', cells });
  element.replaceWith(block);
}
