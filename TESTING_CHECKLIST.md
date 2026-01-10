# 🧪 Comprehensive Testing Checklist

**Status:** BETA - Production  
**Last Updated:** $(date)

---

## 📋 Testing Overview

This checklist covers all features, permissions, and edge cases that need to be tested before considering the system production-ready.

---

## 🔐 Authentication & User Management

### Registration Flow
- [ ] **Test 1.1:** Register new user with valid registration code
  - [ ] Username validation (min 3 chars, unique)
  - [ ] Password validation (min 6 chars)
  - [ ] Password confirmation match
  - [ ] Registration code validation
  - [ ] Success message shows "pending approval"
  - [ ] User cannot login until approved

- [ ] **Test 1.2:** Registration edge cases
  - [ ] Duplicate username rejected
  - [ ] Invalid registration code rejected
  - [ ] Used registration code rejected
  - [ ] Expired registration code rejected
  - [ ] Weak password rejected
  - [ ] Password mismatch detected

- [ ] **Test 1.3:** Username availability check
  - [ ] Real-time check works (debounced)
  - [ ] Shows "available" for new username
  - [ ] Shows "taken" for existing username
  - [ ] Check happens before form submission

### Login Flow
- [ ] **Test 2.1:** Successful login
  - [ ] Login with username works
  - [ ] Login with email works (backward compatibility)
  - [ ] Correct password accepted
  - [ ] Token stored in localStorage
  - [ ] User data loaded with permissions
  - [ ] Redirect to correct dashboard based on role

- [ ] **Test 2.2:** Login failures
  - [ ] Wrong password shows error
  - [ ] Error persists after page refresh
  - [ ] Non-existent user shows error
  - [ ] Pending user cannot login
  - [ ] Inactive user cannot login

- [ ] **Test 2.3:** Session management
  - [ ] Token persists across page refresh
  - [ ] Token validates with backend on load
  - [ ] Invalid token clears session
  - [ ] Expired token clears session
  - [ ] Logout clears token and user data

### User Approval (Admin)
- [ ] **Test 3.1:** Approve pending user
  - [ ] Pending users appear in "Pending Approval" tab
  - [ ] Pending users NOT in "All Users" tab
  - [ ] Approve dialog opens correctly
  - [ ] Role selection works
  - [ ] Department selection works
  - [ ] Group selection works (optional)
  - [ ] Approval succeeds
  - [ ] User appears in "All Users" after approval
  - [ ] User can login after approval
  - [ ] Notification sent to approved user

- [ ] **Test 3.2:** User management
  - [ ] Edit username works
  - [ ] Edit password works
  - [ ] Delete user works
  - [ ] User statistics display correctly
  - [ ] Filter by role works
  - [ ] Filter by department works
  - [ ] Search by username works
  - [ ] Search by email works

---

## 🔒 Role-Based Access Control (RBAC)

### Permission System
- [ ] **Test 4.1:** View permissions
  - [ ] User without `canViewUsers` cannot see Users page
  - [ ] User without `canViewDepartments` cannot see Departments page
  - [ ] User without `canViewProducts` cannot see Products page
  - [ ] User without `canViewReports` cannot see Reports page
  - [ ] User without `canViewAnalytics` cannot see Analytics page
  - [ ] User without `canViewTasks` cannot see Tasks page
  - [ ] Sidebar hides items user cannot view
  - [ ] Direct URL access blocked (redirects)

- [ ] **Test 4.2:** Edit permissions
  - [ ] User without `canEditUsers` cannot edit users
  - [ ] User without `canEditDepartments` cannot edit departments
  - [ ] User without `canEditProducts` cannot edit products
  - [ ] User without `canEditReports` cannot edit reports
  - [ ] User without `canEditTasks` cannot edit tasks
  - [ ] Edit buttons hidden when no permission
  - [ ] API calls rejected with 403

- [ ] **Test 4.3:** Role Management (Admin only)
  - [ ] Only admin can access Role Management page
  - [ ] Create new role works
  - [ ] Edit role permissions works
  - [ ] Save button works
  - [ ] Changes apply immediately
  - [ ] Cannot delete admin role
  - [ ] Role display name updates correctly

