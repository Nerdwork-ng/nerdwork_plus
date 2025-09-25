"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const db_1 = require("../config/db");
const event_1 = require("../model/event");
async function seedEvents() {
    await db_1.db.insert(event_1.events).values([
        {
            name: "Nerdwork Launch Summit",
            description: "A launch event for the Nerdwork+ community platform.",
            date: new Date("2025-08-15T18:00:00Z"),
            ticketPrice: "2500.00",
        },
    ]);
    console.log("Event seeded successfully.");
}
seedEvents().catch((err) => {
    console.error("Seeding failed:", err);
});
