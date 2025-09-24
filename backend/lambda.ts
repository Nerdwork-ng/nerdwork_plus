import serverlessExpress from "@vendia/serverless-express";
import app from "./src/server";

let serverlessApp: any;

// Debug log
console.log("Lambda bootstrapping... app is:", typeof app);
console.log("Is app a function?", typeof app === "function");
console.log("App keys:", Object.keys(app || {}));

export const handler = async (event: any, context: any) => {
  if (!serverlessApp) {
    serverlessApp = serverlessExpress({ app });
  }
  return serverlessApp(event, context);
};
