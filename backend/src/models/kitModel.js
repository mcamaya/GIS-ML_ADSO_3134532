import pool from '../config/db.js';

/**
 * Obtiene todos los kits de la base de datos.
 * @returns {Promise<Array>} Lista de kits.
 */
export const getAllKits = async () => {
  const [rows] = await pool.query('SELECT * FROM Kit');
  return rows;
};

/**
 * Obtiene un kit específico por su ID.
 * @param {number|string} id - El ID del kit.
 * @returns {Promise<Object|undefined>} El kit encontrado o undefined.
 */
export const getKitById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Kit WHERE kitId = ?', [id]
  );
  return rows[0];
};

/**
 * Obtiene los productos asociados a un kit específico.
 * @param {number|string} kitId - El ID del kit.
 * @returns {Promise<Array>} Lista de productos del kit con sus detalles (cantidad, nombre, stock, precio).
 */
export const getKitProducts = async (kitId) => {
  const [rows] = await pool.query(
    `SELECT kp.productoId, kp.cantidad, p.nombre, p.stock, p.precio
     FROM Kit_Producto kp
     JOIN Producto p ON kp.productoId = p.productoId
     WHERE kp.kitId = ?`,
    [kitId]
  );
  return rows;
};

/**
 * Crea un nuevo kit en la base de datos. Inicializa el stock en 0.
 * @param {string} nombre - El nombre del kit.
 * @param {string} descripcion - La descripción del kit.
 * @returns {Promise<number>} El ID del kit recién creado.
 */
export const createKit = async (nombre, descripcion) => {
  const [result] = await pool.query(
    'INSERT INTO Kit (nombre, descripcion, stock) VALUES (?, ?, 0)',
    [nombre, descripcion]
  );
  return result.insertId;
};

/**
 * Añade un producto a un kit con una cantidad específica.
 * @param {number|string} kitId - El ID del kit.
 * @param {number|string} productoId - El ID del producto a añadir.
 * @param {number} cantidad - La cantidad del producto en el kit.
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const addProductToKit = async (kitId, productoId, cantidad) => {
  const [result] = await pool.query(
    'INSERT INTO Kit_Producto (kitId, productoId, cantidad) VALUES (?, ?, ?)',
    [kitId, productoId, cantidad]
  );
  return result.affectedRows;
};

/**
 * Recalcula y actualiza el stock disponible de un kit basándose en el inventario
 * de los productos que lo componen.
 * @param {number|string} kitId - El ID del kit a recalcular.
 * @returns {Promise<number>} El nuevo stock calculado del kit.
 */
export const recalculateKitStock = async (kitId) => {
  // El stock del kit es el mínimo de (stock_producto / cantidad) entre todos sus componentes
  const [rows] = await pool.query(
    `SELECT MIN(FLOOR(p.stock / kp.cantidad)) AS stockCalculado
     FROM Kit_Producto kp
     JOIN Producto p ON kp.productoId = p.productoId
     WHERE kp.kitId = ?`,
    [kitId]
  );
  const stockCalculado = rows[0].stockCalculado ?? 0;
  await pool.query(
    'UPDATE Kit SET stock = ? WHERE kitId = ?',
    [stockCalculado, kitId]
  );
  return stockCalculado;
};

/**
 * Actualiza los datos de un kit (nombre, descripción).
 * @param {number|string} id - El ID del kit a actualizar.
 * @param {Object} updateData - Objeto con los campos a actualizar (nombre, descripcion).
 * @returns {Promise<number>} Número de filas afectadas por la actualización.
 */
export const updateKit = async (id, updateData) => {
  const allowedFields = ['nombre', 'descripcion'];
  let fields = [];
  let values = [];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }

  if (fields.length === 0) return 0;

  values.push(id);
  const [result] = await pool.query(
    `UPDATE Kit SET ${fields.join(', ')} WHERE kitId = ?`,
    values
  );
  return result.affectedRows;
};

/**
 * Elimina un producto específico de un kit.
 * @param {number|string} kitId - El ID del kit.
 * @param {number|string} productoId - El ID del producto a eliminar del kit.
 * @returns {Promise<number>} Número de filas afectadas.
 */
export const removeProductFromKit = async (kitId, productoId) => {
  const [result] = await pool.query(
    'DELETE FROM Kit_Producto WHERE kitId = ? AND productoId = ?',
    [kitId, productoId]
  );
  return result.affectedRows;
};

/**
 * Elimina un kit completo y todos sus productos asociados.
 * @param {number|string} id - El ID del kit a eliminar.
 * @returns {Promise<number>} Número de filas afectadas al eliminar el kit.
 */
export const deleteKit = async (id) => {
  await pool.query('DELETE FROM Kit_Producto WHERE kitId = ?', [id]);
  const [result] = await pool.query(
    'DELETE FROM Kit WHERE kitId = ?', [id]
  );
  return result.affectedRows;
};