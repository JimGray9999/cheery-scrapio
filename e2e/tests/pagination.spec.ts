import { test, expect } from '../support/fixtures';

// PAGE_SIZE is 20 in controllers/articleController.js.
const PAGE_SIZE = 20;
const TOTAL = 25;

test.describe('Load more (cursor pagination)', { tag: '@regression' }, () => {
  test(
    'first page shows 20 cards, Load more appends the rest once with no duplicates',
    { annotation: { type: 'jira', description: 'BAL-56, BAL-37' } },
    async ({ page, db }) => {
      await db.seed(db.laneOf('left', TOTAL, 'Left story'));
      await page.goto('/all');

      const cards = page.locator('.col-left .article-card');
      const loadMore = page.locator('.btn-load-more[data-filter="left"]');
      await expect(cards).toHaveCount(PAGE_SIZE);
      await expect(loadMore).toBeVisible();

      await loadMore.click();

      await expect(cards).toHaveCount(TOTAL);
      await expect(loadMore).toHaveCount(0);

      // Newest first, every article exactly once.
      const titles = await page.locator('.col-left .card-title').allTextContents();
      expect(titles).toHaveLength(TOTAL);
      expect(new Set(titles).size).toBe(TOTAL);
      expect(titles[0].trim()).toBe('Left story 25');
      expect(titles[TOTAL - 1].trim()).toBe('Left story 01');

      // Appended cards must not reuse ids, or dialogs would open the wrong article.
      const duplicateIds = await page.evaluate(() => {
        const seen = new Set<string>();
        const dupes: string[] = [];
        document.querySelectorAll('[id]').forEach(el => {
          if (seen.has(el.id)) dupes.push(el.id);
          seen.add(el.id);
        });
        return dupes;
      });
      expect(duplicateIds).toEqual([]);
    }
  );

  test('a lane with 20 or fewer articles has no Load more button', async ({ page, db }) => {
    await db.seed(db.laneOf('center', PAGE_SIZE, 'Center story'));
    await page.goto('/all');

    await expect(page.locator('.col-center .article-card')).toHaveCount(PAGE_SIZE);
    await expect(page.locator('.btn-load-more')).toHaveCount(0);
  });

  test('GET /api/articles keeps its cursor contract', async ({ request, db }) => {
    await db.seed(db.laneOf('left', TOTAL, 'Left story'));

    const first = await request.get('/api/articles?filter=left');
    expect(first.status()).toBe(200);
    const page1 = await first.json();
    expect(page1.articles).toHaveLength(PAGE_SIZE);
    expect(typeof page1.nextCursor).toBe('string');

    const second = await request.get(`/api/articles?filter=left&before=${page1.nextCursor}`);
    const page2 = await second.json();
    expect(page2.articles).toHaveLength(TOTAL - PAGE_SIZE);
    expect(page2.nextCursor).toBeNull();

    const bad = await request.get('/api/articles?filter=bogus');
    expect(bad.status()).toBe(400);
  });
});
