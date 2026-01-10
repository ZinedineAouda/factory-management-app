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

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
const defaultOrigins = [
  'http://localhost:3001',
  'https://factory-management-app-web.vercel.app'
];

const allowedOrigins = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : defaultOrigins;

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

