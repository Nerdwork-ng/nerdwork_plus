import { db } from "../config/db";
import { tickets } from "../model/tickets";

export async function issueTicket(
  userId: string,
  eventId: string,
  paymentMethod: string,
  amount: string
) {
  const [ticket] = await db
    .insert(tickets)
    .values({
      userId,
      eventId,
      paymentMethod,
      amount,
    })
    .returning();

  return ticket;
}
