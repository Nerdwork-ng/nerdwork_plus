"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handler = void 0;
const serverless_express_1 = __importDefault(require("@vendia/serverless-express"));
const server_1 = __importDefault(require("./src/server"));
let serverlessApp;
// Initialize serverless express
const initializeApp = () => {
    if (!serverlessApp) {
        console.log("Initializing serverless express wrapper");
        serverlessApp = (0, serverless_express_1.default)({ app: server_1.default });
    }
    return serverlessApp;
};
const handler = async (event, context) => {
    try {
        console.log("Lambda handler invoked", {
            path: event.path,
            method: event.httpMethod,
            headers: Object.keys(event.headers || {})
        });
        const app = initializeApp();
        return await app(event, context);
    }
    catch (error) {
        console.error("Lambda handler error:", error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: "Internal server error",
                message: error instanceof Error ? error.message : "Unknown error"
            })
        };
    }
};
exports.handler = handler;
