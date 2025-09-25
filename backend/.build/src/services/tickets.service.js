"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.issueTicket = issueTicket;
const db_1 = require("../config/db");
const tickets_1 = require("../model/tickets");
async function issueTicket(userId, eventId, quantity = 1) {
    const [ticket] = await db_1.db
        .insert(tickets_1.tickets)
        .values({
        userProfileId: userId,
        eventId,
        quantity,
        status: "issued",
    })
        .returning();
    return ticket;
}
