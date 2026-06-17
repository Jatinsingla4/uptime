/**
 * D1 database client wrapper with typed query helpers.
 * All queries use parameterized statements — never raw string interpolation.
 */
export type D1Database = import('@cloudflare/workers-types').D1Database;

export function createDbClient(db: D1Database) {
  return {
    // ─── Raw access ────────────────────────────────────────────────────────
    raw: db,

    // ─── Batch helper ──────────────────────────────────────────────────────
    async batch<T>(statements: D1PreparedStatement[]): Promise<T[][]> {
      const results = await db.batch(statements);
      return results.map((r) => r.results as T[]);
    },
  };
}

export type DbClient = ReturnType<typeof createDbClient>;
export type D1PreparedStatement = ReturnType<D1Database['prepare']>;
