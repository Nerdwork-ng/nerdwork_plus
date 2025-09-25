"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const body_parser_1 = __importDefault(require("body-parser"));
const morgan_1 = __importDefault(require("morgan"));
const auth_routes_1 = __importDefault(require("../../src/routes/auth.routes"));
const common_1 = require("../../src/middleware/common");
const app = (0, express_1.default)();
// Middleware
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, morgan_1.default)("dev"));
// Routes - Remove /auth prefix since it's handled by API Gateway
app.use("/", auth_routes_1.default);
// Health check
app.get("/health", (req, res) => {
    res.json({ service: "auth-service", status: "healthy", timestamp: new Date().toISOString() });
});
// Error handlers
app.use(common_1.globalNotFoundHandler);
app.use(common_1.globalErrorHandler);
let serverlessApp;
const initializeApp = () => {
    if (!serverlessApp) {
        console.log("Initializing auth-service serverless express wrapper");
        serverlessApp = (0, serverless_express_1.default)({ app });
    }
    return serverlessApp;
};
const handler = async (event, context) => {
    try {
        console.log("Auth Service Lambda handler invoked", {
            path: event.path,
            method: event.httpMethod,
            service: "auth-service"
        });
        const app = initializeApp();
        return await app(event, context);
    }
    catch (error) {
        console.error("Auth Service Lambda handler error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal server error",
                service: "auth-service",
                message: error instanceof Error ? error.message : "Unknown error"
            })
        };
    }
};
exports.handler = handler;
