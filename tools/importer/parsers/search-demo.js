/* eslint-disable */
/* global WebImporter */
/**
 * Parser for search-demo. Base: search-demo (custom project block).
 * Source: https://publish-p133255-e1921317.adobeaemcloud.com/content/wknd/us/en/ai-powered-search.html
 * Instance selector: main .contentaisearch
 * Generated: 2026-10-04
 *
 * Block contract (blocks/search-demo/search-demo.js + _search-demo.json, model "search-demo"):
 *   Simple xwalk block: one field per row — label / placeholder / buttonLabel / helper (richtext)
 *   Row 2 (optional): sample results — not emitted (none on source pages).
 *
 * The source AEM component (div.contentaisearch) is rendered client-side and is empty in
 * the server HTML. When no text is found, the block's default values are emitted so
 * authors see editable content in Universal Editor.
 */
const DEFAULTS = {
  label: 'Find your next adventure',
  placeholder: 'Try “family-friendly hiking”',
  buttonLabel: 'Search',
  helper: '',
};

function text(el) {
  return (el && el.textContent ? el.textContent : '').replace(/\s+/g, ' ').trim();
}

export default function parse(element, { document }) {
  // Pull values from the source when present (future pages / pre-rendered markup).
  const labelEl = element.querySelector('label, [class*="label"], h2, h3, h4');
  const inputEl = element.querySelector('input[type="search"], input[type="text"], input:not([type]), input[placeholder]');
  const buttonEl = element.querySelector('button, input[type="submit"], [class*="button"]');
  const helperEl = element.querySelector('[class*="helper"], [class*="intro"], [class*="description"], p');

  const label = text(labelEl) || DEFAULTS.label;
  const placeholder = (inputEl && inputEl.getAttribute('placeholder') || '').trim() || DEFAULTS.placeholder;
  const buttonLabel = text(buttonEl) || (buttonEl && (buttonEl.getAttribute('value') || '').trim()) || DEFAULTS.buttonLabel;
  const helper = helperEl && helperEl !== labelEl ? text(helperEl) : DEFAULTS.helper;

  // Build a cell with a leading xwalk field hint; empty cells get no hint.
  const hinted = (field, value, tag) => {
    if (!value) return '';
    const frag = document.createDocumentFragment();
    frag.appendChild(document.createComment(` field:${field} `));
    if (tag) {
      const node = document.createElement(tag);
      node.textContent = value;
      frag.appendChild(node);
    } else {
      frag.appendChild(document.createTextNode(value));
    }
    return frag;
  };

  const cells = [
    [hinted('label', label)],
    [hinted('placeholder', placeholder)],
    [hinted('buttonLabel', buttonLabel)],
    [hinted('helper', helper, 'p')],
  ];

  const block = WebImporter.Blocks.createBlock(document, { name: 'search-demo', cells });
  element.replaceWith(block);
}