- [ ] **Test 4.4:** Permission changes take effect
  - [ ] Revoke view permission → user loses access immediately
  - [ ] Grant view permission → user gains access immediately
  - [ ] Revoke edit permission → edit buttons disappear
  - [ ] Grant edit permission → edit buttons appear

### Max Data Reach
- [ ] **Test 5.1:** Own data only
  - [ ] User sees only their own tasks
  - [ ] User sees only their own reports
  - [ ] User cannot see other users' data

- [ ] **Test 5.2:** Department data
  - [ ] User sees all tasks in their department
  - [ ] User sees all reports in their department
  - [ ] User cannot see other departments' data

- [ ] **Test 5.3:** Group data
  - [ ] User sees all tasks in their group
  - [ ] User sees all reports in their group
  - [ ] User cannot see other groups' data

- [ ] **Test 5.4:** All data (Admin)
  - [ ] Admin sees all data regardless of department
  - [ ] Admin sees all users
  - [ ] Admin sees all tasks
  - [ ] Admin sees all reports

---

## 🏢 Department Restrictions

- [ ] **Test 6.1:** Department-based visibility
  - [ ] Production user sees only production data
  - [ ] Maintenance user sees only maintenance data
  - [ ] User without department sees limited data
  - [ ] Admin sees all departments

- [ ] **Test 6.2:** Department-based features
  - [ ] Production user sees Products page
  - [ ] Maintenance user sees Maintenance Tasks
  - [ ] Features hidden for wrong department
  - [ ] Dashboard adapts to department

---

## 📊 Pages & Features

### Admin Dashboard
- [ ] **Test 7.1:** Dashboard loads correctly
  - [ ] Stats cards display correct numbers
  - [ ] Charts render correctly
  - [ ] Weekly activity chart shows data
  - [ ] Department distribution chart shows data
  - [ ] Activity log displays recent activities
  - [ ] Quick actions work
  - [ ] Data updates after actions

### User Management
- [ ] **Test 7.2:** User list functionality
  - [ ] All users tab shows active users only
  - [ ] Pending Approval tab shows pending users only
  - [ ] Role tabs (Operators, Leaders, Admins) filter correctly
  - [ ] Search works (username, email, department)
  - [ ] Filters work (role, department, status)
  - [ ] Filters only apply when explicitly set
  - [ ] Clear filters shows all users
  - [ ] Pagination works (if implemented)

### Departments Management
- [ ] **Test 7.3:** Department CRUD
  - [ ] Create department works
  - [ ] Edit department works
  - [ ] Delete department works
  - [ ] Cannot delete department with users
  - [ ] Department list displays correctly
  - [ ] Department assignment works

### Groups & Shifts
- [ ] **Test 7.4:** Groups management
  - [ ] Create group works
  - [ ] Edit group works
  - [ ] Delete group works
  - [ ] Group assignment to users works
  - [ ] Shift times display correctly

### Products Management
- [ ] **Test 7.5:** Products CRUD
  - [ ] Create product works
  - [ ] Upload product image works
  - [ ] Edit product works
  - [ ] Delete product works
  - [ ] Product list displays correctly
  - [ ] Product images load correctly (production URL)
  - [ ] Product details page works

### Tasks Management
- [ ] **Test 7.6:** Task CRUD
  - [ ] Create task works
  - [ ] Assign task to user works
  - [ ] Update task status works
  - [ ] Add task update/comment works
  - [ ] Delete task works
  - [ ] Task list filters correctly
  - [ ] Task detail page displays correctly

### Reports
- [ ] **Test 7.7:** Reports functionality
  - [ ] Create report works
  - [ ] Link report to delivery drop works
  - [ ] Reports list displays correctly
  - [ ] Filter reports by department works
  - [ ] Report details display correctly

### Analytics
- [ ] **Test 7.8:** Analytics updates
  - [ ] Analytics page loads
  - [ ] Charts display data
  - [ ] Data updates after new task created
  - [ ] Data updates after new report created
  - [ ] Data updates after product delivery
  - [ ] Refresh button works
  - [ ] Caching doesn't delay updates too long

---

## 🔄 Data Flow & Real-Time Updates

- [ ] **Test 8.1:** Data persistence
  - [ ] Create user → persists after refresh
  - [ ] Create task → persists after refresh
  - [ ] Create product → persists after refresh
  - [ ] Edit data → persists after refresh
  - [ ] Delete data → persists after refresh

