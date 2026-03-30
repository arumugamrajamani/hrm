# Education and Course Master Module

A scalable Education and Course Master module for an HRM system using Node.js, Express, and MySQL.

## 📋 Overview

This module provides a flexible system for managing education (degrees) and courses (specializations) with many-to-many relationships. It follows enterprise-grade design patterns with normalized database tables and clean architecture.

## 📊 Database Design

### Tables

#### 1. education_master
- `id` (PK) - Primary key
- `education_name` (UNIQUE, required) - Name of the education/degree
- `education_code` (UNIQUE, required) - Code for the education
- `level` (required) - Level of education: School, UG, PG, Doctorate, Certification
- `description` (optional) - Additional description
- `status` - ACTIVE/INACTIVE
- `created_by` - User ID who created the record
- `updated_by` - User ID who updated the record
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### 2. course_master (GLOBAL TABLE)
- `id` (PK) - Primary key
- `course_name` (UNIQUE, required) - Name of the course
- `course_code` (UNIQUE, required) - Code for the course
- `description` (optional) - Additional description
- `status` - ACTIVE/INACTIVE
- `created_by` - User ID who created the record
- `updated_by` - User ID who updated the record
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

#### 3. education_course_map (MAPPING TABLE)
- `id` (PK) - Primary key
- `education_id` (FK) - Foreign key to education_master
- `course_id` (FK) - Foreign key to course_master
- `created_by` - User ID who created the mapping
- `created_at` - Creation timestamp

### Relationships
- `education_master` ↔ `course_master` (Many-to-Many)
- Enforced via `education_course_map` junction table

## 🌱 Seed Data

### Education
- B.E / B.Tech (UG)
- B.Sc (UG)
- MBA (PG)
- M.Tech (PG)

### Courses
- Computer Science (CSE)
- Electronics (ECE)
- Mechanical (MECH)
- Finance (FIN)
- Marketing (MKT)

### Mappings
- B.E → CSE, ECE, Mechanical
- B.Sc → CSE
- MBA → Finance, Marketing
- M.Tech → CSE, Mechanical

## ⚙️ Features

### Education Management
- ✅ Create Education
- ✅ Read Education(s)
- ✅ Update Education
- ✅ Delete Education (Soft Delete)
- ✅ Activate/Deactivate Education
- ✅ Search & Filter by name, code, level, status
- ✅ Get all courses under an education

### Course Management
- ✅ Create Course
- ✅ Read Course(s)
- ✅ Update Course
- ✅ Delete Course (Soft Delete)
- ✅ Activate/Deactivate Course
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

### Education Endpoints

#### Create Education
```
POST /api/education
Content-Type: application/json
Authorization: Bearer <token>

{
  "education_name": "Bachelor of Engineering",
  "education_code": "BE",
  "level": "UG",
  "description": "Undergraduate engineering degree",
  "status": "active"
}

Response: 201 Created
{
  "success": true,
  "message": "Education created successfully",
  "data": {
    "id": 1,
    "education_name": "Bachelor of Engineering",
    "education_code": "BE",
    "level": "UG",
    "description": "Undergraduate engineering degree",
    "status": "active",
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Educations
```
GET /api/education?page=1&limit=10&search=Engineering&level=UG&status=active
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Educations retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

#### Get Education by ID
```
GET /api/education/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Education retrieved successfully",
  "data": {...}
}
```

#### Update Education
```
PUT /api/education/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "education_name": "Bachelor of Technology",
  "level": "UG"
}

Response: 200 OK
{
  "success": true,
  "message": "Education updated successfully",
  "data": {...}
}
```

#### Delete Education (Soft Delete)
```
DELETE /api/education/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Education deleted successfully",
  "data": null
}
```

#### Activate/Deactivate Education
```
PATCH /api/education/:id/activate
PATCH /api/education/:id/deactivate
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Education activated/deactivated successfully",
  "data": {...}
}
```

#### Get Courses by Education
```
GET /api/education/:id/courses
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": {
    "education": {
      "id": 1,
      "education_name": "Bachelor of Engineering",
      "education_code": "BE",
      "level": "UG"
    },
    "courses": [
      {
        "course_id": 1,
        "course_name": "Computer Science",
        "course_code": "CSE"
      }
    ]
  }
}
```

### Course Endpoints

#### Create Course
```
POST /api/courses
Content-Type: application/json
Authorization: Bearer <token>

{
  "course_name": "Computer Science",
  "course_code": "CSE",
  "description": "Computer Science and Engineering",
  "status": "active"
}

Response: 201 Created
```

#### Get All Courses
```
GET /api/courses?page=1&limit=10&search=Computer&status=active
Authorization: Bearer <token>

Response: 200 OK
```

#### Get Course by ID
```
GET /api/courses/:id
Authorization: Bearer <token>

Response: 200 OK
```

