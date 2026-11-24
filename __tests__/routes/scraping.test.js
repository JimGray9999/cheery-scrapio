const request = require('supertest');

jest.mock('../../services/scraperService');
jest.mock('../../utils/logger');

const scraperService = require('../../services/scraperService');
const createApp = require('../../app');

describe('Scraping routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('POST /scrape', () => {
    test('runs all three scrapers and redirects to /all', async () => {
      scraperService.scrapeLeftArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 3, duplicateCount: 1 });
      scraperService.scrapeRightArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 2, duplicateCount: 0 });
      scraperService.scrapeCenterArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 5, duplicateCount: 2 });

      const res = await request(app).post('/scrape');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/all');
      expect(scraperService.scrapeLeftArticles).toHaveBeenCalled();
      expect(scraperService.scrapeRightArticles).toHaveBeenCalled();
      expect(scraperService.scrapeCenterArticles).toHaveBeenCalled();
    });

    test('returns 500 when scraping fails', async () => {
      scraperService.scrapeLeftArticles = jest.fn().mockRejectedValue(new Error('Network error'));

      const res = await request(app).post('/scrape');
      expect(res.status).toBe(500);
    });

    describe('with SCRAPE_SECRET set', () => {
      beforeEach(() => {
        process.env.SCRAPE_SECRET = 's3cret';
        scraperService.scrapeLeftArticles = jest
          .fn()
          .mockResolvedValue({ newCount: 0, duplicateCount: 0 });
        scraperService.scrapeRightArticles = jest
          .fn()
          .mockResolvedValue({ newCount: 0, duplicateCount: 0 });
        scraperService.scrapeCenterArticles = jest
          .fn()
          .mockResolvedValue({ newCount: 0, duplicateCount: 0 });
      });

      afterEach(() => {
        delete process.env.SCRAPE_SECRET;
      });

      test('rejects a request with no token and does not scrape', async () => {
        const res = await request(app).post('/scrape');
        expect(res.status).toBe(401);
        expect(scraperService.scrapeLeftArticles).not.toHaveBeenCalled();
      });

      test('rejects a wrong token', async () => {
        const res = await request(app).post('/scrape').set('x-scrape-token', 'nope');
        expect(res.status).toBe(401);
        expect(scraperService.scrapeLeftArticles).not.toHaveBeenCalled();
      });

      test('accepts the correct token', async () => {
        const res = await request(app).post('/scrape').set('x-scrape-token', 's3cret');
        expect(res.status).toBe(302);
        expect(res.headers.location).toBe('/all');
        expect(scraperService.scrapeLeftArticles).toHaveBeenCalled();
      });

      test('home page hides the Refresh News button', async () => {
        const res = await request(app).get('/');
        expect(res.text).not.toContain('action="/scrape"');
      });
    });

    test('home page shows the Refresh News button when no secret is set', async () => {
      const res = await request(app).get('/');
      expect(res.text).toContain('action="/scrape"');
    });

    test('GET /scrape/left is no longer routed', async () => {
      const res = await request(app).get('/scrape/left');
      expect(res.status).toBe(404);
    });
  });
});
