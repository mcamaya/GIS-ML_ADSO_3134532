import express, { json } from 'express';
import cors from 'cors';
import 'dotenv/config';

import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import kitRoutes from './src/routes/kitRoutes.js';
import mlRoutes from './src/routes/mlRoutes.js';

const app = express();

app.use(cors());
app.use(json());

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/kits', kitRoutes);
app.use('/api/ml', mlRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});