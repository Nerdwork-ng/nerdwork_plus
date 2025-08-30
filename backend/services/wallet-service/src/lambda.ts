import serverless from 'serverless-http';
import { app } from './index.js';

// Load environment variables from Parameter Store
const loadParameters = async () => {
  if (process.env.NODE_ENV === 'production' || process.env.STAGE === 'prod') {
    const { SSMClient, GetParametersCommand } = await import('@aws-sdk/client-ssm');
    const ssmClient = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
    
    const parameterNames = [
      `/nerdwork/${process.env.STAGE || 'prod'}/DATABASE_URL`,
      `/nerdwork/${process.env.STAGE || 'prod'}/JWT_SECRET`,
      `/nerdwork/${process.env.STAGE || 'prod'}/STRIPE_SECRET_KEY`,
      `/nerdwork/${process.env.STAGE || 'prod'}/HELIO_API_KEY`,
      `/nerdwork/${process.env.STAGE || 'prod'}/HELIO_RECEIVER_WALLET`,
    ];
    
    try {
      const { Parameters } = await ssmClient.send(
        new GetParametersCommand({
          Names: parameterNames,
          WithDecryption: true,
        })
      );
      
      Parameters?.forEach(param => {
        if (param.Name && param.Value) {
          const envName = param.Name.split('/').pop();
          if (envName) {
            process.env[envName] = param.Value;
          }
        }
      });
      
      console.log('✅ Parameters loaded from Parameter Store');
    } catch (error) {
      console.error('❌ Failed to load parameters:', error);
    }
  }
};

// Initialize parameters on cold start
let parametersLoaded = false;

const serverlessHandler = serverless(app, {
  request: (request: any, event: any, context: any) => {
    console.log('Wallet Service Request:', {
      method: request.method,
      path: request.path,
      service: 'wallet-service',
    });
  },
  response: (response: any, request: any, event: any, context: any) => {
    console.log('Wallet Service Response:', {
      statusCode: response.statusCode,
      service: 'wallet-service',
    });
  },
});

export const handler = async (event: any, context: any) => {
  if (!parametersLoaded) {
    await loadParameters();
    parametersLoaded = true;
  }
  
  return serverlessHandler(event, context);
};