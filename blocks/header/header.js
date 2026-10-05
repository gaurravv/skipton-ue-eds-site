// media query match that indicates desktop width
const isDesktop = window.matchMedia('(width >= 900px)');

/**
 * Fetches the nav fragment: /content first (local preview), then the site root (DA/EDS).
 * @returns {Promise<DocumentFragment|null>} the parsed nav content
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
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
 * Checks whether a link points at the current page.
 * @param {HTMLAnchorElement} link the link
 * @returns {boolean}
 */
function isCurrentPage(link) {
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin || url.hash) return false;
  const linkPath = url.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  const pagePath = window.location.pathname.replace(/\.html$/, '').replace(/\/$/, '');
  return linkPath !== '' && (pagePath === linkPath || pagePath.endsWith(linkPath));
}

/**
 * Splits a list item into its own label text and its nested list.
 * @param {HTMLLIElement} li the list item
 * @returns {{label: string, list: HTMLUListElement|null}}
 */
function splitListItem(li) {
  const list = li.querySelector(':scope > ul');
  const label = [...li.childNodes]
    .filter((node) => node !== list)
    .map((node) => node.textContent)
    .join('')
    .trim();
  return { label, list };
}

/**
 * Builds a click-toggled dropdown from a list item with a nested list.
 * Each nested item becomes a labelled group of links.
 * @param {HTMLLIElement} li the list item holding the toggle label and groups
 * @param {string} id unique id for the panel
 * @returns {HTMLElement} the dropdown element
 */
function buildDropdown(li, id) {
  const { label, list } = splitListItem(li);
  const dropdown = document.createElement('div');
  dropdown.className = 'nav-dropdown';

  const toggle = document.createElement('a');
  toggle.href = `#${id}`;
  toggle.className = 'nav-dropdown-toggle';
  toggle.textContent = label;
  toggle.setAttribute('role', 'button');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-controls', id);

  const panel = document.createElement('div');
  panel.className = 'nav-dropdown-panel';
  panel.id = id;
  panel.hidden = true;

  const groups = document.createElement('ul');
  [...(list?.children || [])].forEach((groupItem) => {
    const group = splitListItem(groupItem);
    const li2 = document.createElement('li');
    const title = document.createElement('span');
    title.className = 'nav-dropdown-group-title';
    title.textContent = group.label;
    li2.append(title);
    if (group.list) {
      group.list.querySelectorAll('a').forEach((a) => {
        if (isCurrentPage(a)) a.setAttribute('aria-current', 'page');
      });
      li2.append(group.list);
    }
    groups.append(li2);
  });
  panel.append(groups);
  dropdown.append(toggle, panel);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    panel.hidden = !open;
  };
  const onToggle = (e) => {
    e.preventDefault();
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  };
  toggle.addEventListener('click', onToggle);
  toggle.addEventListener('keydown', (e) => {
    if (e.code === 'Space') onToggle(e);
  });
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target)) setOpen(false);
  });
  dropdown.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
  dropdown.close = () => setOpen(false);
  return dropdown;
}

/**
 * Builds the utility bar: plain links plus any list items with nested lists as dropdowns.
 * @param {Element} section the fragment section
 * @returns {HTMLElement}
 */
function buildUtility(section) {
  const utility = document.createElement('div');
  utility.className = 'nav-utility';
  const inner = document.createElement('div');
  inner.className = 'nav-utility-inner';

  const links = document.createElement('div');
  links.className = 'nav-utility-links';
  section.querySelectorAll(':scope > p a').forEach((a) => links.append(a));
  inner.append(links);

  section.querySelectorAll(':scope > ul > li').forEach((li, i) => {
    if (li.querySelector(':scope > ul')) inner.append(buildDropdown(li, `nav-dropdown-${i}`));
  });
  utility.append(inner);
  return utility;
}

/**
 * Builds the brand (logo) area.
 * @param {Element} section the fragment section
 * @returns {HTMLElement}
 */
