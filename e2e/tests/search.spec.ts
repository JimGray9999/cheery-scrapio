import { test, expect, card } from '../support/fixtures';

const SEED = [
  { lane: 'left', title: 'Inflation cools across Britain' },
  { lane: 'center', title: 'Inflation data surprises markets' },
  { lane: 'right', title: 'Border policy debate continues' },
] as const;

test.describe('Search', { tag: '@regression' }, () => {
  test(
    'typing shows grouped results, detaches the feed, and Escape restores it',
    { annotation: { type: 'jira', description: 'BAL-38' } },
    async ({ page, db }) => {
      await db.seed([...SEED]);
      await page.goto('/all');
      await expect(page.locator('#main-content .article-card')).toHaveCount(3);

      await page.locator('#search-input').fill('inflation');

      const results = page.locator('#search-results');
      await expect(results).toHaveClass(/active/);
      await expect(results.locator('.search-results-header')).toContainText('2 results for');
      await expect(results.locator('.article-card')).toHaveCount(2);
      // The feed is removed from the DOM while results show, so ids stay unique.
      await expect(page.locator('#main-content .article-card')).toHaveCount(0);

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

      await page.locator('#search-input').press('Escape');

      await expect(results).not.toHaveClass(/active/);
      await expect(page.locator('#search-input')).toHaveValue('');
      await expect(page.locator('#main-content .article-card')).toHaveCount(3);
    }
  );

  test('a query with no matches says so', async ({ page, db }) => {
    await db.seed([...SEED]);
    await page.goto('/all');

    await page.locator('#search-input').fill('zzzqxv');

    await expect(page.locator('#search-results .search-results-header')).toContainText(
      'No results for'
    );
  });

  test('a one-character query does not search', async ({ page, db }) => {
    await db.seed([...SEED]);
    await page.goto('/all');

    await page.locator('#search-input').fill('i');
    // Longer than the 300ms debounce, so a request would have started.
    await page.waitForTimeout(500);

    await expect(page.locator('#search-results')).not.toHaveClass(/active/);
    await expect(page.locator('#main-content .article-card')).toHaveCount(3);
  });

  test(
    'tagging a search result updates the same article in the feed once search is cleared',
    { annotation: { type: 'jira', description: 'BAL-57' } },
    async ({ page, db }) => {
      const [left] = await db.seed([...SEED]);
      await page.goto('/all');
      await page.locator('#search-input').fill('inflation');
      await expect(page.locator('#search-results .article-card')).toHaveCount(2);

      await page.locator(`#search-results ${card(left.id)} .btn-tag`).click();
      await page.locator(`#tag-input-${left.id}`).fill('economy');
      await page.locator(`#tag-input-${left.id}`).press('Enter');
      await page.locator(`#tag-dialog-${left.id} .tag-save-btn`).click();
      await expect(page.locator('#toast')).toContainText('Tags saved!');
      await expect(page.locator(`#search-results ${card(left.id)} .tag-pill`)).toHaveText([
        'economy',
      ]);

      await page.locator('#search-input').press('Escape');

      await expect(page.locator(`#main-content ${card(left.id)} .tag-pill`)).toHaveText([
        'economy',
      ]);
    }
  );

  test('GET /api/search validates its parameters', async ({ request }) => {
    expect((await request.get('/api/search?q=a')).status()).toBe(400);
    expect((await request.get('/api/search?q=inflation&filter=bogus')).status()).toBe(400);
  });
});
