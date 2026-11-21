# Copilot review instructions

Balance is a Node 20 / Express / Mongoose news aggregator (Left / Center / Right columns) rendered
with express-handlebars and vanilla browser JS. It runs in Docker with a MongoDB container.

## Architecture

- `routes/` wire URLs to `controllers/`; controllers hold request/response logic; `services/` hold
  scraping and business logic with no req/res knowledge. Keep that separation.
- Models are Mongoose schemas in `models/`. Articles are upserted by `link` (`$setOnInsert`), so
  re-scraping must never overwrite user data such as `tags` or `note`.
- Config comes from `config/config.js` and environment variables. Never hard-code secrets, API keys
  or connection strings.

## Things to check in reviews

- **Handlebars + Mongoose:** queries that feed `res.render` must use `.lean()`. Handlebars blocks
  prototype access on Mongoose documents, which renders blank cards. JSON API routes don't need it.
- **Dialogs and cards exist in two places:** `views/partials/articleCard.handlebars` (server render)
  and `buildCard()` in `public/js/app.js` (Load more and search results). Any card or dialog change
  must be made in both, or the feature silently breaks on one path.
- **Client-side escaping:** anything interpolated into HTML strings in `public/js/app.js` must go
  through `escapeHtml()`; link hrefs through `safeHref()`. Flag any raw `innerHTML` with
  user-controlled or scraped text.
- **CSP:** helmet sets `script-src 'self'` and `connect-src 'self'`. No inline scripts, no inline
  event handlers, no third-party scripts.
- **Input validation:** new write routes need validation (express-validator or explicit checks) and
  rate limiting, like `noteLimit` in `routes/articles.js`. Tags are trimmed, lowercased,
  de-duplicated, max 20 per article and 50 characters each.
- **Search:** `/api/search` uses the MongoDB `$text` index on `Article.title`. Don't replace it with
  unindexed regex scans.
- **Pagination:** cursor-based on `_id` (`before=<_id>`), not skip/offset.
- **Errors:** controllers catch, log with `utils/logger`, and return a JSON error or a 500 page.
  Don't swallow errors silently or leak stack traces to the client.
- **Scrapers:** sources change markup and block bots. Selectors should fail soft (return fewer
  articles), not throw. The left source is the Guardian API and needs `GUARDIAN_API_KEY`.

## Style and tooling (CI enforces these)

- ESLint (`npm run lint`) and Prettier (`npx prettier --check .`) must pass: single quotes, semicolons,
  100 columns, 2 spaces, `arrowParens: avoid`. Handlebars files use double quotes. This includes CSS
  and Markdown, which the pre-commit hook does not always format.
- Jest tests live in `__tests__/` mirroring the source layout, mock Mongoose models with
  `jest.mock('../../models/Article')`, and use supertest for routes. CI fails if global coverage drops
  below 78% lines / 78% statements / 70% functions / 60% branches, so new controllers, routes and
  services need tests.
- Comment only when the reason is non-obvious. Prefer small, focused changes over refactors.

## Local dev notes (not review issues)

- Docker copies source at build time, so changes need `docker compose up --build`.
- Don't put `MONGODB_URI` or passwords containing `@` in `.env`; compose builds the URI.
- On macOS, port 5000 conflicts with AirPlay Receiver; local port overrides shouldn't be committed.
