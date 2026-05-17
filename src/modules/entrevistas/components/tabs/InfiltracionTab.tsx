// src/modules/entrevistas/components/tabs/InfiltracionTab.tsx
import { useEffect, useState } from 'react';
import { Button, Input, App, Card, Row, Col, Radio, Typography } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input;

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

export default function InfiltracionTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  // --- ESTADO LOCAL DEL FORMULARIO ---
  const [form, setForm] = useState({
    motivacion_ingreso: '',
    contactos_empresa: false,
    detalle_contactos: '',
    intencion_ilicitos: false,
    acuerdo_ilicitos: false,
    instrucciones_dano: false,
    observaciones: '',
    nivel_riesgo: 'BAJO'
  });

  useEffect(() => {
    if (data) {
      setForm({
        motivacion_ingreso: data.motivacion_ingreso || '',
        contactos_empresa: data.contactos_empresa ?? false,
        detalle_contactos: data.detalle_contactos || '',
        intencion_ilicitos: data.intencion_ilicitos ?? false,
        acuerdo_ilicitos: data.acuerdo_ilicitos ?? false,
        instrucciones_dano: data.instrucciones_dano ?? false,
        observaciones: data.observaciones || '',
        nivel_riesgo: data.nivel_riesgo || 'BAJO'
      });
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // Validaciones
    if (form.contactos_empresa && !form.detalle_contactos.trim()) {
      return message.error('Especifique qué familiares o amigos trabajan en la empresa');
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        detalle_contactos: form.contactos_empresa ? form.detalle_contactos : null
      };

      await entrevistasApi.saveInfiltracion(entrevistaId, payload);
      message.success('Dictamen de infiltración guardado correctamente');
      onSaved();
    } catch {
      message.error('Error al guardar el módulo de infiltración');
    } finally {
      setSaving(false);
    }
  };

  const getRiesgoStyle = (currentType: string) => {
    if (form.nivel_riesgo !== currentType) return {};
    switch (currentType) {
      case 'BAJO': return { backgroundColor: '#238636', borderColor: '#2EA043', color: '#FFF', fontWeight: 600 };
      case 'MEDIO': return { backgroundColor: '#D29922', borderColor: '#E3B341', color: '#000', fontWeight: 600 };
      case 'ALTO': return { backgroundColor: '#F85149', borderColor: '#FF7B72', color: '#FFF', fontWeight: 600 };
      default: return {};
    }
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* SECCIÓN 1: RIESGO CORPORATIVO E INFILTRACIÓN */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Evaluación de Intenciones e Infiltración Corporativa</Text>}>
        <Row gutter={[16, 20]}>
          
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">1. ¿Cuál es su motivación principal y su interés para postularse a ingresar a esta empresa?</Text>
            <TextArea rows={2} placeholder="Describa textualmente la justificación que da el candidato..." value={form.motivacion_ingreso} onChange={e => handleChange('motivacion_ingreso', e.target.value)} />
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">2. ¿Tiene familiares, amigos o conocidos que trabajen actualmente en esta empresa?</Text>
            <Radio.Group value={form.contactos_empresa} onChange={e => handleChange('contactos_empresa', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.contactos_empresa && (
              <Input placeholder="Especifique nombres y/o cargos de las personas conocidas..." value={form.detalle_contactos} onChange={e => handleChange('detalle_contactos', e.target.value)} size="small" />
            )}
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">3. ¿Tiene usted la intención de ingresar a esta empresa con el ánimo de cometer o facilitar actos ilícitos?</Text>
            <Radio.Group value={form.intencion_ilicitos} onChange={e => handleChange('intencion_ilicitos', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">4. ¿Se ha puesto usted de acuerdo con terceras personas o al margen de la ley para cometer actos ilícitos dentro de esta organización?</Text>
            <Radio.Group value={form.acuerdo_ilicitos} onChange={e => handleChange('acuerdo_ilicitos', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">5. ¿Ha recibido usted instrucciones por personas, bandas o empresas, para causar algún tipo de daño o delito a esta empresa?</Text>
            <Radio.Group value={form.instrucciones_dano} onChange={e => handleChange('instrucciones_dano', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

        </Row>
      </Card>

      {/* SECCIÓN 2: NIVEL DE RIESGO EVALUADO */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8b949e' }}>Dictamen de Seguridad e Infiltración</Text>}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={10}>
            <Text className="block mb-1 text-sm font-semibold">Nivel de Riesgo Evaluado:</Text>
            <Text style={{ color: '#8b949e', fontSize: 12 }}>Defina el nivel de criticidad final tras contrastar las declaraciones y el lenguaje corporal.</Text>
          </Col>
          <Col span={24} md={14} style={{ display: 'flex', justifyContent: 'md-end' }}>
            <Radio.Group 
              value={form.nivel_riesgo} 
              onChange={e => handleChange('nivel_riesgo', e.target.value)} 
              buttonStyle="solid"
              size="large"
              className="w-full text-center md:text-right"
            >
              <Radio.Button value="BAJO" style={getRiesgoStyle('BAJO')} className="w-1/3 md:w-32">BAJO</Radio.Button>
              <Radio.Button value="MEDIO" style={getRiesgoStyle('MEDIO')} className="w-1/3 md:w-32">MEDIO</Radio.Button>
              <Radio.Button value="ALTO" style={getRiesgoStyle('ALTO')} className="w-1/3 md:w-32">ALTO</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* COMENTARIOS ADICIONALES */}
      <Card size="small">
        <Text className="block mb-1 text-xs text-gray-400 uppercase">Observaciones y Notas Técnicas del Evaluador</Text>
        <TextArea rows={3} placeholder="Añada justificaciones sobre el nivel de riesgo asignado y las reacciones del candidato..." value={form.observaciones} onChange={e => handleChange('observaciones', e.target.value)} />
      </Card>

      {/* ACCIÓN PRINCIPAL */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={handleSave}
          className="action-btn-primary" style={{ height: 40, fontWeight: 600, minWidth: 160 }}>
          Guardar Infiltración
        </Button>
      </div>
    </div>
  );
}