function buildBrand(section) {
  const brand = document.createElement('div');
  brand.className = 'nav-brand';
  const link = section.querySelector('a');
  const logo = section.querySelector('picture') || section.querySelector('img');
  if (link && logo && !link.contains(logo)) {
    link.replaceChildren(logo);
  }
  if (link) brand.append(link);
  return brand;
}

/**
 * Builds the main navigation links.
 * @param {Element} section the fragment section
 * @returns {HTMLElement}
 */
function buildSections(section) {
  const sections = document.createElement('nav');
  sections.className = 'nav-sections';
  sections.setAttribute('aria-label', 'Main navigation');
  const list = section.querySelector('ul');
  if (list) {
    list.querySelectorAll('a').forEach((a) => {
      if (isCurrentPage(a)) a.setAttribute('aria-current', 'page');
    });
    sections.append(list);
  }
  return sections;
}

/**
 * Builds the search form. The authored link supplies the action and placeholder.
 * @param {Element} section the fragment section
 * @returns {HTMLElement}
 */
function buildSearch(section) {
  const tools = document.createElement('div');
  tools.className = 'nav-tools';
  const link = section.querySelector('a');
  if (!link) return tools;

  const form = document.createElement('form');
  form.className = 'nav-search';
  form.setAttribute('role', 'search');
  form.action = link.href;
  form.method = 'get';

  const label = document.createElement('label');
  label.className = 'nav-search-label';
  label.htmlFor = 'nav-search-input';
  label.textContent = link.textContent.trim();

  const icon = document.createElement('span');
  icon.className = 'icon icon-search';
  icon.setAttribute('aria-hidden', 'true');

  const input = document.createElement('input');
  input.id = 'nav-search-input';
  input.type = 'search';
  input.name = 'q';
  input.placeholder = link.textContent.trim();
  input.autocomplete = 'off';

  form.append(label, icon, input);
  tools.append(form);
  return tools;
}

/**
 * Opens or closes the mobile menu.
 * @param {HTMLElement} nav the nav container
 * @param {boolean} [force] optional state to force
 */
function toggleMenu(nav, force) {
  const open = force ?? nav.dataset.menuOpen !== 'true';
  const button = nav.querySelector('.nav-hamburger button');
  nav.dataset.menuOpen = open ? 'true' : 'false';
  button.setAttribute('aria-expanded', open ? 'true' : 'false');
  button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.body.style.overflowY = open && !isDesktop.matches ? 'hidden' : '';
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  if (!fragment) return;
  normalizeLinks(fragment);
  const [utilitySection, brandSection, navSection, toolsSection] = [...fragment.children];

  const nav = document.createElement('div');
  nav.id = 'nav';
  nav.className = 'nav';
  nav.dataset.menuOpen = 'false';

  const main = document.createElement('div');
  main.className = 'nav-main';
  const mainInner = document.createElement('div');
  mainInner.className = 'nav-main-inner';

  const hamburger = document.createElement('div');
  hamburger.className = 'nav-hamburger';
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-expanded="false" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.querySelector('button').addEventListener('click', () => toggleMenu(nav));

  mainInner.append(
    hamburger,
    brandSection ? buildBrand(brandSection) : '',
    navSection ? buildSections(navSection) : '',
    toolsSection ? buildSearch(toolsSection) : '',
  );
  main.append(mainInner);
  nav.append(utilitySection ? buildUtility(utilitySection) : '', main);

  nav.addEventListener('keydown', (e) => {
    if (e.code === 'Escape' && !isDesktop.matches && nav.dataset.menuOpen === 'true') {
      toggleMenu(nav, false);
      hamburger.querySelector('button').focus();
    }
  });

  // reset menu state when crossing the desktop breakpoint
  isDesktop.addEventListener('change', () => {
    toggleMenu(nav, false);
    nav.querySelectorAll('.nav-dropdown').forEach((dropdown) => dropdown.close());
  });

  // compact the header once the page scrolls
  const onScroll = () => nav.classList.toggle('nav-scrolled', window.scrollY > 0);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.textContent = '';
  block.append(navWrapper);
}
