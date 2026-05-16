import { useEffect } from 'react';
import { Form, Input, Switch, Button, Row, Col, App, Select, Typography, Divider } from 'antd';
import { SaveOutlined, AlertOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const lbl = (t: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{t}</span>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

const nivelRiesgoColor: Record<string, { bg: string; color: string; border: string }> = {
  BAJO:    { bg: 'rgba(63,185,80,0.1)',   color: '#3fb950', border: 'rgba(63,185,80,0.3)' },
  MEDIO:   { bg: 'rgba(210,153,34,0.1)', color: '#d29922', border: 'rgba(210,153,34,0.3)' },
  ALTO:    { bg: 'rgba(248,81,73,0.1)',  color: '#f85149', border: 'rgba(248,81,73,0.3)' },
  CRITICO: { bg: 'rgba(248,81,73,0.2)',  color: '#ff6e6e', border: 'rgba(248,81,73,0.5)' },
};

export default function InfiltracionTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { vinculo_organizaciones: false, familiar_implicado: false, contacto_grupos_ilegales: false, amenaza_extorsion: false, nivel_riesgo: 'BAJO' },
  });

  useEffect(() => { if (data) reset(data); }, [data]);

  const vinculos    = watch('vinculo_organizaciones');
  const familiar    = watch('familiar_implicado');
  const contacto    = watch('contacto_grupos_ilegales');
  const amenaza     = watch('amenaza_extorsion');
  const nivelRiesgo = watch('nivel_riesgo') as string;

  const onSubmit = async (values: any) => {
    try {
      await entrevistasApi.saveInfiltracion(entrevistaId, values);
      message.success('Información de infiltración guardada');
      onSaved();
    } catch { message.error('Error al guardar información'); }
  };

  const nrCfg = nivelRiesgoColor[nivelRiesgo] || nivelRiesgoColor.BAJO;

  const SwitchBlock = ({ name, label: labelText, detailName, placeholder }: any) => {
    const active = watch(name);
    return (
      <div style={{ background: active ? 'rgba(248,81,73,0.04)' : '#1c2128', border: `1px solid ${active ? 'rgba(248,81,73,0.2)' : '#30363d'}`, borderRadius: 10, padding: 16, marginBottom: 12, transition: 'all 0.2s' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: active && detailName ? 12 : 0 }}>
          <Controller name={name} control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} />
          <Text style={{ color: active ? '#f85149' : '#e6edf3', fontSize: 13 }}>{labelText}</Text>
        </div>
        {active && detailName && (
          <Controller name={detailName} control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={2} placeholder={placeholder} />
          )} />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ background: 'rgba(248,81,73,0.06)', border: '1px solid rgba(248,81,73,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <AlertOutlined style={{ color: '#f85149' }} />
        <Text style={{ color: '#8b949e', fontSize: 12 }}>Módulo de evaluación de riesgo de infiltración de grupos ilegales. Información de máxima confidencialidad.</Text>
      </div>

      <SwitchBlock name="vinculo_organizaciones"   label="¿Tiene vínculos con organizaciones delictivas o criminales?"   detailName="tipo_organizaciones"      placeholder="Especificar tipo de organización..." />
      <SwitchBlock name="familiar_implicado"        label="¿Algún familiar tiene vínculos con grupos ilegales?"           detailName="detalle_familiar"         placeholder="Descripción del familiar y vínculo..." />
      <SwitchBlock name="contacto_grupos_ilegales"  label="¿Ha tenido contacto con grupos ilegales o narcotráfico?"       detailName="detalle_grupos"           placeholder="Describir el tipo de contacto..." />
      <SwitchBlock name="amenaza_extorsion"         label="¿Ha sido víctima de amenaza o extorsión reciente?"            detailName="detalle_amenaza"          placeholder="Describir la situación..." />

      <Divider style={{ borderColor: '#21262d', margin: '16px 0' }} />

      <Row gutter={[16, 0]}>
        <Col xs={24} md={6}>
          <Form.Item label={lbl('Nivel de Riesgo Evaluado')}>
            <Controller name="nivel_riesgo" control={control} render={({ field }) => (
              <Select {...field} style={{ width: '100%' }}>
                {['BAJO','MEDIO','ALTO','CRITICO'].map((n) => (
                  <Select.Option key={n} value={n}>
                    <span style={{ color: nivelRiesgoColor[n]?.color }}>{n}</span>
                  </Select.Option>
                ))}
              </Select>
            )} />
          </Form.Item>
          <div style={{ background: nrCfg.bg, border: `1px solid ${nrCfg.border}`, borderRadius: 8, padding: '8px 12px', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
            <Text style={{ color: nrCfg.color, fontWeight: 700, fontSize: 13 }}>Riesgo: {nivelRiesgo}</Text>
          </div>
        </Col>
        <Col xs={24} md={18}>
          <Form.Item label={lbl('Observaciones del analista')}>
            <Controller name="observaciones" control={control} render={({ field }) => <Input.TextArea {...field} rows={4} placeholder="Análisis cualitativo del riesgo de infiltración..." />} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 180 }}>
          Guardar Análisis
        </Button>
      </div>
    </form>
  );
}
