"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.purchaseTicket = void 0;
const db_1 = require("../config/db");
const drizzle_orm_1 = require("drizzle-orm");
const events_1 = require("../model/events");
const purchaseTicket = async (req, res) => {
    const { eventId, paymentMethod, amount } = req.body;
    const userId = req.userId;
    if (!eventId || !paymentMethod || !amount) {
        return res.status(400).json({ message: "Missing required fields" });
    }
    // Check if event exists
    const event = await db_1.db
        .select()
        .from(events_1.events)
        .where((0, drizzle_orm_1.eq)(events_1.events.id, eventId))
        .limit(1);
    if (event.length === 0) {
        return res.status(404).json({ message: "Event not found" });
    }
    // Validate payment
    if (paymentMethod === "nwt") {
        // Here you would call your Wallet service; placeholder logic:
        console.log(`[Wallet] Deducting ${amount} NWT for user ${userId}`);
    }
    else if (paymentMethod === "fiat") {
        // Here you would verify fiat payment; placeholder logic:
        console.log(`[Payment] Verifying fiat payment for user ${userId}`);
    }
    else {
        return res.status(400).json({ message: "Invalid payment method" });
    }
    // Insert ticket
    // const [ticket] = await db
    //   .insert(tickets)
    //   .values({
    //     eventId,
    //     userId,
    //     paymentMethod,
    //     amount,
    //   })
    //   .returning({ id: tickets.id });
    return res
        .status(201)
        .json({ ticketId: 123, message: "Ticket purchased successfully" });
};
exports.purchaseTicket = purchaseTicket;
