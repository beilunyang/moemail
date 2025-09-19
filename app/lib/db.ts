import { getRequestContext } from "@cloudflare/next-on-pages";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export const createDb = (database?: D1Database) => {
  const db = database ?? getRequestContext().env.DB;
  return drizzle(db, { schema });
};

export type Db = ReturnType<typeof createDb>;
