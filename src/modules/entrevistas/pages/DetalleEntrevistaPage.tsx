import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography, Button, Tabs, Space, Tag, Avatar, Spin, App,
} from 'antd';
import {
  ArrowLeftOutlined, UserOutlined, FilePdfOutlined, SaveOutlined,
} from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';
import DatosPersonalesTab from '../components/tabs/DatosPersonalesTab';
import FamiliaTab from '../components/tabs/FamiliaTab';
import EstudiosTab from '../components/tabs/EstudiosTab';
import FinanzasTab from '../components/tabs/FinanzasTab';
import HistorialLaboralTab from '../components/tabs/HistorialLaboralTab';
import DrogasAlcoholTab from '../components/tabs/DrogasAlcoholTab';
import JudicialTab from '../components/tabs/JudicialTab';
import InfiltracionTab from '../components/tabs/InfiltracionTab';
import ValidacionesTab from '../components/tabs/ValidacionesTab';
import { generarPDFEntrevista } from '@/shared/utils/pdf';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const estadoMap: Record<string, { color: string; label: string }> = {
  EN_PROCESO:  { color: '#a78bfa', label: 'En Proceso' },
  COMPLETADA:  { color: '#3fb950', label: 'Completada' },
  ARCHIVADA:   { color: '#8b949e', label: 'Archivada'  },
  CANCELADA:   { color: '#f85149', label: 'Cancelada'  },
};

export default function DetalleEntrevistaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [entrevista, setEntrevista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('datos_personales');

  const loadEntrevista = async () => {
    try {
      const res = await entrevistasApi.getById(Number(id));
      setEntrevista(res.data.data);
    } catch { message.error('Error al cargar la entrevista'); navigate('/entrevistas'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadEntrevista(); }, [id]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  if (!entrevista) return null;

  const estadoCfg = estadoMap[entrevista.estado] || { color: '#8b949e', label: entrevista.estado };
  const candidato = entrevista.datos_personales;

  const tabItems = [
    { key: 'datos_personales',   label: '👤 Datos Personales',   children: <DatosPersonalesTab  entrevistaId={Number(id)} data={entrevista.datos_personales} onSaved={loadEntrevista} /> },
    { key: 'familia',            label: '👨‍👩‍👧 Familia',             children: <FamiliaTab          entrevistaId={Number(id)} data={entrevista.familia}          onSaved={loadEntrevista} /> },
    { key: 'estudios',           label: '🎓 Estudios',            children: <EstudiosTab         entrevistaId={Number(id)} data={entrevista.estudios}          onSaved={loadEntrevista} /> },
    { key: 'finanzas',           label: '💰 Finanzas',            children: <FinanzasTab         entrevistaId={Number(id)} data={entrevista.finanzas}           onSaved={loadEntrevista} /> },
    { key: 'historial_laboral',  label: '💼 Historial Laboral',  children: <HistorialLaboralTab entrevistaId={Number(id)} data={entrevista.historial_laboral}  onSaved={loadEntrevista} /> },
    { key: 'drogas_alcohol',     label: '🔬 Drogas / Alcohol',    children: <DrogasAlcoholTab    entrevistaId={Number(id)} data={entrevista.drogas_alcohol}     onSaved={loadEntrevista} /> },
    { key: 'judicial',           label: '⚖️ Judicial',             children: <JudicialTab         entrevistaId={Number(id)} data={entrevista.judicial}           onSaved={loadEntrevista} /> },
    { key: 'infiltracion',       label: '🔍 Infiltración',         children: <InfiltracionTab     entrevistaId={Number(id)} data={entrevista.infiltracion}       onSaved={loadEntrevista} /> },
    { key: 'validaciones',       label: '✅ Validaciones',         children: <ValidacionesTab     entrevistaId={Number(id)} data={entrevista.validaciones}       onSaved={loadEntrevista} /> },
  ];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Space size={12} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/entrevistas')}
            style={{ background: '#21262d', border: '1px solid #30363d', color: '#8b949e' }}
          />
          <div>
            <Space size={10} align="center">
              <Title level={3} style={{ color: '#e6edf3', margin: 0, fontWeight: 700, fontSize: 22 }}>
                {candidato ? `${candidato.nombres} ${candidato.apellidos}` : 'Nueva Entrevista'}
              </Title>
              <Tag style={{
                background: `${estadoCfg.color}1a`, color: estadoCfg.color,
                border: `1px solid ${estadoCfg.color}4d`, borderRadius: 6,
                fontSize: 11, fontWeight: 500,
              }}>
                {estadoCfg.label}
              </Tag>
            </Space>
            <Text style={{ color: '#6e7681', fontSize: 12 }}>
              {entrevista.codigo} · {new Date(entrevista.fecha_entrevista).toLocaleDateString('es-ES')}
            </Text>
          </div>
        </Space>

        {/* Entrevistadores + acciones */}
        <Space size={12} align="center" wrap>
          <Space size={6}>
            {entrevista.entrevistadores.map((ee: any) => (
              <Space key={ee.entrevistadorId} size={4} align="center" style={{
                background: 'rgba(22,119,255,0.08)', borderRadius: 8,
                padding: '4px 10px', border: '1px solid rgba(22,119,255,0.15)',
              }}>
                {ee.entrevistador.fotografia ? (
                  <Avatar size={20} src={`${API_URL}${ee.entrevistador.fotografia}`} />
                ) : (
                  <Avatar size={20} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                )}
                <Text style={{ color: '#58a6ff', fontSize: 12 }}>
                  {ee.entrevistador.nombre_completo.split(' ')[0]}
                </Text>
              </Space>
            ))}
          </Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => generarPDFEntrevista(entrevista)}
            style={{ background: 'rgba(63,185,80,0.1)', border: '1px solid rgba(63,185,80,0.2)', color: '#3fb950', height: 38 }}
          >
            Generar PDF
          </Button>
        </Space>
      </div>

      {/* Tabs de secciones */}
      <div className="interview-tabs">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="small"
          style={{ marginBottom: 0 }}
        />
      </div>
    </div>
  );
}
