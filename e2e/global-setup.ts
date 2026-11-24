import type { Server } from 'node:http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import createApp from '../app';
import Article from '../models/Article';

const port = Number(process.env.E2E_PORT ?? 5057);

/**
 * Starts MongoDB and the real Express app in this process, before any worker
 * runs. Workers inherit E2E_MONGODB_URI so they can seed data directly.
 *
 * - Default: an in-memory MongoDB (mongodb-memory-server downloads mongod on first use).
 * - E2E_MONGODB_URI=mongodb://...: use that server instead. The database name must
 *   contain "e2e", because every test wipes the collections it uses.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  // Turns off the rate limiters (they skip when NODE_ENV is "test").
  process.env.NODE_ENV = 'test';

  let memory: MongoMemoryServer | undefined;
  let uri = process.env.E2E_MONGODB_URI;
  if (!uri) {
    memory = await MongoMemoryServer.create();
    uri = memory.getUri('cheery-scrapio-e2e');
  }
  process.env.E2E_MONGODB_URI = uri;

  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  if (!mongoose.connection.name.includes('e2e')) {
    await mongoose.disconnect();
    await memory?.stop();
    throw new Error(
      `Refusing to run: database "${mongoose.connection.name}" does not contain "e2e". ` +
        'End-to-end tests delete data, so point E2E_MONGODB_URI at a dedicated database.'
    );
  }
  // Build the text index that /api/search relies on before the first test.
  await Article.init();

  const server: Server = await new Promise((resolve, reject) => {
    const s = createApp().listen(port, '127.0.0.1', () => resolve(s));
    s.on('error', reject);
  });

  return async () => {
    await new Promise<void>(resolve => server.close(() => resolve()));
    await mongoose.disconnect();
    await memory?.stop();
  };
}
