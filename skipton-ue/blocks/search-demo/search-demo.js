function textFor(element) {
  return element?.textContent.trim() || '';
}

function createResult(result) {
  const item = document.createElement('li');
  const title = document.createElement('h3');
  const link = document.createElement('a');
  const description = document.createElement('p');

  link.href = result.href;
  link.textContent = result.title;
  title.append(link);
  description.textContent = result.description;
  item.append(title, description);
  return item;
}

export default function decorate(block) {
  const rows = [...block.children];
  // custom Search Panel component renders all fields in one row;
  // the standard UE block renders one field per row
  const singleRowPanel = rows[0]?.children.length > 1;
  const [labelCell, placeholderCell, buttonCell, helperCell] = singleRowPanel
    ? [...rows[0].children]
    : rows.slice(0, 4).map((row) => row.firstElementChild);
  const resultsRow = singleRowPanel ? rows[1] : null;
  const labelText = textFor(labelCell) || 'Find your next adventure';
  const placeholder = textFor(placeholderCell) || 'Try “family-friendly hiking”';
  const buttonText = textFor(buttonCell) || 'Search';
  const helperText = textFor(helperCell);
  const sampleResults = [...(resultsRow?.children || [])]
    .map((cell) => {
      const paragraphs = cell.querySelectorAll('p');
      return {
        title: textFor(cell.querySelector('strong, h3, h4')) || textFor(cell),
        description: textFor(paragraphs[1]) || 'Sample result for this demonstration.',
        href: cell.querySelector('a')?.href || '/us/en/adventures.html',
      };
    })
    .filter((result) => result.title);
  const authoredResultElements = [...document.querySelectorAll('.sample-result')];
  const authoredResults = authoredResultElements
    .map((result) => ({
      title: textFor(result.querySelector('h3')),
      description: textFor(result.querySelector('p')),
      href: result.querySelector('a')?.href || '/us/en/adventures.html',
    }))
    .filter((result) => result.title);

  const form = document.createElement('form');
  const label = document.createElement('label');
  const input = document.createElement('input');
  const button = document.createElement('button');
  const helper = document.createElement('p');
  const status = document.createElement('p');
  const resultList = document.createElement('ul');

  label.textContent = labelText;
  label.htmlFor = 'ai-search-query';
  input.id = 'ai-search-query';
  input.name = 'query';
  input.type = 'search';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  button.type = 'submit';
  button.textContent = buttonText;
  helper.className = 'search-demo-intro';
  helper.textContent = helperText;
  helper.hidden = !helperText;
  status.className = 'search-demo-status';
  status.setAttribute('aria-live', 'polite');
  resultList.className = 'search-demo-results';
  resultList.hidden = true;

  form.append(label, input, button);
  block.replaceChildren(form, helper, status, resultList);
  block.classList.add('search-demo-ready');
  authoredResultElements.forEach((result) => {
    result.hidden = true;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const query = input.value.trim();

    resultList.replaceChildren(...[...sampleResults, ...authoredResults].map(createResult));
    resultList.hidden = false;
    status.textContent = query
      ? `Showing example results for “${query}”. This is a UI-only demonstration.`
      : 'Showing example results. This is a UI-only demonstration.';
  });
}
