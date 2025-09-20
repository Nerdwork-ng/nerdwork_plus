import { drizzle } from "drizzle-orm/node-postgres";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import * as schema from "../model/schema";
import { DATABASE_URL } from "./envs";
import { Pool } from "pg";

config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool);

// config({ path: ".env.local" });
// if (!DATABASE_URL) {
//   throw new Error("DATABASE_URL is not defined");
// }

// const sql = neon(DATABASE_URL);
// export const db = drizzle({ client: sql, schema });
