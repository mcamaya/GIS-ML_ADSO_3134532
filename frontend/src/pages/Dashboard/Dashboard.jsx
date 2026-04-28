import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout.jsx';
import api from '../../api/axios.js';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [kits, setKits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const [prodRes, kitsRes] = await Promise.all([
        api.get('/products'),
        api.get('/kits'),
      ]);
      setProducts(prodRes.data);
      setKits(kitsRes.data);
    } catch {
      setError('No se pudieron cargar los datos del sistema.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Métricas calculadas ── */
  const totalProductos = products.length;
  const totalKits = kits.length;
  const sinStock = products.filter((p) => p.stock === 0).length;
  const stockBajo = products.filter((p) => p.stock > 0 && p.stock <= 5).length;
  const kitsSinStock = kits.filter((k) => k.stock === 0).length;
  const valorInventario = products.reduce(
    (acc, p) => acc + (p.costo != null ? p.costo * p.stock : 0), 0
  );

  const fmt = (val) =>
    `$${Number(val).toLocaleString('es-CO', { minimumFractionDigits: 0 })}`;

  /* ── Productos críticos (stock <= 5) ── */
  const criticos = [...products]
    .filter((p) => p.stock <= 5)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 6);

  /* ── Kits con stock 0 ── */
  const kitsCriticos = kits.filter((k) => k.stock === 0).slice(0, 4);

  const statCards = [
    {
      label: 'Productos',
      value: totalProductos,
      icon: '📦',
      color: 'blue',
      action: () => navigate('/inventory'),
    },
    {
      label: 'Kits',
      value: totalKits,
      icon: '🗂️',
      color: 'blue',
      action: () => navigate('/kits'),
    },
    {
      label: 'Sin stock',
      value: sinStock,
      icon: '⚠️',
      color: sinStock > 0 ? 'red' : 'green',
      action: () => navigate('/inventory'),
    },
    {
      label: 'Stock bajo',
      value: stockBajo,
      icon: '🔶',
      color: stockBajo > 0 ? 'yellow' : 'green',
      action: () => navigate('/inventory'),
    },
    {
      label: 'Kits sin stock',
      value: kitsSinStock,
      icon: '📭',
      color: kitsSinStock > 0 ? 'red' : 'green',
      action: () => navigate('/kits'),
    },
    {
      label: 'Valor inventario',
      value: fmt(valorInventario),
      icon: '💰',
      color: 'blue',
      action: null,
    },
  ];

  return (
    <Layout>
      <div className={styles.page}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Dashboard</h1>
            <p className={styles.subtitle}>Resumen general del sistema</p>
          </div>
          <button className={styles.btnRefresh} onClick={fetchData} disabled={loading}>
            {loading ? 'Actualizando…' : '↻ Actualizar'}
          </button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        {/* ── Tarjetas de métricas ── */}
        <div className={styles.statsGrid}>
          {statCards.map((card) => (
            <div
              key={card.label}
              className={`${styles.statCard} ${styles[`statCard_${card.color}`]} ${card.action ? styles.statCardClickable : ''}`}
              onClick={card.action ?? undefined}
            >
              <span className={styles.statIcon}>{card.icon}</span>
              <div className={styles.statInfo}>
                <span className={styles.statValue}>
                  {loading ? '—' : card.value}
                </span>
                <span className={styles.statLabel}>{card.label}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Sección inferior: dos columnas ── */}
        <div className={styles.bottomGrid}>

          {/* Productos críticos */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Productos críticos</h2>
              <button className={styles.btnLink} onClick={() => navigate('/inventory')}>
                Ver todos →
              </button>
            </div>

            {loading ? (
              <p className={styles.panelEmpty}>Cargando…</p>
            ) : criticos.length === 0 ? (
              <p className={styles.panelEmpty}>✅ Todos los productos tienen stock suficiente.</p>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Stock</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {criticos.map((p) => (
                      <tr key={p.productoId}>
                        <td className={styles.cellNombre}>{p.nombre}</td>
                        <td className={styles.cellStock}>{p.stock}</td>
                        <td>
                          {p.stock === 0
                            ? <span className={`${styles.badge} ${styles.badgeDanger}`}>Sin stock</span>
                            : <span className={`${styles.badge} ${styles.badgeWarning}`}>Stock bajo</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Kits sin stock */}
          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h2 className={styles.panelTitle}>Kits sin stock</h2>
              <button className={styles.btnLink} onClick={() => navigate('/kits')}>
                Ver todos →
              </button>
            </div>

            {loading ? (
              <p className={styles.panelEmpty}>Cargando…</p>
            ) : kitsCriticos.length === 0 ? (
              <p className={styles.panelEmpty}>✅ Todos los kits tienen stock disponible.</p>
            ) : (
              <div className={styles.kitAlertList}>
                {kitsCriticos.map((k) => (
                  <div key={k.kitId} className={styles.kitAlertCard}>
                    <div className={styles.kitAlertIcon}>📭</div>
                    <div className={styles.kitAlertInfo}>
                      <span className={styles.kitAlertName}>{k.nombre}</span>
                      <span className={styles.kitAlertDesc}>{k.descripcion || 'Sin descripción'}</span>
                    </div>
                    <span className={`${styles.badge} ${styles.badgeDanger}`}>Sin stock</span>
                  </div>
                ))}
                {kitsSinStock > 4 && (
                  <p className={styles.panelMore}>
                    +{kitsSinStock - 4} kits más sin stock
                  </p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}