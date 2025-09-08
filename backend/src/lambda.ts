import serverless from 'serverless-http';
import { app } from './index';

// Export the serverless handler
export const handler = serverless(app, {
  request: (request: any, event: any, context: any) => {
    // Add custom request processing if needed
    console.log('Request:', {
      method: request.method,
      path: request.path,
      headers: request.headers,
    });
  },
  response: (response: any, request: any, event: any, context: any) => {
    // Add custom response processing if needed
    console.log('Response:', {
      statusCode: response.statusCode,
      headers: response.headers,
    });
  },
});
