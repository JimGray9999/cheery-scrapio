const request = require('supertest');

jest.mock('../../models/Article');
jest.mock('../../models/Note');
jest.mock('../../utils/logger');

const Article = require('../../models/Article');
const createApp = require('../../app');

describe('Search and tag routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /api/search', () => {
    const searchChain = results => {
      const chain = {
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        lean: jest.fn().mockResolvedValue(results),
      };
      Article.find = jest.fn().mockReturnValue(chain);
      return chain;
    };

    test('returns 400 when q is missing or too short', async () => {
      expect((await request(app).get('/api/search')).status).toBe(400);
      expect((await request(app).get('/api/search?q=a')).status).toBe(400);
    });

    test('returns matching articles using a $text query', async () => {
      searchChain([{ _id: 'a1', title: 'Election news' }]);

      const res = await request(app).get('/api/search?q=election');
      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(Article.find.mock.calls[0][0]).toEqual({ $text: { $search: 'election' } });
    });

    test('merges the bias filter into the query', async () => {
      searchChain([]);

      await request(app).get('/api/search?q=election&filter=left');
      expect(Article.find.mock.calls[0][0]).toEqual({
        $text: { $search: 'election' },
        left: true,
      });
    });

    test('returns 500 on DB error', async () => {
      Article.find = jest.fn().mockImplementation(() => {
        throw new Error('db down');
      });

      const res = await request(app).get('/api/search?q=election');
      expect(res.status).toBe(500);
    });
  });

  describe('GET /api/tags', () => {
    test('returns sorted distinct tags without blanks', async () => {
      Article.distinct = jest.fn().mockResolvedValue(['zebra', '', 'apple']);

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['apple', 'zebra']);
    });

    test('returns 500 on DB error', async () => {
      Article.distinct = jest.fn().mockRejectedValue(new Error('db down'));

      const res = await request(app).get('/api/tags');
      expect(res.status).toBe(500);
    });
  });

  describe('PUT /articles/:id/tags', () => {
    const updateChain = result => {
      Article.findByIdAndUpdate = jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(result),
      });
    };

    test('returns 400 when tags is not an array', async () => {
      const res = await request(app).put('/articles/abc123/tags').send({ tags: 'politics' });
      expect(res.status).toBe(400);
    });

    test('normalizes, dedupes and saves tags', async () => {
      updateChain({ tags: ['politics', 'uk'] });

      const res = await request(app)
        .put('/articles/abc123/tags')
        .send({ tags: [' Politics ', 'politics', 'UK', '', 'x'.repeat(51)] });

      expect(res.status).toBe(200);
      expect(res.body.tags).toEqual(['politics', 'uk']);
      expect(Article.findByIdAndUpdate.mock.calls[0][1]).toEqual({
        $set: { tags: ['politics', 'uk'] },
      });
    });

    test('returns 404 when article not found', async () => {
      updateChain(null);

      const res = await request(app)
        .put('/articles/abc123/tags')
        .send({ tags: ['a'] });
      expect(res.status).toBe(404);
    });

    test('returns 500 on DB error', async () => {
      Article.findByIdAndUpdate = jest.fn().mockImplementation(() => {
        throw new Error('db down');
      });

      const res = await request(app)
        .put('/articles/abc123/tags')
        .send({ tags: ['a'] });
      expect(res.status).toBe(500);
    });
  });
});
