# tabs

Custom **tabs** block. 

## Authoring (Document Authoring)

Model: `container`

Single block table, one row per tab, two cells per row:

| Tabs | |
| --- | --- |
| Tab 1 | (image and/or rich text) |
| Tab 2 | (image and/or rich text) |

- Cell 1: tab label (plain text). Rows with an empty label are not turned into tabs.
- Cell 2: tab panel content (image, headings, paragraphs, links).

The first tab is active on load. Only one panel shows at a time. Arrow Left/Right, Home and End move between tabs.

## Supported variations

No variations.

## Universal Editor fields

- Container block `tabs` (filter `tabs`) holds `tab` items only.
- `tab` item model: `title` (text) is cell 1; `content_image` (reference) and `content_richtext` (richtext) are grouped by the `content_` prefix into cell 2.
