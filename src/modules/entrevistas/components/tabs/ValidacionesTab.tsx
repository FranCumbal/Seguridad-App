import { useEffect, useMemo } from 'react';
import { Form, Input, Switch, Button, Row, Col, App, Select, Typography, Divider, Slider } from 'antd';
import { SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useForm, Controller } from 'react-hook-form';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const lbl = (t: string) => <span style={{ color: '#8b949e', fontSize: 12 }}>{t}</span>;

interface Props { 
  entrevistaId: number; 
  data: any; 
  entrevistaData?: any; // Añadimos esta propiedad para recibir toda la entrevista
  onSaved: () => void; 
}

const resultadoOpts = [
  { value: 'PENDIENTE',   label: 'Pendiente',   color: '#d29922' },
  { value: 'APROBADO',    label: 'Aprobado',    color: '#3fb950' },
  { value: 'RECHAZADO',   label: 'Rechazado',   color: '#f85149' },
  { value: 'CONDICIONAL', label: 'Condicional', color: '#58a6ff' },
];

// 1. AÑADIMOS UNA INTERFAZ PARA QUE TYPESCRIPT SEPA EXACTAMENTE QUÉ CAMPOS EXISTEN
interface ValidacionesFormValues {
  documentos_verificados: boolean;
  referencias_verificadas: boolean;
  resultado_general: string;
  calificacion: number;
  aprobado_por: string;
  recomendacion: string;
  observaciones_finales: string;
}

