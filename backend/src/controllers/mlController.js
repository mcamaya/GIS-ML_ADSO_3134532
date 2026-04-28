/**
 * mlController.js
 * Controladores para el módulo de integración con MercadoLibre.
 * Cubre: flujo OAuth, CRUD de publicaciones y sincronización de stock.
 */

import {
  saveTokens,
  getTokensByUser,
  updateAccessToken,
  getAllPublicaciones,
  getPublicacionById,
  getPublicacionByItemId,
  createPublicacion,
  updatePublicacion,
  deletePublicacion,
  getEstados,
} from '../models/mlModel.js';

import {
  getAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  getItemFromML,
  updateStockInML,
  updatePriceInML,
  updateStatusInML,
} from '../services/mlService.js';

import { registrarLog } from '../services/logService.js';

// ─────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────

/**
 * Obtiene el access_token vigente del usuario.
 * Si está expirado, lo renueva automáticamente y persiste los nuevos tokens.
 * @param {number} usuarioId
 * @returns {Promise<string>} Access token listo para usar.
 */
const getValidAccessToken = async (usuarioId) => {
  const tokenRow = await getTokensByUser(usuarioId);

  if (!tokenRow) {
    throw new Error('No hay conexión con MercadoLibre. Completa la autorización primero.');
  }

  const now = new Date();
  const expiresAt = new Date(tokenRow.expiresAt);

  // Renueva si quedan menos de 5 minutos
  if (expiresAt - now < 5 * 60 * 1000) {
    const newTokens = await refreshAccessToken(tokenRow.refreshToken);
    await updateAccessToken(
      usuarioId,
      newTokens.access_token,
      newTokens.refresh_token,
      newTokens.expires_in
    );
    return newTokens.access_token;
  }

  return tokenRow.accessToken;
};

// ─────────────────────────────────────────────────────────
//  OAUTH
// ─────────────────────────────────────────────────────────

/**
 * Devuelve la URL de autorización de MercadoLibre.
 * El frontend redirige al usuario a esta URL.
 */
export const getMLAuthUrl = (req, res) => {
  const url = getAuthUrl();
  res.json({ url });
};

/**
 * Callback que recibe el código de ML, lo intercambia por tokens
 * y los guarda asociados al usuario autenticado.
 */
export const handleMLCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    return res.status(400).json({ message: 'Código de autorización no recibido' });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    await saveTokens(
      req.user.userId,
      tokens.access_token,
      tokens.refresh_token,
      tokens.expires_in,
      tokens.user_id
    );
    await registrarLog(req.user.userId, 'Conexión con MercadoLibre autorizada');
    res.json({ message: 'Conexión con MercadoLibre establecida correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al conectar con MercadoLibre', error: error.message });
  }
};

/**
 * Verifica si el usuario ya tiene tokens de ML almacenados y si están vigentes.
 */
