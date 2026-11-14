const request = require('supertest');

jest.mock('../../models/Article');
jest.mock('../../models/Note');
jest.mock('../../utils/logger');

const Article = require('../../models/Article');
const Note = require('../../models/Note');
const createApp = require('../../app');

describe('Article routes', () => {
  let app;

  beforeEach(() => {
    app = createApp();
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    test('returns 200 with status ok', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /articles/:id', () => {
    test('returns article when found', async () => {
      const mockArticle = { _id: 'abc123', title: 'Test Article', note: null };
      Article.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle),
      });

      const res = await request(app).get('/articles/abc123');
      expect(res.status).toBe(200);
      expect(res.body._id).toBe('abc123');
    });

    test('returns 404 when article not found', async () => {
      Article.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app).get('/articles/notfound');
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Article not found');
    });

    test('returns 500 on DB error', async () => {
      Article.findById = jest.fn().mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const res = await request(app).get('/articles/dberr');
      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Error fetching article');
    });
  });

  describe('POST /articles/:id', () => {
    test('returns 400 when body is empty', async () => {
      const res = await request(app).post('/articles/abc123').send({ header: '', text: '' });
      expect(res.status).toBe(400);
      expect(res.body.errors).toBeDefined();
    });

    test('returns 400 when text is too short', async () => {
      const res = await request(app)
        .post('/articles/abc123')
        .send({ header: 'Valid Title', text: 'short' });
      expect(res.status).toBe(400);
    });

    test('creates note and returns success', async () => {
      const mockNote = { _id: 'note1' };
      const mockArticle = { _id: 'abc123', note: mockNote };
      Note.create = jest.fn().mockResolvedValue(mockNote);
      Article.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle),
      });

      const res = await request(app)
        .post('/articles/abc123')
        .send({ header: 'Test Title', text: 'This is a valid test comment body.' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Note.create).toHaveBeenCalledWith({
        header: 'Test Title',
        text: 'This is a valid test comment body.',
      });
    });

    test('returns 404 when article not found after note creation', async () => {
      const mockNote = { _id: 'note1' };
      Note.create = jest.fn().mockResolvedValue(mockNote);
      Note.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      Article.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/articles/missing')
        .send({ header: 'Test Title', text: 'This is a valid test comment body.' });
      expect(res.status).toBe(404);
      expect(Note.findByIdAndDelete).toHaveBeenCalledWith(mockNote._id);
    });
  });

  describe('GET /api/articles', () => {
    const findChain = results =>
      jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(results),
      });

    test('returns 400 for missing or invalid filter', async () => {
      const res = await request(app).get('/api/articles');
      expect(res.status).toBe(400);
    });

    test('returns first page of left articles', async () => {
      const mockArticles = [
        { _id: 'a1', title: 'T', link: 'http://x.com', source: 'S', left: true, right: false },
      ];
      Article.find = findChain(mockArticles);

      const res = await request(app).get('/api/articles?filter=left');
      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(1);
      expect(res.body.nextCursor).toBeNull();
    });

    test('sets nextCursor when more articles exist', async () => {
      const makeArticle = id => ({
        _id: id,
        title: 'T',
        link: 'http://x.com',
        source: 'S',
        left: true,
        right: false,
      });
      const mockArticles = Array.from({ length: 21 }, (_, i) => makeArticle(`id${i}`));
      mockArticles[19]._id = { toString: () => 'cursor-id' };
      Article.find = findChain(mockArticles);

      const res = await request(app).get('/api/articles?filter=left');
      expect(res.status).toBe(200);
      expect(res.body.articles).toHaveLength(20);
      expect(res.body.nextCursor).toBe('cursor-id');
    });

    test('passes before cursor as _id $lt query', async () => {
      Article.find = findChain([]);

      await request(app).get('/api/articles?filter=center&before=abc123');
      expect(Article.find).toHaveBeenCalledWith({
        left: false,
        right: false,
        _id: { $lt: 'abc123' },
      });
    });

    test('returns 500 on DB error', async () => {
      Article.find = jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('DB error')),
      });

      const res = await request(app).get('/api/articles?filter=right');
      expect(res.status).toBe(500);
    });
  });
});
