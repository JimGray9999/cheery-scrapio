import { test as base, expect } from '@playwright/test';
import { connect, disconnect, resetDb, seed, laneOf } from './db';

interface Db {
  seed: typeof seed;
  laneOf: typeof laneOf;
}

interface TestFixtures {
  /** Empties the database before the test and gives access to seeding helpers. */
  db: Db;
}

interface WorkerFixtures {
  dbConnection: void;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  dbConnection: [
    async ({}, use) => {
      await connect();
      await use();
      await disconnect();
    },
    { scope: 'worker' },
  ],

  db: async ({ dbConnection: _dbConnection }, use) => {
    await resetDb();
    await use({ seed, laneOf });
  },

  // The layout loads Google Fonts. Stub it so tests do not depend on the internet and
  // so an offline run does not report fake network errors.
  page: async ({ page }, use) => {
    await page.route(/^https:\/\/fonts\.(googleapis|gstatic)\.com\//, route =>
      route.fulfill({ status: 200, contentType: 'text/css', body: '' })
    );
    await use(page);
  },
});

export { expect };

/** Card locator by article id; works in the feed and in search results. */
export const card = (id: string) => `.article-card[data-id="${id}"]`;
