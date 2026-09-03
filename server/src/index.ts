import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import transactionRoutes from './routes/transactions';
import categoryRoutes from './routes/categories';
import investmentRoutes from './routes/investments';
import emergencyFundRoutes from './routes/emergencyFund';
import { prisma } from './prisma';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS setup: allow all origins in dev, or specific origin
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/investments', investmentRoutes);
app.use('/api/emergency-fund', emergencyFundRoutes);

// Health Check
app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: 'connected', timestamp: new Date().toISOString() });
  } catch (err: any) {
    res.status(500).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Production: serve static build of React app
const distPath = path.resolve(__dirname, '../../dist');
app.use(express.static(distPath));

// Fallback to React index.html for SPA routing in production
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    res.status(404).json({ error: 'Rota da API não encontrada.' });
    return;
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send('PlaniFlow API Server running. (Frontend dist not built yet).');
    }
  });
});

const server = app.listen(PORT, () => {
  console.log(`🚀 PlaniFlow Backend Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing HTTP server and database connection...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing HTTP server and database connection...');
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
});
