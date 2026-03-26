import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../models/productModel.js';

export const getProducts = async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener productos', error: error.message });
  }
};

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

export const createProductHandler = async (req, res) => {
  const { nombre, descripcion, costo, precio, stock } = req.body;

  if (!nombre || stock === undefined) {
    return res.status(400).json({ message: 'nombre y stock son obligatorios' });
  }

  try {
    const productId = await createProduct(nombre, descripcion, costo, precio, stock);
    res.status(201).json({ message: 'Producto creado', productId });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear producto', error: error.message });
  }
};

export const updateProductHandler = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  try {
    const affected = await updateProduct(req.params.id, req.body);
    if (!affected) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar producto', error: error.message });
  }
};

export const deleteProductHandler = async (req, res) => {
  try {
    const affected = await deleteProduct(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto', error: error.message });
  }
};