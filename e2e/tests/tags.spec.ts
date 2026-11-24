import { test, expect, card } from '../support/fixtures';

test.describe('Tags', { tag: '@regression' }, () => {
  test(
    'add a tag in the dialog, save, and it persists on the card after reload',
    { annotation: { type: 'jira', description: 'BAL-57, BAL-49' } },
    async ({ page, db }) => {
      const [a] = await db.seed([{ lane: 'left', title: 'Tag me' }]);
      await page.goto('/all');

      await page.locator(`${card(a.id)} .btn-tag`).click();
      const dialog = page.locator(`#tag-dialog-${a.id}`);
      await expect(dialog).toBeVisible();
      await expect(dialog.locator(`#tag-current-${a.id}`)).toContainText('No tags yet');

      // The app lowercases tags.
      await dialog.locator(`#tag-input-${a.id}`).fill('Politics');
      await dialog.locator(`#tag-input-${a.id}`).press('Enter');
      await expect(dialog.locator('.tag-pill-edit')).toHaveText(/politics/);

      await dialog.locator('.tag-save-btn').click();

      await expect(page.locator('#toast')).toContainText('Tags saved!');
      await expect(dialog).not.toBeVisible();
      await expect(page.locator(`${card(a.id)} .tag-pill`)).toHaveText(['politics']);
      await expect(page.locator(card(a.id))).toHaveAttribute('data-tags', '["politics"]');

      await page.reload();
      await expect(page.locator(`${card(a.id)} .tag-pill`)).toHaveText(['politics']);
    }
  );

  test('a saved tag is offered as a suggestion on other cards', async ({ page, db }) => {
    const [a, b] = await db.seed([
      { lane: 'left', title: 'First article' },
      { lane: 'center', title: 'Second article' },
    ]);
    await page.goto('/all');

    await page.locator(`${card(a.id)} .btn-tag`).click();
    await page.locator(`#tag-input-${a.id}`).fill('economy');
    await page.locator(`#tag-input-${a.id}`).press('Enter');
    await page.locator(`#tag-dialog-${a.id} .tag-save-btn`).click();
    await expect(page.locator('#toast')).toContainText('Tags saved!');

    // No reload: suggestions come from the allTags list the server returned.
    await page.locator(`${card(b.id)} .btn-tag`).click();
    const suggestion = page.locator(`#tag-suggestions-${b.id} .tag-suggestion`);
    await expect(suggestion).toHaveText(['economy']);

    await suggestion.click();
    await page.locator(`#tag-dialog-${b.id} .tag-save-btn`).click();
    await expect(page.locator(`${card(b.id)} .tag-pill`)).toHaveText(['economy']);

    const res = await page.request.get('/api/tags');
    expect((await res.json()).tags).toEqual(['economy']);
  });

  test('removing the last tag clears the pills on the card', async ({ page, db }) => {
    const [a] = await db.seed([{ lane: 'right', title: 'Has a tag', tags: ['sport'] }]);
    await page.goto('/all');
    await expect(page.locator(`${card(a.id)} .tag-pill`)).toHaveText(['sport']);

    await page.locator(`${card(a.id)} .btn-tag`).click();
    await page.locator(`#tag-dialog-${a.id} .tag-remove[data-tag="sport"]`).click();
    await expect(page.locator(`#tag-current-${a.id}`)).toContainText('No tags yet');
    await page.locator(`#tag-dialog-${a.id} .tag-save-btn`).click();

    await expect(page.locator('#toast')).toContainText('Tags saved!');
    await expect(page.locator(`${card(a.id)} .card-tags`)).toHaveCount(0);
    await expect(page.locator(card(a.id))).toHaveAttribute('data-tags', '[]');
  });

  test('PUT /articles/:id/tags validates input and normalises tags', async ({ request, db }) => {
    const [a] = await db.seed([{ lane: 'left', title: 'API tags' }]);

    const bad = await request.put(`/articles/${a.id}/tags`, { data: { tags: 'nope' } });
    expect(bad.status()).toBe(400);

    const ok = await request.put(`/articles/${a.id}/tags`, {
      data: { tags: [' Politics ', 'politics', 'ECONOMY', ''] },
    });
    expect(ok.status()).toBe(200);
    const body = await ok.json();
    expect(body.tags).toEqual(['politics', 'economy']);
    expect(body.allTags).toEqual(['economy', 'politics']);
  });
});
