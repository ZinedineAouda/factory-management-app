# 📚 API Documentation

**Status:** BETA - Production  
**Base URL:** `https://your-backend.up.railway.app/api`  
**Last Updated:** $(date)

---

## 🔐 Authentication

All endpoints (except `/auth/login` and `/auth/register`) require authentication via JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## 📋 Endpoints

### Authentication (`/api/auth`)

#### POST `/api/auth/login`
Login with username/email and password.

**Request:**
```json
{
  "username": "admin",
  "password": "admin1234"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "username": "admin",
    "email": "admin@factory.com",
    "role": "admin",
    "permissions": { ... },
    ...
  },
  "token": "jwt-token-here"
}
```

---

#### POST `/api/auth/register`
Register new user (requires registration code).

**Request:**
```json
{
  "username": "newuser",
  "password": "password123",
  "registrationCode": "REG-CODE-123"
}
```

**Response:**
```json
{
  "message": "Registration successful. Your account is pending approval.",
  "user": { ... }
}
```

---

#### GET `/api/auth/me`
Get current authenticated user data.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "id": "...",
  "username": "admin",
  "role": "admin",
  "permissions": { ... },
  ...
}
```

---

#### GET `/api/auth/check-username/:username`
Check if username is available.

**Response:**
```json
{
  "available": true
}
```

---

#### GET `/api/auth/users`
Get all active users (Admin only, or with `canViewUsers` permission).

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "...",
    "username": "user1",
    "role": "worker",
    "departmentName": "Production",
    ...
  }
]
```

---

#### GET `/api/auth/users/pending`
Get all pending users (Admin only).

**Headers:** `Authorization: Bearer <token>`

---

#### POST `/api/auth/users/:id/approve`
Approve pending user (Admin only).

**Request:**
```json
{
  "role": "worker",
  "departmentId": "dept-id",
  "groupId": "group-id" // optional
}
```

---

#### PUT `/api/auth/users/:id/username`
Update user username (Admin only).

**Request:**
```json
{
  "newUsername": "newusername",
  "password": "admin-password"
}
```

---

#### PUT `/api/auth/users/:id/password`
Update user password (Admin only).

**Request:**
```json
{
  "newPassword": "newpassword",
  "password": "admin-password"
}
```

---

#### DELETE `/api/auth/users/:id`
Delete user (Admin only).

---

### Departments (`/api/departments`)

