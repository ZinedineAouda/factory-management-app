# Factory Management System

**Status:** 🟡 BETA - Production  
**Version:** 1.0.0

A comprehensive factory management application with web dashboard and mobile app support. Manage workers, tasks, products, departments, and track production analytics in real-time.

## 🎯 Key Features

- **Unified Interface:** Single UI system that adapts based on user role and permissions
- **Role-Based Access Control (RBAC):** Admin controls what each role can see and edit
- **Department-Based Data Access:** Users only see data from their department
- **User Approval System:** New registrations require admin approval
- **Real-Time Analytics:** Production metrics and analytics dashboard
- **Task Management:** Assign and track tasks across departments
- **Product Management:** Inventory and delivery tracking

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** (for cloning the repository)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repository-url>
   cd factory-management-app
   ```

2. **Install all dependencies**
   ```bash
   npm install
   ```

3. **Build the shared package** (required for web and mobile)
   ```bash
   npm run build:shared
   ```

4. **Start the backend server**
   ```bash
   npm run dev:backend
   ```
   The backend will run on `http://localhost:3000`

5. **Start the web application** (in a new terminal)
   ```bash
   npm run dev:web
   ```
   The web app will run on `http://localhost:3001`

### Default Admin Account

- **Username:** `admin`
- **Password:** `admin1234`

⚠️ **Important:** Change the password immediately after first login!

## 📁 Project Structure

```
factory-management-app/
├── backend/                 # Backend API (Node.js + Express + SQLite)
│   ├── src/                # TypeScript source files
│   │   ├── database/       # Database setup and migrations
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Authentication middleware
│   │   ├── services/       # Business logic services
│   │   └── jobs/          # Scheduled jobs (analytics, monitoring)
│   ├── scripts/           # Utility scripts
│   └── uploads/           # User-uploaded files (products, profiles)
│
├── packages/
│   ├── web/               # React web application
│   │   ├── src/
│   │   │   ├── components/  # Reusable UI components
│   │   │   ├── pages/       # Page components
│   │   │   ├── routes/      # Routing configuration
│   │   │   ├── store/       # Redux state management
│   │   │   ├── theme/       # Material-UI theme
│   │   │   └── api/         # API client configuration
│   │   └── public/          # Static assets
│   │
│   ├── mobile/            # React Native mobile app
│   │   └── src/
│   │       ├── screens/    # Mobile screens
│   │       ├── navigation/  # Navigation setup
│   │       └── store/       # Redux state
│   │
│   └── shared/            # Shared code between web and mobile
│       └── src/
│           ├── types/      # TypeScript type definitions
│           ├── api/        # API client and endpoints
│           └── constants/  # Shared constants
```

## 🛠️ Technology Stack

### Frontend (Web)
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Material-UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Vite** - Build tool
- **Recharts** - Data visualization

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **TypeScript** - Type safety
- **SQLite3** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads

### Mobile
- **React Native** - Mobile framework
- **TypeScript** - Type safety
- **Redux Toolkit** - State management

## 📝 Available Scripts

### Root Level
- `npm install` - Install all dependencies
- `npm run dev:backend` - Start backend server
- `npm run dev:web` - Start web application
- `npm run build:shared` - Build shared package
- `npm run build:web` - Build web app for production
- `npm run build:all` - Build all packages

### Backend (`cd backend`)
- `npm run dev` - Start development server
- `npm run dev:clean` - Kill port 3000 and start server
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run kill-port` - Free port 3000

### Web (`cd packages/web`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## 🔧 Environment Variables

### ⚠️ Production Environment Variables (REQUIRED)

**See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for complete guide.**

#### Frontend (Vercel) - REQUIRED
```env
VITE_API_URL=https://your-backend.up.railway.app/api
```

#### Backend (Railway) - REQUIRED
```env
FRONTEND_URL=https://your-frontend.vercel.app
JWT_SECRET=your-secret-key-min-32-chars
NODE_ENV=production
RAILWAY_VOLUME_PATH=/data  # For database persistence
```

### Local Development (Optional)

#### Backend
Create `backend/.env`:
```env
PORT=3000
JWT_SECRET=your-secret-key-here
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

#### Web
Create `packages/web/.env`:
```env
VITE_API_URL=http://localhost:3000/api
```

## 🏗️ Building for Production

1. **Build shared package**
   ```bash
   npm run build:shared
   ```

2. **Build backend**
   ```bash
   cd backend
   npm run build
   ```

3. **Build web application**
   ```bash
   npm run build:web
   ```

4. **Start production server**
   ```bash
   cd backend
   npm start
   ```

The built web files will be in `packages/web/dist/` - serve these with any static file server.

## 🚀 Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for step-by-step hosting instructions using FREE platforms (Vercel + Railway/Render).

**⚠️ IMPORTANT:** After deployment, ensure all environment variables are set correctly:
- Frontend: `VITE_API_URL` in Vercel
- Backend: `FRONTEND_URL`, `JWT_SECRET`, `RAILWAY_VOLUME_PATH` in Railway

See [ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md) for details.

## 📚 Features

### Admin Features
- User management (create, edit, assign roles)
- Department and group management
- Task creation and assignment
- Product management with image uploads
- Reports and analytics dashboard
- Role-based access control
- Registration code generation
- Real-time activity monitoring

### Worker Features
- View assigned tasks
- Update task progress
- View department statistics
- Product delivery tracking
- Profile management

### Operator Features
- Create and manage reports
- Task management
- Dashboard overview

### Leader Features
- Maintenance task management
- Task creation and assignment
- Team oversight

## 🔐 Security

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Protected API routes
- Input validation

## 📖 Documentation

- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Step-by-step hosting guide (FREE)
- **[ENVIRONMENT_VARIABLES.md](./ENVIRONMENT_VARIABLES.md)** - Environment variables guide ⚠️ **IMPORTANT**
- **[AUDIT_REPORT.md](./AUDIT_REPORT.md)** - Comprehensive system audit
- **[CRITICAL_FIXES_APPLIED.md](./CRITICAL_FIXES_APPLIED.md)** - Recent critical fixes
- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Quick 5-minute start guide
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture details
- **[CHANGELOG.md](./CHANGELOG.md)** - Version history

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
cd backend
npm run kill-port
npm run dev
```

### Build Errors
1. Make sure shared package is built: `npm run build:shared`
2. Clear node_modules and reinstall: `rm -rf node_modules && npm install`
3. Check Node.js version: `node --version` (should be 18+)

### Database Issues
The database is automatically created on first run. If you need to reset:
1. Stop the server
2. Delete `backend/factory_management.db`
3. Restart the server (database will be recreated)

## 📄 License

[Your License Here]

## 👥 Contributing

[Your Contributing Guidelines Here]

## 📞 Support

[Your Support Contact Information Here]
