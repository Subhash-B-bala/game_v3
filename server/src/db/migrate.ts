import { query } from './pool.js';

const MIGRATIONS = [
    {
        version: 1,
        name: 'create_player_sessions',
        sql: `
      CREATE TABLE IF NOT EXISTS player_sessions (
        session_id      UUID PRIMARY KEY,
        player_id       UUID,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        current_chapter INT NOT NULL DEFAULT 0,
        current_scene   TEXT NOT NULL DEFAULT 'entry',
        scene_completed BOOLEAN NOT NULL DEFAULT FALSE,
        run_number      INT NOT NULL DEFAULT 1,
        role_choice     TEXT,
        experience_level TEXT,
        mindset_bias    TEXT,
        state_vector    JSONB NOT NULL,
        action_history  JSONB NOT NULL DEFAULT '[]'::jsonb,
        event_queue     JSONB NOT NULL DEFAULT '[]'::jsonb,
        applied_events  JSONB NOT NULL DEFAULT '[]'::jsonb,
        career_mirror   JSONB
      );
    `,
    },
    {
        version: 2,
        name: 'create_analytics_events',
        sql: `
      CREATE TABLE IF NOT EXISTS analytics_events (
        event_id    UUID PRIMARY KEY,
        session_id  UUID NOT NULL,
        event_type  TEXT NOT NULL,
        payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
        client_ts   TIMESTAMPTZ NOT NULL,
        server_ts   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_analytics_session
        ON analytics_events (session_id);

      CREATE INDEX IF NOT EXISTS idx_analytics_type_ts
        ON analytics_events (event_type, server_ts);
    `,
    },
    {
        version: 3,
        name: 'create_analytics_rollups',
        sql: `
      CREATE TABLE IF NOT EXISTS analytics_rollups (
        rollup_date DATE NOT NULL,
        event_type  TEXT NOT NULL,
        dimensions  JSONB NOT NULL DEFAULT '{}'::jsonb,
        count       INT NOT NULL DEFAULT 0,
        avg_duration FLOAT,
        PRIMARY KEY (rollup_date, event_type, dimensions)
      );
    `,
    },
    {
        version: 4,
        name: 'create_migrations_table',
        sql: `
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INT PRIMARY KEY,
        name    TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `,
    },
];

export async function migrate(): Promise<void> {
    // Ensure migrations table exists first
    await query(MIGRATIONS[3].sql);

    for (const m of MIGRATIONS) {
        const { rows } = await query<{ version: number }>(
            'SELECT version FROM schema_migrations WHERE version = $1',
            [m.version],
        );
        if (rows.length === 0) {
            console.log(`Running migration ${m.version}: ${m.name}`);
            await query(m.sql);
            await query(
                'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
                [m.version, m.name],
            );
        }
    }
    console.log('All migrations applied');
}

// Run directly
migrate()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    });
