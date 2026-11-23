# Balance redesign plan

Status: planned, not yet implemented. Nine small tasks in five phases, written for the Band team
(Express Lead briefs, Express Author builds, Express Reviewer reviews). Visual mockups, tokens and
the same briefs live in the published design page (shared separately).

## Decisions

- The name stays **Balance**, with the lowercase wordmark.
- The theme **follows the system** by default, with a visible System / Light / Dark toggle.
- Cards render from **server HTML fragments**; one template, no duplicated client markup.
- A **Center** nav item and a `/center` route are added alongside All, Left and Right.

## Direction

- **Balance is the hero.** A thin spectrum meter shows today's Left / Center / Right split; the same
  three hues appear on lane headers and a 3px card edge. Colour is never the only signal: the source
  and lane name are always printed.
- **Quiet chrome, loud headlines.** Near-black ink (or soft white), one indigo accent, hairline
  borders. Headlines use the display face.
- **One drawer, not two dialogs.** Context, tags and notes in a single side sheet (bottom sheet on
  phones), with the original link one click away.
- **Findable.** Command-style search (`/`), counted tag chips that filter every lane, a real Center
  view.

## Tokens

All colours are CSS custom properties: light values on `:root`, dark values under
`@media (prefers-color-scheme: dark)` guarded with `:root:not([data-theme="light"])`, and the same dark
values under `:root[data-theme="dark"]`. Both dark blocks also set `color-scheme: dark`.

| Token           | Light     | Dark      |
| --------------- | --------- | --------- |
| `--bg`          | `#F5F6F9` | `#0A0C11` |
| `--surface`     | `#FFFFFF` | `#11141B` |
| `--surface-2`   | `#EEF0F5` | `#181C26` |
| `--border`      | `#DDE1EA` | `#242A38` |
| `--fg`          | `#12151C` | `#E8EBF2` |
| `--fg-2`        | `#4B5468` | `#A3ACBF` |
| `--fg-3`        | `#6B7489` | `#8791A6` |
| `--accent`      | `#4F5DF0` | `#8B97FF` |
| `--accent-soft` | `#E6E8FD` | `#1D2140` |
| `--left`        | `#2563EB` | `#6AA6FF` |
| `--center`      | `#0B8F6C` | `#3DD6A8` |
| `--right`       | `#D63F31` | `#FF8576` |

Type: `--font-display` Space Grotesk (600/700) for headlines and the wordmark; `--font-ui` Inter
(400/500/600) for everything else; tabular numerals for times and counts. Spacing on a 4px base.
Radius 8 / 12 / 14-18 / 999. Motion 150-200ms ease-out, disabled under `prefers-reduced-motion`.

## Ground rules for every task

- Branch from `master`; one commit per task; do not push (Claude reviews and pushes).
- Gate: `npm run lint`, `npx prettier --check .` (includes CSS and Markdown) and
  `npm run test:coverage` (78% lines/statements, 70% functions, 60% branches).
- CSP is `script-src 'self'` and `connect-src 'self'`: no inline scripts or handlers, no third-party
  scripts. Google Fonts are already allowed.
- Do T0.2 before restyling cards, otherwise the card markup has to be changed in two places.
- Rename a selector from the contract below only in the same commit that updates the tests using it.

## Selector contract

| Selector / id                                                    | Used by                  | Notes                                                 |
| ---------------------------------------------------------------- | ------------------------ | ----------------------------------------------------- |
| `.article-card[data-id][data-tags]`                              | tag save, client tests   | `data-tags` is JSON; saves update every copy.         |
| `.btn-tag`, `.btn-comment`                                       | open dialogs             | Become drawer triggers in T3.1.                       |
| `#tag-dialog-<id>`, `#tag-current-<id>`, `#tag-suggestions-<id>` | tag editor, tags.test.js | Ids must stay unique, including in search results.    |
| `.tag-remove[data-tag]`, `.tag-save-btn[data-id]`                | tag editor               | Save response includes `allTags` from the server.     |
| `#search-input`, `#search-results`, `#main-content`              | search, search.test.js   | Feed is detached into `feedStash` while results show. |
| `#tag-datalist`, `.btn-load-more`                                | autocomplete, pagination | Keep the cursor-based pagination contract.            |

## Tasks

### Phase 0: Foundations

Tokens first, and one source of truth for the card, so the redesign isn’t built twice.

#### T0.1 Design tokens, fonts, light and dark (Small)

