"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWalletBalance = void 0;
exports.creditWalletController = creditWalletController;
exports.debitWalletController = debitWalletController;
const drizzle_orm_1 = require("drizzle-orm");
const db_1 = require("../config/db");
const wallet_1 = require("../model/wallet");
const wallet_service_1 = require("../services/wallet.service");
const library_controller_1 = require("./library.controller");
//create wallet controller
async function creditWalletController(req, res) {
    try {
        const userId = (0, library_controller_1.getUserJwtFromToken)(req);
        const { amount, pin, comicSlug } = req.body;
        if (!amount || amount <= 0) {
            return res.status(400).json({ error: "Invalid amount" });
        }
        const result = await (0, wallet_service_1.creditWallet)(userId, amount);
        return res.status(200).json(result);
    }
    catch (error) {
        console.error("Error crediting wallet:", error);
        return res
            .status(500)
            .json({ error: error.message || "Internal server error" });
    }
}
// get wallet balance by jwt
const getWalletBalance = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(400).json({ message: "Invalid token payload" });
        }
        // Query wallet from DB
        const [wallet] = await db_1.db
            .select()
            .from(wallet_1.userWallets)
            .where((0, drizzle_orm_1.eq)(wallet_1.userWallets.userProfileId, req.user.id))
            .limit(1);
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        // ✅ Always return a plain number
        return res.json({ balance: Number(wallet.nwtBalance) });
    }
    catch (err) {
        console.error("Error fetching wallet balance:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
};
exports.getWalletBalance = getWalletBalance;
// debit wallet controller
async function debitWalletController(req, res) {
    try {
        const { userId, amount } = req.body;
        if (!userId || !amount) {
            return res.status(400).json({ error: "userId and amount are required" });
        }
        const result = await (0, wallet_service_1.debitWallet)(userId, amount);
        res.json(result);
    }
    catch (error) {
        if (error.message === "Insufficient funds") {
            return res.status(400).json({ error: error.message });
        }
        if (error.message === "Wallet not found") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({ error: "Internal server error" });
    }
}
