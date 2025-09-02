# 🔄 Complete User Flow Documentation

## 📋 Overview
This document outlines the complete user journeys through the Nerdwork+ platform, from registration to content creation and consumption.

## 🎭 User Personas

### 1. **Reader/Consumer**
- Discovers and reads comics
- Attends virtual events
- Purchases content with NWT tokens

### 2. **Creator**
- Creates and publishes comics
- Hosts virtual events  
- Earns revenue from content sales

### 3. **Event Organizer**
- Creates and manages events
- Sells tickets via NWT tokens
- Manages attendee experiences

---

## 🚀 Flow 1: New User Registration & Onboarding

```mermaid
graph TD
    A[Visit Platform] --> B[Click Sign Up]
    B --> C[Enter Details]
    C --> D{Validation}
    D -->|Success| E[Account Created]
    D -->|Error| C
    E --> F[Email Verification]
    F --> G[Login]
    G --> H[Profile Setup]
    H --> I[Explore Platform]
```

### API Calls:
1. **POST** `/auth/signup`
2. **POST** `/auth/login`
3. **POST** `/users/profile`
4. **GET** `/users/me`

### Frontend Screens:
1. Landing Page
2. Registration Form
3. Email Verification
4. Profile Setup
5. Dashboard

---

## 💰 Flow 2: First-Time Token Purchase

```mermaid
graph TD
    A[Dashboard] --> B[View NWT Balance: 0]
    B --> C[Click Buy Tokens]
    C --> D[View Pricing Packages]
    D --> E[Select Package]
    E --> F[Connect Solana Wallet]
    F --> G[Create Payment Link]
    G --> H[Pay with USDC]
    H --> I{Payment Status}
    I -->|Success| J[Tokens Added]
    I -->|Pending| K[Wait for Confirmation]
    I -->|Failed| L[Show Error]
    J --> M[Updated Balance]
    K --> N[Webhook Updates]
    N --> J
```

### API Calls:
1. **GET** `/wallet/pricing`
2. **POST** `/wallet/connect`
3. **POST** `/wallet/payment-link`
4. **GET** `/wallet/payment/{id}/status`
5. **GET** `/wallet/`

### Web3 Integration:
- Solana wallet connection
- USDC payment via Helio
- Transaction confirmation

---

## 🎨 Flow 3: Creator Onboarding & First Comic

```mermaid
graph TD
    A[User Dashboard] --> B[Become Creator]
    B --> C[Creator Application]
    C --> D[Profile Setup]
    D --> E[Upload Avatar/Banner]
    E --> F[Create First Comic]
    F --> G[Upload Cover Art]
    G --> H[Add Metadata]
    H --> I[Create First Chapter]
    I --> J[Upload Chapter Images]
    J --> K[Set Pricing]
    K --> L[Publish]
    L --> M[Comic Live]
```

### API Calls:
1. **POST** `/users/creator/become`
2. **PUT** `/users/creator/profile`
3. **POST** `/files/upload` (images)
4. **POST** `/comics/` (create comic)
5. **POST** `/comics/{id}/chapters`
6. **PUT** `/comics/{id}/publish`

### File Uploads:
- Creator profile images
- Comic cover art
- Chapter page images
- Metadata and descriptions

---

## 📖 Flow 4: Reader Discovery & Purchase

```mermaid
graph TD
    A[Browse Comics] --> B[Filter/Search]
    B --> C[View Comic Details]
    C --> D[Read Free Preview]
    D --> E{Interested?}
    E -->|Yes| F[Check Token Balance]
    E -->|No| A
    F --> G{Sufficient Tokens?}
    G -->|Yes| H[Purchase Chapter]
    G -->|No| I[Buy More Tokens]
    H --> J[Read Full Chapter]
    I --> F
    J --> K[Rate & Review]
    K --> L[Discover More]
```

### API Calls:
1. **GET** `/comics/` (browse)
2. **GET** `/comics/{id}` (details)
3. **GET** `/comics/{id}/chapters/{chapterId}/preview`
4. **POST** `/wallet/spend` (purchase)
5. **GET** `/comics/{id}/chapters/{chapterId}` (full content)
6. **POST** `/comics/{id}/reviews`

---

## 🎫 Flow 5: Event Creation & Attendance

```mermaid
graph TD
    A[Creator Dashboard] --> B[Create Event]
    B --> C[Event Details]
    C --> D[Set Date/Time]
    D --> E[Upload Event Banner]
    E --> F[Set Ticket Price]
    F --> G[Publish Event]
    G --> H[Event Listed]
    
    I[User Discovers Event] --> J[View Event Details]
    J --> K[Purchase Ticket]
    K --> L[Add to Calendar]
    L --> M[Attend Event]
    M --> N[Participate/Chat]
```

