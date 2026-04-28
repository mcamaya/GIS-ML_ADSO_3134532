import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getMLAuthUrl,
  handleMLCallback,
  getMLStatus,
  getPublicaciones,
  getPublicacion,
  importPublicacion,
  createPublicacionManual,
  updatePublicacionHandler,
  deletePublicacionHandler,
  getEstadosHandler,
  syncStock,
  syncPrecio,
  syncEstado,
} from '../controllers/mlController.js';

const router = Router();

router.use(authMiddleware);

// ── OAuth ──────────────────────────────────────────────
router.get('/auth/url',      getMLAuthUrl);       // GET  /api/ml/auth/url
router.get('/auth/callback', handleMLCallback);   // GET  /api/ml/auth/callback?code=...
router.get('/auth/status',   getMLStatus);        // GET  /api/ml/auth/status

// ── Publicaciones ──────────────────────────────────────
router.get('/publicaciones',              getPublicaciones);          // GET    /api/ml/publicaciones
router.get('/publicaciones/estados',      getEstadosHandler);         // GET    /api/ml/publicaciones/estados
router.get('/publicaciones/:id',          getPublicacion);            // GET    /api/ml/publicaciones/:id
router.post('/publicaciones/importar',    importPublicacion);         // POST   /api/ml/publicaciones/importar
router.post('/publicaciones',             createPublicacionManual);   // POST   /api/ml/publicaciones
router.patch('/publicaciones/:id',        updatePublicacionHandler);  // PATCH  /api/ml/publicaciones/:id
router.delete('/publicaciones/:id',       deletePublicacionHandler);  // DELETE /api/ml/publicaciones/:id

// ── Sincronización ─────────────────────────────────────
router.post('/publicaciones/:id/sync/stock',  syncStock);   // POST /api/ml/publicaciones/:id/sync/stock
router.post('/publicaciones/:id/sync/precio', syncPrecio);  // POST /api/ml/publicaciones/:id/sync/precio
router.post('/publicaciones/:id/sync/estado', syncEstado);  // POST /api/ml/publicaciones/:id/sync/estado

export default router;