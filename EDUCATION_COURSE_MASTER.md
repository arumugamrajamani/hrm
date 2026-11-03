# Education and Course Master Module

A scalable Education and Course Master module for an HRM system using Node.js, Express, and MySQL.

## 📋 Overview

This module provides a flexible system for managing education (degrees) and courses (specializations) with many-to-many relationships. It follows enterprise-grade design patterns with normalized database tables and clean architecture.

Module version: **2.0.0** (aligned with HRM system v2.0.0)

## 📊 Database Design

### Tables

#### 1. `education_master`
- `id` (PK) — Primary key
- `education_name` (UNIQUE, required) — Name of the education/degree
- `education_code` (UNIQUE, required) — Code for the education
- `level` (required) — Level of education: School, UG, PG, Doctorate, Certification
- `description` (optional) — Additional description
- `status` — ACTIVE/INACTIVE
- `created_by` / `updated_by` — User IDs
- `created_at` / `updated_at` — Timestamps

#### 2. `course_master` (GLOBAL TABLE)
- `id` (PK), `course_name` (UNIQUE, required), `course_code` (UNIQUE, required), `description` (optional), `status`, `created_by`, `updated_by`, `created_at`, `updated_at`

#### 3. `education_course_map` (MAPPING TABLE)
- `id` (PK), `education_id` (FK), `course_id` (FK), `created_by`, `created_at`

### Relationships
- `education_master` ↔ `course_master` (Many-to-Many) via `education_course_map`

## 🌱 Seed Data

### Education
- B.E / B.Tech (UG), B.Sc (UG), MBA (PG), M.Tech (PG)

### Courses
- Computer Science (CSE), Electronics (ECE), Mechanical (MECH), Finance (FIN), Marketing (MKT)

### Mappings
- B.E → CSE, ECE, Mechanical
- B.Sc → CSE
- MBA → Finance, Marketing
- M.Tech → CSE, Mechanical

## ⚙️ Features

### Education Management
- ✅ Create / Read / Update / Delete (soft delete) / Activate-Deactivate Education
- ✅ Search & Filter by name, code, level, status
- ✅ Get all courses under an education

### Course Management
- ✅ Create / Read / Update / Delete (soft delete) / Activate-Deactivate Course
- ✅ Search & Filter by name, code, status
- ✅ Get all educations for a course

### Mapping Management
- ✅ Map Course to Education
- ✅ Get Courses by Education
- ✅ Get Educations by Course
- ✅ Remove Mapping

## 🔐 Validations (JOI)

### Education
- `education_name` → required, unique, 2-100 characters
- `education_code` → required, unique, 2-20 uppercase characters
- `level` → required, one of: School, UG, PG, Doctorate, Certification
- `description` → optional, max 1000 characters

### Course
- `course_name` → required, unique, 2-100 characters
- `course_code` → required, unique, 2-20 uppercase characters
- `description` → optional, max 1000 characters

### Mapping
- `education_id` → required, must exist in education_master
- `course_id` → required, must exist in course_master
- Prevent duplicate mapping (education_id + course_id unique)

## 🚀 API Endpoints

### Base Path: `/api/v1/education`, `/api/v1/courses`, `/api/v1/education-course`

#### Education Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/education` | Create Education |
| GET | `/api/v1/education` | List Educations (page, limit, search, level, status) |
| GET | `/api/v1/education/:id` | Get Education by ID |
| PUT | `/api/v1/education/:id` | Update Education |
| DELETE | `/api/v1/education/:id` | Delete Education (soft delete) |
| PATCH | `/api/v1/education/:id/activate` | Activate Education |
| PATCH | `/api/v1/education/:id/deactivate` | Deactivate Education |
| GET | `/api/v1/education/:id/courses` | Get Courses by Education |

#### Course Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/courses` | Create Course |
| GET | `/api/v1/courses` | List Courses (page, limit, search, status) |
| GET | `/api/v1/courses/:id` | Get Course by ID |
| PUT | `/api/v1/courses/:id` | Update Course |
| DELETE | `/api/v1/courses/:id` | Delete Course (soft delete) |
| GET | `/api/v1/courses/:id/educations` | Get Educations by Course |

#### Mapping Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/education-course` | Map Course to Education |
| GET | `/api/v1/education-course` | Get All Mappings |
| DELETE | `/api/v1/education-course/:id` | Delete Mapping |

---

## 📌 Business Rules

- Soft delete for Education & Course (sets status to inactive)
- Mapping must be unique (education_id + course_id)
- Case-insensitive uniqueness for names and codes
- Created_by and Updated_by fields track user actions
- Admin role required for create, update, delete operations
- All endpoints require authentication (except health check)

---

## ⚡ Performance

### Database Indexes
- `education_master`: education_name, education_code, level, status, created_by, updated_by
- `course_master`: course_name, course_code, status, created_by, updated_by
- `education_course_map`: education_id, course_id, composite (education_id, course_id)

### Query Optimization
- Pagination for list endpoints
- Search functionality with indexed fields
- Efficient JOINs for relationship queries

---

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Operation successful",
  "data": { }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "education_name", "message": "Education name is required" }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Educations retrieved successfully",
  "data": [ ... ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
}
```

---

## 🔮 Future Enhancements

1. **Specialization Hierarchy** — Add `parent_course_id` to course_master; support nested course structures.
2. **User Education Mapping** — Add user_education mapping table; track employee education and course qualifications.
3. **Advanced Features** — Bulk mapping operations, import/export, audit trail, version control.

---

## 🧪 Testing

```bash
npm test
npm run test:watch
```

## 📄 License

MIT License
