import { useEffect, useState } from 'react';
import { Button, Input, Select, Space, App, Table, Popconfirm, Typography, Switch } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;

interface Estudio {
  key: string;
  nivel: string;
  institucion: string;
  titulo_obtenido?: string;
  anio_inicio?: number;
  anio_fin?: number;
  estado?: string;
  verificado: boolean;
}

interface Props { entrevistaId: number; data: any[]; onSaved: () => void; }

export default function EstudiosTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [estudios, setEstudios] = useState<Estudio[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.length > 0) setEstudios(data.map((e, i) => ({ ...e, key: `e-${i}`, verificado: e.verificado ?? false })));
  }, [data]);

  const add = () => setEstudios((prev) => [...prev, { key: `e-${Date.now()}`, nivel: '', institucion: '', verificado: false }]);
  const update = (key: string, field: keyof Estudio, value: any) =>
    setEstudios((prev) => prev.map((e) => e.key === key ? { ...e, [field]: value } : e));
  const remove = (key: string) => setEstudios((prev) => prev.filter((e) => e.key !== key));

  const handleSave = async () => {
    setSaving(true);
    try {
      await entrevistasApi.saveEstudios(entrevistaId, estudios);
      message.success('Estudios guardados correctamente');
      onSaved();
    } catch { message.error('Error al guardar estudios'); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      title: 'Nivel', key: 'nivel', width: 130,
      render: (_: any, r: Estudio) => (
        <Select value={r.nivel} onChange={(v) => update(r.key, 'nivel', v)} style={{ width: '100%' }} size="small">
          {['Primaria','Secundaria','Técnico','Tecnólogo','Universidad','Postgrado','Maestría','Doctorado','Curso/Certificado'].map((n) => (
            <Select.Option key={n} value={n}>{n}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: 'Institución', key: 'institucion',
      render: (_: any, r: Estudio) => (
        <Input value={r.institucion} onChange={(e) => update(r.key, 'institucion', e.target.value)} placeholder="Nombre de la institución" size="small" />
      ),
    },
    {
      title: 'Título', key: 'titulo',
      render: (_: any, r: Estudio) => (
        <Input value={r.titulo_obtenido} onChange={(e) => update(r.key, 'titulo_obtenido', e.target.value)} placeholder="Título obtenido" size="small" />
      ),
    },
    {
      title: 'Desde', key: 'inicio', width: 80,
      render: (_: any, r: Estudio) => (
        <Input type="number" value={r.anio_inicio} onChange={(e) => update(r.key, 'anio_inicio', Number(e.target.value))} placeholder="2010" size="small" />
      ),
    },
    {
      title: 'Hasta', key: 'fin', width: 80,
      render: (_: any, r: Estudio) => (
        <Input type="number" value={r.anio_fin} onChange={(e) => update(r.key, 'anio_fin', Number(e.target.value))} placeholder="2015" size="small" />
      ),
    },
    {
      title: 'Estado', key: 'estado', width: 110,
      render: (_: any, r: Estudio) => (
        <Select value={r.estado} onChange={(v) => update(r.key, 'estado', v)} style={{ width: '100%' }} size="small">
          <Select.Option value="COMPLETO">Completo</Select.Option>
          <Select.Option value="EN_CURSO">En curso</Select.Option>
          <Select.Option value="INCOMPLETO">Incompleto</Select.Option>
        </Select>
      ),
    },
    {
      title: 'Verificado', key: 'verificado', width: 90,
      render: (_: any, r: Estudio) => (
        <Switch size="small" checked={r.verificado} onChange={(v) => update(r.key, 'verificado', v)} />
      ),
    },
    {
      title: '', key: 'del', width: 50,
      render: (_: any, r: Estudio) => (
        <Popconfirm title="¿Eliminar?" onConfirm={() => remove(r.key)} okText="Sí" cancelText="No">
          <Button danger size="small" icon={<DeleteOutlined />} type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>Historial académico y formación del candidato</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={add}
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
