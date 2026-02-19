import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import dashboardRouter from './routes/dashboard';
import uploadRouter from './routes/upload';
import adminRouter from './routes/admin';
import { seedIfEmpty } from './storage/store';

dotenv.config({ path: path.resolve(__dirname, '..', '..', '.env') });

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Seed default data if needed
seedIfEmpty();

// Routes
app.use('/api/dashboard', dashboardRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/admin', adminRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const tabsBuild = path.join(__dirname, '..', '..', 'tabs', 'build');
  app.use(express.static(tabsBuild));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(tabsBuild, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ORHA Dashboard API running on http://localhost:${PORT}`);
});

export default app;
