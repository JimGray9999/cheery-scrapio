import { test, expect } from '../support/fixtures';

const PAGES = ['/all', '/left', '/right'];

test.describe('Content Security Policy and console hygiene', { tag: '@regression' }, () => {
  for (const path of PAGES) {
    test(
      `${path} sends a strict CSP and has no inline scripts or handlers`,
      { annotation: { type: 'jira', description: 'BAL-58' } },
      async ({ page, db }) => {
        await db.seed([{ lane: 'left', title: 'Left story' }]);

        const response = await page.goto(path);
        const csp = response?.headers()['content-security-policy'] ?? '';
        expect(csp).toContain("script-src 'self'");
        expect(csp).toContain("connect-src 'self'");

        const inline = await page.evaluate(() => {
          const scripts = Array.from(document.querySelectorAll('script:not([src])')).length;
          const handlers: string[] = [];
          document.querySelectorAll('*').forEach(el => {
            for (const attr of Array.from(el.attributes)) {
              if (attr.name.startsWith('on')) handlers.push(`${el.tagName}[${attr.name}]`);
            }
          });
          const external = Array.from(document.querySelectorAll('script[src]')).map(
            s => (s as HTMLScriptElement).src
          );
          return { scripts, handlers, external };
        });
        expect(inline.scripts).toBe(0);
        expect(inline.handlers).toEqual([]);
        // Only the app's own script; no third-party scripts.
        expect(inline.external.every(src => new URL(src).host === new URL(page.url()).host)).toBe(
          true
        );
      }
    );

    test(`${path} loads with no console errors, CSP violations or failed requests`, async ({
      page,
      db,
    }) => {
      await db.seed([
        { lane: 'left', title: 'Left story' },
        { lane: 'center', title: 'Center story' },
        { lane: 'right', title: 'Right story' },
      ]);

      const problems: string[] = [];
      page.on('console', msg => {
        if (msg.type() !== 'error') return;
        // Known bug, tracked by the "no inline style attributes" test below.
        if (msg.text().startsWith('Applying inline style violates')) return;
        problems.push(`console: ${msg.text()}`);
      });
      page.on('pageerror', err => problems.push(`pageerror: ${err.message}`));
      page.on('requestfailed', req => problems.push(`requestfailed: ${req.url()}`));
      page.on('response', res => {
        if (res.status() >= 400) problems.push(`HTTP ${res.status()}: ${res.url()}`);
      });

      await page.goto(path);
      await page.waitForLoadState('networkidle');

      expect(problems).toEqual([]);
    });
  }

  // The policy has no 'unsafe-inline' for styles, so the browser drops every style="..."
  // attribute and logs a CSP error. Today three exist: the tag dialog actions in
  // views/partials/articleCard.handlebars, and buildCard() and renderTagCurrent() in
  // public/js/app.js. Expected to fail until they move into style.css; when it starts
  // passing, Playwright reports it, and the `test.fail` line and the filter above go.
  test(
    'no inline style attributes on rendered cards',
    { annotation: { type: 'jira', description: 'BAL-58' } },
    async ({ page, db }) => {
      test.fail(true, 'Known bug: inline style attributes are blocked by the CSP');
      await db.seed([{ lane: 'left', title: 'Left story' }]);

      await page.goto('/all');

      const inlineStyles = await page.evaluate(() =>
        Array.from(document.querySelectorAll('[style]')).map(el => el.className || el.tagName)
      );
      expect(inlineStyles).toEqual([]);
    }
  );
});
