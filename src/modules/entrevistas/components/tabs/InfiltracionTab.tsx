import { useEffect, useState } from 'react';
import { Button, Input, App, Card, Row, Col, Radio, Typography, Upload, Divider, Popconfirm } from 'antd';
import { SaveOutlined, PlusOutlined, DeleteOutlined, UploadOutlined } from '@ant-design/icons';
import { entrevistasApi } from '@/infrastructure/api/services';

const { Text } = Typography;
const { TextArea } = Input;
const API_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';

interface TatuajeItem {
  key: string;
  id?: number;
  descripcion: string;
  fotografia?: string;
  newFile?: File;
  previewUrl?: string;
}

interface Props {
  entrevistaId: number;
  data: any;
  onSaved: () => void;
}

export default function InfiltracionTab({ entrevistaId, data, onSaved }: Props) {
  const { message } = App.useApp();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    motivacion_ingreso: '',
    contactos_empresa: false,
    detalle_contactos: '',
    intencion_ilicitos: false,
    acuerdo_ilicitos: false,
    instrucciones_dano: false,
    observaciones: '',
    nivel_riesgo: 'BAJO',
    tiene_tatuajes: false,
  });

  const [tatuajes, setTatuajes] = useState<TatuajeItem[]>([]);
  const [idsAEliminar, setIdsAEliminar] = useState<number[]>([]);

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
        nivel_riesgo: data.nivel_riesgo || 'BAJO',
        tiene_tatuajes: data.tiene_tatuajes ?? false,
      });
      
      if (data.tatuajes?.length > 0) {
        setTatuajes(
          data.tatuajes.map((t: any) => ({
            key: `tat-${t.id}`,
            id: t.id,
            descripcion: t.descripcion || '',
            fotografia: t.fotografia || undefined,
          }))
        );
      } else {
        setTatuajes([]); // Agregado: Limpia la lista visual si se eliminan todos en BD
      }
    }
  }, [data]);

  const handleChange = (field: string, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const addTatuaje = () => {
    setTatuajes(prev => [...prev, {
      key: `tat-new-${Date.now()}`,
      descripcion: '',
    }]);
  };

  const updateTatuaje = (key: string, field: keyof TatuajeItem, value: any) => {
    setTatuajes(prev => prev.map(t => t.key === key ? { ...t, [field]: value } : t));
  };

  const removeTatuaje = (tat: TatuajeItem) => {
    if (tat.id) setIdsAEliminar(prev => [...prev, tat.id!]);
    setTatuajes(prev => prev.filter(t => t.key !== tat.key));
  };

  const handleSave = async () => {
    if (form.contactos_empresa && !form.detalle_contactos.trim()) {
      return message.error('Especifique qué familiares o amigos trabajan en la empresa');
    }

    setSaving(true);
    try {
      // 1. Guardar datos principales de infiltración
      const payload = {
        ...form,
        detalle_contactos: form.contactos_empresa ? form.detalle_contactos : null,
      };
      await entrevistasApi.saveInfiltracion(entrevistaId, payload);

      // 2. Eliminar tatuajes marcados para borrar
      for (const id of idsAEliminar) {
        await entrevistasApi.deleteTatuaje(entrevistaId, id);
      }
      setIdsAEliminar([]);

      // NUEVO: 2.5. Recrear tatuajes existentes si el usuario les cambió la foto
      const tatuajesAActualizar = tatuajes.filter(t => t.id && t.newFile);
      for (const tat of tatuajesAActualizar) {
        await entrevistasApi.deleteTatuaje(entrevistaId, tat.id!); // Borramos el antiguo
        const fd = new window.FormData();
        fd.append('descripcion', tat.descripcion);
        fd.append('fotografia', tat.newFile!); // Subimos como nuevo con la nueva foto
        await entrevistasApi.addTatuaje(entrevistaId, fd as any); 
      }

      // 3. Crear nuevos tatuajes puros (los que nunca tuvieron id)
      const tatuajesNuevos = tatuajes.filter(t => !t.id);
      for (const tat of tatuajesNuevos) {
        const fd = new window.FormData();
        fd.append('descripcion', tat.descripcion);
        if (tat.newFile) fd.append('fotografia', tat.newFile);
        await entrevistasApi.addTatuaje(entrevistaId, fd as any);
      }

      message.success('Dictamen de infiltración guardado correctamente');
      onSaved();
    } catch {
      message.error('Error al guardar el módulo de infiltración');
    } finally {
      setSaving(false);
    }
  };

  const getRiesgoStyle = (tipo: string) => {
    if (form.nivel_riesgo !== tipo) return {};
    const estilos: Record<string, React.CSSProperties> = {
      BAJO:  { backgroundColor: '#238636', borderColor: '#2EA043', color: '#FFF', fontWeight: 600 },
      MEDIO: { backgroundColor: '#D29922', borderColor: '#E3B341', color: '#000', fontWeight: 600 },
      ALTO:  { backgroundColor: '#F85149', borderColor: '#FF7B72', color: '#FFF', fontWeight: 600 },
    };
    return estilos[tipo] || {};
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* SECCIÓN 1: INTENCIONES E INFILTRACIÓN */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8c8c8c' }}>Evaluación de Intenciones e Infiltración Corporativa</Text>}>
        <Row gutter={[16, 20]}>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">1. ¿Cuál es su motivación principal para postularse a ingresar a esta empresa?</Text>
            <TextArea rows={2} placeholder="Describa textualmente la justificación que da el candidato..." value={form.motivacion_ingreso} onChange={e => handleChange('motivacion_ingreso', e.target.value)} />
          </Col>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">2. ¿Tiene familiares, amigos o conocidos que trabajen actualmente en esta empresa?</Text>
            <Radio.Group value={form.contactos_empresa} onChange={e => handleChange('contactos_empresa', e.target.value)} size="small" className="mb-2">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
            {form.contactos_empresa && (
              <Input placeholder="Especifique nombres y/o cargos..." value={form.detalle_contactos} onChange={e => handleChange('detalle_contactos', e.target.value)} size="small" style={{ marginTop: 6 }} />
            )}
          </Col>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">3. ¿Tiene usted la intención de ingresar con el ánimo de cometer o facilitar actos ilícitos?</Text>
            <Radio.Group value={form.intencion_ilicitos} onChange={e => handleChange('intencion_ilicitos', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">4. ¿Se ha puesto de acuerdo con terceros para cometer actos ilícitos dentro de esta organización?</Text>
            <Radio.Group value={form.acuerdo_ilicitos} onChange={e => handleChange('acuerdo_ilicitos', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
          <Col span={24}>
            <Text className="block mb-1 text-sm font-medium">5. ¿Ha recibido instrucciones de personas o bandas para causar daño o delito a esta empresa?</Text>
            <Radio.Group value={form.instrucciones_dano} onChange={e => handleChange('instrucciones_dano', e.target.value)} size="small">
              <Radio value={true}>Sí</Radio><Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* SECCIÓN 2: TATUAJES */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8c8c8c' }}>Identificación Visual — Tatuajes</Text>}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text style={{ fontSize: 13, fontWeight: 500, display: 'block', marginBottom: 8 }}>
              ¿Tiene usted tatuajes en alguna parte de su cuerpo?
            </Text>
            <Radio.Group
              value={form.tiene_tatuajes}
              onChange={e => handleChange('tiene_tatuajes', e.target.value)}
              size="small"
            >
              <Radio value={true}>Sí</Radio>
              <Radio value={false}>No</Radio>
            </Radio.Group>
          </Col>

          {form.tiene_tatuajes && (
            <Col span={24}>
              <Divider orientation="left" style={{ color: '#8c8c8c', fontSize: 12, marginTop: 4 }}>
                Registro de tatuajes
              </Divider>

              {tatuajes.length === 0 && (
                <div style={{
                  textAlign: 'center', padding: '18px 0',
                  background: '#fafafa', // Cambiado a tema claro
                  border: '1px dashed #d9d9d9', // Cambiado a tema claro
                  borderRadius: 8, marginBottom: 12,
                }}>
                  <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
                    No hay tatuajes registrados. Use el botón para agregar.
                  </Text>
                </div>
              )}

              {tatuajes.map((tat, idx) => (
                <div
                  key={tat.key}
                  style={{
                    background: '#ffffff', // Cambiado a tema claro
                    border: '1px solid #f0f0f0', // Cambiado a tema claro
                    borderRadius: 10,
                    padding: 16,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Text style={{ color: '#1677ff', fontWeight: 600, fontSize: 13 }}> {/* Azul estándar de AntD */}
                      Tatuaje #{idx + 1}
                      {tat.id && <span style={{ fontSize: 10, color: '#8c8c8c', fontWeight: 400, marginLeft: 8 }}>(guardado)</span>}
                    </Text>
                    <Popconfirm
                      title="¿Eliminar este tatuaje?"
                      description="La eliminación se aplicará al guardar."
                      onConfirm={() => removeTatuaje(tat)}
                      okText="Eliminar"
                      okButtonProps={{ danger: true }}
                      cancelText="Cancelar"
                    >
                      <Button danger size="small" icon={<DeleteOutlined />} type="text" />
                    </Popconfirm>
                  </div>

                  <Row gutter={[16, 12]} align="top">
                    {/* Foto del tatuaje */}
                    <Col xs={24} md={8}>
                      <Text style={{ color: '#8c8c8c', fontSize: 12, display: 'block', marginBottom: 8 }}>
                        Fotografía del tatuaje:
                      </Text>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
                        {(tat.previewUrl || tat.fotografia) ? (
                          <img
                            src={tat.previewUrl || `${API_URL}${tat.fotografia}`}
                            alt={`Tatuaje ${idx + 1}`}
                            style={{
                              width: 130, height: 130,
                              objectFit: 'cover',
                              borderRadius: 8,
                              border: '1px solid #d9d9d9', // Borde más sutil
                            }}
                          />
                        ) : (
                          <div style={{
                            width: 130, height: 130,
                            background: '#fafafa', // Fondo claro
                            borderRadius: 8,
                            border: '1px dashed #d9d9d9', // Borde punteado claro
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Text style={{ color: '#8c8c8c', fontSize: 11 }}>Sin foto</Text>
                          </div>
                        )}
                        <Upload
                          maxCount={1}
                          showUploadList={false}
                          beforeUpload={(file) => {
                            const preview = URL.createObjectURL(file);
                            updateTatuaje(tat.key, 'newFile', file);
                            updateTatuaje(tat.key, 'previewUrl', preview);
                            return false;
                          }}
                          accept="image/jpeg,image/png,image/webp"
                        >
                          {/* Se quitan los estilos en línea forzados */}
                          <Button size="small" icon={<UploadOutlined />}>
                            {(tat.fotografia || tat.previewUrl) ? 'Cambiar foto' : 'Subir foto'}
                          </Button>
                        </Upload>
                      </div>
                    </Col>

                    {/* Descripción */}
                    <Col xs={24} md={16}>
                      <Text style={{ color: '#8c8c8c', fontSize: 12, display: 'block', marginBottom: 6 }}>
                        Descripción y ubicación del tatuaje:
                      </Text>
                      <TextArea
                        rows={6}
                        placeholder="Describa el diseño, colores y ubicación en el cuerpo (ej: antebrazo derecho, nuca, espalda baja, etc.)..."
                        value={tat.descripcion}
                        onChange={e => updateTatuaje(tat.key, 'descripcion', e.target.value)}
                        style={{ resize: 'vertical' }}
                      />
                    </Col>
                  </Row>
                </div>
              ))}

              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={addTatuaje}
                style={{ width: '100%', marginTop: 8 }}
              >
                Agregar tatuaje
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {/* SECCIÓN 3: NIVEL DE RIESGO */}
      <Card size="small" title={<Text style={{ fontSize: 13, color: '#8c8c8c' }}>Dictamen de Seguridad e Infiltración</Text>}>
        <Row gutter={[16, 16]} align="middle">
          <Col span={24} md={10}>
            <Text style={{ fontWeight: 500, display: 'block', marginBottom: 4 }}>Nivel de Riesgo Evaluado:</Text>
            <Text style={{ color: '#8c8c8c', fontSize: 12 }}>
              Defina el nivel de criticidad tras contrastar las declaraciones y el lenguaje corporal.
            </Text>
          </Col>
          <Col span={24} md={14}>
            <Radio.Group
              value={form.nivel_riesgo}
              onChange={e => handleChange('nivel_riesgo', e.target.value)}
              buttonStyle="solid"
              size="large"
            >
              <Radio.Button value="BAJO"  style={getRiesgoStyle('BAJO')}  className="w-1/3 md:w-32">BAJO</Radio.Button>
              <Radio.Button value="MEDIO" style={getRiesgoStyle('MEDIO')} className="w-1/3 md:w-32">MEDIO</Radio.Button>
              <Radio.Button value="ALTO"  style={getRiesgoStyle('ALTO')}  className="w-1/3 md:w-32">ALTO</Radio.Button>
            </Radio.Group>
          </Col>
        </Row>
      </Card>

      {/* OBSERVACIONES */}
      <Card size="small">
        <Text style={{ display: 'block', marginBottom: 6, fontSize: 11, color: '#8c8c8c', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          Observaciones y Notas Técnicas del Evaluador
        </Text>
        <TextArea
          rows={3}
          placeholder="Añada justificaciones sobre el nivel de riesgo y las reacciones del candidato..."
          value={form.observaciones}
          onChange={e => handleChange('observaciones', e.target.value)}
        />
      </Card>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={handleSave}
          className="action-btn-primary"
          style={{ height: 40, fontWeight: 600, minWidth: 160 }}
        >
          Guardar Infiltración
        </Button>
      </div>
    </div>
  );
}