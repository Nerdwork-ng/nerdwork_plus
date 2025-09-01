const { SSMClient, PutParameterCommand } = require('@aws-sdk/client-ssm');

const ssmClient = new SSMClient({ region: 'eu-west-1' });

const stage = 'dev';

// Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
const config = {
  '/nerdwork/dev/jwt-secret': {
    value: 'nerdwork-jwt-secret-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
    type: 'SecureString'
  },
  '/nerdwork/dev/database-url': {
    value: 'postgresql://postgres:password@localhost:5432/nerdwork', // REPLACE WITH YOUR DB
    type: 'SecureString'
  },
  '/nerdwork/dev/helio-api-key': {
    value: 'your-helio-api-key-here', // REPLACE WITH ACTUAL HELIO KEY
    type: 'SecureString'
  },
  '/nerdwork/dev/helio-cluster': {
    value: 'devnet',
    type: 'String'
  },
  '/nerdwork/dev/helio-receiver-wallet': {
    value: 'your-solana-wallet-address-here', // REPLACE WITH YOUR WALLET
    type: 'String'
  },
  '/nerdwork/dev/payment-success-url': {
    value: 'https://localhost:3000/payment/success',
    type: 'String'
  }
};

async function setupParameters() {
  console.log('🔧 Setting up Parameter Store values in Ireland...');
  
  for (const [name, { value, type }] of Object.entries(config)) {
    try {
      const command = new PutParameterCommand({
        Name: name,
        Value: value,
        Type: type,
        Overwrite: true
      });
      
      await ssmClient.send(command);
      console.log(`✅ Set parameter: ${name}`);
    } catch (error) {
      console.error(`❌ Failed to set ${name}:`, error.message);
    }
  }
  
  console.log('');
  console.log('🎉 Parameter setup completed!');
  console.log('');
  console.log('⚠️  IMPORTANT: Update these parameters with your actual values:');
  console.log('- database-url: Your actual database connection string');
  console.log('- helio-api-key: Your Helio API key from dashboard');
  console.log('- helio-receiver-wallet: Your Solana wallet address');
  console.log('- payment-success-url: Your frontend domain');
  console.log('');
  console.log('🔍 View parameters in AWS Console: Systems Manager → Parameter Store');
}

setupParameters().catch(console.error);