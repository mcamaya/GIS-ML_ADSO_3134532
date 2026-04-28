/**
 * mlService.js
 * Servicio de integración con la API oficial de MercadoLibre.
 * Maneja el flujo OAuth 2.0 y las operaciones sobre publicaciones (items).
 */

const ML_API_BASE = 'https://api.mercadolibre.com';
const ML_AUTH_BASE = 'https://auth.mercadolibre.com.co';

// ─────────────────────────────────────────────────────────
//  OAUTH 2.0
// ─────────────────────────────────────────────────────────

/**
 * Construye la URL de autorización para redirigir al usuario a MercadoLibre.
 * @returns {string} URL de autorización de ML.
 */
export const getAuthUrl = () => {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ML_CLIENT_ID,
    redirect_uri: process.env.ML_REDIRECT_URI,
  });
  return `${ML_AUTH_BASE}/authorization?${params.toString()}`;
};

/**
 * Intercambia el código de autorización por access_token y refresh_token.
 * @param {string} code - Código recibido en el callback de ML.
 * @returns {Promise<Object>} Tokens de acceso { access_token, refresh_token, expires_in, user_id }.
 */
export const exchangeCodeForTokens = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    code,
    redirect_uri: process.env.ML_REDIRECT_URI,
  });

  const res = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al intercambiar código por tokens');
  }

  return res.json();
};

/**
 * Renueva el access_token usando el refresh_token almacenado.
 * @param {string} refreshToken - Refresh token vigente.
 * @returns {Promise<Object>} Nuevos tokens { access_token, refresh_token, expires_in }.
 */
export const refreshAccessToken = async (refreshToken) => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: process.env.ML_CLIENT_ID,
    client_secret: process.env.ML_CLIENT_SECRET,
    refresh_token: refreshToken,
  });

  const res = await fetch(`${ML_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || 'Error al renovar el token');
  }

  return res.json();
};

// ─────────────────────────────────────────────────────────
//  OPERACIONES SOBRE PUBLICACIONES (ITEMS)
// ─────────────────────────────────────────────────────────

/**
 * Obtiene los datos de una publicación de MercadoLibre por su Item ID.
 * @param {string} itemId - ID del item en ML (ej: MLA123456789).
 * @param {string} accessToken - Token de acceso vigente.
 * @returns {Promise<Object>} Datos del item en ML.
 */
export const getItemFromML = async (itemId, accessToken) => {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `No se pudo obtener el item ${itemId}`);
  }

  return res.json();
};

/**
 * Actualiza el stock (available_quantity) de una publicación en MercadoLibre.
 * @param {string} itemId - ID del item en ML.
 * @param {number} stock - Nuevo valor de stock.
 * @param {string} accessToken - Token de acceso vigente.
 * @returns {Promise<Object>} Respuesta de ML.
 */
export const updateStockInML = async (itemId, stock, accessToken) => {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ available_quantity: stock }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `No se pudo actualizar el stock del item ${itemId}`);
  }

  return res.json();
};

/**
 * Actualiza el precio de una publicación en MercadoLibre.
 * @param {string} itemId - ID del item en ML.
 * @param {number} precio - Nuevo precio.
 * @param {string} accessToken - Token de acceso vigente.
 * @returns {Promise<Object>} Respuesta de ML.
 */
export const updatePriceInML = async (itemId, precio, accessToken) => {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ price: precio }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `No se pudo actualizar el precio del item ${itemId}`);
  }

  return res.json();
};

/**
 * Cambia el estado de una publicación en MercadoLibre (active / paused / closed).
 * @param {string} itemId - ID del item en ML.
 * @param {'active'|'paused'|'closed'} status - Nuevo estado.
 * @param {string} accessToken - Token de acceso vigente.
 * @returns {Promise<Object>} Respuesta de ML.
 */
export const updateStatusInML = async (itemId, status, accessToken) => {
  const res = await fetch(`${ML_API_BASE}/items/${itemId}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message || `No se pudo cambiar el estado del item ${itemId}`);
  }

  return res.json();
};