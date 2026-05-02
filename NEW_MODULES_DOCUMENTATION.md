# HRM System - New Modules Documentation

This document covers the 4 new modules: **Attendance**, **Payroll**, **Onboarding**, and **Master Data**. All APIs are prefixed with `/api/v1`.

---

## Table of Contents
1. [Attendance Module](#attendance-module)
2. [Payroll Module](#payroll-module)
3. [Onboarding Module](#onboarding-module)
4. [Master Data Module](#master-data-module)
5. [Database Schema Summary](#database-schema-summary)
6. [Data Relationships](#data-relationships)

---

## Attendance Module

**Base Path:** `/api/v1/attendance`

### Shifts Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/shifts` | List all shifts (pagination, status filter) |
| POST | `/shifts` | Create new shift |
| PUT | `/shifts/:id` | Update shift |

**Create Shift Payload:**
```json
{
  "shift_name": "General",
  "start_time": "09:00:00",
  "end_time": "18:00:00",
  "break_duration": 60,
  "weekoff_days": "Saturday,Sunday",
  "is_flexible": false,
  "grace_period_minutes": 15
}
```

### Holiday Calendar

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/holidays` | List holidays (year, location filter) |
| POST | `/holidays` | Create holiday |

**Create Holiday Payload:**
```json
{
  "holiday_name": "Diwali",
  "holiday_date": "2026-11-01",
  "description": "Festival of Lights",
  "is_national": true,
  "location_id": null
}
```

### Attendance Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/records` | List attendance (employee, date range, status) |
| POST | `/mark` | Mark attendance (upsert by employee+date) |
| PATCH | `/regularize/:id` | Regularize attendance record |

**Mark Attendance Payload:**
```json
{
  "employee_id": 1,
  "attendance_date": "2026-04-30",
  "shift_id": 1,
  "check_in": "2026-04-30T09:05:00",
  "check_out": "2026-04-30T18:10:00",
  "status": "present",
  "is_late": true,
  "late_minutes": 5
}
```

### Leave Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leave-types` | List leave types |

**Seed Data:** CL (12), SL (12), EL (15), ML (180), PL (15), LOP (0), COMP (0)

### Leave Balances

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leave-balances/:employeeId` | Get balances (optional year filter) |
| POST | `/leave-balances/:employeeId/initialize` | Initialize balances for a year |

**Initialize Payload:**
```json
{ "year": 2026 }
```

### Leave Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/leave-requests` | List requests (employee, status, date range) |
| POST | `/leave-requests` | Create leave request |
| PATCH | `/leave-requests/:id/status` | Approve/reject request |

**Create Request Payload:**
```json
{
  "employee_id": 1,
  "leave_type_id": 1,
  "start_date": "2026-05-01",
  "end_date": "2026-05-03",
  "total_days": 3,
  "reason": "Personal work"
}
```

### Timesheets

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/timesheets` | List timesheets |
| POST | `/timesheets` | Create timesheet entry |
| PATCH | `/timesheets/:id/status` | Update status (submitted/approved/rejected) |

---

## Payroll Module

**Base Path:** `/api/v1/payroll`

### Salary Components

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/salary-components` | List (type, active filter) |
| GET | `/salary-components/:id` | Get by ID |
| POST | `/salary-components` | Create component |
| PUT | `/salary-components/:id` | Update component |
| DELETE | `/salary-components/:id` | Soft delete |

**Create Component Payload:**
```json
{
  "component_code": "BASIC",
  "component_name": "Basic Salary",
  "component_type": "earning",
  "calculation_type": "fixed",
  "is_taxable": true,
  "is_statutory": false,
  "display_order": 1
}
```

### Salary Structures

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/salary-structures` | List (active filter) |
| GET | `/salary-structures/:id` | Get with components |
| POST | `/salary-structures` | Create structure |
| PUT | `/salary-structures/:id` | Update structure |
| DELETE | `/salary-structures/:id` | Soft delete |

**Structure Components:**
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/salary-structures/:structureId/components` | Get components |
| POST | `/salary-structures/:structureId/components` | Add component |
| PUT | `/structure-components/:componentId` | Update component |
| DELETE | `/structure-components/:componentId` | Remove component |

### Employee Salary (SCD Type 2)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/employees/:employeeId/salary` | History (current_only=true) |
| GET | `/employees/:employeeId/current-salary` | Current only |
| POST | `/employees/:employeeId/salary` | New revision (auto-expires previous) |
| PUT | `/employee-salaries/:id` | Update record |

**Create Salary Payload:**
```json
{
  "structure_id": 1,
  "basic_salary": 50000,
  "total_earnings": 75000,
  "total_deductions": 8500,
  "net_salary": 66500,
  "effective_from": "2026-04-01",
  "revision_reason": "Annual revision",
  "components": [
    { "component_id": 1, "component_value": 50000 },
    { "component_id": 2, "component_value": 20000 }
  ]
}
```

### Payroll Runs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/runs` | List (month, status filter) |
| GET | `/runs/:id` | Get run details |
| POST | `/runs` | Create run |
| PUT | `/runs/:id` | Update run |
| POST | `/runs/:id/process` | Process run |

### Payslips

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/payslips` | List (run, employee, month, status) |
| GET | `/payslips/:id` | Get payslip |
| POST | `/payslips` | Create payslip |
| PUT | `/payslips/:id` | Update payslip |

### Tax & Statutory

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/tax/calculate` | Calculate tax for income |
| GET | `/config/pf` | Get PF configuration |
| GET | `/config/esi` | Get ESI configuration |

### Bonus Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bonus` | List (employee, month, status) |
| POST | `/bonus` | Create bonus |
| PUT | `/bonus/:id` | Update bonus |

**Tax Configuration (FY 2024-25 New Regime):**
| Slab | Min | Max | Rate |
|------|-----|-----|------|
| 1 | 0 | 3,00,000 | 0% |
| 2 | 3,00,000 | 7,00,000 | 5% |
| 3 | 7,00,000 | 10,00,000 | 10% |
| 4 | 10,00,000 | 12,00,000 | 15% |
| 5 | 12,00,000 | 15,00,000 | 20% |
| 6 | 15,00,000 | ∞ | 30% |

---

## Onboarding Module

**Base Path:** `/api/v1/onboarding`

### Onboarding Records

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List (status, employee filter) |
| GET | `/:id` | Get by ID |
| GET | `/employee/:id` | Get by employee ID |
| POST | `/` | Create (auto-generates checklist progress) |
| PUT | `/:id` | Update |

**Create Payload:**
```json
{
  "employee_id": 1,
  "template_id": 1,
  "joining_date": "2026-05-15"
}
```

### Checklist Progress

| Method | Endpoint | Description |
|--------|----------|-------------|
| PATCH | `/:onboardingId/checklist/:itemId` | Update item status |

**Update Payload:**
```json
{
  "status": "completed",
  "remarks": "Document verified",
  "attachment_path": "/uploads/doc.pdf"
}
```

### Probation Tracking

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/probation/:employeeId` | Get tracking |
| POST | `/probation/:employeeId` | Create tracking |
| PATCH | `/probation/:employeeId` | Update status |

**Create Probation Payload:**
```json
{
  "probation_start_date": "2026-05-15",
  "probation_end_date": "2026-11-15"
}
```

**Update Probation Payload:**
```json
{
  "status": "confirmed",
  "performance_rating": 4.5,
  "manager_feedback": "Excellent performance",
  "confirmation_date": "2026-11-15"
}
```

---

## Master Data Module

**Base Path:** `/api/v1/master`

### Companies

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/companies` | List (status filter, includes unit count) |
| GET | `/companies/:id` | Get by ID |
| POST | `/companies` | Create |
| PUT | `/companies/:id` | Update |

**Create Payload:**
```json
{
  "company_name": "Acme Corp",
  "company_code": "ACME",
  "registration_number": "U12345MH2020PLC123456",
  "tax_id": "27AABCU9603R1ZM",
  "address": "123 Business Park",
  "city": "Mumbai",
  "state": "Maharashtra",
  "country": "India",
  "phone": "+91-22-12345678",
  "email": "info@acme.com",
  "is_headquarters": true
}
```

### Business Units

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/business-units` | List (company, status filter) |
| GET | `/business-units/:id` | Get by ID |
| POST | `/business-units` | Create |
| PUT | `/business-units/:id` | Update |

**Create Payload:**
```json
{
  "unit_name": "Software Engineering",
  "unit_code": "SWE",
  "company_id": 1,
  "parent_unit_id": null,
  "head_of_unit": 1,
  "cost_center": "CC-001"
}
```

### Grades

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/grades` | List (band, status filter) |
| GET | `/grades/:id` | Get by ID |
| POST | `/grades` | Create |
| PUT | `/grades/:id` | Update |

**Create Payload:**
```json
{
  "grade_code": "L5",
  "grade_name": "Senior Engineer",
  "level": 5,
  "min_salary": 800000,
  "max_salary": 1500000,
  "band": "Professional"
}
```

### Checklist Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/checklist-templates` | List (active filter) |
| GET | `/checklist-templates/:id` | Get with items |
| POST | `/checklist-templates` | Create |
| PUT | `/checklist-templates/:id` | Update |

### Checklist Items

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/templates/:templateId/items` | Get items for template |
| POST | `/checklist-items` | Create item |
| PUT | `/checklist-items/:id` | Update item |

---

## Database Schema Summary

### New Tables (27 total)

| # | Table | Module | Rows (seed) |
|---|-------|--------|-------------|
| 1 | `companies` | Master Data | - |
| 2 | `business_units` | Master Data | - |
| 3 | `grades_master` | Master Data | - |
| 4 | `shifts` | Attendance | 5 |
| 5 | `holiday_calendar` | Attendance | - |
| 6 | `attendance_records` | Attendance | - |
| 7 | `leave_types` | Attendance | 7 |
| 8 | `leave_balances` | Attendance | - |
| 9 | `leave_requests` | Attendance | - |
| 10 | `timesheets` | Attendance | - |
| 11 | `salary_components` | Payroll | 13 |
| 12 | `salary_structures` | Payroll | - |
| 13 | `salary_structure_components` | Payroll | - |
| 14 | `employee_salary_details` | Payroll (SCD2) | - |
| 15 | `employee_salary_components` | Payroll | - |
| 16 | `payroll_runs` | Payroll | - |
| 17 | `payslips` | Payroll | - |
| 18 | `payslip_components` | Payroll | - |
| 19 | `tax_configurations` | Payroll | 6 |
| 20 | `pf_configurations` | Payroll | 1 |
| 21 | `esi_configurations` | Payroll | 1 |
| 22 | `bonus_records` | Payroll | - |
| 23 | `onboarding_checklist_templates` | Onboarding | 3 |
| 24 | `checklist_items` | Onboarding | 10 |
| 25 | `employee_onboarding` | Onboarding | - |
| 26 | `employee_checklist_progress` | Onboarding | - |
| 27 | `probation_tracking` | Onboarding | - |

### New Views
- `v_employee_leave_balance` - Employee leave balances with available calculation
- `v_current_employee_salary` - Current salary for all employees
- `v_onboarding_progress` - Onboarding progress with percentage

---

## Data Relationships

```
companies (1) ──→ (N) business_units
business_units (1) ──→ (N) departments (via business_unit_id)
business_units (1) ──→ (N) designations_master (via business_unit_id)

grades_master (1) ──→ (N) salary_structures
companies (1) ──→ (N) salary_structures
business_units (1) ──→ (N) salary_structures

salary_structures (1) ──→ (N) salary_structure_components
salary_components (1) ──→ (N) salary_structure_components

employees (1) ──→ (N) employee_salary_details (SCD Type 2)
employee_salary_details (1) ──→ (N) employee_salary_components

payroll_runs (1) ──→ (N) payslips
payslips (1) ──→ (N) payslip_components

employees (1) ──→ (N) attendance_records (unique per day)
shifts (1) ──→ (N) attendance_records
locations_master (1) ──→ (N) holiday_calendar

employees (1) ──→ (N) leave_balances
leave_types (1) ──→ (N) leave_balances
employees (1) ──→ (N) leave_requests

employees (1) ──→ (N) timesheets

onboarding_checklist_templates (1) ──→ (N) checklist_items
employees (1) ──→ (1) employee_onboarding
employee_onboarding (1) ──→ (N) employee_checklist_progress
employees (1) ──→ (N) probation_tracking
```
