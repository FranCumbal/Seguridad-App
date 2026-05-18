import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout, Menu, Avatar, Dropdown, Typography, Space, Badge, Tooltip, App
} from 'antd';
import {
  DashboardOutlined, FileAddOutlined, UnorderedListOutlined,
  TeamOutlined, SettingOutlined, LogoutOutlined, UserOutlined,
  BellOutlined, MenuFoldOutlined, MenuUnfoldOutlined, SafetyOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '@/store/authStore';

const { Sider, Header, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  { key: '/dashboard',         icon: <DashboardOutlined />,     label: 'Dashboard' },
  { key: '/entrevistas',       icon: <UnorderedListOutlined />,  label: 'Entrevistas' },
  { key: '/entrevistas/nueva', icon: <FileAddOutlined />,        label: 'Nueva Entrevista' },
  { key: '/entrevistadores',   icon: <TeamOutlined />,           label: 'Entrevistadores' },
  { key: '/configuracion',     icon: <SettingOutlined />,        label: 'Configuración' },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { usuario, logout } = useAuthStore();
  const { modal } = App.useApp();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    modal.confirm({
      title: 'Cerrar sesión',
      content: '¿Estás seguro de que deseas cerrar sesión?',
      okText: 'Sí, cerrar sesión',
      cancelText: 'Cancelar',
      okButtonProps: { danger: true },
      onOk: async () => { await logout(); navigate('/login'); },
    });
  };

  const userMenu = {
    items: [
      { key: 'profile', icon: <UserOutlined />, label: `${usuario?.nombre} ${usuario?.apellido}`, disabled: true },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogoutOutlined />, label: 'Cerrar sesión', danger: true },
    ],
    onClick: ({ key }: { key: string }) => { if (key === 'logout') handleLogout(); },
  };

  // Determinar la ruta activa
  const selectedKey = menuItems.find(
    (item) => location.pathname.startsWith(item.key) && item.key !== '/dashboard'
      ? true
      : item.key === location.pathname
  )?.key || '/dashboard';

  return (
    <Layout style={{ minHeight: '100vh', background: '#0d1117' }}>
      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        trigger={null}
        width={240}
        style={{
          background: '#0d1117',
          borderRight: '1px solid #21262d',
          position: 'fixed',
          height: '100vh',
          left: 0, top: 0, bottom: 0,
          zIndex: 100,
        }}
      >
        {/* Brand */}
        <div className="sidebar-brand" style={{ overflow: 'hidden' }}>
          <div className="sidebar-brand-logo">
            <SafetyOutlined style={{ fontSize: 18 }} />
          </div>
          {!collapsed && (
            <div className="sidebar-brand-text">
              <span className="sidebar-brand-name">Seguridad App</span>
              <span className="sidebar-brand-sub">Seguridad Empresarial</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={menuItems.map((item) => ({
            ...item,
            onClick: () => navigate(item.key),
          }))}
          style={{ background: 'transparent', border: 'none', marginTop: 8, padding: '0 8px' }}
        />

        {/* User info en bottom */}
        {!collapsed && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '12px 16px', borderTop: '1px solid #21262d',
            background: '#0d1117',
          }}>
            <Space size={8} align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
              <Space size={8}>
                <Avatar size={28} style={{ background: '#1677ff', fontSize: 12 }}>
                  {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                </Avatar>
                <div style={{ lineHeight: 1.3 }}>
                  <Text style={{ fontSize: 12, color: '#e6edf3', display: 'block', fontWeight: 500 }}>
                    {usuario?.nombre} {usuario?.apellido}
                  </Text>
                  <Text style={{ fontSize: 10, color: '#6e7681' }}>{usuario?.rol}</Text>
                </div>
              </Space>
              <Tooltip title="Cerrar sesión">
                <LogoutOutlined
                  onClick={handleLogout}
                  style={{ color: '#6e7681', cursor: 'pointer', fontSize: 14 }}
                />
              </Tooltip>
            </Space>
          </div>
        )}
      </Sider>

      {/* ── MAIN ─────────────────────────────────────────── */}
      <Layout style={{ marginLeft: collapsed ? 80 : 240, transition: 'margin-left 0.2s', background: '#0d1117' }}>
        {/* Header */}
        <Header style={{
          background: '#0d1117',
          borderBottom: '1px solid #21262d',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 99,
          height: 56,
        }}>
          <Space size={16} align="center">
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{ color: '#8b949e', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center' }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
            <Text style={{ color: '#6e7681', fontSize: 12 }}>
              {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Text>
          </Space>

          <Space size={16} align="center">
            <Badge count={0} size="small">
              <BellOutlined style={{ fontSize: 16, color: '#8b949e', cursor: 'pointer' }} />
            </Badge>
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <Space size={8} style={{ cursor: 'pointer' }}>
                <Avatar size={30} style={{ background: '#1677ff', fontSize: 12 }}>
                  {usuario?.nombre?.[0]}{usuario?.apellido?.[0]}
                </Avatar>
                <Text style={{ fontSize: 13, color: '#c9d1d9', fontWeight: 500 }}>
                  {usuario?.nombre}
                </Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ minHeight: 'calc(100vh - 56px)', overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
