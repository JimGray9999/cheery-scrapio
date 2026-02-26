const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock dependencies
jest.mock('../../services/scraperService');
jest.mock('../../utils/logger');

const scraperService = require('../../services/scraperService');
const scraperController = require('../../controllers/scraperController');

describe('Scraper Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {};
    res = {
      redirect: jest.fn(),
      send: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('scrapeLeft', () => {
    test('should scrape left articles and redirect to /scrape/right', async () => {
      const mockResult = { newCount: 5, duplicateCount: 2 };
      scraperService.scrapeLeftArticles = jest.fn().mockResolvedValue(mockResult);

      await scraperController.scrapeLeft(req, res);

      expect(scraperService.scrapeLeftArticles).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/scrape/right');
    });

    test('should handle scraping errors', async () => {
      scraperService.scrapeLeftArticles = jest.fn().mockRejectedValue(new Error('Scraping failed'));

      await scraperController.scrapeLeft(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error scraping left links');
    });
  });

  describe('scrapeRight', () => {
    test('should scrape right articles and redirect to /all', async () => {
      const mockResult = { newCount: 8, duplicateCount: 3 };
      scraperService.scrapeRightArticles = jest.fn().mockResolvedValue(mockResult);

      await scraperController.scrapeRight(req, res);

      expect(scraperService.scrapeRightArticles).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/all');
    });

    test('should handle scraping errors', async () => {
      scraperService.scrapeRightArticles = jest
        .fn()
        .mockRejectedValue(new Error('Scraping failed'));

      await scraperController.scrapeRight(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error scraping right links');
    });
  });

  describe('scrapeCenter', () => {
    test('should scrape center articles and redirect to /all', async () => {
      const mockResult = { newCount: 6, duplicateCount: 1 };
      scraperService.scrapeCenterArticles = jest.fn().mockResolvedValue(mockResult);

      await scraperController.scrapeCenter(req, res);

      expect(scraperService.scrapeCenterArticles).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith('/all');
    });

    test('should handle scraping errors', async () => {
      scraperService.scrapeCenterArticles = jest
        .fn()
        .mockRejectedValue(new Error('Scraping failed'));

      await scraperController.scrapeCenter(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.send).toHaveBeenCalledWith('Error scraping center links');
    });
  });
});
