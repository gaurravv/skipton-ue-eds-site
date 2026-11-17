/**
 * Quote block.
 * Content contract (same for DA and Universal Editor):
 *   row 1 = quotation (rich text)
 *   row 2 = author (plain text, optional)
 * Cells are moved, not recreated, so Universal Editor instrumentation
 * (data-aue-* / data-richtext-* attributes) stays on the editable elements.
 * @param {Element} block The quote block element
 */
export default function decorate(block) {
  const [quoteRow, authorRow] = [...block.children];

  const figure = document.createElement('figure');
  figure.className = 'quote-figure';

  const quoteCell = quoteRow?.firstElementChild;
  if (quoteCell) {
    const blockquote = document.createElement('blockquote');
    quoteCell.classList.add('quote-text');
    blockquote.append(quoteCell);
    figure.append(blockquote);
  }

  const authorCell = authorRow?.firstElementChild;
  if (authorCell && authorCell.textContent.trim()) {
    const caption = document.createElement('figcaption');
    authorCell.classList.add('quote-author');
    caption.append(authorCell);
    figure.append(caption);
  }

  block.replaceChildren(figure);
}
