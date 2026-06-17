import type { D1Database } from '../client';
import type { User, UserPlan } from '@sitepulse/shared/types';

export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  plan: UserPlan;
  created_at: number;
  updated_at: number;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    plan: row.plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const usersQueries = {
  async getById(db: D1Database, id: string): Promise<User | null> {
    const row = await db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(id)
      .first<UserRow>();
    return row ? rowToUser(row) : null;
  },

  async getByEmail(db: D1Database, email: string): Promise<User | null> {
    const row = await db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<UserRow>();
    return row ? rowToUser(row) : null;
  },

  async create(
    db: D1Database,
    data: { id: string; email: string; name?: string | null; plan?: UserPlan }
  ): Promise<User> {
    const now = Date.now();
    await db
      .prepare(
        'INSERT INTO users (id, email, name, plan, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(data.id, data.email, data.name ?? null, data.plan ?? 'free', now, now)
      .run();
    return { id: data.id, email: data.email, name: data.name ?? null, plan: data.plan ?? 'free', createdAt: now, updatedAt: now };
  },

  async update(
    db: D1Database,
    id: string,
    data: { name?: string | null; plan?: UserPlan }
  ): Promise<void> {
    const now = Date.now();
    const fields: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.plan !== undefined) { fields.push('plan = ?'); values.push(data.plan); }
    if (fields.length === 0) return;

    fields.push('updated_at = ?');
    values.push(now, id);

    await db
      .prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`)
      .bind(...values)
      .run();
  },
};