- [ ] **Test 8.2:** Analytics updates
  - [ ] Create task → analytics update
  - [ ] Complete task → analytics update
  - [ ] Create report → analytics update
  - [ ] Product delivery → analytics update
  - [ ] Updates appear without page refresh

- [ ] **Test 8.3:** Notifications
  - [ ] New user registration → admin notified
  - [ ] User approved → user notified
  - [ ] Task assigned → user notified
  - [ ] Notification badge shows count
  - [ ] Mark as read works
  - [ ] Mark all as read works

---

## 🌐 Production Environment

### API Configuration
- [ ] **Test 9.1:** Production URLs
  - [ ] No localhost references in console
  - [ ] API calls go to correct backend URL
  - [ ] CORS errors resolved
  - [ ] All API endpoints accessible
  - [ ] Error messages clear and helpful

### Database Persistence
- [ ] **Test 9.2:** Data survives deployment
  - [ ] Create test data
  - [ ] Redeploy backend
  - [ ] Verify data still exists
  - [ ] Database path correct in logs
  - [ ] Railway volume mounted correctly

### Environment Variables
- [ ] **Test 9.3:** Required variables set
  - [ ] `VITE_API_URL` set in Vercel
  - [ ] `FRONTEND_URL` set in Railway
  - [ ] `JWT_SECRET` set in Railway
  - [ ] `RAILWAY_VOLUME_PATH` set in Railway
  - [ ] `NODE_ENV=production` set

---

## 🐛 Edge Cases & Error Handling

- [ ] **Test 10.1:** Network errors
  - [ ] Offline mode handled gracefully
  - [ ] API timeout handled
  - [ ] 500 errors display message
  - [ ] 404 errors handled
  - [ ] 403 errors show permission message

- [ ] **Test 10.2:** Invalid data
  - [ ] Empty fields rejected
  - [ ] Invalid formats rejected
  - [ ] SQL injection attempts blocked
  - [ ] XSS attempts blocked
  - [ ] File upload size limits enforced

- [ ] **Test 10.3:** Concurrent operations
  - [ ] Multiple users can work simultaneously
  - [ ] No data conflicts
  - [ ] Database locks work correctly

---

## 📱 Mobile Responsiveness

- [ ] **Test 11.1:** Mobile UI
  - [ ] Sidebar collapses on mobile
  - [ ] Tables scroll horizontally
  - [ ] Forms usable on mobile
  - [ ] Buttons accessible
  - [ ] Text readable
  - [ ] Navigation works

---

## 🔍 Security

- [ ] **Test 12.1:** Authentication security
  - [ ] Passwords hashed (not plaintext)
  - [ ] JWT tokens expire correctly
  - [ ] Token validation on every request
  - [ ] Logout invalidates token

- [ ] **Test 12.2:** Authorization security
  - [ ] Cannot access admin pages without admin role
  - [ ] Cannot edit without edit permission
  - [ ] Cannot view without view permission
  - [ ] API endpoints enforce permissions

- [ ] **Test 12.3:** Data security
  - [ ] Users cannot see other users' passwords
  - [ ] Sensitive data not exposed in responses
  - [ ] File uploads validated
  - [ ] SQL injection prevented

---

## 📝 Test Results Template

For each test, document:
- **Test ID:** (e.g., 1.1)
- **Test Name:** (e.g., Register new user)
- **Status:** ✅ Pass / ❌ Fail / ⚠️ Partial
- **Notes:** (Any issues found)
- **Screenshots:** (If applicable)
- **Date:** (When tested)
- **Tester:** (Who tested)

---

## 🎯 Priority Testing Order

1. **Critical Path (Must Test First):**
   - Authentication (Login/Register)
   - User Approval
   - Permission System
   - Production URLs

2. **High Priority:**
   - All CRUD operations
   - Permission enforcement
   - Department restrictions
   - Data persistence

3. **Medium Priority:**
   - Analytics updates
   - Notifications
   - Mobile responsiveness

4. **Low Priority:**
   - Edge cases
   - Error handling
   - Performance

---

**Last Updated:** $(date)  
**Next Review:** After deployment

