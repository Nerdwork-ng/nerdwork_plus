"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var dotenv_1 = require("dotenv");
var drizzle_kit_1 = require("drizzle-kit");
(0, dotenv_1.config)({ path: ".env.local" });
exports.default = (0, drizzle_kit_1.defineConfig)({
    schema: "./src/model/schema.ts",
    out: "./migrations",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL,
    },
});
