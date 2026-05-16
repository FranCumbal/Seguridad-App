import { useEffect } from 'react';
import { Form, Input, Switch, Button, Row, Col, App, Divider, Typography } from 'antd';
import { SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const lbl = (t: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{t}</span>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

export default function DrogasAlcoholTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({
    defaultValues: { consume_alcohol: false, consume_drogas: false, tratamiento_previo: false, fuma: false },
  });

  useEffect(() => { if (data) reset(data); }, [data]);

  const consumeAlcohol = watch('consume_alcohol');
  const consumeDrogas = watch('consume_drogas');
  const tratamiento = watch('tratamiento_previo');
  const fuma = watch('fuma');

  const onSubmit = async (values: any) => {
    try {
      await entrevistasApi.saveDrogasAlcohol(entrevistaId, values);
      message.success('Información guardada correctamente');
      onSaved();
    } catch { message.error('Error al guardar información'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ background: 'rgba(210,153,34,0.08)', border: '1px solid rgba(210,153,34,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <WarningOutlined style={{ color: '#d29922' }} />
        <Text style={{ color: '#d29922', fontSize: 12 }}>Esta información es confidencial y solo será utilizada para fines de evaluación de seguridad.</Text>
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Alcohol</p>
      <Row gutter={[16, 0]}>
        <Col xs={12} md={4}><Form.Item label={lbl('¿Consume alcohol?')}><Controller name="consume_alcohol" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {consumeAlcohol && (
          <Col xs={24} md={8}><Form.Item label={lbl('Frecuencia de consumo')}><Controller name="frecuencia_alcohol" control={control} render={({ field }) => (
            <Input {...field} placeholder="Ej. Ocasionalmente, fines de semana..." />
          )} /></Form.Item></Col>
        )}
      </Row>

      <Divider style={{ borderColor: '#21262d', margin: '4px 0 16px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Drogas</p>
      <Row gutter={[16, 0]}>
        <Col xs={12} md={4}><Form.Item label={lbl('¿Ha consumido drogas?')}><Controller name="consume_drogas" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {consumeDrogas && (
          <Col xs={24} md={10}><Form.Item label={lbl('Tipo de drogas')}><Controller name="tipo_drogas" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Especificar tipos consumidos..." />} /></Form.Item></Col>
        )}
        <Col xs={12} md={4}><Form.Item label={lbl('¿Tratamiento previo?')}><Controller name="tratamiento_previo" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {tratamiento && (
          <Col xs={24} md={10}><Form.Item label={lbl('Detalle del tratamiento')}><Controller name="detalle_tratamiento" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Centro, duración, resultado..." />} /></Form.Item></Col>
        )}
      </Row>

      <Divider style={{ borderColor: '#21262d', margin: '4px 0 16px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Tabaco</p>
      <Row gutter={[16, 0]}>
        <Col xs={12} md={4}><Form.Item label={lbl('¿Fuma?')}><Controller name="fuma" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {fuma && (
          <Col xs={24} md={8}><Form.Item label={lbl('Frecuencia')}><Controller name="frecuencia_tabaco" control={control} render={({ field }) => <Input {...field} placeholder="Ej. 5 cigarrillos/día" />} /></Form.Item></Col>
        )}
      </Row>

      <Form.Item label={lbl('Observaciones adicionales')}><Controller name="observaciones" control={control} render={({ field }) => <Input.TextArea {...field} rows={3} placeholder="Observaciones relevantes del entrevistador..." />} /></Form.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 180 }}>
          Guardar Información
        </Button>
      </div>
    </form>
  );
}
