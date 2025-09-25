"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/common/auth");
const router = (0, express_1.Router)();
router.get("/me", auth_1.authenticate, (req, res) => {
    const userId = req.userId;
    res.json({
        message: `User profile for user ${userId}`,
    });
});
exports.default = router;
