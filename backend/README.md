# Nerdwork+ Backend - Microservices Architecture

A modern comic reading platform backend with NWT token integration, built using microservices architecture with Express.js, TypeScript, and PostgreSQL.

## 🎯 Platform Overview

**Nerdwork+** is a digital comic reading platform with native Web3 token system designed to scale from 0 to 10,000+ users. The platform features comic discovery, reading progress tracking, NWT token purchases, event ticketing, and complete financial auditing through double-entry bookkeeping.

## 🏗️ Microservices Architecture

```
                    ┌─────────────────────────────────────┐
                    │            API Gateway              │
                    │         (Port 3000)                 │
                    │    Request Routing & Auth           │
                    └─────────────┬───────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│ Auth Service│           │ User Service│           │Comic Service│
│  (Port 3001)│           │ (Port 3002) │           │ (Port 3003) │
│             │           │             │           │             │
│ - Signup    │           │ - Profiles  │           │ - Discovery │
│ - Login     │           │ - Settings  │           │ - Reading   │
│ - JWT       │           │ - History   │           │ - Progress  │
└─────────────┘           └─────────────┘           └─────────────┘

        │                         │                         │
        ▼                         ▼                         ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│Wallet Service│          │Event Service│           │Ledger Service│
│ (Port 3004) │           │ (Port 3005) │           │ (Port 3006) │
│             │           │             │           │             │
│ - NWT Tokens│           │ - Events    │           │ - Accounting│
│ - Purchases │           │ - Tickets   │           │ - Audit     │
│ - Balance   │           │ - Booking   │           │ - Integrity │
└─────────────┘           └─────────────┘           └─────────────┘
```

## 🚀 Services Overview

### 1. **API Gateway** (Port 3000)
- **Technology**: Express.js + http-proxy-middleware
- **Purpose**: Single entry point for all client requests
- **Features**: Request routing, authentication validation, CORS, rate limiting

### 2. **Auth Service** (Port 3001) 
- **Purpose**: User authentication & authorization
- **Features**: JWT tokens, user registration, login, session management
- **Database**: `auth_users`, `auth_sessions`, `password_resets`

### 3. **User Service** (Port 3002)
- **Purpose**: User profile & preferences management
- **Features**: User profiles, reading history, preferences, settings
- **Database**: `user_profiles`

### 4. **Comic Service** (Port 3003)
- **Purpose**: Comic catalog, reading, and progress tracking
- **Features**: Comic discovery, reading interface, progress tracking, reviews
- **Database**: `comics`, `comic_pages`, `reading_progress`, `comic_purchases`

### 5. **Wallet Service** (Port 3004)
- **Purpose**: NWT token management & payments
- **Features**: Stripe integration, token purchases, balance management, transactions
- **Database**: `wallets`, `transactions`, `payment_methods`, `nwt_pricing`

### 6. **Event Service** (Port 3005)
- **Purpose**: Events, conventions, and ticket management
- **Features**: Event discovery, ticket booking, attendee management
- **Database**: `events`, `tickets`, `bookings`, `event_categories`

### 7. **Ledger Service** (Port 3006)
- **Purpose**: Financial integrity & double-entry bookkeeping
- **Features**: Transaction ledger, audit trail, trial balance, financial reports
- **Database**: `accounts`, `ledger_entries`, `transactions`, `account_balances`

## 📋 Prerequisites

- Node.js (v18 or higher)
- Docker & Docker Compose
- PostgreSQL database
- Stripe account (for payments)
- npm or yarn package manager

## 🔧 Installation & Setup

### Option 1: Docker Compose (Recommended)

1. **Clone and setup environment:**
```bash
git clone <repository-url>
cd backend
cp .env.example .env
```

