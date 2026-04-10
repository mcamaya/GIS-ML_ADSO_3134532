import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import styles from './Layout.module.css';
import logo from '../../assets/GIS_ML_Logo_Small_White.png';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/inventory', label: 'Inventario' },
  { to: '/kits', label: 'Kits' },
  { to: '/settings', label: 'Configuración' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className={styles.wrapper}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
            <img src={logo} alt="GIS-ML" className={styles.logoImg} />
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `${styles.navItem} ${isActive ? styles.navItemActive : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.footer}>
          <p className={styles.userName}>{user?.nombre}</p>
          <button className={styles.logoutButton} onClick={handleLogout}>
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}