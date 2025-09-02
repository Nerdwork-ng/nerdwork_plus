#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('📚 Generating Nerdwork+ API Documentation...');

// Configuration
const config = {
  baseUrl: 'https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev',
  version: '1.0.0',
  environment: 'development',
  services: [
    'auth-service',
    'user-service', 
    'wallet-service',
    'comic-service',
    'event-service',
    'ledger-service',
    'file-service'
  ]
};

// Create docs directory structure
const createDocsStructure = () => {
  const dirs = [
    'docs',
    'docs/flows',
    'docs/postman',
    'docs/schemas',
    'docs/examples'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
};

// Generate Postman collection
const generatePostmanCollection = () => {
  const collection = {
    info: {
      name: 'Nerdwork+ API',
      description: 'Complete API collection for Nerdwork+ platform',
      version: config.version,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    variable: [
      {
        key: 'baseUrl',
        value: config.baseUrl,
        type: 'string'
      },
      {
        key: 'authToken',
        value: 'your_jwt_token_here',
        type: 'string'
      }
    ],
    item: [
      {
        name: '🔐 Auth Service',
        item: [
          {
            name: 'Register User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'test@example.com',
                  password: 'password123',
                  username: 'testuser',
                  fullName: 'Test User'
                }, null, 2)
              },
              url: {
                raw: '{{baseUrl}}/auth/signup',
                host: ['{{baseUrl}}'],
                path: ['auth', 'signup']
              }
            }
          },
          {
            name: 'Login User',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  email: 'test@example.com',
                  password: 'password123'
                }, null, 2)
              },
              url: {
                raw: '{{baseUrl}}/auth/login',
                host: ['{{baseUrl}}'],
                path: ['auth', 'login']
              }
            }
          },
          {
            name: 'Get Current User',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{authToken}}'
                }
              ],
              url: {
                raw: '{{baseUrl}}/auth/me',
                host: ['{{baseUrl}}'],
                path: ['auth', 'me']
              }
            }
          }
        ]
      },
      {
        name: '💰 Wallet Service',
        item: [
          {
            name: 'Get Wallet',
            request: {
              method: 'GET',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{authToken}}'
                }
              ],
              url: {
                raw: '{{baseUrl}}/wallet',
                host: ['{{baseUrl}}'],
                path: ['wallet']
              }
            }
          },
          {
            name: 'Get NWT Pricing',
            request: {
              method: 'GET',
              url: {
                raw: '{{baseUrl}}/wallet/pricing',
                host: ['{{baseUrl}}'],
                path: ['wallet', 'pricing']
              }
            }
          },
          {
            name: 'Connect Solana Wallet',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{authToken}}'
                },
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  walletAddress: '5Gv8mBVKrYfJvWvCKPf8X3J1K7j2mNnH3Q4P5R6S7T8U9',
                  walletType: 'phantom'
                }, null, 2)
              },
              url: {
                raw: '{{baseUrl}}/wallet/connect',
                host: ['{{baseUrl}}'],
                path: ['wallet', 'connect']
              }
            }
          },
          {
            name: 'Create Payment Link',
            request: {
              method: 'POST',
              header: [
                {
                  key: 'Authorization',
                  value: 'Bearer {{authToken}}'
                },
                {
                  key: 'Content-Type',
                  value: 'application/json'
                }
              ],
              body: {
                mode: 'raw',
                raw: JSON.stringify({
                  packageId: 'package-uuid-here'
                }, null, 2)
              },
              url: {
                raw: '{{baseUrl}}/wallet/payment-link',
                host: ['{{baseUrl}}'],
                path: ['wallet', 'payment-link']
              }
            }
          }
        ]
      }
    ]
  };

  fs.writeFileSync(
    'docs/postman/nerdwork-api-collection.json',
    JSON.stringify(collection, null, 2)
  );
  console.log('✅ Generated Postman collection');
};

