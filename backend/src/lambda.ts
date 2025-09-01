import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  console.log('Health check request:', event.path);
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    body: JSON.stringify({
      message: 'Nerdwork+ Backend is healthy! 🚀',
      timestamp: new Date().toISOString(),
      region: process.env.AWS_REGION || 'unknown',
      stage: process.env.STAGE || 'unknown',
      service: 'nerdwork-backend'
    }),
  };
};
