# Department Master Module - Documentation

## Overview

The Department Master module provides comprehensive CRUD operations for managing departments in an HRM system. It supports hierarchical department structures, circular hierarchy prevention, soft delete, search & filtering, and complete audit trails.

**Module version:** 2.0.0 (aligned with HRM system v2.0.0)

## Features Implemented

### 1. Core CRUD Operations
- **Create Department**: Add new departments with unique name and code
- **Read Departments**: Retrieve single or multiple departments with filtering
- **Update Department**: Modify department details with validation
- **Delete Department**: Soft delete (clears `deleted_at`)
- **Activate/Deactivate**: Toggle department status

### 2. Hierarchical Structure
- **Parent-Child Relationships**: Support for multi-level hierarchies
- **Hierarchy Tree**: Get complete organizational tree
- **Child Departments**: Retrieve direct children of any department
- **Circular Prevention**: Automatic detection and prevention of circular references

### 3. Search & Filtering
- **Search**: By department name, code, or description
- **Status Filter**: Filter by active/inactive status
- **Pagination**: Configurable page size and number (`page`, `limit` via `paginationValidation`)
- **Include Hierarchy**: Option to include parent department details

### 4. Validations
- **Unique Name**: Department names must be unique
- **Unique Code**: Department codes must be unique
- **Code Format**: Uppercase letters, numbers, underscores (must start with letter)
- **Name Format**: Letters, numbers, spaces, hyphens, underscores, ampersands, parentheses
- **Parent Existence**: Parent department must exist if specified
- **Circular Check**: Prevents department from being its own ancestor

### 5. Audit Trail
- **Created By**: Tracks who created each department
- **Updated By**: Tracks who last modified each department
- **Timestamps**: Automatic created_at and updated_at

---

## API Endpoints

### Base URL: `/api/v1/departments`

| Method | Endpoint | Description | Handler | Access / Middleware |
|--------|----------|-------------|---------|---------------------|
| GET | `/` | List all departments (paginated) | `departmentController.getAllDepartments` | Authenticated — `generalLimiter, paginationValidation` |
| GET | `/hierarchy` | Get department tree | `departmentController.getDepartmentHierarchy` | Authenticated |
| GET | `/:id/children` | Get child departments | `departmentController.getChildDepartments` | Authenticated — `departmentIdValidation` |
| GET | `/:id` | Get department by ID | `departmentController.getDepartmentById` | Authenticated — `departmentIdValidation` |
| POST | `/` | Create department | `departmentController.createDepartment` | Admin — `checkPermission('master.write'), createDepartmentValidation` |
| PUT | `/:id` | Update department | `departmentController.updateDepartment` | Admin — `checkPermission('master.update'), updateDepartmentValidation` |
| DELETE | `/:id` | Delete (soft) department | `departmentController.deleteDepartment` | Admin — `checkPermission('master.delete'), departmentIdValidation` |
| PATCH | `/:id/activate` | Activate department | `departmentController.activateDepartment` | Admin — `checkPermission('master.update'), departmentIdValidation` |
| PATCH | `/:id/deactivate` | Deactivate department | `departmentController.deactivateDepartment` | Admin — `checkPermission('master.update'), departmentIdValidation` |

---

## Usage Examples

### 1. Create a Department

```bash
POST /api/v1/departments
Authorization: Bearer <token>

{
  "department_name": "Frontend Engineering",
  "department_code": "FE",
  "parent_department_id": 1,
  "description": "Frontend development team",
  "status": "active"
}
```

**Response (201):**
```json
{
  "success": true,
  "statusCode": 201,
  "message": "Department created successfully",
  "data": {
    "id": 14,
    "department_name": "Frontend Engineering",
    "department_code": "FE",
    "parent_department_id": 1,
    "description": "Frontend development team",
    "status": "active",
    "created_by": 1,
    "created_at": "2026-03-29T10:00:00.000Z"
  }
}
```

### 2. Get All Departments (with pagination)

```bash
GET /api/v1/departments?page=1&limit=10&search=Engineering&status=active
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Departments retrieved successfully",
  "data": [
    {
      "id": 1,
      "department_name": "Engineering",
      "department_code": "ENG",
      "parent_department_id": null,
      "status": "active",
      "parent_department_name": null,
      "created_by_username": "superadmin"
    }
  ],
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 13,
      "totalPages": 2
    }
  }
}
```

### 3. Get Department Hierarchy

