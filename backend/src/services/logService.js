import pool from '../config/db.js';

export const registrarLog = async (usuarioId, accion) => {
  try {
    await pool.query(
      'INSERT INTO LogActividad (usuarioId, fechaHora, accion) VALUES (?, NOW(), ?)',
      [usuarioId, accion]
    );
  } catch (error) {
    console.error('Error al registrar log:', error.message);
  }
};