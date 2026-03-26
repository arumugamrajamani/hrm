# HRM System - Production-Grade Human Resource Management

A production-grade HRM (Human Resource Management) system with advanced User Management module built with Node.js, Express.js, and MySQL.

## Features

- **User Management**: Complete CRUD operations with pagination, search, and filtering
- **Authentication**: JWT-based authentication with access and refresh tokens
- **Security**: 
  - Password hashing with bcrypt
  - Password policy enforcement
  - Two-factor authentication (2FA) via email
  - Rate limiting
  - Account lockout after failed attempts
  - Password history to prevent reuse
- **Role-Based Access Control**: Granular permissions system
- **Email Notifications**: Automated emails for welcome, password reset, 2FA, etc.

## Tech Stack

- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Authentication**: JWT (Access + Refresh Token)
- **Security**: OWASP best practices
- **API Testing**: Swagger Added

## Project Structure

```
hrm/src/
├── config/           # Configuration files
├── controllers/      # HTTP request handlers
├── services/         # Business logic
├── repositories/     # Database operations
├── middlewares/      # Express middleware
├── utils/           # Utility functions
├── routes/          # API routes
├── models/          # Database models
├── database/        # SQL schemas
├── tests/           # Jest tests
├── app.js           # Express app
└── server.js        # Server entry point
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- MySQL 8.0+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd hrm/src
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your database and email credentials.

5. Setup the database:
```bash
mysql -u root -p < src/database/schema.sql
mysql -u root -p < src/database/seed.sql
```

6. Start the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

### Authentication Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login |
| POST | /api/auth/verify-2fa | Verify 2FA |
| POST | /api/auth/refresh | Refresh token |
| POST | /api/auth/logout | Logout |
| POST | /api/auth/forgot-password | Request password reset |
| POST | /api/auth/verify-otp | Verify OTP |
| POST | /api/auth/reset-password | Reset password |
| POST | /api/auth/change-password | Change password |
| POST | /api/auth/setup-2fa | Enable 2FA |
| POST | /api/auth/verify-2fa-setup | Verify 2FA setup |
| POST | /api/auth/disable-2fa | Disable 2FA |

### User Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List users |
| GET | /api/users/:id | Get user by ID |
| POST | /api/users | Create user |
| PUT | /api/users/:id | Update user |
| DELETE | /api/users/:id | Soft delete user |
| PATCH | /api/users/:id/activate | Activate user |
| PATCH | /api/users/:id/deactivate | Deactivate user |
| GET | /api/users/roles | Get all roles |

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm test -- --coverage
```

## Security Features

1. **Password Policy**
   - Minimum 8 characters
   - At least 1 uppercase, 1 lowercase, 1 number, 1 special character
   - Password expires every 90 days
   - Last 3 passwords stored in history

2. **Rate Limiting**
   - Auth endpoints: 10 requests per 15 minutes
   - General endpoints: 100 requests per 15 minutes

3. **Account Security**
   - Block after 5 failed login attempts (30 minutes)
   - JWT tokens with 15-minute expiry
   - Refresh tokens with 7-day expiry

## License

MIT License
