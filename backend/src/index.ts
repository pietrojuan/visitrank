import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import routes from './routes/index';

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use('/api', routes);
app.get('/health', (_, res) => res.json({ ok: true }));
app.use((_req, res) => res.status(404).json({ erro: 'Rota não encontrada' }));

app.listen(PORT, () => console.log(`🏠 VisitRank API rodando em http://localhost:${PORT}`));
