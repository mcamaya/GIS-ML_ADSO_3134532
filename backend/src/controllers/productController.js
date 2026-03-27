import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../models/productModel.js';
import { registrarLog } from '../services/logService.js';

/**
 * Controlador para obtener todos los productos.
 * Responde con la lista de productos en formato JSON.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
export const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

/**
 * Controlador para obtener un único producto por su ID.
 * Responde con el producto o con un error 404 si no se encuentra.
 * @param {Object} req - Objeto de petición Express (debe contener req.params.id).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const getProduct = async (req, res) => {
  try {
    const product = await getProductById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener producto', error: error.message });
  }
};

/**
 * Controlador para crear un nuevo producto.
 * Valida que 'nombre' y 'stock' estén presentes en el cuerpo de la petición.
 * @param {Object} req - Objeto de petición Express (contiene los datos del producto en req.body).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const createProductHandler = async (req, res) => {
  const { nombre, descripcion, costo, precio, stock } = req.body;

  if (!nombre || stock === undefined) {
    return res.status(400).json({ message: 'nombre y stock son obligatorios' });
  }

  try {
    const productId = await createProduct(nombre, descripcion, costo, precio, stock);
    await registrarLog(req.user.userId, `Producto creado: ID ${productId} - ${nombre}`);
    res.status(201).json({ message: 'Producto creado', productId });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

/**
 * Controlador para actualizar un producto existente por su ID.
 * Valida que se envíen campos para actualizar en el cuerpo de la petición.
 * @param {Object} req - Objeto de petición Express (contiene id en req.params y datos en req.body).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const updateProductHandler = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  try {
    const affected = await updateProduct(req.params.id, req.body);
    if (!affected) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    await registrarLog(req.user.userId, `Producto actualizado: ID ${req.params.id}`);
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

/**
 * Controlador para eliminar un producto existente por su ID.
 * @param {Object} req - Objeto de petición Express (contiene req.params.id).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const deleteProductHandler = async (req, res) => {
  try {
    const affected = await deleteProduct(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    await registrarLog(req.user.userId, `Producto eliminado: ID ${req.params.id}`);
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
};