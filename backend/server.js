import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './src/routes/authRoutes.js';

const app = express();

app.use(cors());
app.use(json());

app.use('/api/auth', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});