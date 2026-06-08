import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Tabs, Space, Tag, Avatar, Spin, App } from 'antd';
import { ArrowLeftOutlined, UserOutlined, FilePdfOutlined } from '@ant-design/icons';
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
import { generarInformePDF } from '@/shared/utils/pdf';

const { Title, Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

const estadoMap: Record<string, { color: string; label: string }> = {
  EN_PROCESO:  { color: '#6d28d9', label: 'En Proceso' },
  COMPLETADA:  { color: '#15803d', label: 'Completada' },
  ARCHIVADA:   { color: '#595959', label: 'Archivada'  },
  CANCELADA:   { color: '#b91c1c', label: 'Cancelada'  },
};

export default function DetalleEntrevistaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { message } = App.useApp();
  
  const [entrevista, setEntrevista] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('datos_personales');

  // Carga silenciosa para usar después de guardar en cada pestaña
  const loadEntrevista = async () => {
    try {
      const res = await entrevistasApi.getById(Number(id));
      setEntrevista(res.data.data);
    } catch { 
      message.error('Error al cargar la entrevista'); 
      navigate('/entrevistas'); 
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialLoad = async () => {
      setLoading(true);
      try {
        const res = await entrevistasApi.getById(Number(id));
        if (isMounted) {
          setEntrevista(res.data.data);
        }
      } catch {
        if (isMounted) {
          message.error('Error al cargar la entrevista');
          navigate('/entrevistas');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initialLoad();

    // Limpieza explícita del estado al desmontar la pantalla (Fundamental para evitar datos fantasmas)
    return () => {
      isMounted = false;
      setEntrevista(null);
    };
  }, [id, navigate, message]);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <Spin size="large" />
    </div>
  );

  if (!entrevista) return null;

  const estadoCfg = estadoMap[entrevista.estado] || { color: '#595959', label: entrevista.estado };
  const candidato = entrevista.datos_personales;

  const tabItems = [
    { key: 'datos_personales',  label: '👤 Datos Personales',  children: <DatosPersonalesTab entrevistaId={Number(id)} data={entrevista.datos_personales} onSaved={loadEntrevista} /> },
    { key: 'familia',           label: '👨‍👩‍👧 Familia',            children: <FamiliaTab         entrevistaId={Number(id)} data={entrevista.familia} entrevistaData={entrevista} onSaved={loadEntrevista} /> },
    { key: 'estudios',          label: '🎓 Estudios',          children: <EstudiosTab        entrevistaId={Number(id)} data={entrevista.estudios}         onSaved={loadEntrevista} /> },
    { key: 'finanzas',          label: '💰 Finanzas',          children: <FinanzasTab        entrevistaId={Number(id)} data={entrevista.finanzas}         onSaved={loadEntrevista} /> },
    { key: 'historial_laboral', label: '💼 Historial Laboral', children: <HistorialLaboralTab entrevistaId={Number(id)} data={entrevista.historial_laboral} onSaved={loadEntrevista} /> },
    { key: 'drogas_alcohol',    label: '🔬 Drogas / Alcohol',  children: <DrogasAlcoholTab   entrevistaId={Number(id)} data={entrevista.drogas_alcohol}   onSaved={loadEntrevista} /> },
    { key: 'judicial',          label: '⚖️ Judicial',          children: <JudicialTab        entrevistaId={Number(id)} data={entrevista.judicial}         onSaved={loadEntrevista} /> },
    { key: 'infiltracion',      label: '🔍 Infiltración',      children: <InfiltracionTab    entrevistaId={Number(id)} data={entrevista.infiltracion}     onSaved={loadEntrevista} /> },
    { key: 'validaciones',      label: '✅ Validaciones',      children: <ValidacionesTab    entrevistaId={Number(id)} data={entrevista.validaciones} entrevistaData={entrevista} onSaved={loadEntrevista} /> },
  ];

  return (
    <div className="page-container fade-in-up">
      {/* Header */}
      <div className="page-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <Space size={12} align="center">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/entrevistas')}
          />
          <div>
            <Space size={10} align="center">
              <Title level={3} style={{ color: '#262626', margin: 0, fontWeight: 700, fontSize: 22 }}>
                {candidato ? `${candidato.nombres} ${candidato.apellidos}` : 'Nueva Entrevista'}
              </Title>
              <Tag style={{
                background: `${estadoCfg.color}15`, color: estadoCfg.color,
                border: `1px solid ${estadoCfg.color}40`, borderRadius: 6,
                fontSize: 11, fontWeight: 500,
              }}>
                {estadoCfg.label}
              </Tag>
            </Space>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              {entrevista.codigo} · {new Date(entrevista.fecha_entrevista).toLocaleDateString('es-ES')}
            </Text>
          </div>
        </Space>

        {/* Entrevistadores + acciones */}
        <Space size={12} align="center" wrap>
          <Space size={6}>
            {entrevista.entrevistadores.map((ee: any) => (
              <Space key={ee.entrevistadorId} size={4} align="center" style={{
                background: 'rgba(22,119,255,0.06)',
                borderRadius: 8,
                padding: '4px 10px',
                border: '1px solid rgba(22,119,255,0.15)',
              }}>
                {ee.entrevistador.fotografia ? (
                  <Avatar size={20} src={`${API_URL}${ee.entrevistador.fotografia}`} />
                ) : (
                  <Avatar size={20} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
                )}
                <Text style={{ color: '#1677ff', fontSize: 12 }}>
                  {ee.entrevistador.nombre_completo.split(' ')[0]}
                </Text>
              </Space>
            ))}
          </Space>
          <Button
            icon={<FilePdfOutlined />}
            onClick={() => generarInformePDF(entrevista)}
            style={{ background: 'rgba(82,196,26,0.08)', border: '1px solid rgba(82,196,26,0.2)', color: '#15803d', height: 38 }}
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