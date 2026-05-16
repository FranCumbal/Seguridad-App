import { useEffect } from 'react';
import { Form, Input, Switch, Button, Row, Col, App, Divider, Typography } from 'antd';
import { SaveOutlined, SafetyOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const lbl = (t: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{t}</span>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

export default function JudicialTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { antecedentes_penales: false, procesos_judiciales: false, detencion_previa: false, demandas_civiles: false, verificado_sistema: false },
  });

  useEffect(() => { if (data) reset(data); }, [data]);

  const antecedentes  = watch('antecedentes_penales');
  const procesos      = watch('procesos_judiciales');
  const detencion     = watch('detencion_previa');
  const demandas      = watch('demandas_civiles');

  const onSubmit = async (values: any) => {
    try {
      await entrevistasApi.saveJudicial(entrevistaId, values);
      message.success('Información judicial guardada correctamente');
      onSaved();
    } catch { message.error('Error al guardar información judicial'); }
  };

  const BoolField = ({ name, label: labelText, detailName, detailLabel }: { name: any; label: string; detailName?: any; detailLabel?: string }) => {
    const isActive = watch(name);
    return (
      <div style={{ background: '#1c2128', border: '1px solid #30363d', borderRadius: 10, padding: '16px', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: isActive && detailName ? 12 : 0 }}>
          <Controller name={name} control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" onChange={(v) => field.onChange(v)} />} />
          <Text style={{ color: '#e6edf3', fontSize: 13 }}>{labelText}</Text>
          {isActive && <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(248,81,73,0.12)', color: '#f85149', border: '1px solid rgba(248,81,73,0.25)' }}>DECLARADO</span>}
        </div>
        {isActive && detailName && (
          <Controller name={detailName} control={control} render={({ field }) => (
            <Input.TextArea {...field} rows={2} placeholder={detailLabel || 'Detallar...'} style={{ marginTop: 8 }} />
          )} />
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ background: 'rgba(22,119,255,0.06)', border: '1px solid rgba(22,119,255,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <SafetyOutlined style={{ color: '#58a6ff' }} />
        <Text style={{ color: '#8b949e', fontSize: 12 }}>Responder con total veracidad. La información será verificada en sistemas nacionales.</Text>
      </div>

      <BoolField name="antecedentes_penales" label="¿Tiene antecedentes penales?" detailName="detalle_penales" detailLabel="Especificar delito, fecha, resolución..." />
      <BoolField name="procesos_judiciales" label="¿Tiene procesos judiciales activos?" detailName="detalle_procesos" detailLabel="Describir proceso, juzgado, estado actual..." />
      <BoolField name="detencion_previa" label="¿Ha sido detenido o arrestado?" detailName="detalle_detencion" detailLabel="Fecha, motivo, resolución..." />
      <BoolField name="demandas_civiles" label="¿Tiene demandas civiles?" detailName="detalle_demandas" detailLabel="Tipo de demanda, monto, estado..." />

      <Divider style={{ borderColor: '#21262d', margin: '8px 0 16px' }} />

      <Row gutter={[16, 0]}>
        <Col xs={12} md={6}>
          <Form.Item label={lbl('¿Verificado en sistema?')}>
            <Controller name="verificado_sistema" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Verificado" unCheckedChildren="Pendiente" />} />
          </Form.Item>
        </Col>
        <Col xs={24} md={18}>
          <Form.Item label={lbl('Observaciones del entrevistador')}>
            <Controller name="observaciones" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Notas adicionales sobre el aspecto judicial..." />} />
          </Form.Item>
        </Col>
      </Row>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 180 }}>
          Guardar Información Judicial
        </Button>
      </div>
    </form>
  );
}
