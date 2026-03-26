import jwt from 'jsonwebtoken';

/**
 * Middleware para autenticar rutas protegidas mediante JWT.
 * Verifica la presencia de un token tipo Bearer y su validez.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express.
 * @param {import('express').Response} res - Objeto de respuesta de Express.
 * @param {import('express').NextFunction} next - Función para pasar el control al siguiente middleware.
 * @returns {void|Object} Retorna un error 401/403 si falla, o llama a next() si tiene éxito.
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ message: 'Token requerido' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'El token ha expirado. Por favor, inicie sesión nuevamente.' });
    }
    return res.status(403).json({ message: 'Token inválido o alterado.' });
  }
};

export default authMiddleware;