// FinanzasTab.tsx
import { useEffect } from 'react';
import { Form, Input, Switch, Button, Row, Col, App, Divider, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const lbl = (t: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{t}</span>;

interface Props { entrevistaId: number; data: any; onSaved: () => void; }

export default function FinanzasTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm({ defaultValues: { deudas_actuales: false, tiene_bienes: false, demandas_coactivas: false } });

  useEffect(() => { if (data) reset(data); }, [data]);

  const tieneDeudas = watch('deudas_actuales');
  const tieneBienes = watch('tiene_bienes');
  const tieneCoactivas = watch('demandas_coactivas');

  const onSubmit = async (values: any) => {
    try {
      await entrevistasApi.saveFinanzas(entrevistaId, values);
      message.success('Información financiera guardada');
      onSaved();
    } catch { message.error('Error al guardar finanzas'); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Ingresos y Egresos</p>
      <Row gutter={[16, 0]}>
        <Col xs={24} md={6}><Form.Item label={lbl('Ingresos Mensuales ($)')}><Controller name="ingresos_mensuales" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" placeholder="0.00" prefix="$" />} /></Form.Item></Col>
        <Col xs={24} md={6}><Form.Item label={lbl('Egresos Mensuales ($)')}><Controller name="egresos_mensuales" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" placeholder="0.00" prefix="$" />} /></Form.Item></Col>
        <Col xs={24} md={6}><Form.Item label={lbl('Score Crediticio')}><Controller name="score_crediticio" control={control} render={({ field }) => <Input {...field} placeholder="Ej. 750" />} /></Form.Item></Col>
        <Col xs={24} md={6}><Form.Item label={lbl('Buró de Crédito')}><Controller name="buro_credito" control={control} render={({ field }) => <Input {...field} placeholder="Ej. Limpio" />} /></Form.Item></Col>
      </Row>
      <Divider style={{ borderColor: '#21262d', margin: '4px 0 16px' }} />
      <Row gutter={[16, 0]}>
        <Col xs={12} md={4}><Form.Item label={lbl('¿Tiene Deudas?')}><Controller name="deudas_actuales" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {tieneDeudas && <>
          <Col xs={24} md={4}><Form.Item label={lbl('Monto Deudas ($)')}><Controller name="monto_deudas" control={control} render={({ field }) => <Input {...field} type="number" step="0.01" prefix="$" />} /></Form.Item></Col>
          <Col xs={24} md={8}><Form.Item label={lbl('Tipo de Deudas')}><Controller name="tipo_deudas" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Describir deudas..." />} /></Form.Item></Col>
        </>}
        <Col xs={12} md={4}><Form.Item label={lbl('¿Tiene Bienes?')}><Controller name="tiene_bienes" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {tieneBienes && <Col xs={24} md={8}><Form.Item label={lbl('Descripción de Bienes')}><Controller name="descripcion_bienes" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Bienes inmuebles, vehículos..." />} /></Form.Item></Col>}
        <Col xs={12} md={4}><Form.Item label={lbl('¿Demandas Coactivas?')}><Controller name="demandas_coactivas" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="Sí" unCheckedChildren="No" />} /></Form.Item></Col>
        {tieneCoactivas && <Col xs={24} md={8}><Form.Item label={lbl('Detalle Coactivas')}><Controller name="detalle_coactivas" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} />} /></Form.Item></Col>}
      </Row>
      <Form.Item label={lbl('Observaciones')}><Controller name="observaciones" control={control} render={({ field }) => <Input.TextArea {...field} rows={2} placeholder="Observaciones financieras adicionales..." />} /></Form.Item>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>Guardar Finanzas</Button>
      </div>
    </form>
  );
}
