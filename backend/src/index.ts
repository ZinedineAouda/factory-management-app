import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { initDatabase, clearAllUsers } from './database/db';
import authRoutes from './routes/auth';
import departmentsRoutes from './routes/departments';
import tasksRoutes from './routes/tasks';
import registrationCodesRoutes from './routes/registration-codes';
import profilesRoutes from './routes/profiles';
import groupsRoutes from './routes/groups';
import reportsRoutes from './routes/reports';
import notificationsRoutes from './routes/notifications';
import productsRoutes from './routes/products';
import productDeliveriesRoutes from './routes/product-deliveries';
import maintenanceTasksRoutes from './routes/maintenance-tasks';
import analyticsRoutes from './routes/analytics';
import shiftsRoutes from './routes/shifts';
import rolePermissionsRoutes from './routes/role-permissions';
import settingsRoutes from './routes/settings';
import activityLogRoutes from './routes/activity-log';
import { startAnalyticsScheduler } from './jobs/analyticsJob';
import { startDeliveryDropMonitoring } from './jobs/deliveryDropJob';

dotenv.config();

// Environment variable validation
const validateEnvironment = () => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required in production
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.FRONTEND_URL) {
      errors.push('❌ FRONTEND_URL is required in production');
    }
    if (!process.env.JWT_SECRET) {
      errors.push('❌ JWT_SECRET is required in production');
    }
    if (!process.env.RAILWAY_VOLUME_PATH && !process.env.DATABASE_PATH) {
      warnings.push('⚠️  RAILWAY_VOLUME_PATH or DATABASE_PATH not set - database may not persist');
    }
  }

  // Warnings for missing optional vars
  if (!process.env.JWT_SECRET) {
    warnings.push('⚠️  JWT_SECRET not set - using default (INSECURE)');
  }
  if (!process.env.FRONTEND_URL && process.env.NODE_ENV !== 'development') {
    warnings.push('⚠️  FRONTEND_URL not set - CORS may fail');
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('\n⚠️  Environment Variable Warnings:');
    warnings.forEach(w => console.warn(`   ${w}`));
  }

  // Log errors and exit if critical
  if (errors.length > 0) {
    console.error('\n❌ Critical Environment Variable Errors:');
    errors.forEach(e => console.error(`   ${e}`));
    console.error('\n💡 Please set the required environment variables and restart.');
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }

  // Success message
  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ Environment variables validated');
  }
};

// Validate environment on startup
validateEnvironment();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - CORS configuration
// IMPORTANT: Use FRONTEND_URL environment variable in production
// Format: FRONTEND_URL=https://your-frontend.vercel.app,https://another-domain.com
const getAllowedOrigins = (): string[] => {
  if (process.env.FRONTEND_URL) {
    const origins = process.env.FRONTEND_URL.split(',').map(url => url.trim());
    console.log('🌐 CORS: Using FRONTEND_URL environment variable:', origins);
    return origins;
  }
  
  // Development defaults
  if (process.env.NODE_ENV === 'development') {
    const devOrigins = ['http://localhost:3001', 'http://localhost:5173'];
    console.log('🔧 CORS: Development mode - allowing:', devOrigins);
    return devOrigins;
  }
  
  // Production fallback - log warning
  console.warn('⚠️  WARNING: FRONTEND_URL not set in production!');
  console.warn('⚠️  CORS may fail. Set FRONTEND_URL environment variable.');
  console.warn('⚠️  Example: FRONTEND_URL=https://your-app.vercel.app');
  
  // Return empty array to be strict (will fail CORS but be obvious)
  return [];
};

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// Request logging middleware (after body parsing)
app.use((req, res, next) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`\n[${new Date().toISOString()}] ${req.method} ${req.path}`);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    console.log('Headers:', JSON.stringify(req.headers, null, 2));
  }
  next();
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('=== GLOBAL ERROR HANDLER ===');
  console.error('Error:', err);
  console.error('Request:', req.method, req.path);
  console.error('Body:', req.body);
  
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database
initDatabase().then(() => {
  // Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/departments', departmentsRoutes);
  app.use('/api/tasks', tasksRoutes);
  app.use('/api/admin/registration-codes', registrationCodesRoutes);
  app.use('/api/profiles', profilesRoutes);
  app.use('/api/groups', groupsRoutes);
  app.use('/api/reports', reportsRoutes);
  app.use('/api/notifications', notificationsRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/product-deliveries', productDeliveriesRoutes);
  app.use('/api/maintenance-tasks', maintenanceTasksRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/shifts', shiftsRoutes);
  app.use('/api/role-permissions', rolePermissionsRoutes);
  app.use('/api/settings', settingsRoutes);
  app.use('/api/activity-log', activityLogRoutes);
  
  // Serve uploaded files
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Factory Management API is running' });
  });

  // Clear all users endpoint (Admin only - for development/testing)
  // NOTE: Admin accounts are ALWAYS preserved
  app.post('/api/admin/clear-all-users', async (req, res) => {
    try {
      await clearAllUsers();
      res.json({ 
        message: 'All non-admin users have been cleared from the database. Admin accounts have been preserved.',
        note: 'Admin accounts are never deleted for safety.'
      });
    } catch (error: any) {
      console.error('Error clearing users:', error);
      res.status(500).json({ error: 'Failed to clear users', details: error.message });
    }
  });

  // Root route - helpful message
  app.get('/', (req, res) => {
    res.json({ 
      message: 'Factory Management API',
      note: 'This is the backend API. Frontend is available at http://localhost:3001',
      endpoints: {
        health: '/api/health',
        auth: '/api/auth',
        tasks: '/api/tasks',
        departments: '/api/departments',
      }
    });
  });

  // Start analytics scheduler
  startAnalyticsScheduler();
  
  // Start delivery drop monitoring
  startDeliveryDropMonitoring();

  // Start server with port conflict handling
  const server = app.listen(PORT, () => {
    console.log(`\n🚀 Backend Server running on http://localhost:${PORT}`);
    console.log(`📝 API available at http://localhost:${PORT}/api`);
    console.log(`🌐 Frontend should run on http://localhost:3001\n`);
  });

  server.on('error', (err: any) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n❌ Port ${PORT} is already in use!`);
      console.error(`💡 Run "npm run kill-port" from the backend directory to free the port.`);
      console.error(`💡 Or run "npm run dev:clean" to automatically kill the port and start the server.\n`);
      process.exit(1);
    } else {
      throw err;
    }
  });
}).catch((error) => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});