export const getMLStatus = async (req, res) => {
  try {
    const tokenRow = await getTokensByUser(req.user.userId);

    if (!tokenRow) {
      return res.json({ conectado: false });
    }

    const expiresAt = new Date(tokenRow.expiresAt);
    const vigente = expiresAt > new Date();

    res.json({
      conectado: true,
      vigente,
      mlUserId: tokenRow.mlUserId,
      expiresAt: tokenRow.expiresAt,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al verificar estado de ML', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  CRUD DE PUBLICACIONES
// ─────────────────────────────────────────────────────────

/**
 * Lista todas las publicaciones registradas en el sistema.
 */
export const getPublicaciones = async (req, res) => {
  try {
    const publicaciones = await getAllPublicaciones();
    res.json(publicaciones);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicaciones', error: error.message });
  }
};

/**
 * Obtiene una publicación por su ID interno.
 */
export const getPublicacion = async (req, res) => {
  try {
    const pub = await getPublicacionById(req.params.id);
    if (!pub) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    res.json(pub);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener publicación', error: error.message });
  }
};

/**
 * Importa una publicación desde ML usando su Item ID.
 * Consulta la API de ML, trae los datos reales y los persiste en la BD.
 */
export const importPublicacion = async (req, res) => {
  const { itemMercancia } = req.body;

  if (!itemMercancia) {
    return res.status(400).json({ message: 'itemMercancia es obligatorio' });
  }

  // Verificar que no exista ya
  const existente = await getPublicacionByItemId(itemMercancia);
  if (existente) {
    return res.status(409).json({ message: 'Esta publicación ya está registrada en el sistema' });
  }

  try {
    const accessToken = await getValidAccessToken(req.user.userId);
    const item = await getItemFromML(itemMercancia, accessToken);

    // Mapear estado de ML a EstadoPublicacion
    const estadoMap = { active: 1, paused: 2, closed: 3 };
    const estadoId = estadoMap[item.status] ?? null;

    const publicacionId = await createPublicacion(
      item.id,
      item.title,
      item.price,
      item.available_quantity,
      estadoId
    );

    await registrarLog(
      req.user.userId,
      `Publicación importada desde ML: ${item.id} - ${item.title}`
    );

    res.status(201).json({ message: 'Publicación importada correctamente', publicacionId });
  } catch (error) {
    res.status(500).json({ message: 'Error al importar publicación', error: error.message });
  }
};

/**
 * Registra manualmente una publicación sin consultar la API de ML.
 * Útil cuando no se tiene conexión activa con ML.
 */
export const createPublicacionManual = async (req, res) => {
  const { itemMercancia, titulo, precio, stock, estadoId } = req.body;

  if (!itemMercancia || !titulo) {
    return res.status(400).json({ message: 'itemMercancia y titulo son obligatorios' });
  }

  const existente = await getPublicacionByItemId(itemMercancia);
  if (existente) {
    return res.status(409).json({ message: 'Esta publicación ya está registrada en el sistema' });
  }

  try {
    const publicacionId = await createPublicacion(
      itemMercancia, titulo, precio ?? null, stock ?? null, estadoId ?? null
    );
    await registrarLog(
      req.user.userId,
      `Publicación creada manualmente: ${itemMercancia} - ${titulo}`
    );
    res.status(201).json({ message: 'Publicación creada', publicacionId });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear publicación', error: error.message });
  }
};

/**
 * Actualiza los datos locales de una publicación.
 */
export const updatePublicacionHandler = async (req, res) => {
  if (Object.keys(req.body).length === 0) {
    return res.status(400).json({ message: 'No se enviaron campos para actualizar' });
  }

  try {
    const affected = await updatePublicacion(req.params.id, req.body);
    if (!affected) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    await registrarLog(req.user.userId, `Publicación actualizada localmente: ID ${req.params.id}`);
    res.json({ message: 'Publicación actualizada' });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar publicación', error: error.message });
  }
};

/**
 * Elimina una publicación del sistema local (no la elimina en ML).
 */
export const deletePublicacionHandler = async (req, res) => {
  try {
    const affected = await deletePublicacion(req.params.id);
    if (!affected) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }
    await registrarLog(req.user.userId, `Publicación eliminada del sistema: ID ${req.params.id}`);
    res.json({ message: 'Publicación eliminada del sistema' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar publicación', error: error.message });
  }
};

/**
 * Lista los estados de publicación disponibles.
 */
export const getEstadosHandler = async (req, res) => {
  try {
    const estados = await getEstados();
    res.json(estados);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener estados', error: error.message });
  }
};

// ─────────────────────────────────────────────────────────
//  SINCRONIZACIÓN CON MERCADOLIBRE
// ─────────────────────────────────────────────────────────

/**
 * Sincroniza el stock de una publicación hacia MercadoLibre.
 * Actualiza en ML y luego persiste el nuevo valor en la BD local.
 */
export const syncStock = async (req, res) => {
  const { stock } = req.body;

  if (stock === undefined || isNaN(Number(stock))) {
    return res.status(400).json({ message: 'stock es obligatorio y debe ser un número' });
  }

  try {
    const pub = await getPublicacionById(req.params.id);
    if (!pub) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const accessToken = await getValidAccessToken(req.user.userId);
    await updateStockInML(pub.itemMercancia, Number(stock), accessToken);
    await updatePublicacion(req.params.id, { stock: Number(stock) });

    await registrarLog(
      req.user.userId,
      `Stock sincronizado con ML: ${pub.itemMercancia} → ${stock} unidades`
    );

    res.json({ message: 'Stock sincronizado correctamente', itemMercancia: pub.itemMercancia, stock });
  } catch (error) {
    res.status(500).json({ message: 'Error al sincronizar stock', error: error.message });
  }
};

/**
 * Sincroniza el precio de una publicación hacia MercadoLibre.
 */
export const syncPrecio = async (req, res) => {
  const { precio } = req.body;

  if (precio === undefined || isNaN(Number(precio))) {
    return res.status(400).json({ message: 'precio es obligatorio y debe ser un número' });
  }

  try {
    const pub = await getPublicacionById(req.params.id);
    if (!pub) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const accessToken = await getValidAccessToken(req.user.userId);
    await updatePriceInML(pub.itemMercancia, Number(precio), accessToken);
    await updatePublicacion(req.params.id, { precio: Number(precio) });

    await registrarLog(
      req.user.userId,
      `Precio sincronizado con ML: ${pub.itemMercancia} → $${precio}`
    );

    res.json({ message: 'Precio sincronizado correctamente', itemMercancia: pub.itemMercancia, precio });
  } catch (error) {
    res.status(500).json({ message: 'Error al sincronizar precio', error: error.message });
  }
};

/**
 * Cambia el estado de una publicación en MercadoLibre y lo actualiza localmente.
 * @param {string} req.body.status - 'active' | 'paused' | 'closed'
 */
export const syncEstado = async (req, res) => {
  const { status } = req.body;
  const estadosValidos = ['active', 'paused', 'closed'];

  if (!status || !estadosValidos.includes(status)) {
    return res.status(400).json({ message: `status debe ser uno de: ${estadosValidos.join(', ')}` });
  }

  try {
    const pub = await getPublicacionById(req.params.id);
    if (!pub) {
      return res.status(404).json({ message: 'Publicación no encontrada' });
    }

    const accessToken = await getValidAccessToken(req.user.userId);
    await updateStatusInML(pub.itemMercancia, status, accessToken);

    const estadoMap = { active: 1, paused: 2, closed: 3 };
    await updatePublicacion(req.params.id, { estadoId: estadoMap[status] });

    await registrarLog(
      req.user.userId,
      `Estado sincronizado con ML: ${pub.itemMercancia} → ${status}`
    );

    res.json({ message: 'Estado actualizado correctamente', itemMercancia: pub.itemMercancia, status });
  } catch (error) {
    res.status(500).json({ message: 'Error al sincronizar estado', error: error.message });
  }
};