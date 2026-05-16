import { useEffect, useState } from 'react';
import { Button, Input, App, Typography, Switch, DatePicker, Row, Col, Popconfirm } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;

interface Trabajo {
  key: string; empresa: string; cargo: string;
  fecha_inicio: any; fecha_fin?: any; trabajo_actual: boolean;
  motivo_salida?: string; jefe_inmediato?: string;
  telefono_empresa?: string; salario?: number; verificado: boolean;
}

interface Props { entrevistaId: number; data: any[]; onSaved: () => void; }

export default function HistorialLaboralTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (data?.length > 0) {
      setTrabajos(data.map((t, i) => ({
        ...t, key: `t-${i}`,
        fecha_inicio: t.fecha_inicio ? dayjs(t.fecha_inicio) : null,
        fecha_fin: t.fecha_fin ? dayjs(t.fecha_fin) : null,
        verificado: t.verificado ?? false, trabajo_actual: t.trabajo_actual ?? false,
      })));
    }
  }, [data]);

  const add = () => {
    const key = `t-${Date.now()}`;
    setTrabajos((prev) => [...prev, { key, empresa: '', cargo: '', fecha_inicio: null, trabajo_actual: false, verificado: false }]);
    setExpandedKey(key);
  };
  const update = (key: string, field: keyof Trabajo, value: any) =>
    setTrabajos((prev) => prev.map((t) => t.key === key ? { ...t, [field]: value } : t));
  const remove = (key: string) => setTrabajos((prev) => prev.filter((t) => t.key !== key));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = trabajos.map((t) => ({
        ...t,
        fecha_inicio: t.fecha_inicio ? dayjs(t.fecha_inicio).toISOString() : null,
        fecha_fin: t.fecha_fin ? dayjs(t.fecha_fin).toISOString() : null,
        salario: t.salario ? Number(t.salario) : null,
      }));
      await entrevistasApi.saveHistorialLaboral(entrevistaId, payload);
      message.success('Historial laboral guardado');
      onSaved();
    } catch { message.error('Error al guardar historial laboral'); }
    finally { setSaving(false); }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Text style={{ color: '#8b949e', fontSize: 13 }}>Experiencia laboral del candidato (más reciente primero)</Text>
        <Button size="small" icon={<PlusOutlined />} onClick={add}
          style={{ background: 'rgba(22,119,255,0.1)', border: '1px solid rgba(22,119,255,0.2)', color: '#58a6ff' }}>
          Agregar empleo
        </Button>
      </div>

      {trabajos.map((t, idx) => (
        <div key={t.key} style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 10, marginBottom: 12, overflow: 'hidden' }}>
          <div onClick={() => setExpandedKey(expandedKey === t.key ? null : t.key)}
            style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: expandedKey === t.key ? 'rgba(22,119,255,0.06)' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(22,119,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#58a6ff' }}>{idx + 1}</div>
              <div>
                <Text style={{ color: '#e6edf3', fontWeight: 600, fontSize: 14 }}>{t.empresa || 'Nueva empresa'}</Text>
                <Text style={{ color: '#6e7681', fontSize: 12, marginLeft: 8 }}>{t.cargo || 'Sin cargo'}</Text>
              </div>
              {t.trabajo_actual && <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4, background: 'rgba(63,185,80,0.15)', color: '#3fb950', border: '1px solid rgba(63,185,80,0.3)' }}>ACTUAL</span>}
            </div>
            <Popconfirm title="¿Eliminar este empleo?" onConfirm={() => remove(t.key)} okText="Sí" cancelText="No">
              <Button danger size="small" icon={<DeleteOutlined />} type="text" onClick={(e) => e.stopPropagation()} />
            </Popconfirm>
          </div>

          {expandedKey === t.key && (
            <div style={{ padding: '16px', borderTop: '1px solid #21262d' }}>
              <Row gutter={[16, 0]}>
                <Col xs={24} md={8}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Empresa *</Text><Input value={t.empresa} onChange={(e) => update(t.key, 'empresa', e.target.value)} placeholder="Nombre de la empresa" style={{ marginBottom: 12 }} /></Col>
                <Col xs={24} md={8}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Cargo *</Text><Input value={t.cargo} onChange={(e) => update(t.key, 'cargo', e.target.value)} placeholder="Cargo desempeñado" style={{ marginBottom: 12 }} /></Col>
                <Col xs={24} md={4}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Salario ($)</Text><Input type="number" value={t.salario} onChange={(e) => update(t.key, 'salario', Number(e.target.value))} placeholder="0.00" prefix="$" style={{ marginBottom: 12 }} /></Col>
                <Col xs={24} md={4}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>¿Trabajo actual?</Text><Switch checked={t.trabajo_actual} onChange={(v) => update(t.key, 'trabajo_actual', v)} checkedChildren="Sí" unCheckedChildren="No" style={{ marginBottom: 12 }} /></Col>
                <Col xs={24} md={6}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Fecha Inicio</Text><DatePicker value={t.fecha_inicio} onChange={(v) => update(t.key, 'fecha_inicio', v)} style={{ width: '100%', marginBottom: 12 }} format="DD/MM/YYYY" /></Col>
                {!t.trabajo_actual && <Col xs={24} md={6}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Fecha Fin</Text><DatePicker value={t.fecha_fin} onChange={(v) => update(t.key, 'fecha_fin', v)} style={{ width: '100%', marginBottom: 12 }} format="DD/MM/YYYY" /></Col>}
                <Col xs={24} md={8}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Jefe Inmediato</Text><Input value={t.jefe_inmediato} onChange={(e) => update(t.key, 'jefe_inmediato', e.target.value)} placeholder="Nombre del jefe" style={{ marginBottom: 12 }} /></Col>
                <Col xs={24} md={6}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Teléfono Empresa</Text><Input value={t.telefono_empresa} onChange={(e) => update(t.key, 'telefono_empresa', e.target.value)} placeholder="04-000-0000" style={{ marginBottom: 12 }} /></Col>
                <Col xs={12} md={4}><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4 }}>Verificado</Text><Switch size="small" checked={t.verificado} onChange={(v) => update(t.key, 'verificado', v)} checkedChildren="Sí" unCheckedChildren="No" /></Col>
              </Row>
              {!t.trabajo_actual && (<><Text style={{ color: '#8b949e', fontSize: 12, display: 'block', marginBottom: 4, marginTop: 8 }}>Motivo de Salida</Text><Input.TextArea value={t.motivo_salida} onChange={(e) => update(t.key, 'motivo_salida', e.target.value)} rows={2} placeholder="Motivo por el que dejó el empleo..." /></>)}
            </div>
          )}
        </div>
      ))}

      {trabajos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0', background: '#1c2128', borderRadius: 10, border: '1px dashed #30363d', marginBottom: 16 }}>
          <Text style={{ color: '#484f58' }}>No hay empleos registrados. Haz clic en "Agregar empleo".</Text>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 180 }}>
          Guardar Historial Laboral
        </Button>
      </div>
    </div>
  );
}
