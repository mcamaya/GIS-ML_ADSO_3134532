import pool from '../config/db.js';

/**
 * Busca un usuario por su correo electrónico.
 * 
 * @param {string} email - Correo electrónico del usuario.
 * @returns {Promise<Object|undefined>} Retorna el objeto del usuario o undefined si no existe.
 * @throws {Error} Si hay un problema con la consulta a la base de datos.
 */
export const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM Usuario WHERE email = ? LIMIT 1', 
      [email]
    );
    return rows[0];
  } catch (error) {
    console.error('Error en findUserByEmail:', error);
    throw error;
  }
};

/**
 * Crea un nuevo usuario en la base de datos.
 * 
 * @param {string} nombre - Nombre del usuario a crear.
 * @param {string} email - Correo electrónico del usuario.
 * @param {string} passwordHash - Contraseña encriptada/hasheada.
 * @returns {Promise<number>} El ID del nuevo usuario insertado.
 * @throws {Error} Si ocurre un error durante la inserción.
 */
export const createUser = async (nombre, email, passwordHash) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO Usuario (nombre, email, passwordHash) VALUES (?, ?, ?)',
      [nombre, email, passwordHash]
    );
    return result.insertId;
  } catch (error) {
    console.error('Error en createUser:', error);
    throw error;
  }
};