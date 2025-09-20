import { db } from "../config/db";
import { tickets } from "../model/tickets";

export async function issueTicket(
  userId: string,
  eventId: string,
  quantity = 1
) {
  const [ticket] = await db
    .insert(tickets)
    .values({
      userProfileId: userId,
      eventId,
      quantity,
      status: "issued",
    })
    .returning();

  return ticket;
}
