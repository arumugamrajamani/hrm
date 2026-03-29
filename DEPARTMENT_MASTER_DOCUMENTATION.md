# Department Master Module - Documentation

## Overview

The Department Master module provides comprehensive CRUD operations for managing departments in an HRM system. It supports hierarchical department structures, circular hierarchy prevention, soft delete, and complete audit trails.

## Features Implemented

### 1. Core CRUD Operations
- **Create Department**: Add new departments with unique name and code
- **Read Departments**: Retrieve single or multiple departments with filtering
- **Update Department**: Modify department details with validation
- **Delete Department**: Soft delete (marks as inactive)
- **Activate/Deactivate**: Toggle department status

### 2. Hierarchical Structure
- **Parent-Child Relationships**: Support for multi-level hierarchies
- **Hierarchy Tree**: Get complete organizational tree
- **Child Departments**: Retrieve direct children of any department
- **Circular Prevention**: Automatic detection and prevention of circular references

### 3. Search & Filtering
- **Search**: By department name, code, or description
- **Status Filter**: Filter by active/inactive status
- **Pagination**: Configurable page size and number
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

## API Endpoints

### Base URL: `/api/departments`

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/` | List all departments | Authenticated |
| GET | `/hierarchy` | Get department tree | Authenticated |
| GET | `/:id` | Get department by ID | Authenticated |
| GET | `/:id/children` | Get child departments | Authenticated |
| POST | `/` | Create department | Admin |
| PUT | `/:id` | Update department | Admin |
| DELETE | `/:id` | Delete (soft) department | Admin |
| PATCH | `/:id/activate` | Activate department | Admin |
| PATCH | `/:id/deactivate` | Deactivate department | Admin |

## Usage Examples

### 1. Create a Department

```bash
POST /api/departments
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
GET /api/departments?page=1&limit=10&search=Engineering&status=active&hierarchy=true
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
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
  "pagination": {
    "total": 13,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

### 3. Get Department Hierarchy

```bash
GET /api/departments/hierarchy
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Department hierarchy retrieved successfully",
  "data": [
    {
      "id": 1,
      "department_name": "Engineering",
      "department_code": "ENG",
      "parent_department_id": null,
      "level": 1,
      "children": [
        {
          "id": 14,
          "department_name": "Frontend Engineering",
          "department_code": "FE",
          "parent_department_id": 1,
          "level": 2,
          "children": []
        }
      ]
    }
  ]
}
```

### 4. Update Department (with hierarchy change)

```bash
PUT /api/departments/14
Authorization: Bearer <token>

{
  "department_name": "Frontend Development",
  "parent_department_id": 2
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Department updated successfully",
  "data": {
    "id": 14,
    "department_name": "Frontend Development",
    "department_code": "FE",
    "parent_department_id": 2,
    "updated_by": 1,
    "updated_at": "2026-03-29T11:00:00.000Z"
  }
}
```

### 5. Delete Department (soft delete)

```bash
DELETE /api/departments/14
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Department deleted successfully"
}
```

## Database Schema

### Table: `departments`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INT | PRIMARY KEY, AUTO_INCREMENT | Unique identifier |
| department_name | VARCHAR(100) | NOT NULL, UNIQUE | Department name |
| department_code | VARCHAR(20) | NOT NULL, UNIQUE | Short code (e.g., ENG, HR) |
| parent_department_id | INT | NULL, FOREIGN KEY | Reference to parent department |
| description | TEXT | NULL | Department description |
| status | ENUM('active', 'inactive') | DEFAULT 'active' | Department status |
| created_by | INT | NULL, FOREIGN KEY | User who created |
| updated_by | INT | NULL, FOREIGN KEY | User who last updated |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | Creation timestamp |
| updated_at | DATETIME | ON UPDATE CURRENT_TIMESTAMP | Last update timestamp |

### Indexes
- `idx_department_name` on `department_name`
- `idx_department_code` on `department_code`
- `idx_parent_department_id` on `parent_department_id`
- `idx_status` on `status`
- `idx_created_by` on `created_by`
- `idx_updated_by` on `updated_by`

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

## Error Handling

### Common Error Responses

**400 Bad Request - Validation Error:**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "department_code",
      "message": "Department code must contain only uppercase letters, numbers, and underscores"
    }
  ]
}
```

**400 Bad Request - Circular Hierarchy:**
```json
{
  "success": false,
  "message": "Cannot set parent: would create circular hierarchy"
}
```

**400 Bad Request - Duplicate Entry:**
```json
{
  "success": false,
  "message": "Department name already exists"
}
```

**400 Bad Request - Has Children:**
```json
{
  "success": false,
  "message": "Cannot delete department with child departments. Please reassign or delete child departments first."
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Department not found"
}
```

## Best Practices

### 1. Department Code Conventions
- Use 2-5 character codes for simplicity (e.g., ENG, HR, QA)
- Use uppercase letters and numbers
- Start with a letter
- Make them memorable and meaningful
- Avoid special characters except underscores

### 2. Hierarchy Design
- Keep hierarchy depth reasonable (3-4 levels recommended)
- Use meaningful parent-child relationships
- Consider reporting structure
- Plan for future expansion

### 3. Naming Conventions
- Use clear, descriptive department names
- Include team/function in the name (e.g., "Frontend Engineering" vs "FE")
- Be consistent with naming style
- Consider full names, not abbreviations

### 4. Status Management
- Keep inactive departments for historical data
- Don't delete departments with active employees
- Use status field to control visibility
- Regular cleanup of unnecessary departments

## Scalability Considerations

### Current Implementation
- ✓ Multi-level hierarchy support (recursive CTE)
- ✓ Proper indexing for performance
- ✓ Soft delete pattern for data preservation
- ✓ Connection pooling for database efficiency
- ✓ Clean architecture with separation of concerns

### Future Enhancements
- Department budgets and headcount tracking
- Department-level permissions
- Department-specific workflows
- Integration with organizational charts
- Department performance metrics
- Cross-department project assignments
- Dynamic reporting structures
- Geographic/location-based departments

## Testing Scenarios

### Unit Tests (Recommended)
1. Create department with valid data
2. Create department with duplicate name (should fail)
3. Create department with duplicate code (should fail)
4. Create department with non-existent parent (should fail)
5. Update department with circular hierarchy (should fail)
6. Delete department with children (should fail)
7. Hierarchy tree construction
8. Pagination and filtering

### Integration Tests (Recommended)
1. Full CRUD workflow
2. Authentication and authorization
3. Database constraints and triggers
4. API response times
5. Concurrent operations
6. Error recovery

## File Structure

```
src/
├── controllers/
│   └── departmentController.js      # HTTP request handlers
├── services/
│   └── departmentService.js          # Business logic
├── repositories/
│   └── departmentRepository.js       # Data access layer
├── models/
│   └── index.js                      # DepartmentModel added
├── routes/
│   └── departmentRoutes.js          # API routes with Swagger docs
├── middlewares/
│   ├── validator.js                  # Department validations added
│   ├── auth.js                       # Authentication middleware
│   └── roleCheck.js                  # Role-based access control
├── config/
│   ├── database.js                   # MySQL connection
│   └── swagger.js                    # Swagger schemas added
├── database/
│   ├── schema.sql                    # Departments table created
│   └── seed.sql                      # (included in schema.sql)
└── app.js                            # Routes registered
```

## Configuration

### Environment Variables
No new environment variables required. Uses existing database configuration.

### Dependencies
All required packages already in use:
- express
- mysql2/promise
- express-validator
- swagger-jsdoc
- swagger-ui-express

## Security

### Authentication
All endpoints require JWT authentication via Bearer token.

### Authorization
- **GET endpoints**: Any authenticated user
- **POST/PUT/DELETE/PATCH**: Admin role required (role_id 1 or 2)

### Input Validation
- All inputs validated using express-validator
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization
- Proper error messages without exposing internals

## Performance

### Database Optimizations
- Indexed columns for fast lookups
- Proper use of foreign keys
- Optimized queries with LIMIT/OFFSET
- Connection pooling for concurrent requests

### API Performance
- Pagination to limit response size
- Efficient hierarchy queries using recursive CTEs
- Optional include parameters to reduce data transfer

## Maintenance

### Logging
Uses existing morgan logger for HTTP request logging.

### Monitoring
- Database connection testing on startup
- Proper error handling and logging
- Health check endpoint available

### Updates
- Schema changes should be backwards compatible
- Use migrations for production deployments
- Maintain seed data consistency
- Document breaking changes

## Support & Troubleshooting

### Common Issues

**1. Circular Hierarchy Error**
```
Cannot set parent: would create circular hierarchy
```
**Solution**: Check the parent chain and ensure you're not creating a loop.

**2. Delete Failed - Has Children**
```
Cannot delete department with child departments
```
**Solution**: Delete or reassign child departments first.

**3. Duplicate Entry Error**
```
Department name already exists
Department code already exists
```
**Solution**: Use a unique name or code for the department.

**4. Parent Not Found**
```
Parent department does not exist
```
**Solution**: Ensure the parent_department_id refers to an existing department.

## Contributing

When adding new features to the Department module:

1. Update validation in `validator.js`
2. Add business logic in `departmentService.js`
3. Add data access in `departmentRepository.js`
4. Add controller method in `departmentController.js`
5. Add routes with Swagger docs in `departmentRoutes.js`
6. Update Swagger schemas in `swagger.js`
7. Update tests
8. Update this documentation

## License

This module is part of the HRM system and follows the same license as the main project.
