/**
 * Fetches the footer fragment from the site folder, falling back to the local preview copy.
 * @returns {Promise<DocumentFragment|null>} the parsed footer content
 */
async function fetchFooter() {
  // the site's own folder first (shared publish domains), then the local preview copy
  let resp = await fetch(`${window.hlx.codeBasePath}/footer.plain.html`);
  if (!resp.ok) resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) return null;
  const template = document.createElement('template');
  template.innerHTML = await resp.text();
  // image paths in the fragment are relative to the fragment, not the page
  template.content.querySelectorAll('img[src]').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), resp.url).href;
  });
  template.content.querySelectorAll('source[srcset]').forEach((source) => {
    source.srcset = source.getAttribute('srcset').split(',').map((candidate) => {
      const [url, descriptor] = candidate.trim().split(/\s+/);
      return [new URL(url, resp.url).href, descriptor].filter(Boolean).join(' ');
    }).join(', ');
  });
  return template.content;
}

/**
 * Removes button decoration that authoring may add to plain links,
 * and unwraps paragraphs that authoring adds inside list items.
 * @param {Element} section the fragment section
 */
function normalizeLinks(section) {
  section.querySelectorAll('a.button').forEach((a) => a.classList.remove('button'));
  section.querySelectorAll('.button-container').forEach((p) => p.classList.remove('button-container'));
  section.querySelectorAll('li > p').forEach((p) => p.replaceWith(...p.childNodes));
}

/**
 * Marks links that point at the current page.
 * @param {Element} scope the element containing the links
 */
function markCurrentPage(scope) {
  const pagePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  scope.querySelectorAll('a[href]').forEach((a) => {
    const url = new URL(a.href, window.location.href);
    if (url.origin !== window.location.origin || url.hash) return;
    const linkPath = url.pathname.replace(/\.html$/, '').replace(/\/$/, '');
    if (linkPath && (pagePath === linkPath || pagePath.endsWith(linkPath))) {
      a.setAttribute('aria-current', 'page');
    }
  });
}

/**
 * Wraps a fragment section's children in a new element.
 * @param {Element} section the fragment section
 * @param {string} className class for the wrapper
 * @param {string} [tag] wrapper tag name
 * @returns {HTMLElement}
 */
function wrapSection(section, className, tag = 'div') {
  const wrapper = document.createElement(tag);
  wrapper.className = className;
  wrapper.append(...section.childNodes);
  return wrapper;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  if (!fragment) return;
  normalizeLinks(fragment);
  const [brandSection, navSection, socialSection, legalSection] = [...fragment.children];

  const top = document.createElement('div');
  top.className = 'footer-top';
  if (brandSection) {
    const link = brandSection.querySelector('a');
    const logo = brandSection.querySelector('picture') || brandSection.querySelector('img');
    if (link && logo && !link.contains(logo)) {
      link.replaceChildren(logo);
      brandSection.replaceChildren(link);
    }
    top.append(wrapSection(brandSection, 'footer-brand'));
  }
  if (navSection) {
    const nav = wrapSection(navSection, 'footer-nav', 'nav');
    nav.setAttribute('aria-label', 'Footer navigation');
    markCurrentPage(nav);
    top.append(nav);
  }
  if (socialSection) {
    const social = wrapSection(socialSection, 'footer-social');
    social.querySelectorAll('a').forEach((a) => {
      const label = a.querySelector('img')?.alt;
      if (label) a.setAttribute('aria-label', label);
    });
    top.append(social);
  }

  const inner = document.createElement('div');
  inner.className = 'footer-inner';
  inner.append(top);
  if (legalSection) inner.append(wrapSection(legalSection, 'footer-legal'));

  block.textContent = '';
  block.append(inner);
}
