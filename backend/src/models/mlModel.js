/**
 * mlModel.js
 * Operaciones de base de datos para MercadoLibrePublicacion y tokens OAuth.
 */

import pool from '../config/db.js';

// ─────────────────────────────────────────────────────────
//  TOKENS OAUTH (almacenados por usuario)
// ─────────────────────────────────────────────────────────

/**
 * Guarda o actualiza los tokens OAuth de un usuario.
 * Usa INSERT ... ON DUPLICATE KEY UPDATE para upsert.
 * @param {number} usuarioId
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {number} expiresIn - Segundos hasta expiración.
 * @param {number} mlUserId - ID de usuario en MercadoLibre.
 */
export const saveTokens = async (usuarioId, accessToken, refreshToken, expiresIn, mlUserId) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await pool.query(
    `INSERT INTO ML_Token (usuarioId, accessToken, refreshToken, expiresAt, mlUserId)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       accessToken  = VALUES(accessToken),
       refreshToken = VALUES(refreshToken),
       expiresAt    = VALUES(expiresAt),
       mlUserId     = VALUES(mlUserId)`,
    [usuarioId, accessToken, refreshToken, expiresAt, mlUserId]
  );
};

/**
 * Obtiene los tokens OAuth almacenados de un usuario.
 * @param {number} usuarioId
 * @returns {Promise<Object|undefined>}
 */
export const getTokensByUser = async (usuarioId) => {
  const [rows] = await pool.query(
    'SELECT * FROM ML_Token WHERE usuarioId = ?',
    [usuarioId]
  );
  return rows[0];
};

/**
 * Actualiza únicamente el access_token y su fecha de expiración.
 * Se usa tras refrescar el token.
 * @param {number} usuarioId
 * @param {string} accessToken
 * @param {string} refreshToken
 * @param {number} expiresIn
 */
export const updateAccessToken = async (usuarioId, accessToken, refreshToken, expiresIn) => {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);
  await pool.query(
    `UPDATE ML_Token
     SET accessToken = ?, refreshToken = ?, expiresAt = ?
     WHERE usuarioId = ?`,
    [accessToken, refreshToken, expiresAt, usuarioId]
  );
};

// ─────────────────────────────────────────────────────────
//  PUBLICACIONES
// ─────────────────────────────────────────────────────────

/**
 * Obtiene todas las publicaciones registradas, incluyendo el nombre del estado.
 * @returns {Promise<Array>}
 */
export const getAllPublicaciones = async () => {
  const [rows] = await pool.query(
    `SELECT p.*, e.nombre AS estadoNombre
     FROM MercadoLibrePublicacion p
     LEFT JOIN EstadoPublicacion e ON p.estadoId = e.estadoId
     ORDER BY p.creadoEn DESC`
  );
  return rows;
};

/**
 * Obtiene una publicación por su ID interno.
 * @param {number} publicacionId
 * @returns {Promise<Object|undefined>}
 */
export const getPublicacionById = async (publicacionId) => {
  const [rows] = await pool.query(
    `SELECT p.*, e.nombre AS estadoNombre
     FROM MercadoLibrePublicacion p
     LEFT JOIN EstadoPublicacion e ON p.estadoId = e.estadoId
     WHERE p.publicacionId = ?`,
    [publicacionId]
  );
  return rows[0];
};

/**
 * Obtiene una publicación por su Item ID de MercadoLibre.
 * @param {string} itemMercancia - ID del item en ML (ej: MLA123456789).
 * @returns {Promise<Object|undefined>}
 */
export const getPublicacionByItemId = async (itemMercancia) => {
  const [rows] = await pool.query(
    'SELECT * FROM MercadoLibrePublicacion WHERE itemMercancia = ?',
    [itemMercancia]
  );
  return rows[0];
};

/**
 * Crea una nueva publicación en la base de datos.
 * @param {string} itemMercancia
 * @param {string} titulo
 * @param {number|null} precio
 * @param {number|null} stock
 * @param {number|null} estadoId
 * @returns {Promise<number>} ID de la publicación creada.
 */
export const createPublicacion = async (itemMercancia, titulo, precio, stock, estadoId) => {
  const [result] = await pool.query(
    `INSERT INTO MercadoLibrePublicacion (itemMercancia, titulo, precio, stock, estadoId)
     VALUES (?, ?, ?, ?, ?)`,
    [itemMercancia, titulo, precio, stock, estadoId]
  );
  return result.insertId;
};

/**
 * Actualiza los campos de una publicación en la base de datos.
 * @param {number} publicacionId
 * @param {Object} updateData - Campos permitidos: titulo, precio, stock, estadoId.
 * @returns {Promise<number>} Filas afectadas.
 */
export const updatePublicacion = async (publicacionId, updateData) => {
  const allowedFields = ['titulo', 'precio', 'stock', 'estadoId'];
  const fields = [];
  const values = [];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }

  if (fields.length === 0) return 0;

  values.push(publicacionId);
  const [result] = await pool.query(
    `UPDATE MercadoLibrePublicacion SET ${fields.join(', ')} WHERE publicacionId = ?`,
    values
  );
  return result.affectedRows;
};

/**
 * Elimina una publicación de la base de datos.
 * @param {number} publicacionId
 * @returns {Promise<number>} Filas afectadas.
 */
export const deletePublicacion = async (publicacionId) => {
  const [result] = await pool.query(
    'DELETE FROM MercadoLibrePublicacion WHERE publicacionId = ?',
    [publicacionId]
  );
  return result.affectedRows;
};

/**
 * Obtiene todos los estados de publicación disponibles.
 * @returns {Promise<Array>}
 */
export const getEstados = async () => {
  const [rows] = await pool.query('SELECT * FROM EstadoPublicacion');
  return rows;
};