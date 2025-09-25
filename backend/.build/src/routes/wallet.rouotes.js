"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/common/auth");
const router = (0, express_1.Router)();
router.get("/my-wallet", auth_1.authenticate, (req, res) => {
    const userId = req.userId;
    res.json({
        message: `Fetching wallet for user ${userId}`,
    });
});
exports.default = router;
