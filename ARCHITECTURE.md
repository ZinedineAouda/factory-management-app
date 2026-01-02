# Architecture Overview

## System Architecture

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Web Client    │         │  Mobile Client   │         │   Admin Panel    │
│  (React + Vite) │         │  (React Native)  │         │   (Web App)     │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   Backend API       │
                          │  (Express + TS)     │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │   SQLite Database   │
                          │  (factory_management.db)│
                          └─────────────────────┘
```

## Technology Stack

### Frontend (Web)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **UI Library**: Material-UI (MUI)
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Charts**: Recharts

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: SQLite3
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: Bcrypt
- **File Uploads**: Multer

### Mobile
- **Framework**: React Native
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation

## Database Schema

### Core Tables
- `users` - User accounts and authentication
- `departments` - Factory departments
- `groups` - Worker groups within departments
- `tasks` - Task assignments
- `products` - Product catalog
- `reports` - Operator reports
- `notifications` - User notifications
- `role_permissions` - Role-based access control
- `activity_log` - System activity tracking

## API Structure

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Resources
- `/api/users` - User management
- `/api/departments` - Department management
- `/api/tasks` - Task management
- `/api/products` - Product management
- `/api/reports` - Report management
- `/api/notifications` - Notification system
- `/api/analytics` - Analytics and statistics

## Security

### Authentication Flow
1. User submits credentials
2. Backend validates and generates JWT token
3. Token stored in localStorage (web) or secure storage (mobile)
4. Token included in Authorization header for subsequent requests
5. Middleware validates token on protected routes

### Role-Based Access Control
- **Admin**: Full system access
- **Operator**: Report creation and task management
- **Leader**: Maintenance task management
- **Worker**: Task viewing and updates only

## File Structure

```
backend/
├── src/
│   ├── database/      # Database setup and migrations
│   ├── routes/        # API route handlers
│   ├── middleware/    # Auth and validation middleware
│   ├── services/      # Business logic
│   └── jobs/         # Scheduled background jobs
└── scripts/          # Utility scripts

packages/
├── web/              # React web application
│   └── src/
│       ├── components/  # Reusable components
│       ├── pages/       # Page components
│       ├── store/       # Redux store
│       └── routes/      # Routing
├── mobile/          # React Native app
└── shared/          # Shared types and utilities
```

## Deployment Architecture

### Production Setup
- **Frontend**: Vercel (static hosting)
- **Backend**: Railway/Render (Node.js hosting)
- **Database**: SQLite (file-based, included with backend)

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `JWT_SECRET` - Secret key for JWT tokens
- `FRONTEND_URL` - Allowed frontend origins (CORS)

## Data Flow

1. **User Action** → Frontend component
2. **API Call** → Axios request to backend
3. **Authentication** → JWT token validation
4. **Business Logic** → Route handler processes request
5. **Database** → SQLite query/update
6. **Response** → JSON data returned to frontend
7. **State Update** → Redux store updated
8. **UI Update** → Component re-renders

## Performance Considerations

- **Frontend**: Code splitting with Vite
- **Backend**: Efficient SQLite queries with indexes
- **Caching**: Analytics data cached for 1 hour
- **File Uploads**: Limited to 10MB per file
- **Database**: Automatic WAL mode for better concurrency