Introduce the token file and theme mechanism without changing layout.

```text
Task T0.1 — design tokens and theming (no layout change).
Branch from master. Add public/css/tokens.css with the CSS custom properties from the Tokens table in docs/redesign-plan.md: --bg, --surface, --surface-2, --border, --fg, --fg-2, --fg-3, --accent, --accent-soft, --left, --center, --right, plus --font-ui (Inter) and --font-display (Space Grotesk). Light values on :root; dark values under @media (prefers-color-scheme: dark) guarded with :root:not([data-theme="light"]); the same dark values again under :root[data-theme="dark"]; set color-scheme: dark in both dark blocks. Link tokens.css before style.css in views/layouts/main.handlebars and load Inter + Space Grotesk from Google Fonts (already allowed by CSP). Replace colour literals in public/css/style.css with tokens.
Done when:
- grep finds no hex/rgb colour literals in style.css outside tokens.css
- page renders in both OS themes with the existing markup and layout unchanged
- body has an explicit token background
- npm run lint, npx prettier --check . and npm run test:coverage pass
- changes limited to public/css/*.css and views/layouts/main.handlebars
```

#### T0.2 One card template (Medium)

Remove the duplicated card and dialog markup so later phases change it once.

```text
Task T0.2 — single source of truth for article cards.
Today the card + note dialog + tag dialog markup lives in views/partials/articleCard.handlebars and again in buildCard() in public/js/app.js (used by Load more and search). Make the server partial the only template: add GET /fragments/cards?filter=left|center|right&before=<_id> and GET /fragments/search?q=&filter= that render the partial and return HTML; the client inserts the returned HTML for Load more and search results. Keep /api/articles and /api/search JSON endpoints and their tests. Delete buildCard(). Preserve the Selector contract table in docs/redesign-plan.md so existing tests keep passing, or update those tests in the same commit.
Done when:
- buildCard() no longer exists; there is exactly one card template
- Load more and search render identical cards to the initial page (same classes, ids, data attributes)
- new route tests cover both fragment endpoints (valid, invalid filter -> 400, DB error -> 500)
- client tests in __tests__/client still pass or are updated alongside
- feedStash/duplicate-id behaviour while searching is unchanged
- lint, prettier --check ., test:coverage pass
```

### Phase 1: App shell

Top bar, command search, a real Center view, and the balance meter.

#### T1.1 Top bar, nav and refresh status (Medium)

Sticky glass bar with wordmark, segmented nav (All / Left / Center / Right), search, Refresh with last-updated.

```text
Task T1.1 — new masthead per the Balance Redesign design page, §02 (mockups).
Replace the masthead in views/layouts/main.handlebars with a sticky top bar: wordmark with three lean dots, a segmented nav (All, Left, Center, Right), the existing search input (#search-input) styled as a pill with a "/" hint, and the Refresh form with a "Updated N ago" label. Add a GET /center route and getCenterArticles controller mirroring /left and /right (include tests). Last-updated comes from the newest Article createdAt (single findOne sorted by createdAt desc) passed to the layout; show nothing if there are no articles. "/" focuses the search box unless the user is typing in an input.
Done when:
- /center renders only center articles; nav marks the current route with aria-current="page"
- "/" focuses #search-input, Escape still clears search
- last-updated renders relative time with the full timestamp in a title attribute
- bar stays sticky and does not overlap content; works at 360px with no horizontal scroll
- route tests for /center added; lint, prettier --check ., test:coverage pass
```

#### T1.2 Balance meter (Small)

Spectrum bar showing the Left / Center / Right split, with a text equivalent.

```text
Task T1.2 — balance meter.
Add GET /api/balance returning { left, center, right, total } using one aggregation over Article (left:true -> left, right:true -> right, otherwise center). Render the meter under the top bar per the Balance Redesign design page, §02 (mockups): a three-segment track sized by count, a caption "Today's balance — N stories", and the counts as text. Refresh the meter after a scrape redirect (server renders it, no client polling).
Done when:
- /api/balance has route tests (counts, empty collection returns zeros and total 0, DB error -> 500)
- meter segments are proportional and hidden when total is 0
- meter has a visible text equivalent; colour is never the only signal
- lint, prettier --check ., test:coverage pass
```

### Phase 2: Lanes and cards

The new card, lane headers, loading and empty states, and the phone layout.

#### T2.1 Card, lane header, states (Medium)

Card anatomy from the design page §02: monogram, source, relative time, display headline, tag pills, icon actions.

