"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/common/auth");
const ticket_1 = require("../controller/ticket");
const router = express_1.default.Router();
router.post("/tickets", auth_1.authenticate, ticket_1.purchaseTicket);
exports.default = router;
