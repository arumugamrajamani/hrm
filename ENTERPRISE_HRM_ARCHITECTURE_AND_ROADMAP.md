# Enterprise HRM - Architecture & Roadmap Blueprint

## 1. Executive Summary

A production-grade, employee-centric HRM system built on Node.js/Express/MySQL with multi-tenant readiness, SCD Type 2 temporal tracking, hierarchical org structures, and complete employee lifecycle management from recruitment through retirement.

**Version:** 2.0.0  
**Architecture:** Layered Monolith (Controller → Service → Repository)  
**Database:** MySQL 8.0 with recursive CTEs, stored procedures, views  
**Authentication:** JWT (access + refresh), 2FA (email/TOTP), API keys  
**Compliance Targets:** SOC 2 Type II, ISO 27001, GDPR, India DPDP Act 2023

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│              (React/Angular/Vue/Mobile)                      │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS (Bearer JWT / API Key)
┌────────────────────────▼────────────────────────────────────┐
│                    API Gateway / Reverse Proxy               │
│                   (Nginx / Cloudflare / ALB)                 │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                    HRM Backend (Node.js)                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Express App (app.js)                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │  │
│  │  │ Helmet   │ │ CORS     │ │ Rate     │ │ Request  │  │  │
│  │  │ (Security│ │ (Policy) │ │ Limiter  │ │ ID +     │  │  │
│  │  │  Headers)│ │          │ │ (Redis)  │ │ Sanitizer│  │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │  │
│  │                                                       │  │
│  │  ┌──────────────────────────────────────────────────┐ │  │
│  │  │  Versioned Routes: /api/v1/*                     │ │  │
│  │  │  ┌────────────────────────────────────────────┐  │ │  │
│  │  │  │  Auth Middleware (JWT validation)          │  │ │  │
│  │  │  │  Role-Based Access Control                 │  │ │  │
│  │  │  │  Audit Log Middleware                      │  │ │  │
│  │  │  └────────────────────────────────────────────┘  │ │  │
│  │  │                                                   │ │  │
│  │  │  ┌──────────────┐ ┌──────────────┐               │ │  │
│  │  │  │ Controllers  │ │ Controllers  │  ... (14)     │ │  │
│  │  │  │ (HTTP Layer) │ │ (HTTP Layer) │               │ │  │
│  │  │  └──────┬───────┘ └──────┬───────┘               │ │  │
│  │  │         │                │                        │ │  │
│  │  │  ┌──────▼───────┐ ┌──────▼───────┐               │ │  │
│  │  │  │ Services     │ │ Services     │  Business      │ │  │
│  │  │  │ (Business)   │ │ (Business)   │  Logic Layer   │ │  │
│  │  │  └──────┬───────┘ └──────┬───────┘               │ │  │
│  │  │         │                │                        │ │  │
│  │  │  ┌──────▼───────┐ ┌──────▼───────┐               │ │  │
│  │  │  │ Repositories │ │ Models       │  Data Layer    │ │  │
│  │  │  │ (DB Ops)     │ │ (DB Queries) │               │ │  │
│  │  │  └──────┬───────┘ └──────┬───────┘               │ │  │
│  │  └─────────┼────────────────┼───────────────────────┘ │  │
│  └────────────┼────────────────┼─────────────────────────┘  │
│               │                │                             │
│  ┌────────────▼───┐ ┌─────────▼──────────┐ ┌──────────────┐│
│  │ MySQL 8.0      │ │ Redis (Cache/Rate) │ │ Bull Queue   ││
│  │ (Primary DB)   │ │ (Session/Limiter)  │ │ (Background) ││
│  └────────────────┘ └────────────────────┘ └──────────────┘│
└─────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│              External Services                               │
│  ┌───────────┐ ┌────────────┐ ┌──────────┐ ┌────────────┐  │
│  │ SMTP      │ │ Cloud      │ │ SMS      │ │ S3 /       │  │
│  │ (Nodemailer│ │ Storage    │ │ Gateway  │ │ Local FS   │  │
│  │  / SES)   │ │ (Backups)  │ │ (OTP)    │ │ (Uploads)  │  │
│  └───────────┘ └────────────┘ └──────────┘ └────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Project Structure

```
hrm/
├── src/
│   ├── config/           # DB pool, Redis, environment, Swagger
│   ├── controllers/      # HTTP request handlers (14 modules)
│   ├── services/         # Business logic, cache, circuit breaker, queue
│   ├── repositories/     # Data access layer
│   ├── models/           # SQL query builders
│   ├── middlewares/      # Auth, RBAC, validation, audit, rate limiting, error
│   ├── routes/           # API route definitions with Swagger docs
│   ├── utils/            # Logger, sanitizer, validators, helpers
│   ├── database/
│   │   ├── schema.sql    # Core schema (26 tables + views + procedures)
│   │   ├── seed.sql      # Default data
│   │   ├── migrate.js    # Migration runner
│   │   └── migrations/   # Ordered SQL migration files (001-004)
│   ├── tests/            # Jest test suites
│   ├── app.js            # Express app configuration
│   └── server.js         # Server entry point
├── uploads/              # File upload storage
├── logs/                 # Winston log files
├── coverage/             # Jest coverage reports
├── package.json
├── jest.config.js
└── *.md                  # Documentation files
```

### 2.3 Architectural Patterns

| Pattern | Implementation |
|---------|---------------|
| **Layered Architecture** | Controller → Service → Repository → Model → DB |
| **SCD Type 2** | `employee_job_details`, `employee_addresses`, `employee_bank_details`, `employee_salary_details` use `is_current` + `effective_start/end_date` |
| **Soft Delete** | `employees.deleted_at`, `*_master.status = 'inactive'` |
| **Hierarchical Data** | Recursive CTEs for departments, locations, business units |
| **Circular Prevention** | Recursive ancestor checks for parent-child relationships |
| **Event-Ready** | Bull queue service, webhook system, audit logs |
| **Multi-Tenant Ready** | `tenants` table, `X-Tenant-ID` header support |
| **Stored Procedures** | SCD Type 2 updates for job, address, bank details |

---

## 3. Module Inventory (Complete)

### Phase 1: Core Foundation (✅ Implemented)

| Module | Tables | API Endpoints | Status |
|--------|--------|---------------|--------|
| **Authentication** | users, roles, login_attempts, password_history, password_reset_tokens, refresh_tokens | 14 | ✅ Complete |
| **User Management** | users, roles | 8 | ✅ Complete |
| **Employee Core** | employees, employee_contact_details, employee_addresses, employee_job_details, employee_bank_details, employee_education, employee_experience, employee_documents | 22 | ✅ Complete |
| **Department Master** | departments | 9 | ✅ Complete |
| **Designation Master** | designations_master | - | ✅ Complete |
| **Location Master** | locations_master | - | ✅ Complete |
| **Education Master** | education_master, course_master, education_course_map | 11 | ✅ Complete |
| **Documents Master** | documents_master | - | ✅ Complete |
| **Lifecycle** | employee_lifecycle_states, employee_lifecycle_history, employee_job_changes | - | ✅ Complete |
| **Audit System** | audit_logs | - | ✅ Complete |
| **Enterprise** | webhooks, webhook_endpoints, webhook_deliveries, tenants, ip_blocklist, user_totp_secrets, api_keys, feature_flags | - | ✅ Complete |

### Phase 2: Attendance & Leave (✅ Schema + Code Complete)

| Module | Tables | API Endpoints | Status |
|--------|--------|---------------|--------|
| **Shifts** | shifts | 3 | ✅ Complete |
| **Holiday Calendar** | holiday_calendar | 2 | ✅ Complete |
| **Attendance Records** | attendance_records | 3 | ✅ Complete |
| **Leave Types** | leave_types | 1 | ✅ Complete |
| **Leave Balances** | leave_balances | 2 | ✅ Complete |
| **Leave Requests** | leave_requests | 3 | ✅ Complete |
| **Timesheets** | timesheets | 3 | ✅ Complete |

### Phase 3: Payroll (✅ Schema + Code Complete)

| Module | Tables | API Endpoints | Status |
|--------|--------|---------------|--------|
| **Salary Components** | salary_components | 5 | ✅ Complete |
| **Salary Structures** | salary_structures, salary_structure_components | 9 | ✅ Complete |
| **Employee Salary** | employee_salary_details (SCD2), employee_salary_components | 4 | ✅ Complete |
| **Payroll Runs** | payroll_runs | 5 | ✅ Complete |
| **Payslips** | payslips, payslip_components | 4 | ✅ Complete |
| **Tax Configuration** | tax_configurations | 1 | ✅ Complete |
| **PF/ESI** | pf_configurations, esi_configurations | 2 | ✅ Complete |
| **Bonus** | bonus_records | 3 | ✅ Complete |

### Phase 4: Onboarding & Master Data (✅ Schema + Code Complete)

| Module | Tables | API Endpoints | Status |
|--------|--------|---------------|--------|
| **Companies** | companies | 4 | ✅ Complete |
| **Business Units** | business_units | 4 | ✅ Complete |
| **Grades Master** | grades_master | 4 | ✅ Complete |
| **Onboarding** | employee_onboarding, employee_checklist_progress | 5 | ✅ Complete |
| **Checklist Templates** | onboarding_checklist_templates, checklist_items | 7 | ✅ Complete |
| **Probation Tracking** | probation_tracking | 3 | ✅ Complete |

**Total:** 59+ tables, 120+ API endpoints, 4 views, 3 stored procedures

---

## 4. Database Architecture

### 4.1 Schema Layering

```
Layer 1: Core Identity
  └── employees, users, roles

Layer 2: Master Data
  └── departments, designations_master, locations_master,
      education_master, course_master, documents_master,
      companies, business_units, grades_master

Layer 3: Employee Profiles (SCD Type 2)
  └── employee_job_details, employee_addresses,
      employee_bank_details, employee_contact_details

Layer 4: Employee Records (1:N)
  └── employee_education, employee_experience,
      employee_documents, employee_emergency_contacts

Layer 5: Operational
  └── attendance_records, leave_requests, leave_balances,
      timesheets, payroll_runs, payslips, employee_onboarding,
      employee_checklist_progress, probation_tracking

Layer 6: Payroll Configuration
  └── salary_components, salary_structures, tax_configurations,
      pf_configurations, esi_configurations, bonus_records

Layer 7: Security & Audit
  └── audit_logs, login_attempts, password_history,
      password_reset_tokens, refresh_tokens, api_keys,
      ip_blocklist, user_totp_secrets

Layer 8: Enterprise
  └── webhooks, webhook_endpoints, webhook_deliveries,
      tenants, feature_flags
```

### 4.2 Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Employee-Centric** | All HR data links to `employees` table; users are auth layer only |
| **SCD Type 2** | Full history for job changes, salary revisions, address/bank changes |
| **Soft Deletes** | `deleted_at` on employees, `status` on masters; preserves audit trail |
| **Recursive CTEs** | Department/location/business-unit hierarchies with circular prevention |
| **JSON Columns** | Flexible storage for permissions, webhook events, settings |
| **Stored Procedures** | Atomic SCD Type 2 operations prevent race conditions |
| **Views** | Pre-joined queries for common reporting (leave balance, salary, onboarding) |

### 4.3 Migration Order

| File | Purpose | Dependencies |
|------|---------|-------------|
| `schema.sql` | Core 26 tables + seed data + procedures + views | None |
| `001_create_audit_logs.sql` | Audit logs enhancements | users |
| `002_create_enterprise_tables.sql` | Webhooks, tenants, security tables | users |
| `004_create_missing_module_tables.sql` | All 27 new module tables + seed + views | companies, business_units → departments/designations (ALTER) |

---

## 5. Security Architecture

### 5.1 Defense-in-Depth Layers

```
1. Network: CORS policy, Helmet headers, IP blocklist
2. Transport: HTTPS-only, HSTS (31536000s)
3. Authentication: JWT (15min access), Refresh (7 days), TOTP, API keys
4. Authorization: RBAC (5 roles), resource-level permissions
5. Input: Joi validation, express-validator, request sanitizer
6. Data: Parameterized queries, bcrypt hashing, password history (3)
7. Rate: Redis-backed limiter (10/15min auth, 100/15min general)
8. Session: Account lockout (5 attempts, 30min block)
9. Audit: Immutable audit_logs with request IDs, IP, user agent
```

### 5.2 Password Policy
- Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special
- Expires every 90 days
- Last 3 passwords blocked from reuse
- Change password requires current password

### 5.3 RBAC Model

| Role | Permissions |
|------|-------------|
| Super Admin | All permissions |
| Admin | Users (CRUD), Employees (CRUD), Roles (read) |
| Manager | Users (read), Employees (read, write, update) |
| HR Manager | Employees (CRUD), Reports (read) |
| Employee | Employees (read - own profile) |

---

## 6. Performance Architecture

### 6.1 Database Optimization
- **Connection pooling** via mysql2 pool (configurable min/max)
- **Indexes** on all foreign keys, status columns, date ranges
- **Unique constraints** on natural keys (codes, names)
- **Composite indexes** for common query patterns
- **LIMIT/OFFSET** pagination on all list endpoints

### 6.2 Caching Strategy
- **Redis** for session storage, rate limiting, response caching
- **Cache service** with TTL, invalidation patterns
- **Circuit breaker** for Redis failures (graceful degradation)

### 6.3 Background Processing
- **Bull Queue** for email notifications, async tasks
- **Queue service** with retry logic, job tracking
- **Scheduled jobs** for leave balance initialization, password expiry

---

## 7. Roadmap - Future Enhancements

### Phase 5: Q2 2026 - Recruitment & Talent

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Job Requisitions** | High | Medium | Create/approve open positions linked to departments |
| **Candidate Pipeline** | High | High | Application tracking, interview scheduling, scoring |
| **Offer Management** | High | Medium | Offer letter generation, acceptance workflow |
| **Background Verification** | Medium | Medium | Third-party BGV integration, status tracking |
| **Referral Program** | Low | Small | Employee referrals, reward tracking |

### Phase 6: Q3 2026 - Performance Management

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Goal Setting (OKR/KPI)** | High | High | Define, track, and review employee goals |
| **Performance Reviews** | High | High | 360-degree reviews, self-assessment, manager review |
| **Competency Framework** | Medium | Medium | Skills matrix, competency levels, gap analysis |
| **Training & Development** | Medium | Medium | Training courses, certifications, learning paths |
| **Succession Planning** | Low | High | Identify successors, readiness assessment |

### Phase 7: Q4 2026 - Advanced Features

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Expense Management** | High | Medium | Expense claims, approval workflow, reimbursement |
| **Asset Management** | High | Medium | IT equipment tracking, assignment, return |
| **Travel Management** | Medium | Medium | Travel requests, booking, expense integration |
| **Employee Self-Service** | High | Medium | Portal for leave, profile update, document upload |
| **Analytics Dashboard** | High | High | KPIs, turnover analysis, diversity metrics |

### Phase 8: Q1 2027 - Enterprise Scale

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **Multi-Tenant SaaS** | High | High | Full tenant isolation, schema-per-tenant or row-level |
| **Microservices Split** | Medium | Very High | Extract Payroll, Attendance as independent services |
| **GraphQL API** | Medium | High | Flexible querying for complex employee data |
| **Mobile App** | High | High | React Native app for employee self-service |
| **Compliance Engine** | Medium | High | Automated compliance checks (labor law, tax) |

### Phase 9: Ongoing - Platform Improvements

| Feature | Priority | Effort | Description |
|---------|----------|--------|-------------|
| **OpenAPI/Codegen** | Medium | Small | Auto-generate TypeScript client SDKs |
| **Integration Hub** | High | Medium | SAP, Workday, ADP connectors |
| **Workflow Engine** | Medium | High | BPMN-based approval workflows |
| **Chat/Notifications** | Low | Medium | In-app messaging, push notifications |
| **AI/ML** | Low | High | Attrition prediction, salary benchmarking |

---

## 8. Deployment Architecture

### 8.1 Recommended Infrastructure

```
┌─────────────────────────────────────────────────┐
│                  Load Balancer                   │
│               (ALB / Nginx)                      │
└────────────┬─────────────────────┬──────────────┘
             │                     │
┌────────────▼──────┐  ┌──────────▼──────────────┐
│  App Server #1    │  │  App Server #2          │
│  (Node.js PM2)    │  │  (Node.js PM2)          │
│  :3000            │  │  :3000                  │
└────┬──────────┬───┘  └────┬──────────┬─────────┘
     │          │            │          │
┌────▼───┐  ┌───▼────┐  ┌───▼────┐  ┌──▼───────┐
│ MySQL  │  │ Redis  │  │ S3/FS  │  │ SMTP     │
│ Primary│  │ Cache  │  │ Uploads│  │ Email    │
└────────┘  └────────┘  └────────┘  └──────────┘
```

### 8.2 Environment Configuration

| Environment | Purpose | Key Settings |
|------------|---------|-------------|
| **Development** | Local development | Hot reload, verbose logging, seed data |
| **Staging** | UAT, pre-production | Production-like data, full security |
| **Production** | Live system | PM2 cluster mode, Redis, backups, monitoring |

### 8.3 Monitoring & Observability

| Tool | Purpose |
|------|---------|
| **Winston + Daily Rotate** | Structured application logging |
| **Morgan** | HTTP access logging |
| **Health Endpoints** | `/health`, `/health/detailed`, `/health/live`, `/health/ready` |
| **Database Pool Metrics** | Connection utilization, wait times |
| **Circuit Breaker Status** | Service dependency health |
| **Queue Statistics** | Job success/failure rates |

---

## 9. API Standards

### 9.1 Response Format

**Success:**
```json
{
  "success": true,
  "message": "Operation completed",
  "data": { ... },
  "pagination": { "page": 1, "limit": 10, "total": 50, "totalPages": 5 }
}
```

**Error:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": [{ "field": "email", "message": "Email already exists" }]
}
```

### 9.2 Headers

| Header | Purpose |
|--------|---------|
| `Authorization: Bearer <token>` | JWT authentication |
| `X-Request-ID` | Request tracing (auto-generated) |
| `X-Tenant-ID` | Multi-tenant identification |
| `X-API-Key` | API key authentication |
| `X-Timezone` | User timezone for date formatting |

### 9.3 Error Codes

| HTTP | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Validation error |
| 401 | Unauthorized (invalid/expired token) |
| 403 | Forbidden (insufficient permissions) |
| 404 | Not found |
| 409 | Conflict (duplicate entry) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 10. Testing Strategy

| Type | Coverage | Tools | Scope |
|------|----------|-------|-------|
| **Unit** | 80%+ | Jest | Services, utilities, validators |
| **Integration** | 70%+ | Jest + Supertest | Controllers, DB queries |
| **E2E** | Critical paths | Playwright/Cypress | Full user workflows |
| **Load** | Key endpoints | Artillery/k6 | Concurrency, response times |
| **Security** | OWASP Top 10 | OWASP ZAP | Auth, injection, XSS |

### Current Test Status
- `test-phase1.js`: Auth module tests
- `test-phase2.js`: User management tests
- `verify-phase1.js`: Phase 1 verification

---

## 11. Known Gaps & Technical Debt

| Issue | Impact | Fix | Status |
|-------|--------|-----|--------|
| Missing schema for 26 tables | Runtime crashes | Migration 004 | ✅ Fixed |
| Webhook FK ordering bug | Migration fails | Migration 002 reordered | ✅ Fixed |
| Missing business_unit_id columns | Payroll joins fail | Migration 004 ALTER | ✅ Fixed |
| Validation middleware missing | No input validation on new modules | Add express-validator/Joi | 🔲 TODO |
| Swagger docs incomplete | New modules not documented | Add @swagger blocks | 🔲 TODO |
| No test coverage for new modules | Regression risk | Write Jest tests | 🔲 TODO |
| No role checks on new routes | Authorization gaps | Add roleCheck middleware | 🔲 TODO |
| Soft delete not uniform | Inconsistent deletion | Standardize pattern | 🔲 TODO |

---

## 12. Quick Reference

### Migration Execution Order
```bash
mysql -u root -p < src/database/schema.sql
node src/database/migrate.js  # runs 001, 002, 003, 004 in order
```

### Key Files
| File | Purpose |
|------|---------|
| `src/app.js` | Express app, middleware, health checks |
| `src/routes/v1/index.js` | Route registration hub |
| `src/database/schema.sql` | Core schema (1131 lines) |
| `src/database/migrations/004_create_missing_module_tables.sql` | New module tables (800+ lines) |
| `src/config/database.js` | MySQL connection pool |
| `src/middlewares/auth.js` | JWT authentication |
| `src/middlewares/roleCheck.js` | RBAC enforcement |
| `src/middlewares/auditLog.js` | Audit trail middleware |

### Development Commands
```bash
npm run dev          # Start with nodemon
npm start            # Production start
npm test             # Run Jest with coverage
npm run lint         # ESLint
npm run migrate      # Run pending migrations
npm run seed         # Run seed data
```

---

**Last Updated:** April 30, 2026  
**Author:** opencode (Architecture Session)  
**Next Review:** After Phase 5 planning
