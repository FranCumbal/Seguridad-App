import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Input, Select, Table, Tag, Space, App,
  Row, Col, Tooltip, Empty,
} from 'antd';
import {
  PlusOutlined, SearchOutlined, EyeOutlined, DeleteOutlined,
  FilePdfOutlined, ReloadOutlined,
} from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';
import { generarInformePDF } from '@/shared/utils/pdf';

const { Title, Text } = Typography;
const { Option } = Select;

const estadoMap: Record<string, { color: string; label: string }> = {
  EN_PROCESO:  { color: '#6d28d9', label: 'En Proceso' },
  COMPLETADA:  { color: '#15803d', label: 'Completada' },
  ARCHIVADA:   { color: '#595959', label: 'Archivada'  },
  CANCELADA:   { color: '#b91c1c', label: 'Cancelada'  },
};
const resultadoMap: Record<string, { color: string; label: string }> = {
  PENDIENTE:   { color: '#d97706', label: 'Pendiente'   },
  APROBADO:    { color: '#15803d', label: 'Aprobado'    },
  RECHAZADO:   { color: '#b91c1c', label: 'Rechazado'   },
  CONDICIONAL: { color: '#1677ff', label: 'Condicional' },
};

function useDebounce(fn: (...args: any[]) => void, delay: number) {
  const timer = useRef<ReturnType<typeof setTimeout>>();
  return useCallback((...args: any[]) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), delay);
  }, [fn, delay]);
}

