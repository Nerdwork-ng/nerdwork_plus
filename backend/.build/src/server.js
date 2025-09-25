"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const compression_1 = __importDefault(require("compression"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swaggerConfig_1 = require("./config/swaggerConfig");
const common_1 = require("./middleware/common");
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const payment_routes_1 = __importDefault(require("./routes/payment.routes"));
const auth_1 = require("./middleware/common/auth");
const nft_routes_1 = __importDefault(require("./routes/nft.routes"));
const wallet_routes_1 = __importDefault(require("./routes/wallet.routes"));
const profile_routes_1 = __importDefault(require("./routes/profile.routes"));
const comic_routes_1 = __importDefault(require("./routes/comic.routes"));
const chapter_routes_1 = __importDefault(require("./routes/chapter.routes"));
const files_routes_1 = __importDefault(require("./routes/files.routes"));
const library_routes_1 = __importDefault(require("./routes/library.routes"));
const transaction_routes_1 = __importDefault(require("./routes/transaction.routes"));
const app = (0, express_1.default)();
console.log("server.ts: created express app");
// Middleware
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use("/api-docs", swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerConfig_1.swaggerSpec));
// Routes
app.use("/auth", auth_routes_1.default);
app.use("/payment", payment_routes_1.default);
app.use("/nft", auth_1.authenticate, nft_routes_1.default);
app.use("/wallet", auth_1.authenticate, wallet_routes_1.default);
app.use("/profile", profile_routes_1.default);
app.use("/comics", comic_routes_1.default);
app.use("/chapters", chapter_routes_1.default);
app.use("/file-upload", files_routes_1.default);
app.use("/library", library_routes_1.default);
app.use("/transactions", transaction_routes_1.default);
// Health check endpoint
app.get("/", (req, res) => {
    res.status(200).json({ data: "Nerdwork API - Lambda Function" });
});
// Error handlers
app.use(common_1.globalNotFoundHandler);
app.use(common_1.globalErrorHandler);
exports.default = app;
