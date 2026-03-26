import {
  getAllKits,
  getKitById,
  getKitProducts,
  createKit,
  addProductToKit,
  recalculateKitStock,
  updateKit,
  removeProductFromKit,
  deleteKit,
} from '../models/kitModel.js';

/**
 * Controlador para obtener todos los kits.
 * Responde con la lista de kits en formato JSON.
 * @param {Object} req - Objeto de petición Express.
 * @param {Object} res - Objeto de respuesta Express.
 */
export const getKits = async (req, res) => {
  try {
    const kits = await getAllKits();
    res.json(kits);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener kits', error: error.message });
  }
};

/**
 * Controlador para obtener un único kit por su ID, incluyendo sus productos asociados.
 * Responde con el kit y sus productos o con un error 404 si no se encuentra.
 * @param {Object} req - Objeto de petición Express (debe contener req.params.id).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const getKit = async (req, res) => {
  try {
    const kit = await getKitById(req.params.id);
    if (!kit) {
      return res.status(404).json({ message: 'Kit no encontrado' });
    }
    const productos = await getKitProducts(req.params.id);
    res.json({ ...kit, productos });
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener kit', error: error.message });
  }
};

/**
 * Controlador para crear un nuevo kit.
 * Permite inicializar el kit con una lista de productos.
 * @param {Object} req - Objeto de petición Express (contiene nombre, descripcion y array de productos).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const createKitHandler = async (req, res) => {
  const { nombre, descripcion, productos } = req.body;

  if (!nombre) {
    return res.status(400).json({ message: 'nombre es obligatorio' });
  }

  try {
    const kitId = await createKit(nombre, descripcion);

    if (productos && productos.length > 0) {
      for (const p of productos) {
        await addProductToKit(kitId, p.productoId, p.cantidad);
      }
      await recalculateKitStock(kitId);
    }

    res.status(201).json({ message: 'Kit creado', kitId });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear kit', error: error.message });
  }
};

/**
 * Controlador para actualizar un kit existente por su ID.
 * Valida que se envíen campos para actualizar en el cuerpo de la petición.
 * @param {Object} req - Objeto de petición Express (contiene id en req.params y datos en req.body).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const updateKitHandler = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  try {
    const affected = await updateKit(req.params.id, req.body);
    if (!affected) {
      return res.status(404).json({ message: 'Kit no encontrado' });
    }
    res.json({ message: 'Kit actualizado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar kit', error: error.message });
  }
};

/**
 * Controlador para agregar un producto a un kit específico.
 * Recalcula el stock del kit tras agregar el producto.
 * @param {Object} req - Objeto de petición Express (contiene id del kit en params, y productoId/cantidad en body).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const addProductToKitHandler = async (req, res) => {
  const { productoId, cantidad } = req.body;

  if (!productoId || !cantidad) {
    return res.status(400).json({ message: 'productoId y cantidad son obligatorios' });
  }

  try {
    await addProductToKit(req.params.id, productoId, cantidad);
    const stock = await recalculateKitStock(req.params.id);
    res.json({ message: 'Producto agregado al kit', stockCalculado: stock });
  } catch (error) {
    res.status(500).json({ message: 'Error al agregar producto al kit', error: error.message });
  }
};

/**
 * Controlador para eliminar un producto específico de un kit.
 * Recalcula el stock del kit tras la eliminación.
 * @param {Object} req - Objeto de petición Express (contiene id del kit y productoId en params).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const removeProductFromKitHandler = async (req, res) => {
  try {
    const affected = await removeProductFromKit(req.params.id, req.params.productoId);
    if (!affected) {
      return res.status(404).json({ message: 'Producto no encontrado en el kit' });
    }
    const stock = await recalculateKitStock(req.params.id);
    res.json({ message: 'Producto eliminado del kit', stockCalculado: stock });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar producto del kit', error: error.message });
  }
};

/**
 * Controlador para eliminar un kit completo y sus asociaciones.
 * @param {Object} req - Objeto de petición Express (contiene req.params.id).
 * @param {Object} res - Objeto de respuesta Express.
 */
export const deleteKitHandler = async (req, res) => {
  try {
    const affected = await deleteKit(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Kit no encontrado' });
    }
    res.json({ message: 'Kit eliminado' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar kit', error: error.message });
  }
};