# End-to-end test plan

Status: implemented for the current app (29 tests run, 4 skipped contracts for the Balance
redesign). Written in Playwright with TypeScript. Manual cases live in Jira as QAlity Test issues
(BAL-34 to BAL-58); this suite automates the ones that are cheap and stable to automate.

## Goals

- Catch regressions in the flows people use: browsing lanes, Load more, tags, notes, search.
- Pin the contracts the redesign must not break (cursor pagination, selector contract, CSP).
- Stay small and fast: a full run takes about 15 seconds and needs no external network.

## What is automated and what is not

| Area                                      | Automated | Why                                                 |
| ----------------------------------------- | --------- | --------------------------------------------------- |
| Lanes, nav, empty states, 404             | Yes       | Stable markup, fast                                 |
| Load more and `/api/articles` contract    | Yes       | The redesign changes how cards render, not this     |
| Tags: add, remove, suggest, persist       | Yes       | Most regression-prone client logic                  |
| Notes: save, cancel, validate, delete     | Yes       |                                                     |
| Search, feed stash, tag from results      | Yes       | Duplicate-id and stash behaviour is easy to break   |
| CSP header, inline scripts, console clean | Yes       | Cheap to check on every page                        |
| `POST /scrape`                            | No        | Hits live third-party sites; Jest already mocks it  |
| Visual fidelity, themes, contrast         | No        | Judgement calls; stay in QAlity (BAL-35, 42, 55)    |
| Phone layout, drawer focus, screen reader | No        | Better as manual or a later visual-snapshot project |

## How it works

- `playwright.config.ts`: Chromium only, one worker (tests share and wipe one database), no
  `webServer` block.
- `e2e/global-setup.ts`: starts MongoDB and the real Express app in the runner process, builds the
  text index, and returns a teardown function.
  - Default database: `mongodb-memory-server` (downloads `mongod` on first use).
  - `E2E_MONGODB_URI=...` uses your own server instead. The database name must contain `e2e`, or
    setup refuses to run, because every test deletes data.
  - Sets `NODE_ENV=test` so the rate limiters switch off. Port is `E2E_PORT` (default 5057).
- `e2e/support/db.ts`: `seed()` and `laneOf()`. The app lists newest first, so the last article
  you seed appears at the top of its lane.
- `e2e/support/fixtures.ts`: a `db` fixture that wipes data before each test, and a `page` fixture
  that stubs Google Fonts so runs do not depend on the internet.
- Tests carry `@smoke` or `@regression` tags, and a `jira` annotation naming the QAlity test or
  task they cover.

## Test inventory

| File                 | Tests | Covers                                                                |
| -------------------- | ----- | --------------------------------------------------------------------- |
| `smoke.spec.ts`      | 6     | `/health`, `/all` lanes, `/left`, `/right`, empty state, 404          |
| `pagination.spec.ts` | 3     | Load more (BAL-56, BAL-37), no duplicate ids, `/api/articles` cursor  |
| `tags.spec.ts`       | 4     | Add, persist, suggest, remove (BAL-57, BAL-49), tag API normalisation |
| `notes.spec.ts`      | 4     | Save, cancel, server validation, delete                               |
| `search.spec.ts`     | 5     | Results and stash (BAL-38), no match, min length, tag from results    |
| `csp.spec.ts`        | 7     | CSP and console per page (BAL-58), inline styles (known failure)      |
| `redesign.spec.ts`   | 4     | Skipped contracts: `/center`, `/api/balance`, tag counts, fragments   |

## Running it

```bash
npm run test:e2e
npm run test:e2e:typecheck
```

On a machine without browsers, run `npx playwright install chromium` once. The first run also
downloads `mongod`; to skip that, start the compose MongoDB and set
`E2E_MONGODB_URI=mongodb://admin:<password>@localhost:27017/cheery-scrapio-e2e?authSource=admin`.

## Known failure

`no inline style attributes on rendered cards` is marked `test.fail`. The CSP has no
`'unsafe-inline'` for styles, so the browser drops three `style="..."` attributes (one in
`views/partials/articleCard.handlebars`, two in `public/js/app.js`) and logs a console error. When
they move into `style.css`, that test starts passing, Playwright reports it, and the `test.fail`
line and the console filter in `csp.spec.ts` should be deleted.

## Redesign contracts (skipped until built)

Each skipped test in `redesign.spec.ts` becomes live by deleting `.fixme` when its task lands.

| Task | Jira   | Contract                                                       |
| ---- | ------ | -------------------------------------------------------------- |
| T0.2 | BAL-7  | `/fragments/cards?filter=bogus` returns 400                    |
| T1.1 | BAL-8  | `/center` renders only center articles, nav has `aria-current` |
| T1.2 | BAL-9  | `/api/balance` returns `{ left, center, right, total }`        |
| T3.2 | BAL-13 | `/api/tags/counts` sorts by count descending, then name        |

When a task lands, also update the existing tests in the same commit if it renames a selector from
the Selector contract in `docs/redesign-plan.md`. Tests use those selectors directly on purpose, so
a rename breaks them loudly.

## Suggested CI job (not added yet)

CI is shared, so this is proposed and not applied:

```yaml
e2e:
  name: End-to-end tests
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    - run: npm ci
    - run: npx playwright install --with-deps chromium
    - run: npm run test:e2e
    - uses: actions/upload-artifact@v4
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

It has not been run in GitHub Actions. Cache `~/.cache/mongodb-binaries` if the `mongod` download
is slow, or use a `mongo:7` service container with `E2E_MONGODB_URI`.

## Risks and next steps

- Selectors are coupled to the current markup. That is intended for the selector contract, but T2.1
  and T3.1 will need a pass over `tags.spec.ts` and `notes.spec.ts` (dialogs become a drawer).
- Search relies on a MongoDB text index and stemming; seed titles use plain words like
  "inflation" to keep that predictable.
- Candidates for a second pass: a mobile project (360px) for BAL-45 and BAL-46, an axe-core
  accessibility check for BAL-55, and screenshot comparison for BAL-42.
