# 💰 Wallet Service API Documentation

**Base URL**: `https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet`

## Overview
The Wallet Service manages NWT tokens, payments via Helio (Solana), and transaction history.

## 🪙 NWT Token System
- **NWT**: Native platform token for purchasing content and services
- **Payment Method**: Helio (USDC on Solana blockchain)
- **Web3 Wallet**: Connect Phantom, Solflare, or other Solana wallets

## 🔑 Endpoints

### 1. Get User Wallet
**GET** `/`

Get user's wallet information and NWT balance.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "nwtBalance": "100.00000000",
    "totalEarned": "500.00000000",
    "totalSpent": "400.00000000",
    "connectedWalletAddress": "5Gv8...K7j2",
    "walletType": "phantom",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Wallet retrieved successfully"
}
```

### 2. Connect Solana Wallet
**POST** `/connect`

Connect a Solana wallet (Phantom, Solflare, etc.) to the user account.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "walletAddress": "5Gv8mBVKrYfJvWvCKPf8X3J1K7j2mNnH3Q4P5R6S7T8U9",
  "walletType": "phantom"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "connectedWalletAddress": "5Gv8mBVKrYfJvWvCKPf8X3J1K7j2mNnH3Q4P5R6S7T8U9",
    "walletType": "phantom"
  },
  "message": "Wallet connected successfully"
}
```

### 3. Get NWT Pricing
**GET** `/pricing`

Get available NWT token packages (public endpoint).

#### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "packageName": "Starter Pack",
      "nwtAmount": "100.00000000",
      "usdPrice": "10.00",
      "bonusPercentage": "0.00",
      "description": "Perfect for getting started"
    },
    {
      "id": "uuid",
      "packageName": "Creator Pack", 
      "nwtAmount": "1000.00000000",
      "usdPrice": "90.00",
      "bonusPercentage": "10.00",
      "description": "Best value for creators"
    }
  ],
  "message": "NWT pricing retrieved successfully"
}
```

### 4. Create Payment Link
**POST** `/payment-link`

Create a Helio payment link for purchasing NWT tokens.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "packageId": "uuid"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "amount": "100.00000000",
      "status": "pending",
      "description": "Purchased 100.00000000 NWT tokens (Starter Pack)"
    },
    "paymentLink": {
      "id": "helio_payment_id",
      "url": "https://pay.hel.io/payment/xyz123",
      "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "status": "pending"
    }
  },
  "message": "Payment link created successfully"
}
```

### 5. Check Payment Status
**GET** `/payment/{paymentId}/status`

Check the status of a Helio payment.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "status": "completed",
      "amount": "100.00000000"
    },
    "paymentStatus": {
      "id": "helio_payment_id",
      "status": "completed",
      "transactionHash": "5j7K8L9M...",
      "amount": 10.00,
      "currency": "USDC",
      "paidAt": "2024-01-01T00:00:00Z"
    },
    "newBalance": "200.00000000"
  },
  "message": "Payment completed successfully"
}
```

### 6. Spend NWT Tokens
**POST** `/spend`

Spend NWT tokens for purchasing content or services.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Request Body
```json
{
  "amount": "50.00000000",
  "description": "Purchase comic chapter",
  "referenceId": "comic_chapter_uuid",
  "referenceType": "comic_chapter"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transaction": {
      "id": "uuid",
      "amount": "50.00000000",
      "description": "Purchase comic chapter",
      "status": "completed"
    },
    "newBalance": "50.00000000",
    "spentAmount": 50.00000000
  },
  "message": "NWT tokens spent successfully"
}
```

### 7. Get Transaction History
**GET** `/transactions`

Get user's transaction history with pagination.

#### Headers
```
Authorization: Bearer <jwt_token>
```

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by transaction type ('purchase', 'spend', 'earn')

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "uuid",
        "type": "purchase",
        "amount": "100.00000000",
        "description": "Purchased 100.00000000 NWT tokens",
        "status": "completed",
        "paymentMethod": "helio",
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  },
  "message": "Transaction history retrieved successfully"
}
```

### 8. Helio Webhook (No Auth)
**POST** `/webhooks/helio`

Webhook endpoint for Helio payment notifications.

#### Request Body
```json
{
  "id": "helio_payment_id",
  "status": "completed",
  "transaction_hash": "5j7K8L9M...",
  "amount": 10.00,
  "currency": "USDC",
  "paid_at": "2024-01-01T00:00:00Z"
}
```

#### Success Response (200)
```json
{
  "success": true
}
```

## 🧪 Testing Examples

### Complete Purchase Flow
```bash
# 1. Get pricing options
curl https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet/pricing

# 2. Create payment link (replace TOKEN and PACKAGE_ID)
curl -X POST https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet/payment-link \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"packageId": "PACKAGE_ID"}'

# 3. Check payment status (replace PAYMENT_ID)
curl -X GET https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet/payment/PAYMENT_ID/status \
  -H "Authorization: Bearer TOKEN"

# 4. Get wallet balance
curl -X GET https://rjk44eecli.execute-api.eu-west-1.amazonaws.com/dev/wallet \
  -H "Authorization: Bearer TOKEN"
```

### JavaScript Examples
```javascript
// Connect Solana wallet
const connectWallet = async (walletAddress, walletType, token) => {
  const response = await fetch('/dev/wallet/connect', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ walletAddress, walletType }),
  });
  return response.json();
};

// Create payment link
const createPaymentLink = async (packageId, token) => {
  const response = await fetch('/dev/wallet/payment-link', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageId }),
  });
  return response.json();
};

// Spend tokens
const spendTokens = async (amount, description, referenceId, referenceType, token) => {
  const response = await fetch('/dev/wallet/spend', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      description,
      referenceId,
      referenceType
    }),
  });
  return response.json();
};
```

## 🔐 Web3 Integration

### Supported Wallets
- **Phantom**: Most popular Solana wallet
- **Solflare**: Web and mobile Solana wallet
- **Other**: Any wallet supporting Solana Web3 standard

### Payment Flow
1. User selects NWT package
2. System creates Helio payment link
3. User pays with USDC on Solana
4. Helio webhook confirms payment
5. NWT tokens credited to user wallet

## 💡 Best Practices

- Always check wallet balance before spending
- Handle payment status polling gracefully
- Implement proper error handling for failed payments
- Store transaction IDs for reference

## 🏷️ Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input or insufficient balance |
| 401 | Unauthorized - Authentication required |
| 404 | Not Found - Package or transaction not found |
| 500 | Internal Server Error |