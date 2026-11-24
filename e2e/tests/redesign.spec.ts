import { test, expect } from '../support/fixtures';

/**
 * Contracts from docs/redesign-plan.md for work that is not built yet. Each is marked
 * fixme (skipped, and listed as such in the report). When the task lands, delete the
 * `.fixme` so the test runs, and add the UI checks from its QAlity test.
 */
test.describe('Balance redesign contracts', { tag: '@redesign' }, () => {
  test.fixme(
    'T1.1 /center renders only center articles',
    { annotation: { type: 'jira', description: 'BAL-8, BAL-39' } },
    async ({ page, db }) => {
      await db.seed([
        { lane: 'left', title: 'Left story' },
        { lane: 'center', title: 'Center story' },
        { lane: 'right', title: 'Right story' },
      ]);

      const res = await page.goto('/center');

      expect(res?.status()).toBe(200);
      await expect(page.locator('.article-card')).toHaveCount(1);
      await expect(page.locator('.card-title')).toHaveText(['Center story']);
      await expect(page.locator('[aria-current="page"]')).toContainText('Center');
    }
  );

  test.fixme(
    'T1.2 /api/balance returns counts per lane and zeros when empty',
    { annotation: { type: 'jira', description: 'BAL-9, BAL-34' } },
    async ({ request, db }) => {
      const empty = await request.get('/api/balance');
      expect(await empty.json()).toEqual({ left: 0, center: 0, right: 0, total: 0 });

      await db.seed([
        ...db.laneOf('left', 6, 'Left story'),
        ...db.laneOf('center', 3, 'Center story'),
        ...db.laneOf('right', 3, 'Right story'),
      ]);

      const res = await request.get('/api/balance');
      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual({ left: 6, center: 3, right: 3, total: 12 });
    }
  );

  test.fixme(
    'T3.2 /api/tags/counts sorts by count desc, then name',
    { annotation: { type: 'jira', description: 'BAL-13, BAL-51' } },
    async ({ request, db }) => {
      await db.seed([
        { lane: 'left', title: 'One', tags: ['politics', 'economy'] },
        { lane: 'center', title: 'Two', tags: ['politics'] },
        { lane: 'right', title: 'Three', tags: ['sport', 'politics'] },
      ]);

      const res = await request.get('/api/tags/counts');

      expect(res.status()).toBe(200);
      expect(await res.json()).toEqual([
        { tag: 'politics', count: 3 },
        { tag: 'economy', count: 1 },
        { tag: 'sport', count: 1 },
      ]);
    }
  );

  test.fixme(
    'T0.2 /fragments/cards rejects an invalid filter',
    { annotation: { type: 'jira', description: 'BAL-7, BAL-37' } },
    async ({ request }) => {
      const res = await request.get('/fragments/cards?filter=bogus');

      expect(res.status()).toBe(400);
    }
  );
});
