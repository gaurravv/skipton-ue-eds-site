// keep track of the number of tabs blocks on the page so ids stay unique
let tabsBlockCount = 0;

/**
 * Strips Universal Editor instrumentation from an element and its descendants.
 * The tab label is copied into a button, so the copy must not register as a
 * second editable node in the UE content tree.
 * @param {Element} el
 */
function stripInstrumentation(el) {
  [el, ...el.querySelectorAll('*')].forEach((node) => {
    [...node.attributes]
      .map(({ name }) => name)
      .filter((name) => name.startsWith('data-aue-') || name.startsWith('data-richtext-'))
      .forEach((name) => node.removeAttribute(name));
  });
}

/**
 * loads and decorates the tabs block
 * one row per tab: cell 1 = tab label, cell 2 = tab content
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  tabsBlockCount += 1;
  const blockId = tabsBlockCount;

  const tablist = document.createElement('div');
  tablist.className = 'tabs-list';
  tablist.setAttribute('role', 'tablist');
  tablist.id = `tablist-${blockId}`;

  // only rows with a non-empty label cell become tabs
  const rows = [...block.children].filter(
    (row) => row.firstElementChild && row.firstElementChild.textContent.trim(),
  );

  const tabs = [];
  const panels = [];

  const activate = (index, focus = false) => {
    tabs.forEach((tab, i) => {
      const selected = i === index;
      tab.setAttribute('aria-selected', selected);
      tab.tabIndex = selected ? 0 : -1;
      panels[i].setAttribute('aria-hidden', !selected);
    });
    if (focus) tabs[index].focus();
  };

  rows.forEach((row, i) => {
    const id = `tabpanel-${blockId}-tab-${i + 1}`;
    const [labelCell, ...contentCells] = [...row.children];

    // the row itself becomes the panel (keeps UE instrumentation on the item)
    const panel = row;
    panel.className = 'tabs-panel';
    panel.id = id;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `tab-${id}`);
    panel.tabIndex = 0;
    contentCells.forEach((cell) => cell.classList.add('tabs-panel-content'));

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'tabs-tab';
    button.id = `tab-${id}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', id);
    button.innerHTML = labelCell.innerHTML;
    stripInstrumentation(button);
    button.addEventListener('click', () => activate(i));

    tablist.append(button);
    labelCell.remove();

    tabs.push(button);
    panels.push(panel);
  });

  tablist.addEventListener('keydown', (e) => {
    const current = tabs.indexOf(document.activeElement);
    if (current < 0) return;
    let next;
    if (e.key === 'ArrowRight') next = (current + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = tabs.length - 1;
    else return;
    e.preventDefault();
    activate(next, true);
  });

  if (tabs.length) activate(0);
  block.prepend(tablist);
}
