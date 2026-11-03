# HRM System — Production-Grade Human Resource Management

A comprehensive, enterprise-grade Human Resource Management (HRM) system built with **Node.js, Express.js, and MySQL**, with advanced security, authentication, employee lifecycle management, attendance, payroll, performance management, and onboarding modules.

**Version:** 2.0.0
**License:** MIT

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Features](#-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture](#-architecture)
5. [Project Structure](#-project-structure)
6. [Getting Started](#-getting-started)
7. [Environment Variables](#-environment-variables)
8. [API Overview](#-api-overview)
9. [Module APIs](#-module-apis)
10. [Security](#-security)
11. [Monitoring & Observability](#-monitoring--observability)
12. [Testing](#-testing)
13. [Deployment](#-deployment)
14. [Documentation Index](#-documentation-index)
15. [License](#-license)

---

## 🌐 Overview

The HRM backend is a **layered monolith** exposing a versioned REST API under `/api/v1`. It provides:

- **Authentication & Identity** — JWT access/refresh tokens, TOTP two-factor authentication, email OTP password reset, bcrypt password policies, account lockout, refresh-token rotation.
- **User Management** — user CRUD, roles & granular permissions, activation/deactivation, linked employee accounts.
- **Employee Management** — employee CRUD, soft delete/restore, full employee lifecycle state machine, SCD Type 2 job history, addresses, bank details, education, experience, documents, emergency contacts, reporting relationships.
- **Master Data** — departments, designations, locations, education, courses, employment types, companies, business units, grades, shifts, holidays, documents.
- **Attendance, Leave & Timesheets** — shifts, holidays, attendance marking/regularization, leave types/balances/requests, timesheets.
- **Payroll** — salary components, salary structures, employee salary (SCD Type 2), payroll runs, payslips, tax/PF/ESI/bonus configuration.
- **Performance Management** — performance cycles, goals, self/manager ratings, overall ratings, annual summaries, notifications, scheduled cron jobs.
- **Onboarding** — onboarding records, checklist templates/items, checklist progress, probation tracking.
- **Enterprise** — webhooks (HMAC-signed), audit logs, feature flags, IP blocklist, API keys, tenants, bulk import/export, circuit breakers, metrics.

---

## ✨ Features

### 1. Authentication & Security
- JWT access token **15 min** + refresh token **7 days** (HS256, key rotation with previous-key fallback)
- TOTP-based 2FA (SHA1, 6 digits, 30s period, ±1 window) + 10 single-use backup codes
- Email OTP for password reset (15 min expiry) and 2FA login (5 min expiry)
- bcrypt password hashing (cost from config, default 12)
- Password policy: min 8 chars, upper + lower + number + special, 90-day expiry, last 3 passwords in history
- Account lockout: **5 failed attempts → 30 min block**
- Rate limiting: auth **5/15min**, OTP **3/min**, password reset **5/hr**, general **5000/15min**
- Helmet security headers, CORS origin allowlist, JSON body limit **10kb**, HSTS
- Request/response sanitization (passwords, tokens, OTPs, API keys redacted)
- IP blocklist (DB + in-memory cache, 5-min TTL) → `403 IP_BLOCKED`
- API key auth via `X-API-Key` header

### 2. User Management & RBAC
- User CRUD with pagination/search/filter (`status`, `search`)
- Granular permissions stored on `roles.permissions` (JSON); `Super Admin` (role 1) & `Admin` (role 2) bypass
- Activate / deactivate users; soft delete
- Admin user creation with generated password emailed (welcome flow)

### 3. Employee Management
- Employee CRUD with auto employee code (`EMP###`), auto username generation
- Soft delete (`deleted_at`) + restore
- Lifecycle state machine (`draft, onboarding, active, probation, confirmed, on_leave, suspended, resigned, terminated, retired, transferred, cancelled, notice_period, exited`) with allowed transitions + history
- SCD Type 2: job details, addresses, bank details (close-and-replace current rows)
- Job changes (transfer/promotion/demotion/confirmation snapshots)
- Full profile assembly, emergency contacts, reporting employees (manager → direct reports)

### 4. Master Data
- Departments (hierarchy, recursive CTE, circular prevention, soft delete), designations, locations, education, courses, education-course mapping, employment types, companies, business units, grades, shifts, holidays, documents master.

### 5. Attendance / Leave / Timesheets
- Shifts CRUD, holiday calendar, attendance mark + regularization (late/early flags), leave types, balances, requests (approve/reject), timesheets (submit/approve).

### 6. Payroll
- Salary components, structures, structure components, employee salary (SCD Type 2), payroll runs + processing, payslips, tax/PF/ESI/bonus configuration & calculation.

### 7. Performance Management
- Cycles, goals (KPI/weightage), self ratings, manager ratings, overall ratings, annual summaries, notifications, daily cron (cycle status updates, deadline reminders, auto-close ratings).

### 8. Onboarding
- Onboarding records, checklist templates/items + progress, probation tracking.

### 9. Enterprise Operations
- Bull-backed queues (email, notifications, audit, webhook, export) with retries/backoff
- Webhook delivery w/ HMAC-SHA256 signature + circuit breaker + delivery logs
- Feature flags (DB-backed, rollout bucketing)
- Bulk import/export (users, departments, locations, designations, courses, education) via queued jobs
- Audit logging, metrics, circuit breakers, cache, health checks.

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js >= 18 |
| HTTP framework | Express 4 |
| Database | MySQL 8.0 (`mysql2/promise` pool, pool size 20, queue limit 100) |
| Cache / Queues | Redis (`redis`), Bull (`bull`), `rate-limit-redis` |
| Auth | JSON Web Tokens (`jsonwebtoken` HS256), bcrypt, TOTP (`crypto`), nodemailer |
| Validation | Joi, express-validator |
| Docs | swagger-jsdoc, swagger-ui-express (OpenAPI 3.0) |
| Logging | Winston + winston-daily-rotate-file, Morgan |
| Security | helmet, cors, express-rate-limit, compression, sanitizer |
| Tests | Jest, supertest |
| Observability | custom MetricsService (Prometheus-style), DB pool metrics, circuit breakers |

---

## 🏗 Architecture

### Layered Flow
```
HTTP Request
  → generalLimiter (rate limit)
  → authMiddleware (JWT) / optionalAuth
  → checkPermission (RBAC) / isAdmin / isSuperAdmin
  → validate(s) (Joi / express-validator)
  → auditLog(action, entity) (wraps res.json on 2xx)
  → controller (HTTP handler)
  → service (business logic)
  → repository / model (mysql2 SQL)
  → MySQL
```

### Auth Flow (summary)
```
register → login (lockout/attempts) → [TOTP 2FA? → verify-2fa] → access+refresh tokens
refresh (rotation) → logout → forgot-password(OTP) → verify-otp → reset-password
change-password → setup-2fa → verify-2fa-setup → disable-2fa
```

### Infrastructure
- **Logging:** Winston daily-rotate files (`error-`, `combined-`, `audit-`, `security-*`) + Morgan → winston `http` level.
- **Health:** `/health`, `/health/live`, `/health/ready`, `/health/detailed` (+ `/api/v1/system/*`).
- **Metrics:** custom `MetricsService` → `/metrics`, `/metrics/json` (port 9090 via `METRICS_PORT`).
- **Queues:** Bull (Redis DB 1) — `email`, `notifications`, `audit`, `webhook`, `export`.
- **Cache:** Redis via `cacheService` (graceful degradation when unavailable).

---

## 📁 Project Structure

```
hrm/
├── src/
│   ├── app.js                  # Express app: helmet, CORS, compression, json, requestId,
│   │                           #   sanitizer, morgan, /uploads, /health*, /api-docs*, /api/v1
│   ├── server.js               # Entry: DB test, refresh-token cleanup, Redis, queues,
│   │                           #   graceful shutdown, signal handlers
│   ├── config/                 # index.js, database.js, jwt.js, mail.js, upload.js, swagger.js
│   ├── controllers/            # HTTP request handlers (auth, user, employee, payroll, ...)
│   ├── services/               # Business logic + queue/cache/circuit-breaker/metrics/etc.
│   ├── repositories/           # Data access layer
│   ├── models/                 # SQL query models (User, Employee, Job, Address, Bank, ...)
│   ├── middlewares/            # auth, roleCheck, auditLog, rateLimiter, validator,
│   │                           #   errorHandler, tenant, ipBlock, apiKeyAuth, requestId
│   ├── routes/                 # v1 routers (auth, users, employees, payroll, ...)
│   ├── validations/            # Joi schemas + joiValidator
│   ├── utils/                  # apiResponse, helpers, logger, pagination, passwordUtils,
│   │                           #   sanitizer, tokenUtils, emailTemplates
│   ├── database/               # schema.sql, seed.sql, migrate.js, migrations/ (SQL + JS)
│   ├── tests/                  # Jest tests (auth, user)
│   └── ...
├── uploads/                    # File uploads (profile images, documents)
├── logs/                       # Winston log files
├── coverage/                   # Jest coverage
├── migrations/                 # JS migrations (lifecycle, onboarding, master data, ...)
├── *.md                        # Documentation
├── package.json
└── jest.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- MySQL 8.0+
- Redis (optional — graceful degradation when absent)
- SMTP credentials (for OTP/email flows)

### Installation
```bash
npm install
cp .env.example .env
# Configure DB, JWT, Redis, SMTP, secrets in .env
mysql -u root -p < src/database/schema.sql
mysql -u root -p < src/database/seed.sql
npm run migrate     # node src/database/migrate.js
npm run seed        # node src/database/seed.js
npm run dev         # nodemon src/server.js
npm start           # node src/server.js
```

### Default Health
- `GET /health` → `{ success, message, timestamp, version, environment }`
- `GET /health/live` → liveness
- `GET /health/ready` → readiness (DB check)
- `GET /health/detailed` → DB + Redis + circuit breakers + queues

---

## 🔐 Environment Variables

| Group | Key variables |
|-------|---------------|
| App | `NODE_ENV`, `APP_VERSION`, `PORT`, `API_VERSION`, `API_URL`, `FRONTEND_URL`, `ALLOWED_ORIGINS` |
| DB | `DB_HOST`, `DB_USER`, `DB_NAME`, `DB_PASSWORD`, `DB_PORT`, `DB_POOL_SIZE`, `DB_QUEUE_LIMIT`, `DB_REPLICA_HOST`, `DB_REPLICA_PORT` |
| JWT | `JWT_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY` (15m), `JWT_REFRESH_EXPIRY` (7d), `JWT_ALGORITHM` (HS256), `JWT_KEY_ROTATION`, `JWT_KEY_ID` |
| Redis | `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_DB`, `REDIS_URL`, `BULL_REDIS_DB` |
| Security | `PASSWORD_MIN_LENGTH`, `PASSWORD_EXPIRY_DAYS`, `MAX_LOGIN_ATTEMPTS`, `BLOCK_DURATION_MINUTES`, `OTP_EXPIRY_MINUTES`, `OTP_EXPIRY_PASSWORD_MINUTES`, `PASSWORD_HISTORY_COUNT`, `TOTP_ISSUER`, `TOTP_WINDOW`, `BCRYPT_ROUNDS`, `TOTP_DIGITS`, `TOTP_ALGORITHM` |
| Rate Limit | `RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_AUTH_WINDOW_MS`, `RATE_LIMIT_AUTH_MAX_REQUESTS`, `RATE_LIMIT_OTP_WINDOW_MS`, `RATE_LIMIT_OTP_MAX_REQUESTS`, `RATE_LIMIT_USER_WINDOW_MS`, `RATE_LIMIT_USER_MAX_REQUESTS` |
| Cache/Logging | `CACHE_DEFAULT_TTL`, `CACHE_USER_TTL`, `CACHE_LIST_TTL`, `LOG_LEVEL`, `LOG_MAX_FILES`, `LOG_MAX_SIZE`, `LOG_SANITIZE_FIELDS`, `LOG_MASK_CHAR` |
| Circuit Breaker | `CIRCUIT_BREAKER_TIMEOUT`, `CIRCUIT_BREAKER_RESET_TIMEOUT`, `CIRCUIT_BREAKER_ERROR_THRESHOLD`, `CIRCUIT_BREAKER_ENABLED` |
| Multi-Tenancy | `MULTI_TENANCY_ENABLED`, `TENANT_SCHEMA_STRATEGY` |
| Webhook | `WEBHOOK_ENABLED`, `WEBHOOK_RETRY_ATTEMPTS`, `WEBHOOK_RETRY_DELAY` |
| File Upload | `MAX_FILE_SIZE`, `ALLOWED_FILE_EXTENSIONS`, `FILE_STORAGE_TYPE` |
| Metrics | `METRICS_ENABLED`, `METRICS_PORT` |
| Email/SMTP | `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM_NAME`, `SMTP_FROM_EMAIL` |

---

## 🔌 API Overview

### Base URL
```
http://localhost:3000/api/v1
```

### Mount Map
```
/api/v1/auth
/api/v1/users
/api/v1/employees
/api/v1/onboarding
/api/v1/master
/api/v1/attendance
/api/v1/departments
/api/v1/locations
/api/v1/designations
/api/v1/education
/api/v1/courses
/api/v1/employment-types
/api/v1/performance
/api/v1/education-course
/api/v1/audit-logs
/api/v1/system
/api/v1/payroll
/api/v1/shifts
```

### Response Format
**Success**
```json
{ "success": true, "statusCode": 200, "message": "...", "data": { }, "meta": { "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 } } }
```
**No Data**
```json
{ "success": true, "statusCode": 200, "message": "No data found", "data": [] }
```
**Error**
```json
{ "success": false, "statusCode": 400, "message": "...", "error": { "name": "...", "message": "...", "stack": "..." } }
```
(Error detail only present when `NODE_ENV !== 'production'`.)

### Error Codes
| Code | HTTP | Meaning |
|------|------|---------|
| `ENDPOINT_NOT_FOUND` | 404 | Unknown route |
| `VALIDATION_ERROR` | 400/422 | Validation failed (`errors: [{field,message}]`) |
| `INVALID_TOKEN` | 401 | Invalid JWT |
| `TOKEN_EXPIRED` | 401 | Expired JWT |
| `ACCESS_TOKEN_ERROR` | 401 | Invalid/expired access token |
| `INVALID_CREDENTIALS` | 401 | Bad login credentials |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `IP_BLOCKED` | 403 | IP blocked |
| `TENANT_NOT_FOUND` / `TENANT_REQUIRED` | 404/403 | Tenant context |
| `FEATURE_DISABLED` | 403 | Feature flag off |
| `DUPLICATE` / `DUPLICATE_ENTRY` | 409 | Duplicate record |
| `DATABASE_LOCK_ERROR` | 503 | DB lock/deadlock |
| `INVALID_JSON` | 400 | Malformed JSON body |

### Rate Limits
| Scope | Limit | Key |
|-------|-------|-----|
| General | 5000 / 15 min | `general:{ip}` |
| Auth | 5 / 15 min | `auth:{ip}:{email}` |
| OTP | 3 / 60 s | `otp:{ip}:{email}` |
| Password reset | 5 / hr | `pwdreset:{ip}:{email}` |
| User ops | 100 / min | `user:{userId}` |
| Search | 30 / min | `search:{userId}` |
| Bulk | 10 / hr | `bulk:{userId}` |

---

## 📡 Module APIs

### Module Index

| # | Module | Base Path | Summary |
|---|--------|-----------|---------|
| 1 | Auth | `/api/v1/auth` | Register, login, 2FA, refresh, logout, password reset/change |
| 2 | Users | `/api/v1/users` | User CRUD, role assignment, activate/deactivate, employee sub-resources |
| 3 | Employees | `/api/v1/employees` | Employee CRUD, profile, lifecycle, job changes, sub-resources |
| 4 | Departments | `/api/v1/departments` | Department hierarchy, CRUD, activate/deactivate |
| 5 | Locations | `/api/v1/locations` | Location master CRUD |
| 6 | Designations | `/api/v1/designations` | Designation master CRUD |
| 7 | Education | `/api/v1/education` | Education master CRUD + related courses |
| 8 | Courses | `/api/v1/courses` | Course master CRUD + related educations |
| 9 | Education-Course | `/api/v1/education-course` | Many-to-many mapping |
| 10 | Employment Types | `/api/v1/employment-types` | Employment type master |
| 11 | Attendance | `/api/v1/attendance` | Shifts, holidays, attendance, leave, timesheets |
| 12 | Payroll | `/api/v1/payroll` | Components, structures, salaries, runs, payslips, tax |
| 13 | Onboarding | `/api/v1/onboarding` | Onboarding records, checklist progress, probation |
| 14 | Master Data | `/api/v1/master` | Companies, business units, grades, checklist templates/items |
| 15 | Performance | `/api/v1/performance` | Cycles, goals, ratings, summaries, notifications |
| 16 | Audit Logs | `/api/v1/audit-logs` | Read/list audit trail |
| 17 | System | `/api/v1/system` | Health, metrics, queue/cache diagnostics |
| 18 | Shifts | `/api/v1/shifts` | Shift master (also reachable via attendance) |

### Auth — `/api/v1/auth` (12 endpoints)
`POST /register` · `POST /login` · `POST /verify-2fa` · `POST /refresh` · `POST /logout` · `POST /forgot-password` · `POST /verify-otp` · `POST /reset-password` · `POST /change-password` · `POST /setup-2fa` · `POST /verify-2fa-setup` · `POST /disable-2fa`

**Notes**
- `POST /login` returns `accessToken` + `refreshToken`; if TOTP is enabled the response requires `POST /verify-2fa` with a `tempToken`.
- `POST /refresh` rotates the refresh token (old one is revoked).
- Password reset uses a 6-digit email OTP (15-minute expiry, 5 requests/hour).
- All auth endpoints are rate-limited to **5 requests / 15 min** per IP+email.

### Users — `/api/v1/users`
`GET /` · `GET /:id` · `POST /` · `PUT /:id` · `DELETE /:id` · `PATCH /:id/activate` · `PATCH /:id/deactivate` · employee sub-resources (`addresses`, `bank-details`, `education`, `experience`, `documents`, `emergency-contacts`, `job-details`).

### Employees — `/api/v1/employees` (29 endpoints)
`GET /` · `GET /:id` · `GET /:id/profile` · `POST /` · `PUT /:id` · `DELETE /:id` · `PATCH /:id/restore` · `PATCH /:id/lifecycle-state` · `GET /:id/lifecycle-history` · `GET /:id/job-changes` · and sub-resource CRUD for `job-details` (SCD Type 2), `addresses`, `bank-details`, `education`, `experience`, `documents`, `emergency-contacts`, `reporting-employees`.

### Departments — `/api/v1/departments`
`GET /` · `GET /hierarchy` · `GET /:id` · `GET /:id/children` · `POST /` · `PUT /:id` · `DELETE /:id` · `PATCH /:id/activate` · `PATCH /:id/deactivate` — see `DEPARTMENT_MASTER_DOCUMENTATION.md`.

### Education / Courses / Mapping — `/api/v1/education`, `/api/v1/courses`, `/api/v1/education-course`
Full CRUD + activate/deactivate on education and courses; `GET /education/:id/courses`, `GET /courses/:id/educations`, and mapping create/list/delete — see `EDUCATION_COURSE_MASTER.md` and `FRONTEND_INTEGRATION_GUIDE.md`.

### Attendance — `/api/v1/attendance`
Shifts (`GET/POST /shifts`, `PUT /shifts/:id`), holidays (`GET/POST /holidays`), attendance (`GET /records`, `POST /mark`, `PATCH /regularize/:id`), leave (`/leave-types`, `/leave-balances/:employeeId`, `/leave-requests`, `PATCH /leave-requests/:id/status`), timesheets (`/timesheets`, `PATCH /timesheets/:id/status`).

### Payroll — `/api/v1/payroll`
Salary components, salary structures + components, employee salary (SCD Type 2), payroll runs (`POST /runs/:id/process`), payslips, tax calculation (`POST /tax/calculate`), PF/ESI config, bonus records.

### Onboarding — `/api/v1/onboarding`
Onboarding records (`GET /`, `GET /:id`, `GET /employee/:id`, `POST /`, `PUT /:id`), checklist progress (`PATCH /:onboardingId/checklist/:itemId`), probation tracking (`GET/POST/PATCH /probation/:employeeId`).

### Master Data — `/api/v1/master`
Companies, business units, grades, checklist templates, checklist items (list/get/create/update).

### Performance — `/api/v1/performance`
Cycles, goals, self ratings, manager ratings, overall ratings, annual summaries, notifications (guarded by `checkPermission('performance.*')`).

> Full, up-to-date endpoint tables for every module are maintained in the module-specific documentation files listed in the [Documentation Index](#-documentation-index).

---

## 🔒 Security

- **Helmet** (CSP, HSTS, frameguard, nosniff, referrer policy, XSS filter, hidePoweredBy, HSTS preload)
- **CORS** — allowlist via `ALLOWED_ORIGINS`, credentials, restricted methods/headers
- **Body limits** — JSON/urlencoded **10kb**
- **AuthN/AuthZ** — JWT + RBAC (Super Admin/Admin bypass, granular permissions), TOTP 2FA, API keys, IP blocklist, tenant context
- **Data** — bcrypt, password history, parameterized queries, input sanitization, helmet headers
- **Resilience** — rate limits (Redis), account lockout, refresh-token rotation, circuit breakers, graceful shutdown

---

## 📊 Monitoring & Observability

- **Logs:** Winston (error/combined/audit/security) + Morgan (HTTP → `http` level), daily rotation, sanitization
- **Health:** `/health`, `/live`, `/ready`, `/detailed`
- **Metrics:** `/metrics`, `/metrics/json` (`METRICS_PORT`, default 9090)
- **DB:** pool metrics (`getPoolMetrics`), query counters/failures/averages
- **Queues:** Bull job stats/failed/retry/clear

---

## 🧪 Testing

```bash
npm test              # jest --coverage --detectOpenHandles --forceExit
npm run test:watch
npm run lint          # eslint src/
```

Current suites: `src/tests/auth.test.js`, `src/tests/user.test.js`.

---

## 📚 Documentation Index

| Document | Purpose |
|----------|---------|
| `README.md` | This file — system overview, setup, API, security |
| `ENTERPRISE_HRM_ARCHITECTURE_AND_ROADMAP.md` | Enterprise architecture, roadmap, DB architecture, API standards |
| `NEW_MODULES_DOCUMENTATION.md` | Attendance, Payroll, Onboarding, Master Data modules |
| `DEPARTMENT_MASTER_DOCUMENTATION.md` | Department Master module |
| `EDUCATION_COURSE_MASTER.md` | Education & Course Master module |
| `FRONTEND_INTEGRATION_GUIDE.md` | Frontend integration guide for Education & Course Master |

---

## 📄 License

MIT License — part of the HRM system.