#### GET `/api/departments`
Get all departments.

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
[
  {
    "id": "...",
    "name": "Production",
    "description": "...",
    "createdAt": "..."
  }
]
```

---

#### POST `/api/departments`
Create department (Admin only, or with `canEditDepartments` permission).

**Request:**
```json
{
  "name": "New Department",
  "description": "Description"
}
```

---

#### PUT `/api/departments/:id`
Update department (Admin only).

---

#### DELETE `/api/departments/:id`
Delete department (Admin only).

---

### Groups (`/api/groups`)

#### GET `/api/groups`
Get all groups (Admin only, or with `canViewGroups` permission).

**Headers:** `Authorization: Bearer <token>`

---

#### POST `/api/groups`
Create group (Admin only).

**Request:**
```json
{
  "name": "Group Name",
  "description": "Description",
  "startTime": "08:00",
  "endTime": "16:00"
}
```

---

#### PUT `/api/groups/:id`
Update group (Admin only).

---

#### DELETE `/api/groups/:id`
Delete group (Admin only).

---

### Products (`/api/products`)

#### GET `/api/products`
Get all products (Admin or Production workers with `canViewProducts`).

**Headers:** `Authorization: Bearer <token>`

---

#### POST `/api/products`
Create product (Admin only, or with `canEditProducts` permission).

**Request:** Multipart form data
- `name`: string
- `description`: string
- `image`: file (optional)

---

#### PUT `/api/products/:id`
Update product (Admin only).

---

#### DELETE `/api/products/:id`
Delete product (Admin only).

---

### Tasks (`/api/tasks`)

#### GET `/api/tasks`
Get tasks (filtered by user permissions and `maxDataReach`).

**Headers:** `Authorization: Bearer <token>`

**Query Params:**
- `status`: filter by status
- `priority`: filter by priority
- `departmentId`: filter by department

---

#### GET `/api/tasks/:id`
Get task details.

---

#### POST `/api/tasks`
Create task (Admin or with `canEditTasks` permission).

**Request:**
```json
{
  "title": "Task Title",
  "description": "Description",
  "priority": "high",
  "assignedTo": "user-id",
  "departmentId": "dept-id"
}
```

---

#### PUT `/api/tasks/:id`
Update task (Admin or assigned user).

---

#### DELETE `/api/tasks/:id`
Delete task (Admin only).

---

#### PUT `/api/tasks/:id/progress`
Update task progress.

**Request:**
```json
{
  "status": "in_progress",
  "progress": 50
}
```

---

### Maintenance Tasks (`/api/maintenance-tasks`)

#### GET `/api/maintenance-tasks`
Get maintenance tasks (Leaders or Maintenance workers).

---

#### POST `/api/maintenance-tasks`
Create maintenance task (Leaders or with `canEditTasks`).

---

#### GET `/api/maintenance-tasks/:id`
Get maintenance task details.

---

#### PUT `/api/maintenance-tasks/:id`
Update maintenance task.

---

### Reports (`/api/reports`)

#### GET `/api/reports`
Get reports (filtered by permissions).

---

#### POST `/api/reports`
Create report (Operators or with `canEditReports` permission).

**Request:**
```json
{
  "taskId": "task-id",
  "content": "Report content",
  "images": ["base64-image-data"]
}
```

---

### Analytics (`/api/analytics`)

#### GET `/api/analytics/production`
Get production analytics (Admin or Production workers).

---

#### GET `/api/analytics/maintenance`
Get maintenance analytics (Admin or Maintenance workers).

---

#### GET `/api/analytics/personal`
Get personal analytics (all users).

---

#### GET `/api/analytics/kpis`
Get KPI metrics (Admin only).

---

#### POST `/api/analytics/refresh`
Refresh analytics cache (Admin only).

---

### Role Permissions (`/api/role-permissions`)

#### GET `/api/role-permissions`
Get all role permissions (Admin only).

---

#### GET `/api/role-permissions/:role`
Get permissions for specific role (Admin only).

---

#### POST `/api/role-permissions`
Create new role (Admin only).

**Request:**
```json
{
  "role": "new_role",
  "role_display_name": "New Role",
  "can_view_users": true,
  "can_edit_users": false,
  ...
  "max_data_reach": "department"
}
```

---

#### PUT `/api/role-permissions/:role`
Update role permissions (Admin only).

---

#### DELETE `/api/role-permissions/:role`
Delete role (Admin only, cannot delete admin role).

---

### Registration Codes (`/api/admin/registration-codes`)

#### GET `/api/admin/registration-codes`
Get all registration codes (Admin only).

---

#### POST `/api/admin/registration-codes/generate`
Generate new registration code (Admin only).

**Request:**
```json
{
  "role": "worker",
  "expiresAt": "2024-12-31"
}
```

---

#### DELETE `/api/admin/registration-codes/:id`
Delete registration code (Admin only).

---

### Notifications (`/api/notifications`)

#### GET `/api/notifications`
Get user notifications.

---

#### GET `/api/notifications/unread-count`
Get unread notification count.

---

#### PUT `/api/notifications/:id/read`
Mark notification as read.

---

#### PUT `/api/notifications/read-all`
Mark all notifications as read.

---

### Activity Log (`/api/activity-log`)

#### GET `/api/activity-log`
Get activity log (Admin only).

---

#### DELETE `/api/activity-log`
Clear activity log (Admin only).

---

### Settings (`/api/settings`)

#### GET `/api/settings/preferences`
Get user preferences.

---

#### PUT `/api/settings/preferences`
Update user preferences.

---

#### PUT `/api/settings/password`
Change password.

---

#### PUT `/api/settings/username`
Change username.

---

### Profiles (`/api/profiles`)

#### GET `/api/profiles/:id`
Get user profile.

---

#### PUT `/api/profiles/:id`
Update user profile.

**Request:** Multipart form data
- `bio`: string
- `photo`: file (optional)

---

## 🔒 Permission Requirements

Most endpoints check permissions based on:
- User role (admin bypasses all checks)
- `canView*` permissions for GET requests
- `canEdit*` permissions for POST/PUT/DELETE requests
- `maxDataReach` for data filtering

---

## 📝 Error Responses

All errors follow this format:

```json
{
  "error": "Error message here"
}
```

**Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

---

**Last Updated:** $(date)  
**For Questions:** See `AUDIT_REPORT.md` or `README.md`

