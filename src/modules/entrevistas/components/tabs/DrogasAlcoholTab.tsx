// src/modules/entrevistas/components/tabs/DrogasAlcoholTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, App, Card, Row, Col, Radio, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input; // Extraído correctamente desde Input para evitar errores

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

const opcionesUltimaVez = ['Hoy', 'Ayer', 'Esta semana', 'Último mes', 'Último año', 'Más de un año'];
const opcionesFrecuencia = ['Ocasional', 'En fiestas / Compromisos', 'Frecuentemente (Fines de semana)', 'Diariamente'];

export default function DrogasAlcoholTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  // --- ESTADO LOCAL DEL FORMULARIO ---
  const [form, setForm] = useState({
    consume_alcohol: false,
    ultima_vez_alcohol: undefined as string | undefined,
    bebida_preferencia: '',
    frecuencia_alcohol: undefined as string | undefined,
    inconvenientes_alcohol: false,
    dependencia_alcohol: false,
    concepto_drogas: '',
    consume_drogas: false,
    tipo_drogas: '',
    involucrado_narcotrafico: false,
    propuestas_narcotrafico: false,
    entorno_drogas: false,
    observaciones: ''
  });

  useEffect(() => {
    if (data) {
      setForm({
        consume_alcohol: data.consume_alcohol ?? false,
        ultima_vez_alcohol: data.ultima_vez_alcohol || undefined,
        bebida_preferencia: data.bebida_preferencia || '',
        frecuencia_alcohol: data.frecuencia_alcohol || undefined,
        inconvenientes_alcohol: data.inconvenientes_alcohol ?? false,
        dependencia_alcohol: data.dependencia_alcohol ?? false,
        concepto_drogas: data.concepto_drogas || '',
        consume_drogas: data.consume_drogas ?? false,
        tipo_drogas: data.tipo_drogas || '',
        involucrado_narcotrafico: data.involucrado_narcotrafico ?? false,
        propuestas_narcotrafico: data.propuestas_narcotrafico ?? false,
        entorno_drogas: data.entorno_drogas ?? false,
        observaciones: data.observaciones || ''
      });
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // VALIDACIÓN: Si consume alcohol o drogas, requerir los subcampos desplegados
    if (form.consume_alcohol && (!form.ultima_vez_alcohol || !form.frecuencia_alcohol)) {
      return message.error('Por favor complete la frecuencia y última vez de consumo de alcohol');
    }
    if (form.consume_drogas && !form.tipo_drogas.trim()) {
      return message.error('Por favor especifique qué tipo de sustancias ha consumido');
    }

    setSaving(true);
    try {
      // Limpieza preventiva de datos fantasmas antes de despachar a SQL Server
      const payload = {
        ...form,
        ultima_vez_alcohol: form.consume_alcohol ? form.ultima_vez_alcohol : null,
        bebida_preferencia: form.consume_alcohol ? form.bebida_preferencia : '',
        frecuencia_alcohol: form.consume_alcohol ? form.frecuencia_alcohol : null,
        tipo_drogas: form.consume_drogas ? form.tipo_drogas : ''
      };

      await entrevistasApi.saveDrogasAlcohol(entrevistaId, payload);
      message.success('Registro de drogas y alcohol guardado correctamente');
      onSaved();
    } catch {
      message.error('Error al guardar el apartado de drogas y alcohol');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* SECCIÓN 1: CONSUMO DE ALCOHOL */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Consumo de Bebidas Alcohólicas</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Consume usted bebidas alcohólicas / licor?</Text>
            <Radio.Group value={form.consume_alcohol} onChange={e => handleChange('consume_alcohol', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          {form.consume_alcohol && (
            <>
              <Col span={24} md={8}>
                <Text className="block mb-1 text-xs text-gray-400 uppercase">La última vez que consumió licor fue:</Text>
                <Select className="w-full" placeholder="Seleccione temporalidad" value={form.ultima_vez_alcohol} onChange={v => handleChange('ultima_vez_alcohol', v)} size="small">
                  {opcionesUltimaVez.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                </Select>
              </Col>
              <Col span={24} md={8}>
                <Text className="block mb-1 text-xs text-gray-400 uppercase">Frecuencia de consumo:</Text>
                <Select className="w-full" placeholder="Seleccione frecuencia" value={form.frecuencia_alcohol} onChange={v => handleChange('frecuencia_alcohol', v)} size="small">
                  {opcionesFrecuencia.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
                </Select>
              </Col>
              <Col span={24} md={8}>
                <Text className="block mb-1 text-xs text-gray-400 uppercase">Bebida alcohólica de preferencia:</Text>
                <Input placeholder="Ej. Cerveza, Whisky, Ron" value={form.bebida_preferencia} onChange={e => handleChange('bebida_preferencia', e.target.value)} size="small" />
              </Col>
            </>
          )}

          <Col span={24} md={12}>
            <Text className="block mb-1 text-sm">¿Ha tenido inconvenientes de tipo personal o familiar por la ingesta de licor?</Text>
            <Radio.Group value={form.inconvenientes_alcohol} onChange={e => handleChange('inconvenientes_alcohol', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24} md={12}>
            <Text className="block mb-1 text-sm">¿Tiene o ha tenido dependencias de licor?</Text>
            <Radio.Group value={form.dependencia_alcohol} onChange={e => handleChange('dependencia_alcohol', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* SECCIÓN 2: DROGAS ILEGALES Y CONDUCTAS ASOCIADAS */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Drogas Ilegales y Control de Confianza</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text className="block mb-1 text-sm">¿Qué entiende usted por drogas ilegales?</Text>
            <TextArea rows={2} placeholder="Escriba el concepto manifestado por el evaluado..." value={form.concepto_drogas} onChange={e => handleChange('concepto_drogas', e.target.value)} />
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm">¿Ha consumido sustancias / drogas ilegales alguna vez?</Text>
            <Radio.Group value={form.consume_drogas} onChange={e => handleChange('consume_drogas', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          {form.consume_drogas && (
            <Col span={24} className="pl-4 border-l-2 border-red-200">
              <Text className="block mb-1 text-xs text-gray-400 uppercase">Especifique el tipo de sustancias consumidas:</Text>
              <Input placeholder="Ej. Marihuana, Cocaína, Sintéticas" value={form.tipo_drogas} onChange={e => handleChange('tipo_drogas', e.target.value)} size="small" />
            </Col>
          )}

          <Col span={24}>
            <Text className="block mb-1 text-sm">¿Se ha involucrado usted en temas relacionados a actividades de narcotráfico?</Text>
            <Radio.Group value={form.involucrado_narcotrafico} onChange={e => handleChange('involucrado_narcotrafico', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm">¿Ha recibido propuestas de participar en actividades relacionadas al narcotráfico?</Text>
            <Radio.Group value={form.propuestas_narcotrafico} onChange={e => handleChange('propuestas_narcotrafico', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm">¿Hay en su familia o círculo de amigos alguien dedicado a temas de drogas ilegales?</Text>
            <Radio.Group value={form.entorno_drogas} onChange={e => handleChange('entorno_drogas', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* ANOTACIONES EXTRAS */}
      <Card size="small">
        <Text className="block mb-1 text-xs text-gray-400 uppercase">Observaciones del Entrevistador</Text>
        <TextArea rows={2} placeholder="Notas complementarias sobre el lenguaje no verbal o aclaraciones..." value={form.observaciones} onChange={e => handleChange('observaciones', e.target.value)} />
      </Card>

      {/* BOTÓN MAESTRO */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Módulo
        </Button>
      </div>
    </div>
  );
}