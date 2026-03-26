import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByEmail, createUser } from '../models/userModel.js';

/**
 * Registra un nuevo usuario en la plataforma.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express (body: nombre, email, password)
 * @param {import('express').Response} res - Objeto de respuesta de Express
 */
export const register = async (req, res) => {
  const { nombre, email, password } = req.body;

  // Validación básica para evitar que datos vacíos rompan la lógica o queden nulos en la BD
  if (!nombre || !email || !password) {
    return res.status(400).json({ message: 'Todos los campos son obligatorios (nombre, email, password)' });
  }

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = await createUser(nombre, email, passwordHash);

    res.status(201).json({ message: 'Usuario creado', userId });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

/**
 * Inicia sesión para un usuario existente y genera un JWT.
 * 
 * @param {import('express').Request} req - Objeto de petición de Express (body: email, password)
 * @param {import('express').Response} res - Objeto de respuesta de Express
 */
export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Correo y contraseña son requeridos' });
  }

  try {
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales incorrectas' });
    }

    const token = jwt.sign(
      { userId: user.usuarioId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Login exitoso',
      token,
      user: {
        userId: user.usuarioId,
        nombre: user.nombre,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};