// src/modules/entrevistas/components/tabs/EstudiosTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, App, Table, Popconfirm, Typography, Checkbox } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';
import { PROVINCIAS_ECUADOR } from '@/shared/utils/catalogos';

const { Text } = Typography;

interface EstudioItem {
  key: string;
  id?: number;
  nivel: string;
  institucion: string;
  titulo_obtenido?: string;
  estado?: string;
  ciudad?: string;
  verificado: boolean;
  observaciones?: string;
}

interface Props {
  entrevistaId: number;
  data: any[];
  onSaved: () => void;
}

const opcionesNivel = ['Primaria', 'Secundaria', 'Técnico', 'Tecnológico', 'Universitario', 'Postgrado', 'Curso/Otros'];
const opcionesEstado = ['Graduado', 'En Curso', 'Incompleto', 'Suspendido'];

export default function EstudiosTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [estudios, setEstudios] = useState<EstudioItem[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.length > 0) {
      setEstudios(data.map((e, i) => ({ 
        ...e, 
        key: e.id ? `e-${e.id}` : `e-init-${i}`,
        verificado: e.verificado ?? false 
      })));
    }
  }, [data]);

  const addEstudio = () => {
    setEstudios((prev) => [
      ...prev, 
      { 
        key: `e-${Date.now()}-${Math.random()}`, 
        nivel: 'Primaria', 
        institucion: '', 
        titulo_obtenido: '', 
        estado: 'Graduado', 
        ciudad: undefined, 
        verificado: false, 
        observaciones: '' 
      }
    ]);
  };

  const updateEstudio = (key: string, field: keyof EstudioItem, value: any) => {
    setEstudios((prev) => prev.map((e) => e.key === key ? { ...e, [field]: value } : e));
  };

  const removeEstudio = (key: string) => {
    setEstudios((prev) => prev.filter((e) => e.key !== key));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = estudios.map(({ key, ...resto }) => resto);
      await entrevistasApi.saveEstudios(entrevistaId, payload);
      message.success('Información académica guardada');
      onSaved();
    } catch { 
      message.error('Error al guardar estudios'); 
    } finally { 
      setSaving(false); 
    }
  };

  const columns = [
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Nivel</Text>,
      key: 'nivel',
      width: 140,
      render: (_: any, r: EstudioItem) => (
        <Select value={r.nivel} onChange={(v) => updateEstudio(r.key, 'nivel', v)} style={{ width: '100%' }} size="small">
          {opcionesNivel.map((n) => (
            <Select.Option key={n} value={n}>{n}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Institución</Text>,
      key: 'institucion',
      render: (_: any, r: EstudioItem) => (
        <Input value={r.institucion} onChange={(e) => updateEstudio(r.key, 'institucion', e.target.value)} placeholder="Nombre del centro de estudios" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Título Obtenido</Text>,
      key: 'titulo_obtenido',
      render: (_: any, r: EstudioItem) => (
        <Input value={r.titulo_obtenido} onChange={(e) => updateEstudio(r.key, 'titulo_obtenido', e.target.value)} placeholder="Ej. Bachiller, Ingeniero" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Estado</Text>,
      key: 'estado',
      width: 120,
      render: (_: any, r: EstudioItem) => (
        <Select value={r.estado || undefined} placeholder="Estado" onChange={(v) => updateEstudio(r.key, 'estado', v)} style={{ width: '100%' }} size="small">
          {opcionesEstado.map((est) => (
            <Select.Option key={est} value={est}>{est}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Ciudad</Text>,
      key: 'ciudad',
      width: 160,
      render: (_: any, r: EstudioItem) => (
        <Select 
          showSearch
          value={r.ciudad || undefined} 
          placeholder="Buscar ciudad..." 
          onChange={(v) => updateEstudio(r.key, 'ciudad', v)} 
          style={{ width: '100%' }} 
          size="small"
          optionFilterProp="value" // <-- CORRECCIÓN 1: Le decimos a Antd que filtre por el 'value'
          filterOption={(input, option) =>
            // <-- CORRECCIÓN 2: Forma 100% segura (Anti-Crashes) de leer el texto ingresado
            String(option?.value ?? '').toLowerCase().includes(input.toLowerCase())
          }
        >
          {Object.entries(PROVINCIAS_ECUADOR).map(([provincia, ciudades]) => (
            <Select.OptGroup label={provincia} key={provincia}>
              {ciudades.map(ciudad => (
                <Select.Option key={`${provincia}-${ciudad}`} value={ciudad}>
                  {ciudad}
                </Select.Option>
              ))}
            </Select.OptGroup>
          ))}
        </Select>
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Verif.</Text>,
      key: 'verificado',
      width: 60,
      align: 'center' as const,
      render: (_: any, r: EstudioItem) => (
        <Checkbox checked={r.verificado} onChange={(e) => updateEstudio(r.key, 'verificado', e.target.checked)} />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' }}>Observaciones</Text>,
      key: 'observaciones',
      render: (_: any, r: EstudioItem) => (
        <Input value={r.observaciones} onChange={(e) => updateEstudio(r.key, 'observaciones', e.target.value)} placeholder="Notas internas" size="small" />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, r: EstudioItem) => (
        <Popconfirm title="¿Eliminar este registro?" onConfirm={() => removeEstudio(r.key)} okText="Sí" cancelText="No">
          <Button danger size="small" icon={<DeleteOutlined />} type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>Registra la trayectoria de estudios y formación académica del candidato</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={addEstudio}
          style={{ background: 'rgba(22,119,255,0.1)', border: '1px solid rgba(22,119,255,0.2)', color: '#58a6ff' }}>
          Agregar estudio
        </Button>
      </div>
      <Table dataSource={estudios} columns={columns} rowKey="key" pagination={false} size="small" style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Estudios
        </Button>
      </div>
    </div>
  );
}