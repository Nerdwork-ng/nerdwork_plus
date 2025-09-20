# NerdWork Backend

A modern comic reading platform backend with Web3 integration, built with Express.js, TypeScript, and PostgreSQL.

## 🚀 Features

- **Authentication System**: Secure user authentication and authorization
- **Database Integration**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Web3 Ready**: Built with Web3 integration capabilities
- **TypeScript**: Full TypeScript support for type safety
- **Testing Suite**: Comprehensive API testing with Jest and Supertest
- **Modern Tooling**: ESM modules, hot reloading, and development optimizations

## 🛠️ Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with Drizzle Kit
- **Testing**: Jest + Supertest
- **Development**: tsx for hot reloading

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn package manager

## 🔧 Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/nerdwork
JWT_SECRET=your-jwt-secret
PORT=3000
# Add other environment variables as needed
```

4. Set up the database:
```bash
# Generate migration files
npm run generate:dev

# Run migrations
npm run migrate:dev

# Or push schema directly (for development)
npm run push:dev
```

## 🚀 Getting Started

### Development

Start the development server with hot reloading:
```bash
npm start
```

The server will start on `http://localhost:3000` (or your configured PORT).

### Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

## 📁 Project Structure

```
src/
├── config/
│   ├── db.ts
│   └── drizzle-dev.config.ts
├── controllers/
│   └── auth.controller.ts
├── middleware/
│   ├── auth.middleware.ts
│   └── validation.middleware.ts
├── models/
│   └── user.model.ts
├── routes/
│   ├── auth.routes.ts
│   └── index.ts
├── services/
│   └── auth.service.ts
├── types/
│   └── index.ts
├── utils/
│   └── helpers.ts
└── index.ts

tests/
├── routes/
│   └── auth.test.ts
└── setup.ts
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/profile` | Get user profile (protected) |

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": {},
  "message": "Success message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🗃️ Database Scripts

| Command | Description |
|---------|-------------|
| `npm run generate:dev` | Generate migration files from schema changes |
| `npm run migrate:dev` | Run pending migrations |
| `npm run push:dev` | Push schema changes directly to database (dev only) |

## 🔒 Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nerdwork

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Server
PORT=3000
NODE_ENV=development

# Web3 (when implemented)
WEB3_PROVIDER_URL=
PRIVATE_KEY=
```

## 🧪 Testing

The project uses Jest and Supertest for API testing. Tests are located in the `tests/` directory.

Example test structure:
```typescript
describe('Authentication Routes', () => {
  test('POST /api/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);
    
    expect(response.body.success).toBe(true);
  });
});
```

## 🔮 Upcoming Features

- Comic book management system
- Web3 wallet integration
- NFT comic collections
- Reading progress tracking
- Social features and community
- Payment processing
- Content creator tools

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Use meaningful commit messages
- Update documentation when needed
- Follow the existing code structure

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions, please:

1. Check the existing issues on GitHub
2. Create a new issue with detailed information
3. Contact the development team

---

**Built with ❤️ for the comic reading community**