import serverlessExpress from "@vendia/serverless-express";
import app from "./src/server";
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from "aws-lambda";

let serverlessApp: any;

// Initialize serverless express
const initializeApp = () => {
  if (!serverlessApp) {
    console.log("Initializing serverless express wrapper");
    serverlessApp = serverlessExpress({ app });
  }
  return serverlessApp;
};

export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  try {
    console.log("Lambda handler invoked", { 
      path: event.path,
      method: event.httpMethod,
      headers: Object.keys(event.headers || {})
    });
    
    const app = initializeApp();
    return await app(event, context);
  } catch (error) {
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
