import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Typography, Button, Avatar, Tag, Space, App, Spin, Input, Empty, Checkbox
} from 'antd';
import {
  ArrowLeftOutlined, ArrowRightOutlined, UserOutlined, TeamOutlined,
  CheckCircleFilled,
} from '@ant-design/icons';
import { entrevistadoresApi, entrevistasApi } from '@/infrastructure/api/services';

const { Title, Text } = Typography;
const { TextArea } = Input;
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface Entrevistador {
  id: number;
  nombre_completo: string;
  cargo: string;
  fotografia?: string;
  activo: boolean;
}

export default function NuevaEntrevistaPage() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [entrevistadores, setEntrevistadores] = useState<Entrevistador[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number[]>([]);
  const [observaciones, setObservaciones] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    entrevistadoresApi.getAll()
      .then((res) => setEntrevistadores(res.data.data.filter((e: Entrevistador) => e.activo)))
      .finally(() => setLoading(false));
  }, []);

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 3) { message.warning('Máximo 3 entrevistadores permitidos'); return prev; }
      return [...prev, id];
    });
  };

  const handleCreate = async () => {
    if (selected.length === 0) { message.error('Selecciona al menos 1 entrevistador'); return; }
    setCreating(true);
    try {
      const res = await entrevistasApi.create({ entrevistadorIds: selected, observaciones_iniciales: observaciones });
      message.success('Entrevista creada. Completar datos...');
      navigate(`/entrevistas/${res.data.data.id}`);
    } catch (err: any) {
      message.error(err?.response?.data?.message || 'Error al crear entrevista');
    } finally { setCreating(false); }
  };

  return (
    <div className="page-container fade-in-up" style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div className="page-header">
        <Space size={12} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/entrevistas')}
          />
          <div>
            <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
              Nueva Entrevista
            </Title>
            <Text style={{ color: '#8c8c8c', fontSize: 13 }}>
              Selecciona los entrevistadores para esta sesión
            </Text>
          </div>
        </Space>
      </div>

      {/* Entrevistadores seleccionados */}
      <div className="app-card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TeamOutlined style={{ color: '#1677ff', fontSize: 18 }} />
          <div>
            <Text style={{ color: '#262626', fontWeight: 600, fontSize: 15 }}>
              Entrevistadores Seleccionados
            </Text>
            <Text style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 12 }}>
              ({selected.length}/3)
            </Text>
          </div>
        </div>

        {selected.length === 0 ? (
          <div style={{
            background: '#fafafa', borderRadius: 10, padding: '20px', textAlign: 'center',
            border: '1px dashed #d9d9d9',
          }}>
            <Text style={{ color: '#bfbfbf', fontSize: 13 }}>
              No has seleccionado ningún entrevistador aún
            </Text>
          </div>
        ) : (
          <Space size={12} wrap>
            {selected.map((id, idx) => {
              const e = entrevistadores.find((x) => x.id === id);
              if (!e) return null;
              return (
                <div key={id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(22,119,255,0.06)', borderRadius: 10,
                  border: '1px solid rgba(22,119,255,0.2)', padding: '10px 14px',
                  cursor: 'pointer', transition: 'all 0.2s',
                }} onClick={() => toggleSelect(id)}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%',
                    background: '#1677ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: 'white', fontWeight: 700, flexShrink: 0,
                  }}>{idx + 1}</div>
                  {e.fotografia ? (
                    <Avatar size={32} src={`${API_URL}${e.fotografia}`} />
                  ) : (
                    <Avatar size={32} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                  )}
                  <div>
                    <Text style={{ color: '#1677ff', fontSize: 13, fontWeight: 500, display: 'block' }}>
                      {e.nombre_completo}
                    </Text>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>{e.cargo}</Text>
                  </div>
                  <CheckCircleFilled style={{ color: '#15803d', fontSize: 14, marginLeft: 4 }} />
                </div>
              );
            })}
          </Space>
        )}
      </div>

      {/* Lista de entrevistadores */}
      <div className="app-card" style={{ padding: 24, marginBottom: 20 }}>
        <Text style={{ color: '#8c8c8c', fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em', display: 'block', marginBottom: 16 }}>
          Equipo de Entrevistadores
        </Text>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : entrevistadores.length === 0 ? (
          <Empty description="No hay entrevistadores activos" />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {entrevistadores.map((e) => {
              const isSelected = selected.includes(e.id);
              return (
                <div
                  key={e.id}
                  onClick={() => toggleSelect(e.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: isSelected ? 'rgba(22,119,255,0.06)' : '#fafafa',
                    border: isSelected ? '1px solid rgba(22,119,255,0.3)' : '1px solid #f0f0f0',
                    borderRadius: 10, padding: '12px 14px', cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Checkbox checked={isSelected} style={{ flexShrink: 0 }} />
                  {e.fotografia ? (
                    <Avatar size={40} src={`${API_URL}${e.fotografia}`} />
                  ) : (
                    <Avatar size={40} icon={<UserOutlined />}
                      style={{ background: isSelected ? '#1677ff' : '#d9d9d9', flexShrink: 0 }} />
                  )}
                  <div style={{ overflow: 'hidden', minWidth: 0 }}>
                    <Text style={{
                      color: isSelected ? '#1677ff' : '#262626',
                      fontSize: 13, fontWeight: 500, display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {e.nombre_completo}
                    </Text>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>{e.cargo}</Text>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Observaciones iniciales */}
      <div className="app-card" style={{ padding: 24, marginBottom: 24 }}>
        <Text style={{ color: '#8c8c8c', fontSize: 13, fontWeight: 600, textTransform: 'uppercase',
          letterSpacing: '0.06em', display: 'block', marginBottom: 12 }}>
          Observaciones Iniciales
        </Text>
        <TextArea
          rows={3}
          placeholder="Observaciones previas a la entrevista (opcional)..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Acciones */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/entrevistas')}
          style={{ height: 40 }}
        >
          Cancelar
        </Button>
        <Button
          type="primary"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          loading={creating}
          disabled={selected.length === 0}
          onClick={handleCreate}
          className="action-btn-primary"
          style={{ height: 40, fontWeight: 600, minWidth: 180 }}
        >
          Crear e iniciar entrevista
        </Button>
      </div>
    </div>
  );
}