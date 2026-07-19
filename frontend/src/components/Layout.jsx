import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineViewGrid,
  HiOutlineUserGroup,
  HiOutlineClipboardCheck,
  HiOutlineCreditCard,
  HiOutlineSpeakerphone,
  HiOutlineChartBar,
  HiOutlineChatAlt2,
  HiOutlineCog,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineX,
} from 'react-icons/hi';
import { RiWhatsappLine } from 'react-icons/ri';
import { useAuth } from '../hooks/useAuth';
import { useState } from 'react';
import './Layout.css';

const navItems = [
  { path: '/dashboard', icon: HiOutlineViewGrid, label: 'Dashboard' },
  { path: '/students', icon: HiOutlineUserGroup, label: 'Students' },
  { path: '/attendance', icon: HiOutlineClipboardCheck, label: 'Attendance' },
  { path: '/membership', icon: HiOutlineCreditCard, label: 'Membership' },
  { path: '/marketing', icon: HiOutlineSpeakerphone, label: 'Marketing' },
  { path: '/reports', icon: HiOutlineChartBar, label: 'Reports' },
  { path: '/ai-assistant', icon: HiOutlineChatAlt2, label: 'AI Assistant' },
  { path: '/whatsapp', icon: RiWhatsappLine, label: 'WhatsApp' },
  { path: '/settings', icon: HiOutlineCog, label: 'Settings' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'owner': return 'badge badge-gold';
      case 'manager': return 'badge badge-purple';
      case 'receptionist': return 'badge badge-info';
      case 'trainer': return 'badge badge-success';
      default: return 'badge';
    }
  };

  return (
    <div className="layout">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="sidebar-logo-icon">💃</span>
            <div>
              <h2 className="sidebar-title">
                <span className="text-gradient-gold">Dance</span>Flow
              </h2>
              <p className="sidebar-version">CRM v1.0</p>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <HiOutlineX />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="sidebar-link-icon" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User profile */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{user?.name}</span>
              <span className={getRoleBadgeClass(user?.role)}>
                {user?.role}
              </span>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout} title="Logout">
            <HiOutlineLogout />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        <header className="topbar">
          <button
            className="topbar-menu-btn"
            onClick={() => setSidebarOpen(true)}
          >
            <HiOutlineMenu />
          </button>
          <div className="topbar-right">
            <span className="topbar-greeting">
              Welcome, <strong>{user?.name?.split(' ')[0]}</strong>
            </span>
          </div>
        </header>
        <div className="main-body">
          {children}
        </div>
      </main>
    </div>
  );
}
