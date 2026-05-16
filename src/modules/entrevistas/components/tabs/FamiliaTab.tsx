// FamiliaTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, Space, App, Table, Popconfirm, Typography } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;

interface Miembro {
  key: string;
  tipo_parentesco: string;
  nombres: string;
  edad?: number;
  ocupacion?: string;
  celular?: string;
}

interface Props { entrevistaId: number; data: any[]; onSaved: () => void; }

export default function FamiliaTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [miembros, setMiembros] = useState<Miembro[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.length > 0) {
      setMiembros(data.map((m, i) => ({ ...m, key: `m-${i}` })));
    }
  }, [data]);

  const addMiembro = () => {
    setMiembros((prev) => [...prev, { key: `m-${Date.now()}`, tipo_parentesco: '', nombres: '' }]);
  };

  const updateMiembro = (key: string, field: keyof Miembro, value: any) => {
    setMiembros((prev) => prev.map((m) => m.key === key ? { ...m, [field]: value } : m));
  };

  const removeMiembro = (key: string) => {
    setMiembros((prev) => prev.filter((m) => m.key !== key));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await entrevistasApi.saveFamilia(entrevistaId, miembros);
      message.success('Información familiar guardada');
      onSaved();
    } catch { message.error('Error al guardar familia'); }
    finally { setSaving(false); }
  };

  const columns = [
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const }}>Parentesco</Text>,
      key: 'tipo_parentesco',
      width: 140,
      render: (_: any, r: Miembro) => (
        <Select value={r.tipo_parentesco} onChange={(v) => updateMiembro(r.key, 'tipo_parentesco', v)} style={{ width: '100%' }} size="small">
          {['Padre','Madre','Cónyuge','Hijo/a','Hermano/a','Abuelo/a','Otro'].map((p) => (
            <Select.Option key={p} value={p}>{p}</Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const }}>Nombre Completo</Text>,
      key: 'nombres',
      render: (_: any, r: Miembro) => (
        <Input value={r.nombres} onChange={(e) => updateMiembro(r.key, 'nombres', e.target.value)} placeholder="Nombre completo" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const }}>Edad</Text>,
      key: 'edad',
      width: 80,
      render: (_: any, r: Miembro) => (
        <Input type="number" value={r.edad} onChange={(e) => updateMiembro(r.key, 'edad', Number(e.target.value))} size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const }}>Ocupación</Text>,
      key: 'ocupacion',
      render: (_: any, r: Miembro) => (
        <Input value={r.ocupacion} onChange={(e) => updateMiembro(r.key, 'ocupacion', e.target.value)} placeholder="Cargo/empresa" size="small" />
      ),
    },
    {
      title: <Text style={{ fontSize: 11, color: '#6e7681', textTransform: 'uppercase' as const }}>Celular</Text>,
      key: 'celular',
      width: 140,
      render: (_: any, r: Miembro) => (
        <Input value={r.celular} onChange={(e) => updateMiembro(r.key, 'celular', e.target.value)} placeholder="0999..." size="small" />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: any, r: Miembro) => (
        <Popconfirm title="¿Eliminar este miembro?" onConfirm={() => removeMiembro(r.key)} okText="Sí" cancelText="No">
          <Button danger size="small" icon={<DeleteOutlined />} type="text" />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>Registra la composición familiar del candidato</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={addMiembro}
          style={{ background: 'rgba(22,119,255,0.1)', border: '1px solid rgba(22,119,255,0.2)', color: '#58a6ff' }}>
          Agregar miembro
        </Button>
      </div>
      <Table dataSource={miembros} columns={columns} rowKey="key" pagination={false} size="small" style={{ marginBottom: 20 }} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Familia
        </Button>
      </div>
    </div>
  );
}
