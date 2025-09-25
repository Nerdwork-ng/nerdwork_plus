"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/common/auth");
const router = (0, express_1.Router)();
router.get("/my-events", auth_1.authenticate, (req, res) => {
    const userId = req.userId;
    res.status(200).json({ userId });
});
exports.default = router;
