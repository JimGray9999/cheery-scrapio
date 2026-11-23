/**
 * @jest-environment jsdom
 */

async function flush(times = 5) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

describe('client tag suggestions — removing the last use of a tag', () => {
  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = `
      <datalist id="tag-datalist"></datalist>

      <div class="article-card" data-id="x" data-tags='["solo"]'>
        <div class="card-footer">
          <button class="btn-tag" type="button" data-id="x">Tag</button>
        </div>
      </div>
      <dialog id="tag-dialog-x">
        <div class="tag-current" id="tag-current-x"></div>
        <div class="tag-all-list" id="tag-suggestions-x"></div>
        <button type="button" class="btn-save tag-save-btn" data-id="x">Save Tags</button>
      </dialog>

      <div class="article-card" data-id="y" data-tags="[]">
        <div class="card-footer">
          <button class="btn-tag" type="button" data-id="y">Tag</button>
        </div>
      </div>
      <dialog id="tag-dialog-y">
        <div class="tag-current" id="tag-current-y"></div>
        <div class="tag-all-list" id="tag-suggestions-y"></div>
      </dialog>
    `;

    HTMLDialogElement.prototype.showModal = jest.fn();
    HTMLDialogElement.prototype.close = jest.fn();

    global.fetch = jest.fn(url => {
      if (url === '/api/tags') {
        return Promise.resolve({ ok: true, json: async () => ({ tags: ['solo'] }) });
      }
      if (url === '/articles/x/tags') {
        return Promise.resolve({ ok: true, json: async () => ({ tags: [] }) });
      }
      return Promise.reject(new Error('unexpected fetch ' + url));
    });

    require('../../public/js/app.js');
  });

  afterEach(() => {
    delete global.fetch;
  });

  // R2: article x is the sole article tagged "solo". Removing it from x and saving
  // should mean article y's tag dialog no longer offers "solo" as a suggestion.
  test("drops the tag from other articles' suggestions once its last use is removed", async () => {
    await flush(); // let loadAllTags() populate allTags = ['solo']

    document.querySelector('.btn-tag[data-id="x"]').click();
    document.querySelector('#tag-current-x .tag-remove[data-tag="solo"]').click();
    document.querySelector('.tag-save-btn[data-id="x"]').click();
    await flush();

    document.querySelector('.btn-tag[data-id="y"]').click();

    const suggestionsY = document.getElementById('tag-suggestions-y');
    expect(suggestionsY.querySelector('[data-tag="solo"]')).toBeNull();
  });
});