2. **Configure environment variables in `.env`:**
```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nerdwork_db

# JWT & Security
JWT_SECRET=your-super-secret-jwt-key

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Service URLs (Docker Compose will handle these)
AUTH_SERVICE_URL=http://auth-service:3001
USER_SERVICE_URL=http://user-service:3002
COMIC_SERVICE_URL=http://comic-service:3003
WALLET_SERVICE_URL=http://wallet-service:3004
EVENT_SERVICE_URL=http://event-service:3005
LEDGER_SERVICE_URL=http://ledger-service:3006
```

3. **Start all services:**
```bash
docker-compose up --build
```

### Option 2: Individual Services Development

1. **Terminal 1 - API Gateway:**
```bash
cd api-gateway
npm install
npm start  # Runs on port 3000
```

2. **Terminal 2 - Auth Service:**
```bash
cd services/auth-service
npm install
npm start  # Runs on port 3001
```

3. **Terminal 3 - User Service:**
```bash
cd services/user-service
npm install
npm start  # Runs on port 3002
```

4. **Terminal 4 - Comic Service:**
```bash
cd services/comic-service
npm install
npm start  # Runs on port 3003
```

5. **Terminal 5 - Wallet Service:**
```bash
cd services/wallet-service
npm install
npm start  # Runs on port 3004
```

6. **Terminal 6 - Event Service:**
```bash
cd services/event-service
npm install
npm start  # Runs on port 3005
```

7. **Terminal 7 - Ledger Service:**
```bash
cd services/ledger-service
npm install
npm start  # Runs on port 3006
```

## 📚 API Documentation

### Health Checks
```bash
# API Gateway
curl http://localhost:3000/health

# Individual Services
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service  
curl http://localhost:3003/health  # Comic Service
curl http://localhost:3004/health  # Wallet Service
curl http://localhost:3005/health  # Event Service
curl http://localhost:3006/health  # Ledger Service
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Register a new user |
| POST | `/auth/login` | User login |
| GET | `/auth/me` | Get current user info |

### Comic Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/comics` | Browse comics (with filters) |
| GET | `/comics/:id` | Get comic details |
| GET | `/comics/:id/pages` | Get comic pages (access controlled) |
| POST | `/comics/:id/progress` | Update reading progress |
| GET | `/comics/user/history` | Get reading history |

### Wallet & Payment Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/wallet` | Get user wallet balance |
| GET | `/wallet/pricing` | Get NWT pricing packages |
| POST | `/wallet/purchase` | Purchase NWT tokens with Stripe |
| POST | `/wallet/spend` | Spend NWT tokens |
| GET | `/wallet/transactions` | Get transaction history |
| POST | `/wallet/payment-methods` | Add payment method |

### Event Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/events` | Browse events (with filters) |
| GET | `/events/:id` | Get event details |
| POST | `/events/:id/book` | Book event tickets |
| GET | `/events/user/bookings` | Get user's bookings |
| GET | `/events/categories` | Get event categories |

### Ledger & Reporting Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/ledger/transactions` | Create double-entry transaction |
| GET | `/ledger/transactions` | Get transaction history |
| GET | `/ledger/accounts` | Get chart of accounts |
| GET | `/ledger/accounts/:id/balance` | Get account balance |
| GET | `/ledger/reports/trial-balance` | Generate trial balance report |
| GET | `/ledger/audit-trail` | Get audit trail |

### Example API Calls

**User Registration:**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "comicfan"
  }'
```

**Browse Comics:**
```bash
curl -X GET "http://localhost:3000/comics?genre=superhero&page=1&limit=10"
```

**Purchase NWT Tokens:**
```bash
curl -X POST http://localhost:3000/wallet/purchase \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "packageId": "starter-pack-uuid",
    "paymentMethodId": "pm_stripe_payment_method"
  }'
```

## 💾 Database Architecture

### Shared PostgreSQL Database
Each service owns specific tables but shares the same database:

```sql
-- Auth Service Tables
auth_users, auth_sessions, password_resets

-- User Service Tables  
user_profiles

