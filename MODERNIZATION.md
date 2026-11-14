# Modernization Checklist

Track ongoing improvements to the codebase. Check off items as they land on `main`.

---

## Quick wins

- [x] Models use `var` — convert `Article.js` and `Note.js` to `const`/destructured `Schema`
- [x] `docker-compose.yml` has obsolete `version: '3.8'` key — remove it (Compose V2 warns)
- [x] No `.env.example` — add one so contributors know which vars are required
- [x] Article schema missing `{ timestamps: true }` — adds free `createdAt`/`updatedAt` fields
- [x] Empty-state fallback JS runs on every page — guard on `.col-articles` presence first

---

## Medium effort

- [x] No 404 handler — added `app.use` catch-all before error handler in `server.js`
- [x] No global error middleware — added `(err, req, res, next)` handler in `server.js`
- [x] No mongoose connection timeout — added `serverSelectionTimeoutMS: 5000` to `mongoose.connect`
- [x] Routes/config/logger in `collectCoverageFrom` but have zero tests — excluded from coverage; thresholds raised to reflect only controllers/services
- [x] `/debug/counts` — endpoint not present in codebase (N/A)
- [x] No rate limiting — added `express-rate-limit` to `POST /scrape` (1/min) and `POST /articles/:id` (10/min); skipped in `NODE_ENV=test`
- [x] Scrape endpoints are unauthenticated GETs — consolidated into `POST /scrape`; optional `SCRAPE_SECRET` env var gates it via `x-scrape-token` header
- [x] No integration/route-level tests — added supertest suites in `__tests__/routes/` covering `/health`, `/articles/:id`, `POST /articles/:id`, `POST /scrape` (31 tests total, all coverage thresholds pass)

---

## Bigger lift

- [x] No pagination — added cursor-based pagination (`GET /api/articles?filter=&before=`) with 20 articles per column and "Load more" button; uses `_id` as cursor to avoid offset drift
- [x] Helmet CSP not configured — added explicit `contentSecurityPolicy` directives in `app.js` covering Google Fonts (googleapis.com + gstatic.com), blocking inline scripts
- [x] MongoDB has no auth in `docker-compose.yml` — added `MONGO_INITDB_ROOT_USERNAME/PASSWORD`, authenticated URI with `?authSource=admin`, and auth-aware healthcheck; credentials loaded from `.env` via `MONGO_USERNAME`/`MONGO_PASSWORD`