export default function ValidacionesTab({ entrevistaId, data, entrevistaData, onSaved }: Props) {
  const { message } = App.useApp();
  
  // Generamos de forma dinámica los entrevistadores asignados a esta entrevista
  const opcionesEntrevistadores = useMemo(() => {
    const listaIntermedia = entrevistaData?.entrevistadores || [];
    return listaIntermedia.map((e: any) => {
      const nombreCompleto = e.entrevistador?.nombre_completo || 'Evaluador sin nombre';
      return {
        label: nombreCompleto,
        value: nombreCompleto // Guardamos el texto plano en la base de datos
      };
    });
  }, [entrevistaData]);

  // 2. AÑADIMOS LOS CAMPOS FALTANTES EN DEFAULT VALUES
  const { control, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<ValidacionesFormValues>({
    defaultValues: { 
      documentos_verificados: false, 
      referencias_verificadas: false, 
      resultado_general: 'PENDIENTE', 
      calificacion: 70,
      aprobado_por: '',          // Añadido para quitar el error rojo
      recomendacion: '',         // Añadido para quitar el error rojo
      observaciones_finales: ''  // Añadido para quitar el error rojo
    },
  });

  useEffect(() => { 
    if (data) {
      reset({ 
        ...data, 
        calificacion: data.calificacion ?? 70,
        aprobado_por: data.aprobado_por ?? '',
        recomendacion: data.recomendacion ?? '',
        observaciones_finales: data.observaciones_finales ?? ''
      }); 
    }
  }, [data, reset]);

  const resultado = watch('resultado_general');
  const calificacion = watch('calificacion');
  const resultadoCfg = resultadoOpts.find((r) => r.value === resultado) || resultadoOpts[0];

  const getCalColor = (val: number) => val >= 80 ? '#15803d' : val >= 60 ? '#d97706' : '#cf1322';

  const onSubmit = async (values: ValidacionesFormValues) => {
    try {
      await entrevistasApi.saveValidaciones(entrevistaId, { 
        ...values, 
        fecha_validacion: new Date().toISOString() 
      });
      message.success('Validaciones finales guardadas. Entrevista completada.');
      onSaved();
    } catch { 
      message.error('Error al guardar validaciones'); 
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div style={{ background: 'rgba(82,196,26,0.06)', border: '1px solid rgba(82,196,26,0.15)', borderRadius: 8, padding: '10px 14px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
        <CheckCircleOutlined style={{ color: '#3fb950' }} />
        <Text style={{ color: '#8b949e', fontSize: 12 }}>Sección final de la entrevista. El resultado determinará el estado del proceso de contratación.</Text>
      </div>

      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Verificaciones</p>
      <Row gutter={[24, 0]} style={{ marginBottom: 20 }}>
  <Col xs={12} md={6}>
    <div style={{ background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
      <Controller name="documentos_verificados" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="✓" unCheckedChildren="✗" style={{ marginBottom: 8 }} />} />
      <Text style={{ display: 'block', color: '#24292f', fontSize: 12, fontWeight: 500 }}>Documentos Verificados</Text>
    </div>
  </Col>
  <Col xs={12} md={6}>
    <div style={{ background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 10, padding: '16px', textAlign: 'center' }}>
      <Controller name="referencias_verificadas" control={control} render={({ field }) => <Switch {...field} checked={field.value} checkedChildren="✓" unCheckedChildren="✗" style={{ marginBottom: 8 }} />} />
      <Text style={{ display: 'block', color: '#24292f', fontSize: 12, fontWeight: 500 }}>Referencias Verificadas</Text>
    </div>
  </Col>
  <Col xs={24} md={12}>
    <div style={{ background: '#f6f8fa', border: '1px solid #d0d7de', borderRadius: 10, padding: '16px' }}>
      <Form.Item
        label={<span style={{ color: '#24292f', fontSize: 12, fontWeight: 500 }}>Aprobado por</span>}
        style={{ marginBottom: 0 }}
      >
        <Controller
          name="aprobado_por"
          control={control}
          render={({ field }) => (
            <Select
              {...field}
              placeholder="Seleccione el entrevistador asignado"
              allowClear
              options={opcionesEntrevistadores}
              style={{ width: '100%' }}
            />
          )}
        />
      </Form.Item>
    </div>
  </Col>
</Row>

      <Divider style={{ borderColor: '#21262d', margin: '8px 0 20px' }} />
      <p style={{ fontSize: 11, fontWeight: 600, color: '#6e7681', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 14 }}>Evaluación Final</p>

      <Row gutter={[16, 0]}>
        <Col xs={24} md={8}>
          <Form.Item label={lbl('Resultado General *')}>
            <Controller name="resultado_general" control={control} render={({ field }) => (
              <Select {...field} style={{ width: '100%' }}>
                {resultadoOpts.map((r) => (
                  <Select.Option key={r.value} value={r.value}>
                    <span style={{ color: r.color, fontWeight: 500 }}>● {r.label}</span>
                  </Select.Option>
                ))}
              </Select>
            )} />
          </Form.Item>
          <div style={{ background: `${resultadoCfg.color}15`, border: `1px solid ${resultadoCfg.color}40`, borderRadius: 8, padding: '12px 16px', textAlign: 'center', marginTop: -8, marginBottom: 16 }}>
            <Text style={{ color: resultadoCfg.color, fontWeight: 700, fontSize: 18 }}>{resultadoCfg.label}</Text>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label={lbl(`Calificación: ${calificacion}/100`)}>
            <Controller name="calificacion" control={control} render={({ field }) => (
              <Slider 
                {...field} 
                min={0} 
                max={100} 
                step={1}
                styles={{
                  track: { background: getCalColor(calificacion) },
                  handle: { borderColor: getCalColor(calificacion) }
                }} 
              />
            )} />
          </Form.Item>
          <div style={{ textAlign: 'center', marginTop: -12 }}>
            <Text style={{ fontSize: 32, fontWeight: 700, color: getCalColor(calificacion) }}>{calificacion}</Text>
            <Text style={{ fontSize: 12, color: '#6e7681' }}>/100</Text>
          </div>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item label={lbl('Recomendación')}>
            <Controller name="recomendacion" control={control} render={({ field }) => (
              <Input.TextArea {...field} rows={4} placeholder="Recomendación del entrevistador hacia el proceso de contratación..." />
            )} />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label={lbl('Observaciones finales')}>
        <Controller name="observaciones_finales" control={control} render={({ field }) => (
          <Input.TextArea {...field} rows={4} placeholder="Resumen general de la entrevista de seguridad. Puntos clave identificados, alertas o fortalezas del candidato..." />
        )} />
      </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSubmitting} className="action-btn-primary" style={{ height: 44, fontWeight: 600, minWidth: 200, fontSize: 15 }}>
          Guardar y Finalizar Entrevista
        </Button>
      </div>
    </form>
  );
}