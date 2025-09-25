"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEvent = void 0;
const db_1 = require("../config/db");
const events_1 = require("../model/events");
const getEvent = async (_req, res) => {
    try {
        const result = await db_1.db.select().from(events_1.events);
        res.status(200).json(result);
    }
    catch (err) {
        res.status(500).json({ message: "Failed to fetch events", error: err });
    }
};
exports.getEvent = getEvent;
