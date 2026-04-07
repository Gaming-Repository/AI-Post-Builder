import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: int('user_id').notNull().default(1),
  topic: text('topic'),
  tone: text('tone'),
  audience: text('audience'),
  keywords: text('keywords'),
  model: text('model').default('sonnet'),
  videoAnalysisData: text('video_analysis_data'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export const posts = sqliteTable('posts', {
  id: int('id').primaryKey({ autoIncrement: true }),
  userId: int('user_id').notNull().default(1),
  sessionId: text('session_id').notNull().references(() => sessions.id),
  platform: text('platform', {
    enum: ['twitter', 'linkedin', 'instagram', 'facebook'],
  }).notNull(),
  content: text('content').notNull(),
  topic: text('topic'),
  tone: text('tone'),
  audience: text('audience'),
  keywords: text('keywords'),
  model: text('model').default('sonnet'),
  characterCount: int('character_count').notNull(),
  imageUrl: text('image_url'),
  metadata: text('metadata'),
  createdAt: text('created_at').default(sql`(datetime('now'))`),
  updatedAt: text('updated_at').default(sql`(datetime('now'))`),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Platform = 'twitter' | 'linkedin' | 'instagram' | 'facebook';
