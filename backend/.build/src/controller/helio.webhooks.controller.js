"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helioWebhook = void 0;
const tickets_service_1 = require("../services/tickets.service");
const wallet_service_1 = require("../services/wallet.service");
const verifyHelioSignature = (req) => {
    // For now just simulate verification
    return true;
};
const helioWebhook = async (req, res) => {
    try {
        if (!verifyHelioSignature(req)) {
            return res.status(400).json({ error: "Invalid signature" });
        }
        const { userId, paymentType, amount, status, eventId, txId } = req.body;
        if (status !== "success") {
            return res.status(400).json({ error: "Payment not successful" });
        }
        if (paymentType === "NWT") {
            // Credit wallet
            await (0, wallet_service_1.creditWallet)(userId, amount);
        }
        // Issue ticket after successful payment
        const ticket = await (0, tickets_service_1.issueTicket)(userId, eventId, txId);
        return res.status(200).json({ success: true, ticketId: ticket.id });
    }
    catch (error) {
        console.error("Helio webhook error:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.helioWebhook = helioWebhook;
