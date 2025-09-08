import { Request, Response } from "express";
import { db } from "../config/db";
import { tickets, events } from "../model/schema"; // adjust path if needed
import { AuthRequest } from "../middleware/common/auth";
import { eq } from "drizzle-orm";

export const purchaseTicket = async (req: any, res: any) => {
  const { eventId, paymentMethod, amount } = req.body;
  const userId = req.userId;

  if (!eventId || !paymentMethod || !amount) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  // Check if event exists
  const event = await db
    .select()
    .from(events)
    .where(eq(events.id, eventId))
    .limit(1);
  if (event.length === 0) {
    return res.status(404).json({ message: "Event not found" });
  }

  // Validate payment
  if (paymentMethod === "nwt") {
    // Here you would call your Wallet service; placeholder logic:
    console.log(`[Wallet] Deducting ${amount} NWT for user ${userId}`);
  } else if (paymentMethod === "fiat") {
    // Here you would verify fiat payment; placeholder logic:
    console.log(`[Payment] Verifying fiat payment for user ${userId}`);
  } else {
    return res.status(400).json({ message: "Invalid payment method" });
  }

  // Insert ticket
  const [ticket] = await db
    .insert(tickets)
    .values({
      eventId,
      userId,
      paymentMethod,
      amount,
    })
    .returning({ id: tickets.id });

  return res.status(201).json({ ticketId: ticket.id });
};
