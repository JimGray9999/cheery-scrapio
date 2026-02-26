const { describe, test, expect, beforeEach } = require('@jest/globals');

// Mock dependencies before requiring the controller
jest.mock('../../models/Article');
jest.mock('../../models/Note');
jest.mock('../../utils/logger');

const Article = require('../../models/Article');
const Note = require('../../models/Note');
const noteController = require('../../controllers/noteController');

describe('Note Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: { id: 'article123' },
      body: { header: 'Test Title', text: 'Test comment text' },
    };
    res = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('createNote', () => {
    test('should create note and associate with article successfully', async () => {
      const mockNote = { _id: 'note123', header: 'Test Title', text: 'Test comment text' };
      const mockArticle = { _id: 'article123', note: 'note123', title: 'Article' };

      Note.create = jest.fn().mockResolvedValue(mockNote);
      Article.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockArticle),
      });

      await noteController.createNote(req, res);

      expect(Note.create).toHaveBeenCalledWith({ header: 'Test Title', text: 'Test comment text' });
      expect(Article.findByIdAndUpdate).toHaveBeenCalledWith(
        'article123',
        { note: 'note123' },
        { new: true }
      );
      expect(res.json).toHaveBeenCalledWith({ success: true, article: mockArticle });
    });

    test('should return 404 if article not found', async () => {
      const mockNote = { _id: 'note123' };
      Note.create = jest.fn().mockResolvedValue(mockNote);
      Note.findByIdAndDelete = jest.fn().mockResolvedValue(mockNote);
      Article.findByIdAndUpdate = jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await noteController.createNote(req, res);

      expect(Note.findByIdAndDelete).toHaveBeenCalledWith('note123');
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Article not found' });
    });

    test('should handle database errors', async () => {
      Note.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await noteController.createNote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error saving note' });
    });
  });

  describe('deleteNote', () => {
    test('should delete note and clear article reference', async () => {
      const mockArticle = {
        _id: 'article123',
        note: 'note123',
        save: jest.fn().mockResolvedValue(true),
      };
      Article.findById = jest.fn().mockResolvedValue(mockArticle);
      Note.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: 'note123' });

      await noteController.deleteNote(req, res);

      expect(Article.findById).toHaveBeenCalledWith('article123');
      expect(Note.findByIdAndDelete).toHaveBeenCalledWith('note123');
      expect(mockArticle.note).toBeNull();
      expect(mockArticle.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Note deleted' });
    });

    test('should handle article without note', async () => {
      const mockArticle = {
        _id: 'article123',
        note: null,
        save: jest.fn().mockResolvedValue(true),
      };
      Article.findById = jest.fn().mockResolvedValue(mockArticle);

      await noteController.deleteNote(req, res);

      expect(Note.findByIdAndDelete).not.toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ success: true, message: 'Note deleted' });
    });

    test('should return 404 if article not found', async () => {
      Article.findById = jest.fn().mockResolvedValue(null);

      await noteController.deleteNote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Article not found' });
    });

    test('should handle database errors', async () => {
      Article.findById = jest.fn().mockRejectedValue(new Error('Database error'));

      await noteController.deleteNote(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Error deleting note' });
    });
  });
});