#### Update Course
```
PUT /api/courses/:id
Content-Type: application/json
Authorization: Bearer <token>

{
  "course_name": "Information Technology",
  "course_code": "IT"
}

Response: 200 OK
```

#### Delete Course (Soft Delete)
```
DELETE /api/courses/:id
Authorization: Bearer <token>

Response: 200 OK
```

#### Get Educations by Course
```
GET /api/courses/:id/educations
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Educations retrieved successfully",
  "data": {
    "course": {
      "id": 1,
      "course_name": "Computer Science",
      "course_code": "CSE"
    },
    "educations": [
      {
        "education_id": 1,
        "education_name": "Bachelor of Engineering",
        "education_code": "BE",
        "level": "UG"
      }
    ]
  }
}
```

### Mapping Endpoints

#### Map Course to Education
```
POST /api/education-course
Content-Type: application/json
Authorization: Bearer <token>

{
  "education_id": 1,
  "course_id": 1
}

Response: 201 Created
{
  "success": true,
  "message": "Mapping created successfully",
  "data": {
    "id": 1,
    "education_id": 1,
    "course_id": 1,
    "education_name": "Bachelor of Engineering",
    "course_name": "Computer Science",
    "created_by": 1,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

#### Get All Mappings
```
GET /api/education-course
Authorization: Bearer <token>

Response: 200 OK
```

#### Delete Mapping
```
DELETE /api/education-course/:id
Authorization: Bearer <token>

Response: 200 OK
{
  "success": true,
  "message": "Mapping deleted successfully",
  "data": null
}
```

## 🧱 Architecture

### Clean Architecture
```
Controller → Service → Repository → Model
```

### Backend Structure
```
/modules/
  /education/
  /course/
  /education-course/

Each module contains:
- controller     → Handles HTTP requests/responses
- service         → Business logic and validations
- repository      → Data access layer
- validation      → JOI validation schemas
- routes          → API route definitions
```

### Additional Files
- **models/index.js** - Database models
- **validations/joiValidator.js** - JOI validation middleware
- **database/schema.sql** - Database schema
- **database/seed.sql** - Seed data

## 📌 Business Rules

- Soft delete for Education & Course (sets status to inactive)
- Mapping must be unique (education_id + course_id)
- Case-insensitive uniqueness for names and codes
- Created_by and Updated_by fields track user actions
- Admin role required for create, update, delete operations
- All endpoints require authentication (except health check)

## ⚡ Performance

### Database Indexes
- `education_master`: education_name, education_code, level, status, created_by, updated_by
- `course_master`: course_name, course_code, status, created_by, updated_by
- `education_course_map`: education_id, course_id, composite (education_id, course_id)

### Query Optimization
- Pagination for list endpoints
- Search functionality with indexed fields
- Efficient JOINs for relationship queries

## 📦 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "education_name",
      "message": "Education name is required"
    }
  ]
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Educations retrieved successfully",
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

## 🔮 Future Enhancements

### Planned Features
1. **Specialization Hierarchy**
   - Add `parent_course_id` to course_master
   - Support nested course structures

2. **User Education Mapping**
   - Add user_education mapping table
   - Track employee education and course qualifications

3. **Advanced Features**
   - Bulk mapping operations
   - Import/Export functionality
   - Audit trail for all operations
   - Version control for education/course changes

## 🛠️ Setup & Installation

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Update database credentials in .env
```

### 3. Setup Database
```bash
# Create database schema
npm run db:setup

# Insert seed data
npm run db:seed
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start
```

## 📝 API Documentation

Swagger/OpenAPI documentation is available at: `/api-docs`

### Interactive Documentation
- Access Swagger UI at: `http://localhost:3000/api-docs`
- All endpoints are documented with request/response schemas
- Try-it-out functionality available for testing APIs
- Authentication support via Bearer token

### API Tags
The APIs are organized into the following tags:
- **Education** - Education/degree management endpoints
- **Courses** - Course/specialization management endpoints
- **Education-Course Mapping** - Many-to-many relationship management

### Authentication
All endpoints (except health check) require JWT Bearer token authentication:
```
Authorization: Bearer <your_jwt_token>
```

### Authorization
- **GET endpoints** - Require authentication
- **POST, PUT, DELETE, PATCH endpoints** - Require Admin role

## 🔒 Security

- JWT-based authentication
- Role-based access control (Admin required for mutations)
- Input validation with JOI
- SQL injection prevention via parameterized queries
- CORS configuration
- Helmet security headers
- Rate limiting

## 📈 Scalability

- Horizontal scaling via stateless API design
- Database connection pooling
- Indexed queries for performance
- Clean separation of concerns
- Modular architecture for easy extension

## 🧪 Testing

```bash
# Run tests
npm test

# Watch mode
npm run test:watch
```

## 📄 License

MIT License
