import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createProxyMiddleware } from 'http-proxy-middleware';
import { globalErrorHandler, globalNotFoundHandler } from "./middleware/common.js";

const app = express();

app.use(cors());
app.use(helmet());
app.use(compression());
app.use(morgan("dev"));

// Service URLs - these would come from environment variables in production
const services = {
  auth: process.env.AUTH_SERVICE_URL || 'http://localhost:3001',
  user: process.env.USER_SERVICE_URL || 'http://localhost:3002',
  comic: process.env.COMIC_SERVICE_URL || 'http://localhost:3003',
  wallet: process.env.WALLET_SERVICE_URL || 'http://localhost:3004',
  event: process.env.EVENT_SERVICE_URL || 'http://localhost:3005',
  ledger: process.env.LEDGER_SERVICE_URL || 'http://localhost:3006',
  file: process.env.FILE_SERVICE_URL || 'http://localhost:3007',
};

// Health check for the gateway itself (needs JSON parsing)
app.get("/health", express.json(), (req, res) => {
  res.status(200).json({ 
    status: "healthy", 
    service: "api-gateway",
    timestamp: new Date().toISOString(),
    upstreamServices: services
  });
});

// Route requests to appropriate microservices
app.use('/auth', createProxyMiddleware({
  target: services.auth,
  changeOrigin: true,
  pathRewrite: {
    '^/auth': ''
  },
  onError: (err, req, res) => {
    console.error('Auth Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'Auth service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/users', createProxyMiddleware({
  target: services.user,
  changeOrigin: true,
  pathRewrite: {
    '^/users': ''
  },
  onError: (err, req, res) => {
    console.error('User Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'User service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/comics', createProxyMiddleware({
  target: services.comic,
  changeOrigin: true,
  pathRewrite: {
    '^/comics': ''
  },
  onError: (err, req, res) => {
    console.error('Comic Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'Comic service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/wallet', createProxyMiddleware({
  target: services.wallet,
  changeOrigin: true,
  pathRewrite: {
    '^/wallet': ''
  },
  onError: (err, req, res) => {
    console.error('Wallet Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'Wallet service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/events', createProxyMiddleware({
  target: services.event,
  changeOrigin: true,
  pathRewrite: {
    '^/events': ''
  },
  onError: (err, req, res) => {
    console.error('Event Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'Event service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/ledger', createProxyMiddleware({
  target: services.ledger,
  changeOrigin: true,
  pathRewrite: {
    '^/ledger': ''
  },
  onError: (err, req, res) => {
    console.error('Ledger Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'Ledger service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use('/files', createProxyMiddleware({
  target: services.file,
  changeOrigin: true,
  pathRewrite: {
    '^/files': ''
  },
  onError: (err, req, res) => {
    console.error('File Service Proxy Error:', err.message);
    (res as express.Response).status(503).json({
      success: false,
      error: 'File service unavailable',
      timestamp: new Date().toISOString()
    });
  }
}));

app.use(globalNotFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`API Gateway running at http://localhost:${PORT}`);
    console.log('Routing to services:', services);
  });
}

export { app };