export default function EntrevistasPage() {
  const navigate = useNavigate();
  const { modal, message } = App.useApp();
  const [data, setData]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [estado, setEstado]   = useState<string | undefined>();

  const fetchEntrevistas = useCallback(async (p: number, s: string, e: string | undefined) => {
    setLoading(true);
    try {
      const res = await entrevistasApi.getAll({ search: s, estado: e, page: p, limit: 15 });
      setData(res.data.data);
      setTotal(res.data.meta.total);
    } catch { message.error('Error al cargar entrevistas'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntrevistas(1, '', undefined); }, []);

  const debouncedSearch = useDebounce((value: string) => {
    setSearch(value);
    setPage(1);
    fetchEntrevistas(1, value, estado);
  }, 400);

  const handleEstadoChange = (value: string | undefined) => {
    setEstado(value);
    setPage(1);
    fetchEntrevistas(1, search, value);
  };

  const handleDelete = (record: any) => {
    const nombre = record.datos_personales
      ? `${record.datos_personales.nombres} ${record.datos_personales.apellidos}`
      : record.codigo;
    modal.confirm({
      title: 'Eliminar entrevista',
      content: `¿Eliminar la entrevista de "${nombre}"? Esta acción es irreversible.`,
      okText: 'Eliminar',
      okButtonProps: { danger: true },
      cancelText: 'Cancelar',
      onOk: async () => {
        await entrevistasApi.delete(record.id);
        message.success('Entrevista eliminada');
        fetchEntrevistas(page, search, estado);
      },
    });
  };

  const handlePDF = async (record: any) => {
    try {
      const res = await entrevistasApi.getById(record.id);
      generarInformePDF(res.data.data);
    } catch { message.error('Error al generar PDF'); }
  };

  const columns = [
    {
      title: 'Código',
      dataIndex: 'codigo',
      width: 155,
      render: (v: string) => (
        <Text style={{ fontFamily: 'IBM Plex Mono', fontSize: 12, color: '#1677ff', fontWeight: 500 }}>{v}</Text>
      ),
    },
    {
      title: 'Candidato',
      render: (_: any, r: any) => r.datos_personales ? (
        <div>
          <Text strong style={{ color: '#262626', fontSize: 13 }}>
            {r.datos_personales.nombres} {r.datos_personales.apellidos}
          </Text>
          <br />
          <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
            CI: {r.datos_personales.cedula} · {r.datos_personales.cargo_postula || 'Sin cargo'}
          </Text>
        </div>
      ) : <Text style={{ color: '#bfbfbf', fontSize: 12 }}>Sin datos personales</Text>,
    },
    {
      title: 'Entrevistadores',
      render: (_: any, r: any) => (
        <Space size={4} wrap>
          {r.entrevistadores?.map((ee: any) => (
            <Tag key={ee.entrevistadorId} style={{
              background: 'rgba(22,119,255,0.08)', color: '#1677ff',
              border: '1px solid rgba(22,119,255,0.2)', fontSize: 11, borderRadius: 6,
            }}>
              {ee.entrevistador.nombre_completo.split(' ')[0]}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'Estado',
      dataIndex: 'estado',
      width: 130,
      render: (v: string) => {
        const cfg = estadoMap[v] || { color: '#595959', label: v };
        return (
          <Tag style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Resultado',
      width: 120,
      render: (_: any, r: any) => {
        const res = r.validaciones?.resultado_general;
        if (!res) return <Text style={{ color: '#bfbfbf', fontSize: 12 }}>—</Text>;
        const cfg = resultadoMap[res] || { color: '#595959', label: res };
        return (
          <Tag style={{ background: `${cfg.color}15`, color: cfg.color, border: `1px solid ${cfg.color}40`, borderRadius: 6, fontSize: 11, fontWeight: 500 }}>
            {cfg.label}
          </Tag>
        );
      },
    },
    {
      title: 'Fecha',
      dataIndex: 'fecha_entrevista',
      width: 105,
      render: (v: string) => (
        <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
          {new Date(v).toLocaleDateString('es-ES')}
        </Text>
      ),
    },
    {
      title: 'Acciones',
      width: 120,
      render: (_: any, r: any) => (
        <Space size={4}>
          <Tooltip title="Ver / Editar">
            <Button size="small" icon={<EyeOutlined />}
              onClick={() => navigate(`/entrevistas/${r.id}`)}
              style={{ background: 'rgba(22,119,255,0.08)', border: '1px solid rgba(22,119,255,0.2)', color: '#1677ff' }}
            />
          </Tooltip>
          <Tooltip title="Generar PDF">
            <Button size="small" icon={<FilePdfOutlined />}
              onClick={() => handlePDF(r)}
              style={{ background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.2)', color: '#15803d' }}
            />
          </Tooltip>
          <Tooltip title="Eliminar">
            <Button size="small" danger icon={<DeleteOutlined />}
              onClick={() => handleDelete(r)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div className="page-container fade-in-up">
      <div className="page-header">
        <div>
          <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
            Entrevistas
          </Title>
          <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
            {total} entrevista{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
          </Text>
        </div>
        <Button
          type="primary" icon={<PlusOutlined />} className="action-btn-primary"
          onClick={() => navigate('/entrevistas/nueva')}
          style={{ height: 38, fontWeight: 600 }}
        >
          Nueva Entrevista
        </Button>
      </div>

      {/* Filtros */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Input
            placeholder="Buscar por nombre, cédula, código..."
            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
            onChange={(e) => debouncedSearch(e.target.value)}
            style={{ height: 38 }}
            allowClear
          />
        </Col>
        <Col xs={12} md={6}>
          <Select placeholder="Filtrar por estado" style={{ width: '100%', height: 38 }}
            onChange={handleEstadoChange} allowClear>
            <Option value="EN_PROCESO">En Proceso</Option>
            <Option value="COMPLETADA">Completada</Option>
            <Option value="ARCHIVADA">Archivada</Option>
            <Option value="CANCELADA">Cancelada</Option>
          </Select>
        </Col>
        <Col xs={12} md={6}>
          <Button icon={<ReloadOutlined />} onClick={() => fetchEntrevistas(1, search, estado)}
            style={{ height: 38, width: '100%' }}>
            Actualizar
          </Button>
        </Col>
      </Row>

      <div className="app-card" style={{ padding: 0, overflow: 'hidden' }}>
        <Table
          dataSource={data} columns={columns} rowKey="id" loading={loading} size="middle"
          locale={{ emptyText: <Empty description={<Text style={{ color: '#8c8c8c' }}>Sin entrevistas registradas</Text>} style={{ padding: '32px 0' }} /> }}
          pagination={{
            current: page, total, pageSize: 15,
            onChange: (p) => { setPage(p); fetchEntrevistas(p, search, estado); },
            showSizeChanger: false,
            showTotal: (t) => <Text style={{ color: '#8c8c8c', fontSize: 12 }}>Total: {t}</Text>,
            style: { padding: '12px 16px' },
          }}
        />
      </div>
    </div>
  );
}