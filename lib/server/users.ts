import "server-only";

import { randomUUID } from "node:crypto";

import { database } from "@/lib/server/database";

export interface DatabaseUser {
  id: string;
  googleSubject: string | null;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
}

type UserRow = {
  id: string;
  google_subject: string | null;
  email: string;
  name: string;
  avatar_url: string | null;
  email_verified: boolean;
};

type PasswordUserRow = UserRow & {
  password_hash: string | null;
};

function mapUser(row: UserRow): DatabaseUser {
  return {
    id: row.id,
    googleSubject: row.google_subject,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    emailVerified: row.email_verified,
  };
}

export async function findUserById(id: string): Promise<DatabaseUser | null> {
  const sql = database();
  const rows = await sql<UserRow[]>`
    select id, google_subject, email, name, avatar_url, email_verified
    from users
    where id = ${id}
    limit 1
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function upsertGoogleUser(profile: {
  googleSubject: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): Promise<{ user: DatabaseUser; isNewUser: boolean }> {
  const sql = database();
  const existing = await sql<UserRow[]>`
    select id, google_subject, email, name, avatar_url, email_verified
    from users
    where google_subject = ${profile.googleSubject}
       or lower(email) = lower(${profile.email})
    order by (google_subject = ${profile.googleSubject}) desc
    limit 1
  `;

  if (existing[0]) {
    const rows = await sql<UserRow[]>`
      update users
      set google_subject = ${profile.googleSubject},
          email = ${profile.email},
          name = ${profile.name},
          avatar_url = coalesce(${profile.avatarUrl ?? null}, avatar_url),
          email_verified = true,
          updated_at = now()
      where id = ${existing[0].id}
      returning id, google_subject, email, name, avatar_url, email_verified
    `;
    return { user: mapUser(rows[0]), isNewUser: false };
  }

  const rows = await sql<UserRow[]>`
    insert into users (id, google_subject, email, name, avatar_url, email_verified)
    values (
      ${randomUUID()},
      ${profile.googleSubject},
      ${profile.email},
      ${profile.name},
      ${profile.avatarUrl ?? null},
      true
    )
    returning id, google_subject, email, name, avatar_url, email_verified
  `;
  return { user: mapUser(rows[0]), isNewUser: true };
}

export async function findPasswordUserByEmail(email: string): Promise<{
  user: DatabaseUser;
  passwordHash: string;
} | null> {
  const sql = database();
  const rows = await sql<PasswordUserRow[]>`
    select id, google_subject, email, name, avatar_url, email_verified, password_hash
    from users
    where lower(email) = lower(${email})
    limit 1
  `;
  const row = rows[0];
  if (!row?.password_hash) return null;
  return { user: mapUser(row), passwordHash: row.password_hash };
}

export async function createPasswordUser(profile: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<DatabaseUser | null> {
  const sql = database();
  const rows = await sql<UserRow[]>`
    insert into users (
      id, google_subject, email, name, avatar_url, email_verified, password_hash
    ) values (
      ${randomUUID()},
      null,
      ${profile.email},
      ${profile.name},
      null,
      false,
      ${profile.passwordHash}
    )
    on conflict do nothing
    returning id, google_subject, email, name, avatar_url, email_verified
  `;
  return rows[0] ? mapUser(rows[0]) : null;
}

export async function deleteUserById(id: string): Promise<void> {
  const sql = database();
  await sql`delete from users where id = ${id}`;
}
