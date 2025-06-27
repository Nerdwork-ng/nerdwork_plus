// import { config } from "dotenv";
// import { defineConfig } from "drizzle-kit";

// config({ path: ".env.local" });

// export default defineConfig({
//   schema: "./src/model/schema.ts",
//   out: "./migrations",
//   dialect: "postgresql",
//   dbCredentials: {
//     url: process.env.DATABASE_URL!,
//   },
// });

import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

export default defineConfig({
  schema: "./src/model/schema.ts",
  out: "./migrations",
  driver: "pg", // ✅ pg driver for PostgreSQL
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
});