```bash
GET /api/v1/departments/hierarchy
Authorization: Bearer <token>
```

**Response (200):** hierarchy tree with nested `children` and `level` fields.

### 4. Update Department (with hierarchy change)

```bash
PUT /api/v1/departments/14
Authorization: Bearer <token>

{
  "department_name": "Frontend Development",
  "parent_department_id": 2
}
```

**Response (200):** `{ "success": true, "statusCode": 200, "message": "Department updated successfully", "data": { ... } }`

### 5. Delete Department (soft delete)

```bash
DELETE /api/v1/departments/14
Authorization: Bearer <token>
```

**Response (200):** `{ "success": true, "statusCode": 200, "message": "Department deleted successfully", "data": null }`

---

## Database Schema

### Table: `departments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | BIGINT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| department_name | VARCHAR(100) | NOT NULL | Department name |
| department_code | VARCHAR(20) | NOT NULL, UNIQUE | Short code (e.g., ENG, HR) |
| parent_department_id | BIGINT | NULL, FK → departments(id) | Reference to parent department |
| description | TEXT | NULL | Department description |
| status | VARCHAR(20) | DEFAULT 'active' | Department status |
| created_by | BIGINT | NULL, FK → users(id) | User who created |
| updated_by | BIGINT | NULL, FK → users(id) | User who last updated |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |
| business_unit_id | BIGINT | NULL, FK → business_units(id) | Owning business unit |

### Indexes
- `idx_department_code` (department_code)
- `idx_parent_department` (parent_department_id)
- `idx_status` (status)
- `idx_dept_bu` (business_unit_id)

---

## Seed Data (Default Departments)

The following departments are automatically created when the database is initialized:

1. Engineering (ENG)
2. QA / Testing (QA)
3. DevOps (DEVOPS)
4. UI/UX Design (UIUX)
5. Project Management (PM)
6. Sales (SALES)
7. Business Development (BD)
8. Customer Support (SUPPORT)
9. HR (HR)
10. Finance (FIN)
11. Marketing (MKT)
12. IT Support (ITSUPP)
13. Administration (ADMIN)

---

## Error Handling

### Common Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    { "field": "department_code", "message": "Department code must contain only uppercase letters, numbers, and underscores" }
  ]
}
```

**400 Bad Request - Circular Hierarchy:**
```json
{ "success": false, "statusCode": 400, "message": "Cannot set parent: would create circular hierarchy" }
```

**400 Bad Request - Duplicate Entry:**
```json
{ "success": false, "statusCode": 400, "message": "Department name already exists" }
```

**400 Bad Request - Has Children:**
```json
{ "success": false, "statusCode": 400, "message": "Cannot delete department with child departments. Please reassign or delete child departments first." }
```

**404 Not Found:**
```json
{ "success": false, "statusCode": 404, "message": "Department not found" }
```

**403 Forbidden (insufficient permissions):**
```json
{ "success": false, "statusCode": 403, "message": "Insufficient permissions" }
```

**409 Conflict (duplicate entry via DB):**
```json
{ "success": false, "statusCode": 409, "message": "A record with this information already exists.", "code": "DUPLICATE_ENTRY" }
```

---

## Business Rules

- Departments are soft-deleted via `deleted_at` (not via status toggle)
- Deleting a department with child departments is rejected
- Circular parent-child references are prevented
- `business_unit_id` links the department to its owning business unit (enterprise schema)
- Audit logs capture `department.create`, `department.update`, etc. via the `auditLog` middleware

---

## Performance

- Indexed columns for fast lookups
- Recursive CTEs for hierarchy queries
- LIMIT/OFFSET pagination on list endpoints
- Connection pooling via mysql2 pool
- Soft delete pattern for data preservation

---

## Maintenance

- Schema changes should be backwards compatible
- Use migrations for production deployments
- Maintain seed data consistency
- Document breaking changes

---

## Contributing

When adding new features to the Department module:

1. Update validation in `src/middlewares/validator.js`
2. Add business logic in `src/services/departmentService.js`
3. Add data access in `src/models/index.js` (`DepartmentModel`)
4. Add controller method in `src/controllers/departmentController.js`
5. Add routes with Swagger docs in `src/routes/departmentRoutes.js`
6. Update Swagger schemas in `src/config/swagger.js`
7. Update tests
8. Update this documentation

---

## License

This module is part of the HRM system and follows the same license as the main project.
