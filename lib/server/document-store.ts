import "server-only";

import { randomUUID } from "node:crypto";

import { database } from "@/lib/server/database";

export interface StoredRecord<T extends object> {
  id: string;
  data: T;
}

type Filter =
  | { field: string; op: "eq"; value: string }
  | { field: string; op: "in"; value: string[] };

function jsonValue<T extends object>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function getRecord<T extends object>(
  collection: string,
  id: string
): Promise<StoredRecord<T> | null> {
  const sql = database();
  const rows = await sql<{ id: string; data: T }[]>`
    select id, data
    from app_records
    where collection = ${collection} and id = ${id}
    limit 1
  `;
  return rows[0] ?? null;
}

export async function createRecord<T extends object>(
  collection: string,
  data: T,
  id: string = randomUUID()
): Promise<StoredRecord<T>> {
  const sql = database();
  const clean = jsonValue(data);
  const rows = await sql<{ id: string; data: T }[]>`
    insert into app_records (collection, id, data)
    values (${collection}, ${id}, ${sql.json(clean as never)})
    on conflict do nothing
    returning id, data
  `;
  if (!rows[0]) throw new Error(`A ${collection} record with this identifier already exists.`);
  return rows[0];
}

export async function setRecord<T extends object>(
  collection: string,
  id: string,
  data: T,
  options: { merge?: boolean } = {}
): Promise<StoredRecord<T>> {
  const sql = database();
  const clean = jsonValue(data);
  const rows = options.merge
    ? await sql<{ id: string; data: T }[]>`
        insert into app_records (collection, id, data)
        values (${collection}, ${id}, ${sql.json(clean as never)})
        on conflict (collection, id) do update
        set data = app_records.data || excluded.data, updated_at = now()
        returning id, data
      `
    : await sql<{ id: string; data: T }[]>`
        insert into app_records (collection, id, data)
        values (${collection}, ${id}, ${sql.json(clean as never)})
        on conflict (collection, id) do update
        set data = excluded.data, updated_at = now()
        returning id, data
      `;
  return rows[0];
}

export async function deleteRecord(collection: string, id: string): Promise<boolean> {
  const sql = database();
  const rows = await sql<{ id: string }[]>`
    delete from app_records
    where collection = ${collection} and id = ${id}
    returning id
  `;
  return rows.length > 0;
}

export async function deleteRecords(collection: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const sql = database();
  await sql`
    delete from app_records
    where collection = ${collection} and id in ${sql(ids)}
  `;
}

export async function queryRecords<T extends object>(
  collection: string,
  filters: Filter[],
  limit = 100
): Promise<Array<StoredRecord<T>>> {
  const sql = database();
  const clauses = filters.map((filter) =>
    filter.op === "eq"
      ? sql`data ->> ${filter.field} = ${filter.value}`
      : sql`data ->> ${filter.field} in ${sql(filter.value)}`
  );
  const filterSql = clauses.length ? sql`and ${clauses.reduce((left, right) => sql`${left} and ${right}`)}` : sql``;
  return sql<Array<{ id: string; data: T }>>`
    select id, data
    from app_records
    where collection = ${collection} ${filterSql}
    order by created_at desc
    limit ${Math.min(Math.max(limit, 1), 500)}
  `;
}

export async function deleteRecordsByUser(
  collections: readonly string[],
  userId: string
): Promise<void> {
  if (!collections.length) return;
  const sql = database();
  await sql`
    delete from app_records
    where collection in ${sql([...collections])}
      and data ->> 'userId' = ${userId}
  `;
}
