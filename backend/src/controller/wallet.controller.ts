import { eq } from "drizzle-orm";
import { db } from "../config/db";
import { userWallets } from "../model/wallet";
import { creditWallet, debitWallet } from "../services/wallet.service";
import { getUserJwtFromToken } from "./library.controller";

//create wallet controller
export async function creditWalletController(req, res) {
  try {
    const userId = getUserJwtFromToken(req);
    const { amount, pin, comicSlug } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const result = await creditWallet(userId, amount);
    return res.status(200).json(result);
  } catch (error: any) {
    console.error("Error crediting wallet:", error);
    return res
      .status(500)
      .json({ error: error.message || "Internal server error" });
  }
}

// get wallet balance by jwt
export const getWalletBalance = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(400).json({ message: "Invalid token payload" });
    }

    // Query wallet from DB
    const [wallet] = await db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userProfileId, req.user.id))
      .limit(1);

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    // ✅ Always return a plain number
    return res.json({ balance: Number(wallet.nwtBalance) });
  } catch (err) {
    console.error("Error fetching wallet balance:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// debit wallet controller
export async function debitWalletController(req, res) {
  try {
    const { userId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ error: "userId and amount are required" });
    }

    const result = await debitWallet(userId, amount);

    res.json(result);
  } catch (error: any) {
    if (error.message === "Insufficient funds") {
      return res.status(400).json({ error: error.message });
    }
    if (error.message === "Wallet not found") {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
}
