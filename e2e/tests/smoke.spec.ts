import { test, expect } from '../support/fixtures';

test.describe('Smoke: pages and lanes', { tag: '@smoke' }, () => {
  test('GET /health reports ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  test('/all shows each article in its own lane', async ({ page, db }) => {
    await db.seed([
      { lane: 'left', title: 'Left story one' },
      { lane: 'center', title: 'Center story one' },
      { lane: 'right', title: 'Right story one' },
    ]);

    await page.goto('/all');

    await expect(page.locator('.col-left .col-label')).toHaveText('Left');
    await expect(page.locator('.col-center .col-label')).toHaveText('Center');
    await expect(page.locator('.col-right .col-label')).toHaveText('Right');
    await expect(page.locator('.col-left .card-title')).toHaveText(['Left story one']);
    await expect(page.locator('.col-center .card-title')).toHaveText(['Center story one']);
    await expect(page.locator('.col-right .card-title')).toHaveText(['Right story one']);
  });

  for (const lane of ['left', 'right'] as const) {
    test(`/${lane} lists only ${lane} articles and marks the nav link active`, async ({
      page,
      db,
    }) => {
      await db.seed([
        { lane: 'left', title: 'Left story one' },
        { lane: 'center', title: 'Center story one' },
        { lane: 'right', title: 'Right story one' },
      ]);

      await page.goto(`/${lane}`);

      await expect(page.locator('.article-card')).toHaveCount(1);
      await expect(page.locator(`.col-${lane} .article-card`)).toHaveCount(1);
      await expect(page.locator('.nav-link.active')).toHaveText(new RegExp(`^${lane}$`, 'i'));
    });
  }

  test('empty database shows an empty state with a scrape button in every lane', async ({
    page,
    db,
  }) => {
    void db;
    await page.goto('/all');

    await expect(page.locator('.article-card')).toHaveCount(0);
    for (const lane of ['left', 'center', 'right']) {
      const empty = page.locator(`.col-${lane} .empty-state`);
      await expect(empty).toBeVisible();
      await expect(empty).toContainText(`No ${lane} articles yet.`);
      await expect(empty.getByRole('button', { name: /Scrape now/ })).toBeVisible();
    }
  });

  test('unknown routes return 404', async ({ request }) => {
    const res = await request.get('/definitely-not-a-route');
    expect(res.status()).toBe(404);
  });
});
