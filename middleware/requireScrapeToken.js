const crypto = require('crypto');

/**
 * Gate for POST /scrape.
 *
 * When SCRAPE_SECRET is set, callers must send it in the `x-scrape-token`
 * header. When it is unset the gate is open (local development). The secret is
 * read per request so it can be changed without rebuilding the app.
 */
function isScrapeProtected() {
  return Boolean(process.env.SCRAPE_SECRET);
}

function safeEqual(a, b) {
  const hashA = crypto.createHash('sha256').update(String(a)).digest();
  const hashB = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

function requireScrapeToken(req, res, next) {
  const secret = process.env.SCRAPE_SECRET;
  if (!secret) return next();

  const token = req.get('x-scrape-token');
  if (token && safeEqual(token, secret)) return next();

  return res.status(401).json({ error: 'Missing or invalid x-scrape-token' });
}

module.exports = { requireScrapeToken, isScrapeProtected };
