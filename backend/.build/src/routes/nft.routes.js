"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const nft_controller_1 = require("../controller/nft.controller");
const router = (0, express_1.Router)();
// Payment routes
// This route creates a payment link using the Helio API
// It requires the user to be authenticated
// The payment link can be used for various payment methods like card, bank transfer, etc.
// The webhook is set up to listen for payment events
router.post("/mint", nft_controller_1.upload.single("image"), nft_controller_1.mintApiNFT);
router.post("/collection/create", nft_controller_1.createApiCollection);
router.post("/asset/:assetId", nft_controller_1.getAssetData);
router.post("/asset/owner/:ownerAddress", nft_controller_1.getAssetData);
router.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Comic NFT Minting API is running" });
});
exports.default = router;
