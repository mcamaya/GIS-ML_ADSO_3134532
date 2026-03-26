import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getKits,
  getKit,
  createKitHandler,
  updateKitHandler,
  addProductToKitHandler,
  removeProductFromKitHandler,
  deleteKitHandler,
} from '../controllers/kitController.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getKits);
router.get('/:id', getKit);
router.post('/', createKitHandler);
router.patch('/:id', updateKitHandler);
router.post('/:id/productos', addProductToKitHandler);
router.delete('/:id/productos/:productoId', removeProductFromKitHandler);
router.delete('/:id', deleteKitHandler);

export default router;