import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout.jsx';
import api from '../../api/axios.js';
import styles from './Inventory.module.css';

const EMPTY_FORM = {
  nombre: '',
  descripcion: '',
  costo: '',
  precio: '',
  stock: '',
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal / form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  // Confirmar eliminación
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Búsqueda
  const [search, setSearch] = useState('');

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/products');
      setProducts(data);
    } catch {
      setError('No se pudo cargar el inventario. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  /* ── Modal helpers ── */
  const openCreate = () => {
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (product) => {
    setEditingProduct(product);
    setForm({
      nombre: product.nombre ?? '',
      descripcion: product.descripcion ?? '',
      costo: product.costo ?? '',
      precio: product.precio ?? '',
      stock: product.stock ?? '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProduct(null);
    setForm(EMPTY_FORM);
    setFormError('');
  };

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!form.nombre.trim()) {
      setFormError('El nombre es obligatorio.');
      return;
    }
    if (form.stock === '' || isNaN(Number(form.stock))) {
      setFormError('El stock es obligatorio y debe ser un número.');
      return;
    }

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      costo: form.costo !== '' ? Number(form.costo) : null,
      precio: form.precio !== '' ? Number(form.precio) : null,
      stock: Number(form.stock),
    };

    try {
      setSaving(true);
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.productoId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      await fetchProducts();
      closeModal();
    } catch (err) {
      setFormError(
        err?.response?.data?.message || 'Error al guardar el producto.'
      );
    } finally {
      setSaving(false);
    }
  };

  /* ── Delete ── */
  const confirmDelete = (product) => setDeleteTarget(product);
  const cancelDelete = () => setDeleteTarget(null);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/products/${deleteTarget.productoId}`);
      await fetchProducts();
      setDeleteTarget(null);
    } catch { 
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Filtrado ── */
  const filtered = products.filter((p) =>
    p.nombre.toLowerCase().includes(search.toLowerCase())
  );

  /* ── Stock badge ── */
  const stockBadge = (stock) => {
    if (stock === 0) return <span className={`${styles.badge} ${styles.badgeDanger}`}>Sin stock</span>;
    if (stock <= 5) return <span className={`${styles.badge} ${styles.badgeWarning}`}>Stock bajo</span>;
    return <span className={`${styles.badge} ${styles.badgeOk}`}>En stock</span>;
  };

  const fmt = (val) =>
    val != null
      ? `$${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`
      : '—';

  return (
    <Layout>
      <div className={styles.page}>

        {/* Encabezado */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Inventario</h1>
            <p className={styles.subtitle}>
              {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className={styles.btnPrimary} onClick={openCreate}>
            + Nuevo producto
          </button>
        </div>

        {/* Buscador */}
        <div className={styles.toolbar}>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Contenido */}
        {loading ? (
          <div className={styles.feedback}>Cargando inventario…</div>
        ) : error ? (
          <div className={`${styles.feedback} ${styles.feedbackError}`}>{error}</div>
        ) : filtered.length === 0 ? (
          <div className={styles.feedback}>
            {search ? 'Sin resultados para esa búsqueda.' : 'No hay productos registrados aún.'}
          </div>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripción</th>
                  <th>Costo</th>
                  <th>Precio</th>
                  <th>Stock</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.productoId}>
                    <td className={styles.cellNombre}>{p.nombre}</td>
                    <td className={styles.cellDesc}>{p.descripcion || '—'}</td>
                    <td>{fmt(p.costo)}</td>
                    <td>{fmt(p.precio)}</td>
                    <td className={styles.cellStock}>{p.stock}</td>
                    <td>{stockBadge(p.stock)}</td>
                    <td>
                      <div className={styles.actions}>
                        <button className={styles.btnEdit} onClick={() => openEdit(p)}>
                          Editar
                        </button>
                        <button className={styles.btnDelete} onClick={() => confirmDelete(p)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal crear/editar ── */}
      {modalOpen && (
        <div className={styles.overlay} onClick={closeModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingProduct ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button className={styles.btnClose} onClick={closeModal}>✕</button>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input
                  className={styles.input}
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Nombre del producto"
                  autoComplete="off"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <input
                  className={styles.input}
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción opcional"
                  autoComplete="off"
                />
              </div>

              <div className={styles.row}>
                <div className={styles.field}>
                  <label className={styles.label}>Costo</label>
                  <input
                    className={styles.input}
                    name="costo"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.costo}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>Precio</label>
                  <input
                    className={styles.input}
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.precio}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Stock *</label>
                <input
                  className={styles.input}
                  name="stock"
                  type="number"
                  min="0"
                  value={form.stock}
                  onChange={handleChange}
                  placeholder="0"
                />
              </div>

              {formError && <p className={styles.formError}>{formError}</p>}

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.btnSecondary}
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.btnPrimary}
                  disabled={saving}
                >
                  {saving ? 'Guardando…' : editingProduct ? 'Guardar cambios' : 'Crear producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminación ── */}
      {deleteTarget && (
        <div className={styles.overlay} onClick={cancelDelete}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Eliminar producto</h2>
              <button className={styles.btnClose} onClick={cancelDelete}>✕</button>
            </div>
            <p className={styles.deleteMsg}>
              ¿Estás seguro de que deseas eliminar{' '}
              <strong>{deleteTarget.nombre}</strong>?
              Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalFooter}>
              <button
                className={styles.btnSecondary}
                onClick={cancelDelete}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                className={styles.btnDanger}
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}