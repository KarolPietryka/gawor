import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    summary: text('summary').notNull().default(''),
    createdAt: text('created_at').notNull(),
  },
  (table) => [index('idx_sessions_created_at').on(table.createdAt)],
);

export const practiceSets = sqliteTable(
  'practice_sets',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [uniqueIndex('idx_practice_sets_session_id').on(table.sessionId)],
);

export const sentences = sqliteTable(
  'sentences',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    german: text('german').notNull(),
    polish: text('polish').notNull().default(''),
    note: text('note').notNull().default(''),
    textHash: text('text_hash').notNull(),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_sentences_session_id').on(table.sessionId),
    uniqueIndex('idx_sentences_session_hash').on(
      table.sessionId,
      table.textHash,
    ),
  ],
);

export const practiceSetSentences = sqliteTable(
  'practice_set_sentences',
  {
    practiceSetId: text('practice_set_id')
      .notNull()
      .references(() => practiceSets.id, { onDelete: 'cascade' }),
    sentenceId: text('sentence_id')
      .notNull()
      .references(() => sentences.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.practiceSetId, table.sentenceId] }),
    uniqueIndex('idx_practice_set_position').on(
      table.practiceSetId,
      table.position,
    ),
  ],
);

export const audioAssets = sqliteTable(
  'audio_assets',
  {
    id: text('id').primaryKey(),
    practiceSetId: text('practice_set_id')
      .notNull()
      .references(() => practiceSets.id, { onDelete: 'cascade' }),
    contentHash: text('content_hash').notNull(),
    status: text('status', {
      enum: ['ready', 'stale', 'pending', 'failed'],
    }).notNull(),
    fileUrl: text('file_url'),
    voice: text('voice').notNull().default('de-DE-KatjaNeural'),
    pauseMultiplier: integer('pause_multiplier_milli').notNull().default(1500),
    durationMs: integer('duration_ms'),
    objectKey: text('object_key'),
    manifestJson: text('manifest_json'),
    createdAt: text('created_at').notNull(),
    updatedAt: text('updated_at').notNull(),
  },
  (table) => [
    index('idx_audio_assets_practice_set').on(
      table.practiceSetId,
      table.updatedAt,
    ),
    uniqueIndex('idx_audio_assets_set_content').on(
      table.practiceSetId,
      table.contentHash,
    ),
  ],
);

export const vocabulary = sqliteTable(
  'vocabulary',
  {
    id: text('id').primaryKey(),
    sessionId: text('session_id')
      .notNull()
      .references(() => sessions.id, { onDelete: 'cascade' }),
    german: text('german').notNull(),
    polish: text('polish').notNull().default(''),
  },
  (table) => [
    uniqueIndex('idx_vocabulary_session_german').on(
      table.sessionId,
      table.german,
    ),
  ],
);
