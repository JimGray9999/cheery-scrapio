const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock axios.create BEFORE requiring scraperService
const mockHttpClient = {
  get: jest.fn(),
};

jest.mock('axios', () => ({
  create: jest.fn(() => mockHttpClient),
}));

// Mock other dependencies
jest.mock('../../models/Article');
jest.mock('../../utils/logger');

const Article = require('../../models/Article');
const scraperService = require('../../services/scraperService');

describe('Scraper Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scrapeLeftArticles', () => {
    test('should scrape and parse left-leaning articles', async () => {
      const mockHtml = `
        <html>
          <body>
            <table>
              <tr>
                <td class="subject"><a href="?com=view_post&forum=1014&pid=123">Article Title 1</a></td>
                <td class="time">2:30 PM</td>
              </tr>
              <tr>
                <td class="subject"><a href="?com=view_post&forum=1014&pid=456">Article Title 2</a></td>
                <td class="time">3:45 PM</td>
              </tr>
            </table>
          </body>
        </html>
      `;

      mockHttpClient.get.mockResolvedValue({ data: mockHtml });
      Article.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 2 });

      const result = await scraperService.scrapeLeftArticles();

      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(Article.bulkWrite).toHaveBeenCalled();
      expect(result.newCount).toBe(2);
      expect(result.duplicateCount).toBe(0);
      expect(result.total).toBe(2);
    });

    test('should handle scraping errors gracefully', async () => {
      mockHttpClient.get.mockRejectedValue(new Error('Network error'));

      await expect(scraperService.scrapeLeftArticles()).rejects.toThrow('Network error');
    });
  });

  describe('scrapeRightArticles', () => {
    test('should scrape and parse right-leaning articles', async () => {
      const mockHtml = `
        <html>
          <body>
            <li class="article">
              <h3><a href="focus/f-news/123">Article Title 1</a></h3>
              <span class="date">Today 10:30 AM</span>
            </li>
            <li class="article">
              <h3><a href="focus/f-news/456">Article Title 2</a></h3>
              <span class="date">Today 11:45 AM</span>
            </li>
          </body>
        </html>
      `;

      mockHttpClient.get.mockResolvedValue({ data: mockHtml });
      Article.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 2 });

      const result = await scraperService.scrapeRightArticles();

      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(Article.bulkWrite).toHaveBeenCalled();
      expect(result.newCount).toBe(2);
      expect(result.duplicateCount).toBe(0);
      expect(result.total).toBe(2);
    });

    test('should handle empty results', async () => {
      const mockHtml = '<html><body></body></html>';

      mockHttpClient.get.mockResolvedValue({ data: mockHtml });
      Article.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 0 });

      const result = await scraperService.scrapeRightArticles();

      expect(result.newCount).toBe(0);
      expect(result.duplicateCount).toBe(0);
      expect(result.total).toBe(0);
    });
  });

  describe('scrapeCenterArticles', () => {
    test('should scrape and parse BBC articles', async () => {
      const mockHtml = `
        <html>
          <body>
            <a data-testid="internal-link" href="/news/article-123">
              <h2>BBC Article Title 1</h2>
            </a>
            <a data-testid="internal-link" href="/news/article-456">
              <h3>BBC Article Title 2</h3>
            </a>
          </body>
        </html>
      `;

      mockHttpClient.get.mockResolvedValue({ data: mockHtml });
      Article.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 2 });

      const result = await scraperService.scrapeCenterArticles();

      expect(mockHttpClient.get).toHaveBeenCalled();
      expect(Article.bulkWrite).toHaveBeenCalled();
      expect(result.newCount).toBe(2);
      expect(result.duplicateCount).toBe(0);
      expect(result.total).toBe(2);
    });

    test('should filter out short titles', async () => {
      const mockHtml = `
        <html>
          <body>
            <a data-testid="internal-link" href="/news/article-123">
              <h2>Short</h2>
            </a>
            <a data-testid="internal-link" href="/news/article-456">
              <h2>This is a proper BBC article title</h2>
            </a>
          </body>
        </html>
      `;

      mockHttpClient.get.mockResolvedValue({ data: mockHtml });
      Article.bulkWrite = jest.fn().mockResolvedValue({ upsertedCount: 1 });

      const result = await scraperService.scrapeCenterArticles();

      // Should only scrape the article with a title longer than 10 characters
      expect(result.total).toBe(1);
    });
  });
});
