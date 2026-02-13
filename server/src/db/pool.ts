import pg from 'pg';

const { Pool } = pg;

let pool: pg.Pool;

export function getPool(): pg.Pool {
    if (!pool) {
        pool = new Pool({
            connectionString:
                process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/careersim',
            max: 20,
        });
    }
    return pool;
}

export async function initDb(): Promise<void> {
    const p = getPool();
    // Verify connection
    const client = await p.connect();
    try {
        await client.query('SELECT NOW()');
        console.log('Database connected');
    } finally {
        client.release();
    }
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
): Promise<pg.QueryResult<T>> {
    return getPool().query<T>(text, params);
}
