/**
 * @jest-environment jsdom
 */

function createDeferred() {
  let resolve;
  const promise = new Promise(res => {
    resolve = res;
  });
  return { promise, resolve };
}

async function flush(times = 5) {
  for (let i = 0; i < times; i += 1) {
    await Promise.resolve();
  }
}

describe('client search — out-of-order responses', () => {
  let searchDeferreds;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    searchDeferreds = [];

    document.body.innerHTML = `
      <input id="search-input" />
      <div id="search-results"></div>
      <div id="main-content"></div>
    `;

    global.fetch = jest.fn(url => {
      if (url.startsWith('/api/tags')) {
        return Promise.resolve({ ok: true, json: async () => ({ tags: [] }) });
      }
      if (url.startsWith('/api/search')) {
        const deferred = createDeferred();
        searchDeferreds.push(deferred);
        return deferred.promise;
      }
      return Promise.reject(new Error('unexpected fetch ' + url));
    });

    require('../../public/js/app.js');
  });

  afterEach(() => {
    jest.useRealTimers();
    delete global.fetch;
  });

  // R1: typing "ab" then "abc" fires two overlapping /api/search requests. If the
  // older "ab" response arrives after the newer "abc" response, the UI must still
  // reflect "abc" — not get overwritten by the stale, slower response.
  test.failing(
    'keeps only the latest query results when an older request resolves last',
    async () => {
      const input = document.getElementById('search-input');
      const resultsEl = document.getElementById('search-results');

      input.value = 'ab';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await jest.advanceTimersByTimeAsync(300);

      input.value = 'abc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      await jest.advanceTimersByTimeAsync(300);

      expect(searchDeferreds).toHaveLength(2);

      // Newer request ("abc") resolves first.
      searchDeferreds[1].resolve({
        ok: true,
        json: async () => ({
          articles: [
            { _id: 'b1', source: 'Guardian', title: 'ABC article', left: false, right: false },
          ],
        }),
      });
      await flush();

      // Older request ("ab") resolves last.
      searchDeferreds[0].resolve({
        ok: true,
        json: async () => ({
          articles: [
            { _id: 'a1', source: 'Guardian', title: 'AB article', left: false, right: false },
          ],
        }),
      });
      await flush();

      expect(resultsEl.textContent).toContain('ABC article');
      expect(resultsEl.textContent).not.toContain('AB article');
    }
  );
});
