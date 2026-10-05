/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: WKND (AEM Core Components) site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 *
 * NOTE: main .contentaisearch is intentionally empty in the source and MUST be
 * preserved - the search-demo parser targets it.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Mobile nav toggle + mobile nav overlay (cleaned.html lines 282-313,
    // outside <main>): <div id="toggleNav">, <div id="mobileNav" class="cmp-navigation--mobile">
    WebImporter.DOMUtils.remove(element, ['#toggleNav', '#mobileNav']);
  }

  if (hookName === TransformHook.afterTransform) {
    // Header / footer experience fragments (cleaned.html lines 5, 184).
    // These contain sign-in buttons, language navigation, logo, main nav,
    // header search and footer nav/social/copyright.
    WebImporter.DOMUtils.remove(element, [
      'header.experiencefragment',
      'footer.experiencefragment',
      '.cmp-experiencefragment--header',
      '.cmp-experiencefragment--footer',
    ]);

    // Stray <meta> inside the Core Components image wrapper (cleaned.html line 178)
    WebImporter.DOMUtils.remove(element, ['.cmp-image > meta']);

    // Non-authorable technical elements (scripts / data layer, styles, embeds)
    WebImporter.DOMUtils.remove(element, ['script', 'noscript', 'link', 'style', 'iframe']);

    // Strip Core Components data-layer / accessibility attributes (body in cleaned.html)
    [element, ...element.querySelectorAll('*')].forEach((el) => {
      [...el.attributes].forEach((attr) => {
        if (attr.name.startsWith('data-cmp-')) el.removeAttribute(attr.name);
      });
    });
  }
}
