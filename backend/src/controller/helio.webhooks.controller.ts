import { issueTicket } from "../services/tickets.service";
import { creditWallet } from "../services/wallet.service";

const verifyHelioSignature = (req: Request): boolean => {
  // For now just simulate verification
  return true;
};

export const helioWebhook = async (req, res) => {
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
      await creditWallet(userId, amount);
    }

    // Issue ticket after successful payment
    const ticket = await issueTicket(userId, eventId, paymentType, amount);

    return res.status(200).json({ success: true, ticketId: ticket.id });
  } catch (error: any) {
    console.error("Helio webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
