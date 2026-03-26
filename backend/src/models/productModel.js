import pool from '../config/db.js';

export const getAllProducts = async () => {
  const [rows] = await pool.query('SELECT * FROM Producto');
  return rows;
};

export const getProductById = async (id) => {
  const [rows] = await pool.query(
    'SELECT * FROM Producto WHERE productoId = ?', [id]
  );
  return rows[0];
};

export const createProduct = async (nombre, descripcion, costo, precio, stock) => {
  const [result] = await pool.query(
    'INSERT INTO Producto (nombre, descripcion, costo, precio, stock) VALUES (?, ?, ?, ?, ?)',
    [nombre, descripcion, costo, precio, stock]
  );
  return result.insertId;
};

export const updateProduct = async (id, updateData) => {
  let fields = [];
  let values = [];

  const allowedFields = ['nombre', 'descripcion', 'costo', 'precio', 'stock'];
  
  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      fields.push(`${field} = ?`);
      values.push(updateData[field]);
    }
  }

  if (fields.length === 0) return 0; // No hay campos por actualizar

  values.push(id);
  let query = `UPDATE Producto SET ${fields.join(', ')} WHERE productoId = ?`;

  const [result] = await pool.query(query, values);
  return result.affectedRows;
};

export const deleteProduct = async (id) => {
  const [result] = await pool.query(
    'DELETE FROM Producto WHERE productoId = ?', [id]
  );
  return result.affectedRows;
};