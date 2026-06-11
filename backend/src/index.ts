import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes/index';

const app  = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim());
app.use(cors({ origin: (origin, cb) => { if (!origin || allowedOrigins.some(o => origin.startsWith(o))) cb(null, true); else cb(new Error('CORS')); }, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', routes);
app.get('/health', (_, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

app.listen(PORT, () => console.log(`🏠 VisitRank API rodando em http://localhost:${PORT}`));
