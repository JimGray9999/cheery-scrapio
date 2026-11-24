import { test, expect, card } from '../support/fixtures';

test.describe('Notes', { tag: '@regression' }, () => {
  test('save a note from the dialog and see the badge, also after reload', async ({ page, db }) => {
    const [a] = await db.seed([{ lane: 'center', title: 'Note on me' }]);
    await page.goto('/all');
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toHaveCount(0);

    await page.locator(`${card(a.id)} .btn-comment`).click();
    const dialog = page.locator(`#dialog-${a.id}`);
    await expect(dialog).toBeVisible();

    await dialog.locator(`#note-header-${a.id}`).fill('My note');
    await dialog.locator(`#note-text-${a.id}`).fill('This is a longer comment.');
    await dialog.getByRole('button', { name: 'Save Note' }).click();

    await expect(page.locator('#toast')).toContainText('Note saved!');
    await expect(dialog).not.toBeVisible();
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toBeVisible();

    await page.reload();
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toBeVisible();
  });

  test('Cancel closes the dialog without saving', async ({ page, db }) => {
    const [a] = await db.seed([{ lane: 'left', title: 'Cancel me' }]);
    await page.goto('/all');

    await page.locator(`${card(a.id)} .btn-comment`).click();
    const dialog = page.locator(`#dialog-${a.id}`);
    await dialog.locator(`#note-header-${a.id}`).fill('Draft title');
    await dialog.getByRole('button', { name: 'Cancel' }).click();

    await expect(dialog).not.toBeVisible();
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toHaveCount(0);
  });

  test('POST /articles/:id rejects short notes and unknown articles', async ({ request, db }) => {
    const [a] = await db.seed([{ lane: 'left', title: 'Validate me' }]);

    const tooShort = await request.post(`/articles/${a.id}`, {
      data: { header: 'ab', text: 'short' },
    });
    expect(tooShort.status()).toBe(400);
    expect((await tooShort.json()).errors.length).toBeGreaterThan(0);

    const missing = await request.post('/articles/64b7f0f0f0f0f0f0f0f0f0f0', {
      data: { header: 'A title', text: 'A long enough comment.' },
    });
    expect(missing.status()).toBe(404);
  });

  test('DELETE /articles/:id/note removes the note from the article', async ({
    request,
    page,
    db,
  }) => {
    const [a] = await db.seed([{ lane: 'right', title: 'Delete my note' }]);
    const created = await request.post(`/articles/${a.id}`, {
      data: { header: 'A title', text: 'A long enough comment.' },
    });
    expect(created.status()).toBe(200);

    await page.goto('/all');
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toBeVisible();

    const deleted = await request.delete(`/articles/${a.id}/note`);
    expect(deleted.status()).toBe(200);

    await page.reload();
    await expect(page.locator(`${card(a.id)} .card-note-badge`)).toHaveCount(0);
  });
});