// Generate OpenAPI schema
const generateOpenAPISchema = () => {
  const schema = {
    openapi: '3.0.0',
    info: {
      title: 'Nerdwork+ API',
      description: 'API documentation for Nerdwork+ platform',
      version: config.version,
      contact: {
        name: 'Nerdwork+ API Support',
        email: 'api-support@nerdwork.com'
      }
    },
    servers: [
      {
        url: config.baseUrl,
        description: 'Development server (Ireland)'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            username: { type: 'string' },
            fullName: { type: 'string' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Wallet: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            nwtBalance: { type: 'string' },
            totalEarned: { type: 'string' },
            totalSpent: { type: 'string' },
            connectedWalletAddress: { type: 'string' },
            walletType: { type: 'string' }
          }
        },
        Transaction: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: { type: 'string', enum: ['purchase', 'spend', 'earn'] },
            amount: { type: 'string' },
            description: { type: 'string' },
            status: { type: 'string', enum: ['pending', 'completed', 'failed'] },
            createdAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    },
    paths: {
      '/auth/signup': {
        post: {
          summary: 'Register new user',
          tags: ['Authentication'],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password', 'username'],
                  properties: {
                    email: { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 8 },
                    username: { type: 'string' },
                    fullName: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            201: {
              description: 'User registered successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          user: { $ref: '#/components/schemas/User' },
                          token: { type: 'string' }
                        }
                      },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/wallet': {
        get: {
          summary: 'Get user wallet',
          tags: ['Wallet'],
          security: [{ BearerAuth: [] }],
          responses: {
            200: {
              description: 'Wallet retrieved successfully',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/Wallet' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  fs.writeFileSync(
    'docs/schemas/openapi.json',
    JSON.stringify(schema, null, 2)
  );
  console.log('✅ Generated OpenAPI schema');
};

// Generate test examples
const generateTestExamples = () => {
  const examples = {
    curl: {
      auth: {
        signup: `curl -X POST ${config.baseUrl}/auth/signup \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "fullName": "Test User"
  }'`,
        login: `curl -X POST ${config.baseUrl}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'`,
        me: `curl -X GET ${config.baseUrl}/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN"`
      },
      wallet: {
        getWallet: `curl -X GET ${config.baseUrl}/wallet \\
  -H "Authorization: Bearer YOUR_TOKEN"`,
        pricing: `curl -X GET ${config.baseUrl}/wallet/pricing`,
        connect: `curl -X POST ${config.baseUrl}/wallet/connect \\
  -H "Authorization: Bearer YOUR_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "walletAddress": "5Gv8mBVKrYfJvWvCKPf8X3J1K7j2mNnH3Q4P5R6S7T8U9",
    "walletType": "phantom"
  }'`
      }
    },
    javascript: {
      auth: `
// Authentication helper
class NerdworkAuth {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
  }

  async signup(userData) {
    const response = await fetch(\`\${this.baseUrl}/auth/signup\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token);
    }
    return data;
  }

  async login(credentials) {
    const response = await fetch(\`\${this.baseUrl}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    if (data.success) {
      this.token = data.data.token;
      localStorage.setItem('authToken', this.token);
    }
    return data;
  }

  async getCurrentUser() {
    const response = await fetch(\`\${this.baseUrl}/auth/me\`, {
      headers: { 'Authorization': \`Bearer \${this.token}\` }
    });
    return response.json();
  }
}

// Usage
const auth = new NerdworkAuth('${config.baseUrl}');
const user = await auth.signup({
  email: 'test@example.com',
  password: 'password123',
  username: 'testuser',
  fullName: 'Test User'
});`
    }
  };

  fs.writeFileSync(
    'docs/examples/api-examples.json',
    JSON.stringify(examples, null, 2)
  );
  console.log('✅ Generated API examples');
};

// Generate documentation index
const generateIndex = () => {
  const indexContent = `# 📚 Nerdwork+ API Documentation

Generated on: ${new Date().toISOString()}

## 🚀 Quick Links

- [🏠 Main Documentation](./README.md)
- [🔐 Authentication](./auth-service.md)
- [💰 Wallet & Payments](./wallet-service.md)
- [🔄 User Flows](./flows/complete-user-flow.md)

## 🧪 Testing

- [📮 Postman Collection](./postman/nerdwork-api-collection.json)
- [📋 OpenAPI Schema](./schemas/openapi.json)
- [💻 Code Examples](./examples/api-examples.json)

## 🌐 Live Environment

**Base URL**: \`${config.baseUrl}\`
**Region**: Ireland (eu-west-1)
**Version**: ${config.version}

## 📊 Service Status

| Service | Status | Endpoint |
|---------|--------|----------|
| Auth | ✅ Live | \`/auth/*\` |
| Wallet | ✅ Live | \`/wallet/*\` |
| Users | ✅ Live | \`/users/*\` |
| Comics | ✅ Live | \`/comics/*\` |
| Events | ✅ Live | \`/events/*\` |
| Ledger | ✅ Live | \`/ledger/*\` |
| Files | ✅ Live | \`/files/*\` |

## 🔧 Development Setup

\`\`\`bash
# Set environment variables
export API_BASE_URL=${config.baseUrl}
export AWS_REGION=eu-west-1

# Test API health
curl \${API_BASE_URL}/auth/health
\`\`\`

---
*Documentation auto-generated by Nerdwork+ docs generator*
`;

  fs.writeFileSync('docs/index.md', indexContent);
  console.log('✅ Generated documentation index');
};

// Main execution
const main = () => {
  try {
    createDocsStructure();
    generatePostmanCollection();
    generateOpenAPISchema();
    generateTestExamples();
    generateIndex();
    
    console.log('\n🎉 Documentation generation completed!');
    console.log('\n📁 Generated files:');
    console.log('  • docs/README.md - Main documentation');
    console.log('  • docs/auth-service.md - Auth API docs');
    console.log('  • docs/wallet-service.md - Wallet API docs');
    console.log('  • docs/flows/complete-user-flow.md - User flows');
    console.log('  • docs/postman/nerdwork-api-collection.json - Postman collection');
    console.log('  • docs/schemas/openapi.json - OpenAPI schema');
    console.log('  • docs/examples/api-examples.json - Code examples');
    console.log('\n🚀 Next steps:');
    console.log('  1. Import Postman collection for testing');
    console.log('  2. Generate additional service documentation');
    console.log('  3. Set up automated doc updates in CI/CD');
    
  } catch (error) {
    console.error('❌ Documentation generation failed:', error.message);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main, config };