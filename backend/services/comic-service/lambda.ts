import serverlessExpress from "@vendia/serverless-express";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import bodyParser from "body-parser";
import morgan from "morgan";
import comicRoutes from "../../src/routes/comic.routes";
import chapterRoutes from "../../src/routes/chapter.routes";
import libraryRoutes from "../../src/routes/library.routes";
import { globalErrorHandler, globalNotFoundHandler } from "../../src/middleware/common";
import { authenticate } from "../../src/middleware/common/auth";

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Routes - API Gateway handles the prefixes
app.use("/comics", comicRoutes);
app.use("/chapters", chapterRoutes);
app.use("/library", libraryRoutes);

// Health check
app.get("/health", (req, res) => {
  res.json({ service: "comic-service", status: "healthy", timestamp: new Date().toISOString() });
});

// Error handlers
app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

let serverlessApp: any;

const initializeApp = () => {
  if (!serverlessApp) {
    console.log("Initializing comic-service serverless express wrapper");
    serverlessApp = serverlessExpress({ app });
  }
  return serverlessApp;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Comic Service Lambda handler invoked", {
      path: event.path,
      method: event.httpMethod,
      service: "comic-service"
    });
    
    const app = initializeApp();
    return await app(event, context);
  } catch (error) {
    console.error("Comic Service Lambda handler error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        service: "comic-service",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    };
  }
};