-- Comic Service Tables
comics, comic_pages, reading_progress, comic_purchases, comic_reviews

-- Wallet Service Tables
wallets, transactions, payment_methods, nwt_pricing

-- Event Service Tables
events, tickets, bookings, event_categories, event_reviews

-- Ledger Service Tables (Double-Entry Bookkeeping)
accounts, ledger_entries, transactions, account_balances, audit_trail
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication across services
- **Double-Entry Ledger**: Financial integrity with balanced accounting
- **Audit Trail**: Complete transaction history and user activity logging
- **Input Validation**: Request validation and sanitization
- **CORS Protection**: Cross-origin request security
- **Rate Limiting**: API endpoint protection (configurable)

## 🎯 NWT Token System

### Token Economics
- Users purchase NWT tokens with fiat currency (Stripe)
- Tokens are spent on premium comics, event tickets, exclusive content
- All transactions recorded in double-entry ledger for financial integrity
- Real-time balance tracking and transaction history

### Financial Integrity
- **Double-Entry Bookkeeping**: Every transaction has equal debits and credits
- **Audit Trail**: Immutable record of all financial activities
- **Trial Balance**: Regular financial reconciliation reports
- **Account Balances**: Real-time balance calculations with integrity checks

## 🚀 Deployment

### Local Development
```bash
# Docker Compose
docker-compose up --build

# Individual Services
npm start  # In each service directory
```

### AWS Production Deployment
Each service can be deployed independently:

```bash
# Deploy individual services
cd services/auth-service && npm run deploy
cd services/wallet-service && npm run deploy
# ... etc for all services

# Deploy API Gateway
cd api-gateway && npm run deploy
```

### Infrastructure as Code
```bash
# Deploy AWS infrastructure
aws cloudformation deploy \
  --template-file deployment/aws-infrastructure.yml \
  --stack-name nerdwork-infrastructure \
  --parameter-overrides \
    Environment=production \
    DatabasePassword=YOUR_DB_PASSWORD \
    JWTSecret=YOUR_JWT_SECRET \
  --capabilities CAPABILITY_IAM
```

## 📊 Monitoring & Observability

### Health Monitoring
- Health check endpoints on all services
- Docker health checks configured
- Service dependency tracking

### Logging
- Structured JSON logging across all services  
- Request/response logging in API Gateway
- Error tracking and alerting

### Metrics (Future Enhancement)
- Service performance metrics
- Business metrics (token purchases, comic reads)
- Financial reconciliation monitoring

## 🧪 Testing

### Running Tests
```bash
# Test individual services
cd services/auth-service && npm test
cd services/wallet-service && npm test

# Integration testing
npm run test:integration
```

### API Testing
Use the provided Postman collection or test individual endpoints:

```bash
# Test user flow
curl -X POST http://localhost:3000/auth/signup -d '{"email":"test@test.com","password":"test123","username":"testuser"}'
curl -X POST http://localhost:3000/auth/login -d '{"email":"test@test.com","password":"test123"}'
curl -X GET http://localhost:3000/comics -H "Authorization: Bearer JWT_TOKEN"
```

## 🔮 Roadmap & Future Enhancements

### Phase 1 (Current) - Core Platform ✅
- [x] Microservices architecture
- [x] User authentication & profiles  
- [x] Comic catalog & reading
- [x] NWT token system with Stripe
- [x] Event ticketing system
- [x] Double-entry bookkeeping ledger

### Phase 2 - Advanced Features 📝
- [ ] Comic recommendation engine
- [ ] Social features (following, sharing)
- [ ] Creator tools & dashboard
- [ ] Advanced analytics & reporting
- [ ] Mobile API optimizations
- [ ] Content delivery network integration

### Phase 3 - Scale & Performance 📝  
- [ ] Database per service
- [ ] Message queues (Redis/RabbitMQ)
- [ ] Caching layer (Redis)
- [ ] Advanced monitoring (Prometheus/Grafana)
- [ ] Auto-scaling policies
- [ ] Multi-region deployment

