import { useEffect, useState } from 'react';
import { Button, Input, App, Typography, Switch, DatePicker, Row, Col, Popconfirm, Card, Select, Radio } from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input;

interface Trabajo {
  key: string;
  id?: number;
  empresa: string;
  cargo: string;
  fecha_inicio: any;
  fecha_fin?: any;
  trabajo_actual: boolean;
  motivo_salida?: string;
  salario?: number;
  certificado_laboral: boolean;
}

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

const opcionesVacante = ['Familiar', 'Amigo', 'Redes Sociales', 'Vecinos', 'Internet', 'Otros'];

export default function HistorialLaboralTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();

  const [medioVacante, setMedioVacante] = useState<string | undefined>(undefined);
  const [actoIlicito, setActoIlicito] = useState<boolean>(false);
  const [detalleGrave, setDetalleGrave] = useState<string>('');
  const [observaciones, setObservaciones] = useState<string>('');
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [saving, setSaving] = useState(false);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      setMedioVacante(data.medio_vacante || undefined);
      setActoIlicito(data.acto_ilicito ?? false);
      setDetalleGrave(data.detalle_grave || '');
      setObservaciones(data.observaciones || '');

      if (data.experiencias?.length > 0) {
        setTrabajos(data.experiencias.map((t: any, i: number) => ({
          ...t,
          key: t.id ? `t-${t.id}` : `t-${i}`,
          fecha_inicio: t.fecha_inicio ? dayjs(t.fecha_inicio) : null,
          fecha_fin: t.fecha_fin ? dayjs(t.fecha_fin) : null,
          certificado_laboral: t.certificado_laboral ?? false,
          trabajo_actual: t.trabajo_actual ?? false,
        })));
      }
    }
  }, [data]);

  const add = () => {
    const key = `t-${Date.now()}`;
    setTrabajos((prev) => [...prev, { key, empresa: '', cargo: '', fecha_inicio: null, trabajo_actual: false, certificado_laboral: false }]);
    setExpandedKey(key);
  };

  const update = (key: string, field: keyof Trabajo, value: any) =>
    setTrabajos((prev) => prev.map((t) => t.key === key ? { ...t, [field]: value } : t));

  const remove = (key: string) => setTrabajos((prev) => prev.filter((t) => t.key !== key));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        medio_vacante: medioVacante,
        acto_ilicito: actoIlicito,
        detalle_grave: detalleGrave,
        observaciones: observaciones,
        experiencias: trabajos.map((t) => ({
          id: t.id,
          empresa: t.empresa,
          cargo: t.cargo,
          trabajo_actual: t.trabajo_actual,
          motivo_salida: t.trabajo_actual ? null : t.motivo_salida,
          salario: t.salario ? Number(t.salario) : null,
          certificado_laboral: t.certificado_laboral,
          fecha_inicio: t.fecha_inicio ? dayjs(t.fecha_inicio).toISOString() : null,
          fecha_fin: (!t.trabajo_actual && t.fecha_fin) ? dayjs(t.fecha_fin).toISOString() : null,
        }))
      };

      await entrevistasApi.saveHistorialLaboral(entrevistaId, payload as any);
      message.success('Historial laboral guardado exitosamente');
      onSaved();
    } catch {
      message.error('Error al guardar historial laboral');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* SECCIÓN 1: ANTECEDENTES GENERALES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#595959' }}>Antecedentes Generales</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24} md={12}>
            <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Se enteró de esta vacante por medio de:
            </Text>
            <Select className="w-full" placeholder="Seleccione medio" value={medioVacante} onChange={setMedioVacante} size="small" style={{ width: '100%' }}>
              {opcionesVacante.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
            </Select>
          </Col>
          <Col span={24} md={12}>
            <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ¿Cometió usted algún acto ilícito en alguno de sus trabajos?
            </Text>
            <Radio.Group value={actoIlicito} onChange={e => setActoIlicito(e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24}>
            <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              ¿Qué es lo más grave que usted ha realizado en sus trabajos anteriores?
            </Text>
            <TextArea rows={2} placeholder="Escriba la declaración del evaluado..." value={detalleGrave} onChange={e => setDetalleGrave(e.target.value)} />
          </Col>
        </Row>
      </Card>

      {/* SECCIÓN 2: EXPERIENCIA LABORAL */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ color: '#595959', fontSize: 13 }}>Experiencia laboral del candidato (más reciente primero)</Text>
          <Button size="small" icon={<PlusOutlined />} onClick={add}
            style={{ background: 'rgba(22,119,255,0.08)', border: '1px solid rgba(22,119,255,0.2)', color: '#1677ff' }}>
            Agregar empleo
          </Button>
        </div>

        {trabajos.map((t, idx) => (
          <div key={t.key} style={{
            background: '#fafafa',
            border: '1px solid #e8e8e8',
            borderRadius: 10, marginBottom: 12, overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}>

            {/* CABECERA DEL ACORDEÓN */}
            <div onClick={() => setExpandedKey(expandedKey === t.key ? null : t.key)}
              style={{
                padding: '12px 16px', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: expandedKey === t.key ? 'rgba(22,119,255,0.05)' : 'transparent',
                borderBottom: expandedKey === t.key ? '1px solid #e8e8e8' : 'none',
              }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 24, height: 24, borderRadius: 6,
                  background: 'rgba(22,119,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 700, color: '#1677ff',
                }}>{idx + 1}</div>
                <div>
                  <Text style={{ color: '#262626', fontWeight: 600, fontSize: 14 }}>{t.empresa || 'Nueva empresa'}</Text>
                  <Text style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>{t.cargo || 'Sin cargo'}</Text>
                </div>
                {t.trabajo_actual && (
                  <span style={{
                    fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 4,
                    background: 'rgba(82,196,26,0.1)', color: '#15803d',
                    border: '1px solid rgba(82,196,26,0.3)',
                  }}>ACTUAL</span>
                )}
              </div>
              <Popconfirm title="¿Eliminar este empleo?" onConfirm={() => remove(t.key)} okText="Sí" cancelText="No">
                <Button danger size="small" icon={<DeleteOutlined />} type="text" onClick={(e) => e.stopPropagation()} />
              </Popconfirm>
            </div>

            {/* CONTENIDO DESPLEGABLE */}
            {expandedKey === t.key && (
              <div style={{ padding: '16px' }}>
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={8}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>Empresa *</Text>
                    <Input value={t.empresa} onChange={(e) => update(t.key, 'empresa', e.target.value)} placeholder="Nombre de la empresa" style={{ marginBottom: 12 }} />
                  </Col>
                  <Col xs={24} md={8}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>Cargo *</Text>
                    <Input value={t.cargo} onChange={(e) => update(t.key, 'cargo', e.target.value)} placeholder="Cargo desempeñado" style={{ marginBottom: 12 }} />
                  </Col>
                  <Col xs={24} md={4}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>Salario ($)</Text>
                    <Input type="number" value={t.salario} onChange={(e) => update(t.key, 'salario', e.target.value ? Number(e.target.value) : undefined)} placeholder="0.00" prefix="$" style={{ marginBottom: 12 }} />
                  </Col>
                  <Col xs={24} md={4}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>¿Trabajo actual?</Text>
                    <Switch checked={t.trabajo_actual} onChange={(v) => { update(t.key, 'trabajo_actual', v); if (v) update(t.key, 'fecha_fin', null); }} checkedChildren="Sí" unCheckedChildren="No" style={{ marginBottom: 12 }} />
                  </Col>

                  <Col xs={24} md={6}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>Fecha Inicio</Text>
                    <DatePicker value={t.fecha_inicio} onChange={(v) => update(t.key, 'fecha_inicio', v)} style={{ width: '100%', marginBottom: 12 }} format="DD/MM/YYYY" />
                  </Col>
                  {!t.trabajo_actual && (
                    <Col xs={24} md={6}>
                      <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>Fecha Fin</Text>
                      <DatePicker value={t.fecha_fin} onChange={(v) => update(t.key, 'fecha_fin', v)} style={{ width: '100%', marginBottom: 12 }} format="DD/MM/YYYY" />
                    </Col>
                  )}

                  <Col xs={24} md={8}>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4 }}>¿Cuenta con certificado laboral?</Text>
                    <Switch checked={t.certificado_laboral} onChange={(v) => update(t.key, 'certificado_laboral', v)} checkedChildren="Sí" unCheckedChildren="No" style={{ marginBottom: 12 }} />
                  </Col>
                </Row>

                {!t.trabajo_actual && (
                  <>
                    <Text style={{ color: '#595959', fontSize: 12, display: 'block', marginBottom: 4, marginTop: 4 }}>Motivo de Salida</Text>
                    <TextArea value={t.motivo_salida} onChange={(e) => update(t.key, 'motivo_salida', e.target.value)} rows={2} placeholder="Motivo por el que dejó el empleo..." />
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {trabajos.length === 0 && (
          <div style={{
            textAlign: 'center', padding: '32px 0',
            background: '#fafafa', borderRadius: 10,
            border: '1px dashed #d9d9d9', marginBottom: 16,
          }}>
            <Text style={{ color: '#bfbfbf' }}>No hay empleos registrados. Haz clic en "Agregar empleo".</Text>
          </div>
        )}
      </div>

      {/* SECCIÓN 3: OBSERVACIONES */}
      <Card size="small">
        <Text style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Observaciones o Verificaciones del Entrevistador
        </Text>
        <TextArea rows={2} placeholder="Notas complementarias sobre el historial y las referencias..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 180 }}>
          Guardar Historial Laboral
        </Button>
      </div>
    </div>
  );
}