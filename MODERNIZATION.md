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

- [ ] No 404 handler — unmatched routes fall through silently; add `app.use` catch-all before `app.listen`
- [ ] No global error middleware — add `(err, req, res, next)` handler so unhandled throws return formatted 500s
- [ ] `/debug/counts` is unauthenticated — gate behind a secret header or remove before any real deploy
- [ ] No mongoose connection timeout — add `serverSelectionTimeoutMS` option to `mongoose.connect` to prevent cold-start hangs
- [ ] No rate limiting — add `express-rate-limit` to scrape endpoints and `POST /articles/:id`
- [ ] Scrape endpoints are unauthenticated GETs — add a secret-header check or convert to POST
- [ ] Routes/config/logger in `collectCoverageFrom` but have zero tests — either exclude them or add smoke tests
- [ ] No integration/route-level tests — add a supertest suite covering `/all` and `/articles/:id`

---

## Bigger lift

- [ ] No pagination — all articles load at once; add server-side cursor pagination or infinite scroll
- [ ] Helmet CSP not configured — set a custom `contentSecurityPolicy` directive to block inline script injection
- [ ] MongoDB has no auth in `docker-compose.yml` — add `MONGO_INITDB_ROOT_USERNAME/PASSWORD` and an authenticated URI for production
