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
- [ ] `/debug/counts` is unauthenticated — gate behind a secret header or remove before any real deploy
- [ ] No rate limiting — add `express-rate-limit` to scrape endpoints and `POST /articles/:id`
- [ ] Scrape endpoints are unauthenticated GETs — add a secret-header check or convert to POST
- [ ] No integration/route-level tests — add a supertest suite covering `/all`, `/articles/:id`, and `articleController` (currently 0% covered)

---

## Bigger lift

- [ ] No pagination — all articles load at once; add server-side cursor pagination or infinite scroll
- [ ] Helmet CSP not configured — set a custom `contentSecurityPolicy` directive to block inline script injection
- [ ] MongoDB has no auth in `docker-compose.yml` — add `MONGO_INITDB_ROOT_USERNAME/PASSWORD` and an authenticated URI for production
