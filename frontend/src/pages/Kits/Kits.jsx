import { useState, useEffect, useCallback } from 'react';
import Layout from '../../components/Layout/Layout.jsx';
import api from '../../api/axios.js';
import styles from './Kits.module.css';

const EMPTY_KIT_FORM = { nombre: '', descripcion: '' };

export default function Kits() {
  const [kits, setKits] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Kit seleccionado para ver detalle
  const [selectedKit, setSelectedKit] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modal crear/editar kit
  const [kitModalOpen, setKitModalOpen] = useState(false);
  const [editingKit, setEditingKit] = useState(null);
  const [kitForm, setKitForm] = useState(EMPTY_KIT_FORM);
  const [kitFormError, setKitFormError] = useState('');
  const [savingKit, setSavingKit] = useState(false);

  // Modal agregar producto al kit
  const [addProdModalOpen, setAddProdModalOpen] = useState(false);
  const [addProdForm, setAddProdForm] = useState({ productoId: '', cantidad: 1 });
  const [addProdError, setAddProdError] = useState('');
  const [savingProd, setSavingProd] = useState(false);

  // Confirmar eliminaciones
  const [deleteKitTarget, setDeleteKitTarget] = useState(null);
  const [deleteProdTarget, setDeleteProdTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState('');

  /* ── Carga inicial ── */
  const fetchKits = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const { data } = await api.get('/kits');
      setKits(data);
    } catch {
      setError('No se pudo cargar los kits. Verifica la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data } = await api.get('/products');
      setProducts(data);
    } catch {
      // silencioso, solo afecta al selector de productos
    }
  }, []);

  useEffect(() => {
    fetchKits();
    fetchProducts();
  }, [fetchKits, fetchProducts]);

  /* ── Detalle de kit ── */
  const openDetail = async (kit) => {
    try {
      setLoadingDetail(true);
      const { data } = await api.get(`/kits/${kit.kitId}`);
      setSelectedKit(data);
    } catch {
      setSelectedKit({ ...kit, productos: [] });
    } finally {
      setLoadingDetail(false);
    }
  };

  const refreshDetail = async () => {
    if (!selectedKit) return;
    const { data } = await api.get(`/kits/${selectedKit.kitId}`);
    setSelectedKit(data);
    setKits((prev) => prev.map((k) => k.kitId === data.kitId ? { ...k, stock: data.stock } : k));
  };

  /* ── Modal kit ── */
  const openCreateKit = () => {
    setEditingKit(null);
    setKitForm(EMPTY_KIT_FORM);
    setKitFormError('');
    setKitModalOpen(true);
  };

  const openEditKit = (kit) => {
    setEditingKit(kit);
    setKitForm({ nombre: kit.nombre ?? '', descripcion: kit.descripcion ?? '' });
    setKitFormError('');
    setKitModalOpen(true);
  };

  const closeKitModal = () => {
    setKitModalOpen(false);
    setEditingKit(null);
    setKitForm(EMPTY_KIT_FORM);
    setKitFormError('');
  };

  const handleKitSubmit = async (e) => {
    e.preventDefault();
    setKitFormError('');
    if (!kitForm.nombre.trim()) {
      setKitFormError('El nombre es obligatorio.');
      return;
    }
    try {
      setSavingKit(true);
      if (editingKit) {
        await api.patch(`/kits/${editingKit.kitId}`, {
          nombre: kitForm.nombre.trim(),
          descripcion: kitForm.descripcion.trim() || null,
        });
        if (selectedKit?.kitId === editingKit.kitId) await refreshDetail();
      } else {
        await api.post('/kits', {
          nombre: kitForm.nombre.trim(),
          descripcion: kitForm.descripcion.trim() || null,
        });
      }
      await fetchKits();
      closeKitModal();
    } catch (err) {
      setKitFormError(err?.response?.data?.message || 'Error al guardar el kit.');
    } finally {
      setSavingKit(false);
    }
  };

  /* ── Eliminar kit ── */
  const handleDeleteKit = async () => {
    if (!deleteKitTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/kits/${deleteKitTarget.kitId}`);
      if (selectedKit?.kitId === deleteKitTarget.kitId) setSelectedKit(null);
      await fetchKits();
      setDeleteKitTarget(null);
    } catch {
      setDeleteKitTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Modal agregar producto ── */
  const openAddProd = () => {
    setAddProdForm({ productoId: '', cantidad: 1 });
    setAddProdError('');
    setAddProdModalOpen(true);
  };

  const closeAddProd = () => {
    setAddProdModalOpen(false);
    setAddProdForm({ productoId: '', cantidad: 1 });
    setAddProdError('');
  };

  const handleAddProd = async (e) => {
    e.preventDefault();
    setAddProdError('');
    if (!addProdForm.productoId) { setAddProdError('Selecciona un producto.'); return; }
    if (!addProdForm.cantidad || Number(addProdForm.cantidad) < 1) { setAddProdError('La cantidad debe ser al menos 1.'); return; }

    // Verificar que el producto no esté ya en el kit
    const yaExiste = selectedKit?.productos?.some(
      (p) => p.productoId === Number(addProdForm.productoId)
    );
    if (yaExiste) { setAddProdError('Este producto ya está en el kit.'); return; }

    try {
      setSavingProd(true);
      await api.post(`/kits/${selectedKit.kitId}/productos`, {
        productoId: Number(addProdForm.productoId),
        cantidad: Number(addProdForm.cantidad),
      });
      await refreshDetail();
      closeAddProd();
    } catch (err) {
      setAddProdError(err?.response?.data?.message || 'Error al agregar el producto.');
    } finally {
      setSavingProd(false);
    }
  };

  /* ── Eliminar producto del kit ── */
  const handleRemoveProd = async () => {
    if (!deleteProdTarget) return;
    try {
      setDeleting(true);
      await api.delete(`/kits/${selectedKit.kitId}/productos/${deleteProdTarget.productoId}`);
      await refreshDetail();
      setDeleteProdTarget(null);
    } catch {
      setDeleteProdTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  /* ── Helpers ── */
  const stockBadge = (stock) => {
    if (stock === 0) return <span className={`${styles.badge} ${styles.badgeDanger}`}>Sin stock</span>;
    if (stock <= 5) return <span className={`${styles.badge} ${styles.badgeWarning}`}>Stock bajo</span>;
    return <span className={`${styles.badge} ${styles.badgeOk}`}>En stock</span>;
  };

  const filteredKits = kits.filter((k) =>
    k.nombre.toLowerCase().includes(search.toLowerCase())
  );

  // Productos disponibles para agregar (excluye los ya en el kit)
  const availableProducts = products.filter(
    (p) => !selectedKit?.productos?.some((kp) => kp.productoId === p.productoId)
  );

  return (
    <Layout>
      <div className={styles.page}>

        {/* Encabezado */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Kits</h1>
            <p className={styles.subtitle}>
              {kits.length} kit{kits.length !== 1 ? 's' : ''} registrado{kits.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button className={styles.btnPrimary} onClick={openCreateKit}>
            + Nuevo kit
          </button>
        </div>

        <div className={styles.layout}>

          {/* ── Panel izquierdo: lista de kits ── */}
          <div className={styles.listPanel}>
            <input
              className={styles.searchInput}
              type="text"
              placeholder="Buscar kit…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {loading ? (
              <div className={styles.feedback}>Cargando kits…</div>
            ) : error ? (
              <div className={`${styles.feedback} ${styles.feedbackError}`}>{error}</div>
            ) : filteredKits.length === 0 ? (
              <div className={styles.feedback}>
                {search ? 'Sin resultados.' : 'No hay kits registrados aún.'}
              </div>
            ) : (
              <div className={styles.kitList}>
                {filteredKits.map((k) => (
                  <div
                    key={k.kitId}
                    className={`${styles.kitCard} ${selectedKit?.kitId === k.kitId ? styles.kitCardActive : ''}`}
                    onClick={() => openDetail(k)}
                  >
                    <div className={styles.kitCardTop}>
                      <span className={styles.kitCardName}>{k.nombre}</span>
                      {stockBadge(k.stock)}
                    </div>
                    <p className={styles.kitCardDesc}>{k.descripcion || 'Sin descripción'}</p>
                    <p className={styles.kitCardStock}>Stock calculado: <strong>{k.stock}</strong></p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Panel derecho: detalle del kit ── */}
          <div className={styles.detailPanel}>
            {!selectedKit ? (
              <div className={styles.detailEmpty}>
                Selecciona un kit para ver su detalle y administrar sus productos.
              </div>
            ) : loadingDetail ? (
              <div className={styles.detailEmpty}>Cargando detalle…</div>
            ) : (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <h2 className={styles.detailTitle}>{selectedKit.nombre}</h2>
                    <p className={styles.detailDesc}>{selectedKit.descripcion || 'Sin descripción'}</p>
                  </div>
                  <div className={styles.detailActions}>
                    <button className={styles.btnEdit} onClick={() => openEditKit(selectedKit)}>
                      Editar
                    </button>
                    <button className={styles.btnDelete} onClick={() => setDeleteKitTarget(selectedKit)}>
                      Eliminar
                    </button>
                  </div>
                </div>

                <div className={styles.detailMeta}>
                  <span>Stock del kit: <strong>{selectedKit.stock}</strong></span>
                  {stockBadge(selectedKit.stock)}
                </div>

                <div className={styles.productsHeader}>
                  <h3 className={styles.productsTitle}>Productos del kit</h3>
                  <button className={styles.btnPrimary} onClick={openAddProd}>
                    + Agregar producto
                  </button>
                </div>

                {!selectedKit.productos || selectedKit.productos.length === 0 ? (
                  <div className={styles.feedback}>Este kit no tiene productos aún.</div>
                ) : (
                  <div className={styles.tableWrapper}>
                    <table className={styles.table}>
                      <thead>
                        <tr>
                          <th>Producto</th>
                          <th>Cantidad en kit</th>
                          <th>Stock disponible</th>
                          <th>Precio</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedKit.productos.map((p) => (
                          <tr key={p.productoId}>
                            <td className={styles.cellNombre}>{p.nombre}</td>
                            <td>{p.cantidad}</td>
                            <td>{p.stock}</td>
                            <td>
                              {p.precio != null
                                ? `$${Number(p.precio).toLocaleString('es-CO')}`
                                : '—'}
                            </td>
                            <td>
                              <button
                                className={styles.btnDelete}
                                onClick={() => setDeleteProdTarget(p)}
                              >
                                Quitar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal crear/editar kit ── */}
      {kitModalOpen && (
        <div className={styles.overlay} onClick={closeKitModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingKit ? 'Editar kit' : 'Nuevo kit'}
              </h2>
              <button className={styles.btnClose} onClick={closeKitModal}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleKitSubmit}>
              <div className={styles.field}>
                <label className={styles.label}>Nombre *</label>
                <input
                  className={styles.input}
                  name="nombre"
                  value={kitForm.nombre}
                  onChange={(e) => setKitForm((p) => ({ ...p, nombre: e.target.value }))}
                  placeholder="Nombre del kit"
                  autoComplete="off"
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Descripción</label>
                <input
                  className={styles.input}
                  name="descripcion"
                  value={kitForm.descripcion}
                  onChange={(e) => setKitForm((p) => ({ ...p, descripcion: e.target.value }))}
                  placeholder="Descripción opcional"
                  autoComplete="off"
                />
              </div>
              {kitFormError && <p className={styles.formError}>{kitFormError}</p>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeKitModal} disabled={savingKit}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={savingKit}>
                  {savingKit ? 'Guardando…' : editingKit ? 'Guardar cambios' : 'Crear kit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal agregar producto al kit ── */}
      {addProdModalOpen && (
        <div className={styles.overlay} onClick={closeAddProd}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Agregar producto al kit</h2>
              <button className={styles.btnClose} onClick={closeAddProd}>✕</button>
            </div>
            <form className={styles.form} onSubmit={handleAddProd}>
              <div className={styles.field}>
                <label className={styles.label}>Producto *</label>
                <select
                  className={styles.input}
                  value={addProdForm.productoId}
                  onChange={(e) => setAddProdForm((p) => ({ ...p, productoId: e.target.value }))}
                >
                  <option value="">Selecciona un producto…</option>
                  {availableProducts.map((p) => (
                    <option key={p.productoId} value={p.productoId}>
                      {p.nombre} (stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Cantidad *</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1"
                  value={addProdForm.cantidad}
                  onChange={(e) => setAddProdForm((p) => ({ ...p, cantidad: e.target.value }))}
                />
              </div>
              {addProdError && <p className={styles.formError}>{addProdError}</p>}
              <div className={styles.modalFooter}>
                <button type="button" className={styles.btnSecondary} onClick={closeAddProd} disabled={savingProd}>
                  Cancelar
                </button>
                <button type="submit" className={styles.btnPrimary} disabled={savingProd}>
                  {savingProd ? 'Agregando…' : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar kit ── */}
      {deleteKitTarget && (
        <div className={styles.overlay} onClick={() => setDeleteKitTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Eliminar kit</h2>
              <button className={styles.btnClose} onClick={() => setDeleteKitTarget(null)}>✕</button>
            </div>
            <p className={styles.deleteMsg}>
              ¿Estás seguro de que deseas eliminar <strong>{deleteKitTarget.nombre}</strong>?
              Se eliminarán también todas sus asociaciones de productos. Esta acción no se puede deshacer.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteKitTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className={styles.btnDanger} onClick={handleDeleteKit} disabled={deleting}>
                {deleting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar quitar producto del kit ── */}
      {deleteProdTarget && (
        <div className={styles.overlay} onClick={() => setDeleteProdTarget(null)}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>Quitar producto</h2>
              <button className={styles.btnClose} onClick={() => setDeleteProdTarget(null)}>✕</button>
            </div>
            <p className={styles.deleteMsg}>
              ¿Quitar <strong>{deleteProdTarget.nombre}</strong> del kit <strong>{selectedKit?.nombre}</strong>?
              El stock del kit se recalculará automáticamente.
            </p>
            <div className={styles.modalFooter}>
              <button className={styles.btnSecondary} onClick={() => setDeleteProdTarget(null)} disabled={deleting}>
                Cancelar
              </button>
              <button className={styles.btnDanger} onClick={handleRemoveProd} disabled={deleting}>
                {deleting ? 'Quitando…' : 'Quitar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}