## 📁 Project Structure

```
backend/
├── api-gateway/                 # API Gateway service
│   ├── src/
│   │   ├── index.ts            # Main gateway server
│   │   ├── middleware/         # Common middleware
│   │   └── lambda.ts           # AWS Lambda handler
│   ├── Dockerfile
│   └── serverless.yml
├── services/
│   ├── auth-service/           # Authentication service
│   │   ├── src/
│   │   │   ├── controller/     # Route controllers
│   │   │   ├── middleware/     # Auth middleware
│   │   │   ├── model/          # Database models
│   │   │   ├── routes/         # Express routes
│   │   │   └── config/         # Database config
│   │   └── ...
│   ├── user-service/           # User profile service
│   ├── comic-service/          # Comic catalog service
│   ├── wallet-service/         # NWT token & payment service
│   ├── event-service/          # Event & ticket service
│   └── ledger-service/         # Financial ledger service
├── deployment/
│   └── aws-infrastructure.yml  # CloudFormation template
├── docker-compose.yml          # Multi-service orchestration
├── .env.example               # Environment template
└── README.md                  # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes to the appropriate service
4. Write tests for new functionality
5. Update documentation
6. Commit changes (`git commit -m 'Add amazing feature'`)
7. Push to branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow existing code structure per service
- Maintain API consistency across services
- Update API documentation for new endpoints
- Ensure financial transactions maintain ledger integrity
- Add health checks for new services
- Test service integration end-to-end

## 🆘 Troubleshooting

### Common Issues

**Service Discovery Problems:**
```bash
# Check if all services are running
docker-compose ps

# Check service logs
docker-compose logs auth-service
```

**Database Connection Issues:**
```bash
# Verify database URL in .env
echo $DATABASE_URL

# Test database connection
psql $DATABASE_URL -c "SELECT 1;"
```

**JWT Token Issues:**
- Ensure `JWT_SECRET` is consistent across all services
- Check token expiration settings
- Verify Authorization header format: `Bearer <token>`

**Financial Ledger Issues:**
- Verify debits equal credits in all transactions
- Check account balance reconciliation
- Review audit trail for transaction history

### Debug Mode
```bash
# Enable debug logging
DEBUG=* npm start

# Service-specific debugging
DEBUG=auth-service:* npm start
DEBUG=wallet-service:* npm start
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For technical support:

1. **Documentation**: Check this README and service-specific docs
2. **GitHub Issues**: Create detailed issue reports
3. **Service Logs**: Check individual service logs for errors
4. **Health Checks**: Verify all services are operational



✔ Service deployed to stack nerdwork-backend-dev (246s)

endpoints:                                                                                                                          
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/users/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/comics/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/events/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/ledger/{proxy+}
  ANY - https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/files/{proxy+}
functions:
  api-gateway: nerdwork-backend-dev-api-gateway (1.3 MB)                                                                            
  auth-service: nerdwork-backend-dev-auth-service (1.3 MB)
  user-service: nerdwork-backend-dev-user-service (1.3 MB)
  comic-service: nerdwork-backend-dev-comic-service (1.3 MB)
  wallet-service: nerdwork-backend-dev-wallet-service (1.3 MB)
  event-service: nerdwork-backend-dev-event-service (1.3 MB)
  ledger-service: nerdwork-backend-dev-ledger-service (1.3 MB)
  file-service: nerdwork-backend-dev-file-service (1.3 MB)

### Monitoring Service Health
```bash
# Check all services
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3002/health  # User Service  
curl http://localhost:3003/health  # Comic Service
curl http://localhost:3004/health  # Wallet Service
curl http://localhost:3005/health  # Event Service
curl http://localhost:3006/health  # Ledger Service
```

---

**Built with ❤️ for the comic reading community**

*Nerdwork+ - Where comics meet cutting-edge technology*