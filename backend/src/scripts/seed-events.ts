import { db } from "../config/db";
import { events } from "../model/schema";

async function seedEvents() {
  await db.insert(events).values([
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
