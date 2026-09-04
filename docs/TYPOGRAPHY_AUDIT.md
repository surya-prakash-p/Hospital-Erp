# Application typography audit — 4 September 2026

## Findings and fixes

The app already loaded Plus Jakarta Sans through Next.js, but font configuration was duplicated in the Tailwind config and global CSS. Monospace utilities selected another family, and the font variable was scoped to the body while font tokens were declared globally. Numerous headings still use the legacy `font-serif` class.

- Moved the Next font variable to the document root so all UI descendants and portalled dialogs share it.
- Made global CSS the single font-family source using inline Tailwind theme tokens.
- Mapped `font-sans`, legacy `font-serif`, and legacy `font-mono` to Plus Jakarta Sans.
- Replaced blanket universal font overrides with normal inheritance and base rules for form controls.
- Preserved numeric alignment for legacy monospace fields using tabular figures.
- Kept existing font sizes, weights, and spacing, except that non-heading elements using `font-serif` no longer receive heading-specific letter spacing.

These shared rules apply to the dashboard, clinic pages, pharmacy, finance, supporting modules, sidebar, header, tables, forms, and dialogs. No live application inline font-family override was found; explicit alternate font declarations were in export templates.

## Verification

- Production build passed.
- Project lint passed with existing warnings.
- Browser verification on the login screen confirmed the font loaded successfully.
- Computed fonts matched for the document root, body, headings, paragraphs, labels, inputs, and buttons. The formerly monospace employee ID input retained tabular numbers in the same font.
- Authenticated pages and dialogs were covered by the shared CSS/source audit, not individually browser-tested.

## Export boundary

Separate browser print documents in billing, patient profiles, pharmacy, and finance still define their own font stacks. PDF generators use embedded/default Helvetica. These are separate output documents and do not inherit the app stylesheet. They were identified but not modified by this screen-typography change. Matching those exports requires loading/embedding the chosen font and checking pagination and print timing.

## Maintenance

Use `font-sans` for new UI text and `tabular-nums` for aligned numeric fields. Do not introduce per-page fonts or duplicate font-family settings in the Tailwind config. Continue to load the app font once in the root layout. Legacy serif/mono utility classes remain supported for existing components.
