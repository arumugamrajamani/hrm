# Frontend Integration Guide - Education and Course Master Module

A comprehensive guide for frontend developers to integrate with the Education and Course Master APIs.

## 📋 Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Education APIs](#education-apis)
4. [Course APIs](#course-apis)
5. [Mapping APIs](#mapping-apis)
6. [Data Models](#data-models)
7. [Integration Examples](#integration-examples)
8. [Common Use Cases](#common-use-cases)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

---

## 🌐 API Overview

### Base Configuration
```javascript
const API_BASE_URL = 'http://localhost:3000/api';
const AUTH_TOKEN_KEY = 'hrm_auth_token';
```

### Endpoints Summary

| Category | Operations | Base Path |
|----------|------------|-----------|
| Education | CRUD, Activate/Deactivate, Get Courses | `/api/education` |
| Course | CRUD, Activate/Deactivate, Get Educations | `/api/courses` |
| Mapping | Create, Delete, Get All | `/api/education-course` |

---

## 🔐 Authentication

### Required Headers
```javascript
const getAuthHeaders = () => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};
```

### Login Flow
```javascript
// POST /api/auth/login
const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.success) {
    localStorage.setItem(AUTH_TOKEN_KEY, data.data.accessToken);
    return data.data;
  }
  
  throw new Error(data.message);
};
```

---

## 📚 Education APIs

### 1. Get All Educations

**Endpoint:** `GET /api/education`

**Query Parameters:**
```javascript
const params = {
  page: 1,        // Page number (default: 1)
  limit: 10,      // Items per page (default: 10, max: 100)
  search: '',     // Search by name, code, or description
  level: '',      // Filter by level: 'School', 'UG', 'PG', 'Doctorate', 'Certification'
  status: ''      // Filter by status: 'active', 'inactive'
};
```

**Example Request:**
```javascript
const getEducations = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: filters.search || '',
    level: filters.level || '',
    status: filters.status || ''
  }).toString();

  const response = await fetch(`${API_BASE_URL}/education?${queryParams}`, {
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

**Example Response:**
```json
{
  "success": true,
  "message": "Educations retrieved successfully",
  "data": [
    {
      "id": 1,
      "education_name": "Bachelor of Engineering",
      "education_code": "BE",
      "level": "UG",
      "description": "Undergraduate engineering degree program",
      "status": "active",
      "created_by": 1,
      "created_at": "2026-03-29T10:00:00.000Z",
      "created_by_username": "superadmin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 2. Get Education by ID

**Endpoint:** `GET /api/education/:id`

**Example Request:**
```javascript
const getEducationById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/education/${id}`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};
```

**Example Response:**
```json
{
  "success": true,
  "message": "Education retrieved successfully",
  "data": {
    "id": 1,
    "education_name": "Bachelor of Engineering",
    "education_code": "BE",
    "level": "UG",
    "description": "Undergraduate engineering degree program",
    "status": "active",
    "created_by": 1,
    "updated_by": null,
    "created_at": "2026-03-29T10:00:00.000Z",
    "updated_at": "2026-03-29T10:00:00.000Z",
    "created_by_username": "superadmin",
    "updated_by_username": null
  }
}
```

---

### 3. Create Education (Admin Only)

**Endpoint:** `POST /api/education`

**Request Body:**
```javascript
const educationData = {
  education_name: "Master of Technology",
  education_code: "MTECH",
  level: "PG",
  description: "Postgraduate technology degree program",
  status: "active"  // optional, default: "active"
};
```

**Example Request:**
```javascript
const createEducation = async (educationData) => {
  const response = await fetch(`${API_BASE_URL}/education`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(educationData)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};
```

**Validation Rules:**
- `education_name`: Required, 2-100 characters, unique
- `education_code`: Required, 2-20 characters, uppercase, unique
- `level`: Required, one of: 'School', 'UG', 'PG', 'Doctorate', 'Certification'
- `description`: Optional, max 1000 characters

**Example Error Response:**
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

---

### 4. Update Education (Admin Only)

**Endpoint:** `PUT /api/education/:id`

**Example Request:**
```javascript
const updateEducation = async (id, updateData) => {
  const response = await fetch(`${API_BASE_URL}/education/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};

// Usage
updateEducation(1, {
  education_name: "Bachelor of Technology",
  level: "UG"
});
```

---

### 5. Delete Education (Soft Delete - Admin Only)

**Endpoint:** `DELETE /api/education/:id`

**Note:** Soft delete sets status to 'inactive', not permanent deletion.

```javascript
const deleteEducation = async (id) => {
  const response = await fetch(`${API_BASE_URL}/education/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data;
};
```

---

### 6. Activate/Deactivate Education (Admin Only)

**Endpoint:** 
- `PATCH /api/education/:id/activate`
- `PATCH /api/education/:id/deactivate`

```javascript
const activateEducation = async (id) => {
  const response = await fetch(`${API_BASE_URL}/education/${id}/activate`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  
  return await response.json();
};

const deactivateEducation = async (id) => {
  const response = await fetch(`${API_BASE_URL}/education/${id}/deactivate`, {
    method: 'PATCH',
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

---

### 7. Get Courses by Education

**Endpoint:** `GET /api/education/:id/courses`

```javascript
const getCoursesByEducation = async (educationId) => {
  const response = await fetch(`${API_BASE_URL}/education/${educationId}/courses`, {
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};
```

**Example Response:**
```json
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
        "id": 1,
        "course_id": 1,
        "course_name": "Computer Science",
        "course_code": "CSE",
        "course_description": "Computer Science and Engineering",
        "course_status": "active",
        "created_at": "2026-03-29T10:00:00.000Z"
      },
      {
        "id": 2,
        "course_id": 2,
        "course_name": "Electronics",
        "course_code": "ECE",
        "course_description": "Electronics and Communication Engineering",
        "course_status": "active",
        "created_at": "2026-03-29T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 🎓 Course APIs

### 1. Get All Courses

**Endpoint:** `GET /api/courses`

**Query Parameters:**
```javascript
const params = {
  page: 1,        // Page number
  limit: 10,      // Items per page (max 100)
  search: '',     // Search by name, code, or description
  status: ''      // Filter by status: 'active', 'inactive'
};
```

```javascript
const getCourses = async (filters = {}) => {
  const queryParams = new URLSearchParams({
    page: filters.page || 1,
    limit: filters.limit || 10,
    search: filters.search || '',
    status: filters.status || ''
  }).toString();

  const response = await fetch(`${API_BASE_URL}/courses?${queryParams}`, {
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

**Example Response:**
```json
{
  "success": true,
  "message": "Courses retrieved successfully",
  "data": [
    {
      "id": 1,
      "course_name": "Computer Science",
      "course_code": "CSE",
      "description": "Computer Science and Engineering",
      "status": "active",
      "created_by": 1,
      "created_at": "2026-03-29T10:00:00.000Z",
      "created_by_username": "superadmin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### 2. Get Course by ID

**Endpoint:** `GET /api/courses/:id`

```javascript
const getCourseById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

---

### 3. Create Course (Admin Only)

**Endpoint:** `POST /api/courses`

**Request Body:**
```javascript
const courseData = {
  course_name: "Data Science",
  course_code: "DS",
  description: "Data Science and Machine Learning",
  status: "active"  // optional
};
```

```javascript
const createCourse = async (courseData) => {
  const response = await fetch(`${API_BASE_URL}/courses`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(courseData)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};
```

**Validation Rules:**
- `course_name`: Required, 2-100 characters, unique
- `course_code`: Required, 2-20 characters, uppercase, unique
- `description`: Optional, max 1000 characters

---

### 4. Update Course (Admin Only)

**Endpoint:** `PUT /api/courses/:id`

```javascript
const updateCourse = async (id, updateData) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(updateData)
  });
  
  return await response.json();
};
```

---

### 5. Delete Course (Soft Delete - Admin Only)

**Endpoint:** `DELETE /api/courses/:id`

```javascript
const deleteCourse = async (id) => {
  const response = await fetch(`${API_BASE_URL}/courses/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

---

### 6. Get Educations by Course

**Endpoint:** `GET /api/courses/:id/educations`

```javascript
const getEducationsByCourse = async (courseId) => {
  const response = await fetch(`${API_BASE_URL}/courses/${courseId}/educations`, {
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

**Example Response:**
```json
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
        "id": 1,
        "education_id": 1,
        "education_name": "Bachelor of Engineering",
        "education_code": "BE",
        "level": "UG",
        "education_description": "Undergraduate engineering program",
        "education_status": "active",
        "created_at": "2026-03-29T10:00:00.000Z"
      },
      {
        "id": 5,
        "education_id": 3,
        "education_name": "Bachelor of Science",
        "education_code": "BSC",
        "level": "UG",
        "education_description": "Undergraduate science program",
        "education_status": "active",
        "created_at": "2026-03-29T10:00:00.000Z"
      }
    ]
  }
}
```

---

## 🔗 Mapping APIs

### 1. Get All Mappings

**Endpoint:** `GET /api/education-course`

```javascript
const getAllMappings = async () => {
  const response = await fetch(`${API_BASE_URL}/education-course`, {
    headers: getAuthHeaders()
  });
  
  return await response.json();
};
```

**Example Response:**
```json
{
  "success": true,
  "message": "Mappings retrieved successfully",
  "data": [
    {
      "id": 1,
      "education_id": 1,
      "course_id": 1,
      "education_name": "Bachelor of Engineering",
      "education_code": "BE",
      "course_name": "Computer Science",
      "course_code": "CSE",
      "created_by": 1,
      "created_at": "2026-03-29T10:00:00.000Z",
      "created_by_username": "superadmin"
    }
  ]
}
```

---

### 2. Create Mapping (Admin Only)

**Endpoint:** `POST /api/education-course`

**Request Body:**
```javascript
const mappingData = {
  education_id: 1,
  course_id: 3
};
```

```javascript
const createMapping = async (mappingData) => {
  const response = await fetch(`${API_BASE_URL}/education-course`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(mappingData)
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data.data;
};
```

**Validation:**
- Both `education_id` and `course_id` must exist
- Mapping must be unique (same education-course combination)
- Prevents duplicate mappings

---

### 3. Delete Mapping (Admin Only)

**Endpoint:** `DELETE /api/education-course/:id`

```javascript
const deleteMapping = async (mappingId) => {
  const response = await fetch(`${API_BASE_URL}/education-course/${mappingId}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  
  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.message);
  }
  
  return data;
};
```

---

## 📊 Data Models

### Education
```typescript
interface Education {
  id: number;
  education_name: string;
  education_code: string;
  level: 'School' | 'UG' | 'PG' | 'Doctorate' | 'Certification';
  description?: string;
  status: 'active' | 'inactive';
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  created_by_username?: string;
  updated_by_username?: string;
}
```

### Course
```typescript
interface Course {
  id: number;
  course_name: string;
  course_code: string;
  description?: string;
  status: 'active' | 'inactive';
  created_by: number;
  updated_by?: number;
  created_at: string;
  updated_at: string;
  created_by_username?: string;
  updated_by_username?: string;
}
```

### Education-Course Mapping
```typescript
interface EducationCourseMap {
  id: number;
  education_id: number;
  course_id: number;
  education_name: string;
  education_code: string;
  course_name: string;
  course_code: string;
  created_by: number;
  created_at: string;
  created_by_username?: string;
}
```

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{
    field: string;
    message: string;
  }>;
}

interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

---

## 💻 Integration Examples

### React Integration Example

```jsx
import React, { useState, useEffect } from 'react';

const EducationManagement = () => {
  const [educations, setEducations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0 });

  const fetchEducations = async (filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `${API_BASE_URL}/education?${new URLSearchParams(filters)}`,
        { headers: getAuthHeaders() }
      );
      
      const data = await response.json();
      
      if (data.success) {
        setEducations(data.data);
        setPagination(data.pagination);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to fetch educations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducations({ page: 1, limit: 10 });
  }, []);

  return (
    <div>
      {loading && <div>Loading...</div>}
      {error && <div className="error">{error}</div>}
      {educations.map(edu => (
        <div key={edu.id}>{edu.education_name}</div>
      ))}
    </div>
  );
};
```

---

### Vue.js Integration Example

```javascript
// educationService.js
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

const educationService = {
  async getAll(filters) {
    const response = await axios.get(`${API_URL}/education`, {
      params: filters,
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async create(data) {
    const response = await axios.post(`${API_URL}/education`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async update(id, data) {
    const response = await axios.put(`${API_URL}/education/${id}`, data, {
      headers: getAuthHeaders()
    });
    return response.data;
  },

  async delete(id) {
    const response = await axios.delete(`${API_URL}/education/${id}`, {
      headers: getAuthHeaders()
    });
    return response.data;
  }
};

export default educationService;
```

```vue
<!-- EducationList.vue -->
<template>
  <div>
    <h1>Education List</h1>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <ul v-else>
      <li v-for="edu in educations" :key="edu.id">
        {{ edu.education_name }} ({{ edu.education_code }})
      </li>
    </ul>
  </div>
</template>

<script>
import educationService from '@/services/educationService';

export default {
  data() {
    return {
      educations: [],
      loading: false,
      error: null
    };
  },
  
  async mounted() {
    await this.loadEducations();
  },
  
  methods: {
    async loadEducations() {
      this.loading = true;
      this.error = null;
      
      try {
        const response = await educationService.getAll({ page: 1, limit: 10 });
        
        if (response.success) {
          this.educations = response.data;
        } else {
          this.error = response.message;
        }
      } catch (err) {
        this.error = 'Failed to load educations';
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

### Angular Integration Example

```typescript
// education.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EducationService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('hrm_auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  getAll(filters: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/education`, {
      params: filters,
      headers: this.getHeaders()
    });
  }

  create(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/education`, data, {
      headers: this.getHeaders()
    });
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/education/${id}`, data, {
      headers: this.getHeaders()
    });
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/education/${id}`, {
      headers: this.getHeaders()
    });
  }
}
```

```typescript
// education-list.component.ts
import { Component, OnInit } from '@angular/core';
import { EducationService } from './education.service';

@Component({
  selector: 'app-education-list',
  templateUrl: './education-list.component.html'
})
export class EducationListComponent implements OnInit {
  educations: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(private educationService: EducationService) {}

  ngOnInit(): void {
    this.loadEducations();
  }

  loadEducations(): void {
    this.loading = true;
    this.error = null;

    this.educationService.getAll({ page: 1, limit: 10 })
      .subscribe({
        next: (response) => {
          if (response.success) {
            this.educations = response.data;
          } else {
            this.error = response.message;
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load educations';
          this.loading = false;
        }
      });
  }
}
```

---

## 🎯 Common Use Cases

### 1. Education Dropdown with Courses

```javascript
const EducationCourseSelector = () => {
  const [selectedEducation, setSelectedEducation] = useState(null);
  const [availableCourses, setAvailableCourses] = useState([]);

  const handleEducationChange = async (educationId) => {
    setSelectedEducation(educationId);
    
    const response = await getCoursesByEducation(educationId);
    setAvailableCourses(response.data.courses);
  };

  return (
    <div>
      <select onChange={(e) => handleEducationChange(e.target.value)}>
        <option value="">Select Education</option>
        {educations.map(edu => (
          <option key={edu.id} value={edu.id}>
            {edu.education_name}
          </option>
        ))}
      </select>

      <select>
        <option value="">Select Course</option>
        {availableCourses.map(course => (
          <option key={course.course_id} value={course.course_id}>
            {course.course_name}
          </option>
        ))}
      </select>
    </div>
  );
};
```

---

### 2. Course Selection with Educations

```javascript
const CourseEducationSelector = () => {
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [availableEducations, setAvailableEducations] = useState([]);

  const handleCourseChange = async (courseId) => {
    setSelectedCourse(courseId);
    
    const response = await getEducationsByCourse(courseId);
    setAvailableEducations(response.data.educations);
  };

  return (
    <div>
      <select onChange={(e) => handleCourseChange(e.target.value)}>
        <option value="">Select Course</option>
        {courses.map(course => (
          <option key={course.id} value={course.id}>
            {course.course_name}
          </option>
        ))}
      </select>

      <div>
        <h3>Available for {selectedCourse}:</h3>
        <ul>
          {availableEducations.map(edu => (
            <li key={edu.education_id}>
              {edu.education_name} ({edu.education_code}) - {edu.level}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

---

### 3. Admin Education Management Dashboard

```javascript
const EducationAdminDashboard = () => {
  const [educations, setEducations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const loadEducations = async () => {
    const response = await getEducations({ page: 1, limit: 20 });
    setEducations(response.data);
  };

  const handleCreate = async (formData) => {
    try {
      await createEducation(formData);
      await loadEducations();
      setShowModal(false);
      showNotification('Education created successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleUpdate = async (id, formData) => {
    try {
      await updateEducation(id, formData);
      await loadEducations();
      setShowModal(false);
      setEditingId(null);
      showNotification('Education updated successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this education?')) {
      return;
    }
    
    try {
      await deleteEducation(id);
      await loadEducations();
      showNotification('Education deleted successfully', 'success');
    } catch (err) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="header">
        <h1>Education Management</h1>
        <button onClick={() => setShowModal(true)}>
          Add New Education
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Code</th>
            <th>Level</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {educations.map(edu => (
            <tr key={edu.id}>
              <td>{edu.education_name}</td>
              <td>{edu.education_code}</td>
              <td>{edu.level}</td>
              <td>
                <span className={`status ${edu.status}`}>
                  {edu.status}
                </span>
              </td>
              <td>
                <button onClick={() => {
                  setEditingId(edu.id);
                  setShowModal(true);
                }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(edu.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {showModal && (
        <EducationModal
          educationId={editingId}
          onClose={() => {
            setShowModal(false);
            setEditingId(null);
          }}
          onSubmit={editingId ? handleUpdate : handleCreate}
        />
      )}
    </div>
  );
};
```

---

## ⚠️ Error Handling

### Standard Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "field_name",
      "message": "Field specific error message"
    }
  ]
}
```

### Error Handling Wrapper

```javascript
const handleApiError = (error, fallbackMessage = 'An error occurred') => {
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        if (data.errors) {
          const fieldErrors = data.errors.map(e => `${e.field}: ${e.message}`);
          return fieldErrors.join('\n');
        }
        return data.message || 'Validation error';
      
      case 401:
        // Redirect to login
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = '/login';
        return 'Session expired. Please login again.';
      
      case 403:
        return 'You do not have permission to perform this action';
      
      case 404:
        return data.message || 'Resource not found';
      
      case 409:
        return data.message || 'Conflict: resource already exists';
      
      case 500:
        return 'Server error. Please try again later.';
      
      default:
        return data.message || fallbackMessage;
    }
  }
  
  return error.message || fallbackMessage;
};

// Usage
try {
  await createEducation(data);
} catch (err) {
  showNotification(handleApiError(err), 'error');
}
```

---

## ✅ Best Practices

### 1. Centralize API Configuration

```javascript
// apiConfig.js
const API_CONFIG = {
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryAttempts: 3
};

export default API_CONFIG;
```

### 2. Use Interceptors for Authentication

```javascript
// Add auth token to all requests
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

### 3. Implement Caching

```javascript
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const fetchWithCache = async (url, options) => {
  const cached = cache.get(url);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  const response = await fetch(url, options);
  const data = await response.json();
  
  cache.set(url, {
    data,
    timestamp: Date.now()
  });
  
  return data;
};
```

### 4. Debounce Search Requests

```javascript
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const debouncedSearch = debounce((searchTerm) => {
  fetchEducations({ search: searchTerm, page: 1 });
}, 300);
```

### 5. Form Validation (Frontend)

```javascript
const validateEducationForm = (data) => {
  const errors = [];

  if (!data.education_name || data.education_name.length < 2) {
    errors.push('Education name must be at least 2 characters');
  }

  if (!data.education_code || data.education_code.length < 2) {
    errors.push('Education code must be at least 2 characters');
  }

  if (!data.level) {
    errors.push('Level is required');
  }

  const validLevels = ['School', 'UG', 'PG', 'Doctorate', 'Certification'];
  if (data.level && !validLevels.includes(data.level)) {
    errors.push('Invalid education level');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};
```

### 6. Loading and Error States

```javascript
const EducationList = () => {
  const [state, setState] = useState({
    loading: false,
    error: null,
    data: []
  });

  const loadData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetchEducations();
      setState({
        loading: false,
        error: null,
        data: response.data
      });
    } catch (err) {
      setState({
        loading: false,
        error: err.message,
        data: []
      });
    }
  };

  return (
    <div>
      {state.loading && <Spinner />}
      {state.error && <ErrorMessage message={state.error} onRetry={loadData} />}
      {!state.loading && !state.error && (
        <EducationTable data={state.data} />
      )}
    </div>
  );
};
```

---

## 🔧 Utility Functions

### Build Query String

```javascript
const buildQueryString = (params) => {
  const cleanParams = Object.entries(params)
    .filter(([key, value]) => value !== '' && value !== null && value !== undefined)
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {});
  
  return new URLSearchParams(cleanParams).toString();
};

// Usage
const queryString = buildQueryString({
  page: 1,
  limit: 10,
  search: 'Engineering',
  level: 'UG',
  status: ''
});

// Result: "page=1&limit=10&search=Engineering&level=UG"
```

### Format API Response

```javascript
const formatApiResponse = (response) => {
  if (response.success) {
    return {
      success: true,
      data: response.data,
      message: response.message
    };
  }
  
  return {
    success: false,
    error: response.message,
    errors: response.errors || [],
    statusCode: response.status
  };
};
```

### Role-Based Access Control

```javascript
const checkAdminRole = () => {
  const userRole = localStorage.getItem('user_role');
  return userRole === 'Super Admin' || userRole === 'Admin';
};

const EducationForm = ({ onSubmit }) => {
  const isAdmin = checkAdminRole();

  return (
    <form onSubmit={onSubmit}>
      <input name="education_name" />
      {isAdmin && (
        <>
          <input name="education_code" />
          <select name="level" />
        </>
      )}
      <button type="submit">Submit</button>
    </form>
  );
};
```

---

## 📱 Responsive Design Tips

### Mobile-Friendly Tables

```css
/* Stack table columns on mobile */
@media (max-width: 768px) {
  .education-table {
    display: block;
    overflow-x: auto;
  }
  
  .education-table thead {
    display: none; /* Hide header on mobile */
  }
  
  .education-table tbody {
    display: block;
  }
  
  .education-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .education-table td {
    display: block;
    text-align: right;
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
  }
  
  .education-table td::before {
    content: attr(data-label);
    float: left;
    font-weight: bold;
  }
}
```

```html
<table class="education-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Code</th>
      <th>Level</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td data-label="Name">Bachelor of Engineering</td>
      <td data-label="Code">BE</td>
      <td data-label="Level">UG</td>
    </tr>
  </tbody>
</table>
```

---

## 🚀 Performance Optimization

### 1. Virtual Scrolling for Large Lists

```javascript
import { FixedSizeList } from 'react-window';

const VirtualizedEducationList = ({ educations }) => {
  return (
    <FixedSizeList
      height={400}
      itemCount={educations.length}
      itemSize={50}
      width="100%"
    >
      {({ index, style }) => (
        <div style={style}>
          {educations[index].education_name}
        </div>
      )}
    </FixedSizeList>
  );
};
```

### 2. Lazy Loading

```javascript
const EducationDetails = ({ educationId }) => {
  const [details, setDetails] = useState(null);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    loadEducationDetails();
  }, [educationId]);

  const loadEducationDetails = async () => {
    // Load basic details immediately
    const basicDetails = await getEducationById(educationId);
    setDetails(basicDetails);

    // Load courses lazily
    const coursesData = await getCoursesByEducation(educationId);
    setCourses(coursesData.data.courses);
  };

  return (
    <div>
      <EducationCard education={details} />
      <Suspense fallback={<div>Loading courses...</div>}>
        <CourseList courses={courses} />
      </Suspense>
    </div>
  );
};
```

---

## 🧪 Testing Your Integration

### Test Scenarios

1. **Authentication Tests**
   - ✅ Valid credentials return token
   - ✅ Invalid credentials return error
   - ✅ Expired token redirects to login
   - ✅ Missing token returns 401

2. **CRUD Operations**
   - ✅ Create education with valid data
   - ✅ Create education with invalid data shows errors
   - ✅ Update education successfully
   - ✅ Delete education (soft delete)
   - ✅ Duplicate education name/code returns 409

3. **Search and Filter**
   - ✅ Search by name returns matching results
   - ✅ Filter by level works correctly
   - ✅ Filter by status works correctly
   - ✅ Pagination works correctly

4. **Relationship Queries**
   - ✅ Get courses by education returns correct courses
   - ✅ Get educations by course returns correct educations
   - ✅ Mapping creation prevents duplicates

5. **Authorization**
   - ✅ Non-admin cannot create/update/delete
   - ✅ Admin can perform all operations
   - ✅ Proper error messages for unauthorized access

---

## 📞 Support & Resources

- **API Documentation:** http://localhost:3000/api-docs
- **Backend Repository:** [HRM Backend](link)
- **Issue Tracker:** [GitHub Issues](link)
- **Email Support:** support@yourcompany.com

---

## 🔄 Changelog

- **v1.0.0** (2026-03-30)
  - Initial release
  - Education CRUD operations
  - Course CRUD operations
  - Education-Course mapping
  - Search and filtering
  - Pagination support

---

**Last Updated:** March 30, 2026
**Version:** 1.0.0
