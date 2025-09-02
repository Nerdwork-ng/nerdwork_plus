# 🔐 Auth Service API Documentation

**Base URL**: `https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth`

## Overview
The Auth Service handles user authentication, registration, and JWT token management.

## 🔑 Endpoints

### 1. User Registration
**POST** `/signup`

Register a new user account.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe",
  "fullName": "John Doe"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "User registered successfully"
}
```

#### Error Responses
```json
// 400 - Validation Error
{
  "success": false,
  "error": "Email already exists",
  "timestamp": "2024-01-01T00:00:00Z"
}

// 500 - Server Error
{
  "success": false,
  "error": "Internal server error",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 2. User Login
**POST** `/login`

Authenticate user and receive JWT token.

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

#### Error Responses
```json
// 401 - Invalid Credentials
{
  "success": false,
  "error": "Invalid email or password",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### 3. Get Current User
**GET** `/me`

Get authenticated user's information.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "username": "johndoe",
      "fullName": "John Doe",
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-01T00:00:00Z"
    }
  },
  "message": "User retrieved successfully"
}
```

#### Error Responses
```json
// 401 - Unauthorized
{
  "success": false,
  "error": "Authentication required",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

## 🧪 Testing Examples

### cURL Examples
```bash
# Register new user
curl -X POST https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser",
    "fullName": "Test User"
  }'

# Login
curl -X POST https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# Get current user (replace TOKEN with actual JWT)
curl -X GET https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/auth/me \
  -H "Authorization: Bearer TOKEN"
```

### JavaScript Examples
```javascript
// Register user
const registerUser = async (userData) => {
  const response = await fetch('/dev/auth/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });
  return response.json();
};

// Login user
const loginUser = async (credentials) => {
  const response = await fetch('/dev/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return response.json();
};

// Get current user
const getCurrentUser = async (token) => {
  const response = await fetch('/dev/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

## 🔒 Security Notes

- Passwords are hashed using bcrypt
- JWT tokens expire after 24 hours
- Rate limiting: 10 requests per minute for login/signup
- HTTPS required for all requests

## 🏷️ Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid credentials or token |
| 409 | Conflict - User already exists |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |