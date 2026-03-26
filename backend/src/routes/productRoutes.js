import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getProducts,
  getProduct,
  createProductHandler,
  updateProductHandler,
  deleteProductHandler,
} from '../controllers/productController.js';

const router = Router();

router.use(authMiddleware); // Todos los endpoints requieren token

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', createProductHandler);
router.patch('/:id', updateProductHandler);
router.delete('/:id', deleteProductHandler);

export default router;