```text
Task T2.1 — card and lane restyle (markup lives only in the card partial after T0.2).
Restyle .article-card per the Balance Redesign design page, §02 (mockups): 3px lean-coloured left edge, source monogram + name, relative time ("2h") with the full date in a title attribute, headline in the display face, tag pills, and Tag / Add note as 28px icon buttons that are always visible on touch and fade in on hover/focus on desktop. Lane header shows lean name, source and count with a 2px lean-coloured rule. Add skeleton rows for Load more and search, and empty states with a Refresh button. Keep every selector in the Selector contract table in docs/redesign-plan.md.
Done when:
- cards and lanes match the design page mockups in both themes at 1280 and 360px (attach Chromium screenshots)
- icon buttons have aria-labels and a visible :focus-visible ring
- relative time helper has a unit test
- prefers-reduced-motion disables the shimmer
- lint, prettier --check ., test:coverage pass
```

#### T2.2 Mobile layout (Small)

Single feed under 720px with a four-way lane switch and 44px targets.

```text
Task T2.2 — phone layout.
Below 720px show one column; the segmented nav filters the feed client-side on the All page (no reload) and links to /left, /center, /right otherwise. Minimum 44x44px touch targets, sticky top bar, search on its own row.
Done when:
- no horizontal scroll at 360px and 768px (Chromium screenshots attached)
- switching lanes keeps scroll position sensible and updates aria-selected
- all interactive controls reachable by keyboard; focus order matches visual order
- lint, prettier --check ., test:coverage pass
```

### Phase 3: Drawer and tag filter

Replace the two dialogs with one drawer, and make tags a way to browse.

#### T3.1 Reader drawer (Large)

One side sheet for context, tags and note; bottom sheet on phones.

```text
Task T3.1 — reader drawer (plan first: have the Reviewer check the plan against the selector contract before the Author starts).
Selecting a card (not its headline link) opens a single <dialog> drawer from the right (bottom sheet under 720px) showing source, time, headline, an "Open original" link (target=_blank rel="noopener noreferrer"), the tag editor and the note form. It replaces the separate tag and note dialogs. Reuse the existing tag/note endpoints and the saved-tag + suggestion logic (recomputeAllTags with server list). Must work from search results and Load more cards.
Done when:
- one drawer element serves every card; ids stay unique while search results are shown
- Escape closes, focus returns to the card, focus is trapped while open
- saving tags/notes updates the card and the suggestion list exactly as today
- client tests updated or replaced in the same commit; coverage thresholds still met
- lint, prettier --check ., test:coverage pass
```

#### T3.2 Tag filter chips (Medium)

Counted tag chips under the meter that filter every lane.

```text
Task T3.2 — tag filter.
Add GET /api/tags/counts returning [{ tag, count }] sorted by count desc then name (aggregation with $unwind on tags). Add an optional tag query param to /api/articles, /api/search and the page routes. Render a chip row under the balance meter ("all" plus top tags with counts); selecting a chip filters all lanes and stores the choice in the URL hash (#tag=politics).
Done when:
- aggregation and tag-filtered queries have route tests including an unknown tag (empty result, 200)
- selecting a chip filters lanes without a full reload; hash restores the filter on load
- chips are real buttons with aria-pressed
- lint, prettier --check ., test:coverage pass
```

### Phase 4: Polish

Theme toggle, motion and an accessibility pass.

#### T4.1 Theme toggle, motion, a11y audit (Small)

System / Light / Dark switch, tuned transitions, and an audit with fixes.

```text
Task T4.1 — polish.
Add a System / Light / Dark control to the top bar (default System; while System is selected it must follow OS theme changes live) that sets data-theme on the root element and persists the choice in localStorage inside try/catch (page must render correctly if storage is unavailable). Tune hover/drawer/tab transitions to 150-200ms and respect prefers-reduced-motion. Run an accessibility audit with Chromium (keyboard-only pass plus contrast check of all token pairs in both themes) and fix what it finds.
Done when:
- all text/background token pairs meet WCAG AA in both themes (list the ratios in the commit message)
- every control is keyboard-operable with a visible focus ring; no keyboard traps
- toggle works with storage blocked
- lint, prettier --check ., test:coverage pass
```

## Risks

- Restyling before T0.2 means editing two card templates.
- The Free Republic and BBC scrapers are brittle: layout must tolerate missing times and short titles.
- The jsdom client tests run in CI and on the Band machines, not in Claude's cloud session.
