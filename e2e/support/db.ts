import mongoose from 'mongoose';
import Article from '../../models/Article';
import Note from '../../models/Note';

export type Lane = 'left' | 'center' | 'right';

export interface SeedArticle {
  title: string;
  lane: Lane;
  tags?: string[];
  source?: string;
  link?: string;
  time?: string;
}

export interface SeededArticle {
  id: string;
  title: string;
  lane: Lane;
}

const SOURCES: Record<Lane, string> = {
  left: 'The Guardian',
  center: 'BBC News',
  right: 'Free Republic',
};

export async function connect(): Promise<void> {
  const uri = process.env.E2E_MONGODB_URI;
  if (!uri) throw new Error('E2E_MONGODB_URI is not set; global setup did not run.');
  await mongoose.connect(uri);
  if (!mongoose.connection.name.includes('e2e')) {
    throw new Error(`Refusing to wipe database "${mongoose.connection.name}".`);
  }
  await Article.init();
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
}

export async function resetDb(): Promise<void> {
  await Promise.all([Article.deleteMany({}), Note.deleteMany({})]);
}

/**
 * Inserts articles in the order given. The app lists newest first (by _id), so the
 * LAST article in the array appears at the top of its lane.
 */
export async function seed(articles: SeedArticle[]): Promise<SeededArticle[]> {
  const docs = await Article.insertMany(
    articles.map(a => ({
      title: a.title,
      link: a.link ?? `https://example.com/${encodeURIComponent(a.title)}`,
      time: a.time ?? '2 hours ago',
      left: a.lane === 'left',
      right: a.lane === 'right',
      source: a.source ?? SOURCES[a.lane],
      tags: a.tags ?? [],
    }))
  );
  return docs.map((d, i) => ({
    id: String(d._id),
    title: articles[i].title,
    lane: articles[i].lane,
  }));
}

/** Creates `count` articles titled "<prefix> 01", "<prefix> 02", ... in one lane. */
export function laneOf(lane: Lane, count: number, prefix: string): SeedArticle[] {
  return Array.from({ length: count }, (_, i) => ({
    lane,
    title: `${prefix} ${String(i + 1).padStart(2, '0')}`,
  }));
}
