import { getSecret } from "astro:env/server";
import postgres from "postgres";

export type DatabaseClient = ReturnType<typeof postgres>;

export async function withDatabase<T>(
  operation: (sql: DatabaseClient) => Promise<T>,
): Promise<T> {
  const databaseUrl = getSecret("DATABASE_URL");

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const sql = postgres(databaseUrl, {
    prepare: false,
    max: 1,
  });

  try {
    return await operation(sql);
  } finally {
    await sql.end({ timeout: 5 });
  }
}
