"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const server_1 = __importDefault(require("./server"));
// For local development only
if (process.env.NODE_ENV !== "production" && require.main === module) {
    const PORT = process.env.PORT || 5000;
    server_1.default.listen(PORT, () => {
        console.log(`Server running at http://localhost:${PORT}`);
        console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
}
exports.default = server_1.default;
