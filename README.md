# FinSafe Monitor Backend

## Overview
FinSafe Monitor is a NestJS-based backend system designed for intelligent financial transaction monitoring with fraud detection, anomaly analysis, and Google OAuth authentication.

This backend provides:
- Secure Google OAuth-only authentication
- JWT-based authorization
- User management with TypeORM & PostgreSQL
- Transaction creation and retrieval
- Rule-based fraud detection
- Risk scoring and risk-level classification
- User-specific transaction statistics
- Admin-only endpoints to view all user transactions
- Docker-ready PostgreSQL configuration

---

## Features

### 🔐 Authentication
- Google OAuth 2.0 login using `passport-google-oauth20`
- JWT issued upon successful login
- Protected endpoints using `JwtAuthGuard`

### 👤 Users
User entity includes:
- `email`
- `googleId`
- `name`
- `avatar`
- `role` (`user` | `admin`)
- `createdAt`

### 💸 Transactions
Transactions track:
- Amount
- Merchant
- Timestamp
- Category
- Location
- Currency
- User relationship

### 🧠 Fraud Detection
Each transaction is analyzed using:
- Amount thresholds
- Merchant history
- High frequency in short time windows

Fraud result includes:
- `riskScore` (0–1)
- `riskLevel` (`low`, `medium`, `high`)
- `reasons` list explaining why the transaction was flagged

### 📊 User Statistics
Users can fetch:
- Total transactions
- High/medium/low risk distribution
- Risk percentages

### 🛡 Admin Endpoints
Admins (role = `admin`) can:
- View all transactions: `/admin/transactions`
- Filter by user via query param: `?userId=1`

---

## Directory Structure

```
backend/
├── src/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   ├── auth.module.ts
│   │   ├── google.strategy.ts
│   │   ├── jwt-auth.guard.ts
│   │   ├── jwt.strategy.ts
│   │   ├── roles.decorator.ts
│   │   └── roles.guard.ts
│   ├── users/
│   │   ├── user.entity.ts
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   ├── transactions/
│   │   ├── transaction.entity.ts
│   │   ├── transactions.controller.ts
│   │   ├── admin-transactions.controller.ts
│   │   ├── transactions.service.ts
│   │   ├── fraud.service.ts
│   │   └── dto/
│   │       └── create-transaction.dto.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
```

---

## Installation

### 1. Clone the repo
```
git clone <your-repo-url>
cd backend
```

### 2. Install dependencies
```
npm install
```

### 3. Setup `.env`
Create a `.env` file:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASS=postgres
DB_NAME=postgres

JWT_SECRET=dev-secret

GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback
```

### 4. Start PostgreSQL (Docker)
```
docker run --name finsafe-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:15
```

### 5. Start backend
```
npm run start:dev
```

---

## API Endpoints

### 🟢 Auth
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/auth/google` | Start Google OAuth |
| GET | `/auth/google/callback` | OAuth callback →

### 👤 Users
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/users/me` | Logged-in user details |

### 💳 Transactions (User)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| POST | `/transactions` | Create transaction |
| GET | `/transactions` | List user's transactions |
| GET | `/transactions/stats` | User transaction statistics |

### 🛡 Admin (Role: `admin`)
| Method | Endpoint | Description |
|--------|-----------|-------------|
| GET | `/admin/transactions` | View all transactions |
| GET | `/admin/transactions?userId=1` | Filter by user |

---

## License
MIT
