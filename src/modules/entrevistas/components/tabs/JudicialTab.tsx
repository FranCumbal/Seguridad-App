// src/modules/entrevistas/components/tabs/JudicialTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, Select, App, Card, Row, Col, Radio, Typography, DatePicker } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

const opcionesArmas = ['Servicio Militar', 'Fuerzas Policiales', 'Seguridad Privada', 'Deportivo', 'Cacería', 'Ilegal', 'Otro'];

export default function JudicialTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  // --- ESTADO LOCAL DEL FORMULARIO ---
  const [form, setForm] = useState({
    interpuesto_demandas: false,
    sido_demandado: false,
    proceso_judicial: false,
    detenciones: false,
    observacion_detenciones: '',
    familiares_detenidos: false,
    observacion_familiares_detenidos: '',
    visitado_carcel: false,
    observacion_visitado_carcel: '',
    ultima_verificacion_judicial: null as dayjs.Dayjs | null,
    concepto_margen_ley: '',
    vinculos_margen_ley: '',
    manipulado_armas: false,
    motivo_armas: undefined as string | undefined,
    actividades_fuera_ley: false,
    propuestas_ilegales: false,
    entorno_ilegal_antecedentes: false,
    participacion_actos_ilegales: false,
    observaciones_generales: ''
  });

  useEffect(() => {
    if (data) {
      setForm({
        interpuesto_demandas: data.interpuesto_demandas ?? false,
        sido_demandado: data.sido_demandado ?? false,
        proceso_judicial: data.proceso_judicial ?? false,
        detenciones: data.detenciones ?? false,
        observacion_detenciones: data.observacion_detenciones || '',
        familiares_detenidos: data.familiares_detenidos ?? false,
        observacion_familiares_detenidos: data.observacion_familiares_detenidos || '',
        visitado_carcel: data.visitado_carcel ?? false,
        observacion_visitado_carcel: data.observacion_visitado_carcel || '',
        ultima_verificacion_judicial: data.ultima_verificacion_judicial ? dayjs(data.ultima_verificacion_judicial) : null,
        concepto_margen_ley: data.concepto_margen_ley || '',
        vinculos_margen_ley: data.vinculos_margen_ley || '',
        manipulado_armas: data.manipulado_armas ?? false,
        motivo_armas: data.motivo_armas || undefined,
        actividades_fuera_ley: data.actividades_fuera_ley ?? false,
        propuestas_ilegales: data.propuestas_ilegales ?? false,
        entorno_ilegal_antecedentes: data.entorno_ilegal_antecedentes ?? false,
        participacion_actos_ilegales: data.participacion_actos_ilegales ?? false,
        observaciones_generales: data.observaciones_generales || ''
      });
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validaciones de sub-campos obligatorios si marcaron Sí
    if (form.detenciones && !form.observacion_detenciones.trim()) return message.error('Justifique el motivo de las detenciones');
    if (form.familiares_detenidos && !form.observacion_familiares_detenidos.trim()) return message.error('Justifique qué familiares han sido detenidos');
    if (form.visitado_carcel && !form.observacion_visitado_carcel.trim()) return message.error('Especifique a quién y por qué visitó en la cárcel');
    if (form.manipulado_armas && !form.motivo_armas) return message.error('Seleccione el contexto en el que manipuló armas');

    setSaving(true);
    try {
      const payload = {
        ...form,
        observacion_detenciones: form.detenciones ? form.observacion_detenciones : null,
        observacion_familiares_detenidos: form.familiares_detenidos ? form.observacion_familiares_detenidos : null,
        observacion_visitado_carcel: form.visitado_carcel ? form.observacion_visitado_carcel : null,
        motivo_armas: form.manipulado_armas ? form.motivo_armas : null,
        ultima_verificacion_judicial: form.ultima_verificacion_judicial ? form.ultima_verificacion_judicial.toISOString() : null
      };

      await entrevistasApi.saveJudicial(entrevistaId, payload);
      message.success('Antecedentes judiciales guardados correctamente');
      onSaved();
    } catch {
      message.error('Error al guardar el apartado judicial');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* SECCIÓN 1: PROCESOS JUDICIALES Y LEGALES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Procesos Legales y Verificación</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24} md={8}>
            <Text className="block mb-1 text-sm font-medium">¿Ha interpuesto demandas?</Text>
            <Radio.Group value={form.interpuesto_demandas} onChange={e => handleChange('interpuesto_demandas', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24} md={8}>
            <Text className="block mb-1 text-sm font-medium">¿Le han demandado alguna vez?</Text>
            <Radio.Group value={form.sido_demandado} onChange={e => handleChange('sido_demandado', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24} md={8}>
            <Text className="block mb-1 text-sm font-medium">¿Ha participado en algún proceso judicial?</Text>
            <Radio.Group value={form.proceso_judicial} onChange={e => handleChange('proceso_judicial', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Cuándo fue la última verificación de su situación judicial? (Fecha)</Text>
            <DatePicker 
              value={form.ultima_verificacion_judicial} 
              onChange={v => handleChange('ultima_verificacion_judicial', v)} 
              format="DD/MM/YYYY"
              placeholder="Seleccione fecha"
            />
          </Col>
        </Row>
      </Card>

      {/* SECCIÓN 2: DETENCIONES Y CARCELES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Detenciones y Entorno Penitenciario</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Alguna vez tuvo detenciones?</Text>
            <Radio.Group value={form.detenciones} onChange={e => handleChange('detenciones', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.detenciones && (
              <Input placeholder="Especifique el motivo de la detención..." value={form.observacion_detenciones} onChange={e => handleChange('observacion_detenciones', e.target.value)} size="small" />
            )}
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha tenido familiares detenidos?</Text>
            <Radio.Group value={form.familiares_detenidos} onChange={e => handleChange('familiares_detenidos', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.familiares_detenidos && (
              <Input placeholder="Indique parentesco y motivo..." value={form.observacion_familiares_detenidos} onChange={e => handleChange('observacion_familiares_detenidos', e.target.value)} size="small" />
            )}
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha visitado a alguien en una cárcel?</Text>
            <Radio.Group value={form.visitado_carcel} onChange={e => handleChange('visitado_carcel', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.visitado_carcel && (
              <Input placeholder="Indique a quién y el centro de rehabilitación..." value={form.observacion_visitado_carcel} onChange={e => handleChange('observacion_visitado_carcel', e.target.value)} size="small" />
            )}
          </Col>
        </Row>
      </Card>

      {/* SECCIÓN 3: GRUPOS ILEGALES Y ARMAS */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Vínculos Ilegales y Manejo de Armas</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Qué entiende por personas o grupos al margen de la ley?</Text>
            <TextArea rows={2} placeholder="Describa la respuesta del evaluado..." value={form.concepto_margen_ley} onChange={e => handleChange('concepto_margen_ley', e.target.value)} />
          </Col>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha tenido vínculos con grupos o personas al margen de la ley?</Text>
            <TextArea rows={2} placeholder="Detalle si la respuesta es positiva..." value={form.vinculos_margen_ley} onChange={e => handleChange('vinculos_margen_ley', e.target.value)} />
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Alguna vez ha manipulado armas de fuego?</Text>
            <Radio.Group value={form.manipulado_armas} onChange={e => handleChange('manipulado_armas', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.manipulado_armas && (
              <Select className="w-full md:w-1/2 block" placeholder="Seleccione contexto" value={form.motivo_armas} onChange={v => handleChange('motivo_armas', v)} size="small">
                {opcionesArmas.map(opt => <Select.Option key={opt} value={opt}>{opt}</Select.Option>)}
              </Select>
            )}
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha tenido participación en actividades que estén fuera de nuestro ordenamiento judicial?</Text>
            <Radio.Group value={form.actividades_fuera_ley} onChange={e => handleChange('actividades_fuera_ley', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha recibido alguna propuesta para participar en actividades ilegales, con personas o grupos al margen de la Ley?</Text>
            <Radio.Group value={form.propuestas_ilegales} onChange={e => handleChange('propuestas_ilegales', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Tiene en su familia o amigos, personas que se dediquen a actividades ilegales o con antecedentes penales por la comisión de delitos?</Text>
            <Radio.Group value={form.entorno_ilegal_antecedentes} onChange={e => handleChange('entorno_ilegal_antecedentes', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">¿Ha participado usted en actos ilegales, con personas al margen de la ley?</Text>
            <Radio.Group value={form.participacion_actos_ilegales} onChange={e => handleChange('participacion_actos_ilegales', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <Text className="block mb-1 text-xs text-gray-400 uppercase">Observaciones Generales de la Sección</Text>
        <TextArea rows={2} placeholder="Anotaciones extra del poligrafista o entrevistador..." value={form.observaciones_generales} onChange={e => handleChange('observaciones_generales', e.target.value)} />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Judicial
        </Button>
      </div>
    </div>
  );
}