import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row, Col, Typography, Statistic, Button, Table, Tag, Space, Skeleton, Empty
} from 'antd';
import {
  FileAddOutlined, UnorderedListOutlined, TeamOutlined,
  FileTextOutlined, RiseOutlined, CheckCircleOutlined, ClockCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import { estadisticasApi } from '@/infrastructure/api/services';

const { Title, Text } = Typography;

const estadoConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  EN_PROCESO:  { color: '#6d28d9', label: 'En Proceso',  icon: <ClockCircleOutlined /> },
  COMPLETADA:  { color: '#15803d', label: 'Completada',  icon: <CheckCircleOutlined /> },
  ARCHIVADA:   { color: '#595959', label: 'Archivada',   icon: <FileTextOutlined /> },
  CANCELADA:   { color: '#b91c1c', label: 'Cancelada',   icon: <CloseCircleOutlined /> },
};

const resultadoConfig: Record<string, { color: string; label: string }> = {
  PENDIENTE:   { color: '#d97706', label: 'Pendiente' },
  APROBADO:    { color: '#15803d', label: 'Aprobado' },
  RECHAZADO:   { color: '#b91c1c', label: 'Rechazado' },
  CONDICIONAL: { color: '#1677ff', label: 'Condicional' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    estadisticasApi.dashboard()
      .then((res) => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const statsCards = [
    {
      title: 'Total Entrevistas',
      value: data?.totales?.totalEntrevistas ?? 0,
      icon: <FileTextOutlined style={{ fontSize: 24, color: '#1677ff' }} />,
      color: '#1677ff',
      bg: 'rgba(22,119,255,0.08)',
    },
    {
      title: 'Hoy',
      value: data?.totales?.entrevistasHoy ?? 0,
      icon: <ClockCircleOutlined style={{ fontSize: 24, color: '#15803d' }} />,
      color: '#15803d',
      bg: 'rgba(82,196,26,0.08)',
    },
    {
      title: 'Este Mes',
      value: data?.totales?.entrevistasMes ?? 0,
      icon: <RiseOutlined style={{ fontSize: 24, color: '#d97706' }} />,
      color: '#d97706',
      bg: 'rgba(217,119,6,0.08)',
    },
    {
      title: 'Entrevistadores',
      value: data?.totales?.entrevistadoresActivos ?? 0,
      icon: <TeamOutlined style={{ fontSize: 24, color: '#6d28d9' }} />,
      color: '#6d28d9',
      bg: 'rgba(124,58,237,0.08)',
    },
  ];

  const columnsRecientes = [
    {
      title: 'Candidato',
      render: (_: any, r: any) => (
        <div>
          <Text strong style={{ color: '#262626', fontSize: 13 }}>
            {r.datos_personales ? `${r.datos_personales.nombres} ${r.datos_personales.apellidos}` : '—'}
          </Text>
          <br />
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            {r.datos_personales?.cargo_aplicar || 'Sin cargo'}
          </Text>
        </div>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      render: (estado: string) => {
        const cfg = estadoConfig[estado] || { color: '#595959', label: estado, icon: null };
        return (
          <Tag style={{
            background: `${cfg.color}15`, color: cfg.color,
            border: `1px solid ${cfg.color}40`, borderRadius: 6,
            fontSize: 11, fontWeight: 500,
          }}>
            {cfg.icon} {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Resultado',
      render: (_: any, r: any) => {
        const res = r.validaciones?.resultado_general;
        if (!res) return <Text style={{ color: '#bfbfbf', fontSize: 12 }}>—</Text>;
        const cfg = resultadoConfig[res] || { color: '#595959', label: res };
        return (
          <Tag style={{
            background: `${cfg.color}15`, color: cfg.color,
            border: `1px solid ${cfg.color}40`, borderRadius: 6,
            fontSize: 11, fontWeight: 500,
          }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: '',
      render: (_: any, r: any) => (
        <Button size="small" type="link" onClick={() => navigate(`/entrevistas/${r.id}`)}
          style={{ color: '#1677ff', fontSize: 12 }}>
          Ver detalle →
        </Button>
      ),
    },
  ];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header">
        <div>
          <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
            Dashboard
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
            Resumen general del sistema de entrevistas
          </Text>
        </div>
        <Button
          type="primary"
          icon={<FileAddOutlined />}
          className="action-btn-primary"
          onClick={() => navigate('/entrevistas/nueva')}
          style={{ height: 38, fontWeight: 600 }}
        >
          Nueva Entrevista
        </Button>
      </div>

      {/* Stats cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statsCards.map((card, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            {loading ? (
              <Skeleton active paragraph={{ rows: 2 }} style={{ background: '#ffffff', borderRadius: 12, padding: 20 }} />
            ) : (
              <div className="stat-card" style={{ cursor: 'default' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <Text style={{ fontSize: 12, color: '#8c8c8c', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      {card.title}
                    </Text>
                    <Statistic
                      value={card.value}
                      valueStyle={{ color: '#262626', fontSize: 32, fontWeight: 700, lineHeight: 1.1, marginTop: 6 }}
                    />
                  </div>
                  <div style={{
                    width: 48, height: 48, borderRadius: 12,
                    background: card.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {card.icon}
                  </div>
                </div>
              </div>
            )}
          </Col>
        ))}
      </Row>

      {/* Acciones rápidas + recientes */}
      <Row gutter={[16, 16]}>
        {/* Acciones rápidas */}
        <Col xs={24} lg={7}>
          <div className="app-card" style={{ padding: '20px 20px 16px' }}>
            <Text className="section-title">Acciones Rápidas</Text>
            <Space direction="vertical" style={{ width: '100%', marginTop: 12 }} size={8}>
              {[
                { icon: <FileAddOutlined />,       label: 'Nueva Entrevista',     path: '/entrevistas/nueva', color: '#1677ff' },
                { icon: <UnorderedListOutlined />, label: 'Ver Entrevistas',      path: '/entrevistas',       color: '#15803d' },
                { icon: <TeamOutlined />,          label: 'Entrevistadores',      path: '/entrevistadores',   color: '#6d28d9' },
              ].map((action, i) => (
                <Button
                  key={i}
                  block
                  onClick={() => navigate(action.path)}
                  icon={action.icon}
                  style={{
                    background: '#fafafa', border: '1px solid #f0f0f0',
                    color: action.color, textAlign: 'left', height: 42,
                    fontWeight: 500, display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </Space>
          </div>
        </Col>

        {/* Entrevistas recientes */}
        <Col xs={24} lg={17}>
          <div className="app-card" style={{ padding: '20px 20px 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text className="section-title" style={{ marginBottom: 0 }}>Entrevistas Recientes</Text>
              <Button type="link" size="small" onClick={() => navigate('/entrevistas')}
                style={{ color: '#1677ff', fontSize: 12 }}>
                Ver todas →
              </Button>
            </div>
            {loading ? (
              <Skeleton active paragraph={{ rows: 4 }} />
            ) : data?.recientes?.length > 0 ? (
              <Table
                dataSource={data.recientes}
                columns={columnsRecientes}
                rowKey="id"
                pagination={false}
                size="small"
                style={{ background: 'transparent' }}
              />
            ) : (
              <Empty description={<Text style={{ color: '#8c8c8c' }}>No hay entrevistas registradas</Text>} style={{ padding: '32px 0' }} />
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}