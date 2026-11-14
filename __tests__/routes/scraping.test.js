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
    delete process.env.SCRAPE_SECRET;
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

    test('returns 403 when SCRAPE_SECRET is set and header is missing', async () => {
      process.env.SCRAPE_SECRET = 'my-secret';

      const res = await request(app).post('/scrape');
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Forbidden');
    });

    test('allows request when SCRAPE_SECRET is set and header matches', async () => {
      process.env.SCRAPE_SECRET = 'my-secret';
      scraperService.scrapeLeftArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 1, duplicateCount: 0 });
      scraperService.scrapeRightArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 1, duplicateCount: 0 });
      scraperService.scrapeCenterArticles = jest
        .fn()
        .mockResolvedValue({ newCount: 1, duplicateCount: 0 });

      const res = await request(app).post('/scrape').set('x-scrape-token', 'my-secret');
      expect(res.status).toBe(302);
      expect(res.headers.location).toBe('/all');
    });
  });
});
