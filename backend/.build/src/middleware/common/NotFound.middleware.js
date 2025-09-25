"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalNotFoundHandler = void 0;
const globalNotFoundHandler = (req, res, next) => {
    res.status(404).json({ message: "Route not found" });
};
exports.globalNotFoundHandler = globalNotFoundHandler;