### API Calls:
1. **POST** `/events/` (create)
2. **POST** `/files/upload` (banner)
3. **PUT** `/events/{id}/publish`
4. **GET** `/events/` (browse)
5. **POST** `/events/{id}/tickets/purchase`
6. **GET** `/events/{id}/attendees/me`

---


## 💸 Flow 6: Creator Revenue & Payout

```mermaid
graph TD
    A[Content Sales] --> B[NWT Tokens Earned]
    B --> C[View Earnings Dashboard]
    C --> D[Track Revenue]
    D --> E[Withdrawal Request]
    E --> F[Convert to USDC]
    F --> G[Transfer to Wallet]
    
    H[Ledger Service] --> I[Record Transactions]
    I --> J[Calculate Creator Share]
    J --> K[Update Balances]
```

### API Calls:
1. **GET** `/ledger/creator-earnings/{creatorId}`
2. **POST** `/wallet/withdraw-request`
3. **GET** `/ledger/transactions`
4. **POST** `/payments/payout`

---

## 🔄 Flow 7: Platform Economy Cycle

```mermaid
graph TD
    A[User Buys NWT] --> B[Platform Gets USDC]
    B --> C[User Spends NWT]
    C --> D[Creator Earns NWT]
    D --> E[Platform Takes Fee]
    E --> F[Creator Withdraws]
    F --> G[Platform Converts to USDC]
    G --> H[Creator Gets Payout]
    
    I[Event Tickets] --> C
    J[Comic Sales] --> C
    K[Premium Features] --> C
```

---

## 📱 Frontend Application Structure

### Core Pages:
1. **Authentication** (`/auth`)
   - Login/Register
   - Password Reset
   - Email Verification

2. **Dashboard** (`/dashboard`)
   - User Overview
   - Recent Activity
   - Quick Actions

3. **Comics** (`/comics`)
   - Browse/Search
   - Comic Details
   - Chapter Reader
   - Creator Tools

4. **Events** (`/events`)
   - Event Listing
   - Event Details  
   - Ticket Management
   - Live Event View

5. **Wallet** (`/wallet`)
   - Balance Overview
   - Transaction History
   - Buy Tokens
   - Connect Web3 Wallet

6. **Profile** (`/profile`)
   - User Settings
   - Creator Dashboard
   - Earnings Overview

### State Management:
- **User State**: Authentication, profile
- **Wallet State**: Balance, transactions
- **Content State**: Comics, events, purchases
- **UI State**: Loading, errors, notifications

### Web3 Integration:
```javascript
// Wallet connection example
const connectWallet = async () => {
  if (window.solana) {
    const response = await window.solana.connect();
    const walletAddress = response.publicKey.toString();
    
    // Connect to backend
    await fetch('/api/wallet/connect', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        walletAddress,
        walletType: 'phantom'
      }),
    });
  }
};
```

---

## 🚨 Error Handling & Edge Cases

### Common Error Scenarios:
1. **Insufficient Balance**: Redirect to buy tokens
2. **Payment Failed**: Retry or contact support
3. **Content Not Available**: Show appropriate message
4. **Network Issues**: Offline mode/retry logic
5. **Authentication Expired**: Force re-login

### Retry Logic:
- Payment status polling
- File upload retries
- API call retries with exponential backoff

---

## 📊 Analytics & Tracking

### Key Metrics:
1. **User Engagement**
   - Registration conversion
   - Daily/Monthly active users
   - Content consumption

2. **Revenue Metrics** 
   - Token sales volume
   - Creator earnings
   - Platform fees collected

3. **Content Performance**
   - Comic views/purchases
   - Event attendance
   - Creator success rates

### Implementation:
```javascript
// Track user actions
const trackEvent = (eventName, properties) => {
  analytics.track(eventName, {
    userId: user.id,
    timestamp: new Date().toISOString(),
    ...properties
  });
};
```

---

## 🔧 Technical Considerations

### Performance:
- Image optimization and CDN
- Lazy loading for comics
- Caching strategies
- Database query optimization

### Security:
- JWT token management
- File upload validation
- Rate limiting
- CORS configuration

### Scalability:
- Microservices architecture
- Horizontal scaling with Lambda
- Database connection pooling
- CDN for static assets

---

**This comprehensive user flow documentation provides the blueprint for building a complete, user-friendly platform that seamlessly integrates Web3 payments with traditional user experiences.**