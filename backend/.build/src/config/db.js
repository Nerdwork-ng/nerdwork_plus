"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const dotenv_1 = require("dotenv");
const pg_1 = require("pg");
(0, dotenv_1.config)();
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
});
exports.db = (0, node_postgres_1.drizzle)(pool);
// config({ path: ".env.local" });
// if (!DATABASE_URL) {
//   throw new Error("DATABASE_URL is not defined");
// }
// const sql = neon(DATABASE_URL);
// export const db = drizzle({ client: sql, schema });
